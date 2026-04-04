/**
 * SortableBlock Component
 * Перетаскиваемый блок шаблона для редактора
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockType {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  blockType: string;
  isRequired: boolean;
  sortOrder: number;
  aiEnabled: boolean;
  aiPrompt?: string | null;
  aiModel?: string;
}

interface SortableBlockProps {
  block: BlockType;
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit: (block: any) => void;
  onDelete: (id: string) => void;
  getBlockTypeLabel: (type: string) => string;
}

export function SortableBlock({
  block,
  index,
  onEdit,
  onDelete,
  getBlockTypeLabel,
}: SortableBlockProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-4 ${
        isDragging ? 'ring-2 ring-blue-500 rounded-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        title="Перетащить"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      <div className="text-2xl">{block.icon || '📄'}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">
            {index + 1}. {block.name}
          </span>
          {block.isRequired && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
              Обязательный
            </span>
          )}
          {block.aiEnabled && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
              AI
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {getBlockTypeLabel(block.blockType)}
        </div>
        {block.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {block.description}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(block)}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          title="Редактировать"
        >
          ✏️
        </button>
        <button
          onClick={() => {
            if (confirm('Удалить этот блок?')) {
              onDelete(block.id);
            }
          }}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          title="Удалить"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}