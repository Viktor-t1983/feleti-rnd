/**
 * ActivityLogPage
 * Страница истории действий в системе
 */

import { ActivityLogTimeline } from '@/components/activity-log/ActivityLogTimeline';
import { Header } from '@/components/layout/Header';

/**
 * Страница истории действий
 */
export function ActivityLogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📋 История действий</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Все события в системе</p>
        </div>

        <ActivityLogTimeline />
      </main>
    </div>
  );
}
