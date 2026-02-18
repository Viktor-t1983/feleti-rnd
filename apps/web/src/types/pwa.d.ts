/**
 * PWA type declarations for virtual:pwa-register
 * This module is virtual and provided by vite-plugin-pwa at build time
 */

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  /**
   * Register a Service Worker for PWA
   * @param options Configuration options for the service worker
   * @returns A function to update the service worker
   */
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void;
}
