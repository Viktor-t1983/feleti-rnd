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
import { MarketResearchDrawer } from './MarketResearchDrawer';

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
  onApplyToBlock?: (data: Record<string, unknown>) => void;
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
  onApplyToBlock,
  onClose,
}: AiBlockAssistantProps): JSX.Element {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<AiMessage[]>(history || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Есть ли ответ AI в истории
  const hasAiResponse = messages.some(m => m.role === 'assistant');
  
  // Состояние для перетаскивания окна
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Состояние для изменения размера окна
  const [size, setSize] = useState({ width: 420 });
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  
  // Вертикальное изменение размера (между верхней частью и чатом)
  const [topHeight, setTopHeight] = useState(200);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, topHeight: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleResizeWidthMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizingWidth(true);
    resizeStart.current = { x: e.clientX, y: 0, width: size.width, topHeight: 0 };
  };

  const handleResizeHeightMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizingHeight(true);
    resizeStart.current = { x: 0, y: e.clientY, width: 0, topHeight: topHeight };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 400));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100));
        setPosition({ x: newX, y: newY });
      }
      if (isResizingWidth) {
        const deltaX = resizeStart.current.x - e.clientX;
        const newWidth = Math.max(350, Math.min(800, resizeStart.current.width + deltaX));
        setSize(prev => ({ ...prev, width: newWidth }));
      }
      if (isResizingHeight) {
        const deltaY = e.clientY - resizeStart.current.y;
        const newHeight = Math.max(100, Math.min(400, resizeStart.current.topHeight + deltaY));
        setTopHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingWidth(false);
      setIsResizingHeight(false);
    };

    if (isDragging || isResizingWidth || isResizingHeight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizingWidth, isResizingHeight, topHeight]);
  
  // 🔒 Защита от двойного вызова
  const isProcessingRef = useRef<boolean>(false);
  const lastMessageRef = useRef<string>('');

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

  // 🔒 Отслеживаем уже сохранённые сообщения
  const savedMessageIds = useRef<Set<string>>(new Set());

  const sendMessage = async () => {
    const userMessageText = input.trim();
    
    // 🔒 Строгая защита от дублирования
    if (!userMessageText || isProcessingRef.current || isLoading) return;
    if (lastMessageRef.current === userMessageText) return;
    
    isProcessingRef.current = true;
    lastMessageRef.current = userMessageText;
    setInput('');
    setIsLoading(true);

    const userMessage: AiMessage = {
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message (с защитой от дублирования)
      const userMsgId = `user_${userMessageText.slice(0, 50)}`;
      if (!savedMessageIds.current.has(userMsgId)) {
        savedMessageIds.current.add(userMsgId);
        onSave({ role: 'user', content: userMessageText });
      }

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
        setLastAiResponse(aiContent);

        // Save AI message with flags (с защитой от дублирования)
        const aiMsgId = `ai_${aiContent.slice(0, 100)}`;
        if (!savedMessageIds.current.has(aiMsgId)) {
          savedMessageIds.current.add(aiMsgId);
          onSave({
            role: 'assistant',
            content: aiContent,
            flags: flags.length > 0 ? flags : undefined,
          });
        }
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
      isProcessingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (input.trim() && !isLoading && !isProcessingRef.current) {
        sendMessage();
      }
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

  const handleApplyToBlock = () => {
    if (!lastAiResponse || !onApplyToBlock) return;
    
    // Парсим флаги из последнего ответа AI
    const { flags } = parseFlagsFromResponse(lastAiResponse);
    
    // Сохраняем всё как есть - полный текст + флаги
    const blockContent: Record<string, unknown> = {
      content: lastAiResponse,
    };
    
    // Если есть флаги - добавляем их
    if (flags.length > 0) {
      blockContent['risks'] = flags;
    }
    
    onApplyToBlock(blockContent);
    toast.success('Данные применены к блоку');
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

  // Состояние для анализа рынка
  const [isMarketResearchOpen, setIsMarketResearchOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar - перетаскиваемое окно */}
      <div
        className="absolute bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
        style={{
          right: position.x,
          top: position.y,
          width: size.width,
          maxWidth: 'calc(100vw - 20px)',
          height: 'calc(100vh - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '12px',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Ручка для изменения ширины */}
        <div
          onMouseDown={handleResizeWidthMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-purple-400/50 rounded-l-xl"
          title="Перетащите для изменения ширины"
        />
        {/* Header - зона для перетаскивания */}
        <div
          onMouseDown={handleMouseDown}
          className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-purple-600 text-white rounded-t-xl select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI-ассистент</h3>
              <p className="text-sm text-purple-200">{blockName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPosition({ x: 0, y: 0 })}
              className="p-2 text-white/80 hover:text-white hover:bg-purple-700 rounded-lg transition-colors"
              title="Вернуть в правый угол"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
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
        </div>

        {/* Верхняя часть - можно менять высоту */}
        <div style={{ height: topHeight }} className="flex flex-col overflow-hidden">
          {/* Flags summary */}
          {allFlags.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 overflow-y-auto flex-1">
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
        </div>

        {/* Разделитель - можно тянуть вверх/вниз */}
        <div
          onMouseDown={handleResizeHeightMouseDown}
          className="h-1.5 cursor-ns-resize hover:bg-purple-400/50 flex-shrink-0"
          title="Перетащите для изменения высоты"
        />

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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading && !isProcessingRef.current) {
              sendMessage();
            }
          }}
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <div className="flex gap-2 items-stretch">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              rows={3}
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              
              {/* 🔍 Кнопка анализа рынка */}
              <button
                type="button"
                onClick={() => setIsMarketResearchOpen(!isMarketResearchOpen)}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                title="Анализ рынка"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* ✅ Кнопка применения к блоку */}
              {hasAiResponse && onApplyToBlock && (
                <button
                  type="button"
                  onClick={handleApplyToBlock}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  title="Применить к блоку"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* Оверлей для анализа рынка */}
      {isMarketResearchOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-2xl max-h-[85vh] bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Хедер панели */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="text-lg font-semibold">Анализ рынка</h3>
              </div>
              <button
                onClick={() => setIsMarketResearchOpen(false)}
                className="p-1.5 hover:bg-blue-700 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Контент с скроллом */}
            <div className="flex-1 overflow-y-auto">
              <MarketResearchDrawer
                isOpen={isMarketResearchOpen}
                onClose={() => setIsMarketResearchOpen(false)}
                equipmentTypeName={blockName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
