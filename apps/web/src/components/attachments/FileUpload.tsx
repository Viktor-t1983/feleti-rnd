import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  projectId: string;
}

export function FileUpload({ projectId }: FileUploadProps) {
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return api
        .post(`/api/projects/${projectId}/attachments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', projectId],
      });
      toast.success('Файл загружен!');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    onError: (e: unknown) => {
      const error = e as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Ошибка загрузки файла');
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    // Проверка размера (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Максимальный размер: 20MB');
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`relative border-2 border-dashed
        rounded-2xl p-8 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="file-upload"
        disabled={uploadMutation.isPending}
      />

      <label
        htmlFor="file-upload"
        className="flex flex-col items-center
          justify-center cursor-pointer"
      >
        {uploadMutation.isPending ? (
          <>
            <div
              className="w-12 h-12 border-4
              border-blue-500 border-t-transparent
              rounded-full animate-spin mb-4"
            />
            <p
              className="text-sm text-gray-600
              dark:text-gray-400"
            >
              Загружаем файл...
            </p>
          </>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-gray-400
              mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0
                1115.9 6L16 6a5 5 0 011 9.9M15
                13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p
              className="text-sm font-medium
              text-gray-900 dark:text-white mb-1"
            >
              Нажмите для выбора или перетащите файл
            </p>
            <p
              className="text-xs text-gray-500
              dark:text-gray-400"
            >
              PDF, DOC, XLS, изображения, архивы (макс. 20MB)
            </p>
          </>
        )}
      </label>
    </div>
  );
}
