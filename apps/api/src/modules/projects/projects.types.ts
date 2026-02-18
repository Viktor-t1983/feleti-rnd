/**
 * Projects Module - Type Definitions
 * @module projects/types
 */

import { Comment, CompetitorProject, Document, Financial, LessonLearned, ProjectStage, ProjectStatus, Task, VoiceOfCustomer } from '@prisma/client';

/**
 * Project filters for listing projects
 */
export interface ProjectFilters {
  page?: number;
  limit?: number;
  stage?: ProjectStage;
  status?: ProjectStatus;
  search?: string;
  ownerId?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated projects response
 */
export interface PaginatedProjects {
  projects: ProjectListItem[];
  pagination: PaginationMeta;
}

/**
 * Project list item (minimal data)
 */
export interface ProjectListItem {
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
  startDate: Date | null;
  endDate: Date | null;
  targetDate: Date | null;
  budget: number | null;
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full project details
 */
export interface ProjectDetail extends ProjectListItem {
  scores: Record<string, number> | null;
  members: ProjectMember[];
  financials: Financial[];
  competitorLinks: CompetitorProject[];
  documents: Document[];
  tasks: Task[];
  comments: Comment[];
  lessonsLearned: LessonLearned[];
  vocs: VoiceOfCustomer[];
}

/**
 * Project member
 */
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
  joinedAt: Date;
}

/**
 * Create project input
 */
export interface CreateProjectInput {
  code: string;
  name: string;
  description?: string;
  stage: ProjectStage;
  status?: ProjectStatus;
  priority?: string;
  ownerId: string;
  startDate?: Date;
  endDate?: Date;
  targetDate?: Date;
  budget?: number;
  scores?: Record<string, number>;
}

/**
 * Update project input
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  stage?: ProjectStage;
  status?: ProjectStatus;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  targetDate?: Date;
  completedAt?: Date;
  budget?: number;
  spent?: number;
  scores?: Record<string, number>;
}

/**
 * Add project member input
 */
export interface AddProjectMemberInput {
  projectId: string;
  userId: string;
  role: string;
}

/**
 * Remove project member input
 */
export interface RemoveProjectMemberInput {
  projectId: string;
  userId: string;
}
