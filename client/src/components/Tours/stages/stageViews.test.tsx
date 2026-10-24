// FE-TOUR-STAGE-VIEW-001 to FE-TOUR-STAGE-VIEW-008: the stages of a multi-day tour in the planner,
// the list and the overview (MDT-01).
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { stageMenuItems } from './stageActions';
import { StageDivider, TourStagesBadge } from './StageParts';
import { TourStageLossNotice } from './TourStageLossNotice';
import { TourStageModeField } from './TourStageModeField';
import type { TourStage } from './tourStages';
import { TourStagesSection } from './TourStagesSection';
import type { TourStagesController } from './useTourStages';

vi.mock('../planner/useWaypointPlaceNames', () => ({ useWaypointPlaceNames: () => ({ b: 'Upper hut' }) }));

const STAGE: TourStage = {
  number: 2,
  from: 1,
  to: 3,
  fromId: 'b',
  toId: 'd',
  distanceKm: 12.4,
  gain: 820,
  loss: 310,
  minutes: 330,
  fromM: 9000,
  toM: 21400,
  overDay: false,
};

function stagesOf(overrides: Partial<TourStagesController> = {}): TourStagesController {
  return {
    multiDay: false,
    stages: [],
    endCount: 0,
    lost: 0,
    setMultiDay: vi.fn(),
    toggleStageEnd: vi.fn(),
    canEnd: vi.fn(() => true),
    ...overrides,
  };
}

