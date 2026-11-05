// FE-JRN-CONN-001 to FE-JRN-CONN-008
import type { JourneyTrack } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { coveredConnectionsShown, entryConnections } from './journeyMapConnections';

const stop = (lat: number, date: string) => ({ lat, lng: lat, date });

function recorded(
  date: string,
  kind: JourneyTrack['kind'] = 'day_recording',
  points: [number, number][] = [
    [1, 1],
    [2, 2],
  ]
): JourneyTrack {
  return { place_id: -1, trip_id: 0, name: date, color: null, points, kind, date };
}

describe('entryConnections (#2888)', () => {
  it('FE-JRN-CONN-001: without a recording the whole line stays open, one polyline through every stop', () => {
    const result = entryConnections([stop(1, '2026-10-29'), stop(2, '2026-10-29'), stop(3, '2026-10-30')], []);
    expect(result.open).toEqual([
      [
        [1, 1],
        [2, 2],
        [3, 3],
      ],
    ]);
    expect(result.covered).toEqual([]);
  });

  it('FE-JRN-CONN-002: a recorded day covers the stretches between its entries, the jump into a day without one stays open', () => {
    const result = entryConnections(
      [stop(1, '2026-10-29'), stop(2, '2026-10-29'), stop(3, '2026-10-30'), stop(4, '2026-10-30')],
      [recorded('2026-10-29', 'dawarich_live')]
    );
    expect(result.covered).toEqual([
      [
        [1, 1],
        [2, 2],
      ],
    ]);
    expect(result.open).toEqual([
      [
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    ]);
  });

  it('FE-JRN-CONN-003: the night between two recorded days is covered, a day in between without one is not', () => {
    const tracks = [recorded('2026-10-29'), recorded('2026-10-30'), recorded('2026-11-01')];
    expect(entryConnections([stop(1, '2026-10-29'), stop(2, '2026-10-30')], tracks).open).toEqual([]);
    expect(entryConnections([stop(1, '2026-10-30'), stop(2, '2026-11-01')], tracks).covered).toEqual([]);
  });

  it('FE-JRN-CONN-004: a trip GPX, a line without a day and a recording without points cover nothing', () => {
    const stops = [stop(1, '2026-10-29'), stop(2, '2026-10-29')];
    const gpx: JourneyTrack = { ...recorded('2026-10-29'), kind: 'trip_gpx' };
    const undated: JourneyTrack = { ...recorded('2026-10-29'), date: undefined };
    const empty = recorded('2026-10-29', 'day_recording', [[1, 1]]);
    expect(entryConnections(stops, [gpx, undated, empty]).covered).toEqual([]);
  });

  it('FE-JRN-CONN-005: open and covered stretches alternate in the order of the stops', () => {
    const result = entryConnections(
      [
        stop(1, '2026-10-28'),
        stop(2, '2026-10-29'),
        stop(3, '2026-10-29'),
        stop(4, '2026-10-31'),
        stop(5, '2026-10-31'),
      ],
      [recorded('2026-10-29'), recorded('2026-10-31')]
    );
    expect(result.open).toEqual([
      [
        [1, 1],
        [2, 2],
      ],
      [
        [3, 3],
        [4, 4],
      ],
    ]);
    expect(result.covered).toEqual([
      [
        [2, 2],
        [3, 3],
      ],
      [
        [4, 4],
        [5, 5],
      ],
    ]);
  });

  it('FE-JRN-CONN-006: a timestamp is read by its day, and an unreadable date never counts as recorded', () => {
    expect(
      entryConnections([stop(1, '2026-10-29T08:00:00Z'), stop(2, '2026-10-29')], [recorded('2026-10-29')]).open
    ).toEqual([]);
    expect(entryConnections([stop(1, 'someday'), stop(2, '2026-10-29')], [recorded('2026-10-29')]).covered).toEqual([]);
  });

  it('FE-JRN-CONN-007: fewer than two stops make no line', () => {
    expect(entryConnections([stop(1, '2026-10-29')], [])).toEqual({ open: [], covered: [] });
  });
});

describe('coveredConnectionsShown', () => {
  it('FE-JRN-CONN-008: stands in only while the entries show and the recording is hidden', () => {
    expect(coveredConnectionsShown({ plan: true, recorded: true, entries: true })).toBe(false);
    expect(coveredConnectionsShown({ plan: true, recorded: false, entries: true })).toBe(true);
    expect(coveredConnectionsShown({ plan: true, recorded: false, entries: false })).toBe(false);
  });
});
