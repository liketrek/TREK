import type { TourTrailGrade } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { BikeWaysCard } from './BikeWaysCard';
import type { RouteWays } from './routeWays';
import type { RouteWaysState } from './useRouteWays';

const hook = vi.hoisted(() => ({ state: null as unknown, retry: vi.fn(), input: null as unknown }));
vi.mock('./useRouteWays', () => ({
  useRouteWays: (input: unknown) => {
    hook.input = input;
    return { ...(hook.state as object), retry: hook.retry };
  },
}));

// FE-TOUR-BIKECARD-001 to FE-TOUR-BIKECARD-009

const LINE: [number, number][] = [
  [47.0, 11.0],
  [47.001, 11.0],
  [47.002, 11.0],
  [47.003, 11.0],
];
const WAYS: RouteWays = {
  line: LINE,
  edges: [
    { from: 0, to: 1, lengthM: 600, surface: 'paved', way: 'cyclePath', sac: 'none', wayId: 1 },
    { from: 1, to: 2, lengthM: 300, surface: 'gravel', way: 'track', sac: 'none', wayId: 2 },
    { from: 2, to: 3, lengthM: 100, surface: 'ground', way: 'path', sac: 'none', wayId: 3 },
  ],
};

function planner(overrides: Partial<TourPlannerController> = {}) {
  return {
    tripId: 4,
    mode: { type: 'new-draft' },
    isBike: true,
    bikeProfile: 'touring',
    route: LINE,
    routeCurrent: true,
    ...overrides,
  } as unknown as TourPlannerController;
}

const grade = (id: number, mtb: string | null, uphill: string | null = null): TourTrailGrade => ({
  id,
  mtb_scale: mtb,
  mtb_scale_uphill: uphill,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
});

function show(state: Partial<RouteWaysState>, overrides: Partial<TourPlannerController> = {}) {
  hook.state = { status: 'ready', ways: WAYS, grades: null, ...state };
  return render(<BikeWaysCard planner={planner(overrides)} />);
}

beforeEach(() => {
  localStorage.clear();
  useTourRouteHighlightStore.getState().clear();
});
afterEach(() => vi.clearAllMocks());

describe('BikeWaysCard (BIK-01 to BIK-05)', () => {
  it('FE-TOUR-BIKECARD-001: the surfaces and kinds of way of the route, by share, with their lengths', () => {
    show({});
    const card = screen.getByTestId('bike-ways-card');
    expect(within(screen.getByTestId('route-ways-row-surface-paved')).getByText('60 %')).toBeInTheDocument();
    expect(screen.getByTestId('route-ways-row-surface-gravel')).toHaveTextContent('300 m');
    expect(screen.getByTestId('route-ways-row-way-cyclePath')).toBeInTheDocument();
    expect(screen.getByText('40 % unpaved')).toBeInTheDocument();
    expect(card).not.toHaveTextContent('Trail grade');
  });

  it('FE-TOUR-BIKECARD-002: a row points at its stretches on the map, and lets go when pressed again', () => {
    show({});
    const row = screen.getByTestId('route-ways-row-surface-gravel');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-pressed', 'true');
    expect(useTourRouteHighlightStore.getState().highlight).toEqual({
      id: 'surface-gravel',
      lines: [LINE.slice(1, 3)],
      paint: 'gravel',
    });
    fireEvent.click(row);
    expect(useTourRouteHighlightStore.getState().highlight).toBeNull();
  });

  it('FE-TOUR-BIKECARD-003: a road bike tour names what is unpaved and shows it on the map', () => {
    show({}, { bikeProfile: 'road' } as Partial<TourPlannerController>);
    fireEvent.click(screen.getByRole('button', { name: 'Show on the map' }));
    expect(useTourRouteHighlightStore.getState().highlight?.id).toBe('unpaved');
    expect(useTourRouteHighlightStore.getState().highlight?.lines).toEqual([LINE.slice(1)]);
  });

  it('FE-TOUR-BIKECARD-004: a mountain bike tour shows its trail grades, uphill apart, the unknown said', () => {
    show({
      grades: {
        status: 'ready',
        byWay: new Map([
          [1, grade(1, '0')],
          [2, grade(2, '2', '3')],
        ]),
        unasked: new Set([3]),
      },
    });
    expect(screen.getByTestId('route-ways-row-trail-s0')).toBeInTheDocument();
    expect(screen.getByTestId('route-ways-row-trail-s2')).toBeInTheDocument();
    expect(screen.getByTestId('route-ways-row-trail-unasked')).toBeInTheDocument();
    expect(screen.getByTestId('route-ways-row-uphill-u3')).toBeInTheDocument();
  });

  it('FE-TOUR-BIKECARD-005: grades nobody could be asked for are one notice with a retry, not a row for the whole tour', () => {
    show({ grades: { status: 'ready', byWay: new Map(), unasked: new Set([1, 2, 3]) } });
    expect(screen.queryByTestId('route-ways-row-trail-unasked')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /try again/i })[0]);
    expect(hook.retry).toHaveBeenCalled();
  });

  it('FE-TOUR-BIKECARD-006: says when it is still asking, offline, or failed with a way to ask again', () => {
    const { unmount } = show({ status: 'loading', ways: null });
    expect(screen.getByTestId('bike-ways-card')).toHaveTextContent(/./);
    unmount();
    const offline = show({ status: 'offline', ways: null });
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
    offline.unmount();
    show({ status: 'failed', ways: null });
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(hook.retry).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-BIKECARD-007: grades on their way or offline say so in their own section', () => {
    const { unmount } = show({ grades: { status: 'loading', byWay: new Map(), unasked: new Set() } });
    expect(screen.queryByTestId('route-ways-row-trail-s0')).toBeNull();
    unmount();
    show({ grades: { status: 'offline', byWay: new Map(), unasked: new Set() } });
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });

  it('FE-TOUR-BIKECARD-008: only for a bike tour being edited, and only the route as planned now', () => {
    const { unmount } = show({ status: 'idle', ways: null });
    expect(screen.queryByTestId('bike-ways-card')).toBeNull();
    unmount();
    const hike = show({}, { isBike: false });
    expect(screen.queryByTestId('bike-ways-card')).toBeNull();
    hike.unmount();
    show({}, { routeCurrent: false, mode: { type: 'view-gpx' } } as Partial<TourPlannerController>);
    expect(screen.queryByTestId('bike-ways-card')).toBeNull();
    expect(hook.input).toMatchObject({ tripId: 4, active: false, route: null, matching: 'bike', withGrades: false });
  });

  it('FE-TOUR-BIKECARD-009: matches the line as ridden, and asks the trail grades for a mountain bike tour only', () => {
    show({}, { bikeProfile: 'mtb' } as Partial<TourPlannerController>);
    expect(hook.input).toMatchObject({ active: true, route: LINE, matching: 'bike', withGrades: true });
  });
});
