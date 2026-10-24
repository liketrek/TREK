/**
 * A paddle tour's checklist and bench as the server answers them (PAD-06,
 * PAD-09), for the client suites: a weir on the route, open unless told
 * otherwise, with the basis a decision is bound to.
 */
import type { PaddleCheck, TourObstacleCheck, TourObstacleEntry, TourOwnEntry } from '@trek/shared';

export const ROUTE_BASIS = 'p1:o:4920000,1200400,w|4920000,1200500,w|4920000,1200600,w';
export const SOURCE_BASIS = 's1:0123456789abcdef:4920000,1200500';

export function obstacleEntry(overrides: Partial<TourObstacleEntry> = {}): TourObstacleEntry {
  return {
    key: 'node/1',
    refs: ['node/1'],
    kind: 'weir',
    name: 'Wehr Regendorf',
    at: [49.2, 12.005],
    bounds: [
      [49.2, 12.005],
      [49.2, 12.005],
    ],
    relation: 'on_route',
    along_m: 1200,
    distance_m: 0,
    passages: 1,
    access: { value: null, source: null, condition: null, forbidden: false, private: false },
    advice: null,
    portage: 'none',
    local_check: null,
    data_as_of: '2026-10-01T00:00:00.000Z',
    status: 'open',
    changed: [],
    basis: { route: ROUTE_BASIS, source: SOURCE_BASIS },
    decision: null,
    ...overrides,
  };
}

/** An earlier decision no current entry carries: about an object the data no longer holds. */
export function earlierEntry(overrides: Partial<TourObstacleEntry> = {}): TourObstacleEntry {
  return obstacleEntry({
    key: 'node/9',
    refs: ['node/9'],
    name: 'Alte Sohlschwelle',
    relation: null,
    along_m: null,
    distance_m: null,
    passages: 0,
    status: 'gone',
    basis: null,
    decision: { decision: 'pass', note: null, decided_at: '2026-09-20T10:00:00.000Z', decided_by: 1 },
    ...overrides,
  });
}

export function ownPortage(overrides: Partial<TourOwnEntry> = {}): TourOwnEntry {
  return {
    kind: 'portage',
    index: 1,
    from_m: 1150,
    to_m: 1260,
    at: [49.2, 12.0052],
    bounds: [
      [49.2, 12.0045],
      [49.2001, 12.0058],
    ],
    covers: ['node/1'],
    bypassed: false,
    advice: null,
    conflict: null,
    ...overrides,
  };
}

export function obstacleCheck(overrides: Partial<TourObstacleCheck> = {}): TourObstacleCheck {
  return {
    revision: 'rev-1',
    evaluated_at: '2026-10-16T08:00:00.000Z',
    entries: [obstacleEntry()],
    own: [],
    ...overrides,
  };
}

export function paddleBench(overrides: Partial<PaddleCheck> = {}): PaddleCheck {
  return {
    data: 'covered',
    data_as_of: '2026-10-01T00:00:00.000Z',
    read_at: '2026-10-02T04:20:00.000Z',
    entries: 1,
    open: 1,
    review: 0,
    decided: 0,
    bans: 0,
    own: 0,
    revision: 'rev-1',
    ...overrides,
  };
}
