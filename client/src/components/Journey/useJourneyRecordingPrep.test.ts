// FE-JRN-PREP-HOOK-001 to FE-JRN-PREP-HOOK-007
//
// JRN-03: a journey preparing its recorded days, as the journey page, the
// phone screen and both settings shells read it: the caller's status, the
// owner's switch that fetches at once when turned on, a fetch by hand, and
// where each day of the linked trips stands.
import type { JourneyRecordingPrep } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { useJourneyStore } from '../../store/journeyStore';
import { useJourneyRecordingPrep, type JourneyRecordingPrepOptions } from './useJourneyRecordingPrep';

const repo = vi.hoisted(() => ({ prep: vi.fn() }));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));
const dawarich = vi.hoisted(() => ({ syncNow: vi.fn() }));
vi.mock('../../repo/dawarichRepo', () => ({ dawarichRepo: dawarich }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const updateJourney = vi.fn(async (_id: number, _data: Record<string, unknown>) => {});
const PERIOD = new Set(['2026-05-14', '2026-05-15']);

function status(over: Partial<JourneyRecordingPrep> = {}): JourneyRecordingPrep {
  return {
    enabled: true,
    connection: 'ready',
    lastAttemptAt: '2026-05-16T08:00:00.000Z',
    lastSuccessAt: '2026-05-16T08:00:00.000Z',
    lastError: null,
    ...over,
  };
}

function options(over: Partial<JourneyRecordingPrepOptions> = {}): JourneyRecordingPrepOptions {
  return {
    journeyId: 7,
    enabled: true,
    active: true,
    periodDates: PERIOD,
    onSwitched: vi.fn(),
    onFetched: vi.fn(),
    ...over,
  };
}

beforeEach(() => {
  repo.prep.mockReset().mockResolvedValue(status());
  dawarich.syncNow.mockReset().mockResolvedValue({ state: 'ok', created: 0, updated: 0, missing: 0 });
  updateJourney.mockClear();
  toast.error.mockClear();
  toast.info.mockClear();
  useJourneyStore.setState({ updateJourney });
});

describe('useJourneyRecordingPrep', () => {
  it('FE-JRN-PREP-HOOK-001: reads the caller status and answers for each day of the linked trips', async () => {
    const { result } = renderHook(() => useJourneyRecordingPrep(options()));

    await waitFor(() => expect(result.current.prep).not.toBeNull());
    expect(repo.prep).toHaveBeenCalledWith(7, expect.any(AbortSignal));
    expect(result.current.statusLine?.tone).toBe('muted');
    expect(result.current.canFetch).toBe(true);
    expect(result.current.dayPrep('2026-05-14')?.state).toBe('complete');
    expect(result.current.dayPrep('2026-05-20')).toBeNull();
  });

  it('FE-JRN-PREP-HOOK-002: reads nothing for a reader or without the addon', async () => {
    const { result } = renderHook(() => useJourneyRecordingPrep(options({ active: false })));
    await act(async () => {});
    expect(repo.prep).not.toHaveBeenCalled();
    expect(result.current.prep).toBeNull();
    expect(result.current.statusLine).toBeNull();
    expect(result.current.canFetch).toBe(false);
  });

  it('FE-JRN-PREP-HOOK-003: switching on saves the journey and fetches at once; switching off only saves', async () => {
    repo.prep.mockResolvedValue(status({ enabled: false }));
    const opts = options({ enabled: false });
    const { result } = renderHook(() => useJourneyRecordingPrep(opts));
    await waitFor(() => expect(result.current.prep).not.toBeNull());

    await act(async () => {
      await result.current.setEnabled(true);
    });
    expect(updateJourney).toHaveBeenCalledWith(7, { auto_prepare_recordings: true });
    expect(opts.onSwitched).toHaveBeenCalledTimes(1);
    expect(dawarich.syncNow).toHaveBeenCalledTimes(1);
    expect(opts.onFetched).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.setEnabled(false);
    });
    expect(updateJourney).toHaveBeenLastCalledWith(7, { auto_prepare_recordings: false });
    expect(dawarich.syncNow).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-PREP-HOOK-004: a switch that fails to save says so and fetches nothing', async () => {
    updateJourney.mockRejectedValueOnce(new Error('down'));
    const opts = options({ enabled: false });
    const { result } = renderHook(() => useJourneyRecordingPrep(opts));
    await waitFor(() => expect(result.current.prep).not.toBeNull());

    await act(async () => {
      await result.current.setEnabled(true);
    });
    expect(toast.error).toHaveBeenCalledWith('journey.settings.saveFailed');
    expect(opts.onSwitched).not.toHaveBeenCalled();
    expect(dawarich.syncNow).not.toHaveBeenCalled();
  });

  it('FE-JRN-PREP-HOOK-005: a fetch by hand reads the status again, and one that cannot reach Dawarich says so', async () => {
    const opts = options();
    const { result } = renderHook(() => useJourneyRecordingPrep(opts));
    await waitFor(() => expect(repo.prep).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.fetchNow();
    });
    expect(opts.onFetched).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(repo.prep).toHaveBeenCalledTimes(2));
    expect(result.current.fetching).toBe(false);

    dawarich.syncNow.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.fetchNow();
    });
    expect(toast.error).toHaveBeenCalledWith('journey.prep.fetchFailed');
    await waitFor(() => expect(repo.prep).toHaveBeenCalledTimes(3));
  });

  it('FE-JRN-PREP-HOOK-006: a fetch while the background run is busy says so instead of looking like nothing happened', async () => {
    dawarich.syncNow.mockResolvedValue({ state: 'ok', created: 0, updated: 0, missing: 0, alreadyRunning: true });
    const { result } = renderHook(() => useJourneyRecordingPrep(options()));
    await waitFor(() => expect(result.current.prep).not.toBeNull());

    await act(async () => {
      await result.current.fetchNow();
    });
    expect(toast.info).toHaveBeenCalledWith('journey.prep.alreadyRunning');
  });

  it('FE-JRN-PREP-HOOK-007: a journey whose trips all ended out of reach marks no day and offers no fetch', async () => {
    repo.prep.mockResolvedValue(status({ periods: [] }));
    const { result } = renderHook(() => useJourneyRecordingPrep(options()));
    await waitFor(() => expect(result.current.prep).not.toBeNull());

    expect(result.current.dayPrep('2026-05-14')).toBeNull();
    expect(result.current.canFetch).toBe(false);
    expect(result.current.statusLine).toEqual({
      text: 'journey.prep.outOfReach',
      tone: 'warning',
    });
  });
});
