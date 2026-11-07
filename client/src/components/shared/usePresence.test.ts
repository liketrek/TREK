import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** The hook outside the test mode, where it really lingers for the exit animation. */
async function loadAnimated() {
  vi.resetModules();
  vi.stubEnv('MODE', 'production');
  return import('./usePresence');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('usePresence', () => {
  it('stays mounted and closing for the exit, then unmounts', async () => {
    vi.useFakeTimers();
    const { usePresence } = await loadAnimated();
    const hook = renderHook(({ open }) => usePresence(open, 170), { initialProps: { open: true } });
    expect(hook.result.current).toEqual({ mounted: true, closing: false });

    hook.rerender({ open: false });
    expect(hook.result.current).toEqual({ mounted: true, closing: true });

    act(() => {
      vi.advanceTimersByTime(170);
    });
    expect(hook.result.current).toEqual({ mounted: false, closing: false });
  });

  it('never mounts something that was never open, and reopens straight from closing', async () => {
    vi.useFakeTimers();
    const { usePresence } = await loadAnimated();
    const hook = renderHook(({ open }) => usePresence(open, 170), { initialProps: { open: false } });
    expect(hook.result.current.mounted).toBe(false);

    hook.rerender({ open: true });
    hook.rerender({ open: false });
    hook.rerender({ open: true });
    expect(hook.result.current).toEqual({ mounted: true, closing: false });
  });

  it('closes at once under the unit tests', async () => {
    vi.resetModules();
    const { usePresence } = await import('./usePresence');
    const hook = renderHook(({ open }) => usePresence(open), { initialProps: { open: true } });
    hook.rerender({ open: false });
    expect(hook.result.current.mounted).toBe(false);
  });
});

describe('useLastOpen', () => {
  it('keeps the last value seen while open', async () => {
    const { useLastOpen } = await import('./usePresence');
    const hook = renderHook(({ value, open }) => useLastOpen(value, open), {
      initialProps: { value: 'Delete Paris?' as string | null, open: true },
    });
    hook.rerender({ value: null, open: false });
    expect(hook.result.current).toBe('Delete Paris?');
    hook.rerender({ value: 'Delete Rome?', open: true });
    expect(hook.result.current).toBe('Delete Rome?');
  });
});
