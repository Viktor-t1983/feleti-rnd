/// <reference types="vitest" />

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
    fn<T extends (...args: unknown[]) => unknown>(fn?: T): T & { mock: ReturnType<typeof jest.fn> };
    mock(path: string, factory?: () => unknown): void;
    spyOn<T, K extends keyof T>(obj: T, method: K): ReturnType<typeof import('vitest').vi.fn>;
    useFakeTimers(): void;
    useRealTimers(): void;
    setSystemTime(time: number | Date): void;
    clearAllMocks(): void;
    resetAllMocks(): void;
    restoreAllMocks(): void;
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
