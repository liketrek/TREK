/**
 * FE-AI-BOOKING-001 to FE-AI-BOOKING-019
 *
 * The booking cards in the chat: a ticket with its route, times and legs, a
 * stay with its nights and check-in window, a venue with its place and time;
 * the status dot, the review mark and the travellers; the frame of a create,
 * an update and a removal; a list from three bookings on; and the ways to the
 * plan's map and to the booking itself, in the window and on the phone.
 */
import type {
  AssistantMessage,
  BookingCard as BookingCardData,
  BookingItem,
  BookingLeg,
  BookingStay,
  BookingTicket,
} from '@trek/shared';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../../../../tests/helpers/factories';
import { fireEvent, render, screen, waitFor, within } from '../../../../../tests/helpers/render';
import { fetchPhoto } from '../../../../services/photoService';
import { useAuthStore } from '../../../../store/authStore';
import { useSettingsStore } from '../../../../store/settingsStore';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import BookingBlock from './BookingBlock';
import { BookingChangeBody, BookingChangeFacts } from './BookingChangeSlots';

vi.mock('../../../../services/photoService', () => ({
  fetchPhoto: vi.fn(),
  getCached: vi.fn(() => undefined),
}));

const AUTH = useAuthStore.getState();
const SETTINGS = useSettingsStore.getState();
const RealObserver = globalThis.IntersectionObserver;

const day = (id: number, number: number, date: string) => ({ id, number, date });

const FLIGHT: BookingItem = {
  tripId: 4,
  tripTitle: null,
  reservationId: 501,
  type: 'flight',
  title: 'Frankfurt to New York',
  status: 'confirmed',
  needsReview: false,
  hasReference: true,
  price: { amount: 420, currency: 'EUR' },
  travelers: [
    { id: 7, name: 'mia', avatarKey: null },
    { id: 8, name: 'jon', avatarKey: null },
  ],
  moreTravelers: 0,
  changed: [],
  body: {
    shape: 'ticket',
    stops: [
      { name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.57 },
      { name: 'New York', code: 'JFK', lat: 40.64, lng: -73.78 },
    ],
    legs: [
      {
        carrier: 'Lufthansa',
        number: 'LH 400',
        departs: '08:15',
        departsDay: day(31, 1, '2026-06-03'),
        arrives: '11:05',
        arrivesDay: day(32, 2, '2026-06-04'),
        minutes: 530,
        seat: '12A',
        platform: null,
      },
    ],
    minutes: 530,
    mappable: true,
  },
};

const STOPOVER: BookingItem = {
  ...FLIGHT,
  reservationId: 502,
  body: {
    shape: 'ticket',
    stops: [
      { name: 'Frankfurt', code: 'FRA', lat: 50.03, lng: 8.57 },
      { name: 'Munich', code: 'MUC', lat: 48.35, lng: 11.79 },
      { name: 'New York', code: 'JFK', lat: 40.64, lng: -73.78 },
    ],
    legs: [
      {
        carrier: 'Lufthansa',
        number: 'LH 101',
        departs: '08:15',
        departsDay: day(31, 1, '2026-06-03'),
        arrives: '09:10',
        arrivesDay: day(31, 1, '2026-06-03'),
        minutes: 55,
        seat: '12A',
        platform: null,
      },
      {
        carrier: 'Lufthansa',
        number: 'LH 410',
        departs: '10:30',
        departsDay: day(31, 1, '2026-06-03'),
        arrives: '13:05',
        arrivesDay: day(31, 1, '2026-06-03'),
        minutes: null,
        seat: null,
        platform: null,
      },
    ],
    minutes: null,
    mappable: true,
  },
};

