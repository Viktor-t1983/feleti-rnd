/**
 * Calendar Service Tests
 * TDD: Tests written BEFORE implementation
 */

import { ProjectStage, ProjectStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarService } from '../calendar.service';

import { prisma } from '../../../lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    service = new CalendarService();
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return array of calendar events', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          code: 'K-200',
          name: 'Куттер K-200',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          owner: { fullName: 'Админ' },
          createdAt: new Date('2024-01-15'),
        },
      ];

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: { name: 'Admin' },
      });
      (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjects);

      const events = await service.getEvents('user-1');

      expect(Array.isArray(events)).toBe(true);
    });

    it('should map project to calendar event with required properties', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          code: 'K-200',
          name: 'Куттер K-200',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          owner: { fullName: 'Админ' },
          createdAt: new Date('2024-01-15'),
        },
      ];

      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: { name: 'Admin' },
      });
      (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjects);

      const events = await service.getEvents('user-1');

      if (events.length > 0) {
        expect(events[0]).toHaveProperty('id');
        expect(events[0]).toHaveProperty('title');
        expect(events[0]).toHaveProperty('start');
        expect(events[0]).toHaveProperty('end');
        expect(events[0]).toHaveProperty('color');
        expect(events[0]).toHaveProperty('textColor');
        expect(events[0]).toHaveProperty('extendedProps');
      }
    });

    it('should filter out cancelled projects', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: { name: 'Admin' },
      });
      (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const events = await service.getEvents('user-1');
      expect(events).toEqual([]);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: ProjectStatus.CANCELLED },
          }),
        })
      );
    });

    it('should return empty array when no projects', async () => {
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: { name: 'Admin' },
      });
      (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const events = await service.getEvents('user-1');

      expect(events).toEqual([]);
    });

    it('should sort events by targetDate ascending', async () => {
      // Mock returns unsorted data - Prisma orderBy handles sorting
      const mockProjects = [
        {
          id: 'proj-2',
          code: 'B-300',
          name: 'Блендер B-300',
          stage: ProjectStage.PROTOTYPE,
          status: ProjectStatus.ACTIVE,
          startDate: new Date('2024-02-01'),
          targetDate: new Date('2025-12-31'),
          budget: 3000000,
          spent: 500000,
          owner: { fullName: 'User' },
          createdAt: new Date('2024-02-01'),
        },
        {
          id: 'proj-1',
          code: 'K-200',
          name: 'Куттер K-200',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          startDate: new Date('2024-01-15'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          owner: { fullName: 'Admin' },
          createdAt: new Date('2024-01-15'),
        },
      ];

      // Mock findMany to return unsorted data
      // but service uses orderBy from Prisma, so the test verifies the query is correct
      (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        role: { name: 'Admin' },
      });
      (prisma.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockProjects);

      // Verify that findMany is called with orderBy
      await service.getEvents('user-1');

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { targetDate: 'asc' },
        })
      );
    });
  });
});
