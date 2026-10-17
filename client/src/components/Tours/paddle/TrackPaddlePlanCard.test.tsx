// FE-COMP-PADDLE-TRACKPLAN-001 to FE-COMP-PADDLE-TRACKPLAN-016: the cards of a recorded paddle track, its time
// estimate reckoned with the portages and locks laid onto it, and the card that marks them by a click on the line.
import {
  DEFAULT_PORTAGE_SPEED_KMH,
  estimatePaddleTime,
  paddleLayoutOfTrack,
  recommendedPaddleSpeedKmh,
  type TourListItem,
  type TrackMarks,
} from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useShallow } from 'zustand/react/shallow';
import { buildSettings } from '../../../../tests/helpers/factories';
import { act, fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  loadTrackMarks,
  pickOnTrack,
  refuseTrackPick,
  startTrackPick,
  trackMarkEdits,
  useTrackMarkToolStore,
  type TrackSpeeds,
} from '../../../store/trackMarkToolStore';
import { NO_TRACK_MARKS } from '../../../utils/paddleTrackMarks';
import { TrackPaddlePlanCards } from './TrackPaddlePlanCard';
import type { TrackPaddlePlan } from './useTrackPaddlePlan';

const EMPTY = 'Nothing marked yet. The recorded track stays as it is.';

/** What the card says a click on the line does next, or why the last one placed nothing. */
const HINT = {
  lock: 'Click the line where the lock is.',
  takeOut: 'Click the line where you get out.',
  reEntry: 'Now click where you put back in.',
  overlap: 'A portage is already marked there. Mark the new one beside it.',
  offLine: 'That was too far from the line. Click right on the track.',
};

/** A time that is not known reads as an en dash; a planned total that falls short carries a real minus sign. */
const DASH = '–';
const MINUS = '−';

/** The recorded track is 6.5 km long. */
const TOTAL_M = 6500;

const NO_SPEEDS: TrackSpeeds = { paddle: null, portage: null };

/** A portage from 2 to 2.5 km at the starting time out and in, and a lock at 4 km with both its times. */
const MARKS: TrackMarks = {
  portages: [{ from_m: 2000, to_m: 2500, extra_minutes: null }],
  locks: [{ at_m: 4000, wait_minutes: 5, transit_minutes: 10 }],
};

/** Two of each in order along the track: the second portage has its own time, the second lock none yet. */
const TWO: TrackMarks = {
  portages: [
    { from_m: 1000, to_m: 1300, extra_minutes: null },
    { from_m: 3000, to_m: 3400, extra_minutes: 25 },
  ],
  locks: [
    { at_m: 2000, wait_minutes: 5, transit_minutes: 10 },
    { at_m: 5000, wait_minutes: null, transit_minutes: null },
  ],
};

const TOUR: TourListItem = {
  place_id: 21,
  name: 'Recorded river run',
  tour_type: 'kayak',
  distance: 6.5,
  elevation_gain: null,
  elevation_loss: null,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: null,
  planned: false,
  caution: false,
  boat_type: 'kayak',
  break_additional_minutes: 20,
  planned_duration_minutes: 120,
  track_marks: MARKS,
};

/**
 * A plan as useTrackPaddlePlan hands it to the cards: an open paddle track the
 * viewer may edit, nothing picked, its layout and estimate reckoned from the
 * marks and speeds the way the hook reckons them, and every action a spy.
 */
function planOf({
  marks = NO_TRACK_MARKS,
  speeds = NO_SPEEDS,
  recommendedPaddleSpeed = recommendedPaddleSpeedKmh(TOUR.boat_type),
  ...rest
}: Partial<TrackPaddlePlan> = {}): TrackPaddlePlan {
  const layout = paddleLayoutOfTrack(TOTAL_M, marks);
  return {
    active: true,
    canEdit: true,
    saving: false,
    dirty: false,
    pick: null,
    pendingFromM: null,
    refused: null,
    totalM: TOTAL_M,
    marks,
    speeds,
    layout,
    estimate: estimatePaddleTime(layout, {
      paddleSpeedKmh: speeds.paddle ?? recommendedPaddleSpeed,
      portageSpeedKmh: speeds.portage,
      breakMinutes: null,
    }),
    recommendedPaddleSpeed,
    defaultPortageSpeed: DEFAULT_PORTAGE_SPEED_KMH,
    startPick: vi.fn(),
    edits: { removePortage: vi.fn(), setPortageExtra: vi.fn(), setLock: vi.fn(), setSpeeds: vi.fn() },
    save: vi.fn(() => Promise.resolve()),
    discard: vi.fn(),
    ...rest,
  };
}

