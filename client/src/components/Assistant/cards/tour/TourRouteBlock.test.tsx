/**
 * FE-AI-TOUR-029 to FE-AI-TOUR-032, FE-AI-TOUR-043
 *
 * The ways of one answer as the planner offers a section's ways: one choice
 * per way with how it differs from the chosen one, one profile with the
 * others drawn thin, the choice kept per answer and lit on the map, side by
 * side where the window is roomy, and any other route as a card of its own;
 * the card lit with its chosen line both ways, and "On map" framing them all.
 */
import type { TourRouteCard } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GENTLE, HIKE, SAVED } from '../../../../../tests/helpers/assistantTour';
import { buildTrip, buildUser } from '../../../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../../store/assistantStore';
import { useAuthStore } from '../../../../store/authStore';
import { useTripStore } from '../../../../store/tripStore';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import TourRouteBlock from './TourRouteBlock';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const AUTH = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: 1 }) });
  useTripStore.setState({ trip: buildTrip({ id: TRIP, user_id: 1 }) });
  useAssistantStore.setState({
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 7 } },
  });
});

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useAuthStore.setState(AUTH, true);
});

function renderBlock(cards: { toolCallId: string; card: TourRouteCard }[], view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', density: 'compact', onOpen: vi.fn(), ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <TourRouteBlock cards={cards} />
    </AssistantViewContext.Provider>
  );
}

const WAYS = [
  { toolCallId: 'call_1', card: { ...HIKE, label: 'Short and steep' } },
  { toolCallId: 'call_2', card: GENTLE },
];

describe('TourRouteBlock', () => {
  it('FE-AI-TOUR-029: two ways read as one choice, the other way compared with the chosen one on one profile', () => {
    const { container } = renderBlock(WAYS);
    const group = screen.getByRole('radiogroup', { name: '2 ways' });
    const ways = group.querySelectorAll('[role="radio"]');
    expect(ways).toHaveLength(2);
    expect(ways[0]).toHaveAttribute('aria-checked', 'true');
    expect(ways[0]).toHaveAccessibleName('Short and steep');
    expect(ways[1]).toHaveAccessibleName('Long and gentle');
    expect(ways[1]?.querySelector('[data-testid="leg-variant-delta"]')).not.toBeNull();
    expect(ways[0]?.querySelector('[data-testid="leg-variant-delta"]')).toBeNull();
    expect(container.querySelector('[data-profile-compare="call_2"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Plan way A' })).toBeInTheDocument();
  });

  it('FE-AI-TOUR-030: choosing a way keeps it for the answer and plans it; pointing at a way lights its line', () => {
    renderBlock(WAYS);
    const second = screen.getByRole('radio', { name: 'Long and gentle' });
    fireEvent.mouseEnter(second);
    expect(useAssistantStore.getState().mapLink).toMatchObject({ tripId: TRIP, hoveredId: 'call_2', source: 'card' });
    fireEvent.mouseLeave(second);
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();
    fireEvent.click(second);
    expect(chatOf(useAssistantStore.getState(), TRIP).picks).toEqual({ 'tour:call_1': 'call_2' });
    expect(second).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Plan way B' })).toBeInTheDocument();
    expect(document.querySelector('[data-profile-compare="call_1"]')).not.toBeNull();
  });

  it('FE-AI-TOUR-031: the ways stand side by side in a roomy window and stay rows on the phone', () => {
    renderBlock(WAYS, { density: 'roomy' });
    expect(screen.getByRole('radiogroup')).toHaveClass('grid-cols-2');
    renderBlock(WAYS, { density: 'roomy', variant: 'fullscreen' });
    expect(screen.getAllByRole('radiogroup')[1]).not.toHaveClass('grid-cols-2');
  });

  it('FE-AI-TOUR-032: a saved tour beside a proposal, or one proposal alone, is a card of its own', () => {
    renderBlock([
      { toolCallId: 'call_1', card: SAVED },
      { toolCallId: 'call_2', card: { ...HIKE, name: 'Wank' } },
    ]);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Hochfelln from Bergen' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Wank' })).toBeInTheDocument();
  });

  it('FE-AI-TOUR-043: resting on the ways card lights the chosen line, a line lit on the map rings it, "On map" frames every way', () => {
    const requestCamera = vi.fn();
    useAssistantStore.setState({ requestCamera });
    const far: TourRouteCard = { ...GENTLE, line: [[47.9, 12.8, 600], ...GENTLE.line.slice(1)] };
    renderBlock([WAYS[0] as (typeof WAYS)[number], { toolCallId: 'call_2', card: far }]);
    const card = screen.getByRole('region', { name: '2 ways' });
    fireEvent.mouseEnter(card);
    expect(useAssistantStore.getState().mapLink).toMatchObject({ tripId: TRIP, hoveredId: 'call_1', source: 'card' });
    fireEvent.mouseLeave(card);
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();

    act(() => useAssistantStore.getState().setMapHover(TRIP, 'call_1', 'map'));
    expect(card.parentElement).toHaveClass('ring-1');

    fireEvent.click(screen.getByRole('button', { name: 'On map' }));
    const points = requestCamera.mock.calls[0]?.[1] as [number, number][];
    expect(points).toHaveLength(HIKE.line.length + far.line.length);
    expect(points).toContainEqual([47.9, 12.8]);
  });
});
