/* eslint-disable @typescript-eslint/no-explicit-any -- Required for JSON fields in Prisma */
import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { rulesEngineService } from '../rules/rules-engine.service';
import type {
  CalculationBlockDefinition,
  CalculationCategory,
  CalculationInput,
  CalculationOutput,
  CalculationRequest,
  CalculationResponse,
} from '../types';
import { safeFormulaEvaluator } from './safe-formula-evaluator';

export class CalculationsService {
  /**
   * Create calculation block
   */
  async createBlock(data: {
    code: string;
    category: CalculationCategory;
    name: string;
    description: string;
    purpose?: string;
    inputSchema: CalculationInput[];
    outputSchema: CalculationOutput[];
    formulae: Record<string, string>;
    algorithm?: string;
    validationRules?: any;
    productClassId?: string;
    units?: Record<string, string>;
    references?: any;
    accuracy?: string;
  }) {
    // Check code uniqueness
    const existing = await prisma.calculationBlock.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Block with code ${data.code} already exists`);
    }

    // Validate formulae
    for (const [name, formula] of Object.entries(data.formulae)) {
      const validation = safeFormulaEvaluator.validate(formula);
      if (!validation.valid) {
        throw new Error(`Invalid formula "${name}": ${validation.error}`);
      }
    }

    return prisma.calculationBlock.create({
      data: {
        code: data.code,
        category: data.category,
        name: data.name,
        description: data.description,
        purpose: data.purpose,
        inputSchema: data.inputSchema as any,
        outputSchema: data.outputSchema as any,
        formulae: data.formulae as any,
        algorithm: data.algorithm,
        validationRules: data.validationRules,
        productClassId: data.productClassId,
        units: data.units,
        references: data.references,
        accuracy: data.accuracy,
        active: true,
        version: '1.0',
      },
    });
  }

  /**
   * Validate input data
   */
  private validateInputs(
    schema: CalculationInput[],
    inputs: Record<string, any>
  ): {
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
    }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    for (const input of schema) {
      const value = inputs[input.name];

      // Required check
      if (input.required && value === undefined) {
        errors.push({
          field: input.name,
          message: 'Required field',
        });
        continue;
      }

      if (value === undefined) continue;

      // Type check
      if (input.type === 'number') {
        if (typeof value !== 'number' || !isFinite(value)) {
          errors.push({
            field: input.name,
            message: 'Must be a number',
          });
          continue;
        }

        // Min/Max
        if (input.min !== undefined && value < input.min) {
          errors.push({
            field: input.name,
            message: `Minimum: ${input.min}`,
          });
        }

        if (input.max !== undefined && value > input.max) {
          errors.push({
            field: input.name,
            message: `Maximum: ${input.max}`,
          });
        }
      }

      // Validation pattern
      if (input.validation?.pattern && input.type === 'string') {
        const regex = new RegExp(input.validation.pattern);
        if (!regex.test(String(value))) {
          errors.push({
            field: input.name,
            message: 'Invalid format',
          });
        }
      }

      // Enum
      if (input.validation?.enum) {
        if (!input.validation.enum.includes(value)) {
          errors.push({
            field: input.name,
            message: `Allowed values: ${input.validation.enum.join(', ')}`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute calculation
   */
  async execute(request: CalculationRequest): Promise<CalculationResponse> {
    const { projectId, blockCode, inputs, executedBy } = request;

    // Load block
    const block = await prisma.calculationBlock.findUnique({
      where: { code: blockCode },
    });

    if (!block) {
      throw new Error(`Block ${blockCode} not found`);
    }

    if (!block.active) {
      throw new Error(`Block ${blockCode} is inactive`);
    }

    const startTime = Date.now();

    // Validate inputs
    const inputSchema = block.inputSchema as unknown as CalculationInput[];
    const validation = this.validateInputs(inputSchema, inputs);

    if (!validation.valid) {
      // Create record with error
      await prisma.calculation.create({
        data: {
          blockId: block.id,
          projectId,
          inputs: inputs as unknown as Prisma.InputJsonValue,
          outputs: undefined,
          status: 'FAILED',
          errors: validation.errors as unknown as Prisma.InputJsonValue,
          executedById: executedBy,
        },
      });

      return {
        id: '',
        blockCode,
        status: 'FAILED',
        inputs,
        errors: validation.errors,
        validated: false,
        createdAt: new Date(),
      };
    }

    // Execute calculation
    let outputs: Record<string, any>;
    const calcErrors: any[] = [];
    const calcWarnings: any[] = [];
    let status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS';

    try {
      const formulae = block.formulae as Record<string, string>;
      outputs = safeFormulaEvaluator.evaluateMultiple(formulae, inputs as Record<string, number>);
    } catch (error: any) {
      calcErrors.push({
        message: error.message,
        code: 'FORMULA_ERROR',
      });
      status = 'FAILED';
      outputs = {};
    }

    // Validate results via Rules Engine
    let validationResults: any = null;
    let validated = false;

    if (status === 'SUCCESS') {
      try {
        const ruleViolations = await rulesEngineService.evaluateRules({
          projectId,
          params: { ...inputs, ...outputs },
          scope: 'CALCULATION',
        });

        if (ruleViolations.length > 0) {
          validationResults = {
            passed: !ruleViolations.some((v) => v.blocksProgress),
            violations: ruleViolations,
          };

          // If there are blockers - WARNING
          if (ruleViolations.some((v) => v.blocksProgress)) {
            status = 'WARNING';
            calcWarnings.push({
              message: 'Results violate rules',
              code: 'RULE_VIOLATION',
            });
          }
        }

        validated = true;
      } catch (error: any) {
        calcWarnings.push({
          message: `Validation error: ${error.message}`,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const executionTime = Date.now() - startTime;

    // Save result
    const calculation = await prisma.calculation.create({
      data: {
        blockId: block.id,
        projectId,
        inputs: inputs as unknown as Prisma.JsonObject,
        outputs: status === 'SUCCESS' ? (outputs as unknown as Prisma.JsonObject) : undefined,
        status,
        errors: calcErrors.length > 0 ? (calcErrors as unknown as Prisma.JsonObject) : undefined,
        warnings:
          calcWarnings.length > 0 ? (calcWarnings as unknown as Prisma.JsonObject) : undefined,
        validated,
        validationResults: validationResults as unknown as Prisma.JsonObject,
        executionTime,
        executedById: executedBy,
        completedAt: new Date(),
      },
    });

    return {
      id: calculation.id,
      blockCode,
      status,
      inputs,
      outputs: status === 'SUCCESS' ? outputs : undefined,
      errors: calcErrors.length > 0 ? calcErrors : undefined,
      warnings: calcWarnings.length > 0 ? calcWarnings : undefined,
      validated,
      validationResults,
      executionTime,
      createdAt: calculation.createdAt,
      completedAt: calculation.completedAt || undefined,
    };
  }

  /**
   * Get project calculations history
   */
  async getProjectCalculations(
    projectId: string,
    filters?: {
      blockCode?: string;
      status?: 'SUCCESS' | 'FAILED' | 'WARNING';
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { projectId };

    if (filters?.blockCode) {
      where.block = {
        code: filters.blockCode,
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [calculations, total] = await Promise.all([
      prisma.calculation.findMany({
        where,
        include: {
          block: {
            select: {
              code: true,
              name: true,
              category: true,
            },
          },
          executedBy: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.calculation.count({ where }),
    ]);

    return {
      calculations,
      total,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      pageSize: filters?.limit || 50,
    };
  }

  /**
   * Get all blocks
   */
  async getBlocks(filters?: {
    category?: CalculationCategory;
    active?: boolean;
    productClassId?: string;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.productClassId) {
      where.OR = [{ productClassId: filters.productClassId }, { productClassId: null }];
    }

    return prisma.calculationBlock.findMany({
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
            calculations: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Get block by ID
   */
  async getBlock(id: string) {
    const block = await prisma.calculationBlock.findUnique({
      where: { id },
      include: {
        productClass: true,
        calculations: {
          include: {
            project: {
              select: {
                code: true,
                name: true,
              },
            },
            executedBy: {
              select: {
                fullName: true,
              },
            },
          },
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    return block;
  }

  /**
   * Update block
   */
  async updateBlock(id: string, data: Partial<CalculationBlockDefinition>) {
    // Validate formulae if updated
    if (data.formulae) {
      for (const [name, formula] of Object.entries(data.formulae)) {
        const validation = safeFormulaEvaluator.validate(formula);
        if (!validation.valid) {
          throw new Error(`Invalid formula "${name}": ${validation.error}`);
        }
      }
    }

    return prisma.calculationBlock.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        purpose: data.purpose,
        inputSchema: data.inputSchema as any,
        outputSchema: data.outputSchema as any,
        formulae: data.formulae as any,
        algorithm: data.algorithm,
        validationRules: data.validationRules as any,
        units: data.units,
        references: data.references,
        accuracy: data.accuracy,
        active: data.active,
      },
    });
  }

  /**
   * Calculation statistics
   */
  async getCalculationStats(filters?: { projectId?: string; productClassId?: string }) {
    const where: any = {};

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    const [total, byStatus, byCategory, avgExecutionTime] = await Promise.all([
      prisma.calculation.count({ where }),

      prisma.calculation.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.calculationBlock.findMany({
        where: {
          calculations: {
            some: where,
          },
        },
        select: {
          category: true,
          _count: {
            select: {
              calculations: true,
            },
          },
        },
      }),

      prisma.calculation.aggregate({
        where: {
          ...where,
          executionTime: { not: null },
        },
        _avg: {
          executionTime: true,
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byCategory: byCategory.reduce((acc, b) => {
        const existing = acc.find((a) => a.category === b.category);
        if (existing) {
          existing.count += b._count.calculations;
        } else {
          acc.push({
            category: b.category,
            count: b._count.calculations,
          });
        }
        return acc;
      }, [] as any[]),
      avgExecutionTime: avgExecutionTime._avg.executionTime || 0,
    };
  }
}

export const calculationsService = new CalculationsService();
