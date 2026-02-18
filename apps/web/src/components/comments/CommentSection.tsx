import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
  };
}

interface CommentSectionProps {
  projectId: string;
}

function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return then.toLocaleDateString('ru-RU');
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  // Загрузка комментариев (polling каждые 30 сек)
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', projectId],
    queryFn: () => api.get(`/api/projects/${projectId}/comments`).then((r) => r.data),
    refetchInterval: 30_000,
  });

  // Создание комментария
  const createMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/api/projects/${projectId}/comments`, { text }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', projectId],
      });
      setText('');
      toast.success('Комментарий добавлен!');
    },
    onError: () => {
      toast.error('Ошибка при добавлении комментария');
    },
  });

  // Удаление комментария
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.delete(`/api/projects/${projectId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', projectId],
      });
      toast.success('Комментарий удалён');
    },
    onError: () => {
      toast.error('Ошибка при удалении');
    },
  });

  const handleSubmit = () => {
    if (!text.trim()) {
      toast.error('Введите текст комментария');
      return;
    }
    if (text.length > 1000) {
      toast.error('Максимум 1000 символов');
      return;
    }
    createMutation.mutate(text);
  };

  const handleDelete = (commentId: string) => {
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm">Удалить комментарий?</span>
          <button
            onClick={() => {
              deleteMutation.mutate(commentId);
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-red-500 text-white
            rounded-lg text-xs font-medium"
          >
            Удалить
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-200 text-gray-800
            rounded-lg text-xs font-medium"
          >
            Отмена
          </button>
        </div>
      ),
      { duration: 5000 }
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-800
      rounded-2xl border border-gray-200
      dark:border-gray-700 p-6"
    >
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-6">
        <svg
          className="w-5 h-5 text-gray-500
          dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0
            4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949
            L3 20l1.395-3.72C3.512 15.042 3 13.574 3
            12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3
          className="text-lg font-semibold
          text-gray-900 dark:text-white"
        >
          Комментарии
        </h3>
        <span
          className="text-sm text-gray-500
          dark:text-gray-400 bg-gray-100
          dark:bg-gray-700 px-2 py-0.5 rounded-full"
        >
          {comments.length}
        </span>
      </div>

      {/* Форма добавления */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          {/* Аватар текущего пользователя */}
          <div
            className="w-9 h-9 rounded-full
            bg-blue-600 flex items-center justify-center
            text-white font-semibold text-sm shrink-0"
          >
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit();
                }
              }}
              placeholder="Написать комментарий...
(Ctrl+Enter для отправки)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl
                border border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-700
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-transparent
                resize-none text-sm"
            />

            <div
              className="flex items-center
              justify-between mt-2"
            >
              <span className={`text-xs ${text.length > 900 ? 'text-red-500' : 'text-gray-400'}`}>
                {text.length}/1000
              </span>

              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !text.trim()}
                className="flex items-center gap-2
                  px-4 py-2 rounded-xl bg-blue-600
                  hover:bg-blue-700 disabled:bg-blue-400
                  disabled:cursor-not-allowed
                  text-white text-sm font-medium
                  transition-colors duration-200"
              >
                {createMutation.isPending ? (
                  <>
                    <div
                      className="w-3.5 h-3.5 border-2
                      border-white border-t-transparent
                      rounded-full animate-spin"
                    />
                    Отправка...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0
                        0v-8"
                      />
                    </svg>
                    Отправить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Список комментариев */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div
                className="w-9 h-9 rounded-full
                bg-gray-200 dark:bg-gray-700"
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-3 bg-gray-200
                  dark:bg-gray-700 rounded w-1/4"
                />
                <div
                  className="h-4 bg-gray-200
                  dark:bg-gray-700 rounded w-3/4"
                />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">💬</p>
          <p
            className="text-sm font-medium
            text-gray-900 dark:text-white"
          >
            Нет комментариев
          </p>
          <p
            className="text-xs text-gray-500
            dark:text-gray-400 mt-1"
          >
            Будьте первым!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              {/* Аватар */}
              <div
                className="w-9 h-9 rounded-full
                bg-purple-500 flex items-center
                justify-center text-white font-semibold
                text-sm shrink-0"
              >
                {comment.author.fullName?.[0]?.toUpperCase() || '?'}
              </div>

              {/* Контент */}
              <div className="flex-1 min-w-0">
                <div
                  className="flex items-center
                  justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold
                      text-gray-900 dark:text-white"
                    >
                      {comment.author.fullName}
                    </span>
                    <span
                      className="text-xs
                      text-gray-500 dark:text-gray-400"
                    >
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {/* Кнопка удаления */}
                  {(user?.id === comment.author.id || user?.role === 'Admin') && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100
                        text-gray-400 hover:text-red-500
                        transition-all duration-200 p-1
                        rounded"
                      title="Удалить комментарий"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0
                          0116.138 21H7.862a2 2 0
                          01-1.995-1.858L5 7m5 4v6m4-6v6
                          m1-10V4a1 1 0 00-1-1h-4a1 1 0
                          00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Текст комментария */}
                <p
                  className="text-sm text-gray-700
                  dark:text-gray-300 mt-1 leading-relaxed
                  whitespace-pre-wrap"
                >
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