function plannerOf(stages: TourStagesController, extra: Record<string, unknown> = {}) {
  return {
    stages,
    waypoints: [
      { id: 'a', lat: 47, lng: 11, role: 'start', name: 'Valley' },
      { id: 'b', lat: 47.1, lng: 11, role: 'via', stageEnd: true },
      { id: 'd', lat: 47.2, lng: 11, role: 'end', name: 'Pass' },
    ],
    routeAnalysis: null,
    setSelectedWaypointId: vi.fn(),
    setRouteProfileFocus: vi.fn(),
    undo: vi.fn(),
    canUndo: true,
    ...extra,
  } as unknown as TourPlannerController;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

describe('stage views', () => {
  it('FE-TOUR-STAGE-VIEW-001: a stage head names the stage and what it measures, distance and time only', () => {
    render(
      <ol>
        <StageDivider stage={STAGE} />
      </ol>
    );
    const head = screen.getByTestId('tour-stage-divider');
    expect(head).toHaveAttribute('data-stage', '2');
    expect(within(head).getByText('Stage 2')).toBeInTheDocument();
    expect(within(head).getByText('12.4 km')).toBeInTheDocument();
    expect(within(head).queryByText(/820/)).toBeNull();
    expect(head.querySelector('[data-stage-over-day]')).toBeNull();
  });

  it('FE-TOUR-STAGE-VIEW-002: a stage of more than a day on the move warns, and an unknown value leaves its badge out', () => {
    render(
      <ol>
        <StageDivider stage={{ ...STAGE, minutes: 1500, overDay: true, distanceKm: null }} />
      </ol>
    );
    const head = screen.getByTestId('tour-stage-divider');
    expect(head.querySelector('[data-stage-over-day="true"]')).not.toBeNull();
    expect(within(head).queryByText(/km/)).toBeNull();
  });

  it('FE-TOUR-STAGE-VIEW-003: a multi-day tour in a list says how many stages it has; a day tour says nothing', () => {
    const { rerender } = render(<TourStagesBadge tour={{ stage_count: 3 }} />);
    expect(screen.getByRole('img', { name: '3 stages' })).toBe(screen.getByTestId('tour-stages-badge'));
    expect(screen.getByTestId('tour-stages-count')).toHaveTextContent('3');
    rerender(<TourStagesBadge tour={{ stage_count: null }} />);
    expect(screen.queryByTestId('tour-stages-badge')).toBeNull();
  });

  it('FE-TOUR-STAGE-VIEW-004: a stop menu ends a stage or lets it go on, and offers nothing where no stage can end', () => {
    const t = (key: string) => key;
    const stages = stagesOf();
    const [divider, end] = stageMenuItems(stages, { id: 'b' }, t);
    expect(divider).toEqual({ divider: true });
    expect(end).toMatchObject({ label: 'tours.stages.endHere' });
    (end as { onClick: () => void }).onClick();
    expect(stages.toggleStageEnd).toHaveBeenCalledWith('b');
    expect(stageMenuItems(stages, { id: 'b', stageEnd: true }, t)[1]).toMatchObject({
      label: 'tours.stages.removeEnd',
    });
    expect(stageMenuItems(stagesOf({ canEnd: vi.fn(() => false) }), { id: 'a' }, t)).toEqual([]);
  });

  it('FE-TOUR-STAGE-VIEW-005: choosing a multi-day tour shows where its first stage end is set', async () => {
    const stages = stagesOf();
    const { rerender } = render(<TourStageModeField planner={plannerOf(stages)} locked={false} />);
    await userEvent.click(screen.getByRole('button', { name: /Multi-day tour/ }));
    expect(stages.setMultiDay).toHaveBeenCalledWith(true);
    rerender(<TourStageModeField planner={plannerOf(stagesOf({ multiDay: true }))} locked={false} />);
    expect(screen.getByText('In the menu of a stop, choose End stage here to split the route.')).toBeInTheDocument();
  });

  it('FE-TOUR-STAGE-VIEW-006: back to a day tour asks first when stage ends would go, and not when none would', async () => {
    const withEnds = stagesOf({ multiDay: true, endCount: 2 });
    const { rerender } = render(<TourStageModeField planner={plannerOf(withEnds)} locked={false} />);
    await userEvent.click(screen.getByRole('button', { name: /Day tour/ }));
    expect(withEnds.setMultiDay).not.toHaveBeenCalled();
    expect(
      screen.getByText('The 2 stage ends are removed. The route stays as it is, and undo brings them back.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove stage ends' }));
    expect(withEnds.setMultiDay).toHaveBeenCalledWith(false);

    const chosenOnly = stagesOf({ multiDay: true });
    rerender(<TourStageModeField planner={plannerOf(chosenOnly)} locked={false} />);
    await userEvent.click(screen.getByRole('button', { name: /Day tour/ }));
    expect(chosenOnly.setMultiDay).toHaveBeenCalledWith(false);
  });

  it('FE-TOUR-STAGE-VIEW-007: a lost stage end is said with the way back, and nothing is said while none is lost', async () => {
    const planner = plannerOf(stagesOf({ lost: 1 }));
    const { rerender } = render(<TourStageLossNotice planner={planner} />);
    expect(screen.getByTestId('tour-stage-loss')).toHaveTextContent(
      '1 stage end was dropped with its stop; its two stages are joined now.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(planner.undo).toHaveBeenCalled();
    rerender(<TourStageLossNotice planner={plannerOf(stagesOf({ lost: 1 }), { canUndo: false })} />);
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
    rerender(<TourStageLossNotice planner={plannerOf(stagesOf())} />);
    expect(screen.queryByTestId('tour-stage-loss')).toBeNull();
  });

  it('FE-TOUR-STAGE-VIEW-008: the overview lists the stages by their stops and shows where one ends', async () => {
    const first: TourStage = { ...STAGE, number: 1, from: 0, to: 1, fromId: 'a', toId: 'b', fromM: 0, toM: 9000 };
    const last: TourStage = { ...STAGE, toM: null };
    const planner = plannerOf(stagesOf({ multiDay: true, stages: [first, last] }));
    render(<TourStagesSection planner={planner} />);
    const rows = screen.getAllByTestId('tour-stage-row');
    expect(rows[0]).toHaveTextContent('Valley');
    expect(rows[0]).toHaveTextContent('Upper hut');
    expect(rows[1]).toHaveTextContent('Pass');
    expect(rows[0].querySelector('[data-waypoint-stage-end]')).not.toBeNull();
    expect(rows[1].querySelector('[data-waypoint-stage-end]')).toBeNull();
    await userEvent.click(rows[0]);
    expect(planner.setSelectedWaypointId).toHaveBeenCalledWith('b');
    expect(planner.setRouteProfileFocus).toHaveBeenCalledWith(null);
    await userEvent.click(rows[1]);
    expect(planner.setSelectedWaypointId).toHaveBeenLastCalledWith('d');
    expect(planner.setRouteProfileFocus).toHaveBeenLastCalledWith(null);
  });

  it('FE-TOUR-STAGE-VIEW-009: a day tour has no stage list', () => {
    render(<TourStagesSection planner={plannerOf(stagesOf())} />);
    expect(screen.queryByTestId('tour-stages')).toBeNull();
  });
});
