/**
 * Project Charter Page
 * Страница устава проекта с блоками и AI-ассистентом
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { AiBlockAssistant } from '@/components/AiBlockAssistant';
import { api } from '@/lib/api';

// Types
interface TemplateBlock {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  blockType: string;
  isRequired: boolean;
  aiEnabled: boolean;
  aiPrompt: string | null;
  fieldSchema: unknown;
}

interface ProjectBlock {
  id: string;
  templateBlockId: string;
  data: Record<string, unknown>;
  aiHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: string }>;
  aiFlags: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
  status: 'EMPTY' | 'IN_PROGRESS' | 'DONE';
  templateBlock: TemplateBlock;
}

interface ProjectCharter {
  id: string;
  name: string;
  code: string;
  description: string | null;
  blocks: ProjectBlock[];
}

// API functions
const fetchProjectCharter = async (projectId: string): Promise<ProjectCharter> => {
  const { data } = await api.get(`/api/projects/${projectId}/charter`);
  return data.data;
};

const updateProjectBlock = async (
  projectId: string,
  blockId: string,
  data: { data?: unknown; status?: string }
) => {
  const response = await api.put(`/api/projects/${projectId}/blocks/${blockId}`, data);
  return response.data.data;
};

const saveAiMessage = async (
  projectId: string,
  blockId: string,
  message: { role: 'user' | 'assistant'; content: string; flags?: unknown[] }
) => {
  const response = await api.post(`/api/projects/${projectId}/blocks/${blockId}/ai-message`, message);
  return response.data.data;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DONE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DONE':
      return '✅ Готово';
    case 'IN_PROGRESS':
      return '📝 В работе';
    default:
      return '⚪ Пустой';
  }
};

const getFlagColor = (level: string) => {
  switch (level) {
    case 'red':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'yellow':
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'green':
      return 'bg-green-100 border-green-300 text-green-800';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

export function ProjectCharterPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [aiAssistantBlock, setAiAssistantBlock] = useState<ProjectBlock | null>(null);

  // Queries
  const { data: charter, isLoading } = useQuery({
    queryKey: ['project-charter', projectId],
    queryFn: () => fetchProjectCharter(projectId!),
    enabled: !!projectId,
  });

  // Mutations
  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, data }: { blockId: string; data: { data?: unknown; status?: string } }) =>
      updateProjectBlock(projectId!, blockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-charter', projectId] });
      toast.success('Блок обновлён');
    },
    onError: () => toast.error('Ошибка обновления блока'),
  });

  const saveAiMessageMutation = useMutation({
    mutationFn: ({
      blockId,
      message,
    }: {
      blockId: string;
      message: { role: 'user' | 'assistant'; content: string; flags?: unknown[] };
    }) => saveAiMessage(projectId!, blockId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-charter', projectId] });
    },
  });

  // Calculate progress
  const totalBlocks = charter?.blocks?.length || 0;
  const doneBlocks = charter?.blocks?.filter((b) => b.status === 'DONE').length || 0;
  const progress = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

  const handleSaveBlockData = (blockId: string, data: Record<string, unknown>) => {
    updateBlockMutation.mutate({
      blockId,
      data: { data, status: 'DONE' },
    });
  };

  const handleAiSave = (blockId: string) => {
    return (message: { role: 'user' | 'assistant'; content: string; flags?: unknown[] }) => {
      saveAiMessageMutation.mutate({ blockId, message });
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Загрузка устава...</div>
      </div>
    );
  }

  if (!charter) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Устав не найден</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link to="/projects" className="hover:text-blue-600">
              Проекты
            </Link>
            <span>/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-blue-600">
              {charter.name}
            </Link>
            <span>/</span>
            <span>Устав</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📋 Устав проекта
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {charter.code} • {charter.name}
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Прогресс:</span>
                <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                  {doneBlocks}/{totalBlocks}
                </span>
              </div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          {charter.blocks?.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                Нет блоков в шаблоне. Обратитесь к администратору.
              </p>
            </div>
          )}

          {charter.blocks?.map((block, index) => (
            <div
              key={block.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Block header */}
              <button
                onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="text-2xl">{block.templateBlock.icon || '📄'}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {index + 1}. {block.templateBlock.name}
                    </span>
                    {block.templateBlock.isRequired && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                        Обязательный
                      </span>
                    )}
                    {block.templateBlock.aiEnabled && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  {block.templateBlock.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {block.templateBlock.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    block.status
                  )}`}
                >
                  {getStatusLabel(block.status)}
                </span>
                <div className="text-gray-400">
                  {expandedBlock === block.id ? '▼' : '▶'}
                </div>
              </button>

              {/* Expanded content */}
              {expandedBlock === block.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  {/* AI Flags */}
                  {block.aiFlags && block.aiFlags.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {block.aiFlags.map((flag, fidx) => (
                        <div
                          key={fidx}
                          className={`p-3 rounded-lg border ${getFlagColor(flag.level)}`}
                        >
                          <div className="font-medium flex items-center gap-2">
                            {flag.level === 'red' && '🚨'}
                            {flag.level === 'yellow' && '⚠️'}
                            {flag.level === 'green' && '✅'}
                            {flag.title}
                          </div>
                          <div className="text-sm mt-1 opacity-80">{flag.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Block data form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Данные блока
                      </label>
                      <textarea
                        value={JSON.stringify(block.data || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const data = JSON.parse(e.target.value);
                            handleSaveBlockData(block.id, data);
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      {block.templateBlock.aiEnabled && (
                        <button
                          onClick={() => setAiAssistantBlock(block)}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          🤖 AI-ассистент
                          {block.aiHistory?.length > 0 && (
                            <span className="bg-purple-800 px-2 py-0.5 rounded-full text-xs">
                              {block.aiHistory.length}
                            </span>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() =>
                          updateBlockMutation.mutate({
                            blockId: block.id,
                            data: { status: block.status === 'DONE' ? 'IN_PROGRESS' : 'DONE' },
                          })
                        }
                        className={`px-4 py-2 rounded-lg ${
                          block.status === 'DONE'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {block.status === 'DONE' ? '↩️ Вернуть в работу' : '✅ Отметить готовым'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Modal */}
      {aiAssistantBlock && (
        <AiBlockAssistant
          blockId={aiAssistantBlock.id}
          blockName={aiAssistantBlock.templateBlock.name}
          aiPrompt={aiAssistantBlock.templateBlock.aiPrompt || ''}
          projectContext={JSON.stringify(
            {
              projectName: charter.name,
              projectCode: charter.code,
              blockData: aiAssistantBlock.data,
            },
            null,
            2
          )}
          history={aiAssistantBlock.aiHistory || []}
          onSave={handleAiSave(aiAssistantBlock.id)}
          onClose={() => setAiAssistantBlock(null)}
        />
      )}
    </div>
  );
}
