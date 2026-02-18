/**
 * Projects Service
 * Business logic for project management
 */

import { Prisma, ProjectStatus } from '@prisma/client';

import { AuthorizationError, ConflictError, NotFoundError } from '../../errors';
import { logger } from '../../utils/logger';

import type {
  AddProjectMemberInput,
  CreateProjectInput,
  PaginatedProjects,
  ProjectDetail,
  ProjectFilters,
  ProjectListItem,
  ProjectMember,
  UpdateProjectInput,
} from './projects.types';

import { prisma } from '../../lib/prisma';
import { emailService } from '../email/email.service';

export class ProjectsService {
  /**
   * Get paginated list of projects with optional filters
   */
  async getProjects(filters: ProjectFilters = {}): Promise<PaginatedProjects> {
    const { page = 1, limit = 10, stage, status, search, ownerId } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {};

    if (stage) {
      where.stage = stage;
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search) {
      where.OR = [{ name: { contains: search } }, { code: { contains: search } }];
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      projects: projects as ProjectListItem[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(id: string): Promise<ProjectDetail | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        financials: true,
        competitorLinks: true,
        documents: true,
        tasks: true,
        comments: true,
        lessonsLearned: true,
        vocs: true,
      },
    });

    return project as ProjectDetail | null;
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<ProjectListItem> {
    try {
      const project = await prisma.project.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          stage: input.stage,
          status: input.status || ProjectStatus.ACTIVE,
          priority: input.priority || 'medium',
          ownerId: input.ownerId,
          startDate: input.startDate,
          endDate: input.endDate,
          targetDate: input.targetDate,
          budget: input.budget,
          spent: 0,
          scores: input.scores as Prisma.InputJsonValue,
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Отправляем email создателю проекта
      emailService
        .sendProjectCreatedEmail({
          to: project.owner.email,
          fullName: project.owner.fullName,
          projectName: project.name,
          projectCode: project.code,
        })
        .catch((err) => logger.warn({ msg: 'Project created email failed', error: err }));

      return project as ProjectListItem;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictError('Project code already exists');
      }
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(
    id: string,
    input: UpdateProjectInput,
    userId: string,
    isAdmin = false
  ): Promise<ProjectListItem> {
    // Check if project exists
    const existing = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    // Check authorization
    if (!isAdmin && existing.ownerId !== userId) {
      throw new AuthorizationError('You can only update your own projects');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.stage !== undefined && { stage: input.stage }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.startDate !== undefined && { startDate: input.startDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
        ...(input.targetDate !== undefined && { targetDate: input.targetDate }),
        ...(input.completedAt !== undefined && { completedAt: input.completedAt }),
        ...(input.budget !== undefined && { budget: input.budget }),
        ...(input.spent !== undefined && { spent: input.spent }),
        ...(input.scores !== undefined && { scores: input.scores as Prisma.InputJsonValue }),
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return project as ProjectListItem;
  }

  /**
   * Soft delete a project (set status to CANCELLED)
   */
  async deleteProject(id: string, userId: string, isAdmin = false): Promise<void> {
    // Check if project exists
    const existing = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    // Check authorization
    if (!isAdmin && existing.ownerId !== userId) {
      throw new AuthorizationError('You can only delete your own projects');
    }

    // Soft delete by setting status to CANCELLED
    await prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.CANCELLED,
      },
    });
  }

  /**
   * Add a member to a project
   */
  async addProjectMember(input: AddProjectMemberInput): Promise<ProjectMember> {
    try {
      // Получаем информацию о проекте и пригласившем
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        select: { name: true },
      });

      const member = await prisma.projectMember.create({
        data: {
          projectId: input.projectId,
          userId: input.userId,
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Отправляем email приглашенному
      if (project) {
        emailService
          .sendTeamInviteEmail({
            to: member.user.email,
            fullName: member.user.fullName,
            projectName: project.name,
            role: input.role,
            invitedBy: 'Команда проекта',
          })
          .catch((err) => logger.warn({ msg: 'Team invite email failed', error: err }));
      }

      return member as ProjectMember;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictError('User is already a member of this project');
      }
      throw error;
    }
  }

  /**
   * Remove a member from a project
   */
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  /**
   * Get all members of a project
   */
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return members as ProjectMember[];
  }
}
