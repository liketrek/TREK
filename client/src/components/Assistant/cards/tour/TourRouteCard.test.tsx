/**
 * FE-AI-TOUR-021 to FE-AI-TOUR-028, FE-AI-TOUR-037 to FE-AI-TOUR-042
 *
 * A route in the chat as the Tours tab shows a hike: its figures and grade,
 * a profile only where the heights are known, the profile, the stop chips
 * and the map moving one spot, the day with the sun, the hours and the
 * warnings, "Plan this" with its gate (the right to add, the thread already
 * holding the tour, what came of a take), "Open in Tours" on a saved tour,
 * and the phone's readout row, taller buttons and open on the plan.
 */
import type { AssistantMessage, AssistantMessagePart, TourRouteCard as Route } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GENTLE, HIKE, HIKE_LINE, SAVED } from '../../../../../tests/helpers/assistantTour';
import { buildTrip, buildUser } from '../../../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { chatOf, type HoldOutcome, useAssistantStore } from '../../../../store/assistantStore';
import { useAuthStore } from '../../../../store/authStore';
import { usePermissionsStore } from '../../../../store/permissionsStore';
import { useTripStore } from '../../../../store/tripStore';
import { setForcedOffline } from '../../../../sync/networkMode';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import TourRouteCard from './TourRouteCard';

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const AUTH = useAuthStore.getState();
const PERMISSIONS = usePermissionsStore.getState();

const takeProposal = vi.fn(async (): Promise<HoldOutcome> => 'held');
const requestCamera = vi.fn();
const onRevealMap = vi.fn();

/** A waiting change in another answer, which holds "Plan this" back. */
const UNDECIDED: AssistantMessage = {
  id: 'msg-9',
  role: 'assistant',
  status: 'awaiting_approval',
  createdAt: '2026-10-21T08:00:00.000Z',
  parts: [{ type: 'tool-call', toolCallId: 'w1', toolName: 'create_place', args: {}, approval: { id: 'w1' } }],
};

/** The answer that proposed the hike under `call_1`, as the thread keeps it. */
function proposed(): AssistantMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    status: 'complete',
    createdAt: '2026-10-21T07:00:00.000Z',
    parts: [{ type: 'data-trek-card', data: { toolCallId: 'call_1', card: HIKE } }],
  };
}

/** The change "Plan this" held for that hike: applied (`true`), discarded (`false`) or still waiting (none). */
function heldTake(approved?: boolean): AssistantMessage {
  const approval = approved === undefined ? { id: 't1' } : { id: 't1', approved };
  const parts: AssistantMessagePart[] = [
    { type: 'tool-call', toolCallId: 't1', toolName: 'take_proposal', args: {}, approval },
    {
      type: 'data-trek-change',
      data: {
        toolCallId: 't1',
        verbKey: 'addTour',
        subject: 'Hochfelln from Bergen',
        rows: [],
        dayId: 22,
        placeIds: [],
        undoable: true,
        card: { ...HIKE, source: 'pending' },
      },
    },
  ];
  return { id: 'msg-2', role: 'assistant', status: 'complete', createdAt: '2026-10-21T07:05:00.000Z', parts };
}

function seed(messages: AssistantMessage[] = []) {
  useAuthStore.setState({ user: buildUser({ id: 1 }) });
  useTripStore.setState({ trip: buildTrip({ id: TRIP, user_id: 1 }) });
  useAssistantStore.setState({
    takeProposal,
    requestCamera,
    byTrip: { [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 7, messages } },
  });
}

function renderCard(card: Route, view: Partial<AssistantView> = {}) {
  const value: AssistantView = {
    tripId: TRIP,
    variant: 'window',
    density: 'compact',
    onRevealMap,
    onOpen: vi.fn(),
    ...view,
  };
  return render(
    <AssistantViewContext.Provider value={value}>
      <TourRouteCard toolCallId="call_1" card={card} />
    </AssistantViewContext.Provider>
  );
}