/** The two cards for a plan, on the tour the plan belongs to. */
function cards(plan: TrackPaddlePlan, tour: TourListItem = TOUR) {
  return <TrackPaddlePlanCards plan={plan} tour={tour} />;
}

/** The cards on the shared store the map is clicked into, wired to it the way useTrackPaddlePlan wires them. */
function StoreCards() {
  const state = useTrackMarkToolStore(
    useShallow((store) => ({
      marks: store.marks,
      speeds: store.speeds,
      dirty: store.dirty,
      pick: store.pick,
      pendingFromM: store.pendingFromM,
      refused: store.refused,
    }))
  );
  const plan = planOf({
    ...state,
    startPick: (kind) => startTrackPick(state.pick === kind ? null : kind),
    edits: trackMarkEdits,
  });
  return cards(plan);
}

/** Opens a portage or lock row to its fields. */
function openRow(row: HTMLElement): void {
  fireEvent.click(within(row).getByRole('button', { expanded: false }));
}

/** Types into a field and leaves it: the fields take their value on leaving. */
function enter(input: HTMLElement, value: string): void {
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

describe('TrackPaddlePlanCards', () => {
  beforeEach(() => resetAllStores());

  it('FE-COMP-PADDLE-TRACKPLAN-001: shows nothing while no recorded paddle track is open', () => {
    const { container } = render(cards(planOf({ active: false, marks: MARKS, dirty: true })));
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-002: reckons the time with the portages and locks laid on, the breaks, and the planned total beside it', () => {
    render(cards(planOf({ marks: MARKS })));

    expect(screen.getByRole('region', { name: 'Time estimate' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Portages and locks' })).toBeInTheDocument();
    // 6 km of water at the kayak's 4 km/h, 500 m carried at 2 km/h, 10 min out and in, a 15 min lock, 20 min of breaks.
    expect(screen.getByTestId('paddle-time-estimate')).toHaveTextContent('2 h 30 min');
    const water = screen.getByTestId('paddle-time-water');
    expect(water).toHaveTextContent('6 km');
    expect(water).toHaveTextContent('1 h 30 min');
    expect(screen.getByTestId('paddle-time-water-speed')).toHaveAttribute('placeholder', '4');
    const carry = screen.getByTestId('paddle-time-carry');
    expect(carry).toHaveTextContent('500 m');
    expect(carry).toHaveTextContent('15 min');
    expect(screen.getByTestId('paddle-time-carry-speed')).toHaveAttribute('placeholder', '2');
    expect(screen.getByTestId('paddle-time-out-in')).toHaveTextContent('1×');
    expect(screen.getByTestId('paddle-time-out-in')).toHaveTextContent('10 min');
    expect(screen.getByTestId('paddle-time-locks')).toHaveTextContent('1×');
    expect(screen.getByTestId('paddle-time-locks')).toHaveTextContent('15 min');
    expect(screen.getByTestId('paddle-time-breaks')).toHaveTextContent('20 min');
    const planned = screen.getByTestId('paddle-time-planned');
    expect(planned).toHaveTextContent('Your planned total');
    expect(within(planned).getByText('2 h')).toBeInTheDocument();
    expect(screen.getByTestId('paddle-time-deviation')).toHaveTextContent(`${MINUS}30 min`);
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('paddle-route-strip-lock')).toHaveLength(1);
  });

  it('FE-COMP-PADDLE-TRACKPLAN-003: without a paddling speed or lock times the estimate is incomplete and names what is missing', () => {
    const marks: TrackMarks = { portages: [], locks: [{ at_m: 3000, wait_minutes: null, transit_minutes: null }] };
    const tour = { ...TOUR, break_additional_minutes: null, planned_duration_minutes: null };
    render(cards(planOf({ marks, recommendedPaddleSpeed: null }), tour));

    const missing = 'Without a paddling speed the time on the water stays open. One lock has no times yet.';
    expect(screen.getByText(missing)).toBeInTheDocument();
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByTestId('paddle-time-estimate')).toHaveTextContent('0 min');
    const water = screen.getByTestId('paddle-time-water');
    expect(water).toHaveTextContent('6.5 km');
    expect(within(water).getByText(DASH)).toBeInTheDocument();
    expect(screen.getByTestId('paddle-time-water-speed')).toHaveAttribute('placeholder', DASH);
    const locks = screen.getByTestId('paddle-time-locks');
    expect(locks).toHaveTextContent('1×');
    expect(within(locks).getByText(DASH)).toHaveClass('text-warning');
    expect(within(screen.getByTestId('paddle-time-breaks')).getByText(DASH)).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-planned')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-carry')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-004: the paddling and carrying speeds are typed in place, with either decimal separator, empty for the starting value', () => {
    const plan = planOf({ marks: MARKS, speeds: { paddle: 4.5, portage: null } });
    render(cards(plan));
    const paddle = screen.getByTestId('paddle-time-water-speed');
    const carry = screen.getByTestId('paddle-time-carry-speed');
    expect(paddle).toHaveValue('4.5');
    expect(screen.getByTestId('paddle-time-water')).toHaveTextContent('1 h 20 min');
    expect(carry).toHaveValue('');
    expect(carry).toHaveAttribute('placeholder', '2');

    enter(paddle, '5,5');
    expect(plan.edits.setSpeeds).toHaveBeenCalledWith({ paddle: 5.5 });
    enter(carry, '3');
    expect(plan.edits.setSpeeds).toHaveBeenLastCalledWith({ portage: 3 });
    enter(paddle, '');
    expect(plan.edits.setSpeeds).toHaveBeenLastCalledWith({ paddle: null });
  });

  it('FE-COMP-PADDLE-TRACKPLAN-005: with nothing marked it says the track stays as recorded, and each tool asks for its own pick', () => {
    const plan = planOf();
    render(cards(plan));

    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(screen.queryByTestId('tour-planner-portage-leg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tour-planner-lock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-carry')).not.toBeInTheDocument();
    for (const hint of Object.values(HINT)) expect(screen.queryByText(hint)).not.toBeInTheDocument();
    const portage = screen.getByTestId('track-marks-pick-portage');
    const lock = screen.getByTestId('track-marks-pick-lock');
    expect(portage).toHaveTextContent('Portage');
    expect(lock).toHaveTextContent('Lock');
    expect(portage).toHaveAttribute('aria-pressed', 'false');
    expect(lock).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(portage);
    expect(plan.startPick).toHaveBeenCalledWith('portage');
    fireEvent.click(lock);
    expect(plan.startPick).toHaveBeenLastCalledWith('lock');
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-006: the tool that is on shows pressed and says what the next click on the line does', () => {
    const { rerender } = render(cards(planOf({ pick: 'lock' })));
    expect(screen.getByTestId('track-marks-pick-lock')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('track-marks-pick-portage')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(HINT.lock).parentElement).toHaveClass('bg-surface-card');
    expect(screen.getByText(HINT.lock).parentElement).not.toHaveClass('bg-warning-soft');

    rerender(cards(planOf({ pick: 'portage' })));
    expect(screen.getByTestId('track-marks-pick-portage')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(HINT.takeOut)).toBeInTheDocument();
    expect(screen.queryByText(HINT.lock)).not.toBeInTheDocument();

    rerender(cards(planOf({ pick: 'portage', pendingFromM: 2000 })));
    expect(screen.getByText(HINT.reEntry)).toBeInTheDocument();
    expect(screen.queryByText(HINT.takeOut)).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-007: a click that placed nothing says why in the warning tone, instead of what the tool does', () => {
    const { rerender } = render(cards(planOf({ pick: 'portage', refused: 'overlap' })));
    expect(screen.getByText(HINT.overlap).parentElement).toHaveClass('bg-warning-soft');
    expect(screen.queryByText(HINT.takeOut)).not.toBeInTheDocument();

    rerender(cards(planOf({ pick: 'portage', refused: 'off_line' })));
    expect(screen.getByText(HINT.offLine).parentElement).toHaveClass('bg-warning-soft');
    expect(screen.queryByText(HINT.overlap)).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-008: lists every portage and lock where it lies on the track, with its length and its times', () => {
    render(cards(planOf({ marks: TWO })));

    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
    const [near, far] = screen.getAllByTestId('tour-planner-portage-leg');
    expect(near).toHaveTextContent('at 1 km');
    expect(near).toHaveTextContent('300 m');
    expect(near).toHaveTextContent('+10 min');
    expect(far).toHaveTextContent('at 3 km');
    expect(far).toHaveTextContent('400 m');
    expect(far).toHaveTextContent('+25 min');
    const [timed, untimed] = screen.getAllByTestId('tour-planner-lock');
    expect(timed).toHaveTextContent('at 2 km');
    expect(timed).toHaveTextContent('15 min');
    expect(untimed).toHaveTextContent('at 5 km');
    expect(within(untimed).getByText('Time missing')).toHaveClass('text-warning');

    openRow(near);
    expect(within(near).getByText('Starting value')).toBeInTheDocument();
    expect(within(near).getByTestId('tour-planner-portage-extra')).toHaveAttribute('placeholder', '10');
  });

  it('FE-COMP-PADDLE-TRACKPLAN-009: a lock a portage carries round is dimmed, reads carried round, and its times do not count', () => {
    const marks: TrackMarks = {
      portages: [{ from_m: 2000, to_m: 2500, extra_minutes: null }],
      locks: [{ at_m: 2200, wait_minutes: null, transit_minutes: null }],
    };
    render(cards(planOf({ marks })));

    const lock = screen.getByTestId('tour-planner-lock');
    expect(lock).toHaveTextContent('Carried round, the portage counts');
    expect(lock).not.toHaveTextContent('Time missing');
    expect(within(lock).getByRole('button', { expanded: false })).toHaveClass('opacity-60');
    expect(screen.queryByTestId('paddle-time-locks')).not.toBeInTheDocument();
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-010: a change or a removal goes to the mark of its own row, by its place in the list', () => {
    const plan = planOf({ marks: TWO });
    render(cards(plan));

    const portage = screen.getAllByTestId('tour-planner-portage-leg')[1];
    openRow(portage);
    const extra = within(portage).getByTestId('tour-planner-portage-extra');
    enter(extra, '15');
    expect(plan.edits.setPortageExtra).toHaveBeenCalledWith(1, 15);
    enter(extra, '');
    expect(plan.edits.setPortageExtra).toHaveBeenLastCalledWith(1, null);
    fireEvent.click(within(portage).getByRole('button', { name: 'Remove the portage' }));
    expect(plan.edits.removePortage).toHaveBeenCalledWith(1);

    const lock = screen.getAllByTestId('tour-planner-lock')[1];
    openRow(lock);
    enter(within(lock).getByTestId('tour-planner-lock-wait'), '8');
    expect(plan.edits.setLock).toHaveBeenCalledWith(1, { at_m: 5000, wait_minutes: 8, transit_minutes: null });
    fireEvent.click(within(lock).getByRole('button', { name: 'Remove the lock' }));
    expect(plan.edits.setLock).toHaveBeenLastCalledWith(1, null);
  });

  it('FE-COMP-PADDLE-TRACKPLAN-011: says where a mark lies in the distance unit the user reads, metric without one', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'imperial' }) });
    render(cards(planOf({ marks: MARKS })));
    expect(screen.getByTestId('tour-planner-portage-leg')).toHaveTextContent('at 1.2 mi');
    expect(screen.getByTestId('tour-planner-portage-leg')).toHaveTextContent('0.3 mi');
    expect(screen.getByTestId('tour-planner-lock')).toHaveTextContent('at 2.5 mi');

    act(() => seedStore(useSettingsStore, { settings: buildSettings() }));
    expect(screen.getByTestId('tour-planner-portage-leg')).toHaveTextContent('at 2 km');
    expect(screen.getByTestId('tour-planner-lock')).toHaveTextContent('at 4 km');
  });

  it('FE-COMP-PADDLE-TRACKPLAN-012: offers save and discard only once something changed, and hands each on', () => {
    const { rerender } = render(cards(planOf({ marks: MARKS })));
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();

    const plan = planOf({ marks: MARKS, dirty: true });
    rerender(cards(plan));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(plan.save).toHaveBeenCalledTimes(1);
    expect(plan.discard).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(plan.discard).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-PADDLE-TRACKPLAN-013: while it saves, the tools, the fields and both buttons hold still and nothing can be removed', () => {
    const plan = planOf({ marks: MARKS, dirty: true, saving: true });
    render(cards(plan));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
    expect(screen.getByTestId('track-marks-pick-portage')).toBeDisabled();
    const pickLock = screen.getByTestId('track-marks-pick-lock');
    expect(pickLock).toBeDisabled();
    fireEvent.click(pickLock);
    expect(plan.startPick).not.toHaveBeenCalled();
    expect(screen.getByTestId('paddle-time-water-speed')).toBeDisabled();
    expect(screen.getByTestId('paddle-time-carry-speed')).toBeDisabled();

    const portage = screen.getByTestId('tour-planner-portage-leg');
    openRow(portage);
    expect(within(portage).getByTestId('tour-planner-portage-extra')).toBeDisabled();
    expect(within(portage).queryByRole('button', { name: 'Remove the portage' })).not.toBeInTheDocument();
    const lock = screen.getByTestId('tour-planner-lock');
    openRow(lock);
    expect(within(lock).queryByRole('button', { name: 'Remove the lock' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-014: a viewer who may not edit reads the marks and the estimate, with no tools, no save and nothing to change', () => {
    render(cards(planOf({ marks: MARKS, dirty: true, canEdit: false })));

    expect(screen.queryByTestId('track-marks-pick-portage')).not.toBeInTheDocument();
    expect(screen.queryByTestId('track-marks-pick-lock')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-time-estimate')).toHaveTextContent('2 h 30 min');
    expect(screen.getByTestId('paddle-time-water-speed')).toBeDisabled();
    expect(screen.getByTestId('paddle-time-carry-speed')).toBeDisabled();

    const lock = screen.getByTestId('tour-planner-lock');
    openRow(lock);
    expect(within(lock).getByTestId('tour-planner-lock-wait')).toBeDisabled();
    expect(within(lock).getByTestId('tour-planner-lock-transit')).toBeDisabled();
    expect(within(lock).queryByRole('button', { name: 'Remove the lock' })).not.toBeInTheDocument();
    const portage = screen.getByTestId('tour-planner-portage-leg');
    openRow(portage);
    expect(within(portage).queryByRole('button', { name: 'Remove the portage' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-015: on the shared store, two clicks lay a portage, a refused click says why, and Remove takes it off', () => {
    loadTrackMarks(TOUR.place_id, null, NO_SPEEDS);
    render(<StoreCards />);
    expect(screen.getByText(EMPTY)).toBeInTheDocument();

    // A second press on the tool that is on turns it off again.
    const pickLock = screen.getByTestId('track-marks-pick-lock');
    fireEvent.click(pickLock);
    expect(pickLock).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(pickLock);
    expect(pickLock).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(HINT.lock)).not.toBeInTheDocument();

    const pickPortage = screen.getByTestId('track-marks-pick-portage');
    fireEvent.click(pickPortage);
    expect(screen.getByText(HINT.takeOut)).toBeInTheDocument();
    act(() => pickOnTrack(1000));
    expect(screen.getByText(HINT.reEntry)).toBeInTheDocument();
    act(() => pickOnTrack(1500));
    const portage = screen.getByTestId('tour-planner-portage-leg');
    expect(portage).toHaveTextContent('at 1 km');
    expect(portage).toHaveTextContent('500 m');
    expect(pickPortage).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('paddle-time-carry')).toHaveTextContent('500 m');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

    fireEvent.click(pickPortage);
    act(() => pickOnTrack(1200));
    act(() => pickOnTrack(1800));
    expect(screen.getByText(HINT.overlap)).toBeInTheDocument();
    expect(screen.getAllByTestId('tour-planner-portage-leg')).toHaveLength(1);
    act(() => refuseTrackPick());
    expect(screen.getByText(HINT.offLine)).toBeInTheDocument();

    openRow(portage);
    fireEvent.click(within(portage).getByRole('button', { name: 'Remove the portage' }));
    expect(screen.queryByTestId('tour-planner-portage-leg')).not.toBeInTheDocument();
    expect(useTrackMarkToolStore.getState().marks.portages).toEqual([]);
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TRACKPLAN-016: on the shared store, a lock laid on the line misses its times until both are entered', () => {
    loadTrackMarks(TOUR.place_id, null, NO_SPEEDS);
    render(<StoreCards />);

    fireEvent.click(screen.getByTestId('track-marks-pick-lock'));
    expect(screen.getByText(HINT.lock)).toBeInTheDocument();
    act(() => pickOnTrack(3000.4));
    expect(screen.getByTestId('track-marks-pick-lock')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(HINT.lock)).not.toBeInTheDocument();
    const lock = screen.getByTestId('tour-planner-lock');
    expect(lock).toHaveTextContent('at 3 km');
    expect(lock).toHaveTextContent('Time missing');
    expect(screen.getByText('One lock has no times yet.')).toBeInTheDocument();
    expect(screen.getByText('Incomplete')).toBeInTheDocument();

    openRow(lock);
    enter(within(lock).getByTestId('tour-planner-lock-wait'), '5');
    enter(within(lock).getByTestId('tour-planner-lock-transit'), '10');
    expect(lock).toHaveTextContent('15 min');
    expect(lock).not.toHaveTextContent('Time missing');
    expect(screen.queryByText('One lock has no times yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
    const { marks } = useTrackMarkToolStore.getState();
    expect(marks.locks).toEqual([{ at_m: 3000, wait_minutes: 5, transit_minutes: 10 }]);

    fireEvent.click(within(lock).getByRole('button', { name: 'Remove the lock' }));
    expect(screen.queryByTestId('tour-planner-lock')).not.toBeInTheDocument();
    expect(useTrackMarkToolStore.getState()).toMatchObject({ dirty: true, marks: { locks: [] } });
  });
});
