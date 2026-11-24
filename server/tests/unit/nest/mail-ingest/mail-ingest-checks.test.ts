/**
 * The server's checks on a booking read from a mail (G1 to G8) and the choice
 * of its trip: the AI's pick is one input, the dates and the trip list decide,
 * and every failure names the first reason the inbox shows.
 */
import {
  checkInText,
  chooseTrip,
  contentHash,
  fitsTrip,
  implausible,
  isCancellation,
  judgeBooking,
  missingCritical,
  missingReference,
  nearTrip,
  type CheckContext,
  type MailDraft,
  type TripOption,
} from '../../../../src/nest/mail-ingest/mail-ingest-checks';
import type { BookingImportPreviewItem } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const NOW = new Date('2030-01-15T10:00:00Z');
const endpoint = (role: 'from' | 'to', name: string, code: string, lat: number, lng: number) => ({
  role,
  sequence: role === 'from' ? 0 : 1,
  name,
  code,
  lat,
  lng,
  timezone: null,
  local_time: null,
  local_date: null,
});
const HND = endpoint('from', 'Tokyo Haneda', 'HND', 35.55, 139.78);
const ITM = endpoint('to', 'Osaka Itami', 'ITM', 34.78, 135.44);
const FLIGHT: BookingImportPreviewItem = {
  type: 'flight',
  title: 'LH 716 Tokyo to Osaka',
  reservation_time: '2030-03-02T10:00',
  reservation_end_time: '2030-03-02T11:15',
  confirmation_number: 'ABC123',
  metadata: { flight_number: 'LH716', price: 120.5, priceCurrency: 'EUR' },
  endpoints: [HND, ITM],
  source: { fileName: 'mail.eml', index: 0 },
};
const HOTEL: BookingImportPreviewItem = {
  type: 'hotel',
  title: 'Hotel Sakura',
  confirmation_number: 'H-778',
  _venue: { name: 'Hotel Sakura', lat: 35.01, lng: 135.76 },
  _accommodation: { check_in: '2030-03-03T15:00', check_out: '2030-03-05T11:00' },
  source: { fileName: 'mail.eml', index: 0 },
};
const TEXT = 'Your booking ABC123: flight LH 716 from Tokyo to Osaka. Hotel Sakura, reference H-778.';

function trip(id: number, start: string | null, end: string | null, over: Partial<TripOption> = {}): TripOption {
  const days = new Map<string, number>();
  if (start && end) {
    for (let d = new Date(`${start}T00:00:00Z`), n = 1; d <= new Date(`${end}T00:00:00Z`); n++) {
      days.set(d.toISOString().slice(0, 10), id * 100 + n);
      d = new Date(d.getTime() + 86_400_000);
    }
  }
  return {
    id,
    title: `Trip ${id}`,
    start_date: start,
    end_date: end,
    ownerId: 1,
    currency: 'EUR',
    days,
    places: [],
    ...over,
  };
}
const JAPAN = trip(1, '2030-03-01', '2030-03-10');
const context = (over: Partial<CheckContext> = {}): CheckContext => ({
  trips: [JAPAN],
  addressTripId: null,
  subject: 'Your flight',
  documentText: TEXT,
  now: NOW,
  knownAirport: (code) => ['HND', 'ITM'].includes(code),
  ...over,
});
const draft = (over: Partial<MailDraft> = {}): MailDraft => ({
  item: FLIGHT,
  source: 'kitinerary',
  kind: 'new_booking',
  aiTripId: null,
  uncertainFields: [],
  suggestedNewTrip: null,
  imageOnly: false,
  disagrees: false,
  ...over,
});