const STAY: BookingItem = {
  tripId: 4,
  tripTitle: null,
  reservationId: null,
  type: 'hotel',
  title: 'Mercure Hotel Berlin City',
  status: null,
  needsReview: true,
  hasReference: false,
  price: null,
  travelers: [],
  moreTravelers: 0,
  changed: [],
  body: {
    shape: 'stay',
    accommodationId: 601,
    placeId: 12,
    address: 'Invalidenstraße 38',
    lat: 52.53,
    lng: 13.38,
    photoKey: 'ChIJmercure',
    checkIn: { day: day(31, 1, '2026-06-03'), from: '15:00', until: '20:00' },
    checkOut: { day: day(33, 3, '2026-06-05'), by: '11:00' },
    nights: 2,
  },
};

const DINNER: BookingItem = {
  ...STAY,
  reservationId: 503,
  type: 'restaurant',
  title: 'Dinner at Borchardt',
  status: 'pending',
  needsReview: false,
  body: {
    shape: 'venue',
    day: day(32, 2, '2026-06-04'),
    starts: '19:00',
    ends: '21:30',
    location: 'Borchardt',
    placeId: 13,
    lat: 52.51,
    lng: 13.39,
  },
};

const MESSAGE: AssistantMessage = {
  id: 'm1',
  role: 'assistant',
  status: 'complete',
  createdAt: '2026-06-01T10:00:00.000Z',
  parts: [],
};

function cardOf(items: BookingItem[], change: BookingCardData['change'] = 'none', more = 0): BookingCardData {
  return { kind: 'booking', change, items, more };
}

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', density: 'roomy', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

function answer(items: BookingItem[], view: Partial<AssistantView> = {}, more = 0) {
  const cards = [{ toolCallId: 'tc-1', card: cardOf(items, 'none', more) }];
  return inView(<BookingBlock cards={cards} message={MESSAGE} />, view);
}

function changeItem(card: BookingCardData): ChangeItem {
  return {
    toolCallId: 'tc-w',
    preview: {
      toolCallId: 'tc-w',
      verbKey: 'updateReservation',
      subject: 'Dinner',
      rows: [{ op: 'change', labelKey: 'time', before: '19:00', after: '20:00' }],
      dayId: null,
      placeIds: [],
      undoable: false,
      effect: null,
    },
    applied: null,
    state: 'pending',
    card,
  };
}

beforeEach(() => {
  useAuthStore.setState({ user: buildUser({ id: 7 }), placesPhotosEnabled: true });
});

afterEach(() => {
  globalThis.IntersectionObserver = RealObserver;
  useAuthStore.setState(AUTH, true);
  useSettingsStore.setState(SETTINGS, true);
  vi.clearAllMocks();
});

