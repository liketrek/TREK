// FE-TOUR-USE-ROUND-HIKES-001 to FE-TOUR-USE-ROUND-HIKES-010: round hikes out of a stop, looked
// for under the hike's rules and put in place of the plan only on purpose (RTE-03).
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoundSearchReport } from './roundHikeRouting';
import type { RoundCandidate } from './roundHikes';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const { findRoundHikes } = vi.hoisted(() => ({ findRoundHikes: vi.fn() }));

vi.mock('./roundHikeRouting', () => ({ findRoundHikes, MAX_ROUND_ASKS: 12 }));

import { useRoundHikes, type RoundHikesOptions } from './useRoundHikes';

const A: TourPlannerWaypoint = { id: 'a', lat: 47.5, lng: 11.1, role: 'start', name: 'Hut' };
const B: TourPlannerWaypoint = { id: 'b', lat: 47.52, lng: 11.12, role: 'end' };
const ROUND: RoundCandidate = {
  key: 'a',
  current: false,
  coordinates: [
    [47.5, 11.1],
    [47.51, 11.1],
    [47.5, 11.1],
  ],
  distanceM: 10_400,
  gainM: null,
  lossM: null,
  minutes: null,
  heights: 'pending',
  via: [
    { lat: 47.51, lng: 11.1 },
    { lat: 47.52, lng: 11.11 },
    { lat: 47.51, lng: 11.12 },
  ],
};

/** What a test answers for the search it starts: the reports, sent in order. */
let answers: RoundSearchReport[] = [];

function options(overrides: Partial<RoundHikesOptions> = {}): RoundHikesOptions {
  return {
    waypoints: [A],
    tourType: 'hike',
    maxHikingDifficulty: 2,
    hikingPreferences: null,
    replaceWaypoints: vi.fn(),
    undo: vi.fn(),
    mayEdit: () => true,
    ...overrides,
  };
}

function setup(initial: RoundHikesOptions = options()) {
  return renderHook((props: RoundHikesOptions) => useRoundHikes(props), { initialProps: initial });
}

/** Opens the card on `a`, looks for rounds of 10 km and lets the answers arrive. */
async function searched(view: ReturnType<typeof setup>) {
  act(() => view.result.current.open('a'));
  act(() => view.result.current.find(10_000));
  await waitFor(() => expect(view.result.current.view?.phase).not.toBe('searching'));
}

beforeEach(() => {
  vi.clearAllMocks();
  answers = [{ phase: 'done', candidates: [ROUND], asked: 3 }];
  findRoundHikes.mockImplementation(
    async (_request: unknown, _signal: AbortSignal, report: (answer: RoundSearchReport) => void) => {
      // The router answers later, never inside the render that asked.
      await Promise.resolve();
      for (const answer of answers) report(answer);
    }
  );
});

