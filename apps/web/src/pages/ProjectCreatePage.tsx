/**
 * ProjectCreatePage Component
 * Page for creating a new project
 */

import { type UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { ProjectForm } from '../components/projects/ProjectForm';
import { useAuth } from '../contexts/AuthContext';
import { useCreateProject } from '../hooks/useProjects';
import {
  CreateProjectInput,
  ProjectStage,
  UpdateProjectInput,
  type Project,
} from '../types/project.types';

export function ProjectCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createProject: UseMutationResult<Project, unknown, CreateProjectInput> = useCreateProject();

  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput): Promise<void> => {
    await createProject.mutateAsync(data as CreateProjectInput);
    await navigate('/projects');
  };

  const handleCancel = (): void => {
    void navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Projects
          </button>
        </div>

        <ProjectForm
          mode="create"
          initialData={
            {
              ownerId: String(user?.id || ''),
              stage: ProjectStage.IDEA,
            } as CreateProjectInput
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProject.isPending}
        />
      </div>
    </div>
  );
}
