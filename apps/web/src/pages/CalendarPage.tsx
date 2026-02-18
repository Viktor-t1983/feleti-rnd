/**
 * Calendar Page
 * Calendar view of project deadlines
 */

import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Header } from '@/components/layout/Header';
import { ru } from '@/i18n/ru';
import { api } from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  textColor: string;
  extendedProps: {
    code: string;
    stage: string;
    status: string;
    budget: number;
    spent: number;
    creator: string;
    isOverdue: boolean;
    daysLeft: number;
    progress: number;
  };
}

function formatMoney(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M ₽`;
  }
  return `${(value / 1_000).toFixed(0)}K ₽`;
}

export function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => api.get('/api/calendar/events').then((r) => r.data),
  });

  // Statistics
  const stats = {
    total: events.length,
    overdue: events.filter((e) => e.extendedProps.isOverdue).length,
    urgent: events.filter((e) => !e.extendedProps.isOverdue && e.extendedProps.daysLeft <= 7)
      .length,
    normal: events.filter((e) => !e.extendedProps.isOverdue && e.extendedProps.daysLeft > 7).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Календарь дедлайнов
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Дедлайны и сроки всех проектов</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              📅 Месяц
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              📋 Список
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Всего проектов',
              value: stats.total,
              color: 'bg-blue-50 dark:bg-blue-900/20',
              textColor: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: '🔴 Просрочено',
              value: stats.overdue,
              color: 'bg-red-50 dark:bg-red-900/20',
              textColor: 'text-red-600 dark:text-red-400',
            },
            {
              label: '🟡 До 7 дней',
              value: stats.urgent,
              color: 'bg-yellow-50 dark:bg-yellow-900/20',
              textColor: 'text-yellow-600 dark:text-yellow-400',
            },
            {
              label: '🟢 В норме',
              value: stats.normal,
              color: 'bg-green-50 dark:bg-green-900/20',
              textColor: 'text-green-600 dark:text-green-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-2xl p-4 border border-transparent`}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-600 dark:text-gray-400">
          {[
            { color: '#ef4444', label: 'Просрочен' },
            { color: '#f59e0b', label: 'До 7 дней' },
            { color: '#8b5cf6', label: 'До 30 дней' },
            { color: '#3b82f6', label: 'В плане' },
            { color: '#6b7280', label: 'Завершён/Пауза' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, listPlugin]}
                initialView={view === 'month' ? 'dayGridMonth' : 'listMonth'}
                key={view}
                events={events}
                locale="ru"
                buttonText={{
                  today: 'Сегодня',
                  month: 'Месяц',
                  list: 'Список',
                }}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: '',
                }}
                eventClick={(info) => {
                  const event = events.find((e) => e.id === info.event.id);
                  if (event) setSelectedEvent(event);
                }}
                eventDisplay="block"
                dayMaxEvents={3}
                height="auto"
                eventClassNames="cursor-pointer rounded-lg text-xs font-medium"
              />
            )}
          </div>

          {/* Details + Urgent List */}
          <div className="space-y-4">
            {selectedEvent ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Детали проекта</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Код</p>
                    <p className="font-mono font-semibold text-gray-900 dark:text-white">
                      {selectedEvent.extendedProps.code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Стадия</p>
                    <p className="text-gray-900 dark:text-white">
                      {ru.stages[selectedEvent.extendedProps.stage as keyof typeof ru.stages] ||
                        selectedEvent.extendedProps.stage}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Статус</p>
                    <p className="text-gray-900 dark:text-white">
                      {ru.status[selectedEvent.extendedProps.status as keyof typeof ru.status] ||
                        selectedEvent.extendedProps.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Бюджет</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatMoney(selectedEvent.extendedProps.budget)}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedEvent.extendedProps.progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${selectedEvent.extendedProps.progress}%`,
                          background:
                            selectedEvent.extendedProps.progress > 90 ? '#ef4444' : '#3b82f6',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Дедлайн</p>
                    <p
                      className={`font-semibold ${
                        selectedEvent.extendedProps.isOverdue
                          ? 'text-red-500'
                          : selectedEvent.extendedProps.daysLeft <= 7
                            ? 'text-yellow-500'
                            : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {selectedEvent.extendedProps.isOverdue
                        ? `Просрочен на ${Math.abs(selectedEvent.extendedProps.daysLeft)} дн.`
                        : `Через ${selectedEvent.extendedProps.daysLeft} дн.`}
                    </p>
                  </div>

                  <a
                    href={`/projects/${selectedEvent.id}`}
                    className="block w-full text-center py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors mt-4"
                  >
                    Открыть проект →
                  </a>
                </div>
              </div>
            ) : (
              /* Urgent List */
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  ⚠️ Требуют внимания
                </h3>

                {events
                  .filter((e) => e.extendedProps.isOverdue || e.extendedProps.daysLeft <= 30)
                  .sort((a, b) => a.extendedProps.daysLeft - b.extendedProps.daysLeft)
                  .slice(0, 5)
                  .map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.extendedProps.code}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                          {event.title.split(': ')[1]}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          event.extendedProps.isOverdue
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : event.extendedProps.daysLeft <= 7
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}
                      >
                        {event.extendedProps.isOverdue
                          ? `−${Math.abs(event.extendedProps.daysLeft)}д`
                          : `${event.extendedProps.daysLeft}д`}
                      </span>
                    </button>
                  ))}

                {events.filter((e) => e.extendedProps.isOverdue || e.extendedProps.daysLeft <= 30)
                  .length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    ✅ Все проекты в срок!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
