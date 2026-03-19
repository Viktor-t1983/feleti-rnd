/**
 * AI Block Assistant Component
 * Чат с AI-ассистентом для блока устава
 *
 * ⚠️ БЕЗОПАСНОСТЬ: API ключ НЕ передаётся на фронтенд!
 * Все вызовы AI идут через backend: /api/projects/:id/blocks/:id/ai-chat
 * Ключ хранится в БД (зашифрован) и читается только на сервере.
 */

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AiFlag {
  level: 'red' | 'yellow' | 'green';
  title: string;
  text: string;
}

interface AiBlockAssistantProps {
  blockId: string;
  blockName: string;
  projectId: string;
  aiPrompt: string;
  projectContext: string;
  blockData?: Record<string, unknown>;
  history: AiMessage[];
  onSave: (message: { role: 'user' | 'assistant'; content: string; flags?: AiFlag[] }) => void;
  onClose: () => void;
}

export function AiBlockAssistant({
  blockId,
  blockName,
  projectId,
  aiPrompt,
  projectContext,
  blockData = {},
  history,
  onSave,
  onClose,
}: AiBlockAssistantProps): JSX.Element {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<AiMessage[]>(history || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseFlagsFromResponse = (content: string): { cleanContent: string; flags: AiFlag[] } => {
    const flags: AiFlag[] = [];
    // eslint-disable-next-line no-control-regex
    const flagRegex = /FLAG:(red|yellow|green):([^:]+):(.+?)(?=FLAG:|$)/gs;
    let match;

    while ((match = flagRegex.exec(content)) !== null) {
      if (match[1] && match[2] && match[3]) {
        flags.push({
          level: match[1] as 'red' | 'yellow' | 'green',
          title: match[2].trim(),
          text: match[3].trim(),
        });
      }
    }

    // Remove flags from content
    const cleanContent = content.replace(flagRegex, '').trim();

    return { cleanContent, flags };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();

    const userMessage: AiMessage = {
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      onSave({ role: 'user', content: userMessageText });

      // Prepare conversation history for API
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call AI через backend (ключ в БД!)
      const { data: response } = await api.post(
        `/api/projects/${projectId}/blocks/${blockId}/ai-chat`,
        {
          message: userMessageText,
          history: conversationHistory,
          blockContext: {
            ...blockData,
            projectContext,
            aiPrompt,
          },
        }
      );

      if (response.success) {
        const aiContent = response.data.text || 'Нет ответа от AI';
        const flags = response.data.flags || [];

        const aiMessage: AiMessage = {
          role: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Save AI message with flags
        onSave({
          role: 'assistant',
          content: aiContent,
          flags: flags.length > 0 ? flags : undefined,
        });
      } else {
        throw new Error(response.error || 'Ошибка AI-ассистента');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка соединения с AI';

      toast.error(errorMessage);
      console.error('AI API error:', error);

      // Add error message to chat
      const errorMsg: AiMessage = {
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getFlagColor = (level: string) => {
    switch (level) {
      case 'red':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getFlagIcon = (level: string) => {
    switch (level) {
      case 'red':
        return '🚨';
      case 'yellow':
        return '⚠️';
      case 'green':
        return '✅';
      default:
        return '📋';
    }
  };

  // Extract all flags from messages
  const allFlags: (AiFlag & { msgIndex: number })[] = [];
  messages.forEach((msg, idx) => {
    if (msg.role === 'assistant') {
      const { flags } = parseFlagsFromResponse(msg.content);
      flags.forEach((flag) => allFlags.push({ ...flag, msgIndex: idx }));
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-purple-600 text-white">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI-ассистент
            </h3>
            <p className="text-sm text-purple-200">{blockName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-purple-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Flags summary */}
        {allFlags.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🚩 Флаги рисков ({allFlags.length})
            </h4>
            <div className="space-y-2">
              {allFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-sm ${getFlagColor(flag.level)}`}
                >
                  <div className="font-medium flex items-center gap-1">
                    {getFlagIcon(flag.level)} {flag.title}
                  </div>
                  <div className="text-xs opacity-80">{flag.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <div className="text-4xl mb-2">🤖</div>
              <p>Начните диалог с AI-ассистентом</p>
              <p className="text-sm mt-2">Задайте вопрос или опишите параметры блока</p>
              <div className="mt-4 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg">
                💡 AI знает контекст проекта и поможет заполнить этот блок
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const { flags } = parseFlagsFromResponse(message.content);

            return (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.timestamp && (
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-purple-200'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('ru-RU')}
                    </div>
                  )}

                  {/* Flags in message */}
                  {flags.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {flags.map((flag, fidx) => (
                        <div
                          key={fidx}
                          className={`p-2 rounded text-xs ${getFlagColor(flag.level)}`}
                        >
                          <span className="font-medium">
                            {getFlagIcon(flag.level)} {flag.title}
                          </span>
                          <div className="opacity-80">{flag.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span className="text-sm">AI думает...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enter — отправить, Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  );
}
