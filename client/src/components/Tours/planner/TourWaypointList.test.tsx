// FE-TOUR-WAYPOINT-LIST-001 to FE-TOUR-WAYPOINT-LIST-016: shaping points, the water router's answers
// and a city walk's stops in the list, with their arrivals and opening hours on a day of the walk,
// other ways for a hike's leg and round hikes out of a stop, and the stages of a multi-day tour
// (P2A-03, P2A-05, PAD-11, CW-01, CW-02, CW-04, RTE-02, RTE-03, MDT-01).
import userEvent from '@testing-library/user-event';
import type { PaddleRouteLeg } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../../../tests/helpers/factories';
import { render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { hikePlannerDefaults, idleLegVariants, idleRoundHikes } from '../../../../tests/helpers/tourPlannerStub';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTripStore } from '../../../store/tripStore';
import type { PaddleTourRoute } from './paddleRouting';
import TourWaypointList from './TourWaypointList';
import type { TourPlannerController } from './useTourPlanner';

/** The item at `i`, or a failure that names the index instead of a later undefined. */
function at<T>(list: readonly T[], i: number): T {
  const item = list[i];
  if (item === undefined) throw new Error(`nothing at ${i}`);
  return item;
}

vi.mock('./useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({}) }));

const START = { id: 'a', lat: 49.1, lng: 12.1, role: 'start' as const };
const SHAPE = { id: 's', lat: 49.08, lng: 12.11, role: 'via' as const, shaping: true };
const STOP = { id: 'b', lat: 49.05, lng: 12.12, role: 'via' as const };
const END = { id: 'c', lat: 49.0, lng: 12.1, role: 'end' as const };

const segment = (kind: 'water' | 'rapids' | 'pass' | 'gap', from: number, to: number, grade: number | null = null) => ({
  kind,
  from,
  to,
  name: null,
  source: null,
  osm_ref: null,
  grade,
});

const WHITEWATER: PaddleRouteLeg = {
  status: 'ok',
  geometry: [
    [49.05, 12.12],
    [49.04, 12.12],
    [49.03, 12.115],
    [49.0, 12.1],
  ],
  segments: [segment('water', 0, 1), segment('rapids', 1, 2, 2), segment('gap', 2, 3)],
  distance_m: 5800,
  snapped_m: { from: 0, to: 0 },
};

function planner(overrides: Partial<TourPlannerController> = {}): TourPlannerController {
  return {
    ...hikePlannerDefaults(),
    waypoints: [START, SHAPE, STOP, END],
    selectedWaypointId: null,
    setSelectedWaypointId: vi.fn(),
    reorderWaypoint: vi.fn(),
    moveWaypoint: vi.fn(),
    removeWaypoint: vi.fn(),
    ...overrides,
  } as unknown as TourPlannerController;
}

function paddleRoute(legs: PaddleTourRoute['legs'], failures: PaddleTourRoute['failures'] = []): PaddleTourRoute {
  return { coordinates: [], parts: [], distanceMeters: 0, legs, legLengths: legs.map(() => 0), failures };
}

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

describe('TourWaypointList', () => {
  it('FE-TOUR-WAYPOINT-LIST-001: numbers the stops only; a shaping point is a dot and does not count', () => {
    render(<TourWaypointList planner={planner()} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    expect(rows).toHaveLength(4);
    expect(within(at(rows, 1)).getByLabelText('Shaping point')).toHaveAttribute('data-waypoint-shaping', 'true');
    expect(
      [...document.querySelectorAll('[data-waypoint-number]')].map((el) => el.getAttribute('data-waypoint-number'))
    ).toEqual(['1', '2', '3']);
    expect(screen.getByText('Click the route on the map to add a shaping point there.')).toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-002: the menu plans a routed leg again, draws it by hand, and turns a stop into a shaping point', async () => {
    const controller = planner({ selectedWaypointId: 'b' });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const row = at(screen.getAllByTestId('tour-planner-waypoint-row'), 2);
    await userEvent.click(within(row).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Plan the next leg again' }));
    expect(controller.recomputeLeg).toHaveBeenCalledWith('b');

    await userEvent.click(within(row).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Make it a shaping point' }));
    expect(controller.setWaypointShaping).toHaveBeenCalledWith('b', true);

    await userEvent.click(within(row).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Draw the next leg by hand' }));
    expect(controller.toggleWaypointFreeLeg).toHaveBeenCalledWith('b');
  });

  it('FE-TOUR-WAYPOINT-LIST-003: a shaping point becomes a stop again; the first point offers no shaping', async () => {
    const controller = planner({ selectedWaypointId: 's' });
    const { rerender } = render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    await userEvent.click(
      within(at(screen.getAllByTestId('tour-planner-waypoint-row'), 1)).getByRole('button', { name: 'More actions' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Make it a stop' }));
    expect(controller.setWaypointShaping).toHaveBeenCalledWith('s', false);

    rerender(<TourWaypointList planner={planner({ selectedWaypointId: 'a' })} canEdit isSaving={false} />);
    await userEvent.click(
      within(at(screen.getAllByTestId('tour-planner-waypoint-row'), 0)).getByRole('button', { name: 'More actions' })
    );
    expect(screen.queryByRole('button', { name: 'Make it a shaping point' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-004: a paddle leg shows its whitewater and its data gap with their lengths', () => {
    const route = paddleRoute([null, null, WHITEWATER]);
    render(
      <TourWaypointList
        planner={planner({ ...{ isPaddle: true, tourType: 'kayak' }, paddleRoute: route, routeCurrent: true })}
        canEdit
        isSaving={false}
      />
    );
    const notes = screen.getByTestId('tour-planner-leg-notes');
    expect(within(notes).getByText('Whitewater 2')).toBeInTheDocument();
    expect(within(notes).getByText('Gap in the map data')).toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-005: a leg the router could not plan says why and offers the way out', async () => {
    const route = paddleRoute(
      [{ status: 'failed', code: 'busy', at: null }, null, null],
      [{ index: 0, code: 'busy', at: null }]
    );
    const controller = planner({ isPaddle: true, tourType: 'kayak', paddleRoute: route, routeCurrent: true });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const failure = screen.getByTestId('tour-planner-leg-failure');
    expect(within(failure).getByRole('alert')).toHaveTextContent('The route planner is busy. Try again in a moment.');
    await userEvent.click(within(failure).getByRole('button', { name: 'Try again' }));
    expect(controller.recomputeLeg).toHaveBeenCalledWith('a');
    await userEvent.click(within(failure).getByRole('button', { name: 'Draw straight' }));
    expect(controller.toggleWaypointFreeLeg).toHaveBeenCalledWith('a');
  });

  it('FE-TOUR-WAYPOINT-LIST-006: a point off the water offers no retry; legs drawn by hand can go back to the water in one step', async () => {
    const drawn = {
      kind: 'free' as const,
      geometry: [
        [49.1, 12.1],
        [49.08, 12.11],
      ] as [number, number][],
    };
    const route = paddleRoute(
      [null, { status: 'failed', code: 'not_on_water', at: null }, null],
      [{ index: 1, code: 'not_on_water', at: null }]
    );
    const auto = { from: { id: 'a', lat: 49.1, lng: 12.1 }, to: { id: 'c', lat: 49.0, lng: 12.1 } };
    const controller = planner({
      isPaddle: true,
      tourType: 'kayak',
      paddleRoute: route,
      routeCurrent: true,
      waypoints: [{ ...START, fixedLeg: drawn }, SHAPE, { ...STOP, auto }, END],
    });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    expect(
      within(screen.getByTestId('tour-planner-leg-failure')).queryByRole('button', { name: 'Try again' })
    ).toBeNull();
    expect(screen.getByTestId('tour-planner-auto-point')).toHaveAttribute('aria-label', 'Found');
    await userEvent.click(screen.getByTestId('tour-planner-route-on-water'));
    expect(controller.routeDrawnLegsOnWater).toHaveBeenCalled();
  });

  it('FE-TOUR-WAYPOINT-LIST-007: a city walk names its stops, shows their stay and edits one stop from its menu', async () => {
    const cathedral = {
      ...STOP,
      key: 'stop-cathedral',
      name: 'Cathedral',
      stayMinutes: 30,
      importance: 'must' as const,
    };
    const controller = planner({
      tourType: 'walk',
      waypoints: [START, SHAPE, cathedral, END],
      selectedWaypointId: 'b',
    });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    expect(within(at(rows, 2)).getByTestId('tour-planner-waypoint-name')).toHaveTextContent('Cathedral');
    // The stay goes under the name; a must-see rings the number instead of a pill beside it.
    expect(within(at(rows, 2)).getByTestId('station-pills')).toHaveTextContent('30 min');
    expect(within(at(rows, 2)).getByTestId('station-pills')).not.toHaveTextContent('Must see');
    const mustSee = within(at(rows, 2)).getByLabelText('Waypoint 2, Must see');
    expect(mustSee.className).toContain('outline-warning');
    // A stop without a stay entered says nothing of it, and a shaping point is no stop.
    expect(within(at(rows, 0)).queryByTestId('station-pills')).not.toBeInTheDocument();
    expect(within(at(rows, 1)).queryByTestId('station-pills')).not.toBeInTheDocument();

    await userEvent.click(within(at(rows, 2)).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit stop' }));
    const stay = screen.getByLabelText('Stay in minutes');
    await userEvent.clear(stay);
    await userEvent.type(stay, '45');
    await userEvent.click(screen.getByTestId('station-save'));
    expect(screen.queryByTestId('station-dialog')).not.toBeInTheDocument();
    expect(controller.editWaypoints).toHaveBeenCalledTimes(1);
    const update = vi.mocked(controller.editWaypoints).mock.calls[0]?.[0] as (
      points: TourPlannerController['waypoints']
    ) => TourPlannerController['waypoints'];
    expect(update([START, SHAPE, cathedral, END])).toEqual([START, SHAPE, { ...cathedral, stayMinutes: 45 }, END]);
  });

  it('FE-TOUR-WAYPOINT-LIST-007b: a hike has no stop pills and no stop to edit', async () => {
    const controller = planner({ selectedWaypointId: 'b' });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    expect(screen.queryByTestId('station-pills')).not.toBeInTheDocument();
    await userEvent.click(
      within(at(screen.getAllByTestId('tour-planner-waypoint-row'), 2)).getByRole('button', { name: 'More actions' })
    );
    expect(screen.queryByRole('button', { name: 'Edit stop' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-009: a stop taken in along the tour carries its kind of place at the corner of its number (PLN-03)', () => {
    const controller = planner({ waypoints: [START, { ...STOP, poiCategory: 'restaurant' as const }, END] });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    const number = within(at(rows, 1)).getByLabelText('Waypoint 2, Places to eat');
    expect(number.querySelector('[data-waypoint-poi="restaurant"]')).toBeInTheDocument();
    // A point set by hand has no kind to show.
    expect(within(at(rows, 0)).queryByLabelText(/Places to eat/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-waypoint-poi]')).toHaveLength(1);
  });

  it('FE-TOUR-WAYPOINT-LIST-008: the way back of a loop walk is no stop: no pills and no stop to edit', async () => {
    const back = { ...START, id: 'back', role: 'end' as const };
    const controller = planner({
      tourType: 'walk',
      isLoop: true,
      waypoints: [{ ...START, stayMinutes: 10 }, STOP, back],
      selectedWaypointId: 'back',
    });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    expect(within(at(rows, 0)).getByTestId('station-pills')).toBeInTheDocument();
    expect(within(at(rows, 2)).queryByTestId('station-pills')).not.toBeInTheDocument();
    await userEvent.click(within(at(rows, 2)).getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('button', { name: 'Edit stop' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-012: a hike offers other ways for a routed leg, dimmed while it cannot be compared (RTE-02)', async () => {
    const legVariants = { ...idleLegVariants(), canCompare: vi.fn((id: string) => id === 'a') };
    const controller = planner({ legVariants });
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    await userEvent.click(within(at(rows, 0)).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compare ways for the next leg' }));
    expect(legVariants.compare).toHaveBeenCalledWith('a');

    await userEvent.click(within(at(rows, 2)).getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('button', { name: 'Compare ways for the next leg' })).toBeDisabled();
    // The last point has no leg to compare.
    await userEvent.click(within(at(rows, 3)).getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('button', { name: 'Compare ways for the next leg' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-013: a bike tour and a leg drawn by hand offer no other ways (RTE-02)', async () => {
    const legVariants = { ...idleLegVariants(), canCompare: vi.fn(() => true) };
    const bike = planner({ legVariants, tourType: 'bike' });
    const { unmount } = render(<TourWaypointList planner={bike} canEdit isSaving={false} />);
    await userEvent.click(
      within(at(screen.getAllByTestId('tour-planner-waypoint-row'), 0)).getByRole('button', { name: 'More actions' })
    );
    expect(screen.queryByRole('button', { name: 'Compare ways for the next leg' })).not.toBeInTheDocument();
    unmount();

    const drawn = { ...START, fixedLeg: { kind: 'free' as const, geometry: [] } };
    const hike = planner({ legVariants, waypoints: [drawn, STOP, END] });
    render(<TourWaypointList planner={hike} canEdit isSaving={false} />);
    await userEvent.click(
      within(at(screen.getAllByTestId('tour-planner-waypoint-row'), 0)).getByRole('button', { name: 'More actions' })
    );
    expect(screen.queryByRole('button', { name: 'Compare ways for the next leg' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-014: a stop of a hike offers round hikes out of it; a shaping point does not (RTE-03)', async () => {
    const roundHikes = { ...idleRoundHikes(), canStart: vi.fn((id: string) => id !== 's') };
    render(<TourWaypointList planner={planner({ roundHikes })} canEdit isSaving={false} />);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    await userEvent.click(within(at(rows, 2)).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Round hike from here' }));
    expect(roundHikes.open).toHaveBeenCalledWith('b');
    await userEvent.click(within(at(rows, 1)).getByRole('button', { name: 'More actions' }));
    expect(screen.queryByRole('button', { name: 'Round hike from here' })).not.toBeInTheDocument();
  });

  it('FE-TOUR-WAYPOINT-LIST-015: the head offers a round hike out of the start on a hike only (RTE-03)', async () => {
    const roundHikes = { ...idleRoundHikes(), canStart: vi.fn(() => true) };
    const { unmount } = render(<TourWaypointList planner={planner({ roundHikes })} canEdit isSaving={false} />);
    await userEvent.click(screen.getByTestId('tour-planner-round-hike'));
    expect(roundHikes.open).toHaveBeenCalledWith('a');
    unmount();
    const saving = render(<TourWaypointList planner={planner({ roundHikes })} canEdit isSaving />);
    expect(screen.getByTestId('tour-planner-round-hike')).toBeDisabled();
    saving.unmount();
    render(<TourWaypointList planner={planner({ roundHikes, tourType: 'bike' })} canEdit isSaving={false} />);
    expect(screen.queryByTestId('tour-planner-round-hike')).not.toBeInTheDocument();
  });

  describe('a city walk on a day of the plan (CW-02, CW-04)', () => {
    const lenbachhaus = {
      ...START,
      key: 'stop-lenbachhaus',
      name: 'Lenbachhaus',
      stayMinutes: 60,
      openingHours: 'Mo-Fr 10:00-18:00',
    };
    const cafe = { ...STOP, name: 'Cafe', stayMinutes: 30 };
    const ROUTE: Array<[number, number]> = [
      [49.1, 12.1],
      [49.08, 12.11],
      [49.05, 12.12],
      [49.0, 12.1],
    ];

    /** A walk being edited, its route planned for the points as they are; on Monday 19 October from 17:20. */
    function walkPlanner(overrides: Partial<TourPlannerController> = {}) {
      return planner({
        tourType: 'walk',
        editingPlaceId: 42,
        waypoints: [lenbachhaus, SHAPE, cafe, END],
        route: ROUTE,
        routeCurrent: true,
        walkingDurationMinutes: 40,
        ...overrides,
      });
    }

    beforeEach(() => {
      const day = buildDay({ id: 7, date: '2026-10-19' });
      const entry = buildAssignment({
        day_id: 7,
        place_id: 42,
        assignment_time: '17:20',
        place: buildPlace({ id: 42 }),
      });
      seedStore(useTripStore, { days: [day], assignments: { '7': [entry] } });
    });

    it('FE-TOUR-WAYPOINT-LIST-009: names the day above the stops and the conflict at the stop it is about', () => {
      render(<TourWaypointList planner={walkPlanner()} canEdit isSaving={false} />);
      expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, Mon, Oct 19(, 2026)?, start 17:20$/);
      const rows = screen.getAllByTestId('tour-planner-waypoint-row');
      const first = within(at(rows, 0)).getByTestId('walk-station-schedule');
      expect(within(first).getByText('Arrival about 17:20, stay until 18:20')).toBeInTheDocument();
      expect(within(first).getByTestId('walk-station-conflict')).toHaveTextContent(
        'Lenbachhaus closes at 18:00, during the stay from 17:20 to 18:20 (open 10:00 to 18:00)'
      );
      // Beside the row's select button, never inside it.
      expect(within(at(rows, 0)).getByRole('button', { current: false, name: /Lenbachhaus/ })).not.toContainElement(
        first
      );
      expect(within(at(rows, 1)).queryByTestId('walk-station-schedule')).not.toBeInTheDocument();
      expect(within(at(rows, 2)).getByTestId('walk-station-schedule')).not.toHaveTextContent('closes');
      expect(screen.getAllByTestId('walk-station-conflict')).toHaveLength(1);
    });

    it('FE-TOUR-WAYPOINT-LIST-010: shows no arrival while the route is not planned for the points as they are', () => {
      render(<TourWaypointList planner={walkPlanner({ routeCurrent: false })} canEdit isSaving={false} />);
      expect(screen.getByTestId('walk-day')).toHaveTextContent(/^Day 1, Mon, Oct 19(, 2026)?, start 17:20$/);
      expect(screen.queryByTestId('walk-station-schedule')).not.toBeInTheDocument();
      expect(screen.queryByTestId('walk-station-conflict')).not.toBeInTheDocument();
    });

    it('FE-TOUR-WAYPOINT-LIST-011: gives the way back of a loop no arrival of its own, and a hike no day line', () => {
      const back = { ...START, id: 'back', role: 'end' as const };
      const loop = walkPlanner({ isLoop: true, waypoints: [lenbachhaus, STOP, back], route: ROUTE.slice(0, 3) });
      const { unmount } = render(<TourWaypointList planner={loop} canEdit isSaving={false} />);
      const rows = screen.getAllByTestId('tour-planner-waypoint-row');
      expect(within(at(rows, 0)).getByTestId('walk-station-schedule')).toBeInTheDocument();
      expect(within(at(rows, 1)).getByTestId('walk-station-schedule')).toBeInTheDocument();
      expect(within(at(rows, 2)).queryByTestId('walk-station-schedule')).not.toBeInTheDocument();
      unmount();

      render(<TourWaypointList planner={walkPlanner({ tourType: 'hike' })} canEdit isSaving={false} />);
      expect(screen.queryByTestId('walk-day-line')).not.toBeInTheDocument();
      expect(screen.queryByTestId('walk-station-schedule')).not.toBeInTheDocument();
    });
  });

  it('FE-TOUR-WAYPOINT-LIST-016: heads each stage where it begins, marks the stop that ends one, and ends a stage from the menu', async () => {
    const stage = (number: number, from: number, to: number, fromId: string, toId: string) => ({
      number,
      from,
      to,
      fromId,
      toId,
      distanceKm: 4.2,
      gain: null,
      loss: null,
      minutes: 75,
      fromM: null,
      toM: null,
      overDay: false,
    });
    const stages = {
      multiDay: true,
      stages: [stage(1, 0, 2, 'a', 'b'), stage(2, 2, 3, 'b', 'c')],
      endCount: 1,
      lost: 0,
      setMultiDay: vi.fn(),
      toggleStageEnd: vi.fn(),
      canEnd: vi.fn((id: string) => id === 'b'),
    };
    const controller = planner({
      waypoints: [START, SHAPE, { ...STOP, stageEnd: true }, END],
      selectedWaypointId: 'b',
      stages,
    } as Partial<TourPlannerController>);
    render(<TourWaypointList planner={controller} canEdit isSaving={false} />);
    const heads = screen.getAllByTestId('tour-stage-divider');
    expect(heads.map((head) => head.getAttribute('data-stage'))).toEqual(['1', '2']);
    const rows = screen.getAllByTestId('tour-planner-waypoint-row');
    expect(at(rows, 2).querySelector('[data-waypoint-stage-end]')).not.toBeNull();
    expect(within(at(rows, 2)).getByLabelText('Waypoint 2, End of stage 1')).toBeInTheDocument();
    expect(at(rows, 0).querySelector('[data-waypoint-stage-end]')).toBeNull();
    // The head of the second stage follows the stop that ends the first.
    expect(at(rows, 2).compareDocumentPosition(at(heads, 1)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(within(at(rows, 2)).getByRole('button', { name: 'More actions' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove stage end' }));
    expect(stages.toggleStageEnd).toHaveBeenCalledWith('b');
  });
});
