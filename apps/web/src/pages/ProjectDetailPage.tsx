/**
 * ProjectDetailPage Component
 * Page for viewing and editing a single project
 */

import { type UseMutationResult } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '@/components/layout/PageHeader';
import { FileUpload } from '../components/attachments/FileUpload';
import { FilesList } from '../components/attachments/FilesList';
import { CommentSection } from '../components/comments/CommentSection';
import { ProjectGatesProgress } from '../components/engineering/ProjectGatesProgress';
import { ProjectForm } from '../components/projects/ProjectForm';
import {
  useDeleteProject,
  useProject,
  useProjectMembers,
  useUpdateProject,
  useProjectCompetitors,
  useAddProjectCompetitor,
  useRemoveProjectCompetitor,
} from '../hooks/useProjects';
import { api } from '../lib/api';
import { ru } from '../i18n/ru';
import { UpdateProjectInput, type Project } from '../types/project.types';

interface Competitor {
  id: string;
  name: string;
  country: string | null;
  countryCode: string | null;
}

function AddCompetitorForm({
  existingCompetitorIds,
  onAdd,
  isAdding,
}: {
  existingCompetitorIds: string[];
  onAdd: (competitorId: string) => void;
  isAdding: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCompetitors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ competitors: Competitor[] }>('/api/knowledge/competitors', {
        params: { limit: 100 },
      });
      const data = response.data as { competitors?: Competitor[] };
      const allCompetitors = data.competitors || [];
      setCompetitors(allCompetitors.filter((c) => !existingCompetitorIds.includes(c.id)));
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadCompetitors();
  };

  const filteredCompetitors = competitors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isOpen) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск конкурента..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
        ) : filteredCompetitors.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredCompetitors.map((competitor) => (
              <button
                key={competitor.id}
                onClick={() => {
                  onAdd(competitor.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                disabled={isAdding}
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg flex items-center justify-between"
              >
                <span className="font-medium text-gray-900 dark:text-white">{competitor.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {competitor.country || '—'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Конкуренты не найдены</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleOpen}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      + Добавить конкурента
    </button>
  );
}

export function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id || '');
  const updateProject: UseMutationResult<
    Project,
    unknown,
    { id: string; data: UpdateProjectInput }
  > = useUpdateProject();
  const deleteProject: UseMutationResult<string, unknown, string> = useDeleteProject();
  const { data: members } = useProjectMembers(id || '');
  const { data: competitors, isLoading: competitorsLoading } = useProjectCompetitors(id || '');
  const addCompetitor = useAddProjectCompetitor();
  const removeCompetitor = useRemoveProjectCompetitor();

  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (): void => {
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
  };

  const handleUpdate = async (data: UpdateProjectInput): Promise<void> => {
    await updateProject.mutateAsync({ id: id || '', data });
    setIsEditing(false);
  };

  const handleDelete = async (): Promise<void> => {
    if (window.confirm(ru.projects.confirmDelete)) {
      try {
        await deleteProject.mutateAsync(id || '');
        await navigate('/projects');
      } catch (err: unknown) {
        let errorMessage = 'Failed to delete project';
        if (err && typeof err === 'object' && 'response' in err) {
          const response = (err as { response?: { data?: { message?: string } } }).response;
          if (response?.data?.message) {
            errorMessage = response.data.message;
          }
        }
        alert(errorMessage);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {ru.common.error}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error instanceof Error ? error.message : ru.projects.projectNotFound}
          </p>
          <button
            onClick={() => {
              void navigate('/projects');
            }}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {ru.projects.backToProjects}
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleCancelEdit}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              {ru.projects.cancelEdit}
            </button>
          </div>

          <ProjectForm
            mode="edit"
            initialData={project as UpdateProjectInput}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
            isLoading={updateProject.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title={project.name}
          subtitle={`Код: ${project.code}`}
          backTo="/projects"
          variant="compact"
        />

        {/* Project Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="flex gap-2 mt-4 sm:mt-0">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {(ru.stages as Record<string, string>)[project.stage] || project.stage}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {(ru.status as Record<string, string>)[project.status] || project.status}
              </span>
            </div>
          </div>

          {project.description ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">{project.description}</p>
          ) : null}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.priority}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {(ru.priority as Record<string, string>)[project.priority] || project.priority}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.owner}</p>
              <p className="font-medium text-gray-900 dark:text-white">{project.owner.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.startDate}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString('ru-RU')
                  : ru.projects.notSet}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.endDate}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString('ru-RU')
                  : ru.projects.notSet}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.targetDate}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.targetDate
                  ? new Date(project.targetDate).toLocaleDateString('ru-RU')
                  : ru.projects.notSet}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ru.projects.created}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>

          {/* Budget */}
          {project.budget ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">{ru.projects.budget}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  }).format(project.budget)}
                </span>
              </div>
              {project.spent > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{ru.projects.spent}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    }).format(project.spent)}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`/projects/${id}/charter`}
              className="flex-1 py-3 px-4 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-center"
            >
              📋 Устав
            </Link>
            <button
              onClick={handleEdit}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {ru.projects.editProject}
            </button>
            <button
              onClick={() => {
                void handleDelete();
              }}
              disabled={deleteProject.isPending}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteProject.isPending ? ru.projects.deleting : ru.projects.deleteProject}
            </button>
          </div>
        </div>

        {/* Team Members */}
        {members && members.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {ru.projects.teamMembers}
            </h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {member.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {(ru.roles as Record<string, string>)[member.role] || member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Competitors */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Конкуренты
          </h2>
          
          {competitorsLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
          ) : competitors && competitors.length > 0 ? (
            <div className="space-y-3">
              {competitors.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {link.competitor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {link.competitor.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {link.competitor.country || 'Страна не указана'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      removeCompetitor.mutate({
                        projectId: project.id,
                        competitorId: link.competitorId,
                      });
                    }}
                    disabled={removeCompetitor.isPending}
                    className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Нет связанных конкурентов</p>
          )}

          <AddCompetitorForm
            existingCompetitorIds={competitors?.map(c => c.competitorId) || []}
            onAdd={(competitorId) => {
              addCompetitor.mutate({
                projectId: project.id,
                competitorId,
              });
            }}
            isAdding={addCompetitor.isPending}
          />
        </div>

        {/* Comments */}
        <CommentSection projectId={project.id} />

        {/* Files */}
        <div
          className="bg-white dark:bg-gray-800
          rounded-2xl border border-gray-200
          dark:border-gray-700 p-6 mt-6"
        >
          <h3
            className="text-lg font-semibold
            text-gray-900 dark:text-white mb-6
            flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828
                2.828l6.414-6.586a4 4 0 00-5.656-5.656
                l-6.415 6.585a6 6 0 108.486 8.486L20.5
                13"
              />
            </svg>
            Файлы проекта
          </h3>

          {/* Загрузка */}
          <FileUpload projectId={project.id} />

          {/* Список файлов */}
          <div className="mt-6">
            <FilesList projectId={project.id} />
          </div>

          {/* Validation Gates Progress */}
          <div className="mt-6">
            <ProjectGatesProgress projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