describe('useRoundHikes', () => {
  it('FE-TOUR-USE-ROUND-HIKES-001: opens on a stop of a hike, ready for the length; nothing else opens it', () => {
    const view = setup(options({ waypoints: [A, { ...B, id: 's', shaping: true }, B] }));
    expect(view.result.current.canStart('a')).toBe(true);
    expect(view.result.current.canStart('nope')).toBe(false);
    expect(view.result.current.canStart('s')).toBe(false);
    act(() => view.result.current.open('nope'));
    expect(view.result.current.view).toBeNull();
    act(() => view.result.current.open('a'));
    expect(view.result.current.view).toMatchObject({
      startId: 'a',
      targetM: 10_000,
      request: null,
      phase: 'setup',
      candidates: [],
      selected: null,
      confirming: false,
      notice: null,
    });
    expect(view.result.current.frame).toBeNull();
    view.rerender(options({ tourType: 'bike' }));
    expect(view.result.current.canStart('a')).toBe(false);
  });

  it('FE-TOUR-USE-ROUND-HIKES-002: looks for rounds under the hike’s limit and preferences, and frames where they can lie', async () => {
    answers = [{ phase: 'searching', candidates: [], asked: 2 }, ...answers];
    const view = setup(options({ maxHikingDifficulty: 4, hikingPreferences: { avoid_steps: true } }));
    act(() => view.result.current.open('a'));
    act(() => view.result.current.find(12_000));
    expect(view.result.current.view).toMatchObject({ phase: 'searching', asked: 0, targetM: 12_000 });
    expect(view.result.current.frame?.points).toHaveLength(4);
    await waitFor(() => expect(view.result.current.view?.phase).toBe('done'));
    const [request] = findRoundHikes.mock.calls[0];
    expect(request).toMatchObject({
      startId: 'a',
      start: { lat: 47.5, lng: 11.1 },
      targetM: 12_000,
      costing: { max_hiking_difficulty: 4, step_penalty: 600 },
    });
    expect(view.result.current.view?.candidates).toEqual([ROUND]);
    expect(view.result.current.view?.asked).toBe(3);
  });

  it('FE-TOUR-USE-ROUND-HIKES-003: a length out of range or no open card asks nothing', () => {
    const view = setup();
    act(() => view.result.current.find(10_000));
    act(() => view.result.current.open('a'));
    act(() => view.result.current.find(200));
    expect(findRoundHikes).not.toHaveBeenCalled();
    expect(view.result.current.view?.phase).toBe('setup');
  });

  it('FE-TOUR-USE-ROUND-HIKES-004: hovering and choosing light a round up; going back and closing change nothing', async () => {
    const replaceWaypoints = vi.fn();
    const view = setup(options({ replaceWaypoints }));
    await searched(view);
    act(() => view.result.current.hover('a'));
    expect(view.result.current.focus).toBe('a');
    act(() => view.result.current.hover(null));
    act(() => view.result.current.select('a'));
    expect(view.result.current.focus).toBe('a');
    expect(view.result.current.view?.selected).toBe('a');
    act(() => view.result.current.back());
    expect(view.result.current.view).toMatchObject({ phase: 'setup', candidates: [], selected: null });
    expect(view.result.current.frame).toBeNull();
    act(() => view.result.current.close());
    expect(view.result.current.view).toBeNull();
    expect(replaceWaypoints).not.toHaveBeenCalled();
  });

  it('FE-TOUR-USE-ROUND-HIKES-005: a tour of its start alone takes the chosen round at once, as one step with its undo note', async () => {
    const replaceWaypoints = vi.fn();
    const undo = vi.fn();
    const view = setup(options({ replaceWaypoints, undo }));
    await searched(view);
    act(() => view.result.current.select('a'));
    act(() => view.result.current.apply());
    expect(replaceWaypoints).toHaveBeenCalledTimes(1);
    const [plan] = replaceWaypoints.mock.calls[0] as [TourPlannerWaypoint[]];
    expect(plan[0]).toMatchObject({ id: 'a', name: 'Hut' });
    expect(plan.slice(1, 4).map(({ lat, lng, shaping }) => ({ lat, lng, shaping }))).toEqual(
      ROUND.via.map((spot) => ({ ...spot, shaping: true }))
    );
    expect(plan[4]).toMatchObject({ lat: A.lat, lng: A.lng });
    expect(view.result.current.view).toBeNull();
    // The planner writes the round; the note with its undo shows once the points changed.
    view.rerender(options({ replaceWaypoints, undo, waypoints: plan }));
    expect(view.result.current.appliedHint.shown).toBe(true);
    act(() => view.result.current.appliedHint.undo());
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-USE-ROUND-HIKES-006: a tour with more planned asks first, and only the yes replaces its points', async () => {
    const replaceWaypoints = vi.fn();
    const view = setup(options({ waypoints: [A, B], replaceWaypoints }));
    await searched(view);
    act(() => view.result.current.select('a'));
    act(() => view.result.current.apply());
    expect(view.result.current.view?.confirming).toBe(true);
    expect(replaceWaypoints).not.toHaveBeenCalled();
    act(() => view.result.current.cancelConfirm());
    expect(view.result.current.view?.confirming).toBe(false);
    act(() => view.result.current.apply());
    act(() => view.result.current.confirm());
    expect(replaceWaypoints).toHaveBeenCalledTimes(1);
    expect(view.result.current.view).toBeNull();
  });

  it('FE-TOUR-USE-ROUND-HIKES-007: nothing is taken before the search is done, without a choice, or without the right to edit', async () => {
    const replaceWaypoints = vi.fn();
    answers = [{ phase: 'searching', candidates: [ROUND], asked: 1 }];
    const view = setup(options({ replaceWaypoints }));
    act(() => view.result.current.open('a'));
    act(() => view.result.current.find(10_000));
    await waitFor(() => expect(view.result.current.view?.candidates).toHaveLength(1));
    expect(view.result.current.view?.phase).toBe('searching');
    act(() => view.result.current.select('a'));
    act(() => view.result.current.apply());
    expect(replaceWaypoints).not.toHaveBeenCalled();

    answers = [{ phase: 'done', candidates: [ROUND], asked: 3 }];
    const locked = setup(options({ replaceWaypoints, mayEdit: () => false }));
    await searched(locked);
    act(() => locked.result.current.apply());
    act(() => locked.result.current.select('a'));
    act(() => locked.result.current.apply());
    expect(replaceWaypoints).not.toHaveBeenCalled();
    act(() => locked.result.current.confirm());
    expect(locked.result.current.view?.confirming).toBe(false);
    expect(replaceWaypoints).not.toHaveBeenCalled();
  });

  it('FE-TOUR-USE-ROUND-HIKES-008: a moved start or another limit makes the rounds go, and the card says why', async () => {
    const view = setup();
    await searched(view);
    view.rerender(options({ waypoints: [{ ...A, lat: 47.6 }] }));
    expect(view.result.current.view).toMatchObject({ phase: 'setup', candidates: [], notice: 'stale' });

    act(() => view.result.current.find(10_000));
    await waitFor(() => expect(view.result.current.view?.phase).toBe('done'));
    expect(view.result.current.view?.notice).toBeNull();
    view.rerender(options({ waypoints: [{ ...A, lat: 47.6 }], maxHikingDifficulty: 5 }));
    expect(view.result.current.view?.notice).toBe('stale');
  });

  it('FE-TOUR-USE-ROUND-HIKES-009: a start that is gone closes the card; another start starts afresh', async () => {
    const view = setup(options({ waypoints: [A, B] }));
    await searched(view);
    act(() => view.result.current.open('b'));
    expect(view.result.current.view).toMatchObject({ startId: 'b', phase: 'setup', candidates: [] });
    view.rerender(options({ waypoints: [A] }));
    expect(view.result.current.view).toBeNull();
  });

  it('FE-TOUR-USE-ROUND-HIKES-010: a yes that comes after the start moved writes nothing and says so', async () => {
    const replaceWaypoints = vi.fn();
    const view = setup(options({ waypoints: [A, B], replaceWaypoints }));
    await searched(view);
    act(() => view.result.current.select('a'));
    act(() => view.result.current.apply());
    expect(view.result.current.view?.confirming).toBe(true);
    // The start moved while the question was open: the round was found for another spot.
    view.rerender(options({ waypoints: [{ ...A, lat: 47.7 }, B], replaceWaypoints }));
    expect(view.result.current.view).toMatchObject({ confirming: false, notice: 'stale', phase: 'setup' });
    act(() => view.result.current.confirm());
    expect(replaceWaypoints).not.toHaveBeenCalled();
  });
});
