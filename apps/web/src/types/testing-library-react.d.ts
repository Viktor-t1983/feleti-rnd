/**
 * Type declarations for @testing-library/react
 */

declare module '@testing-library/react' {
  import { ReactElement } from 'react';

  export interface RenderOptions {
    wrapper?: React.ComponentType<unknown>;
    hydrate?: boolean;
  }

  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (element?: HTMLElement) => void;
    rerender: (ui: ReactElement) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
  }

  export function render(ui: ReactElement, options?: RenderOptions): RenderResult;

  export function cleanup(): void;

  export function act(callback: () => void): Promise<undefined>;

  export function waitFor(
    callback: () => void,
    options?: {
      timeout?: number;
      interval?: number;
    }
  ): Promise<undefined>;

  export function waitForElementToBeRemoved(
    callback: () => HTMLElement,
    options?: {
      timeout?: number;
      interval?: number;
    }
  ): Promise<undefined>;

  export function within(
    element: HTMLElement,
    options?: { selector?: string }
  ): {
    getByText: (text: string | RegExp) => HTMLElement;
    getByRole: (role: string, options?: object) => HTMLElement;
    getByLabelText: (text: string | RegExp) => HTMLElement;
    getByPlaceholderText: (text: string | RegExp) => HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    queryByText: (text: string | RegExp) => HTMLElement | null;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByRole: (role: string, options?: object) => Promise<HTMLElement>;
  };

  export function getByText(
    container: HTMLElement,
    text: string | RegExp,
    options?: { selector?: string }
  ): HTMLElement;

  export function getByRole(container: HTMLElement, role: string, options?: object): HTMLElement;

  export function getByLabelText(
    container: HTMLElement,
    text: string | RegExp,
    options?: { selector?: string }
  ): HTMLElement;

  export function getByPlaceholderText(container: HTMLElement, text: string | RegExp): HTMLElement;

  export function getByTestId(container: HTMLElement, id: string): HTMLElement;

  export function queryByText(container: HTMLElement, text: string | RegExp): HTMLElement | null;

  export function findByText(container: HTMLElement, text: string | RegExp): Promise<HTMLElement>;

  export function findByRole(
    container: HTMLElement,
    role: string,
    options?: object
  ): Promise<HTMLElement>;

  export const screen: {
    getByText: (text: string | RegExp) => HTMLElement;
    getByRole: (role: string, options?: object) => HTMLElement;
    getByLabelText: (text: string | RegExp) => HTMLElement;
    getByPlaceholderText: (text: string | RegExp) => HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    queryByText: (text: string | RegExp) => HTMLElement | null;
    findByText: (text: string | RegExp) => Promise<HTMLElement>;
    findByRole: (role: string, options?: object) => Promise<HTMLElement>;
  };
}
