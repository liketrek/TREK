import { act } from '@testing-library/react';
import { SPLIT_QUERY, WIDE_QUERY } from '../../src/hooks/sizeClass';

/**
 * The touch shell's size class in tests (src/hooks/sizeClass.ts).
 *
 * jsdom's window is 1024×768, which the real queries would read as an iPad, so
 * every phone test would run the wide layout. tests/setup.ts answers the two
 * size-class queries from here instead: compact unless a test sets another,
 * and back to compact after each test.
 */
export type TestSizeClass = 'compact' | 'wide' | 'split';

let current: TestSizeClass = 'compact';

export function sizeClassMatches(query: string): boolean | null {
  if (query === WIDE_QUERY) return current !== 'compact';
  if (query === SPLIT_QUERY) return current === 'split';
  return null;
}

/** Switches the size class; the hooks follow as they would a rotation or a fold. */
export function setSizeClass(next: TestSizeClass): void {
  act(() => {
    current = next;
    window.dispatchEvent(new Event('resize'));
  });
}

/** Called by tests/setup.ts after each test. */
export function resetSizeClass(): void {
  current = 'compact';
}
