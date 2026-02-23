/**
 * Templates Service
 * Business logic for project templates management
 */

import { NotFoundError } from '../../errors';
import { prisma } from '../../lib/prisma';

interface CreateTemplateData {
  name: string;
  description?: string;
  defaultStage?: string;
  estimatedBudget?: number;
  estimatedDays?: number;
  teamSize?: number;
  checklist?: string[];
  createdById: string;
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  defaultStage?: string;
  estimatedBudget?: number;
  estimatedDays?: number;
  teamSize?: number;
  checklist?: string[];
}

interface TemplateWithCreator {
  id: string;
  name: string;
  description: string | null;
  defaultStage: string;
  estimatedBudget: number | null;
  estimatedDays: number | null;
  teamSize: number | null;
  checklist: string[] | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    fullName: string;
    username: string;
  };
}

export class TemplatesService {
  /**
   * Create a new project template
   */
  async create(data: CreateTemplateData): Promise<TemplateWithCreator> {
    return prisma.projectTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        defaultStage: data.defaultStage || 'IDEA',
        estimatedBudget: data.estimatedBudget,
        estimatedDays: data.estimatedDays,
        teamSize: data.teamSize,
        checklist: data.checklist || [],
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    }) as Promise<TemplateWithCreator>;
  }

  /**
   * Get all project templates
   */
  async getAll(): Promise<TemplateWithCreator[]> {
    return prisma.projectTemplate.findMany({
      include: {
        createdBy: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<TemplateWithCreator[]>;
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<TemplateWithCreator | null> {
    return prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    }) as Promise<TemplateWithCreator | null>;
  }

  /**
   * Update a project template
   */
  async update(id: string, data: UpdateTemplateData): Promise<TemplateWithCreator> {
    try {
      return (await prisma.projectTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          defaultStage: data.defaultStage,
          estimatedBudget: data.estimatedBudget,
          estimatedDays: data.estimatedDays,
          teamSize: data.teamSize,
          checklist: data.checklist,
        },
      })) as TemplateWithCreator;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Template not found');
      }
      throw error;
    }
  }

  /**
   * Delete a project template
   */
  async delete(id: string): Promise<TemplateWithCreator> {
    try {
      return (await prisma.projectTemplate.delete({
        where: { id },
      })) as TemplateWithCreator;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Template not found');
      }
      throw error;
    }
  }
}

// Singleton instance
export const templatesService = new TemplatesService();
