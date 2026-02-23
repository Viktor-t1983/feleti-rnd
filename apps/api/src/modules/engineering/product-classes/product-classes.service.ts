import { Prisma, ProductClass } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../errors';
import { prisma } from '../../../lib/prisma';
import type { CalculationBlockReference, RequirementTemplate } from '../types';

/**
 * ProductClassesService - Сервис для управления классами продуктов
 */
export class ProductClassesService {
  /**
   * Создать новый Product Class
   */
  async create(data: {
    code: string;
    name: string;
    description?: string;
    icon?: string;
    category: string;
    parentId?: string;
    typicalRequirements?: RequirementTemplate[];
    calculationBlockRefs?: CalculationBlockReference[];
  }): Promise<ProductClass> {
    const existing = await prisma.productClass.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError(`Product Class с кодом ${data.code} уже существует`);
    }

    if (data.parentId) {
      const parent = await prisma.productClass.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new NotFoundError('Parent Product Class не найден');
      }
    }

    return prisma.productClass.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        icon: data.icon,
        category: data.category,
        parentId: data.parentId,
        typicalRequirements: data.typicalRequirements as unknown as Prisma.InputJsonValue,
        calculationBlockRefs: data.calculationBlockRefs as unknown as Prisma.InputJsonValue,
        active: true,
        version: '1.0',
      },
    });
  }

  /**
   * Получить все Product Classes
   */
  async getAll(filters?: {
    category?: string;
    active?: boolean;
    parentId?: string | null;
  }): Promise<ProductClass[]> {
    return prisma.productClass.findMany({
      where: {
        category: filters?.category,
        active: filters?.active,
        parentId: filters?.parentId !== undefined ? filters.parentId : undefined,
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true } },
        _count: { select: { projects: true, knowledgeNodes: true, engineeringRules: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Получить Product Class по ID
   */
  async getById(id: string): Promise<ProductClass> {
    const productClass = await prisma.productClass.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            projects: true,
            knowledgeNodes: true,
            engineeringRules: true,
            validationGates: true,
            calculationBlocks: true,
          },
        },
      },
    });

    if (!productClass) {
      throw new NotFoundError('Product Class не найден');
    }

    return productClass;
  }

  /**
   * Обновить Product Class
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      category?: string;
      active?: boolean;
    }
  ): Promise<ProductClass> {
    const existing = await prisma.productClass.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError('Product Class не найден');
    }

    return prisma.productClass.update({
      where: { id },
      data,
    });
  }

  /**
   * Удалить (деактивировать) Product Class
   */
  async delete(id: string): Promise<ProductClass> {
    const existing = await prisma.productClass.findUnique({
      where: { id },
      include: { _count: { select: { projects: true, knowledgeNodes: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Product Class не найден');
    }

    if (existing._count.projects > 0) {
      throw new ConflictError('Нельзя удалить Product Class, связанный с проектами');
    }

    return prisma.productClass.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Получить иерархию Product Classes
   */
  async getHierarchy() {
    return prisma.productClass.findMany({
      where: { parentId: null, active: true },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { projects: true } },
          },
        },
        _count: { select: { projects: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Получить статистику по Product Classes
   */
  async getStats() {
    const [total, byCategory, byStatus] = await Promise.all([
      prisma.productClass.count(),
      prisma.productClass.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.productClass.groupBy({ by: ['active'], _count: { id: true } }),
    ]);

    return {
      total,
      byCategory: byCategory.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {}),
      byStatus: byStatus.reduce<Record<string, number>>((acc, item) => {
        acc[item.active ? 'active' : 'inactive'] = item._count.id;
        return acc;
      }, {}),
    };
  }
}

export const productClassesService = new ProductClassesService();
