// FE-TOUR-LEG-VARIANTS-CARD-001 to FE-TOUR-LEG-VARIANTS-CARD-007: the card that compares the ways
// of a hike's section over the planner map (RTE-02).
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { idleLegVariants } from '../../../../tests/helpers/tourPlannerStub';
import { useSettingsStore } from '../../../store/settingsStore';
import LegVariantsOverlay, { LegVariantsCard } from './LegVariantsCard';
import type { LegVariant } from './legVariants';
import type { LegComparison } from './useLegVariants';
import type { TourPlannerController } from './useTourPlanner';

const POINTS = [
  { id: 'a', lat: 47, lng: 11, role: 'start' as const },
  { id: 's', lat: 47.001, lng: 11.01, role: 'via' as const, shaping: true },
  { id: 'b', lat: 47, lng: 11.02, role: 'end' as const },
];

const way = (key: LegVariant['key'], overrides: Partial<LegVariant> = {}): LegVariant => ({
  key,
  current: key === 'current',
  coordinates: [
    [47, 11],
    [47, 11.02],
  ],
  distanceM: 1500,
  gainM: 120,
  lossM: 40,
  minutes: 35,
  heights: 'known',
  ...overrides,
});

function comparison(overrides: Partial<LegComparison> = {}): LegComparison {
  return {
    leg: {
      fromId: 'a',
      toId: 's',
      from: { lat: 47, lng: 11 },
      to: { lat: 47.001, lng: 11.01 },
      costing: { max_hiking_difficulty: 2 },
      key: 'a>s',
    },
    phase: 'choose',
    variants: [way('current'), way('a', { distanceM: 1900, gainM: 180, minutes: 47 })],
    selected: null,
    proving: false,
    notice: null,
    ...overrides,
  };
}

type CardPlanner = Pick<TourPlannerController, 'waypoints' | 'legVariants' | 'canEdit' | 'isSaving'>;

function planner(open: LegComparison | null, overrides: Partial<CardPlanner> = {}): CardPlanner {
  return {
    waypoints: POINTS,
    legVariants: { ...idleLegVariants(), comparison: open },
    canEdit: true,
    isSaving: false,
    ...overrides,
  } as unknown as CardPlanner;
}

function renderCard(open: LegComparison, overrides: Partial<CardPlanner> = {}) {
  const controller = planner(open, overrides);
  render(<LegVariantsCard planner={controller} comparison={open} />);
  return controller.legVariants;
}

beforeEach(() => {
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } });
});

/** The last of the elements found: the card rendered most recently. */
function lastOf<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

