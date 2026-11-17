// FE-HOOK-COPIED-001 to FE-HOOK-COPIED-003
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/clipboard', () => ({ copyText: vi.fn(async () => true) }));

import { copyText } from '../utils/clipboard';
import { useCopied } from './useCopied';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useCopied', () => {
  it('FE-HOOK-COPIED-001: shows copied for two seconds, a second copy starting the time over', async () => {
    const { result } = renderHook(() => useCopied());
    await act(() => result.current.copy('https://x'));
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await act(() => result.current.copy('https://x'));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.copied).toBe(false);
  });

  it('FE-HOOK-COPIED-002: nothing to copy or a refused clipboard shows nothing', async () => {
    const { result } = renderHook(() => useCopied());
    await act(() => result.current.copy(null));
    expect(copyText).not.toHaveBeenCalledWith(null);
    vi.mocked(copyText).mockResolvedValueOnce(false);
    await act(() => result.current.copy('https://x'));
    expect(result.current.copied).toBe(false);
  });

  it('FE-HOOK-COPIED-003: unmounting clears the timer, so no state is set afterwards', async () => {
    const { result, unmount } = renderHook(() => useCopied());
    await act(() => result.current.copy('https://x'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
