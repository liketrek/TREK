// FE-JOURNEY-MAPLAYERS-001 to FE-JOURNEY-MAPLAYERS-009
//
// JRN-04: the journey map's layer switches as kept in this browser, the marks
// the plan and the stays become, and the switches a reader is offered.
import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ALL_VISIBLE,
  buildControls,
  buildMarks,
  layersStorageKey,
  parseStoredLayers,
  readStoredLayers,
  sourcesOf,
  stateOf,
  writeStoredLayers,
} from './journeyMapLayers';

const place = (over: Partial<JourneyMapPlace> = {}): JourneyMapPlace => ({
  place_id: 4,
  trip_id: 2,
  trip_title: 'Venice',
  name: 'Piazza San Marco',
  lat: 45.434,
  lng: 12.3388,
  days: ['2026-05-14'],
  time: null,
  category_color: '#e11d48',
  category_icon: null,
  entry_id: null,
  ...over,
});

const stay = (over: Partial<JourneyMapStay> = {}): JourneyMapStay => ({
  id: 9,
  entry_id: 7,
  name: 'Rialto',
  lat: 45.438,
  lng: 12.336,
  started_at: '2026-05-14T09:00:00+02:00',
  ended_at: '2026-05-14T10:00:00+02:00',
  ...over,
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('journey map layers', () => {
  it('FE-JOURNEY-MAPLAYERS-001: keeps the switches per journey, and a link only by a hash of its token', () => {
    expect(layersStorageKey({ journeyId: 12 })).toBe('trek:journey-map-layers:12');
    const pub = layersStorageKey({ token: 'secret-token-value' });
    expect(pub).toMatch(/^trek:journey-map-layers:pub:[0-9a-z]+$/);
    expect(pub).not.toContain('secret');
    expect(layersStorageKey({ token: 'secret-token-value' })).toBe(pub);
    expect(layersStorageKey({ token: 'other' })).not.toBe(pub);
  });

  it('FE-JOURNEY-MAPLAYERS-002: reads a stored value leniently, a layer it does not name at its default', () => {
    expect(parseStoredLayers(null)).toEqual(ALL_VISIBLE);
    expect(parseStoredLayers('not json')).toEqual(ALL_VISIBLE);
    expect(parseStoredLayers('[true]')).toEqual(ALL_VISIBLE);
    expect(parseStoredLayers('{"plan":false,"photos":"no","extra":true}')).toEqual({ ...ALL_VISIBLE, plan: false });
  });

  it('FE-JOURNEY-MAPLAYERS-003: storage that refuses leaves every layer on and the switch working for the visit', () => {
    writeStoredLayers('k', { ...ALL_VISIBLE, entries: false });
    expect(readStoredLayers('k')).toEqual({ ...ALL_VISIBLE, entries: false });

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredLayers('k')).toEqual(ALL_VISIBLE);
    expect(() => writeStoredLayers('k', ALL_VISIBLE)).not.toThrow();
  });

  it('FE-JOURNEY-MAPLAYERS-004: a planned place an entry pin came from is that pin, with the check; without entries it stands alone', () => {
    const written = place({ place_id: 4, entry_id: 7 });
    const alone = place({ place_id: 5, entry_id: null, category_color: 'red;evil' });
    const onMap = new Set(['7']);

    const both = buildMarks({
      places: [written, alone],
      stays: [],
      visibility: ALL_VISIBLE,
      entryIdsOnMap: onMap,
      stayColor: () => null,
    });
    expect(both.marks.map((m) => m.key)).toEqual(['plan:5']);
    expect(both.marks[0].color).toBe('#64748b');
    expect([...both.plannedEntryIds]).toEqual(['7']);

    const noEntries = buildMarks({
      places: [written, alone],
      stays: [stay()],
      visibility: { ...ALL_VISIBLE, entries: false },
      entryIdsOnMap: onMap,
      stayColor: () => '#14b8a6',
    });
    expect(noEntries.marks.map((m) => m.key)).toEqual(['plan:4', 'plan:5']);
    expect(noEntries.plannedEntryIds.size).toBe(0);
  });

  it('FE-JOURNEY-MAPLAYERS-005: stays follow the entries switch in the colour of their day, the plan its own switch', () => {
    const marks = buildMarks({
      places: [place()],
      stays: [stay(), stay({ id: 10, entry_id: 8 })],
      visibility: { ...ALL_VISIBLE, plan: false },
      entryIdsOnMap: new Set(),
      stayColor: (entryId) => (entryId === 7 ? '#14b8a6' : null),
    }).marks;
    expect(marks.map((m) => [m.key, m.color])).toEqual([
      ['stay:9', '#14b8a6'],
      ['stay:10', '#64748b'],
    ]);
  });

  it('FE-JOURNEY-MAPLAYERS-006: a failed read makes every source unavailable; nothing read yet is idle, not empty', () => {
    expect(sourcesOf(null).places).toEqual({ status: 'unavailable' });
    expect(sourcesOf(undefined)).toEqual({});
    expect(stateOf(undefined, false, 0)).toBe('idle');
    expect(stateOf(undefined, true, 0)).toBe('loading');
    expect(stateOf({ status: 'ok', items: [] }, false, 0)).toBe('empty');
    expect(stateOf({ status: 'ok', items: [1] }, false, 1)).toBe('ready');
  });

  it('FE-JOURNEY-MAPLAYERS-007: a link offers no switch for what it withholds; a journey always offers its recordings', () => {
    const withheld = { status: 'withheld' } as const;
    const shared = buildControls({
      ownJourney: false,
      sources: { places: withheld, routes: withheld, stays: { status: 'ok', items: [] }, recordings: withheld },
      loading: false,
      counts: { places: 0, routes: 0, recordedDays: 0, entries: 3, stays: 0, photos: 0 },
    });
    expect(shared.map((c) => [c.layer, c.state])).toEqual([
      ['entries', 'ready'],
      ['photos', 'empty'],
    ]);

    const own = buildControls({
      ownJourney: true,
      sources: {},
      loading: false,
      counts: { places: 0, routes: 0, recordedDays: 2, entries: 0, stays: 0, photos: 4 },
    });
    expect(own.map((c) => [c.layer, c.state, c.count])).toEqual([
      ['plan', 'idle', 0],
      ['recorded', 'ready', 2],
      ['entries', 'empty', 0],
      ['photos', 'ready', 4],
    ]);
  });

  it('FE-JOURNEY-MAPLAYERS-008: a failed route or stay read warns on its switch while the rest still counts', () => {
    const controls = buildControls({
      ownJourney: true,
      sources: {
        places: { status: 'ok', items: [] },
        routes: { status: 'unavailable' },
        stays: { status: 'unavailable' },
      },
      loading: false,
      counts: { places: 3, routes: 0, recordedDays: 0, entries: 5, stays: 0, photos: 0 },
    });
    expect(controls.find((c) => c.layer === 'plan')).toEqual({ layer: 'plan', count: 3, state: 'unavailable' });
    expect(controls.find((c) => c.layer === 'entries')).toEqual({ layer: 'entries', count: 5, state: 'unavailable' });
  });

  it('FE-JOURNEY-MAPLAYERS-009: a journey whose recordings could not be read says so instead of nothing recorded', () => {
    const recorded = (recordedRead: 'loading' | 'ready' | 'unavailable', recordedDays: number) =>
      buildControls({
        ownJourney: true,
        sources: {},
        loading: false,
        recordedRead,
        counts: { places: 0, routes: 0, recordedDays, entries: 0, stays: 0, photos: 0 },
      }).find((c) => c.layer === 'recorded')?.state;

    expect(recorded('unavailable', 0)).toBe('unavailable');
    expect(recorded('unavailable', 2)).toBe('unavailable');
    expect(recorded('loading', 0)).toBe('loading');
    expect(recorded('loading', 1)).toBe('ready');
    expect(recorded('ready', 0)).toBe('empty');
  });
});