describe('booking cards', () => {
  it('FE-AI-BOOKING-001: a ticket shows its codes, times, duration, carrier, seat and a +1 for a later arrival', () => {
    answer([FLIGHT]);
    expect(screen.getByText('FRA')).toBeInTheDocument();
    expect(screen.getByText('JFK')).toBeInTheDocument();
    expect(screen.getByText('08:15')).toBeInTheDocument();
    expect(screen.getByText('8h 50m')).toBeInTheDocument();
    expect(screen.getByText('Lufthansa LH 400')).toBeInTheDocument();
    expect(screen.getByText('Seat 12A')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByLabelText('Arrives 1 day later')).toHaveTextContent('+1');
    expect(screen.getByText('Reference saved')).toBeInTheDocument();
    expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
  });

  it('FE-AI-BOOKING-002: clock times follow the 12 hour setting', () => {
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, time_format: '12h' } }));
    answer([FLIGHT]);
    expect(screen.getByText('8:15 AM')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-003: a stopover booking lists its legs and the time between them', () => {
    answer([STOPOVER]);
    expect(screen.getByText(/LH 101/)).toBeInTheDocument();
    expect(screen.getByText(/LH 410/)).toBeInTheDocument();
    expect(screen.getByText('1h 20m in MUC')).toBeInTheDocument();
    expect(screen.getByText('1 stop')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-004: a stay shows its nights, check-in green, check-out red, its arrow turned for RTL', () => {
    answer([STAY]);
    expect(screen.getByText('2 nights')).toBeInTheDocument();
    const checkIn = screen.getByText(/Check-in 15:00/).closest('span.inline-flex') as HTMLElement;
    expect(checkIn.className).toContain('text-success');
    const checkOut = screen.getByText(/Check-out 11:00/).closest('span.inline-flex') as HTMLElement;
    expect(checkOut.className).toContain('text-danger');
    // The range is read out in words; the dates and the arrow beside it are hidden from screen readers.
    const range = screen.getByText(/to Fri/);
    expect(range.className).toContain('sr-only');
    const shown = range.nextElementSibling as HTMLElement;
    expect(shown).toHaveAttribute('aria-hidden', 'true');
    expect(shown.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
    expect(screen.getByText('Invalidenstraße 38')).toBeInTheDocument();
  });

  it("FE-AI-BOOKING-005: a stay's picture comes only through TREK's photo proxy", async () => {
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
      const photoUrl = key === 'ChIJmercure' ? '/api/maps/place-photo/ChIJmercure' : 'https://maps.example/x.jpg';
      callback?.({ photoUrl, thumbDataUrl: null });
    });
    const otherBody: BookingStay = { ...(STAY.body as BookingStay), photoKey: 'ChIJother' };
    const other: BookingItem = { ...STAY, title: 'Other', body: otherBody };
    const { container } = answer([STAY, other]);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(1));
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/maps/place-photo/ChIJmercure');
    expect(fetchPhoto).toHaveBeenCalledWith('ChIJmercure', 'ChIJmercure', 52.53, 13.38, STAY.title, expect.anything());
  });

  it('FE-AI-BOOKING-006: a venue shows where it is and its time range', () => {
    answer([DINNER]);
    expect(screen.getByText('Borchardt')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
    expect(screen.getByText('21:30')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-007: the status dot names its status, none without one; one to check wears its review mark', () => {
    answer([FLIGHT, { ...DINNER, status: 'cancelled' }]);
    expect(screen.getByRole('img', { name: 'Confirmed' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cancelled' })).toBeInTheDocument();
    answer([STAY]);
    expect(screen.queryByRole('img', { name: 'Pending' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Review' })).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-017: a stopover of unknown length names only its place; each leg names its carrier and seat', () => {
    const body = STOPOVER.body as BookingTicket;
    const onward = { ...(body.legs[1] as BookingLeg), departs: null };
    answer([{ ...STOPOVER, body: { ...body, legs: [body.legs[0] as BookingLeg, onward] } }]);
    expect(screen.queryByText(/ in MUC/)).not.toBeInTheDocument();
    expect(screen.getAllByText('MUC').some((el) => el.className.includes('rounded-full'))).toBe(true);
    expect(screen.getByText('Lufthansa LH 101')).toBeInTheDocument();
    expect(screen.getByText('Seat 12A')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-018: a transit hop has a dot with no word; a stay its photo slot in the head with the address', () => {
    answer([{ ...FLIGHT, type: 'transit', status: null }]);
    expect(screen.queryByRole('img', { name: /Confirmed|Pending|Cancelled/ })).not.toBeInTheDocument();
    answer([STAY]);
    const head = screen.getByText('Mercure Hotel Berlin City').closest('div') as HTMLElement;
    expect(within(head).getByText('Invalidenstraße 38')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-019: "N more" of a list spanning other trips leads to the dashboard', () => {
    const onOpen = vi.fn();
    answer([{ ...DINNER, tripId: 9, tripTitle: 'Vienna' }, FLIGHT], { onOpen }, 3);
    fireEvent.click(screen.getByText('3 more bookings'));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/dashboard' });
  });

  it('FE-AI-BOOKING-008: the travellers stack names everyone, the signed-in user as You', () => {
    answer([FLIGHT]);
    expect(screen.getByRole('img', { name: 'You, jon' })).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-009: a booking to create sits in a dashed frame, one to delete is struck and faded', () => {
    const toCreate = cardOf([DINNER], 'create');
    const created = inView(<BookingChangeBody card={toCreate} item={changeItem(toCreate)} />);
    expect(created.container.querySelector('section')?.className).toContain('border-dashed');
    created.unmount();
    const toRemove = cardOf([DINNER], 'remove');
    const removed = inView(<BookingChangeBody card={toRemove} item={changeItem(toRemove)} />);
    expect(removed.container.querySelector('section')?.className).toContain('opacity-60');
    expect(screen.getByText('Dinner at Borchardt').className).toContain('line-through');
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
  });

  it('FE-AI-BOOKING-010: an update marks the facts it changes and keeps their before and after on the row', () => {
    const card = cardOf([{ ...DINNER, changed: ['time', 'status'] }], 'update');
    inView(
      <>
        <BookingChangeFacts card={card} item={changeItem(card)} />
        <BookingChangeBody card={card} item={changeItem(card)} />
      </>
    );
    expect(screen.getAllByRole('img', { name: 'Changed' })).toHaveLength(2);
    expect(screen.getByText('20:00')).toBeInTheDocument();
    const created = cardOf([DINNER], 'create');
    const { container } = inView(<BookingChangeFacts card={created} item={changeItem(created)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-AI-BOOKING-011: three bookings or more read as one list, with the rest counted as a way to the tab', () => {
    const onOpen = vi.fn();
    answer([FLIGHT, STAY, DINNER], { onOpen }, 2);
    const list = screen.getByRole('region', { name: 'Bookings' });
    expect(within(list).getByText('5')).toBeInTheDocument();
    expect(within(list).getByText('2 nights')).toBeInTheDocument();
    fireEvent.click(within(list).getByText('2 more bookings'));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'buchungen' });
    fireEvent.click(within(list).getByText('Frankfurt to New York'));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'transports', params: { booking: '501' } });
  });

  it('FE-AI-BOOKING-012: Open goes to the booking in its tab and Show on map draws its route on the plan', () => {
    const onOpen = vi.fn();
    answer([FLIGHT], { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Open the booking' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'transports', params: { booking: '501' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'tab', tab: 'plan', params: { booking: '501', map: '1' } });
  });

  it('FE-AI-BOOKING-013: a stay shows its place on the map and opens on its check-in day', () => {
    const onOpen = vi.fn();
    answer([STAY], { onOpen });
    fireEvent.click(screen.getByRole('button', { name: 'Show on map' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: 12, dayId: null });
    fireEvent.click(screen.getByRole('button', { name: 'Show in the plan' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: null, dayId: 31 });
  });

  it("FE-AI-BOOKING-014: a booking of another trip names that trip and opens that trip's planner", () => {
    const onOpen = vi.fn();
    answer([{ ...DINNER, tripId: 9, tripTitle: 'Vienna' }], { onOpen });
    expect(screen.getByText('In Vienna')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open the booking' }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'page', path: '/trips/9?tab=buchungen&booking=503' });
  });

  it('FE-AI-BOOKING-015: on the phone the actions are tall; without a way to open them there are none', () => {
    answer([FLIGHT], { variant: 'fullscreen', onOpen: vi.fn() });
    expect(screen.getByRole('button', { name: 'Open the booking' }).className).toContain('h-10');
    answer([DINNER]);
    expect(screen.queryAllByRole('button', { name: 'Open the booking' })).toHaveLength(1);
  });

  it('FE-AI-BOOKING-016: inside a change card the booking has no actions of its own', () => {
    const card = cardOf([FLIGHT], 'none');
    inView(<BookingChangeBody card={card} item={changeItem(card)} />, { onOpen: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Open the booking' })).not.toBeInTheDocument();
    expect(screen.getByText('Frankfurt to New York')).toBeInTheDocument();
  });
});
