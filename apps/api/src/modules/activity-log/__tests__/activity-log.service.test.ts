/**
 * ActivityLogService Tests
 * TDD: Тесты написаны до реализации сервиса
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityLogService } from '../activity-log.service';

// Мок для prisma - должен быть определен до импорта сервиса
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    activityLog: {
      create: vi.fn().mockResolvedValue({
        id: 'log-1',
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: 'proj-1',
        entityName: 'Куттер K-200',
        userId: 'user-1',
        projectId: 'proj-1',
        changes: null,
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'log-1',
          action: 'PROJECT_CREATED',
          entityType: 'Project',
          entityName: 'Test Project',
          createdAt: new Date(),
          changes: null,
          user: {
            fullName: 'Иван Иванов',
            username: 'ivanov',
          },
          project: {
            code: 'K-200',
            name: 'Куттер K-200',
          },
        },
      ]),
      count: vi.fn().mockResolvedValue(42),
    },
  },
}));

// Импорт prisma после мока для получения mock-функций
import { prisma } from '../../../lib/prisma';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Настройка mock-функций после очистки
    vi.mocked(prisma.activityLog.create).mockResolvedValue({
      id: 'log-1',
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: 'proj-1',
      entityName: 'Куттер K-200',
      userId: 'user-1',
      projectId: 'proj-1',
      changes: null,
      createdAt: new Date(),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
      {
        id: 'log-1',
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityName: 'Test Project',
        createdAt: new Date(),
        changes: null,
        user: {
          fullName: 'Иван Иванов',
          username: 'ivanov',
        },
        project: {
          code: 'K-200',
          name: 'Куттер K-200',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    ]);

    vi.mocked(prisma.activityLog.count).mockResolvedValue(42);

    service = new ActivityLogService();
  });

  describe('log()', () => {
    it('should create activity log entry', async () => {
      const result = await service.log({
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: 'proj-1',
        entityName: 'Test',
        userId: 'user-1',
        projectId: 'proj-1',
      });

      expect(result).toHaveProperty('id');
      expect(result.action).toBe('PROJECT_CREATED');
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'Project',
          entityId: 'proj-1',
          entityName: 'Test',
          userId: 'user-1',
          projectId: 'proj-1',
          changes: undefined,
        },
      });
    });

    it('should create log without entityName', async () => {
      // Обновляем mock для этого теста
      vi.mocked(prisma.activityLog.create).mockResolvedValueOnce({
        id: 'log-2',
        action: 'COMMENT_CREATED',
        entityType: 'Comment',
        entityId: 'comment-1',
        entityName: null,
        userId: 'user-1',
        projectId: 'proj-1',
        changes: null,
        createdAt: new Date(),
      });

      const result = await service.log({
        action: 'COMMENT_CREATED',
        entityType: 'Comment',
        entityId: 'comment-1',
        userId: 'user-1',
        projectId: 'proj-1',
      });

      expect(result).toHaveProperty('id');
      expect(result.action).toBe('COMMENT_CREATED');
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityName: undefined,
        }),
      });
    });

    it('should create log with changes', async () => {
      const changes = { budget: { old: 1000, new: 2000 } };
      const result = await service.log({
        action: 'BUDGET_UPDATED',
        entityType: 'Project',
        entityId: 'proj-1',
        userId: 'user-1',
        projectId: 'proj-1',
        changes,
      });

      expect(result).toHaveProperty('id');
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes,
        }),
      });
    });
  });

  describe('getLogs()', () => {
    it('should get logs without filters', async () => {
      const logs = await service.getLogs();

      expect(Array.isArray(logs)).toBe(true);
      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should filter by userId', async () => {
      await service.getLogs({ userId: 'user-1' });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
          }),
        })
      );
    });

    it('should filter by projectId', async () => {
      await service.getLogs({ projectId: 'proj-1' });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-1',
          }),
        })
      );
    });

    it('should filter by action type', async () => {
      await service.getLogs({ action: 'PROJECT_CREATED' });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'PROJECT_CREATED',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getLogs({ startDate, endDate });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      await service.getLogs({ limit: 10, offset: 5 });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        })
      );
    });

    it('should order by createdAt desc', async () => {
      await service.getLogs();

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include user and project relations', async () => {
      await service.getLogs();

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
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
        })
      );
    });
  });

  describe('getCount()', () => {
    it('should count logs without filters', async () => {
      const count = await service.getCount();

      expect(typeof count).toBe('number');
      expect(prisma.activityLog.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should count with userId filter', async () => {
      await service.getCount({ userId: 'user-1' });

      expect(prisma.activityLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-1',
        }),
      });
    });

    it('should count with projectId filter', async () => {
      await service.getCount({ projectId: 'proj-1' });

      expect(prisma.activityLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          projectId: 'proj-1',
        }),
      });
    });

    it('should count with action filter', async () => {
      await service.getCount({ action: 'PROJECT_CREATED' });

      expect(prisma.activityLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          action: 'PROJECT_CREATED',
        }),
      });
    });

    it('should count with date range filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.getCount({ startDate, endDate });

      expect(prisma.activityLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      });
    });
  });
});
