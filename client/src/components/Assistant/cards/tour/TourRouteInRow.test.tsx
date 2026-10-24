/**
 * FE-AI-TOUR-033 to FE-AI-TOUR-034, FE-AI-TOUR-063
 *
 * A held tour change in its row: the route drawn small with its figures and
 * grade and a small profile, the kind of tour as the row's tile; a tour whose
 * way is planned only once added says so without a profile; a changed route
 * says how the new way differs from the one it replaces.
 */
import type { TourRouteCard } from '@trek/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HIKE } from '../../../../../tests/helpers/assistantTour';
import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { useAssistantStore } from '../../../../store/assistantStore';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import TourRouteInRow, { TourRouteLead } from './TourRouteInRow';

const ASSISTANT = useAssistantStore.getState();

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  vi.clearAllMocks();
});

const PENDING: TourRouteCard = { ...HIKE, source: 'pending' };

function item(card: TourRouteCard, state: ChangeItem['state'] = 'pending'): ChangeItem {
  return { toolCallId: 'call_7', preview: null, applied: null, state, card };
}

function renderRow(card: TourRouteCard, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <TourRouteLead card={card} item={item(card)} />
      <TourRouteInRow card={card} item={item(card)} />
    </AssistantViewContext.Provider>
  );
}

describe('TourRouteInRow', () => {
  it('FE-AI-TOUR-033: draws the route with its figures, grade and a small profile; the sketch shows it on the map', () => {
    const requestCamera = vi.fn();
    useAssistantStore.setState({ requestCamera });
    const { container } = renderRow(PENDING);
    expect(container.querySelector('[data-figure="distance"]')).toHaveTextContent('8.2 km');
    expect(screen.getByTestId('tour-grade')).toHaveTextContent('T3');
    expect(container.querySelectorAll('[data-testid="tour-route-row"] svg path[stroke]').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Show Hochfelln from Bergen on the map' }));
    expect(requestCamera).toHaveBeenCalledWith(4, expect.any(Array), 'fit', 'user');
  });

  it('FE-AI-TOUR-034: a way planned only once added says so without a profile; a changed way states its difference', () => {
    const straight: TourRouteCard = {
      ...PENDING,
      routed: false,
      problem: { why: 'not_planned', position: null, snappedM: null },
    };
    const { container } = renderRow(straight);
    expect(screen.getByText('The way is planned when the tour is added')).toBeInTheDocument();
    expect(container.querySelector('[data-profile-band]')).toBeNull();
    const previous = {
      line: HIKE.line.map(([lat, lng]): [number, number] => [lat, lng]),
      distanceM: 6600,
      ascentM: 700,
      minutes: 180,
    };
    renderRow({ ...PENDING, name: 'Changed', previous });
    const delta = screen.getByTestId('leg-variant-delta');
    expect(delta).toHaveTextContent('+1.6 km');
    expect(delta).toHaveTextContent('+20 min');
  });

  it('FE-AI-TOUR-063: a held bike tour or run names its profile in its row, never a hike grade', () => {
    renderRow({ ...PENDING, activity: 'bike', routingProfile: 'road', grades: null, limit: null });
    expect(screen.getByText('Road')).toBeInTheDocument();
    expect(screen.queryByTestId('tour-grade')).toBeNull();
  });
});
