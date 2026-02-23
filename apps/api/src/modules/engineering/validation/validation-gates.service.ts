import { prisma } from '../../../lib/prisma';
import { rulesEngineService } from '../rules/rules-engine.service';
import type {
  GateCriterion,
  GateDefinition,
  GateValidationRequest,
  GateValidationResponse,
  ProjectGatesStatus,
} from '../types';

export class ValidationGatesService {
  /**
   * Создать Gate
   */
  async createGate(data: {
    code: string;
    name: string;
    description: string;
    order: number;
    phase: 'PLANNING' | 'DESIGN' | 'VALIDATION' | 'RELEASE';
    criteria: GateCriterion[];
    passingScore?: number;
    productClassId?: string;
    blockOnFail?: boolean;
    allowWaiver?: boolean;
    requiresApproval?: boolean;
  }) {
    // Проверяем уникальность кода
    const existing = await prisma.validationGate.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Gate с кодом ${data.code} уже существует`);
    }

    return prisma.validationGate.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        order: data.order,
        phase: data.phase,
        criteria: data.criteria as unknown as object,
        passingScore: data.passingScore ?? 0.8,
        productClassId: data.productClassId,
        blockOnFail: data.blockOnFail ?? true,
        allowWaiver: data.allowWaiver ?? false,
        requiresApproval: data.requiresApproval ?? false,
        active: true,
      },
    });
  }

  /**
   * Оценить один критерий
   */
  private async evaluateCriterion(
    criterion: GateCriterion,
    projectId: string
  ): Promise<{
    passed: boolean;
    score: number;
    details?: unknown;
    message?: string;
  }> {
    switch (criterion.type) {
      case 'RULE_CHECK': {
        // Проверка правил через Rules Engine
        const ruleCheck = await rulesEngineService.checkBlockers(projectId);

        const passed = !ruleCheck.blocked;

        return {
          passed,
          score: passed ? 1.0 : 0.0,
          details: {
            blockers: ruleCheck.blockers,
            warnings: ruleCheck.warnings,
          },
          message: passed
            ? 'Все правила соблюдены'
            : `Нарушено правил: ${ruleCheck.blockers.length}`,
        };
      }

      case 'CALCULATION_COMPLETE': {
        // Проверка наличия расчётов
        const calculationsCount = await prisma.calculation.count({
          where: {
            projectId,
            status: 'SUCCESS',
          },
        });

        const requiredCount = (criterion.config as { requiredCount?: number })?.requiredCount || 1;

        const calcPassed = calculationsCount >= requiredCount;

        return {
          passed: calcPassed,
          score: calcPassed ? 1.0 : Math.min(calculationsCount / requiredCount, 1.0),
          details: {
            completed: calculationsCount,
            required: requiredCount,
          },
          message: calcPassed
            ? `Расчёты выполнены (${calculationsCount})`
            : `Недостаточно расчётов: ${calculationsCount}/${requiredCount}`,
        };
      }

      case 'DOCUMENT_EXISTS': {
        // Проверка наличия документов
        const documentsCount = await prisma.attachment.count({
          where: { projectId },
        });

        const requiredDocs = (criterion.config as { requiredCount?: number })?.requiredCount || 1;

        const docsPassed = documentsCount >= requiredDocs;

        return {
          passed: docsPassed,
          score: docsPassed ? 1.0 : Math.min(documentsCount / requiredDocs, 1.0),
          details: {
            uploaded: documentsCount,
            required: requiredDocs,
          },
          message: docsPassed
            ? `Документы загружены (${documentsCount})`
            : `Недостаточно документов: ${documentsCount}/${requiredDocs}`,
        };
      }

      case 'CUSTOM':
        // Custom проверка (можно расширить)
        // По умолчанию считаем пройденным
        return {
          passed: true,
          score: 1.0,
          message: 'Custom check (not implemented)',
        };

      default:
        return {
          passed: false,
          score: 0.0,
          message: `Неизвестный тип критерия: ${criterion.type}`,
        };
    }
  }

  /**
   * Валидация Gate для проекта
   */
  async validateGate(request: GateValidationRequest): Promise<GateValidationResponse> {
    const { projectId, gateCode, validatedBy, force } = request;

    // Загружаем Gate
    const gate = await prisma.validationGate.findUnique({
      where: { code: gateCode },
    });

    if (!gate) {
      throw new Error(`Gate ${gateCode} не найден`);
    }

    if (!gate.active) {
      throw new Error(`Gate ${gateCode} неактивен`);
    }

    const criteria = gate.criteria as unknown as GateCriterion[];
    const results = [];
    let totalScore = 0;
    let totalWeight = 0;
    const blockers: string[] = [];

    // Оцениваем каждый критерий
    for (const criterion of criteria) {
      const result = await this.evaluateCriterion(criterion, projectId);

      results.push({
        criterionId: criterion.id,
        type: criterion.type,
        passed: result.passed,
        score: result.score,
        details: result.details,
        message: result.message,
      });

      // Взвешенная оценка
      const weightedScore = result.score * criterion.weight;
      totalScore += weightedScore;
      totalWeight += criterion.weight;

      // Blockers (обязательные критерии)
      if (!result.passed && criterion.required) {
        blockers.push(`${criterion.description}: ${result.message || 'не пройден'}`);
      }
    }

    // Финальная оценка
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const gatePassed = finalScore >= gate.passingScore && blockers.length === 0;

    // Сохраняем результат валидации
    await prisma.gateValidation.create({
      data: {
        gateId: gate.id,
        projectId,
        passed: gatePassed || force === true,
        score: finalScore,
        results: results as unknown as object,
        blockers: blockers.length > 0 ? blockers : undefined,
        waived: force === true && !gatePassed,
        waiverReason: force === true && !gatePassed ? 'Принудительное прохождение' : undefined,
        validatedById: validatedBy,
      },
    });

    return {
      gateCode: gate.code,
      passed: gatePassed || force === true,
      score: finalScore,
      results,
      blockers: blockers.length > 0 ? blockers : undefined,
      warnings: results
        .filter((r) => !r.passed && r.message)
        .map((r) => r.message!)
        .filter(Boolean),
      waived: force === true && !gatePassed,
      waiverReason: force === true && !gatePassed ? 'Принудительное прохождение' : undefined,
      validatedAt: new Date(),
      validatedBy,
    };
  }

  /**
   * Получить статус всех Gates для проекта
   */
  async getProjectGatesStatus(projectId: string): Promise<ProjectGatesStatus> {
    // Загружаем проект с Product Class
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        productClassId: true,
        stage: true,
      },
    });

    if (!project) {
      throw new Error('Проект не найден');
    }

    // Загружаем активные Gates
    const where: { active: boolean; OR?: { productClassId: string | null }[] } = {
      active: true,
    };

    if (project.productClassId) {
      where.OR = [{ productClassId: project.productClassId }, { productClassId: null }];
    }

    const gates = await prisma.validationGate.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    // Загружаем последние валидации
    const validations = await prisma.gateValidation.findMany({
      where: { projectId },
      orderBy: { validatedAt: 'desc' },
    });

    // Собираем статус каждого Gate
    const gatesStatus = await Promise.all(
      gates.map(async (gate) => {
        const latestValidation = validations.find((v) => v.gateId === gate.id);

        // Определяем статус
        let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'WAIVED';

        if (!latestValidation) {
          status = 'NOT_STARTED';
        } else if (latestValidation.waived) {
          status = 'WAIVED';
        } else if (latestValidation.passed) {
          status = 'PASSED';
        } else {
          status = 'FAILED';
        }

        // Можно ли validate сейчас
        let canValidate = true;
        const blockers: string[] = [];

        // Проверяем предыдущие gates
        const previousGates = gates.filter((g) => g.order < gate.order);

        for (const prevGate of previousGates) {
          const prevValidation = validations.find((v) => v.gateId === prevGate.id);

          if (!prevValidation || (!prevValidation.passed && !prevValidation.waived)) {
            canValidate = false;
            blockers.push(`Не пройден Gate: ${prevGate.name}`);
          }
        }

        return {
          code: gate.code,
          name: gate.name,
          order: gate.order,
          phase: gate.phase,
          status,
          latestValidation: latestValidation
            ? {
                passed: latestValidation.passed,
                score: Number(latestValidation.score),
                validatedAt: latestValidation.validatedAt,
              }
            : undefined,
          canValidate,
          blockers: blockers.length > 0 ? blockers : undefined,
        };
      })
    );

    // Текущий Gate (первый не пройденный)
    const currentGateObj = gatesStatus.find(
      (g) => g.status === 'NOT_STARTED' || g.status === 'FAILED'
    );

    // Общий прогресс
    const passedGates = gatesStatus.filter(
      (g) => g.status === 'PASSED' || g.status === 'WAIVED'
    ).length;

    const overallProgress = gates.length > 0 ? Math.round((passedGates / gates.length) * 100) : 0;

    return {
      projectId,
      gates: gatesStatus,
      currentGate: currentGateObj?.code,
      overallProgress,
    };
  }

  /**
   * Получить все Gates
   */
  async getGates(filters?: { active?: boolean; phase?: string; productClassId?: string }) {
    const where: { active?: boolean; phase?: string; OR?: { productClassId: string | null }[] } =
      {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.phase) {
      where.phase = filters.phase;
    }

    if (filters?.productClassId) {
      where.OR = [{ productClassId: filters.productClassId }, { productClassId: null }];
    }

    return prisma.validationGate.findMany({
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
            validations: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * Получить Gate по ID
   */
  async getGate(id: string) {
    const gate = await prisma.validationGate.findUnique({
      where: { id },
      include: {
        productClass: true,
        validations: {
          include: {
            project: {
              select: {
                code: true,
                name: true,
              },
            },
            validatedBy: {
              select: {
                fullName: true,
              },
            },
          },
          take: 20,
          orderBy: {
            validatedAt: 'desc',
          },
        },
      },
    });

    if (!gate) {
      throw new Error('Gate не найден');
    }

    return gate;
  }

  /**
   * Обновить Gate
   */
  async updateGate(id: string, data: Partial<GateDefinition>) {
    return prisma.validationGate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        order: data.order,
        phase: data.phase,
        criteria: data.criteria as unknown as object,
        passingScore: data.passingScore,
        blockOnFail: data.blockOnFail,
        allowWaiver: data.allowWaiver,
        requiresApproval: data.requiresApproval,
        active: data.active,
      },
    });
  }

  /**
   * Waive Gate (отменить с обоснованием)
   */
  async waiveGate(validationId: string, userId: string, reason: string) {
    // Проверяем права (Admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (user?.role.name !== 'Admin') {
      throw new Error('Только Admin может отменять Gates');
    }

    return prisma.gateValidation.update({
      where: { id: validationId },
      data: {
        waived: true,
        waiverReason: reason,
        waivedById: userId,
      },
    });
  }

  /**
   * Статистика Gates
   */
  async getGatesStats(filters?: { projectId?: string; productClassId?: string }) {
    const where: { projectId?: string } = {};

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    const [totalValidations, passedCount, failedCount, waivedCount] = await Promise.all([
      prisma.gateValidation.count({ where }),

      prisma.gateValidation.count({
        where: { ...where, passed: true, waived: false },
      }),

      prisma.gateValidation.count({
        where: { ...where, passed: false, waived: false },
      }),

      prisma.gateValidation.count({
        where: { ...where, waived: true },
      }),
    ]);

    return {
      total: totalValidations,
      passed: passedCount,
      failed: failedCount,
      waived: waivedCount,
      passRate: totalValidations > 0 ? Math.round((passedCount / totalValidations) * 100) : 0,
    };
  }
}

export const validationGatesService = new ValidationGatesService();
