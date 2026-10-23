/**
 * FE-PLANNER-AI-ROUTE-001 to FE-PLANNER-AI-ROUTE-007
 *
 * The chat's routes on the plan's map: answers laid out as the chat lays
 * them out, the ways in the theme's colours with the chosen one solid, the
 * pointer lighting a route's card and moving its profile's spot (once a
 * frame), a tap on the phone opening the route's peek, a saved tour and a
 * pointed-at drive drawn while lit, and one move of the map per new answer
 * (none for what the chat showed when the planner opened).
 */
import { act, renderHook } from '@testing-library/react';
import type { AssistantMessage, AssistantMessagePart, TourRouteCard, Trip } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GENTLE, HIKE, HIKE_LINE, SAVED, TOUR_LIST } from '../../../tests/helpers/assistantTour';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import { answerLayout, routeFocusAt, useAssistantRouteLines } from './useAssistantRouteLines';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const PAINT = {
  '--hike-variant-current': '#0a84ff',
  '--hike-variant-a': '#f97316',
  '--hike-variant-b': '#d946ef',
  '--bike-highlight-casing': '#ffffff',
};

function read(toolCallId: string, card: TourRouteCard): AssistantMessagePart[] {
  return [
    { type: 'tool-call', toolCallId, toolName: 'propose_hike', args: {}, result: {} },
    { type: 'data-trek-card', data: { toolCallId, card } },
  ];
}

function setMessages(parts: AssistantMessagePart[], over: Partial<ReturnType<typeof chatOf>> = {}) {
  const message: AssistantMessage = {
    id: 'msg-1',
    role: 'assistant',
    parts,
    status: 'complete',
    createdAt: '2026-10-21T08:00:00.000Z',
  };
  useAssistantStore.setState((s) => ({ byTrip: { [TRIP]: { ...chatOf(s, TRIP), messages: [message], ...over } } }));
}

const WAYS = [...read('call_1', HIKE), ...read('call_2', GENTLE)];

function lines(props: { isMobile?: boolean; autoAllowed?: boolean } = {}) {
  return renderHook(
    (p: { isMobile?: boolean; autoAllowed?: boolean }) =>
      useAssistantRouteLines({ tripId: TRIP, isMobile: p.isMobile ?? false, autoAllowed: p.autoAllowed ?? true }),
    { initialProps: props }
  );
}

beforeEach(() => {
  for (const [token, value] of Object.entries(PAINT)) document.documentElement.style.setProperty(token, value);
  useTripStore.setState({ trip: { id: TRIP } as Trip, places: [] });
  // One frame at once: what the pointer asks for lands before the assertion.
  vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
    run(0);
    return 1;
  });
});

afterEach(() => {
  for (const token of Object.keys(PAINT)) document.documentElement.style.removeProperty(token);
  vi.unstubAllGlobals();
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
});

