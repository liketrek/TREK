// FE-JRN-RECORDINGS-HOOK-001 to FE-JRN-RECORDINGS-HOOK-006
//
// JRN-01: the recorded days a journey keeps, as the desktop page and the phone
// screen read them: the list, the lines they draw on the map, which day's
// dialog is open, and a fresh read whenever somebody keeps or drops a day.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRecordedDay, WALK_SEGMENT } from '../../../tests/helpers/journeyRecording';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { useJourneyRecordings } from './useJourneyRecordings';

const repo = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const pings = vi.hoisted(() => ({ handlers: new Map<string, () => Promise<void>>() }));
vi.mock('../../sync/useServerPing', () => ({
  useServerPing: (event: string, enabled: boolean, reload: () => Promise<void>) => {
    if (enabled) pings.handlers.set(event, reload);
  },
}));

const JOURNEY = { id: 7, title: 'Venice' };
const colorOf = (date: string) => (date === '2026-05-14' ? '#ff0055' : null);

beforeEach(() => {
  repo.list.mockReset();
  pings.handlers.clear();
});

describe('useJourneyRecordings', () => {
  it('FE-JRN-RECORDINGS-HOOK-001: reads the kept days and draws each piece as a recorded line in its day’s colour', async () => {
    const second = {
      ...WALK_SEGMENT,
      points: [
        [45.44, 12.33],
        [45.45, 12.34],
      ] as Array<[number, number]>,
    };
    repo.list.mockResolvedValue([
      buildRecordedDay({ segments: [WALK_SEGMENT, second] }),
      buildRecordedDay({ id: 4, date: '2026-05-15' }),
    ]);

    const { result } = renderHook(() => useJourneyRecordings(JOURNEY, colorOf));

    await waitFor(() => expect(result.current.days).toHaveLength(2));
    expect(repo.list).toHaveBeenCalledWith(7);
    expect(result.current.byDate.get('2026-05-15')?.id).toBe(4);
    expect(result.current.tracks).toHaveLength(3);
    expect(result.current.tracks.every((track) => track.kind === 'day_recording')).toBe(true);
    // One line per piece: a gap between two pieces is never drawn over.
    expect(result.current.tracks.slice(0, 2).map((track) => track.points)).toEqual([
      WALK_SEGMENT.points,
      second.points,
    ]);
    expect(result.current.tracks[0]?.color).toBe('#ff0055');
    // A day without entries takes the colour of the live recording.
    expect(result.current.tracks[2]?.color).toBe('#2563EB');
    const ids = result.current.tracks.map((track) => track.place_id);
    expect(ids.every((id) => id < -1000)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('FE-JRN-RECORDINGS-HOOK-002: no journey yet, nothing asked', () => {
    const { result } = renderHook(() => useJourneyRecordings(null, colorOf));
    expect(repo.list).not.toHaveBeenCalled();
    expect(result.current.tracks).toEqual([]);
    expect(result.current.dialog).toBeNull();
  });

  it('FE-JRN-RECORDINGS-HOOK-003: a failed read keeps what the map already showed', async () => {
    repo.list.mockResolvedValueOnce([buildRecordedDay()]);
    const { result } = renderHook(() => useJourneyRecordings(JOURNEY, colorOf));
    await waitFor(() => expect(result.current.days).toHaveLength(1));

    repo.list.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await pings.handlers.get('journey:recording:updated')?.();
    });
    expect(result.current.days).toHaveLength(1);
  });

  it('FE-JRN-RECORDINGS-HOOK-004: reads again when somebody on the journey keeps or drops a day', async () => {
    repo.list.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useJourneyRecordings(JOURNEY, colorOf));
    await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(1));

    repo.list.mockResolvedValueOnce([buildRecordedDay()]);
    await act(async () => {
      await pings.handlers.get('journey:recording:updated')?.();
    });
    expect(result.current.byDate.has('2026-05-14')).toBe(true);
  });

  it('FE-JRN-RECORDINGS-HOOK-005: opens a day’s dialog with what it keeps, and shows a kept or dropped day at once', async () => {
    repo.list.mockResolvedValue([]);
    const { result } = renderHook(() => useJourneyRecordings(JOURNEY, colorOf));
    await waitFor(() => expect(repo.list).toHaveBeenCalled());

    act(() => result.current.open('2026-05-14'));
    expect(result.current.dialog).toMatchObject({
      journeyId: 7,
      journeyTitle: 'Venice',
      date: '2026-05-14',
      stored: undefined,
    });

    act(() => result.current.kept(buildRecordedDay()));
    expect(result.current.dialog?.stored?.id).toBe(3);
    expect(result.current.tracks).toHaveLength(1);

    act(() => result.current.removed('2026-05-14'));
    expect(result.current.days).toEqual([]);
    act(() => result.current.close());
    expect(result.current.dialog).toBeNull();
  });

  it('FE-JRN-RECORDINGS-HOOK-006: a first read that fails says so, rather than passing for a journey that kept no day', async () => {
    repo.list.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useJourneyRecordings(JOURNEY, colorOf));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.days).toEqual([]);

    repo.list.mockResolvedValueOnce([buildRecordedDay()]);
    await act(async () => {
      await pings.handlers.get('journey:recording:updated')?.();
    });
    expect(result.current.status).toBe('ready');
  });
});
