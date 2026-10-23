/**
 * FE-AI-PEEK-001 to FE-AI-PEEK-007
 *
 * The phone's peek at a route over the map: found where the chat shows the
 * route (an answer's card, one of its ways, a held change), its name,
 * figures and profile with the readout under it, the ways as marks a tap
 * chooses between, the map's spot read in the readout, and a close button;
 * loaded on first use. Closing it, or moving it to another way, takes the
 * light a tap on the map put on the line along.
 */
import type { AssistantMessage, AssistantMessagePart, TourRouteCard } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GENTLE, HIKE } from '../../../../tests/helpers/assistantTour';
import { buildTrip, buildUser } from '../../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { chatOf, useAssistantStore } from '../../../store/assistantStore';
import { useAuthStore } from '../../../store/authStore';
import { useTripStore } from '../../../store/tripStore';
import RoutePeek from './RoutePeek';
import RoutePeekLazy from './RoutePeekLazy';
import { peekRoute } from './routePeekModel';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const AUTH = useAuthStore.getState();

function read(toolCallId: string, card: TourRouteCard): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'propose_hike', args: {}, result: {} },
    { type: 'data-trek-card', data: { toolCallId, card } },
  ];
}

function held(toolCallId: string, card: TourRouteCard): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'create_hike', args: {}, approval: { id: toolCallId } },
    {
      type: 'data-trek-change',
      data: {
        toolCallId,
        verbKey: 'addTour',
        subject: 'Hochfelln',
        rows: [],
        dayId: null,
        placeIds: [],
        undoable: true,
        card: { ...card, source: 'pending' },
      },
    } as AssistantMessagePart,
  ];
}

function message(parts: AssistantMessagePart[]): AssistantMessage {
  return { id: 'msg-1', role: 'assistant', parts, status: 'complete', createdAt: '2026-10-21T08:00:00.000Z' };
}

const WAYS = message([...read('call_1', { ...HIKE, label: 'Short and steep' }), ...read('call_2', GENTLE)]);

function setChat(messages: AssistantMessage[], peek: string | null) {
  useAssistantStore.setState((s) => ({
    byTrip: { [TRIP]: { ...chatOf(s, TRIP), threadId: 7, messages } },
    routePeek: peek === null ? null : { tripId: TRIP, toolCallId: peek },
  }));
}

function renderPeek() {
  return render(<RoutePeek tripId={TRIP} onOpen={vi.fn()} onFocusDay={vi.fn()} onRevealMap={vi.fn()} />);
}

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: 1 }) });
  useTripStore.setState({ trip: buildTrip({ id: TRIP, user_id: 1 }) });
});

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useAuthStore.setState(AUTH, true);
});

describe('peekRoute', () => {
  it('FE-AI-PEEK-001: finds a route among the ways of an answer, on its own, or as a held change, and nothing else', () => {
    const ways = peekRoute([WAYS], 'call_2');
    expect(ways?.entry.toolCallId).toBe('call_2');
    expect(ways?.ways.map((way) => way.toolCallId)).toEqual(['call_1', 'call_2']);
    expect(ways?.blockKey).toBe('tour:call_1');

    const alone = peekRoute([message(read('call_9', HIKE))], 'call_9');
    expect(alone?.ways).toEqual([]);

    const change = peekRoute([message(held('call_5', HIKE))], 'call_5');
    expect(change?.entry.card.source).toBe('pending');
    expect(change?.ways).toEqual([]);

    expect(peekRoute([WAYS], 'call_7')).toBeNull();
  });
});

describe('RoutePeek', () => {
  it('FE-AI-PEEK-002: shows nothing while closed, for another trip, or once the route is gone', () => {
    setChat([WAYS], null);
    const { container } = renderPeek();
    expect(container).toBeEmptyDOMElement();

    act(() => useAssistantStore.setState({ routePeek: { tripId: 9, toolCallId: 'call_1' } }));
    expect(container).toBeEmptyDOMElement();

    act(() => useAssistantStore.setState({ routePeek: { tripId: TRIP, toolCallId: 'call_7' } }));
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-PEEK-003: names the route with its grade and figures over its profile, and closes', () => {
    setChat([message(read('call_9', HIKE))], 'call_9');
    renderPeek();
    const peek = screen.getByTestId('route-peek');
    expect(peek).toHaveAccessibleName('Hochfelln from Bergen');
    expect(screen.getByTestId('tour-grade')).toBeInTheDocument();
    expect(peek.querySelector('[data-figure="distance"]')).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Elevation profile of Hochfelln from Bergen' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /way/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close the route' }));
    expect(useAssistantStore.getState().routePeek).toBeNull();
    expect(screen.queryByTestId('route-peek')).not.toBeInTheDocument();
  });

  it('FE-AI-PEEK-004: the ways are marks with 44 px targets, and a tap chooses one for the answer and shows it', () => {
    setChat([WAYS], 'call_1');
    renderPeek();
    const group = screen.getByRole('group', { name: '2 ways' });
    const marks = group.querySelectorAll('button');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveAttribute('aria-pressed', 'true');
    expect(marks[0]).toHaveClass('h-11', 'w-11');

    fireEvent.click(screen.getByRole('button', { name: 'Long and gentle' }));
    expect(chatOf(useAssistantStore.getState(), TRIP).picks).toEqual({ 'tour:call_1': 'call_2' });
    expect(useAssistantStore.getState().routePeek).toEqual({ tripId: TRIP, toolCallId: 'call_2' });
    expect(screen.getByRole('button', { name: 'Long and gentle' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-AI-PEEK-005: a spot picked on the map is read in the row under the profile, and the hint shows otherwise', () => {
    setChat([message(read('call_9', HIKE))], 'call_9');
    renderPeek();
    expect(screen.getByText('Slide along the profile to read it')).toBeInTheDocument();

    const focus = { distanceMeters: 4100, elevationMeters: 1400, lat: 47.795, lng: 12.625, sampleIndex: 5 };
    act(() => useAssistantStore.getState().setRouteFocus({ tripId: TRIP, ref: 'call_9', focus, source: 'map' }));
    expect(screen.getByTestId('tour-profile-readout')).toBeInTheDocument();
  });

  it('FE-AI-PEEK-006: the peek loads with its route the first time a route is shown over the map', async () => {
    setChat([message(read('call_9', HIKE))], 'call_9');
    render(<RoutePeekLazy tripId={TRIP} onOpen={vi.fn()} onFocusDay={vi.fn()} onRevealMap={vi.fn()} />);
    expect(await screen.findByTestId('route-peek')).toHaveAccessibleName('Hochfelln from Bergen');
  });

  it('FE-AI-PEEK-007: closing the peek puts out the light a map tap put on its line, not a light from the chat', () => {
    setChat([WAYS], 'call_1');
    act(() => useAssistantStore.getState().setMapHover(TRIP, 'call_1', 'map'));
    renderPeek();
    // Another way in the peek moves the light with it.
    fireEvent.click(screen.getByRole('button', { name: 'Long and gentle' }));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'call_2', source: 'map' });

    fireEvent.click(screen.getByRole('button', { name: 'Close the route' }));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: null, source: 'map' });

    act(() => {
      useAssistantStore.getState().setMapHover(TRIP, 'call_1', 'card');
      useAssistantStore.getState().setRoutePeek({ tripId: TRIP, toolCallId: 'call_1' });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close the route' }));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'call_1', source: 'card' });
    expect(useAssistantStore.getState().routePeek).toBeNull();
  });
});
