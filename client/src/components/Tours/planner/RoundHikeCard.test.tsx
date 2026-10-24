// FE-TOUR-ROUND-HIKE-CARD-001 to FE-TOUR-ROUND-HIKE-CARD-009: the card over the planner map that
// looks for round hikes out of a stop and takes one on purpose (RTE-03).
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { idleRoundHikes } from '../../../../tests/helpers/tourPlannerStub';
import { useSettingsStore } from '../../../store/settingsStore';
import RoundHikeOverlay, { RoundHikeCard } from './RoundHikeCard';
import type { RoundCandidate } from './roundHikes';
import type { RoundHikeView } from './useRoundHikes';
import type { TourPlannerController } from './useTourPlanner';

const POINTS = [
  { id: 'a', lat: 47.5, lng: 11.1, role: 'start' as const, name: 'Hut' },
  { id: 's', lat: 47.51, lng: 11.11, role: 'via' as const, shaping: true },
  { id: 'b', lat: 47.52, lng: 11.12, role: 'end' as const },
];

const round = (key: RoundCandidate['key'], overrides: Partial<RoundCandidate> = {}): RoundCandidate => ({
  key,
  current: false,
  coordinates: [
    [47.5, 11.1],
    [47.51, 11.1],
    [47.5, 11.1],
  ],
  distanceM: 10_400,
  gainM: 420,
  lossM: 420,
  minutes: 190,
  heights: 'known',
  via: [],
  ...overrides,
});

const REQUEST = { startId: 'a', start: { lat: 47.5, lng: 11.1 }, targetM: 10_000, costing: {}, key: 'k' };

function view(overrides: Partial<RoundHikeView> = {}): RoundHikeView {
  return {
    startId: 'a',
    targetM: 10_000,
    request: null,
    phase: 'setup',
    candidates: [],
    asked: 0,
    selected: null,
    confirming: false,
    notice: null,
    ...overrides,
  };
}

type CardPlanner = Pick<
  TourPlannerController,
  'waypoints' | 'roundHikes' | 'canEdit' | 'isSaving' | 'maxHikingDifficulty'
>;

function planner(open: RoundHikeView | null, overrides: Partial<CardPlanner> = {}): CardPlanner {
  return {
    waypoints: POINTS,
    roundHikes: { ...idleRoundHikes(), view: open },
    canEdit: true,
    isSaving: false,
    maxHikingDifficulty: 2,
    ...overrides,
  } as unknown as CardPlanner;
}

function renderCard(open: RoundHikeView, overrides: Partial<CardPlanner> = {}) {
  const controller = planner(open, overrides);
  render(<RoundHikeCard planner={controller} view={open} />);
  return controller.roundHikes;
}

