import { act } from '@testing-library/react';
import { afterEach } from 'vitest';
import { _pinSizeClass, _resetSizeClass } from '../../src/hooks/sizeClass';

/**
 * The touch shell's size class in tests (src/hooks/sizeClass.ts).
 *
 * jsdom is a browser, where the class is always compact, so a test of the
 * large-screen layout pins the class it wants instead of faking the app and a
 * window size. Importing this helper also hands the class back to the window
 * after each test of the file.
 *
 * Not imported by tests/setup.ts on purpose: sizeClass.ts reads native/platform,
 * and a module a setup file imports is cached before a test file's vi.mock of it
 * can take effect.
 */
export type TestSizeClass = 'compact' | 'wide' | 'split';

/** Switches the size class; the hooks follow as they would a rotation or a fold. */
export function setSizeClass(next: TestSizeClass): void {
  act(() => _pinSizeClass(next));
}

/** Back to what the window says (compact in jsdom). */
export function resetSizeClass(): void {
  _pinSizeClass(null);
  _resetSizeClass();
}

afterEach(() => resetSizeClass());