describe('the single checks', () => {
  it('needs a type, a start and, for a transport, both ends', () => {
    expect(missingCritical(FLIGHT)).toBe(false);
    expect(missingCritical({ ...FLIGHT, reservation_time: null })).toBe(true);
    expect(missingCritical({ ...FLIGHT, endpoints: [HND] })).toBe(true);
    expect(missingCritical(HOTEL)).toBe(false);
  });

  it('needs a booking reference for a transport, a stay or a rental only', () => {
    expect(missingReference({ ...FLIGHT, confirmation_number: ' ' })).toBe(true);
    expect(missingReference({ ...FLIGHT, type: 'restaurant', confirmation_number: null })).toBe(false);
  });

  it('refuses values that cannot be right (G5)', () => {
    const known = (code: string) => code !== 'XXX';
    expect(implausible(FLIGHT, NOW, known)).toBe(false);
    expect(implausible({ ...FLIGHT, reservation_time: 'soon' }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, reservation_time: '2034-01-01T10:00' }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, reservation_end_time: '2030-03-01T10:00' }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, reservation_end_time: '2030-03-03T10:00' }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, confirmation_number: 'A' }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, metadata: { price: 200_000 } }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, metadata: { priceCurrency: 'euro' } }, NOW, known)).toBe(true);
    expect(implausible({ ...FLIGHT, metadata: { price: '1.234,50' } }, NOW, known)).toBe(false);
    expect(implausible(FLIGHT, NOW, (code) => code !== 'ITM')).toBe(true);
    const longStay = { ...HOTEL, _accommodation: { check_in: '2030-03-01', check_out: '2030-06-01' } };
    expect(implausible(longStay, NOW, known)).toBe(true);
  });

  it('vetoes a cancellation by kind, status or subject (G8)', () => {
    const cancelled = { ...FLIGHT, metadata: { reservationStatus: 'ReservationCancelled' } };
    expect(isCancellation(FLIGHT, 'cancellation', null)).toBe(true);
    expect(isCancellation(cancelled, 'new_booking', null)).toBe(true);
    expect(isCancellation(FLIGHT, 'new_booking', 'Ihre Buchung wurde storniert')).toBe(true);
    expect(isCancellation(FLIGHT, 'new_booking', 'Your booking at Hotel Sakura')).toBe(false);
  });

  it('wants an AI value in the mail, and only marks a free text it cannot find (G6)', () => {
    expect(checkInText(FLIGHT, TEXT)).toEqual({ ok: true, uncertain: [] });
    expect(checkInText({ ...FLIGHT, confirmation_number: 'ZZZ999' }, TEXT).ok).toBe(false);
    expect(checkInText({ ...FLIGHT, title: 'Paris Express', location: 'Gare du Nord' }, TEXT)).toEqual({
      ok: true,
      uncertain: ['title', 'location'],
    });
  });

  it('fits a booking into a trip by its dates and the days it needs (G3)', () => {
    expect(fitsTrip(FLIGHT, JAPAN)).toBe(true);
    expect(fitsTrip(HOTEL, JAPAN)).toBe(true);
    expect(fitsTrip(FLIGHT, trip(2, '2030-04-01', '2030-04-05'))).toBe(false);
    expect(fitsTrip(FLIGHT, trip(3, null, null))).toBe(false);
    // A day of slack is no day row: the booking needs the day it starts on.
    expect(fitsTrip(FLIGHT, trip(4, '2030-03-03', '2030-03-05'))).toBe(false);
    expect(fitsTrip({ ...FLIGHT, reservation_time: null }, JAPAN)).toBe(false);
  });

  it('confirms a booking lies near a trip by the trip’s places', () => {
    const kyoto = trip(5, '2030-03-01', '2030-03-10', {
      places: [{ name: 'Kyoto Station', address: null, lat: 34.98, lng: 135.75 }],
    });
    expect(nearTrip(HOTEL, kyoto)).toBe(true);
    expect(nearTrip(FLIGHT, kyoto)).toBe(true);
    expect(nearTrip({ ...HOTEL, _venue: { name: 'Far', lat: 43.06, lng: 141.35 } }, kyoto)).toBe(false);
  });

  it('hashes what a booking says', () => {
    expect(contentHash(FLIGHT)).toBe(contentHash({ ...FLIGHT, confirmation_number: 'abc 123' }));
    expect(contentHash(FLIGHT)).not.toBe(contentHash({ ...FLIGHT, reservation_time: '2030-03-02T11:00' }));
  });
});

