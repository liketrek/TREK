/**
 * FE-AI-PLACES-001 to FE-AI-PLACES-010
 *
 * The strip of places a search found: what a card says, that its picture only
 * ever comes from TREK's photo proxy, "+ Day N" for the day in focus or a
 * picked one, why it waits while a change is undecided, the map's part, and
 * no "+ Day" in a journey's chat.
 */
import type { AssistantFoundPlace, AssistantMessage, AssistantPlaces } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildAssignment,
  buildCategory,
  buildDay,
  buildPlace,
  buildTrip,
  buildUser,
} from '../../../tests/helpers/factories';
import { fireEvent, render, screen, waitFor } from '../../../tests/helpers/render';
import { fetchPhoto } from '../../services/photoService';
import { assistantChatKey } from '../../store/assistantChatKey';
import { chatOf, useAssistantStore } from '../../store/assistantStore';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { setForcedOffline } from '../../sync/networkMode';
import AssistantPlaceStrip from './AssistantPlaceStrip';
import { type AssistantView, AssistantViewContext } from './assistantViewContext';

vi.mock('../../services/photoService', () => ({
  fetchPhoto: vi.fn(),
  getCached: vi.fn(() => undefined),
}));

const TRIP = 4;
const ASSISTANT = useAssistantStore.getState();
const TRIPS = useTripStore.getState();
const AUTH = useAuthStore.getState();
const RealObserver = globalThis.IntersectionObserver;

const DAY_ONE = buildDay({ id: 31, date: '2026-11-02' });
const DAY_TWO = buildDay({ id: 32, date: '2026-11-03' });

function place(ref: string, extra: Partial<AssistantFoundPlace> = {}): AssistantFoundPlace {
  return {
    ref,
    name: `Trattoria ${ref}`,
    address: null,
    lat: 41.889,
    lng: 12.47,
    kind: 'food',
    rating: null,
    openNow: null,
    googlePlaceId: null,
    osmId: null,
    photoKey: null,
    inTripPlaceId: null,
    ...extra,
  };
}

const answer = (parts: AssistantMessage['parts'] = []): AssistantMessage => ({
  id: 'msg-5',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-10-21T08:00:00.000Z',
  parts,
});

const addFoundPlace = vi.fn(async () => {});
const requestCamera = vi.fn();
const setPreviewPin = vi.fn();
const onRevealMap = vi.fn();

function seed({ focusDayId = 31, messages = [] as AssistantMessage[] } = {}) {
  useAuthStore.setState({ user: buildUser({ id: 1 }), placesPhotosEnabled: true });
  useTripStore.setState({
    trip: buildTrip({ id: TRIP, user_id: 1 }),
    days: [DAY_ONE, DAY_TWO],
    assignments: {
      '31': [buildAssignment({ order_index: 0, place: buildPlace({ lat: 41.9, lng: 12.47 }) })],
    },
    categories: [buildCategory({ id: 5, name: 'Restaurant', icon: 'Utensils' })],
  });
  useAssistantStore.setState({
    addFoundPlace,
    requestCamera,
    setPreviewPin,
    byTrip: {
      [TRIP]: { ...chatOf(useAssistantStore.getState(), TRIP), threadId: 7, focus: { dayId: focusDayId }, messages },
    },
  });
}

function renderStrip(found: AssistantPlaces, message = answer(), view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: TRIP, variant: 'window', density: 'compact', onRevealMap, ...view };
  return render(
    <AssistantViewContext.Provider value={value}>
      <AssistantPlaceStrip found={found} message={message} />
    </AssistantViewContext.Provider>
  );
}

beforeEach(() => setForcedOffline(false));
afterEach(() => {
  useAssistantStore.setState(ASSISTANT, true);
  useTripStore.setState(TRIPS, true);
  useAuthStore.setState(AUTH, true);
  globalThis.IntersectionObserver = RealObserver;
  setForcedOffline(false);
  vi.clearAllMocks();
});