describe('LegVariantsCard', () => {
  it('FE-TOUR-LEG-VARIANTS-CARD-001: names the section by its ends and lists each way with its figures', () => {
    renderCard(comparison());
    const card = screen.getByTestId('leg-variants-card');
    expect(within(card).getByRole('heading', { name: 'Other ways for this section' })).toBeInTheDocument();
    expect(within(card).getByLabelText('Section from Waypoint 1 to Shaping point')).toBeInTheDocument();
    const [current, other] = within(card).getAllByRole('radio');
    expect(current).toHaveAccessibleName('Current way');
    expect(other).toHaveAccessibleName('Way A');
    expect(within(current).getByText('1.5 km')).toBeInTheDocument();
    expect(within(current).getByText('120 m')).toBeInTheDocument();
    expect(within(current).getByText('40 m')).toBeInTheDocument();
    // How the other way differs: longer, more climb, more time; the way taken now has no difference to show.
    const delta = within(other).getByTestId('leg-variant-delta');
    expect(delta).toHaveTextContent('+400 m');
    expect(delta).toHaveTextContent('+60 m');
    expect(delta).toHaveTextContent('+12 min');
    expect(within(current).queryByTestId('leg-variant-delta')).not.toBeInTheDocument();
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-002: heights still asked for turn, heights not to be had stay unknown, never a guess', () => {
    renderCard(
      comparison({
        variants: [
          way('current', { gainM: null, lossM: null, minutes: null, heights: 'unknown' }),
          way('a', { gainM: null, lossM: null, minutes: null, heights: 'pending', distanceM: 1400 }),
        ],
      })
    );
    const [current, other] = screen.getAllByRole('radio');
    expect(within(current).getAllByText('Unknown')).toHaveLength(3);
    expect(within(other).getAllByLabelText('Heights are being looked up')).toHaveLength(3);
    // Only the length is known on both, so only it is compared.
    expect(within(other).getByTestId('leg-variant-delta')).toHaveTextContent('−100 m');
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-003: choosing marks a way; taking it is a separate, explicit step', async () => {
    const actions = renderCard(comparison());
    const apply = screen.getByTestId('leg-variants-apply');
    expect(apply).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Way A' }));
    expect(actions.select).toHaveBeenCalledWith('a');
    expect(actions.apply).not.toHaveBeenCalled();
    fireEvent.mouseEnter(screen.getByRole('radio', { name: 'Way A' }));
    expect(actions.hover).toHaveBeenLastCalledWith('a');
    fireEvent.mouseLeave(screen.getByRole('radio', { name: 'Way A' }));
    expect(actions.hover).toHaveBeenLastCalledWith(null);
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-004: a chosen other way can be taken; the way taken now and a locked tour cannot', async () => {
    const actions = renderCard(comparison({ selected: 'a' }));
    expect(screen.getByRole('radio', { name: 'Way A' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Take this way' }));
    expect(actions.apply).toHaveBeenCalledTimes(1);

    renderCard(comparison({ selected: 'current' }));
    expect(lastOf(screen.getAllByTestId('leg-variants-apply'))).toBeDisabled();
    renderCard(comparison({ selected: 'a' }), { isSaving: true });
    expect(lastOf(screen.getAllByTestId('leg-variants-apply'))).toBeDisabled();
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-005: while a choice is checked the list stands still and the button says what happens', async () => {
    const actions = renderCard(comparison({ selected: 'a', proving: true }));
    expect(screen.getByTestId('leg-variants-apply')).toHaveTextContent('Checking the way');
    expect(screen.getByTestId('leg-variants-apply')).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Current way' }));
    expect(actions.select).not.toHaveBeenCalled();
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-006: says what it is doing and why nothing changed', () => {
    renderCard(comparison({ phase: 'loading', variants: [way('current')] }));
    expect(screen.getByRole('status')).toHaveTextContent('Looking for other ways');
    renderCard(comparison({ phase: 'none', variants: [way('current')] }));
    expect(lastOf(screen.getAllByRole('status'))).toHaveTextContent('The router knows no other way');
    renderCard(comparison({ phase: 'failed', variants: [way('current')] }));
    expect(lastOf(screen.getAllByRole('status'))).toHaveTextContent('The router did not answer');
    renderCard(comparison({ notice: 'notHeld' }));
    expect(lastOf(screen.getAllByRole('status'))).toHaveTextContent('The router does not keep to this way');
    renderCard(comparison({ notice: 'stale' }));
    expect(lastOf(screen.getAllByRole('status'))).toHaveTextContent('The tour changed in the meantime');
    renderCard(comparison({ notice: 'failed' }));
    expect(lastOf(screen.getAllByRole('status'))).toHaveTextContent('This way could not be checked');
  });

  it('FE-TOUR-LEG-VARIANTS-CARD-007: the overlay shows only while a section is compared; cancel, the cross and Escape close it', async () => {
    const { rerender } = render(<LegVariantsOverlay planner={planner(null)} insetEnd={12} bottom={66} />);
    expect(screen.queryByTestId('leg-variants-overlay')).not.toBeInTheDocument();

    const open = planner(comparison());
    rerender(<LegVariantsOverlay planner={open} insetEnd={12} bottom={66} />);
    expect(screen.getByTestId('leg-variants-overlay').style.bottom).toBe('66px');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(open.legVariants.close).toHaveBeenCalledTimes(3);
  });
});
