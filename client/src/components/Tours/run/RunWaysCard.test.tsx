import type { TourTrailGrade } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../../tests/helpers/render';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import type { RouteWays } from '../bike/routeWays';
import { hardestSac } from '../bike/routeWays';
import type { RouteWaysState } from '../bike/useRouteWays';
import { RunWaysCard } from './RunWaysCard';

const hook = vi.hoisted(() => ({ state: null as unknown, retry: vi.fn(), input: null as unknown }));
vi.mock('../bike/useRouteWays', () => ({
  useRouteWays: (input: unknown) => {
    hook.input = input;
    return { ...(hook.state as object), retry: hook.retry };
  },
}));

// FE-TOUR-RUNWAYS-001 to FE-TOUR-RUNWAYS-005

type Planner = Parameters<typeof RunWaysCard>[0]['planner'];

const LINE: [number, number][] = [
  [47.0, 11.0],
  [47.001, 11.0],
  [47.002, 11.0],
  [47.003, 11.0],
];
const WAYS: RouteWays = {
  line: LINE,
  edges: [
    { from: 0, to: 1, lengthM: 600, surface: 'paved', way: 'road', sac: 'none', wayId: 1 },
    { from: 1, to: 2, lengthM: 300, surface: 'gravel', way: 'track', sac: 't1', wayId: 2 },
    { from: 2, to: 3, lengthM: 100, surface: 'ground', way: 'path', sac: 't2', wayId: 3 },
  ],
};
const grade = (id: number, values: Partial<TourTrailGrade>): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
  ...values,
});
const READY: RouteWaysState = {
  status: 'ready',
  ways: WAYS,
  grades: {
    status: 'ready',
    byWay: new Map([
      [1, grade(1, { surface: 'asphalt', highway: 'residential' })],
      [2, grade(2, { sac_scale: 'hiking', surface: 'gravel', highway: 'track' })],
      [3, grade(3, { sac_scale: 'mountain_hiking', surface: 'ground', highway: 'path' })],
    ]),
    unasked: new Set(),
  },
};

function planner(overrides: Partial<Planner> = {}): Planner {
  return {
    tripId: 4,
    mode: { type: 'new-draft' },
    isRun: true,
    route: LINE,
    routeCurrent: true,
    ...overrides,
  } as Planner;
}

function show(state: Partial<RouteWaysState> = {}, overrides: Partial<Planner> = {}) {
  hook.state = { ...READY, ...state };
  return render(<RunWaysCard planner={planner(overrides)} />);
}

const switchOn = () => fireEvent.click(screen.getByRole('button', { name: 'Show along the route' }));

beforeEach(() => {
  localStorage.clear();
  useTourRouteHighlightStore.getState().clear();
});
afterEach(() => vi.clearAllMocks());

describe('RunWaysCard (RUN-02)', () => {
  it('FE-TOUR-RUNWAYS-001: the trail details a hike shows, switched on by the runner and matched as a run', () => {
    show();
    expect(screen.getByRole('region', { name: 'Trail details' })).toBeInTheDocument();
    expect(hook.input).toMatchObject({ active: false, matching: 'run' });
    expect(screen.queryByTestId('sac-row-t1')).toBeNull();
    switchOn();
    expect(hook.input).toMatchObject({ tripId: 4, active: true, route: LINE, matching: 'run', withGrades: true });
    // The same words and the same paint as a hike's, never a raw tag in a label.
    expect(screen.getByTestId('sac-row-t1')).toHaveTextContent('Hiking');
    expect(screen.getByTestId('sac-row-t2')).toHaveTextContent('Mountain hiking');
    expect(screen.queryByText(/sac_scale\)/)).toBeNull();
    expect(useTourRouteHighlightStore.getState().highlight).toMatchObject({
      id: 'sac',
      paints: ['t1', 't2', 'unknown'],
    });
  });

  it('FE-TOUR-RUNWAYS-002: once read, the head says how much is unpaved and the hardest graded path, in words for assistive tech', () => {
    show();
    expect(screen.queryByText(/unpaved/)).toBeNull();
    switchOn();
    expect(screen.getByText('40 % unpaved')).toBeInTheDocument();
    const hardest = screen.getByTestId('run-ways-hardest');
    expect(hardest).toHaveTextContent('T2');
    expect(hardest).toHaveTextContent('Hardest graded path: Mountain hiking');
    expect(hardest.textContent).not.toMatch(/[–—]/);
  });

  it('FE-TOUR-RUNWAYS-003: a route all paved and ungraded says 0 % unpaved and shows no grade badge', () => {
    show({ ways: { line: LINE, edges: [WAYS.edges[0]] } });
    switchOn();
    expect(screen.getByText('0 % unpaved')).toBeInTheDocument();
    expect(screen.queryByTestId('run-ways-hardest')).toBeNull();
  });

  it('FE-TOUR-RUNWAYS-004: only for a run being edited', () => {
    const other = show({}, { isRun: false });
    expect(screen.queryByRole('region', { name: 'Trail details' })).toBeNull();
    other.unmount();
    show({}, { mode: { type: 'view-gpx' } as Planner['mode'] });
    expect(screen.queryByRole('region', { name: 'Trail details' })).toBeNull();
  });

  it('FE-TOUR-RUNWAYS-005: the hardest graded step along the route, a stretch of no length left out', () => {
    expect(hardestSac(WAYS)).toBe('t2');
    expect(hardestSac({ line: LINE, edges: [{ ...WAYS.edges[2], sac: 't5', lengthM: 0 }, WAYS.edges[1]] })).toBe('t1');
    expect(hardestSac({ line: LINE, edges: [WAYS.edges[0]] })).toBeNull();
  });
});
