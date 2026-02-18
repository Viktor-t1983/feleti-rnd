/**
 * ProjectsPage Component
 * Main page for listing and managing projects
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Header } from '../components/layout/Header';
import { ProjectsList } from '../components/projects/ProjectsList';
import { useProjects } from '../hooks/useProjects';
import { ru } from '../i18n/ru';
import { ProjectFilters, type Project } from '../types/project.types';

export function ProjectsPage(): JSX.Element {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProjectFilters>({ page: 1, limit: 12 });
  const { data, isLoading, error } = useProjects(filters);

  const handleProjectClick = (project: Project): void => {
    void navigate(`/projects/${project.id}`);
  };

  const handleFilterChange = (newFilters: ProjectFilters): void => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setFilters({ ...filters, page });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {ru.common.error}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error instanceof Error ? error.message : ru.errors.generic}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {ru.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {ru.projects.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {ru.projects.manageYourProjects}
            </p>
          </div>
          <button
            onClick={() => {
              void navigate('/projects/new');
            }}
            className="mt-4 sm:mt-0 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            data-testid="create-project-button"
          >
            {ru.projects.createNewProject}
          </button>
        </div>

        {/* Projects List */}
        <ProjectsList
          projects={data?.projects || []}
          isLoading={isLoading}
          onProjectClick={handleProjectClick}
          onFilterChange={handleFilterChange}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
