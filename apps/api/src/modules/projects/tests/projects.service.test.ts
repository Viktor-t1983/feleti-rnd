/**
 * Projects Service Tests
 * TDD: Tests written BEFORE implementation
 */

import { ProjectStage, ProjectStatus } from '@prisma/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthorizationError, ConflictError, NotFoundError } from '../../../errors';
import { ProjectsService } from '../projects.service';

import { prisma } from '../../../lib/prisma';

// Type definitions for mock objects
interface MockProject {
  id: string;
  code: string;
  name: string;
  description: string;
  stage: ProjectStage;
  status: ProjectStatus;
  priority: string;
  ownerId: string;
  owner: { id: string; fullName: string };
  startDate: Date;
  endDate: Date;
  targetDate: Date;
  budget: number;
  spent: number;
  scores: { technical: number; market: number } | null;
  createdAt: Date;
  updatedAt: Date;
  members?: unknown[];
  financials?: unknown[];
  competitorLinks?: unknown[];
  documents?: unknown[];
  tasks?: unknown[];
  comments?: unknown[];
  lessonsLearned?: unknown[];
  vocs?: unknown[];
}

interface MockProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface MockPrismaError extends Error {
  code: string;
}

// Helper to get typed mock functions
const getMockedPrisma = (): {
  project: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  projectMember: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
} => prisma as unknown as {
  project: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  projectMember: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

// Mock Prisma Singleton
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
    },
    projectMember: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
  $disconnect: vi.fn(),
}));

