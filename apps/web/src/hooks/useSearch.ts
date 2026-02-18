import { useCallback, useEffect, useState } from 'react';

/**
 * Хук для управления глобальным поиском
 * Открывает/закрывает модальное окно поиска по Ctrl+K
 */
export function useSearch() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Ctrl+K открывает поиск
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем Ctrl+K или Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}