beforeEach(() => {
  setForcedOffline(false);
  seed();
});

afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useAuthStore.setState(AUTH, true);
  usePermissionsStore.setState(PERMISSIONS, true);
  setForcedOffline(false);
  vi.clearAllMocks();
});

describe('TourRouteCard', () => {
  it('FE-AI-TOUR-021: states the name, the figures as framed fields, the day and the hardest grade, uncertain when little is graded', () => {
    const { container } = renderCard(HIKE);
    expect(screen.getByText('Hochfelln from Bergen')).toBeInTheDocument();
    for (const figure of ['time', 'distance', 'ascent', 'descent']) {
      expect(container.querySelector(`[data-field="${figure}"]`)).not.toBeNull();
    }
    expect(screen.getByText('8.2 km')).toBeInTheDocument();
    expect(screen.getAllByText('640 m')).toHaveLength(2);
    expect(screen.getByText(/^Day 2, /)).toBeInTheDocument();
    expect(screen.getByTestId('tour-grade')).toHaveTextContent('T3');
    expect(screen.getByTestId('tour-grade')).toHaveAccessibleName(/Highest known: T3 Demanding mountain hiking/);
    renderCard({ ...GENTLE, name: 'Gentle way' });
    expect(screen.getAllByTestId('tour-grade')[1]).toHaveTextContent('T2?');
  });

  it('FE-AI-TOUR-022: draws a profile only where every height is known, and says why a route is drawn straight', () => {
    renderCard(HIKE);
    expect(screen.getByRole('group', { name: 'Elevation profile of Hochfelln from Bergen' })).toBeInTheDocument();
    const gap = HIKE_LINE.map((point, index): [number, number, number | null] =>
      index === 2 ? [point[0], point[1], null] : point
    );
    renderCard({ ...HIKE, line: gap });
    expect(screen.getByText('No heights for this route, so there is no profile')).toBeInTheDocument();
    renderCard({ ...HIKE, routed: false, problem: { why: 'no_way', position: null, snappedM: null } });
    expect(screen.getByText('No path within T3 joins these points')).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: /Elevation profile/ })).toHaveLength(1);
    renderCard({ ...HIKE, routed: false, limit: null, problem: { why: 'no_way', position: null, snappedM: null } });
    expect(screen.getByText('No path joins these points')).toBeInTheDocument();
  });

  it('FE-AI-TOUR-023: the profile sets the spot in focus for the map, and a spot from the map is read with its clock', () => {
    const { container } = renderCard(HIKE);
    const profile = screen.getByRole('group', { name: 'Elevation profile of Hochfelln from Bergen' });
    fireEvent.focus(profile);
    expect(useAssistantStore.getState().routeFocus).toMatchObject({ tripId: TRIP, ref: 'call_1', source: 'card' });
    expect(useAssistantStore.getState().routeFocus?.focus.distanceMeters).toBe(0);
    const focus = { distanceMeters: 4100, elevationMeters: 1400, lat: 47.795, lng: 12.625, sampleIndex: 5 };
    act(() => useAssistantStore.getState().setRouteFocus({ tripId: TRIP, ref: 'call_1', focus, source: 'map' }));
    const readout = container.querySelector('[data-profile-focus-readout]');
    expect(readout).toHaveTextContent('At 4.1 km: 1400 m, about 09:40, T3 Demanding mountain hiking');
  });

  it('FE-AI-TOUR-024: a stop chip moves the spot in focus to the stop while pointed at', () => {
    renderCard(HIKE);
    const hut = screen.getByRole('button', { name: /^Strausshütte, 09:40/ });
    fireEvent.mouseEnter(hut);
    expect(useAssistantStore.getState().routeFocus?.focus.distanceMeters).toBeCloseTo(2400, 0);
    fireEvent.mouseLeave(hut);
    expect(useAssistantStore.getState().routeFocus).toBeNull();
    expect(screen.getByRole('button', { name: 'Water, 80 m off the way' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Stops along the way' })).toBeInTheDocument();
  });

  it('FE-AI-TOUR-024b: the stops run as a timeline, each walk on the line between two stops and read with the one it leads to', () => {
    renderCard(HIKE);
    const list = screen.getByRole('list', { name: 'Stops along the way' });
    // One row per stop; the walks between them are hidden, read with the stop they lead to.
    expect(list.querySelectorAll('li:not([aria-hidden="true"])')).toHaveLength(5);
    // The place beside the way has no time: the hut measures from the start, then each stop from the last.
    expect(screen.getAllByRole('button', { name: /from the last stop$/ })).toHaveLength(3);
    const legs = [...list.querySelectorAll('li[aria-hidden="true"]')].map((leg) => leg.textContent).filter(Boolean);
    expect(legs).toHaveLength(3);
  });

  it('FE-AI-TOUR-025: lays out the day with the sun and the walk, the forecast hours with likely rain, and the warnings', () => {
    renderCard(HIKE);
    expect(
      screen.getByRole('img', {
        name: 'Daylight and walking time: Sunrise 07:00, Walking 08:00 to 11:20, Sunset 18:00',
      })
    ).toBeInTheDocument();
    const hours = screen.getByRole('list', { name: 'Weather near the highest point' });
    expect(hours.querySelectorAll('li')).toHaveLength(4);
    expect(hours).toHaveTextContent('40 %');
    expect(hours).not.toHaveTextContent('10 %');
    expect(screen.getByText('Thunderstorms possible from 11:00')).toBeInTheDocument();
    renderCard({ ...HIKE, schedule: { ...(HIKE.schedule as NonNullable<Route['schedule']>), weather: 'climate' } });
    expect(screen.getByText('Typical weather for the date, no forecast yet')).toBeInTheDocument();
  });

  it('FE-AI-TOUR-026: "Plan this" holds the hike below, waits with its reason, and asks to ask again when refused', async () => {
    renderCard(HIKE);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Plan this' }));
    });
    expect(takeProposal).toHaveBeenCalledWith(TRIP, 'call_1');
    expect(screen.getByText('Added below for you to confirm')).toBeInTheDocument();

    takeProposal.mockImplementationOnce(async () => {
      const chat = chatOf(useAssistantStore.getState(), TRIP);
      useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat, error: 'generic' } } });
      return 'refused';
    });
    renderCard({ ...HIKE, name: 'Second' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Plan this' }));
    });
    expect(screen.getByText('This can no longer be planned from here. Ask for it again.')).toBeInTheDocument();

    // Any other refusal is the chat's to say: the button is offered again.
    takeProposal.mockImplementationOnce(async () => {
      const chat = chatOf(useAssistantStore.getState(), TRIP);
      useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat, error: 'too_many_requests' } } });
      return 'refused';
    });
    renderCard({ ...HIKE, name: 'Third' });
    const third = screen.getAllByRole('button', { name: 'Plan this' })[1] as HTMLElement;
    await act(async () => {
      fireEvent.click(third);
    });
    expect(third).toBeEnabled();
    expect(screen.getAllByText('This can no longer be planned from here. Ask for it again.')).toHaveLength(1);
  });

  it('FE-AI-TOUR-026b: one tap plans the hike: the held take is decided at once and the tour opens in the Tours tab', async () => {
    const onOpen = vi.fn();
    const decide = vi.fn(async (_key: number, decisions: { toolCallId: string; approved: boolean }[]) => {
      // The server applies the take; the thread shows it applied with the new tour's place.
      const chat = chatOf(useAssistantStore.getState(), TRIP);
      // The server sends the answer back with the take joined to it, now applied with the new tour's place.
      const applied = proposed();
      applied.parts.push(...heldTake(true).parts, {
        type: 'data-trek-applied',
        data: { toolCallId: decisions[0]?.toolCallId ?? '', entity: 'tour', ids: [77], dayId: 22, undoUntil: null },
      });
      useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat, messages: [applied] } } });
    });
    seed([proposed()]);
    useAssistantStore.setState({ decide });
    takeProposal.mockImplementationOnce(async () => {
      const chat = chatOf(useAssistantStore.getState(), TRIP);
      const joined = proposed();
      joined.parts.push(...heldTake(undefined).parts);
      useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat, messages: [joined] } } });
      return 'held';
    });
    renderCard(HIKE, { onOpen });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Plan this' }));
    });
    expect(decide).toHaveBeenCalledWith(TRIP, [{ toolCallId: 't1', approved: true }]);
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'tour-planner', params: { tour: '77' } });
    expect(screen.getByText('Added to the trip')).toBeInTheDocument();
    expect(screen.queryByText('Added below for you to confirm')).toBeNull();
  });

  it('FE-AI-TOUR-027: "Plan this" is off while offline or while another change waits, and absent where nothing can be taken', () => {
    seed([UNDECIDED]);
    renderCard(HIKE);
    expect(screen.getByRole('button', { name: 'Plan this' })).toBeDisabled();
    expect(screen.getByText('Apply or discard the changes above first.')).toBeInTheDocument();
    act(() => setForcedOffline(true));
    expect(screen.getByText('Offline. The assistant needs internet.')).toBeInTheDocument();
    renderCard({ ...HIKE, routed: false, name: 'Straight' });
    expect(screen.getAllByRole('button', { name: 'Plan this' })).toHaveLength(1);
  });

  it('FE-AI-TOUR-028: a saved tour opens in Tours; on the phone the readout is a row, buttons are taller and the map peeks', () => {
    const onOpen = vi.fn();
    renderCard(SAVED, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: /Open in Tours/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'tour-planner', params: { tour: '41' } });
    expect(screen.queryByRole('button', { name: 'Plan this' })).not.toBeInTheDocument();

    renderCard({ ...HIKE, name: 'On the phone' }, { variant: 'fullscreen' });
    expect(screen.getByText('Slide along the profile to read it')).toBeInTheDocument();
    const onMap = screen.getAllByRole('button', { name: 'On map' })[1] as HTMLElement;
    expect(onMap).toHaveClass('h-10');
    expect(screen.getByRole('button', { name: 'Plan this' })).toHaveClass('h-10');
    fireEvent.click(onMap);
    expect(onRevealMap).toHaveBeenCalled();
    expect(requestCamera).toHaveBeenCalledWith(TRIP, expect.any(Array), 'fit', 'user');
    expect(useAssistantStore.getState().routePeek).toEqual({ tripId: TRIP, toolCallId: 'call_1' });
    const focus = { distanceMeters: 2400, elevationMeters: 920, lat: 47.78, lng: 12.61, sampleIndex: 2 };
    act(() => useAssistantStore.getState().setRouteFocus({ tripId: TRIP, ref: 'call_1', focus, source: 'map' }));
    expect(screen.getByTestId('tour-profile-readout')).toHaveTextContent('920 m');
    expect(screen.getByTestId('tour-profile-readout')).toHaveTextContent('T2');
  });

  it('FE-AI-TOUR-037: on the phone a saved tour opens as its place on the plan, since the phone has no Tours tab', () => {
    const onOpen = vi.fn();
    renderCard(SAVED, { onOpen, variant: 'fullscreen' });
    const open = screen.getByRole('button', { name: /Open tour/ });
    expect(open).toHaveClass('h-10');
    fireEvent.click(open);
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 41, dayId: null });
  });

  it('FE-AI-TOUR-038: "Plan this" is absent for a member who may not add places to the trip', () => {
    usePermissionsStore.setState({ permissions: { place_edit: 'trip_owner' } });
    useTripStore.setState({ trip: buildTrip({ id: TRIP, user_id: 2 }) });
    renderCard(HIKE);
    expect(screen.queryByRole('button', { name: 'Plan this' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'On map' })).toBeInTheDocument();
  });

  it('FE-AI-TOUR-039: a card drawn again does not offer a tour the thread already holds or applied, only one discarded', () => {
    const view = renderCard(HIKE);
    expect(screen.getByRole('button', { name: 'Plan this' })).toBeEnabled();
    view.unmount();

    seed([proposed(), heldTake(true)]);
    const again = renderCard(HIKE);
    expect(screen.queryByRole('button', { name: 'Plan this' })).not.toBeInTheDocument();
    expect(screen.getByText('Added to the trip')).toBeInTheDocument();
    again.unmount();

    seed([proposed(), heldTake(false)]);
    renderCard(HIKE);
    expect(screen.getByRole('button', { name: 'Plan this' })).toBeEnabled();
  });

  it('FE-AI-TOUR-040: what came of a take decides the card, not an error the chat still shows from before', async () => {
    const chat = chatOf(useAssistantStore.getState(), TRIP);
    useAssistantStore.setState({ byTrip: { [TRIP]: { ...chat, error: 'generic' } } });
    renderCard(HIKE);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Plan this' }));
    });
    expect(screen.getByText('Added below for you to confirm')).toBeInTheDocument();

    // Held nothing (a turn started, the thread changed): the button is offered again, nothing said taken.
    takeProposal.mockResolvedValueOnce('skipped');
    renderCard({ ...HIKE, name: 'Skipped' });
    const second = screen.getByRole('button', { name: 'Plan this' });
    await act(async () => {
      fireEvent.click(second);
    });
    expect(second).toBeEnabled();
    expect(screen.getAllByText('Added below for you to confirm')).toHaveLength(1);
  });

  it('FE-AI-TOUR-041: says why a route is drawn straight for each reason, and keeps two warnings of one kind', () => {
    const straight = (why: NonNullable<Route['problem']>['why'], position: number | null = null): Route => ({
      ...HIKE,
      name: why,
      routed: false,
      problem: { why, position, snappedM: null },
    });
    renderCard(straight('point_off_the_way', 2));
    expect(screen.getByText('Point 2 is too far from any path')).toBeInTheDocument();
    renderCard(straight('ferry_only'));
    expect(
      screen.getByText('Some stations can only be reached by boat, so the walk is drawn straight')
    ).toBeInTheDocument();
    renderCard(straight('too_long'));
    expect(screen.getByText('This way is longer than one hike is planned for')).toBeInTheDocument();
    renderCard(straight('not_planned'));
    expect(screen.queryByText('The way is planned when the tour is added')).not.toBeInTheDocument();

    const rain = [
      { kind: 'rain' as const, at: '10:00', count: null },
      { kind: 'rain' as const, at: '14:00', count: null },
    ];
    renderCard({ ...HIKE, name: 'Wet', warnings: rain });
    expect(screen.getByText('Rain likely from 10:00')).toBeInTheDocument();
    expect(screen.getByText('Rain likely from 14:00')).toBeInTheDocument();
  });

  it('FE-AI-TOUR-042: the day shows the latest start when none is set, and the walk in the dark in red', () => {
    const schedule = HIKE.schedule as NonNullable<Route['schedule']>;
    renderCard({ ...HIKE, schedule: { ...schedule, start: null, arrive: null, latestStart: '10:30' } });
    expect(screen.getByText('Start by 10:30')).toBeInTheDocument();

    const { container } = renderCard({
      ...HIKE,
      name: 'Early',
      schedule: { ...schedule, start: '06:00', arrive: '19:00', latestStart: '10:30' },
    });
    expect(container.querySelectorAll('[data-testid="tour-day"] .bg-danger')).toHaveLength(2);
    expect(screen.getAllByText('Start by 10:30')).toHaveLength(1);
  });
});
