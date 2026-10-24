// FE-TOUR-USE-LEG-VARIANTS-001 to FE-TOUR-USE-LEG-VARIANTS-010: comparing the ways of a hike's
// section, choosing one on purpose and holding it by shaping points as one step (RTE-02).
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OtherWaysAnswer } from './legVariantRouting';
import type { LegVariant } from './legVariants';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const { askOtherWays, routeSection, pinAlternative } = vi.hoisted(() => ({
  askOtherWays: vi.fn(),
  routeSection: vi.fn(),
  pinAlternative: vi.fn(),
}));

vi.mock('./legVariantRouting', () => ({ askOtherWays, routeSection }));
vi.mock('../../Roadtrip/alternativePins', () => ({ pinAlternative }));

import { useLegVariants, type LegVariantsOptions } from './useLegVariants';

const A: TourPlannerWaypoint = { id: 'a', lat: 47.0, lng: 11.0, role: 'start' };
const B: TourPlannerWaypoint = { id: 'b', lat: 47.0, lng: 11.02, role: 'via' };
const C: TourPlannerWaypoint = { id: 'c', lat: 47.01, lng: 11.02, role: 'end' };
const ROUTE: [number, number][] = [
  [47.0, 11.0],
  [47.001, 11.01],
  [47.0, 11.02],
  [47.005, 11.021],
  [47.01, 11.02],
];
const OTHER: LegVariant = {
  key: 'a',
  current: false,
  coordinates: [
    [47.0, 11.0],
    [47.03, 11.01],
    [47.0, 11.02],
  ],
  distanceM: 6800,
  gainM: null,
  lossM: null,
  minutes: null,
  heights: 'pending',
};

/** What a test answers for the comparison it opens: the router's reports, sent in order. */
let answers: OtherWaysAnswer[] = [];

function options(overrides: Partial<LegVariantsOptions> = {}): LegVariantsOptions {
  return {
    waypoints: [A, B, C],
    route: ROUTE,
    enrichedGeometry: null,
    routeCurrent: true,
    tourType: 'hike',
    maxHikingDifficulty: 2,
    hikingPreferences: null,
    insertShapingPoints: vi.fn(() => ['s1']),
    undo: vi.fn(),
    mayEdit: () => true,
    ...overrides,
  };
}

function setup(initial: LegVariantsOptions = options()) {
  return renderHook((props: LegVariantsOptions) => useLegVariants(props), { initialProps: initial });
}

/** Opens the comparison of the leg after `a` and lets the router's answers arrive. */
async function compared(view: ReturnType<typeof setup>) {
  act(() => view.result.current.compare('a'));
  await waitFor(() => expect(view.result.current.comparison?.phase).not.toBe('loading'));
}

beforeEach(() => {
  vi.clearAllMocks();
  answers = [];
  askOtherWays.mockImplementation(
    async (_leg: unknown, current: LegVariant, _signal: AbortSignal, report: (answer: OtherWaysAnswer) => void) => {
      // The router answers later, never inside the render that asked.
      await Promise.resolve();
      for (const answer of answers) {
        report({ ...answer, variants: answer.variants.map((variant) => (variant.current ? current : variant)) });
      }
    }
  );
});

