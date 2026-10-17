// FE-COMP-PADDLE-TIME-001 to FE-COMP-PADDLE-TIME-015: the time estimate of a paddle tour (PAD-07).
import userEvent from '@testing-library/user-event';
import { paddleLayoutOfPoints, type PaddleLock } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import { hikePlannerDefaults } from '../../../../tests/helpers/tourPlannerStub';
import { useSettingsStore } from '../../../store/settingsStore';
import { paddleEstimateOf, paddlePlanPoints } from '../planner/paddlePlanOf';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { portageLegBetween } from '../planner/tourRouteActions';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { PaddleEstimateBody, PaddleTimeCard, type SpeedControl } from './PaddleTimeCard';

/** What the card writes for a time it cannot give: an en dash. */
const OPEN = '–';
/** The sign of a planned total shorter than the estimate: a minus, not a hyphen. */
const MINUS = '−';

const TIMED_LOCK: PaddleLock = { wait_minutes: 20, transit_minutes: 5 };
const NO_TIMES: PaddleLock = { wait_minutes: null, transit_minutes: null };

function point(id: string, lat: number, extra: Partial<TourPlannerWaypoint> = {}): TourPlannerWaypoint {
  return { id, lat, lng: 11, role: 'via', ...extra };
}

interface RouteShape {
  /** The lock on the water after the portage. */
  lock?: PaddleLock | null;
  /** A lock where the portage starts, so the boat is carried round it. */
  takeOutLock?: PaddleLock | null;
  /** A lock at the final take-out, on the water too. */
  endLock?: PaddleLock | null;
  portage?: boolean;
}

/**
 * Along one meridian, so each stretch is its span of latitude: 8 km of water
 * from the put-in, a 500 m portage, then 2 km of water past a lock to the
 * final take-out, 10.5 km in all.
 */
function route(shape: RouteShape = {}): TourPlannerWaypoint[] {
  const { lock = TIMED_LOCK, takeOutLock = null, endLock = null, portage = true } = shape;
  const takeOut = point('take-out', 48.072, { lock: takeOutLock });
  const reEntry = point('re-entry', 48.0765);
  return [
    point('put-in', 48, { role: 'start' }),
    portage ? { ...takeOut, fixedLeg: portageLegBetween(takeOut, reEntry) } : takeOut,
    reEntry,
    point('lock', 48.0855, { lock }),
    point('final', 48.0945, { role: 'end', lock: endLock }),
  ];
}

interface CardSetup {
  waypoints?: TourPlannerWaypoint[];
  /** The paddling speed in effect: 4 km/h unless told otherwise, null for none. */
  speedKmh?: number | null;
  portageSpeedKmh?: number | null;
  breakMinutes?: number | null;
  plannedMinutes?: number | null;
  /** False leaves the estimate out, as the planner does for a hike. */
  estimate?: boolean;
}

/** A paddle planner as far as the card reads it, its estimate worked out the way the planner works it out. */
function paddlePlanner(setup: CardSetup = {}) {
  const base = hikePlannerDefaults();
  const waypoints = setup.waypoints ?? route();
  const setPortageSpeedKmh = vi.fn();
  const paddle = {
    ...base.paddle,
    effectiveSpeedKmh: setup.speedKmh === undefined ? 4 : setup.speedKmh,
    portageSpeedKmh: setup.portageSpeedKmh ?? null,
    setPortageSpeedKmh,
  };
  const planner = {
    ...base,
    tourType: 'kayak',
    isPaddle: true,
    paddle,
    waypoints,
    paddleEstimate: setup.estimate === false ? null : paddleEstimateOf(waypoints, paddle, false),
    breakAdditionalMinutes: setup.breakMinutes ?? null,
    plannedDurationMinutes: setup.plannedMinutes ?? null,
  } as unknown as TourPlannerController;
  return { planner, setPortageSpeedKmh };
}

function card(setup: CardSetup = {}, locked = false) {
  return <PaddleTimeCard planner={paddlePlanner(setup).planner} locked={locked} />;
}

/** Renders the card and hands back the planner's carrying speed setter. */
function renderCard(setup: CardSetup = {}, locked = false) {
  const { planner, setPortageSpeedKmh } = paddlePlanner(setup);
  render(<PaddleTimeCard planner={planner} locked={locked} />);
  return setPortageSpeedKmh;
}

