import { fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

/**
 * Presses a control that opens the browser's file picker by building an
 * `<input type="file">` and clicking it, and hands that picker `files` the way
 * a user choosing them would. Returns the picker, or null when the press built none.
 */
export function pickFiles(control: HTMLElement, files: File[]): HTMLInputElement | null {
  const createElement = document.createElement.bind(document);
  let picker: HTMLInputElement | null = null;
  const spy = vi.spyOn(document, 'createElement').mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions
  ) => {
    const element = createElement(tagName, options);
    if (tagName.toLowerCase() === 'input') {
      picker = element as HTMLInputElement;
      vi.spyOn(picker, 'click').mockImplementation(() => undefined);
    }
    return element;
  }) as typeof document.createElement);
  fireEvent.click(control);
  spy.mockRestore();
  if (!picker) return null;
  const input: HTMLInputElement = picker;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
  return input;
}
