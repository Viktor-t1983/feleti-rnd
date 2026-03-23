/**
 * AI Block Assistant
 * Компонент для чата с AI внутри блока устава проекта
 * Ключ API не передаётся на фронтенд - все вызовы через backend
 */

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  flags?: Array<{
    level: 'red' | 'yellow' | 'green';
    title: string;
    text: string;
  }>;
  timestamp?: string;
}

interface AiBlockAssistantProps {
  projectId: string;
  blockId: string;
  blockData?: Record<string, unknown>;
  history?: Message[];
  onHistoryUpdate?: (messages: Message[]) => void;
}

export function AiBlockAssistant({
  projectId,
  blockId,
  blockData = {},
  history = [],
  onHistoryUpdate,
}: AiBlockAssistantProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>(history);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedResponses = useRef<Set<string>>(new Set());

  // Синхронизация с внешней историей (предотвращает дублирование)
  useEffect(() => {
    if (history.length > 0) {
      // Проверяем, отличается ли history от текущих messages
      const historyStr = JSON.stringify(history.map(m => ({ role: m.role, content: m.content })));
      const messagesStr = JSON.stringify(messages.map(m => ({ role: m.role, content: m.content })));
      
      if (historyStr !== messagesStr) {
        setMessages(history);
      }
    }
  }, [history]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Обновляем родительский компонент при изменении истории
  useEffect(() => {
    onHistoryUpdate?.(messages);
  }, [messages, onHistoryUpdate]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Добавляем сообщение пользователя
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ];
    setMessages(newMessages);

    try {
      // Вызываем AI через backend (ключ в БД!)
      const { data } = await api.post(`/api/projects/${projectId}/blocks/${blockId}/ai-chat`, {
        message: userMessage,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        blockContext: blockData,
      });

      if (data.success) {
        // Проверяем, не добавлено ли это сообщение уже
        const responseId = data.data.text.slice(0, 100);
        if (processedResponses.current.has(responseId)) {
          return;
        }
        processedResponses.current.add(responseId);
        
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.text,
            flags: data.data.flags,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error(data.error || 'Ошибка AI-ассистента');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка соединения с AI';
      toast.error(errorMessage);

      // Добавляем сообщение об ошибке
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
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
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
        title="Открыть AI-ассистента"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span className="font-medium">AI Ассистент</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-600 text-white">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-semibold">AI Ассистент</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-purple-700 rounded-lg transition-colors"
          title="Закрыть"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-sm">Задайте вопрос AI-ассистенту</p>
            <p className="text-xs mt-1">Я помогу заполнить этот блок устава</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}
            >
              {msg.content.startsWith('❌') ? (
                <span className="text-red-200">{msg.content}</span>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>

            {/* Flags */}
            {msg.flags && msg.flags.length > 0 && (
              <div className="mt-2 space-y-1 w-full">
                {msg.flags.map((flag, flagIndex) => (
                  <div
                    key={flagIndex}
                    className={`p-2 rounded-lg border text-xs ${getFlagColor(flag.level)}`}
                  >
                    <div className="font-semibold">{flag.title}</div>
                    <div>{flag.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            {msg.timestamp && (
              <span className="text-xs text-gray-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            rows={1}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl transition-colors"
            title="Отправить"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          Enter — отправить, Shift+Enter — новая строка
        </div>
      </div>
    </div>
  );
}