describe('ProjectsService', () => {
  let projectsService: ProjectsService;

  beforeEach(() => {
    projectsService = new ProjectsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should return paginated projects', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = [
        {
          id: '1',
          code: 'K-200',
          name: 'Test Project',
          description: 'Test description',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          priority: 'high',
          ownerId: 'user1',
          owner: { fullName: 'Test User', id: 'user1' },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          scores: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(1);

      const result = await projectsService.getProjects({ page: 1, limit: 10 });

      expect(result.projects).toBeInstanceOf(Array);
      expect(result.projects).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by stage', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = [
        {
          id: '1',
          code: 'K-200',
          name: 'Test Project',
          description: 'Test description',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          priority: 'high',
          ownerId: 'user1',
          owner: { id: 'user1', fullName: 'Test User' },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          scores: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(1);

      const result = await projectsService.getProjects({ stage: ProjectStage.DESIGN });

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: ProjectStage.DESIGN,
          }) as unknown,
        }) as unknown
      );

      result.projects.forEach((p) => {
        expect(p.stage).toBe(ProjectStage.DESIGN);
      });
    });

    it('should filter by status', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = [
        {
          id: '1',
          code: 'K-200',
          name: 'Test Project',
          description: 'Test description',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          priority: 'high',
          ownerId: 'user1',
          owner: { id: 'user1', fullName: 'Test User' },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          scores: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(1);

      const result = await projectsService.getProjects({ status: ProjectStatus.ACTIVE });

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProjectStatus.ACTIVE,
          }) as unknown,
        }) as unknown
      );

      result.projects.forEach((p) => {
        expect(p.status).toBe(ProjectStatus.ACTIVE);
      });
    });

    it('should search by name or code', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = [
        {
          id: '1',
          code: 'K-200',
          name: 'Kutter K-200',
          description: 'Test description',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          priority: 'high',
          ownerId: 'user1',
          owner: { id: 'user1', fullName: 'Test User' },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          scores: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(1);

      const result = await projectsService.getProjects({ search: 'K-200' });

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) as unknown }) as unknown,
              expect.objectContaining({ code: expect.any(Object) as unknown }) as unknown,
            ]) as unknown,
          }) as unknown,
        }) as unknown
      );

      expect(
        result.projects.some((p) => p.name.includes('K-200') || p.code.includes('K-200'))
      ).toBe(true);
    });

    it('should filter by ownerId', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = [
        {
          id: '1',
          code: 'K-200',
          name: 'Test Project',
          description: 'Test description',
          stage: ProjectStage.DESIGN,
          status: ProjectStatus.ACTIVE,
          priority: 'high',
          ownerId: 'user1',
          owner: { id: 'user1', fullName: 'Test User' },
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          targetDate: new Date('2025-06-30'),
          budget: 5000000,
          spent: 1200000,
          scores: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(1);

      const result = await projectsService.getProjects({ ownerId: 'user1' });

      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerId: 'user1',
          }) as unknown,
        }) as unknown
      );

      result.projects.forEach((p) => {
        expect(p.ownerId).toBe('user1');
      });
    });

    it('should handle pagination correctly', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProjects: MockProject[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        code: `P-${i}`,
        name: `Project ${i}`,
        description: `Description ${i}`,
        stage: ProjectStage.DESIGN,
        status: ProjectStatus.ACTIVE,
        priority: 'medium',
        ownerId: 'user1',
        owner: { id: 'user1', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockedPrisma.project.findMany.mockResolvedValue(mockProjects);
      mockedPrisma.project.count.mockResolvedValue(25);

      const result = await projectsService.getProjects({ page: 2, limit: 10 });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(mockedPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }) as unknown
      );
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'K-200',
        name: 'Test Project',
        description: 'Test description',
        stage: ProjectStage.DESIGN,
        status: ProjectStatus.ACTIVE,
        priority: 'high',
        ownerId: 'user1',
        owner: { id: 'user1', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: { technical: 85, market: 90 },
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
        financials: [],
        competitorLinks: [],
        documents: [],
        tasks: [],
        comments: [],
        lessonsLearned: [],
        vocs: [],
      };

      mockedPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await projectsService.getProjectById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.code).toBe('K-200');
      expect(mockedPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object) as unknown,
      } as unknown);
    });

    it('should return null if project not found', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.project.findUnique.mockResolvedValue(null);

      const result = await projectsService.getProjectById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create project with valid data', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'TEST-001',
        name: 'Test Project',
        description: 'Test description',
        stage: ProjectStage.IDEA,
        status: ProjectStatus.ACTIVE,
        priority: 'medium',
        ownerId: 'user1',
        owner: { id: 'user1', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 0,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.project.create.mockResolvedValue(mockProject);

      const result = await projectsService.createProject({
        code: 'TEST-001',
        name: 'Test Project',
        description: 'Test description',
        stage: ProjectStage.IDEA,
        ownerId: 'user1',
      });

      expect(result.code).toBe('TEST-001');
      expect(result.name).toBe('Test Project');
      expect(result.stage).toBe(ProjectStage.IDEA);
      expect(mockedPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'TEST-001',
          name: 'Test Project',
          stage: ProjectStage.IDEA,
          ownerId: 'user1',
          budget: undefined,
        }) as unknown,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      } as unknown);
    });

    it('should throw ConflictError for duplicate code', async () => {
      const mockedPrisma = getMockedPrisma();
      const error = new Error('Unique constraint failed') as MockPrismaError;
      error.code = 'P2002';

      mockedPrisma.project.create.mockRejectedValue(error);

      await expect(
        projectsService.createProject({
          code: 'K-200', // Already exists
          name: 'Duplicate',
          stage: ProjectStage.IDEA,
          ownerId: 'user1',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateProject', () => {
    it('should update project', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'K-200',
        name: 'Updated Name',
        description: 'Updated description',
        stage: ProjectStage.PROTOTYPE,
        status: ProjectStatus.ACTIVE,
        priority: 'high',
        ownerId: 'user1',
        owner: { id: 'user1', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'user1',
      });
      mockedPrisma.project.update.mockResolvedValue(mockProject);

      const result = await projectsService.updateProject(
        '1',
        {
          name: 'Updated Name',
          stage: ProjectStage.PROTOTYPE,
        },
        'user1'
      );

      expect(result.name).toBe('Updated Name');
      expect(result.stage).toBe(ProjectStage.PROTOTYPE);
      expect(mockedPrisma.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          name: 'Updated Name',
          stage: ProjectStage.PROTOTYPE,
        }) as unknown,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      } as unknown);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        projectsService.updateProject('nonexistent', { name: 'Updated' }, 'user1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if user is not owner', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'other-user',
      });

      await expect(projectsService.updateProject('1', { name: 'Hack' }, 'user1')).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should allow admin to update any project', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'K-200',
        name: 'Updated Name',
        description: 'Updated description',
        stage: ProjectStage.PROTOTYPE,
        status: ProjectStatus.ACTIVE,
        priority: 'high',
        ownerId: 'other-user',
        owner: { id: 'other-user', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'other-user',
      });
      mockedPrisma.project.update.mockResolvedValue(mockProject);

      const result = await projectsService.updateProject(
        '1',
        { name: 'Updated Name' },
        'admin-user',
        true
      );

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteProject', () => {
    it('should soft delete project (set status to CANCELLED)', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'K-200',
        name: 'Test Project',
        description: 'Test description',
        stage: ProjectStage.DESIGN,
        status: ProjectStatus.CANCELLED,
        priority: 'high',
        ownerId: 'user1',
        owner: { id: 'user1', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'user1',
      });
      mockedPrisma.project.update.mockResolvedValue(mockProject);

      await projectsService.deleteProject('1', 'user1');

      expect(mockedPrisma.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          status: ProjectStatus.CANCELLED,
        }) as unknown,
      } as unknown);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.project.findUnique.mockResolvedValue(null);

      await expect(projectsService.deleteProject('nonexistent', 'user1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw AuthorizationError if user is not owner', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'other-user',
      });

      await expect(projectsService.deleteProject('1', 'user1')).rejects.toThrow(AuthorizationError);
    });

    it('should allow admin to delete any project', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockProject: MockProject = {
        id: '1',
        code: 'K-200',
        name: 'Test Project',
        description: 'Test description',
        stage: ProjectStage.DESIGN,
        status: ProjectStatus.CANCELLED,
        priority: 'high',
        ownerId: 'other-user',
        owner: { id: 'other-user', fullName: 'Test User' },
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        targetDate: new Date('2025-06-30'),
        budget: 5000000,
        spent: 1200000,
        scores: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.project.findUnique.mockResolvedValue({
        id: '1',
        ownerId: 'other-user',
      });
      mockedPrisma.project.update.mockResolvedValue(mockProject);

      await projectsService.deleteProject('1', 'admin-user', true);

      expect(mockedPrisma.project.update).toHaveBeenCalled();
    });
  });

  describe('addProjectMember', () => {
    it('should add member to project', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockMember: MockProjectMember = {
        id: '1',
        projectId: 'project1',
        userId: 'user1',
        role: 'Developer',
        joinedAt: new Date(),
        user: {
          id: 'user1',
          fullName: 'Test User',
          email: 'test@example.com',
        },
      };

      mockedPrisma.projectMember.create.mockResolvedValue(mockMember);

      const result = await projectsService.addProjectMember({
        projectId: 'project1',
        userId: 'user1',
        role: 'Developer',
      });

      expect(result.role).toBe('Developer');
      expect(mockedPrisma.projectMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project1',
          userId: 'user1',
          role: 'Developer',
        }) as unknown,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      } as unknown);
    });

    it('should throw ConflictError if member already exists', async () => {
      const mockedPrisma = getMockedPrisma();
      const error = new Error('Unique constraint failed') as MockPrismaError;
      error.code = 'P2002';

      mockedPrisma.projectMember.create.mockRejectedValue(error);

      await expect(
        projectsService.addProjectMember({
          projectId: 'project1',
          userId: 'user1',
          role: 'Developer',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('removeProjectMember', () => {
    it('should remove member from project', async () => {
      const mockedPrisma = getMockedPrisma();
      mockedPrisma.projectMember.delete.mockResolvedValue({});

      await projectsService.removeProjectMember('project1', 'user1');

      expect(mockedPrisma.projectMember.delete).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'project1',
            userId: 'user1',
          },
        },
      } as unknown);
    });
  });

  describe('getProjectMembers', () => {
    it('should return project members', async () => {
      const mockedPrisma = getMockedPrisma();
      const mockMembers: MockProjectMember[] = [
        {
          id: '1',
          projectId: 'project1',
          userId: 'user1',
          role: 'Lead Engineer',
          joinedAt: new Date(),
          user: {
            id: 'user1',
            fullName: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      mockedPrisma.projectMember.findMany.mockResolvedValue(mockMembers);

      const result = await projectsService.getProjectMembers('project1');

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('Lead Engineer');
      expect(mockedPrisma.projectMember.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project1' },
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
      } as unknown);
    });
  });
});
