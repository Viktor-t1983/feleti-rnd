/**
 * ProjectCard Component
 * Mobile-first card component for displaying a single project
 */

import { useReports } from '../../hooks/useReports';
import { ru } from '../../i18n/ru';
import { Project, ProjectStage, ProjectStatus } from '../../types/project.types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const stageColors: Record<ProjectStage, string> = {
  [ProjectStage.IDEA]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [ProjectStage.CONCEPT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ProjectStage.DESIGN]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [ProjectStage.PROTOTYPE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ProjectStage.TESTING]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [ProjectStage.PRODUCTION]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ProjectStage.COMPLETED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ProjectStatus.COMPLETED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
};

export function ProjectCard({ project, onClick }: ProjectCardProps): JSX.Element {
  const { downloadProjectReport } = useReports();

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
      data-testid={`project-card-${project.id}`}
    >
      {/* Header: Code and Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{project.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}
            data-testid={`project-status-${project.id}`}
          >
            {ru.status[project.status]}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadProjectReport(project.id, project.code);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg
              bg-red-50 text-red-600 hover:bg-red-100
              dark:bg-red-900/20 dark:text-red-400
              dark:hover:bg-red-900/30
              transition-colors duration-200"
            title="Скачать PDF отчёт"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {project.description ? (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {project.description}
        </p>
      ) : null}

      {/* Badges: Stage and Priority */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[project.stage]}`}
          data-testid={`project-stage-${project.id}`}
        >
          {ru.stages[project.stage]}
        </span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[project.priority] || priorityColors['medium']}`}
          data-testid={`project-priority-${project.id}`}
        >
          {(ru.priority as Record<string, string>)[project.priority] || project.priority}
        </span>
      </div>

      {/* Footer: Owner and Dates */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-2">
              {project.owner.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-900 dark:text-white">{project.owner.fullName}</span>
          </div>
          {project.targetDate ? (
            <div className="text-right">
              <p className="text-gray-400 dark:text-gray-500">{ru.projects.target}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(project.targetDate).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                })}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Budget info (if available) */}
      {project.budget ? (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">{ru.projects.budget}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0,
              }).format(project.budget)}
            </span>
          </div>
          {project.spent > 0 && (
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500 dark:text-gray-400">{ru.projects.spent}:</span>
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
    </div>
  );
}
