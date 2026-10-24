// FE-TOUR-STAGE-OVERVIEW-001 to FE-TOUR-STAGE-OVERVIEW-017: a multi-day tour unfolded in the list, its
// stages on days of the trip, and the day plan naming the stage a day holds (MDT-02).
import { act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TourListItem, TourWaypoint } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDay, buildPlace } from '../../../../tests/helpers/factories';
import { render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { tourRepo } from '../../../repo/tourRepo';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTripStore } from '../../../store/tripStore';
import type { AssignmentsMap } from '../../../types';
import { DayPlanPlaceSubline } from '../../Planner/DayPlanPlaceSubline';
import type { TourPlannerController } from '../planner/useTourPlanner';
import TourListRow from '../TourListRow';
import { tourPlannedTimes } from '../tourPresentation';
import { savedStagePoints, savedTourStagesOf } from './savedTourStages';
import { StageDayPicker } from './StageDayPicker';
import { stageNumberOf } from './stageNames';
import { TourStageDayNotice } from './TourStageDayNotice';
import { TourStageDayPills } from './TourStageDayPills';
import { StageTotalsRow, TourStageOverview } from './TourStageOverview';
import type { TourStageDays } from './useTourStageDays';

vi.mock('../planner/useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({}) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('../../shared/Toast', () => ({ useToast: () => toast }));

const LINE: [number, number, number][] = [
  [47, 11, 600],
  [47.01, 11, 700],
  [47.02, 11, 650],
  [47.03, 11, 800],
];
const POINTS: TourWaypoint[] = [
  { lat: 47, lng: 11, role: 'start', sequence: 0, key: 'stop-start', name: 'Valley' },
  { lat: 47.01, lng: 11, role: 'via', sequence: 1, key: 'stop-hut', name: 'Upper hut', stage_end: true },
  { lat: 47.03, lng: 11, role: 'end', sequence: 2, key: 'stop-end', name: 'Pass' },
];
const TOUR: TourListItem = {
  place_id: 81,
  name: 'Hut to hut',
  tour_type: 'hike',
  distance: 3.3,
  elevation_gain: 250,
  elevation_loss: 50,
  duration: 90,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: 2,
  planned: true,
  caution: false,
  has_waypoints: true,
  revision: 2,
  stage_count: 2,
  stage_stops: [
    { key: 'stop-start', lat: 47, lng: 11 },
    { key: 'stop-hut', lat: 47.01, lng: 11 },
    { key: 'stop-end', lat: 47.03, lng: 11 },
  ],
};
const DAYS = [buildDay({ id: 3, day_number: 1, date: null }), buildDay({ id: 4, day_number: 2, date: null })];

const assignPlaceToDay = vi.fn(async () => undefined);

function seed(assignments: AssignmentsMap = { '3': [], '4': [] }, geometry: string | null = JSON.stringify(LINE)) {
  seedStore(useTripStore, {
    trip: { id: 9 } as never,
    places: [buildPlace({ id: TOUR.place_id, route_geometry: geometry })],
    assignments,
    assignPlaceToDay,
  });
}

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
  vi.spyOn(tourRepo, 'detail').mockResolvedValue({ tour: TOUR, waypoints: POINTS });
});

