// FE-JOURNEY-MAPLAYERS-HOOK-001 to FE-JOURNEY-MAPLAYERS-HOOK-005
//
// JRN-04: the journey map's layers as the desktop page, the phone screen and
// the shared page use them: read lazily, switched per reader, a failed source
// on its own.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { JourneyMapPlace, JourneyTrack } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { journeyMapRepo } from '../../repo/journeyMapRepo';
import { useJourneyMapLayers } from './useJourneyMapLayers';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, string>) => (p?.date ? `${k}:${p.date}` : k),
    locale: 'en',
  }),
}));

const PLACE: JourneyMapPlace = {
  place_id: 4,
  trip_id: 2,
  trip_title: 'Venice',
  name: 'Piazza San Marco',
  lat: 45.434,
  lng: 12.3388,
  days: ['2026-05-14'],
  time: null,
  category_color: null,
  category_icon: null,
  entry_id: null,
};
const ROUTE: JourneyTrack = {
  place_id: 4,
  trip_id: 2,
  name: 'Ridge',
  color: null,
  points: [
    [1, 1],
    [2, 2],
  ],
  kind: 'trip_gpx',
};
const NO_ENTRIES: ReadonlySet<string> = new Set();
const colorOfDay = () => '#14b8a6';
const dateOfEntry = () => '2026-05-14';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function journeyMap(journeyId: number | null = 7, recordedTracks: JourneyTrack[] = []) {
  return renderHook(() =>
    useJourneyMapLayers({
      source: journeyId === null ? null : { journeyId },
      entryIdsOnMap: NO_ENTRIES,
      photoCount: 2,
      recordedTracks,
      colorOfDay,
      dateOfEntry,
    })
  );
}

