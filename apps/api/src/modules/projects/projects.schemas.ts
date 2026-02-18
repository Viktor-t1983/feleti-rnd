/**
 * Projects Module - Request/Response Schemas
 * @module projects/schemas
 */

import { ProjectStage, ProjectStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Project filters schema
 */
export const projectFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  stage: z.nativeEnum(ProjectStage).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().trim().max(100).optional(),
  ownerId: z.string().uuid().optional(),
});

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  stage: z.nativeEnum(ProjectStage),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  ownerId: z.string().uuid(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  budget: z.coerce.number().positive().optional(),
  scores: z.record(z.number()).optional(),
});

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  stage: z.nativeEnum(ProjectStage).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  spent: z.coerce.number().nonnegative().optional(),
  scores: z.record(z.number()).optional(),
});

/**
 * Add project member schema
 */
export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string().trim().min(1).max(100),
});

/**
 * Remove project member schema
 */
export const removeProjectMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
});

/**
 * Project member params schema (for route parameters)
 */
export const projectMemberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

/**
 * Project ID param schema
 */
export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Types inferred from schemas
 */
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberInput = z.infer<typeof removeProjectMemberSchema>;
export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
