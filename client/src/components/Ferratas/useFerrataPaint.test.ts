// FE-FERRATA-USEPAINT-001 to FE-FERRATA-USEPAINT-003: the line colours follow the theme on <html>.
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useFerrataPaint } from './useFerrataPaint';

const root = document.documentElement;

afterEach(() => {
  root.style.removeProperty('--map-ferrata');
  root.classList.remove('dark', 'unrelated');
  root.removeAttribute('data-scheme');
});

describe('useFerrataPaint', () => {
  it('FE-FERRATA-USEPAINT-001: starts with the colours the tokens resolve to', () => {
    root.style.setProperty('--map-ferrata', 'black');
    const { result } = renderHook(() => useFerrataPaint());
    expect(result.current.line).toBe('black');
  });

  it('FE-FERRATA-USEPAINT-002: resolves again when the scheme or a token on the root changes', async () => {
    root.style.setProperty('--map-ferrata', 'black');
    const { result } = renderHook(() => useFerrataPaint());

    await act(async () => {
      root.setAttribute('data-scheme', 'forest');
      root.style.setProperty('--map-ferrata', 'ivory');
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.line).toBe('ivory'));
  });

  it('FE-FERRATA-USEPAINT-003: keeps the same reference when a change leaves every colour as it was', async () => {
    root.style.setProperty('--map-ferrata', 'black');
    const { result } = renderHook(() => useFerrataPaint());
    const first = result.current;

    await act(async () => {
      root.classList.add('unrelated');
      await Promise.resolve();
    });

    expect(result.current).toBe(first);
  });
});
