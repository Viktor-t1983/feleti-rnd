/**
 * ProjectsList Component
 * List component for displaying projects with filters
 */

import { useState } from 'react';

import { ru } from '../../i18n/ru';
import { Project, ProjectFilters, ProjectStage, ProjectStatus } from '../../types/project.types';

import { ProjectCard } from './ProjectCard';

interface ProjectsListProps {
  projects: Project[];
  isLoading?: boolean;
  onProjectClick?: (project: Project) => void;
  onFilterChange?: (filters: ProjectFilters) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}

export function ProjectsList({
  projects,
  isLoading,
  onProjectClick,
  onFilterChange,
  pagination,
  onPageChange,
}: ProjectsListProps): JSX.Element {
  const [filters, setFilters] = useState<ProjectFilters>({});

  const handleFilterChange = (
    key: keyof ProjectFilters,
    value: ProjectFilters[keyof ProjectFilters]
  ): void => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    onFilterChange?.(filters);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {ru.common.search}
            </label>
            <input
              id="search"
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={ru.projects.searchPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="projects-search-input"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stage Filter */}
            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {ru.projects.stage}
              </label>
              <select
                id="stage"
                value={filters.stage || ''}
                onChange={(e) => handleFilterChange('stage', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="projects-stage-filter"
              >
                <option value="">{ru.projects.allStages}</option>
                {Object.values(ProjectStage).map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {ru.projects.status}
              </label>
              <select
                id="status"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="projects-status-filter"
              >
                <option value="">{ru.projects.allStatuses}</option>
                {Object.values(ProjectStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner Filter */}
            <div>
              <label
                htmlFor="ownerId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {ru.projects.owner}
              </label>
              <input
                id="ownerId"
                type="text"
                value={filters.ownerId || ''}
                onChange={(e) => handleFilterChange('ownerId', e.target.value || undefined)}
                placeholder={ru.projects.filterByOwner}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="projects-owner-filter"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFilters({});
                  onFilterChange?.({});
                }}
                className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                data-testid="projects-clear-filters"
              >
                {ru.common.clear} {ru.common.filter}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
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
      ) : null}

      {/* Empty State */}
      {!isLoading && projects.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {ru.projects.noProjectsFound}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {ru.projects.tryAdjustingFilters}
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick?.(project)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="pagination-prev"
          >
            {ru.common.previous}
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                data-testid={`pagination-page-${page}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="pagination-next"
          >
            {ru.common.next}
          </button>
        </div>
      ) : null}

      {/* Results Count */}
      {pagination ? (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {ru.projects.showingXOfYProjects
            .replace('{count}', String(projects.length))
            .replace('{total}', String(pagination.total))}
        </div>
      ) : null}
    </div>
  );
}
