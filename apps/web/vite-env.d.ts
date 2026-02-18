/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void;
}

declare module 'vite-plugin-pwa' {
  import { Plugin } from 'vite';
  interface VitePWAOptions {
    registerType?: 'autoUpdate' | 'prompt';
    includeAssets?: string[];
    manifest?: object;
    workbox?: object;
    devOptions?: object;
  }
  export function VitePWA(options?: VitePWAOptions): Plugin;
}

declare module '@vitejs/plugin-react' {
  import { Plugin } from 'vite';
  interface ReactPluginOptions {
    jsxRuntime?: 'classic' | 'automatic';
    babel?: {
      plugins?: string[];
      parserOpts?: object;
    };
  }
  export default function react(options?: ReactPluginOptions): Plugin;
}

declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite';
  export default function tailwindcss(): Plugin;
}

declare module '@playwright/test' {
  export interface TestConfig {
    testDir?: string;
    fullyParallel?: boolean;
    forbidOnly?: boolean;
    retries?: number;
    workers?: number | undefined;
    reporter?: string | Array<{ reporter: string; outputFile?: string }>;
    timeout?: number;
    use?: {
      baseURL?: string;
      trace?: 'on' | 'off' | 'retain-on-failure' | 'on-first-retry';
      screenshot?: 'on' | 'off' | 'only-on-failure';
      video?: 'on' | 'off' | 'retain-on-failure';
    };
    projects?: Array<{
      name: string;
      use?: Record<string, unknown>;
    }>;
    webServer?: {
      command?: string;
      url?: string;
      reuseExistingServer?: boolean;
    };
  }

  export interface TestOptions {
    baseURL?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const devices: any;

  export function defineConfig(config: TestConfig): TestConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function test(title: string, fn: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function describe(title: string, fn: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const expect: any;
}