describe('useAssistantRouteLines', () => {
  it('FE-PLANNER-AI-ROUTE-001: proposals of one activity are one choice of ways, anything else a card of its own', () => {
    const entries = [
      { toolCallId: 'a', card: HIKE },
      { toolCallId: 'b', card: GENTLE },
      { toolCallId: 'c', card: SAVED },
      { toolCallId: 'd', card: TOUR_LIST },
    ];
    expect(answerLayout(entries).map((group) => group.map((entry) => entry.toolCallId))).toEqual([
      ['a', 'b'],
      ['c'],
      ['d'],
    ]);
  });

  it('FE-PLANNER-AI-ROUTE-002: the spot of a route nearest a point is measured as its card measures it, with the height there', () => {
    const [lat, lng] = HIKE_LINE[5] as [number, number, number];
    const spot = routeFocusAt(HIKE, lat, lng);
    expect(spot?.elevationMeters).toBeCloseTo(1400, 0);
    expect(spot?.distanceMeters).toBeGreaterThan(3700);
    expect(spot?.distanceMeters).toBeLessThan(3900);
    expect(routeFocusAt({ ...HIKE, routed: false }, lat, lng)).toBeNull();
    expect(routeFocusAt(TOUR_LIST, lat, lng)).toBeNull();
  });

  it("FE-PLANNER-AI-ROUTE-003: an answer's ways are drawn in the theme's colours, the chosen one solid, the lit one on top", () => {
    setMessages(WAYS, { picks: { 'tour:call_1': 'call_2' } });
    const { result } = lines();
    const [wayA, wayB] = result.current.assistantRouteLines;
    expect(wayA).toMatchObject({ ref: 'call_1', color: '#f97316', casing: '#ffffff', dashed: true });
    expect(wayB).toMatchObject({ ref: 'call_2', color: '#d946ef' });
    expect(wayB?.dashed).toBeUndefined();

    act(() => useAssistantStore.getState().setMapHover(TRIP, 'call_1', 'card'));
    const lit = result.current.assistantRouteLines;
    expect(lit[lit.length - 1]).toMatchObject({ ref: 'call_1', hot: true });
  });

  it("FE-PLANNER-AI-ROUTE-004: the pointer on a route lights its card and moves its profile's spot; leaving puts both out", () => {
    setMessages(read('call_9', HIKE));
    const { result } = lines();
    const [lat, lng] = HIKE_LINE[5] as [number, number, number];
    act(() => result.current.onAssistantRouteHover('call_9'));
    act(() => result.current.onAssistantRoutePoint('call_9', lat, lng));
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'call_9', source: 'map' });
    expect(useAssistantStore.getState().routeFocus).toMatchObject({ tripId: TRIP, ref: 'call_9', source: 'map' });
    expect(result.current.routeProfileFocus?.elevationMeters).toBeCloseTo(1400, 0);
    expect(useAssistantStore.getState().routePeek).toBeNull();

    act(() => result.current.onAssistantRouteHover(null));
    expect(useAssistantStore.getState().mapLink?.hoveredId).toBeNull();
    expect(useAssistantStore.getState().routeFocus).toBeNull();

    // On the phone a tap does what the pointer does, and opens the route's peek over the map.
    const phone = lines({ isMobile: true });
    act(() => phone.result.current.onAssistantRoutePoint('call_9', lat, lng));
    expect(useAssistantStore.getState().routePeek).toEqual({ tripId: TRIP, toolCallId: 'call_9' });
    expect(useAssistantStore.getState().mapLink).toEqual({ tripId: TRIP, hoveredId: 'call_9', source: 'map' });
  });

  it('FE-PLANNER-AI-ROUTE-005: a saved tour lit from its row and a drive a card points at are drawn while lit', () => {
    const geometry = JSON.stringify(HIKE_LINE.map(([lat, lng]) => [lat, lng]));
    const tour = { id: 41, trip_id: TRIP, name: 'Hochfelln', route_geometry: geometry } as Place;
    useTripStore.setState({ places: [tour] });
    const { result } = lines();
    expect(result.current.assistantRouteLines).toEqual([]);

    act(() => useAssistantStore.getState().setMapHover(TRIP, 'tour:41', 'card'));
    expect(result.current.assistantRouteLines).toEqual([
      expect.objectContaining({ id: 'tour:41', ref: 'tour:41', color: '#0a84ff', casing: '#ffffff', hot: true }),
    ]);

    const driven = HIKE_LINE.map(([la, ln]): [number, number] => [la, ln]);
    const drive = { tripId: TRIP, ref: 'day:3', lines: [driven], color: '#22c55e' };
    act(() => useAssistantStore.getState().setRoutePreview(drive));
    expect(result.current.assistantRouteLines[1]).toMatchObject({ id: 'preview:day:3', color: '#22c55e', hot: true });
  });

  it('FE-PLANNER-AI-ROUTE-006: a new answer of routes frames the map once it is complete; one there at mount does not', () => {
    setMessages(read('old', SAVED));
    const { rerender } = lines();
    expect(useAssistantStore.getState().camera).toBeNull();

    act(() => setMessages(WAYS, { isRunning: true }));
    rerender({});
    expect(useAssistantStore.getState().camera).toBeNull();

    act(() => setMessages(WAYS, { isRunning: false }));
    rerender({});
    expect(useAssistantStore.getState().camera).toMatchObject({ tripId: TRIP, mode: 'fit', why: 'auto' });
    expect(useAssistantStore.getState().camera?.points).toHaveLength(HIKE_LINE.length * 2);

    const seq = useAssistantStore.getState().camera?.seq;
    rerender({});
    expect(useAssistantStore.getState().camera?.seq).toBe(seq);
  });

  it('FE-PLANNER-AI-ROUTE-007: opened while the chat writes, the map stays put when the new answer draws no routes', () => {
    setMessages(read('old', SAVED), { isRunning: true });
    const { rerender } = lines();
    act(() => setMessages(read('old', SAVED), { isRunning: false }));
    rerender({});
    expect(useAssistantStore.getState().camera).toBeNull();
  });
});
