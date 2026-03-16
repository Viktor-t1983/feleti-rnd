/**
 * AI Block Assistant Component
 * Чат с AI-ассистентом для блока устава
 */

import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

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
  aiPrompt: string;
  projectContext: string;
  history: AiMessage[];
  onSave: (message: { role: 'user' | 'assistant'; content: string; flags?: AiFlag[] }) => void;
  onClose: () => void;
}

const ANTHROPIC_API_KEY = (import.meta.env as Record<string, string>)['VITE_ANTHROPIC_API_KEY'] || '';

export function AiBlockAssistant({
  blockName,
  aiPrompt,
  projectContext,
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
    const flagRegex = /FLAG:(red|yellow|green):([^:]+):([^\n]+)/g;
    let match;

    while ((match = flagRegex.exec(content)) !== null) {
      if (match[1] && match[2] && match[3]) {
        flags.push({
          level: match[1] as 'red' | 'yellow' | 'green',
          title: match[2],
          text: match[3],
        });
      }
    }

    // Remove flags from content
    const cleanContent = content.replace(flagRegex, '').trim();

    return { cleanContent, flags };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AiMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      onSave({ role: 'user', content: input });

      // Prepare conversation history for API
      const conversationHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call Anthropic API
      const systemPrompt = `${aiPrompt}\n\nКонтекст проекта:\n${projectContext}\n\nПравила:\n- Задавай только ОДИН вопрос за раз\n- Если видишь риск - добавь флаг в конце ответа в формате: FLAG:red:Заголовок:Описание риска или FLAG:yellow:...\n- Не выдумывай числа и расчёты - только задавай вопросы и анализируй ответы инженера\n- Отвечай на русском языке`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiContent = data.content?.[0]?.text || 'Нет ответа от AI';

      // Parse flags from response
      const { cleanContent, flags } = parseFlagsFromResponse(aiContent);

      const aiMessage: AiMessage = {
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message with flags
      onSave({
        role: 'assistant',
        content: cleanContent,
        flags: flags.length > 0 ? flags : undefined,
      });
    } catch (error) {
      toast.error('Ошибка получения ответа от AI');
      console.error('AI API error:', error);
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
        return 'bg-red-100 border-red-300 text-red-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'green':
        return 'bg-green-100 border-green-300 text-green-800';
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🤖 AI-ассистент
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{blockName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Flags summary */}
        {allFlags.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Флаги рисков ({allFlags.length})
            </h4>
            <div className="space-y-2">
              {allFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border ${getFlagColor(flag.level)} text-sm`}
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
              <p>Начните диалог с AI-ассистентом</p>
              <p className="text-sm mt-2">Задайте вопрос или опишите параметры</p>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.timestamp && (
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-200'
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
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  <span className="text-sm">AI думает...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : '➤'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enter - отправить, Shift+Enter - новая строка
          </p>
        </div>
      </div>
    </div>
  );
}