describe('the stages of a saved tour', () => {
  it('FE-TOUR-STAGE-OVERVIEW-001: reads the stages off the saved points and line, each with its starting key', () => {
    const points = savedStagePoints(TOUR, POINTS);
    const stages = savedTourStagesOf(TOUR, points, JSON.stringify(LINE));
    expect(stages.map((stage) => [stage.number, stage.key])).toEqual([
      [1, 'stop-start'],
      [2, 'stop-hut'],
    ]);
    expect(stages[0].distanceKm).toBeCloseTo(1.11, 1);
    expect(stages[0].gain).toBeGreaterThan(0);
    // Without a line every stage is there, unmeasured.
    expect(savedTourStagesOf(TOUR, points, null).map((stage) => stage.distanceKm)).toEqual([null, null]);
  });

  it('FE-TOUR-STAGE-OVERVIEW-002: a paddle tour times its stages at the paddler speed and leaves heights unknown', () => {
    const paddle = { ...TOUR, tour_type: 'kayak' as const, boat_type: 'canoe' as const, paddle_speed_kmh: 5 };
    const stages = savedTourStagesOf(paddle, savedStagePoints(paddle, POINTS), JSON.stringify(LINE));
    expect(stages[0].gain).toBeNull();
    expect(stages[0].minutes).toBeGreaterThan(0);
    const invalid = { ...paddle, paddle_speed_kmh: 999 };
    expect(savedTourStagesOf(invalid, savedStagePoints(invalid, POINTS), JSON.stringify(LINE))[0].minutes).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-003: numbers the stage a day holds from the list, and none for a stage gone', () => {
    expect(stageNumberOf(TOUR, 'stop-start')).toBe(1);
    expect(stageNumberOf(TOUR, 'stop-hut')).toBe(2);
    expect(stageNumberOf(TOUR, 'stop-end')).toBeNull();
    expect(stageNumberOf({ stage_stops: null }, 'stop-hut')).toBeNull();
  });
});

