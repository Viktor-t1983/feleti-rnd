/**
 * Project Types
 * TypeScript types for Projects module
 */

export enum ProjectStage {
  IDEA = 'IDEA',
  CONCEPT = 'CONCEPT',
  DESIGN = 'DESIGN',
  PROTOTYPE = 'PROTOTYPE',
  TESTING = 'TESTING',
  PRODUCTION = 'PRODUCTION',
  COMPLETED = 'COMPLETED',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  stage: ProjectStage;
  status: ProjectStatus;
  priority: string;
  ownerId: string;
  owner: {
    id: string;
    fullName: string;
  };
  startDate: string | null;
  endDate: string | null;
  targetDate: string | null;
  budget: number | null;
  spent: number;
  scores: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  role: string;
  joinedAt: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  stage?: ProjectStage;
  status?: ProjectStatus;
  search?: string;
  ownerId?: string;
}

export interface PaginatedProjects {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProjectInput {
  code: string;
  name: string;
  description?: string;
  stage: ProjectStage;
  status?: ProjectStatus;
  priority?: string;
  ownerId: string;
  equipmentTypeId?: string; // для создания блоков устава
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  budget?: number;
  scores?: Record<string, number>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  stage?: ProjectStage;
  status?: ProjectStatus;
  priority?: string;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  completedAt?: string;
  budget?: number;
  spent?: number;
  scores?: Record<string, number>;
}

export interface AddProjectMemberInput {
  projectId: string;
  userId: string;
  role: string;
}