/** The block as a recorded track shows it, with the paddling speed set in the water tile. */
function renderBody(paddleSpeed: SpeedControl, locked = false) {
  const waypoints = route();
  const speeds = { effectiveSpeedKmh: paddleSpeed.value, portageSpeedKmh: null };
  const estimate = paddleEstimateOf(waypoints, speeds, false);
  render(
    <PaddleEstimateBody
      estimate={estimate}
      layout={paddleLayoutOfPoints(paddlePlanPoints(waypoints))}
      breakMinutes={null}
      planned={null}
      locked={locked}
      portageSpeed={{ value: null, startValue: 2, onChange: vi.fn() }}
      paddleSpeed={paddleSpeed}
    />
  );
}

/** Types into a speed field the way a paddler does: into the field, a value, out of it again. */
function enter(input: HTMLElement, value: string) {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

const tile = (name: string) => screen.getByTestId(`paddle-time-${name}`);
const estimateText = () => screen.getByTestId('paddle-time-estimate').textContent;

beforeEach(() => {
  resetAllStores();
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

describe('PaddleTimeCard (PAD-07)', () => {
  it('FE-COMP-PADDLE-TIME-001: renders nothing without an estimate or before the tour has two points', () => {
    const { container, rerender } = render(card({ estimate: false }));
    expect(container).toBeEmptyDOMElement();

    rerender(card({ waypoints: route().slice(0, 1) }));
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-COMP-PADDLE-TIME-002: heads the card with the estimate, breaks included, and says its values are planning values', () => {
    renderCard({ breakMinutes: 30 });

    const region = screen.getByRole('region', { name: 'Time estimate' });
    expect(within(region).getByText('Planning values')).toBeInTheDocument();
    const info = within(region).getByRole('button', { name: 'Planning values' });
    expect(info).toHaveAccessibleDescription(/^TREK starts with 4 km\/h on the water/);
    expect(within(region).getByText('Estimate')).toBeInTheDocument();
    // 200 minutes of water, carrying, getting out and in and the lock, then 30 minutes of breaks.
    expect(estimateText()).toBe('3 h 50 min');
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-planned')).not.toBeInTheDocument();
    // The planner sets its paddling speed in the type fields; the card shows it as it is.
    expect(screen.queryByRole('textbox', { name: 'Paddling speed' })).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-003: breaks the estimate into water, carrying, getting out and in, locks and breaks', () => {
    renderCard({ breakMinutes: 30 });

    const water = tile('water');
    expect(within(water).getByText('Water')).toBeInTheDocument();
    expect(within(water).getByText('10 km')).toBeInTheDocument();
    expect(within(water).getByText('4 km/h')).toBeInTheDocument();
    expect(within(water).getByText('2 h 30 min')).toBeInTheDocument();

    const carry = tile('carry');
    expect(within(carry).getByText('Carrying')).toBeInTheDocument();
    expect(within(carry).getByText('500 m')).toBeInTheDocument();
    expect(within(carry).getByText('km/h')).toBeInTheDocument();
    // 500 m at the starting 2 km/h.
    expect(within(carry).getByText('15 min')).toBeInTheDocument();

    const outIn = tile('out-in');
    expect(within(outIn).getByText('Out and back in')).toBeInTheDocument();
    expect(within(outIn).getByText('1×')).toBeInTheDocument();
    expect(within(outIn).getByText('10 min')).toBeInTheDocument();

    const locks = tile('locks');
    expect(within(locks).getByText('Locks')).toBeInTheDocument();
    expect(within(locks).getByText('1×')).toBeInTheDocument();
    expect(within(locks).getByText('25 min')).not.toHaveClass('text-warning');

    const breaks = tile('breaks');
    expect(within(breaks).getByText('Breaks')).toHaveClass('text-content');
    expect(within(breaks).getByText('30 min')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-004: draws the route as a band of its stretches with the lock on it', () => {
    renderCard();

    const strip = within(screen.getByTestId('paddle-time-card')).getByTestId('paddle-route-strip');
    const kinds = Array.from(strip.querySelectorAll('[data-stretch]'), (node) => node.getAttribute('data-stretch'));
    expect(kinds).toEqual(['water', 'portage', 'water']);
    expect(within(strip).getAllByTestId('paddle-route-strip-lock')).toHaveLength(1);
    expect(within(strip).getByText('0 m')).toBeInTheDocument();
    expect(within(strip).getByText('10.5 km')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-005: gives the distances in the unit the user reads', () => {
    seedStore(useSettingsStore, { settings: { distance_unit: 'imperial' } });
    renderCard();

    expect(within(tile('water')).getByText('6.2 mi')).toBeInTheDocument();
    expect(within(tile('carry')).getByText('0.3 mi')).toBeInTheDocument();
    expect(within(screen.getByTestId('paddle-route-strip')).getByText('6.5 mi')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-006: a lock without times leaves the estimate incomplete and says so', () => {
    const { rerender } = render(card({ waypoints: route({ lock: NO_TIMES }) }));

    // What is known still adds up: water, carrying and getting out and in.
    expect(estimateText()).toBe('2 h 55 min');
    expect(screen.getByText('Incomplete')).toHaveClass('text-warning');
    expect(within(tile('locks')).getByText(OPEN)).toHaveClass('text-warning');
    expect(screen.getByText('One lock has no times yet.')).toBeInTheDocument();
    // Without breaks entered the breaks tile stays open rather than reading zero.
    expect(within(tile('breaks')).getByText('Breaks')).toHaveClass('text-content-muted');
    expect(within(tile('breaks')).getByText(OPEN)).toBeInTheDocument();

    // A wait without its passage counts what is known and still warns.
    rerender(card({ waypoints: route({ lock: { wait_minutes: 20, transit_minutes: null } }) }));
    expect(estimateText()).toBe('3 h 15 min');
    expect(within(tile('locks')).getByText('20 min')).toHaveClass('text-warning');
    expect(screen.getByText('One lock has no times yet.')).toBeInTheDocument();

    rerender(card({ waypoints: route({ lock: NO_TIMES, endLock: NO_TIMES }) }));
    expect(within(tile('locks')).getByText('2×')).toBeInTheDocument();
    expect(screen.getByText('2 locks have no times yet.')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-007: without a paddling speed the water time stays open and the rest still adds up', () => {
    const { rerender } = render(card({ speedKmh: null }));

    const water = tile('water');
    expect(within(water).getByText('10 km')).toBeInTheDocument();
    expect(within(water).queryByText(/km\/h/)).not.toBeInTheDocument();
    expect(within(water).getByText(OPEN)).toBeInTheDocument();
    // Carrying, getting out and in and the lock: 15 + 10 + 25 minutes.
    expect(estimateText()).toBe('50 min');
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('Without a paddling speed the time on the water stays open.')).toBeInTheDocument();

    // Everything still missing is named in one notice.
    rerender(card({ speedKmh: null, waypoints: route({ lock: NO_TIMES }) }));
    const both = 'Without a paddling speed the time on the water stays open. One lock has no times yet.';
    expect(screen.getByText(both)).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-008: a lock the portage carries round is not counted, and a tour without portage has no carry tiles', () => {
    const { rerender } = render(card({ waypoints: route({ takeOutLock: NO_TIMES }) }));

    const marks = screen.getAllByTestId('paddle-route-strip-lock');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveClass('opacity-45');
    expect(marks[1]).not.toHaveClass('opacity-45');
    expect(within(tile('locks')).getByText('1×')).toBeInTheDocument();
    expect(within(tile('locks')).getByText('25 min')).toBeInTheDocument();
    // Its missing times are the portage's business, not a gap in the estimate.
    expect(screen.queryByText('Incomplete')).not.toBeInTheDocument();
    expect(screen.queryByText('One lock has no times yet.')).not.toBeInTheDocument();

    rerender(card({ waypoints: route({ portage: false, lock: null }) }));
    expect(screen.queryByTestId('paddle-time-carry')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-out-in')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-time-locks')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-route-strip-lock')).not.toBeInTheDocument();
    expect(within(tile('water')).getByText('10.5 km')).toBeInTheDocument();
    expect(within(tile('water')).getByText('2 h 38 min')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-009: sets the planned total beside the estimate with the gap to it', () => {
    const { rerender } = render(card({ breakMinutes: 30, plannedMinutes: 240 }));

    const planned = screen.getByTestId('paddle-time-planned');
    expect(planned).toHaveTextContent('Your planned total');
    expect(within(planned).getByText('4 h')).toBeInTheDocument();
    expect(within(planned).getByText('+10 min')).toHaveClass('text-content-secondary');

    // A plan shorter than the estimate is the one to look at again.
    rerender(card({ breakMinutes: 30, plannedMinutes: 200 }));
    const shorter = within(screen.getByTestId('paddle-time-deviation')).getByText(`${MINUS}30 min`);
    expect(shorter).toHaveClass('text-warning');

    rerender(card({ breakMinutes: 30, plannedMinutes: 230 }));
    expect(screen.getByTestId('paddle-time-planned')).toHaveTextContent('3 h 50 min');
    expect(screen.queryByTestId('paddle-time-deviation')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-TIME-010: offers the starting carrying speed and hands a typed one to the planner on Enter', async () => {
    const user = userEvent.setup();
    const setPortageSpeedKmh = renderCard();

    const input = within(tile('carry')).getByRole('textbox', { name: 'Carrying speed' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', '2');
    expect(input).toBeEnabled();

    await user.type(input, '2,5{Enter}');
    expect(setPortageSpeedKmh).toHaveBeenCalledTimes(1);
    expect(setPortageSpeedKmh).toHaveBeenCalledWith(2.5);
    expect(input).not.toHaveFocus();
    // The field shows the planner's value again, which the stub leaves unset.
    expect(input).toHaveValue('');
  });

  it('FE-COMP-PADDLE-TIME-011: keeps digits and separators, four characters at most, and rounds to a tenth', () => {
    const setPortageSpeedKmh = renderCard();
    const input = screen.getByRole('textbox', { name: 'Carrying speed' });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3a,5' } });
    expect(input).toHaveValue('3,5');
    fireEvent.blur(input);
    expect(setPortageSpeedKmh).toHaveBeenLastCalledWith(3.5);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1.2789' } });
    expect(input).toHaveValue('1.27');
    fireEvent.blur(input);
    expect(setPortageSpeedKmh).toHaveBeenLastCalledWith(1.3);
  });

  it('FE-COMP-PADDLE-TIME-012: ignores a carrying speed out of range or malformed, and an emptied field returns to the starting value', () => {
    const setPortageSpeedKmh = renderCard({ portageSpeedKmh: 3 });
    const input = screen.getByRole('textbox', { name: 'Carrying speed' });
    expect(input).toHaveValue('3');
    // 500 m at 3 km/h.
    expect(within(tile('carry')).getByText('10 min')).toBeInTheDocument();

    for (const typed of ['12', '0,4', '1.2.']) enter(input, typed);
    // Leaving the field without having been in it changes nothing either.
    fireEvent.blur(input);
    expect(setPortageSpeedKmh).not.toHaveBeenCalled();
    expect(input).toHaveValue('3');

    enter(input, '');
    expect(setPortageSpeedKmh).toHaveBeenCalledWith(null);
  });

  it('FE-COMP-PADDLE-TIME-013: a locked planner shows the carrying speed without taking a new one', () => {
    renderCard({ portageSpeedKmh: 3 }, true);

    const input = screen.getByRole('textbox', { name: 'Carrying speed' });
    expect(input).toHaveValue('3');
    expect(input).toBeDisabled();
  });
});

describe('PaddleEstimateBody (PAD-07)', () => {
  it('FE-COMP-PADDLE-TIME-014: a recorded track types its paddling speed into the water tile, up to 20 km/h', () => {
    const onChange = vi.fn();
    renderBody({ value: 5, startValue: 4, onChange });

    const water = tile('water');
    const input = within(water).getByRole('textbox', { name: 'Paddling speed' });
    expect(input).toHaveValue('5');
    expect(input).toHaveAttribute('placeholder', '4');
    expect(within(water).queryByText('5 km/h')).not.toBeInTheDocument();
    // 10 km at 5 km/h.
    expect(within(water).getByText('2 h')).toBeInTheDocument();

    enter(input, '25');
    expect(onChange).not.toHaveBeenCalled();
    // Faster than a boat is carried, but a speed on the water.
    enter(input, '12');
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it('FE-COMP-PADDLE-TIME-015: without a starting paddling speed the field shows a dash, and a locked track takes none', () => {
    renderBody({ value: null, startValue: null, onChange: vi.fn() }, true);

    const input = screen.getByRole('textbox', { name: 'Paddling speed' });
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', OPEN);
    expect(input).toBeDisabled();
    expect(screen.getByText('Without a paddling speed the time on the water stays open.')).toBeInTheDocument();
  });
});