describe('useJourneyMapLayers', () => {
  it('FE-JOURNEY-MAPLAYERS-HOOK-001: reads the journey layers once it is loaded and draws the plan with its routes', async () => {
    const layers = vi.spyOn(journeyMapRepo, 'layers').mockResolvedValue({
      places: { status: 'ok', items: [PLACE] },
      routes: { status: 'ok', items: [ROUTE] },
      stays: { status: 'ok', items: [] },
    });
    const { result } = journeyMap();

    await waitFor(() => expect(result.current.marks).toHaveLength(1));
    expect(layers).toHaveBeenCalledWith(7, expect.any(AbortSignal));
    expect(result.current.tracks).toEqual([ROUTE]);
    expect(result.current.controls.find((c) => c.layer === 'plan')).toEqual({
      layer: 'plan',
      count: 1,
      state: 'ready',
    });
    expect(result.current.controls.find((c) => c.layer === 'photos')).toEqual({
      layer: 'photos',
      count: 2,
      state: 'ready',
    });
  });

  it('FE-JOURNEY-MAPLAYERS-HOOK-002: reads nothing before the journey is loaded, nor while plan and entries are off', async () => {
    const layers = vi.spyOn(journeyMapRepo, 'layers').mockResolvedValue({
      places: { status: 'ok', items: [] },
      routes: { status: 'ok', items: [] },
      stays: { status: 'ok', items: [] },
    });
    journeyMap(null);
    localStorage.setItem('trek:journey-map-layers:8', JSON.stringify({ plan: false, entries: false }));
    const { result } = journeyMap(8);

    expect(result.current.visibility).toMatchObject({ plan: false, entries: false, recorded: true, photos: true });
    expect(result.current.controls.find((c) => c.layer === 'plan')?.state).toBe('idle');
    await act(async () => {});
    expect(layers).not.toHaveBeenCalled();

    act(() => result.current.toggle('plan'));
    await waitFor(() => expect(layers).toHaveBeenCalledWith(8, expect.any(AbortSignal)));
    expect(JSON.parse(localStorage.getItem('trek:journey-map-layers:8') ?? '{}')).toMatchObject({
      plan: true,
      entries: false,
    });
  });

  it('FE-JOURNEY-MAPLAYERS-HOOK-002b: the phone shows every layer whatever was kept, and keeps no switch', () => {
    vi.spyOn(journeyMapRepo, 'layers').mockResolvedValue({
      places: { status: 'ok', items: [] },
      routes: { status: 'ok', items: [] },
      stays: { status: 'ok', items: [] },
    });
    localStorage.setItem('trek:journey-map-layers:8', JSON.stringify({ plan: false, entries: false }));
    const { result } = renderHook(() =>
      useJourneyMapLayers({
        source: { journeyId: 8 },
        entryIdsOnMap: NO_ENTRIES,
        photoCount: 0,
        colorOfDay,
        dateOfEntry,
        allLayers: true,
      })
    );

    expect(result.current.visibility).toMatchObject({ plan: true, entries: true, recorded: true, photos: true });
    act(() => result.current.toggle('photos'));
    expect(result.current.visibility.photos).toBe(false);
    expect(JSON.parse(localStorage.getItem('trek:journey-map-layers:8') ?? '{}')).toEqual({
      plan: false,
      entries: false,
    });
  });

  it('FE-JOURNEY-MAPLAYERS-HOOK-003: a read that fails says so on the plan and the entries, and the recordings still draw', async () => {
    vi.spyOn(journeyMapRepo, 'layers').mockRejectedValue(new Error('down'));
    const recorded: JourneyTrack = {
      place_id: -100001,
      trip_id: 0,
      name: 'Day 1',
      color: '#000000',
      points: [
        [1, 1],
        [2, 2],
      ],
      kind: 'day_recording',
    };
    const { result } = journeyMap(7, [recorded]);

    await waitFor(() => expect(result.current.controls.find((c) => c.layer === 'plan')?.state).toBe('unavailable'));
    expect(result.current.controls.find((c) => c.layer === 'entries')?.state).toBe('unavailable');
    expect(result.current.controls.find((c) => c.layer === 'recorded')).toEqual({
      layer: 'recorded',
      count: 1,
      state: 'ready',
    });
    expect(result.current.tracks).toEqual([recorded]);
  });

  it('FE-JOURNEY-MAPLAYERS-HOOK-004: a shared page draws the recorded days a link shares, each piece apart, and offers no plan it withholds', async () => {
    vi.spyOn(journeyMapRepo, 'publicLayers').mockResolvedValue({
      places: { status: 'withheld' },
      routes: { status: 'withheld' },
      stays: { status: 'ok', items: [] },
      recordings: {
        status: 'ok',
        items: [
          {
            date: '2026-05-14',
            pieces: [
              [
                [1, 1],
                [2, 2],
              ],
              [
                [3, 3],
                [4, 4],
              ],
            ],
            distance_m: 1200,
          },
        ],
      },
    });
    const { result } = renderHook(() =>
      useJourneyMapLayers({
        source: { token: 'tok' },
        entryIdsOnMap: NO_ENTRIES,
        photoCount: 0,
        colorOfDay,
        dateOfEntry,
      })
    );

    await waitFor(() => expect(result.current.tracks).toHaveLength(2));
    expect(result.current.tracks.every((track) => track.kind === 'day_recording' && track.color === '#14b8a6')).toBe(
      true
    );
    expect(result.current.controls.map((c) => c.layer)).toEqual(['recorded', 'entries', 'photos']);
    expect(result.current.controls[0]).toEqual({ layer: 'recorded', count: 1, state: 'ready' });
  });

  it('FE-JOURNEY-MAPLAYERS-HOOK-005: switching the plan off takes its marks away without reading again', async () => {
    const layers = vi.spyOn(journeyMapRepo, 'layers').mockResolvedValue({
      places: { status: 'ok', items: [PLACE] },
      routes: { status: 'ok', items: [] },
      stays: { status: 'ok', items: [] },
    });
    const { result } = journeyMap();
    await waitFor(() => expect(result.current.marks).toHaveLength(1));

    act(() => result.current.toggle('plan'));
    expect(result.current.marks).toHaveLength(0);
    expect(result.current.visibility.plan).toBe(false);
    expect(layers).toHaveBeenCalledTimes(1);
  });
});