beforeEach(() => {
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

describe('RoundHikeCard', () => {
  it('FE-TOUR-ROUND-HIKE-CARD-001: starts from the chosen stop with the last length, the window it allows and the hike’s limit', async () => {
    const actions = renderCard(view());
    const card = screen.getByTestId('round-hike-card');
    expect(within(card).getByRole('heading', { name: 'Round hike' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /^Start point: ?Waypoint 1/ })).toBeInTheDocument();
    expect(within(card).getByLabelText('Distance')).toHaveValue('10');
    expect(within(card).getByTestId('round-hike-window')).toHaveTextContent('8 km to 12 km');
    expect(within(card).getByTestId('round-hike-limit')).toHaveTextContent('T2');
    await userEvent.click(within(card).getByTestId('round-hike-find'));
    expect(actions.find).toHaveBeenCalledWith(10_000);
    // Enter in the field asks the same.
    await userEvent.type(within(card).getByLabelText('Distance'), '{Backspace}5{Enter}');
    expect(actions.find).toHaveBeenLastCalledWith(15_000);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-002: a length out of range says which lengths can be asked for and asks nothing', async () => {
    const actions = renderCard(view());
    const field = screen.getByLabelText('Distance');
    await userEvent.clear(field);
    await userEvent.type(field, '0,5');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a distance from 1 km to 60 km.')).toBeInTheDocument();
    expect(screen.queryByTestId('round-hike-window')).not.toBeInTheDocument();
    expect(screen.getByTestId('round-hike-find')).toBeDisabled();
    await userEvent.type(field, '{Enter}');
    expect(actions.find).not.toHaveBeenCalled();
    await userEvent.clear(field);
    await userEvent.type(field, '12,5');
    await userEvent.click(screen.getByTestId('round-hike-find'));
    expect(actions.find).toHaveBeenCalledWith(12_500);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-003: in miles the length is typed and shown in miles', async () => {
    seedStore(useSettingsStore, { settings: { distance_unit: 'imperial' } });
    const actions = renderCard(view());
    expect(screen.getByLabelText('Distance')).toHaveValue('6.2');
    expect(screen.getByText('mi')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('round-hike-find'));
    expect(vi.mocked(actions.find).mock.calls[0][0]).toBeCloseTo(9_978, 0);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-004: while it looks, the bar fills, the rounds found show and nothing can be taken yet', async () => {
    const actions = renderCard(view({ request: REQUEST, phase: 'searching', asked: 6, candidates: [round('a')] }));
    expect(screen.getByRole('progressbar', { name: 'Looking for rounds' })).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByRole('radio', { name: 'Round A' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Distance')).not.toBeInTheDocument();
    expect(screen.getByTestId('round-hike-apply')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(actions.back).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-005: each round shows its figures and how far it lies off the wish; taking one is its own step', async () => {
    const pending = { distanceM: 9_200, heights: 'pending' as const, gainM: null, lossM: null, minutes: null };
    const rounds = [round('a'), round('b', pending)];
    const actions = renderCard(view({ request: REQUEST, phase: 'done', candidates: rounds }));
    const [first, second] = screen.getAllByRole('radio');
    expect(within(first).getByText('10.4 km')).toBeInTheDocument();
    expect(within(first).getAllByText('420 m')).toHaveLength(2);
    expect(within(first).getByTestId('round-hike-deviation')).toHaveTextContent('+4%');
    expect(within(second).getByTestId('round-hike-deviation')).toHaveTextContent('-8%');
    expect(within(second).getAllByLabelText('Heights are being looked up')).toHaveLength(3);
    expect(screen.getByTestId('round-hike-apply')).toBeDisabled();
    await userEvent.click(second);
    expect(actions.select).toHaveBeenCalledWith('b');
    fireEvent.mouseEnter(first);
    expect(actions.hover).toHaveBeenLastCalledWith('a');
    fireEvent.mouseLeave(first);
    expect(actions.hover).toHaveBeenLastCalledWith(null);
    expect(actions.apply).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Search again' }));
    expect(actions.back).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-006: the chosen round is taken on the button, never while the tour is locked', async () => {
    const done = view({ request: REQUEST, phase: 'done', candidates: [round('a')], selected: 'a' });
    const free = planner(done);
    const { unmount } = render(<RoundHikeCard planner={free} view={done} />);
    expect(screen.getByRole('radio', { name: 'Round A' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByTestId('round-hike-apply'));
    expect(free.roundHikes.apply).toHaveBeenCalledTimes(1);
    unmount();
    render(<RoundHikeCard planner={planner(done, { isSaving: true })} view={done} />);
    expect(screen.getByTestId('round-hike-apply')).toBeDisabled();
  });

  it('FE-TOUR-ROUND-HIKE-CARD-007: says honestly when the router failed, none fit, fewer fit or the tour changed', () => {
    const { unmount } = render(
      <RoundHikeCard planner={planner(null)} view={view({ request: REQUEST, phase: 'failed' })} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('The router did not answer');
    unmount();
    const none = render(<RoundHikeCard planner={planner(null)} view={view({ request: REQUEST, phase: 'done' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('between 8 km and 12 km');
    none.unmount();
    const one = view({ request: REQUEST, phase: 'done', candidates: [round('a')] });
    const fewer = render(<RoundHikeCard planner={planner(null)} view={one} />);
    expect(screen.getByRole('status')).toHaveTextContent('No more rounds fit this distance from here.');
    fewer.unmount();
    const three = render(
      <RoundHikeCard
        planner={planner(null)}
        view={view({ request: REQUEST, phase: 'done', candidates: [round('a'), round('b'), round('c')] })}
      />
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    three.unmount();
    render(<RoundHikeCard planner={planner(null)} view={view({ notice: 'stale' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('The start point or the limit changed.');
  });

  it('FE-TOUR-ROUND-HIKE-CARD-008: replacing planned points waits for a yes in its own dialog', async () => {
    const actions = renderCard(
      view({ request: REQUEST, phase: 'done', candidates: [round('a')], selected: 'a', confirming: true })
    );
    expect(screen.getByText('Replace the planned route?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(actions.confirm).toHaveBeenCalledTimes(1);
  });

  it('FE-TOUR-ROUND-HIKE-CARD-009: the overlay shows the card while open, picks another start and closes on Escape', async () => {
    const closed = planner(null);
    const { unmount } = render(<RoundHikeOverlay planner={closed} insetEnd={16} bottom={12} />);
    expect(screen.queryByTestId('round-hike-overlay')).not.toBeInTheDocument();
    unmount();
    const open = planner(view());
    render(<RoundHikeOverlay planner={open} insetEnd={16} bottom={12} />);
    expect(screen.getByTestId('round-hike-overlay')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Start point: ?Waypoint 1/ }));
    // A shaping point is no place to start from: only the stops are offered.
    expect(screen.queryByRole('button', { name: /^Shaping point/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Waypoint 2/ }));
    expect(open.roundHikes.open).toHaveBeenCalledWith('b');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(open.roundHikes.close).toHaveBeenCalledTimes(1);
  });
});
