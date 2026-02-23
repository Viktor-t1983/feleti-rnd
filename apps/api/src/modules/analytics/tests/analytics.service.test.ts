import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics.service';

import { prisma } from '../../../lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  },
}));

// Type definitions for mock objects
interface MockUser {
  id: string;
  roleId: string;
  role?: {
    name: string;
  };
}

interface MockRole {
  id: string;
  name: string;
  isSystem: boolean;
}

interface MockProject {
  id: string;
  name: string;
  code: string;
  stage: string;
  status?: string;
  budget: number;
  spent: number;
  startDate?: Date | null;
  targetDate?: Date | null;
  createdAt?: Date;
  owner?: { fullName: string };
  creator?: { fullName: string };
  _count?: { members?: number; attachments?: number };
}

interface MockProjectGroupBy {
  stage?: string;
  status?: string;
  createdAt?: Date;
  _count: number;
  _sum?: { budget?: number | null; spent?: number | null };
  _avg?: { budget?: number; spent?: number };
}

// Helper to get typed mock functions
const getMockedPrisma = (): {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  project: {
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  role: {
    findUnique: ReturnType<typeof vi.fn>;
  };
} =>
  prisma as unknown as {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    project: {
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    role: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockUser: MockUser;
  let mockRole: MockRole;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();

    // Setup default mock user and role (with nested role for new methods)
    mockUser = {
      id: 'user-1',
      roleId: 'role-1',
      role: { name: 'user' },
    };
    mockRole = {
      id: 'role-1',
      name: 'user',
      isSystem: false,
    };
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics for admin user', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.count
        .mockResolvedValueOnce(10) // totalProjects
        .mockResolvedValueOnce(5); // activeProjects
      mockedPrisma.project.aggregate
        .mockResolvedValueOnce({ _sum: { budget: 100000 } }) // totalBudget
        .mockResolvedValueOnce({ _sum: { spent: 50000 } }); // totalSpent
      mockedPrisma.project.groupBy
        .mockResolvedValueOnce([
          { stage: 'IDEA', _count: 3 },
          { stage: 'CONCEPT', _count: 2 },
        ] as MockProjectGroupBy[]) // projectsByStage
        .mockResolvedValueOnce([
          { status: 'ACTIVE', _count: 5 },
          { status: 'ON_HOLD', _count: 2 },
        ] as MockProjectGroupBy[]); // projectsByStatus
      mockedPrisma.project.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Test Project',
          code: 'TEST-001',
          stage: 'IDEA',
          budget: 10000,
          spent: 5000,
          owner: { fullName: 'Test User' },
        },
      ] as MockProject[]);

      const stats = await analyticsService.getDashboardStats('user-1');

      expect(stats.summary).toHaveProperty('totalProjects');
      expect(stats.summary).toHaveProperty('activeProjects');
      expect(stats.summary).toHaveProperty('totalBudget');
      expect(stats.summary).toHaveProperty('totalSpent');
      expect(stats.charts).toHaveProperty('projectsByStage');
      expect(stats.charts).toHaveProperty('projectsByStatus');
      expect(stats.recentProjects).toHaveLength(1);
    });

    it('should calculate budget utilization correctly', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      mockedPrisma.project.aggregate
        .mockResolvedValueOnce({ _sum: { budget: 100000 } })
        .mockResolvedValueOnce({ _sum: { spent: 50000 } });
      mockedPrisma.project.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedPrisma.project.findMany.mockResolvedValue([]);

      const stats = await analyticsService.getDashboardStats('user-1');

      const expected = (stats.summary.totalSpent / stats.summary.totalBudget) * 100;
      expect(stats.summary.budgetUtilization).toBeCloseTo(expected, 2);
    });

    it('should handle zero budget', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockedPrisma.project.aggregate
        .mockResolvedValueOnce({ _sum: { budget: null } })
        .mockResolvedValueOnce({ _sum: { spent: null } });
      mockedPrisma.project.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedPrisma.project.findMany.mockResolvedValue([]);

      const stats = await analyticsService.getDashboardStats('user-1');

      expect(stats.summary.totalBudget).toBe(0);
      expect(stats.summary.totalSpent).toBe(0);
      expect(stats.summary.budgetUtilization).toBe(0);
    });

    it('should filter projects by userId for non-admin users', async () => {
      const mockedPrisma = getMockedPrisma();
      const nonAdminRole = { ...mockRole, name: 'user', isSystem: false };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(nonAdminRole);

      mockedPrisma.project.count.mockResolvedValue(10);
      mockedPrisma.project.aggregate
        .mockResolvedValueOnce({ _sum: { budget: 100000 } })
        .mockResolvedValueOnce({ _sum: { spent: 50000 } });
      mockedPrisma.project.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedPrisma.project.findMany.mockResolvedValue([]);

      await analyticsService.getDashboardStats('user-1');

      // Verify that project filter includes userId
      expect(mockedPrisma.project.count).toHaveBeenCalledWith({
        where: {
          OR: [{ ownerId: 'user-1' }, { members: { some: { userId: 'user-1' } } }],
        },
      });
    });
  });

  describe('getProjectsTrend', () => {
    it('should return weekly trends grouped by date', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      const mockData: MockProjectGroupBy[] = [
        { createdAt: new Date('2026-02-01T10:00:00Z'), _count: 2 },
        { createdAt: new Date('2026-02-01T14:00:00Z'), _count: 3 },
        { createdAt: new Date('2026-02-02T09:00:00Z'), _count: 1 },
      ];
      mockedPrisma.project.groupBy.mockResolvedValue(mockData);

      const trends = await analyticsService.getProjectsTrend('user-1', 'week');

      expect(Array.isArray(trends)).toBe(true);
      expect(trends).toHaveLength(2); // Две даты после группировки
      expect(trends[0]?.createdAt).toEqual(new Date('2026-02-01'));
      expect(trends[0]?._count).toBe(5); // 2 + 3
      expect(trends[1]?.createdAt).toEqual(new Date('2026-02-02'));
      expect(trends[1]?._count).toBe(1);
    });

    it('should filter projects by userId for non-admin users', async () => {
      const mockedPrisma = getMockedPrisma();
      const nonAdminRole = { ...mockRole, name: 'user', isSystem: false };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(nonAdminRole);

      mockedPrisma.project.groupBy.mockResolvedValue([]);

      await analyticsService.getProjectsTrend('user-1', 'week');

      // Verify that project filter includes userId
      expect(mockedPrisma.project.groupBy).toHaveBeenCalledWith({
        by: ['createdAt'],
        where: {
          OR: [{ ownerId: 'user-1' }, { members: { some: { userId: 'user-1' } } }],
          createdAt: expect.any(Object), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        },
        _count: true,
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getBudgetAnalysis', () => {
    it('should return budget analysis by stage', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      const mockData: MockProjectGroupBy[] = [
        {
          stage: 'IDEA',
          _sum: { budget: 10000, spent: 5000 },
          _avg: { budget: 5000, spent: 2500 },
          _count: 2,
        },
      ];
      mockedPrisma.project.groupBy.mockResolvedValue(mockData);

      const analysis = await analyticsService.getBudgetAnalysis('user-1');

      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis).toEqual(mockData);
    });

    it('should filter projects by userId for non-admin users', async () => {
      const mockedPrisma = getMockedPrisma();
      const nonAdminRole = { ...mockRole, name: 'user', isSystem: false };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(nonAdminRole);

      mockedPrisma.project.groupBy.mockResolvedValue([]);

      await analyticsService.getBudgetAnalysis('user-1');

      // Verify that project filter includes userId
      expect(mockedPrisma.project.groupBy).toHaveBeenCalledWith({
        by: ['stage'],
        _sum: { budget: true, spent: true },
        _avg: { budget: true, spent: true },
        _count: true,
        where: {
          OR: [{ ownerId: 'user-1' }, { members: { some: { userId: 'user-1' } } }],
        },
      });
    });
  });

  // ============================================
  // EXTENDED ANALYTICS TESTS (TDD)
  // ============================================

  describe('getBudgetTrends', () => {
    it('should return budget trends grouped by month', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          budget: 5000000,
          spent: 1200000,
          startDate: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
          stage: 'DESIGN',
        },
        {
          id: 'proj-2',
          budget: 3000000,
          spent: 800000,
          startDate: new Date('2024-02-20'),
          createdAt: new Date('2024-02-20'),
          stage: 'PROTOTYPE',
        },
        {
          id: 'proj-3',
          budget: 2000000,
          spent: 500000,
          startDate: new Date('2024-01-10'),
          createdAt: new Date('2024-01-10'),
          stage: 'IDEA',
        },
      ] as MockProject[]);

      const trends = await analyticsService.getBudgetTrends('user-1');

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      // Check structure
      expect(trends[0]).toHaveProperty('month');
      expect(trends[0]).toHaveProperty('budget');
      expect(trends[0]).toHaveProperty('spent');
      expect(trends[0]).toHaveProperty('remaining');
      expect(trends[0]).toHaveProperty('projects');
      expect(trends[0]).toHaveProperty('utilization');
    });

    it('should filter projects by user for non-admin users', async () => {
      const mockedPrisma = getMockedPrisma();
      const nonAdminRole = { ...mockRole, name: 'user', isSystem: false };

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(nonAdminRole);

      mockedPrisma.project.findMany.mockResolvedValue([]);

      await analyticsService.getBudgetTrends('user-1');

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ ownerId: 'user-1' }, { members: { some: { userId: 'user-1' } } }],
        },
        select: expect.any(Object),
      });
    });
  });

  describe('getROIByProject', () => {
    it('should calculate ROI for each project', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          code: 'K-200',
          name: 'Куттер K-200',
          budget: 5000000,
          spent: 1200000,
          stage: 'DESIGN',
          status: 'ACTIVE',
        },
        {
          id: 'proj-2',
          code: 'P-300',
          name: 'Пресс P-300',
          budget: 3000000,
          spent: 800000,
          stage: 'PROTOTYPE',
          status: 'ACTIVE',
        },
      ] as MockProject[]);

      const roi = await analyticsService.getROIByProject('user-1');

      expect(Array.isArray(roi)).toBe(true);
      expect(roi.length).toBe(2);
      expect(roi[0]).toHaveProperty('id');
      expect(roi[0]).toHaveProperty('code');
      expect(roi[0]).toHaveProperty('budget');
      expect(roi[0]).toHaveProperty('spent');
      expect(roi[0]).toHaveProperty('remaining');
      expect(roi[0]).toHaveProperty('utilization');
      expect(roi[0]).toHaveProperty('roi');
    });

    it('should exclude cancelled projects', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([]);

      await analyticsService.getROIByProject('user-1');

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Object),
          status: { not: 'CANCELLED' },
        },
        select: expect.any(Object),
      });
    });
  });

  describe('getSpendingOverTime', () => {
    it('should return cumulative spending by month', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([
        { spent: 100000, createdAt: new Date('2024-01-15') },
        { spent: 200000, createdAt: new Date('2024-02-10') },
        { spent: 150000, createdAt: new Date('2024-02-20') },
      ] as MockProject[]);

      const spending = await analyticsService.getSpendingOverTime('user-1');

      expect(Array.isArray(spending)).toBe(true);
      expect(spending[0]).toHaveProperty('month');
      expect(spending[0]).toHaveProperty('total');
    });

    it('should filter by start date when provided', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([]);

      await analyticsService.getSpendingOverTime('user-1', '2024-01-01');

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Object),
          createdAt: { gte: new Date('2024-01-01') },
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('compareProjects', () => {
    it('should compare multiple projects', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          code: 'K-200',
          name: 'Куттер K-200',
          budget: 5000000,
          spent: 1200000,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2025-12-31'),
          stage: 'DESIGN',
          status: 'ACTIVE',
          _count: { members: 3, attachments: 10 },
        },
      ] as MockProject[]);

      const comparison = await analyticsService.compareProjects(['proj-1']);

      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison[0]).toHaveProperty('id');
      expect(comparison[0]).toHaveProperty('budget');
      expect(comparison[0]).toHaveProperty('spent');
      expect(comparison[0]).toHaveProperty('remaining');
      expect(comparison[0]).toHaveProperty('utilization');
      expect(comparison[0]).toHaveProperty('teamSize');
      expect(comparison[0]).toHaveProperty('filesCount');
      expect(comparison[0]).toHaveProperty('duration');
    });
  });

  describe('getStageStatistics', () => {
    it('should return stage statistics with aggregated data', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.groupBy.mockResolvedValue([
        {
          stage: 'DESIGN',
          _count: 2,
          _sum: { budget: 8000000, spent: 3000000 },
          _avg: { budget: 4000000, spent: 1500000 },
        },
        {
          stage: 'PROTOTYPE',
          _count: 1,
          _sum: { budget: 3000000, spent: 800000 },
          _avg: { budget: 3000000, spent: 800000 },
        },
      ] as MockProjectGroupBy[]);

      const stats = await analyticsService.getStageStatistics('user-1');

      expect(Array.isArray(stats)).toBe(true);
      expect(stats[0]).toHaveProperty('stage');
      expect(stats[0]).toHaveProperty('count');
      expect(stats[0]).toHaveProperty('totalBudget');
      expect(stats[0]).toHaveProperty('totalSpent');
      expect(stats[0]).toHaveProperty('avgBudget');
      expect(stats[0]).toHaveProperty('avgSpent');
      expect(stats[0]).toHaveProperty('utilization');
    });
  });

  describe('generateExcelReport', () => {
    it('should generate Excel report as Buffer', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.count.mockResolvedValue(5);
      mockedPrisma.project.aggregate.mockResolvedValue({
        _sum: { budget: 10000000, spent: 3000000 },
      });
      mockedPrisma.project.findMany.mockResolvedValue([
        {
          code: 'K-200',
          name: 'Куттер K-200',
          stage: 'DESIGN',
          status: 'ACTIVE',
          budget: 5000000,
          spent: 1200000,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2025-12-31'),
          owner: { fullName: 'Иванов И.И.' },
        },
      ] as MockProject[]);

      const buffer = await analyticsService.generateExcelReport('user-1');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateCSVReport', () => {
    it('should generate CSV report as Buffer', async () => {
      const mockedPrisma = getMockedPrisma();

      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockedPrisma.role.findUnique.mockResolvedValue(mockRole);

      mockedPrisma.project.findMany.mockResolvedValue([
        {
          code: 'K-200',
          name: 'Куттер K-200',
          stage: 'DESIGN',
          status: 'ACTIVE',
          budget: 5000000,
          spent: 1200000,
          owner: { fullName: 'Иванов И.И.' },
        },
      ] as MockProject[]);

      const buffer = await analyticsService.generateCSVReport('user-1');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      const csvContent = buffer.toString('utf-8');
      expect(csvContent).toContain('Код');
      expect(csvContent).toContain('Название');
      expect(csvContent).toContain('K-200');
    });
  });
});
