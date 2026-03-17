import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: {
    fullName: string;
    username: string;
  };
}

interface FilesListProps {
  projectId: string;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  return '📎';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
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

export function FilesList({ projectId }: FilesListProps) {
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<Attachment[]>({
    queryKey: ['attachments', projectId],
    queryFn: () => api.get(`/api/projects/${projectId}/attachments`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', projectId],
      });
      toast.success('Файл удалён');
    },
    onError: () => {
      toast.error('Ошибка удаления файла');
    },
  });

  const handleDownload = (id: string, _name: string) => {
    // Используем относительный путь для работы через nginx proxy
    window.open(`/api/attachments/${id}/download`, '_blank');
  };

  const handleDelete = (id: string, name: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Удалить {name}?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteMutation.mutate(id);
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-red-500
              text-white rounded-lg text-xs"
            >
              Удалить
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200
              text-gray-800 rounded-lg text-xs"
            >
              Отмена
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-xl
              bg-gray-100 dark:bg-gray-700
              animate-pulse"
          >
            <div
              className="w-10 h-10 bg-gray-200
              dark:bg-gray-600 rounded-lg"
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 bg-gray-200
                dark:bg-gray-600 rounded w-3/4"
              />
              <div
                className="h-3 bg-gray-200
                dark:bg-gray-600 rounded w-1/2"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl mb-3">📎</p>
        <p
          className="text-sm font-medium
          text-gray-900 dark:text-white"
        >
          Нет файлов
        </p>
        <p
          className="text-xs text-gray-500
          dark:text-gray-400 mt-1"
        >
          Загрузите первый файл выше
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3
            p-3 rounded-xl hover:bg-gray-50
            dark:hover:bg-gray-700/50
            transition-colors group"
        >
          {/* Иконка */}
          <div
            className="w-10 h-10 rounded-lg
            bg-blue-50 dark:bg-blue-900/20
            flex items-center justify-center
            text-2xl shrink-0"
          >
            {getFileIcon(file.mimeType)}
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium
              text-gray-900 dark:text-white truncate"
            >
              {file.originalName}
            </p>
            <p
              className="text-xs text-gray-500
              dark:text-gray-400"
            >
              {formatFileSize(file.size)} • {file.uploadedBy.fullName} • {timeAgo(file.createdAt)}
            </p>
          </div>

          {/* Действия */}
          <div
            className="flex items-center gap-1
            opacity-0 group-hover:opacity-100
            transition-opacity"
          >
            {/* Скачать */}
            <button
              onClick={() => handleDownload(file.id, file.originalName)}
              className="p-2 rounded-lg
                text-blue-600 dark:text-blue-400
                hover:bg-blue-50
                dark:hover:bg-blue-900/20
                transition-colors"
              title="Скачать"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0
                  003-3v-1m-4-4l-4 4m0 0l-4-4m4
                  4V4"
                />
              </svg>
            </button>

            {/* Удалить */}
            <button
              onClick={() => handleDelete(file.id, file.originalName)}
              className="p-2 rounded-lg
                text-red-500
                hover:bg-red-50
                dark:hover:bg-red-900/20
                transition-colors"
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
        </div>
      ))}
    </div>
  );
}
