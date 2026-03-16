/**
 * ProjectDetailPage Component
 * Page for viewing and editing a single project
 */

import { type UseMutationResult } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

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
} from '../hooks/useProjects';
import { ru } from '../i18n/ru';
import { UpdateProjectInput, type Project } from '../types/project.types';

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
    if (window.confirm('Are you sure you want to delete this project?')) {
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
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error instanceof Error ? error.message : 'Project not found'}
          </p>
          <button
            onClick={() => {
              void navigate('/projects');
            }}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Back to Projects
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
              ← Cancel Edit
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
        <div className="mb-6">
          <button
            onClick={() => {
              void navigate('/projects');
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Projects
          </button>
        </div>

        {/* Project Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-mono mt-1">
                {project.code}
              </p>
            </div>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Priority</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {project.priority}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
              <p className="font-medium text-gray-900 dark:text-white">{project.owner.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString('ru-RU')
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString('ru-RU')
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.targetDate
                  ? new Date(project.targetDate).toLocaleDateString('ru-RU')
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>

          {/* Budget */}
          {project.budget ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">Budget</span>
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
                  <span className="text-gray-500 dark:text-gray-400">Spent</span>
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
              Edit Project
            </button>
            <button
              onClick={() => {
                void handleDelete();
              }}
              disabled={deleteProject.isPending}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>

        {/* Team Members */}
        {members && members.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team Members</h2>
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
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
