/**
 * ActivityLog Service
 * Логирование всех действий в системе
 */

import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';

/** Типы действий для логирования */
export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'COMMENT_CREATED'
  | 'COMMENT_DELETED'
  | 'FILE_UPLOADED'
  | 'FILE_DELETED'
  | 'BUDGET_UPDATED';

/** Данные для создания записи в логе */
interface LogActivityData {
  action: ActivityAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  userId: string;
  projectId?: string;
  changes?: Prisma.InputJsonValue;
}

/** Фильтры для получения логов */
interface GetLogsFilters {
  userId?: string;
  projectId?: string;
  action?: ActivityAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/** Интерфейс сервиса логирования активности */
export class ActivityLogService {
  /**
   * Создать запись в логе активности
   */
  async log(data: LogActivityData) {
    return prisma.activityLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        userId: data.userId,
        projectId: data.projectId,
        changes: data.changes,
      },
    });
  }

  /**
   * Получить список логов с фильтрами
   */
  async getLogs(filters: GetLogsFilters = {}) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
        project: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Получить количество логов с фильтрами
   */
  async getCount(filters: GetLogsFilters = {}) {
    const where: Prisma.ActivityLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return prisma.activityLog.count({ where });
  }
}

/** Singleton экземпляр сервиса */
export const activityLogService = new ActivityLogService();