describe('AssistantPlaceStrip', () => {
  it('FE-AI-PLACES-001: a card names the place, its likely category, whether it is open and how far it is', () => {
    seed();
    renderStrip({ toolCallId: 's1', places: [place('s1:0', { openNow: true })], more: 0 });
    expect(screen.getByText('Trattoria s1:0')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Open now')).toBeInTheDocument();
    expect(screen.getByText('1.2 km from the previous stop')).toBeInTheDocument();
  });

  it('FE-AI-PLACES-002: shows every card it was sent and counts what the server left out on a tile', () => {
    seed();
    const list = Array.from({ length: 8 }, (_, i) => place(`s1:${i}`));
    renderStrip({ toolCallId: 's1', places: list, more: 4 });
    expect(screen.getAllByRole('button', { name: /^Add to/ })).toHaveLength(8);
    expect(screen.getByText('4 more')).toBeInTheDocument();
  });

  it('FE-AI-PLACES-009: a place known only by its position shows its category, never a photo of the area', () => {
    seed();
    renderStrip({ toolCallId: 's1', places: [place('s1:0', { photoKey: 'coords:41.889000,12.470000' })], more: 0 });
    expect(fetchPhoto).not.toHaveBeenCalled();
  });

  it('FE-AI-PLACES-003: a picture only ever comes from the photo proxy', async () => {
    seed();
    globalThis.IntersectionObserver = class {
      private readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe() {
        this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    vi.mocked(fetchPhoto).mockImplementation((key, _id, _lat, _lng, _name, callback) => {
      const photoUrl = key === 'good' ? '/api/maps/place-photo/good/bytes' : 'https://evil.example/x.jpg';
      callback?.({ photoUrl, thumbDataUrl: null });
    });
    const { container } = renderStrip({
      toolCallId: 's1',
      places: [place('s1:0', { photoKey: 'good' }), place('s1:1', { photoKey: 'bad', lat: 40 })],
      more: 0,
    });
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(1));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/maps/place-photo/good/bytes');
    expect(fetchPhoto).toHaveBeenCalledWith('good', 'good', 41.889, 12.47, 'Trattoria s1:0', expect.any(Function));
  });

  it('FE-AI-PLACES-004: "+ Day 1" suggests the place for the day in focus', () => {
    seed();
    renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 });
    fireEvent.click(screen.getByRole('button', { name: /^Add to/ }));
    expect(addFoundPlace).toHaveBeenCalledWith(TRIP, 's1:0', 31);
  });

  it('FE-AI-PLACES-005: another day is picked from the list, and without a focus the list is the only way', () => {
    seed({ focusDayId: 0 });
    renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 });
    fireEvent.click(screen.getByRole('button', { name: /Pick a day/ }));
    fireEvent.click(screen.getByRole('button', { name: /Nov 3/ }));
    expect(addFoundPlace).toHaveBeenCalledWith(TRIP, 's1:0', 32);
  });

  it('FE-AI-PLACES-006: waits while a change is undecided, and offline', () => {
    const waiting = answer([
      { type: 'tool-call', toolCallId: 'w1', toolName: 'create_place', args: {}, approval: { id: 'w1' } },
    ]);
    seed({ messages: [waiting] });
    const { unmount } = renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 });
    expect(screen.getByRole('button', { name: /^Add to/ })).toBeDisabled();
    unmount();

    seed();
    setForcedOffline(true);
    renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 });
    expect(screen.getByRole('button', { name: /^Add to/ })).toBeDisabled();
  });

  it('FE-AI-PLACES-007: a suggested place says so, and one the trip has goes to the map instead', () => {
    seed();
    const suggested = answer([
      {
        type: 'tool-call',
        toolCallId: 'f1',
        toolName: 'add_found_place',
        args: { lat: 41.889, lng: 12.47 },
        approval: { id: 'f1', approved: true },
      },
    ]);
    renderStrip(
      { toolCallId: 's1', places: [place('s1:0'), place('s1:1', { lat: 40, inTripPlaceId: 8 })], more: 0 },
      suggested,
      { variant: 'fullscreen' }
    );
    expect(screen.getByText('Suggested')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'On map' }));
    expect(onRevealMap).toHaveBeenCalled();
    expect(requestCamera).toHaveBeenCalledWith(TRIP, [[40, 12.47]], 'pan', 'user');
  });

  it('FE-AI-PLACES-008: resting on a card pins it on the map until the pointer leaves', () => {
    seed();
    renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 });
    const card = screen.getByText('Trattoria s1:0').closest('li');
    if (!card) throw new Error('no card');
    fireEvent.mouseEnter(card);
    expect(setPreviewPin).toHaveBeenLastCalledWith({
      tripId: TRIP,
      ref: 's1:0',
      lat: 41.889,
      lng: 12.47,
      name: 'Trattoria s1:0',
    });
    fireEvent.mouseLeave(card);
    expect(setPreviewPin).toHaveBeenLastCalledWith(null);
  });

  it('FE-AI-PLACES-010: a journey chat lists the places but offers no "+ Day" while the trip is on screen', () => {
    // The journey key never matches the planner's trip, so the trip check already hides "+ Day";
    // the scope check in the hook is defence in depth for the day trips and journeys share keys.
    seed();
    renderStrip({ toolCallId: 's1', places: [place('s1:0')], more: 0 }, answer(), {
      tripId: assistantChatKey({ kind: 'journey', journeyId: TRIP }),
    });
    expect(screen.getByText('Trattoria s1:0')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add to/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Pick a day/ })).toBeNull();
  });
});