describe('useLegVariants', () => {
  it('FE-TOUR-USE-LEG-VARIANTS-001: only a routed leg of a hike whose route is planned for the points can be compared', () => {
    const view = setup();
    expect(view.result.current.canCompare('a')).toBe(true);
    expect(view.result.current.canCompare('c')).toBe(false);
    view.rerender(options({ routeCurrent: false }));
    expect(view.result.current.canCompare('a')).toBe(false);
    view.rerender(options({ tourType: 'bike' }));
    expect(view.result.current.canCompare('a')).toBe(false);
    view.rerender(options({ route: null }));
    expect(view.result.current.canCompare('a')).toBe(false);
  });

  it('FE-TOUR-USE-LEG-VARIANTS-002: opens on the section with the way taken now, asked under the hike’s rules', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    const view = setup(options({ maxHikingDifficulty: 4, hikingPreferences: { avoid_steps: true } }));
    act(() => view.result.current.compare('a'));
    expect(view.result.current.comparison).toMatchObject({ phase: 'loading', selected: null, proving: false });
    expect(view.result.current.comparison?.variants.map((v) => v.key)).toEqual(['current']);
    await waitFor(() => expect(view.result.current.comparison?.phase).toBe('choose'));

    const [leg] = askOtherWays.mock.calls[0];
    expect(leg).toMatchObject({ fromId: 'a', toId: 'b', costing: { max_hiking_difficulty: 4, step_penalty: 600 } });
    expect(view.result.current.comparison?.variants.map((v) => v.key)).toEqual(['current', 'a']);
    // The way taken now is the route's own stretch between the two points.
    expect(view.result.current.comparison?.variants[0].coordinates).toEqual(ROUTE.slice(0, 3));
  });

  it('FE-TOUR-USE-LEG-VARIANTS-003: hovering and choosing light a way up; closing changes nothing', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    const insertShapingPoints = vi.fn(() => ['s1']);
    const view = setup(options({ insertShapingPoints }));
    await compared(view);
    act(() => view.result.current.select('a'));
    expect(view.result.current.comparison?.selected).toBe('a');
    expect(view.result.current.focus).toBe('a');
    act(() => view.result.current.hover('current'));
    expect(view.result.current.focus).toBe('current');
    act(() => view.result.current.hover(null));
    act(() => view.result.current.close());
    expect(view.result.current.comparison).toBeNull();
    expect(view.result.current.focus).toBeNull();
    expect(insertShapingPoints).not.toHaveBeenCalled();
    expect(pinAlternative).not.toHaveBeenCalled();
  });

  it('FE-TOUR-USE-LEG-VARIANTS-004: a chosen way the router keeps to is held by its pins as one step, and the card closes', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    pinAlternative.mockResolvedValue({ held: true, pins: [{ lat: 47.03, lng: 11.01 }], fellBack: false, last: {} });
    routeSection.mockResolvedValue({ coordinates: OTHER.coordinates, distance: 6800, duration: 0 });
    const insertShapingPoints = vi.fn(() => ['s1']);
    const view = setup(options({ insertShapingPoints }));
    await compared(view);
    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());

    const [{ offer, current, route }] = pinAlternative.mock.calls[0];
    // Never the router's own way: the first pin goes where the offer leaves the way taken now.
    expect(offer).toMatchObject({ coordinates: OTHER.coordinates });
    expect(offer.direct).toBeFalsy();
    expect(current.coordinates).toEqual(ROUTE.slice(0, 3));
    await route([{ lat: 1, lng: 2 }], new AbortController().signal);
    expect(routeSection).toHaveBeenCalledWith(
      expect.objectContaining({ fromId: 'a', toId: 'b' }),
      [{ lat: 1, lng: 2 }],
      expect.any(AbortSignal)
    );
    expect(insertShapingPoints).toHaveBeenCalledWith('a', 'b', [{ lat: 47.03, lng: 11.01 }]);
    expect(view.result.current.comparison).toBeNull();
  });

  it('FE-TOUR-USE-LEG-VARIANTS-005: a way the router does not keep to changes nothing and says so', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    pinAlternative.mockResolvedValue({ held: false, pins: [], fellBack: false, last: {} });
    const insertShapingPoints = vi.fn(() => ['s1']);
    const view = setup(options({ insertShapingPoints }));
    await compared(view);
    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());
    expect(view.result.current.comparison).toMatchObject({ notice: 'notHeld', proving: false, selected: 'a' });
    expect(insertShapingPoints).not.toHaveBeenCalled();
  });

  it('FE-TOUR-USE-LEG-VARIANTS-006: a router that fails the check changes nothing; the way taken now is no choice to apply', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    pinAlternative.mockRejectedValue(new Error('No route found'));
    const view = setup();
    await compared(view);
    act(() => view.result.current.select('current'));
    await act(async () => view.result.current.apply());
    expect(pinAlternative).not.toHaveBeenCalled();

    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());
    expect(view.result.current.comparison?.notice).toBe('failed');
  });

  it('FE-TOUR-USE-LEG-VARIANTS-007: a way taken always changes the route, says so and is taken back in one undo step', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    pinAlternative.mockResolvedValue({ held: true, pins: [{ lat: 47.03, lng: 11.01 }], fellBack: false, last: {} });
    const undo = vi.fn();
    const insertShapingPoints = vi.fn(() => ['s1']);
    const view = setup(options({ insertShapingPoints, undo }));
    await compared(view);
    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());
    expect(insertShapingPoints).toHaveBeenCalledTimes(1);
    expect(view.result.current.comparison).toBeNull();
    expect(view.result.current.appliedHint.shown).toBe(false);

    // The write lands as the shaping point in the leg: "way taken" is up, and its undo is the editor's one step.
    const S: TourPlannerWaypoint = { id: 's1', lat: 47.03, lng: 11.01, role: 'via', shaping: true };
    view.rerender(options({ insertShapingPoints, undo, waypoints: [A, S, B, C] }));
    expect(view.result.current.appliedHint.shown).toBe(true);
    act(() => view.result.current.appliedHint.undo());
    expect(undo).toHaveBeenCalledTimes(1);
    expect(view.result.current.appliedHint.shown).toBe(false);
  });

  it('FE-TOUR-USE-LEG-VARIANTS-008: a choice checked while the section changed is not written; a refused write says stale too', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    let release: (value: unknown) => void = () => undefined;
    pinAlternative.mockImplementation(() => new Promise((resolve) => (release = resolve)));
    const insertShapingPoints = vi.fn(() => null);
    const view = setup(options({ insertShapingPoints }));
    await compared(view);
    act(() => view.result.current.select('a'));
    let applying: Promise<void> = Promise.resolve();
    act(() => {
      applying = view.result.current.apply();
    });
    expect(view.result.current.comparison?.proving).toBe(true);
    // The limit changes while the router is asked: the answer is for another section now.
    view.rerender(options({ insertShapingPoints, maxHikingDifficulty: 5 }));
    await act(async () => {
      release({ held: true, pins: [{ lat: 47.03, lng: 11.01 }], fellBack: false, last: {} });
      await applying;
    });
    expect(view.result.current.comparison).toBeNull();
    expect(insertShapingPoints).not.toHaveBeenCalled();

    pinAlternative.mockResolvedValue({ held: true, pins: [{ lat: 47.03, lng: 11.01 }], fellBack: false, last: {} });
    await compared(view);
    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());
    expect(insertShapingPoints).toHaveBeenCalledTimes(1);
    expect(view.result.current.comparison?.notice).toBe('stale');
  });

  it('FE-TOUR-USE-LEG-VARIANTS-009: a moved point closes the comparison; an answer arriving after it is dropped', async () => {
    let late: ((answer: OtherWaysAnswer) => void) | null = null;
    askOtherWays.mockImplementationOnce(
      async (_leg: unknown, _current: unknown, _signal: unknown, report: (answer: OtherWaysAnswer) => void) => {
        late = report;
      }
    );
    const view = setup();
    act(() => view.result.current.compare('a'));
    view.rerender(options({ waypoints: [A, { ...B, lat: 47.002 }, C] }));
    expect(view.result.current.comparison).toBeNull();
    act(() => late?.({ phase: 'choose', variants: [OTHER] }));
    expect(view.result.current.comparison).toBeNull();
    // Nothing to compare without a planned stretch for the leg.
    view.rerender(options({ route: null }));
    act(() => view.result.current.compare('a'));
    expect(view.result.current.comparison).toBeNull();
  });

  it('FE-TOUR-USE-LEG-VARIANTS-010: nothing is checked while the tour may not change; the way taken now follows its heights', async () => {
    answers = [{ phase: 'choose', variants: [{ ...OTHER, key: 'current', current: true }, OTHER] }];
    const view = setup(options({ mayEdit: () => false }));
    await compared(view);
    act(() => view.result.current.select('a'));
    await act(async () => view.result.current.apply());
    expect(pinAlternative).not.toHaveBeenCalled();
    expect(view.result.current.comparison?.variants[0].heights).toBe('unknown');

    const heights = ROUTE.map(([lat, lng], i): [number, number, number] => [lat, lng, 1000 + i * 10]);
    view.rerender(options({ mayEdit: () => false, enrichedGeometry: heights }));
    expect(view.result.current.comparison?.variants[0]).toMatchObject({ heights: 'known', gainM: 20 });
  });
});