describe('chooseTrip', () => {
  const second = trip(2, '2030-02-25', '2030-03-05', {
    places: [{ name: 'Osaka', address: null, lat: 34.7, lng: 135.5 }],
  });

  it('takes the one trip whose dates fit', () => {
    expect(chooseTrip(FLIGHT, null, context())).toEqual({ tripId: 1, suggestedTripId: 1, reason: null });
  });

  it('of several, takes the AI’s pick only when the booking lies near it', () => {
    const both = context({ trips: [JAPAN, second] });
    expect(chooseTrip(FLIGHT, 2, both)).toEqual({ tripId: 2, suggestedTripId: 2, reason: null });
    expect(chooseTrip(FLIGHT, 1, both)).toEqual({ tripId: null, suggestedTripId: 1, reason: 'trip_ambiguous' });
    expect(chooseTrip(FLIGHT, null, both)).toEqual({ tripId: null, suggestedTripId: 1, reason: 'trip_ambiguous' });
  });

  it('suggests the AI’s pick when no trip fits, and names trips without dates', () => {
    const later = trip(6, '2030-06-01', '2030-06-10');
    expect(chooseTrip(FLIGHT, 6, context({ trips: [later] }))).toEqual({
      tripId: null,
      suggestedTripId: 6,
      reason: 'no_trip_in_range',
    });
    expect(chooseTrip(FLIGHT, 9, context({ trips: [trip(7, null, null)] })).reason).toBe('trip_without_dates');
  });

  it('keeps a trip address’s booking to its trip, whatever the AI says', () => {
    expect(chooseTrip(FLIGHT, 2, context({ addressTripId: 1, trips: [JAPAN, second] }))).toEqual({
      tripId: 1,
      suggestedTripId: 1,
      reason: null,
    });
    const undated = trip(8, null, null);
    expect(chooseTrip(FLIGHT, null, context({ addressTripId: 8, trips: [undated] })).tripId).toBe(8);
    const elsewhen = trip(9, '2030-06-01', '2030-06-10');
    const outside = chooseTrip(FLIGHT, null, context({ addressTripId: 9, trips: [elsewhen] }));
    expect(outside.reason).toBe('outside_trip_dates');
    expect(chooseTrip(FLIGHT, null, context({ addressTripId: 10 })).reason).toBe('no_edit_permission');
  });
});

describe('judgeBooking', () => {
  it('passes a machine-read booking that fits one trip', () => {
    const verdict = judgeBooking(draft(), context());
    expect(verdict.reason).toBeNull();
    expect(verdict.checks).toMatchObject({ schema: 'pass', dates: 'pass', agreement: 'skipped', in_text: 'skipped' });
    expect(verdict.choice.tripId).toBe(1);
  });

  it('names the first reason in the order the inbox reads them', () => {
    expect(judgeBooking(draft({ kind: 'change' }), context()).reason).toBe('change_or_cancellation');
    expect(judgeBooking(draft({ kind: 'cancellation' }), context()).reason).toBe('change_or_cancellation');
    expect(judgeBooking(draft(), context({ subject: 'Cancelled: your flight' })).reason).toBe('cancelled');
    expect(judgeBooking(draft({ item: { ...FLIGHT, endpoints: [] } }), context()).reason).toBe(
      'missing_critical_field',
    );
    expect(judgeBooking(draft({ item: { ...FLIGHT, title: '' } }), context()).reason).toBe('missing_critical_field');
    expect(judgeBooking(draft(), context({ knownAirport: () => false })).reason).toBe('implausible');
    expect(judgeBooking(draft({ source: 'ai', disagrees: true }), context()).reason).toBe('source_mismatch');
    expect(judgeBooking(draft({ source: 'ai', imageOnly: true }), context()).reason).toBe('image_only');
    expect(judgeBooking(draft({ source: 'ai' }), context({ documentText: 'nothing' })).reason).toBe('not_in_text');
    const noReference = { ...FLIGHT, confirmation_number: null };
    expect(judgeBooking(draft({ item: noReference }), context()).reason).toBe('missing_confirmation');
    expect(judgeBooking(draft(), context({ trips: [] })).reason).toBe('no_trip_in_range');
  });

  it('adds the fields it could not find to the AI’s own uncertain ones', () => {
    const verdict = judgeBooking(
      draft({ source: 'ai', uncertainFields: ['seat'], item: { ...FLIGHT, location: 'Terminal 9' } }),
      context(),
    );
    expect(verdict.uncertain).toEqual(['seat', 'location']);
    expect(verdict.checks.in_text).toBe('pass');
  });
});
