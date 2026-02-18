/// <reference types="vitest" />

declare module '@testing-library/react' {
  import { ReactElement, ReactNode } from 'react';

  export function render(
    ui: ReactElement,
    options?: {
      wrapper?: React.ComponentType<{ children: ReactNode }>;
      legacyRoot?: boolean;
    }
  ): { rerender: (ui: ReactElement) => void; unmount: () => void; container: HTMLElement };

  export function cleanup(): void;

  export const screen: {
    getByText(text: string | RegExp, options?: { exact?: boolean }): HTMLElement;
    getByRole(role: string, options?: { name?: string | RegExp }): HTMLElement;
    getByLabelText(text: string | RegExp, options?: { exact?: boolean }): HTMLElement;
    getByPlaceholderText(text: string | RegExp, options?: { exact?: boolean }): HTMLElement;
    queryByText(text: string | RegExp, options?: { exact?: boolean }): HTMLElement | null;
    findByText(text: string | RegExp, options?: { exact?: boolean }): Promise<HTMLElement>;
  };
}

declare module '@testing-library/dom' {
  export function waitFor<T>(callback: () => T, options?: { timeout?: number }): Promise<T>;
  export function waitForElementToBeRemoved<T>(
    callback: () => T,
    options?: { timeout?: number }
  ): Promise<T>;
}

declare module '@vitejs/plugin-react' {
  import { Plugin } from 'vite';
  export default function react(): Plugin;
}

declare module 'vitest' {
  export interface DescribeOptions {
    skip?: boolean;
    only?: boolean;
    timeout?: number;
  }

  export interface ItOptions {
    skip?: boolean;
    only?: boolean;
    timeout?: number;
    todo?: boolean;
  }

  export interface Expect {
    toBe(value: unknown): void;
    toEqual(value: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toContain(item: unknown): void;
    toThrow(error?: string | Error): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
    toBeInstanceOf(constructor: new (...args: unknown[]) => unknown): void;
    toBeGreaterThan(number: number): void;
    toBeLessThan(number: number): void;
    toBeCloseTo(num: number, numDigits?: number): void;
    toMatch(regexp: RegExp | string): void;
    toMatchObject(obj: object): void;
    toHaveProperty(key: string | string[], value?: unknown): void;
    toBeInTheDocument(): void;
    toBeVisible(): void;
    toHaveTextContent(text: string | RegExp): void;
    toHaveValue(value?: string | number | string[]): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveClass(...classNames: string[]): void;
    toBeDisabled(): void;
    toBeEnabled(): void;
    toBeChecked(): void;
    rejects: Expect;
    not: Expect;
  }

  export function describe(name: string, fn: () => void, options?: DescribeOptions): void;
  export function it(name: string, fn: () => Promise<void> | void, options?: ItOptions): void;
  export function test(name: string, fn: () => Promise<void> | void, options?: ItOptions): void;
  export function expect(value: unknown): Expect;
  export function beforeAll(fn: () => Promise<void> | void): void;
  export function afterAll(fn: () => Promise<void> | void): void;
  export function beforeEach(fn: () => Promise<void> | void): void;
  export function afterEach(fn: () => Promise<void> | void): void;
  export const vi: {
    fn<T extends (...args: unknown[]) => unknown>(fn?: T): T & { mock: ReturnType<typeof vi.fn> };
    mock(path: string, factory?: () => unknown): void;
    mocked<T>(obj: T): T;
    spyOn<T, K extends keyof T>(obj: T, method: K): ReturnType<typeof vi.fn>;
    useFakeTimers(): void;
    useRealTimers(): void;
    setSystemTime(time: number | Date): void;
    clearAllMocks(): void;
    resetAllMocks(): void;
    restoreAllMocks(): void;
    importActual<T>(module: string): Promise<T>;
  };
}

declare module '@testing-library/jest-dom' {
  export function toBeInTheDocument(): void;
  export function toBeVisible(): void;
  export function toHaveTextContent(text: string | RegExp): void;
  export function toHaveValue(value?: string | number | string[]): void;
  export function toHaveAttribute(attr: string, value?: string): void;
  export function toHaveClass(...classNames: string[]): void;
  export function toBeDisabled(): void;
  export function toBeEnabled(): void;
  export function toBeChecked(): void;
  export function toBeEmptyDOMElement(): void;
  export function toBeInvalid(): void;
  export function toBeValid(): void;
  export function toBeRequired(): void;
  export function toHaveFocus(): void;
}
