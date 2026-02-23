import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface ProjectGatesProgressProps {
  projectId: string;
}

interface GateStatus {
  gate: {
    code: string;
    name: string;
    order: number;
    phase: string;
  };
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'WAIVED';
  latestValidation?: {
    passed: boolean;
    score: number;
    validatedAt: string;
  };
  blockers?: string[];
}

interface ProjectGatesStatus {
  projectId: string;
  gates: GateStatus[];
  currentGate?: string;
  overallProgress: number;
}

export function ProjectGatesProgress({ projectId }: ProjectGatesProgressProps) {
  const { data: gatesStatus, isLoading } = useQuery<ProjectGatesStatus>({
    queryKey: ['project-gates', projectId],
    queryFn: () => api.get(`/api/validation/projects/${projectId}/status`).then((r) => r.data),
  });

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>;
  }

  if (!gatesStatus) {
    return null;
  }

  const statusColors = {
    NOT_STARTED: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    PASSED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    WAIVED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  };

  const statusIcons = {
    NOT_STARTED: '⭕',
    IN_PROGRESS: '🔵',
    PASSED: '✅',
    FAILED: '❌',
    WAIVED: '⚠️',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">🚪 Validation Gates</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {gatesStatus.overallProgress}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Прогресс</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${gatesStatus.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Gates List */}
      <div className="space-y-3">
        {gatesStatus.gates?.map((gate) => (
          <div
            key={gate.gate.code}
            className={`
              relative rounded-xl border-2 p-4 transition-all
              ${
                gate.gate.code === gatesStatus.currentGate
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }
            `}
          >
            {/* Order Badge */}
            <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
              {gate.gate.order}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{gate.gate.name}</h4>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {gate.gate.phase}
                  </span>
                </div>

                {gate.latestValidation && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Оценка: {(gate.latestValidation.score * 100).toFixed(0)}% •{' '}
                    {new Date(gate.latestValidation.validatedAt).toLocaleDateString('ru-RU')}
                  </div>
                )}

                {gate.blockers && gate.blockers.length > 0 && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    ⚠️ {gate.blockers.join(', ')}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div
                className={`
                px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2
                ${statusColors[gate.status]}
              `}
              >
                <span>{statusIcons[gate.status]}</span>
                <span>{gate.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
