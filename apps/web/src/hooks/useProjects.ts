/**
 * Projects API Hooks
 * React Query hooks for Projects module
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import toast from 'react-hot-toast';
import { api } from '../lib/api';
import type {
  AddProjectMemberInput,
  CreateProjectInput,
  PaginatedProjects,
  Project,
  ProjectFilters,
  ProjectMember,
  UpdateProjectInput,
} from '../types/project.types';

/**
 * Get paginated projects list
 */
export function useProjects(filters?: ProjectFilters): UseQueryResult<PaginatedProjects> {
  return useQuery<PaginatedProjects>({
    queryKey: ['projects', filters],
    queryFn: async (): Promise<PaginatedProjects> => {
      const response = await api.get<PaginatedProjects>('/api/projects', { params: filters });
      return response.data;
    },
  });
}

/**
 * Get project by ID
 */
export function useProject(id: string): UseQueryResult<Project | null> {
  return useQuery<Project | null>({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project | null> => {
      const response = await api.get<Project>(`/api/projects/${id}`);
      return response.data;
    },
  });
}

/**
 * Create project mutation
 */
export function useCreateProject(): UseMutationResult<Project, unknown, CreateProjectInput> {
  const queryClient = useQueryClient();

  return useMutation<Project, unknown, CreateProjectInput>({
    mutationFn: async (data: CreateProjectInput): Promise<Project> => {
      const response = await api.post<Project>('/api/projects', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Update project mutation
 */
export function useUpdateProject(): UseMutationResult<
  Project,
  unknown,
  { id: string; data: UpdateProjectInput }
> {
  const queryClient = useQueryClient();

  return useMutation<Project, unknown, { id: string; data: UpdateProjectInput }>({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectInput;
    }): Promise<Project> => {
      const response = await api.put<Project>(`/api/projects/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['projects', 'project', variables.id] });
    },
  });
}

/**
 * Delete project mutation
 */
export function useDeleteProject(): UseMutationResult<string, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<string, unknown, string>({
    mutationFn: async (id: string): Promise<string> => {
      await api.delete(`/api/projects/${id}`);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект успешно удалён');
    },
    onError: () => {
      toast.error('Не удалось удалить проект');
    },
  });
}

/**
 * Add project member mutation
 */
export function useAddProjectMember(): UseMutationResult<
  ProjectMember,
  unknown,
  AddProjectMemberInput
> {
  const queryClient = useQueryClient();

  return useMutation<ProjectMember, unknown, AddProjectMemberInput>({
    mutationFn: async (data: AddProjectMemberInput): Promise<ProjectMember> => {
      const response = await api.post<ProjectMember>(
        `/api/projects/${data.projectId}/members`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', 'project', variables.projectId],
      });
    },
  });
}

/**
 * Remove project member mutation
 */
export function useRemoveProjectMember(): UseMutationResult<
  { projectId: string; userId: string },
  unknown,
  { projectId: string; userId: string }
> {
  const queryClient = useQueryClient();

  return useMutation<
    { projectId: string; userId: string },
    unknown,
    { projectId: string; userId: string }
  >({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }): Promise<{ projectId: string; userId: string }> => {
      await api.delete(`/api/projects/${projectId}/members/${userId}`);
      return { projectId, userId };
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', 'project', variables.projectId],
      });
    },
  });
}

/**
 * Get project members
 */
export function useProjectMembers(projectId: string): UseQueryResult<ProjectMember[]> {
  return useQuery<ProjectMember[]>({
    queryKey: ['projectMembers', projectId],
    queryFn: async (): Promise<ProjectMember[]> => {
      const response = await api.get<ProjectMember[]>(`/api/projects/${projectId}/members`);
      return response.data;
    },
  });
}

/**
 * Project competitor link type
 */
export interface ProjectCompetitor {
  id: string;
  projectId: string;
  competitorId: string;
  competitor: {
    id: string;
    name: string;
    country: string | null;
    website: string | null;
    strengths: string[];
    weaknesses: string[];
    productRange: string[];
  };
  notes: string | null;
  createdAt: string;
}

/**
 * Get project competitors
 */
export function useProjectCompetitors(projectId: string): UseQueryResult<ProjectCompetitor[]> {
  return useQuery<ProjectCompetitor[]>({
    queryKey: ['projectCompetitors', projectId],
    queryFn: async (): Promise<ProjectCompetitor[]> => {
      const response = await api.get<ProjectCompetitor[]>(`/api/projects/${projectId}/competitors`);
      return response.data;
    },
  });
}

/**
 * Add competitor to project mutation
 */
export function useAddProjectCompetitor(): UseMutationResult<
  ProjectCompetitor,
  unknown,
  { projectId: string; competitorId: string; notes?: string }
> {
  const queryClient = useQueryClient();

  return useMutation<ProjectCompetitor, unknown, { projectId: string; competitorId: string; notes?: string }>({
    mutationFn: async ({ projectId, competitorId, notes }): Promise<ProjectCompetitor> => {
      const response = await api.post<ProjectCompetitor>(
        `/api/projects/${projectId}/competitors`,
        { competitorId, notes }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projectCompetitors', variables.projectId],
      });
    },
  });
}

/**
 * Remove competitor from project mutation
 */
export function useRemoveProjectCompetitor(): UseMutationResult<
  { projectId: string; competitorId: string },
  unknown,
  { projectId: string; competitorId: string }
> {
  const queryClient = useQueryClient();

  return useMutation<
    { projectId: string; competitorId: string },
    unknown,
    { projectId: string; competitorId: string }
  >({
    mutationFn: async ({ projectId, competitorId }): Promise<{ projectId: string; competitorId: string }> => {
      await api.delete(`/api/projects/${projectId}/competitors/${competitorId}`);
      return { projectId, competitorId };
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projectCompetitors', variables.projectId],
      });
    },
  });
}
