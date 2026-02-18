import { useCallback, useEffect, useState } from 'react';

/**
 * Интерфейс события beforeinstallprompt
 * Расширяет стандартный Event методами для управления установкой PWA
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Возвращаемый тип хука useInstallPWA
 */
interface UseInstallPWAResult {
  /** Функция для запуска диалога установки */
  install: () => Promise<boolean>;
  /** Приложение уже установлено */
  isInstalled: boolean;
  /** Приложение доступно для установки */
  isInstallable: boolean;
}

/**
 * Хук для управления установкой PWA приложения
 *
 * @description
 * Отслеживает событие beforeinstallprompt и предоставляет методы для:
 * - Проверки возможности установки
 * - Проверки текущего статуса установки
 * - Запуска диалога установки
 *
 * @example
 * ```tsx
 * const { install, isInstalled, isInstallable } = useInstallPWA();
 *
 * if (isInstallable && !isInstalled) {
 *   return <button onClick={install}>Установить</button>;
 * }
 * ```
 */
export function useInstallPWA(): UseInstallPWAResult {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    // Проверяем при инициализации
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone =
      'standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone: boolean }).standalone;
    return isStandalone || isIOSStandalone;
  });
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Обработчик события appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      return false;
    }

    // Показываем диалог установки
    await installPrompt.prompt();

    // Ждем выбора пользователя
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      return true;
    }

    return false;
  }, [installPrompt]);

  return { install, isInstalled, isInstallable };
}
