import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import type {
  RiskLevel,
  RuleCategory,
  RuleCondition,
  RuleEvaluationContext,
  RuleEvaluationResult,
} from '../types';

export class RulesEngineService {
  /**
   * Оценка одного условия
   */
  private evaluateCondition(condition: RuleCondition, params: Record<string, unknown>): boolean {
    // Если это сравнение
    if (condition.comparison) {
      const { field, operator, value } = condition.comparison;
      const fieldValue = params[field];

      if (fieldValue === undefined) {
        return false;
      }

      switch (operator) {
        case '>':
          return Number(fieldValue) > Number(value);
        case '<':
          return Number(fieldValue) < Number(value);
        case '>=':
          return Number(fieldValue) >= Number(value);
        case '<=':
          return Number(fieldValue) <= Number(value);
        case '==':
          return fieldValue === value;
        case '!=':
          return fieldValue !== value;
        case 'IN':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'NOT_IN':
          return Array.isArray(value) && !value.includes(fieldValue);
        default:
          return false;
      }
    }

    // Если это логическая операция
    if (condition.conditions && condition.conditions.length > 0) {
      const results = condition.conditions.map((c) => this.evaluateCondition(c, params));

      switch (condition.operator) {
        case 'AND':
          return results.every((r) => r);
        case 'OR':
          return results.some((r) => r);
        case 'NOT':
          return !results[0];
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Проверка правил для контекста
   */
  async evaluateRules(context: RuleEvaluationContext): Promise<RuleEvaluationResult[]> {
    const { projectId, params, productClassId, scope } = context;

    // Загружаем активные правила
    const where: Prisma.EngineeringRuleWhereInput = {
      active: true,
    };

    if (productClassId) {
      where.OR = [{ productClassId }, { productClassId: null }];
    }

    if (scope) {
      where.scope = scope;
    }

    const rules = await prisma.engineeringRule.findMany({
      where,
      orderBy: {
        riskLevel: 'desc',
      },
    });

    const results: RuleEvaluationResult[] = [];

    for (const rule of rules) {
      const condition = rule.condition as unknown as RuleCondition;

      let triggered = false;
      try {
        triggered = this.evaluateCondition(condition, params);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.code}:`, error);
        continue;
      }

      if (triggered) {
        // Логируем нарушение
        await prisma.ruleViolation.create({
          data: {
            ruleId: rule.id,
            projectId,
            context: { scope, productClassId } as unknown as Prisma.JsonObject,
            params: params as unknown as Prisma.JsonObject,
            triggered: true,
            severity: rule.riskLevel,
            status: 'OPEN',
          },
        });

        results.push({
          ruleId: rule.id,
          ruleCode: rule.code,
          category: rule.category as RuleCategory,
          triggered: true,
          severity: rule.riskLevel as RiskLevel,
          message: rule.message,
          recommendation: rule.recommendation || undefined,
          blocksProgress: rule.action === 'BLOCK',
          context: {
            params,
            evaluatedAt: new Date(),
          },
        });
      }
    }

    return results;
  }

  /**
   * Быстрая проверка - блокирует ли что-то прогресс
   */
  async checkBlockers(projectId: string): Promise<{
    blocked: boolean;
    blockers: string[];
    warnings: string[];
  }> {
    const violations = await prisma.ruleViolation.findMany({
      where: {
        projectId,
        status: 'OPEN',
        triggered: true,
      },
      include: {
        rule: true,
      },
    });

    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const violation of violations) {
      if (violation.rule.action === 'BLOCK') {
        blockers.push(violation.rule.message);
      } else if (violation.rule.action === 'WARN') {
        warnings.push(violation.rule.message);
      }
    }

    return {
      blocked: blockers.length > 0,
      blockers,
      warnings,
    };
  }

  /**
   * Получить все нарушения проекта
   */
  async getProjectViolations(
    projectId: string,
    filters?: {
      status?: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'WAIVED';
      severity?: RiskLevel;
      category?: RuleCategory;
    }
  ) {
    const where: Prisma.RuleViolationWhereInput = {
      projectId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    const violations = await prisma.ruleViolation.findMany({
      where,
      include: {
        rule: true,
        acknowledgedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        waivedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });

    // Фильтр по категории (через rule)
    if (filters?.category) {
      return violations.filter((v) => v.rule.category === filters.category);
    }

    return violations;
  }

  /**
   * Подтвердить нарушение (acknowledge)
   */
  async acknowledgeViolation(violationId: string, userId: string) {
    return prisma.ruleViolation.update({
      where: { id: violationId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }

  /**
   * Разрешить нарушение (resolve)
   */
  async resolveViolation(violationId: string, userId: string, resolution: string) {
    return prisma.ruleViolation.update({
      where: { id: violationId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: userId,
        resolution,
      },
    });
  }

  /**
   * Отменить нарушение (waive с обоснованием)
   */
  async waiveViolation(violationId: string, userId: string, reason: string) {
    // Проверяем права (только Admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (user?.role?.name !== 'Admin') {
      throw new Error('Только Admin может отменять нарушения');
    }

    return prisma.ruleViolation.update({
      where: { id: violationId },
      data: {
        status: 'WAIVED',
        waived: true,
        waiverReason: reason,
        waivedById: userId,
      },
    });
  }

  /**
   * Статистика нарушений
   */
  async getViolationStats(filters?: { projectId?: string }) {
    const where: Prisma.RuleViolationWhereInput = {};

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    const [total, byStatus, bySeverity, byCategory] = await Promise.all([
      prisma.ruleViolation.count({ where }),

      prisma.ruleViolation.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.ruleViolation.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),

      prisma.engineeringRule.findMany({
        where: {
          violations: {
            some: where,
          },
        },
        select: {
          category: true,
          _count: {
            select: {
              violations: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      bySeverity: bySeverity.map((s) => ({
        severity: s.severity,
        count: s._count,
      })),
      byCategory: byCategory.reduce((acc: { category: string; count: number }[], r) => {
        const existing = acc.find((a) => a.category === r.category);
        if (existing) {
          existing.count += r._count.violations;
        } else {
          acc.push({
            category: r.category,
            count: r._count.violations,
          });
        }
        return acc;
      }, []),
    };
  }

  /**
   * Создать новое правило
   */
  async createRule(data: {
    code: string;
    category: RuleCategory;
    name: string;
    description: string;
    rationale?: string;
    condition: RuleCondition;
    parameters?: Record<string, unknown>;
    riskLevel: RiskLevel;
    action: 'WARN' | 'BLOCK' | 'LOG' | 'NOTIFY';
    message: string;
    recommendation?: string;
    productClassId?: string;
    scope?: string;
    tags?: string[];
    references?: Record<string, unknown>;
  }) {
    // Проверяем уникальность кода
    const existing = await prisma.engineeringRule.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Правило с кодом ${data.code} уже существует`);
    }

    return prisma.engineeringRule.create({
      data: {
        code: data.code,
        category: data.category,
        name: data.name,
        description: data.description,
        rationale: data.rationale,
        condition: data.condition as unknown as Prisma.JsonObject,
        parameters: data.parameters as unknown as Prisma.JsonObject,
        riskLevel: data.riskLevel,
        action: data.action,
        message: data.message,
        recommendation: data.recommendation,
        productClassId: data.productClassId,
        scope: data.scope || 'PROJECT',
        active: true,
        version: '1.0',
        tags: data.tags || [],
        references: data.references as unknown as Prisma.JsonObject,
      },
    });
  }

  /**
   * Получить все правила
   */
  async getRules(filters?: { category?: RuleCategory; active?: boolean; productClassId?: string }) {
    const where: Prisma.EngineeringRuleWhereInput = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.productClassId) {
      where.OR = [{ productClassId: filters.productClassId }, { productClassId: null }];
    }

    return prisma.engineeringRule.findMany({
      where,
      include: {
        productClass: {
          select: {
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            violations: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Получить правило по ID
   */
  async getRule(id: string) {
    const rule = await prisma.engineeringRule.findUnique({
      where: { id },
      include: {
        productClass: true,
        violations: {
          include: {
            project: {
              select: {
                code: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!rule) {
      throw new Error('Правило не найдено');
    }

    return rule;
  }

  /**
   * Обновить правило
   */
  async updateRule(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      condition: RuleCondition;
      riskLevel: RiskLevel;
      action: string;
      message: string;
      recommendation: string;
      active: boolean;
    }>
  ) {
    return prisma.engineeringRule.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        condition: data.condition as unknown as Prisma.JsonObject,
        riskLevel: data.riskLevel,
        action: data.action as 'WARN' | 'BLOCK' | 'LOG' | 'NOTIFY',
        message: data.message,
        recommendation: data.recommendation,
        active: data.active,
      },
    });
  }

  /**
   * Деактивировать правило
   */
  async deactivateRule(id: string) {
    return prisma.engineeringRule.update({
      where: { id },
      data: { active: false },
    });
  }
}

export const rulesEngineService = new RulesEngineService();
