/**
 * tracksToAdopt (#2810): which rows of a tour import take over a track that a
 * GPX import before Tours left as a plain place.
 */
import { tracksToAdopt } from '../../../src/nest/tours/tour-track-adoption';

import { describe, expect, it } from 'vitest';

const LINE = '[[46.1,11.1,1200],[46.2,11.2,1300]]';
const track = (
  id: number,
  name: string,
  extra: { route_geometry?: string | null; tour_place_id?: number | null } = {},
) => ({
  id,
  name,
  route_geometry: LINE,
  tour_place_id: null,
  ...extra,
});
const rows = (...names: string[]) => names.map((name) => ({ name }));

describe('tracksToAdopt', () => {
  it('TRACK-ADOPT-001: pairs a row with a track of the same name, trimmed and in any case', () => {
    expect([...tracksToAdopt(rows('GARMIN HIKE'), [track(4, ' Garmin hike ')])]).toEqual([
      [0, { id: 4, route_geometry: LINE }],
    ]);
  });

  it('TRACK-ADOPT-002: gives each track to one row only, oldest first', () => {
    const adopt = tracksToAdopt(rows('Hike', 'hike', 'HIKE'), [track(9, 'hike'), track(3, 'Hike')]);
    expect([...adopt]).toEqual([
      [0, { id: 3, route_geometry: LINE }],
      [1, { id: 9, route_geometry: LINE }],
    ]);
  });

  it('TRACK-ADOPT-003: leaves out a tour, a place without a line, an unnamed place and an unnamed row', () => {
    const places = [
      track(1, 'Ridge', { tour_place_id: 1 }),
      track(2, 'Cafe', { route_geometry: null }),
      track(3, '  '),
      track(4, 'Lake'),
    ];
    expect([...tracksToAdopt(rows('Ridge', 'Cafe', '', 'Other'), places)]).toEqual([]);
  });
});
