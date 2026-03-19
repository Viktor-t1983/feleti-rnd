/**
 * ProjectCreatePage Component
 * Page for creating a new project
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { ProjectForm } from '../components/projects/ProjectForm';
import { useAuth } from '../contexts/AuthContext';
import {
  CreateProjectInput,
  ProjectStage,
  UpdateProjectInput,
  type Project,
} from '../types/project.types';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  defaultStage: string;
  estimatedBudget: number | null;
  estimatedDays: number | null;
  teamSize: number | null;
  checklist: string[] | null;
}

export function ProjectCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const createProject = useMutation<Project, Error, CreateProjectInput>({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await api.post('/api/projects', data);
      return response.data;
    },
    onSuccess: () => {
      navigate('/projects');
    },
  });

  const templateId = searchParams.get('template');

  // Load template if templateId is provided
  const { data: template, isLoading: isLoadingTemplate } = useQuery<ProjectTemplate | null>({
    queryKey: ['template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      try {
        const response = await api.get(`/api/templates/${templateId}`);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!templateId,
  });

  // Form initial data state - use Partial since form will fill in the rest
  const [initialData, setInitialData] = useState<Partial<CreateProjectInput>>({
    ownerId: String(user?.id || ''),
    stage: ProjectStage.IDEA,
  });

  // Update form when template is loaded
  useEffect(() => {
    if (template) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialData({
        ownerId: String(user?.id || ''),
        stage: template.defaultStage as ProjectStage,
        budget: template.estimatedBudget || undefined,
        description: template.description || undefined,
      });
    }
  }, [template, user?.id]);

  const handleSubmit = async (data: CreateProjectInput | UpdateProjectInput): Promise<void> => {
    await createProject.mutateAsync(data as CreateProjectInput);
  };

  const handleCancel = (): void => {
    void navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Создание проекта" backTo="/projects" variant="compact" />

        {/* Template hint */}
        {templateId && template && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🎨 Используется шаблон: <span className="font-semibold">{template.name}</span>
            </p>
          </div>
        )}

        {/* Loading template */}
        {templateId && isLoadingTemplate && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка шаблона...</p>
          </div>
        )}

        {/* Template not found */}
        {templateId && !isLoadingTemplate && !template && (
          <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Шаблон не найден. Создайте проект вручную.
            </p>
          </div>
        )}

        <ProjectForm
          mode="create"
          initialData={initialData as CreateProjectInput}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createProject.isPending}
        />
      </div>
    </div>
  );
}