describe('the unfolded tour in the list', () => {
  it('FE-TOUR-STAGE-OVERVIEW-004: lists the stages in route order with their stops, figures and the whole tour', async () => {
    seed({ '3': [{ id: 31, place_id: 81, tour_stage_key: 'stop-hut' }], '4': [] } as unknown as AssignmentsMap);
    render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />);
    const items = await screen.findAllByTestId('tour-stage-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Valley');
    expect(items[0]).toHaveTextContent('Upper hut');
    expect(items[1]).toHaveTextContent('Pass');
    expect(within(items[0]).getByTestId('tour-stage-day')).toHaveAttribute('data-stage-day', 'none');
    expect(within(items[0]).getByTestId('tour-stage-day')).toHaveTextContent('No day');
    expect(within(items[1]).getByTestId('tour-stage-day')).toHaveAttribute('data-stage-day', '3');
    expect(within(items[1]).getByTestId('tour-stage-day')).toHaveTextContent('Day 1');
    const totals = screen.getByTestId('tour-stage-totals');
    expect(totals).toHaveTextContent('Whole tour');
    expect(totals.querySelector('[data-stage-total-partial]')).toBeNull();
    expect(tourRepo.detail).toHaveBeenCalledWith(9, 81, expect.any(AbortSignal));
  });

  it('FE-TOUR-STAGE-OVERVIEW-005: a stage the route has not measured says so, and nothing is added up', async () => {
    seed(undefined, null);
    render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />);
    const items = await screen.findAllByTestId('tour-stage-item');
    expect(items[0]).toHaveTextContent('Not measured yet');
    expect(screen.queryByTestId('tour-stage-totals')).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-014: a total some stages do not tell is marked as at least that much, and says for how many', () => {
    const unknown = { value: null, known: 0, of: 2 };
    render(
      <StageTotalsRow
        tour={TOUR}
        totals={{
          distanceKm: { value: 10, known: 1, of: 2 },
          gain: unknown,
          loss: unknown,
          minutes: { value: 300, known: 2, of: 2 },
        }}
      />
    );
    const totals = screen.getByTestId('tour-stage-totals');
    expect(totals).toHaveTextContent('≥ 10');
    expect(totals.querySelectorAll('[data-stage-total-partial]')).toHaveLength(1);
    expect(screen.getByLabelText(/known for 1 of 2 stages/)).toBeInTheDocument();
  });

  it('FE-TOUR-STAGE-OVERVIEW-006: says when the stages cannot be read, and reads them again for a new revision', async () => {
    seed();
    vi.mocked(tourRepo.detail).mockRejectedValueOnce(new Error('offline'));
    const view = render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />);
    expect(await screen.findByText('The stages cannot be read right now.')).toBeInTheDocument();
    view.rerender(<TourStageOverview id="stages" tripId={9} tour={{ ...TOUR, revision: 3 }} days={DAYS} canAssign />);
    expect(await screen.findAllByTestId('tour-stage-item')).toHaveLength(2);
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
  });

  it('FE-TOUR-STAGE-OVERVIEW-007: puts a stage on a day from its pill and opens it in the planner', async () => {
    seed();
    const onOpenStage = vi.fn();
    render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign onOpenStage={onOpenStage} />);
    const items = await screen.findAllByTestId('tour-stage-item');
    await userEvent.click(within(items[1]).getByTestId('tour-stage-day'));
    await userEvent.click(await screen.findByText('Day 2'));
    expect(assignPlaceToDay).toHaveBeenCalledWith(9, 4, 81, null, 'stop-hut');
    await userEvent.click(within(items[1]).getByTestId('tour-stage-open'));
    expect(onOpenStage).toHaveBeenCalledWith(TOUR, 'stop-hut');
  });

  it('FE-TOUR-STAGE-OVERVIEW-015: Escape closes the day menu of a stage', async () => {
    seed();
    render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />);
    const items = await screen.findAllByTestId('tour-stage-item');
    await userEvent.click(within(items[1]).getByTestId('tour-stage-day'));
    expect(await screen.findByText('Day 2')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Day 2')).toBeNull());
  });

  it('FE-TOUR-STAGE-OVERVIEW-008: who may not change the days sees the day without a menu and no way to open', async () => {
    seed();
    render(<TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign={false} />);
    const pill = (await screen.findAllByTestId('tour-stage-day'))[0];
    expect(pill).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(pill);
    expect(screen.queryByText('Day 2')).toBeNull();
    expect(screen.queryByTestId('tour-stage-open')).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-009: a click inside the stages does not open the tour of the row', async () => {
    seed();
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    render(
      <ul>
        <TourListRow
          tour={TOUR}
          onSelect={onSelect}
          fold={{ expanded: true, onToggle, label: 'Hide stages', controls: 'stages' }}
        >
          <TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />
        </TourListRow>
      </ul>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Hide stages' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(await screen.findByTestId('tour-stage-overview'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Hide stages' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('a stage day picker', () => {
  function daysOf(overrides: Partial<TourStageDays> = {}): TourStageDays {
    return {
      canAssign: true,
      dayOf: vi.fn(() => 3),
      isPending: vi.fn(() => false),
      canTake: vi.fn((_key: string, dayId: number) => dayId !== 3),
      setDay: vi.fn(async () => true),
      ...overrides,
    };
  }

  it('FE-TOUR-STAGE-OVERVIEW-010: offers the other days, checks the one it is on and takes it off with no day', async () => {
    const stageDays = daysOf();
    render(<StageDayPicker stageKey="stop-hut" stageNumber={2} days={DAYS} stageDays={stageDays} />);
    const pill = screen.getByTestId('tour-stage-day');
    expect(pill).toHaveAccessibleName('Stage 2: Day 1');
    await userEvent.click(pill);
    expect(screen.getByRole('button', { name: 'Day 1' })).toBeDisabled();
    await userEvent.click(screen.getByText('No day'));
    expect(stageDays.setDay).toHaveBeenCalledWith('stop-hut', null);
  });

  it('FE-TOUR-STAGE-OVERVIEW-011: a stage on its way spins and opens nothing', async () => {
    const stageDays = daysOf({ isPending: vi.fn(() => true), dayOf: vi.fn(() => null) });
    render(<StageDayPicker stageKey="stop-hut" stageNumber={2} days={DAYS} stageDays={stageDays} />);
    await userEvent.click(screen.getByTestId('tour-stage-day'));
    expect(screen.queryByText('Day 2')).toBeNull();
    expect(screen.getByTestId('tour-stage-day').querySelector('.animate-spin')).not.toBeNull();
  });
});

describe('the stage a day holds', () => {
  it('FE-TOUR-STAGE-OVERVIEW-012: the day plan names the stage with its own figures, and nothing for a stage gone', async () => {
    seed();
    const view = render(<TourStageDayPills tour={TOUR} stageKey="stop-hut" />);
    const pills = screen.getByTestId('trip-plan-tour-stage');
    expect(pills).toHaveTextContent('Stage 2');
    await waitFor(() => expect(pills).toHaveTextContent('km'));
    view.rerender(<TourStageDayPills tour={TOUR} stageKey="stop-gone" />);
    expect(screen.queryByTestId('trip-plan-tour-stage')).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-013: the planner says before a save which stages on a day the change takes away', () => {
    seed({ '3': [{ id: 31, place_id: 81, tour_stage_key: 'stop-hut' }] } as unknown as AssignmentsMap);
    const planner = (waypoints: Array<Record<string, unknown>>, mode: unknown = { type: 'edit-saved', placeId: 81 }) =>
      ({ mode, waypoints }) as unknown as TourPlannerController;
    const kept = [
      { id: 'a', key: 'stop-start' },
      { id: 'b', key: 'stop-hut', stageEnd: true },
      { id: 'c', key: 'stop-end' },
    ];
    const view = render(<TourStageDayNotice planner={planner(kept)} />);
    expect(screen.queryByTestId('tour-stage-day-loss')).toBeNull();
    act(() => {
      view.rerender(<TourStageDayNotice planner={planner(kept.map(({ stageEnd: _end, ...point }) => point))} />);
    });
    expect(screen.getByTestId('tour-stage-day-loss')).toHaveTextContent(
      'A stage on a day no longer exists; saving takes it off its day.'
    );
    view.rerender(<TourStageDayNotice planner={planner(kept, { type: 'new-draft' })} />);
    expect(screen.queryByTestId('tour-stage-day-loss')).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-015: a day plan row shows the stage it holds, and the whole tour without one', () => {
    seed();
    const place = buildPlace({ id: TOUR.place_id, name: 'Hut to hut' });
    const times = { ...tourPlannedTimes(TOUR), tour: TOUR };
    const row = (tourStageKey?: string | null) => (
      <DayPlanPlaceSubline
        place={place}
        cat={undefined}
        tourTimes={times}
        isTourPlace
        timeFormat="24h"
        tourStageKey={tourStageKey}
      />
    );
    const view = render(row('stop-start'));
    expect(screen.getByTestId('trip-plan-tour-stage')).toHaveTextContent('Stage 1');
    view.rerender(row(null));
    expect(screen.queryByTestId('trip-plan-tour-stage')).toBeNull();
    view.rerender(row('stop-gone'));
    expect(screen.queryByTestId('trip-plan-tour-stage')).toBeNull();
  });

  it('FE-TOUR-STAGE-OVERVIEW-016: the list and every day holding a stage of the tour share one read of it', async () => {
    seed();
    render(
      <>
        <TourStageOverview id="stages" tripId={9} tour={TOUR} days={DAYS} canAssign />
        <TourStageDayPills tour={TOUR} stageKey="stop-start" />
        <TourStageDayPills tour={TOUR} stageKey="stop-hut" />
      </>
    );
    expect(await screen.findAllByTestId('tour-stage-item')).toHaveLength(2);
    await waitFor(() => {
      for (const pills of screen.getAllByTestId('trip-plan-tour-stage')) expect(pills).toHaveTextContent('km');
    });
    expect(tourRepo.detail).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-STAGE-OVERVIEW-017: a read no row shows any more is let go, and the next row reads again', async () => {
    seed();
    const first = render(<TourStageDayPills tour={TOUR} stageKey="stop-hut" />);
    const signal = vi.mocked(tourRepo.detail).mock.calls[0]?.[2];
    first.unmount();
    expect(signal?.aborted).toBe(true);
    render(<TourStageDayPills tour={TOUR} stageKey="stop-hut" />);
    await waitFor(() => expect(screen.getByTestId('trip-plan-tour-stage')).toHaveTextContent('km'));
    expect(tourRepo.detail).toHaveBeenCalledTimes(2);
  });
});
