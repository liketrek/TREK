import { act, renderHook, waitFor } from '@testing-library/react';
import type { WandererSourceHintItem, WandererWatch } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWandererWatch, watchStatusOf } from './useWandererWatch';

const repo = vi.hoisted(() => ({ getWatch: vi.fn(), setWatch: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('../../repo/wandererRepo', () => ({ wandererRepo: repo }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key),
    locale: 'en',
  }),
}));
vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useNavigate: () => navigate,
}));

const t = (key: string) => key;
const off: WandererWatch = {
  enabled: false,
  connected: true,
  lastRunAt: null,
  pausedUntil: null,
  blocked: false,
  hints: [],
};
const hint: WandererSourceHintItem = {
  placeId: 7,
  tripId: 3,
  tripTitle: 'Alps',
  tourName: 'Ridge',
  state: 'possible_change',
  changes: [],
  reason: null,
  externalUpdated: '2026-10-14',
  checkedAt: '2026-10-20T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  repo.getWatch.mockResolvedValue(off);
  repo.setWatch.mockImplementation(async (enabled: boolean) => ({ ...off, enabled }));
});

describe('watchStatusOf (WAN-02)', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');

  it('says nothing while the watch is off', () => {
    expect(watchStatusOf(null, t, 'en', now)).toBeNull();
    expect(watchStatusOf(off, t, 'en', now)).toBeNull();
  });

  it('names a refused token first, then a pause still running, then the last look', () => {
    const on = { ...off, enabled: true };
    expect(watchStatusOf({ ...on, blocked: true, pausedUntil: '2026-10-21T00:00:00Z' }, t, 'en', now)).toEqual({
      tone: 'danger',
      text: 'wanderer.watch.blocked',
      why: 'wanderer.watch.blockedHint',
    });
    expect(watchStatusOf({ ...on, pausedUntil: '2026-10-20T14:00:00Z' }, t, 'en', now)).toMatchObject({
      tone: 'warning',
      text: 'wanderer.watch.paused',
      why: 'wanderer.watch.pausedHint',
    });
    expect(
      watchStatusOf({ ...on, pausedUntil: '2026-10-20T11:00:00Z', lastRunAt: '2026-10-20T10:00:00Z' }, t, 'en', now)
    ).toEqual({ tone: 'neutral', text: 'wanderer.watch.lastRun', why: null });
    expect(watchStatusOf(on, t, 'en', now)).toEqual({ tone: 'neutral', text: 'wanderer.watch.neverRun', why: null });
  });
});

describe('useWandererWatch (WAN-02)', () => {
  it('loads with the card and again when the connection comes or goes', async () => {
    const { result, rerender } = renderHook(({ refreshKey }) => useWandererWatch(refreshKey), {
      initialProps: { refreshKey: 'true||' },
    });
    await waitFor(() => expect(result.current.available).toBe(true));
    expect(result.current.enabled).toBe(false);
    expect(result.current.status).toBeNull();
    rerender({ refreshKey: 'true||' });
    expect(repo.getWatch).toHaveBeenCalledTimes(1);
    rerender({ refreshKey: 'false||' });
    await waitFor(() => expect(repo.getWatch).toHaveBeenCalledTimes(2));
  });

  it('drops a refused token once a connection test passes, without a reload', async () => {
    repo.getWatch.mockResolvedValueOnce({ ...off, enabled: true, blocked: true, pausedUntil: '2999-01-01T00:00:00Z' });
    repo.getWatch.mockResolvedValueOnce({ ...off, enabled: true, lastRunAt: '2026-10-20T10:00:00Z' });
    const { result, rerender } = renderHook(({ refreshKey }) => useWandererWatch(refreshKey), {
      initialProps: { refreshKey: 'true|2026-10-20T09:00:00Z|false' },
    });
    await waitFor(() => expect(result.current.status?.text).toBe('wanderer.watch.blocked'));
    rerender({ refreshKey: 'true|2026-10-20T11:00:00Z|true' });
    await waitFor(() => expect(result.current.status?.tone).toBe('neutral'));
    expect(result.current.status?.text).toMatch(/^wanderer\.watch\.lastRun/);
  });

  it('switches at once, and says so either way', async () => {
    const { result } = renderHook(() => useWandererWatch('true||'));
    await waitFor(() => expect(result.current.available).toBe(true));
    await act(async () => {
      await result.current.toggle();
    });
    expect(repo.setWatch).toHaveBeenCalledWith(true);
    expect(result.current.enabled).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('wanderer.watch.on');

    repo.setWatch.mockRejectedValueOnce(new Error('down'));
    await act(async () => {
      await result.current.toggle();
    });
    expect(toast.error).toHaveBeenCalledWith('wanderer.watch.failed');
    expect(result.current.enabled).toBe(true);
  });

  it('leaves the switch alone without a connection, or when the watch could not be read', async () => {
    repo.getWatch.mockResolvedValueOnce({ ...off, connected: false });
    const { result } = renderHook(() => useWandererWatch('false||'));
    await waitFor(() => expect(repo.getWatch).toHaveBeenCalled());
    await act(async () => {
      await result.current.toggle();
    });
    expect(repo.setWatch).not.toHaveBeenCalled();

    repo.getWatch.mockRejectedValueOnce(new Error('offline'));
    const failed = renderHook(() => useWandererWatch('true||'));
    await waitFor(() => expect(repo.getWatch).toHaveBeenCalledTimes(2));
    expect(failed.result.current.available).toBe(false);
  });

  it('lists the hints and opens the tour one is about', async () => {
    repo.getWatch.mockResolvedValue({ ...off, enabled: true, hints: [hint] });
    const { result } = renderHook(() => useWandererWatch('true||'));
    await waitFor(() => expect(result.current.hints).toEqual([hint]));
    act(() => result.current.openHints());
    expect(result.current.hintsOpen).toBe(true);
    act(() => result.current.openTour(hint));
    expect(navigate).toHaveBeenCalledWith('/trips/3?tab=plan&place=7');
    expect(result.current.hintsOpen).toBe(false);
    act(() => result.current.openHints());
    act(() => result.current.closeHints());
    expect(result.current.hintsOpen).toBe(false);
  });
});
