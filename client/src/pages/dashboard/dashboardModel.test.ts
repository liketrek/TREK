import { describe, expect, it } from 'vitest';
import { buildDay, buildReservation } from '../../../tests/helpers/factories';
import type { Reservation, ReservationEndpoint } from '../../types';
import { getDepartureTransport, zonedLocalDateTimeToEpoch } from './dashboardModel';

const NOW = Date.parse('2026-01-01T00:00:00Z');
const TRANSPORT_TYPES = [
  'flight',
  'train',
  'bus',
  'car',
  'taxi',
  'bicycle',
  'cruise',
  'ferry',
  'transit',
  'transport_other',
];

function origin(overrides: Partial<ReservationEndpoint> = {}): ReservationEndpoint {
  return {
    role: 'from',
    sequence: 0,
    name: 'Paris (CDG)',
    code: 'CDG',
    lat: 49.0097,
    lng: 2.5479,
    timezone: 'Europe/Paris',
    local_date: '2026-06-01',
    local_time: '10:00',
    ...overrides,
  };
}

function transport(overrides: Partial<Reservation> = {}): Reservation {
  return buildReservation({
    type: 'flight',
    status: 'confirmed',
    reservation_time: '2026-06-01T10:00',
    endpoints: [origin()],
    ...overrides,
  });
}

describe('zonedLocalDateTimeToEpoch', () => {
  it('converts summer and winter wall times using the IANA offset', () => {
    expect(zonedLocalDateTimeToEpoch('2026-06-01', '10:00', 'Europe/Paris')).toBe(Date.parse('2026-06-01T08:00:00Z'));
    expect(zonedLocalDateTimeToEpoch('2026-01-15', '10:00', 'America/New_York')).toBe(
      Date.parse('2026-01-15T15:00:00Z')
    );
  });

  it('rejects a DST gap and chooses the earlier instant in a DST fold', () => {
    expect(zonedLocalDateTimeToEpoch('2026-03-08', '02:30', 'America/New_York')).toBeNull();
    expect(zonedLocalDateTimeToEpoch('2026-11-01', '01:30', 'America/New_York')).toBe(
      Date.parse('2026-11-01T05:30:00Z')
    );
  });

  it('rejects malformed values and unknown time zones', () => {
    expect(zonedLocalDateTimeToEpoch('2026-02-30', '10:00', 'Europe/Paris')).toBeNull();
    expect(zonedLocalDateTimeToEpoch('2026-02-20', '25:00', 'Europe/Paris')).toBeNull();
    expect(zonedLocalDateTimeToEpoch('2026-02-20', '10:00', 'Mars/Olympus')).toBeNull();
  });
});

describe('getDepartureTransport', () => {
  it.each(TRANSPORT_TYPES)('accepts the %s transport type', (type) => {
    const result = getDepartureTransport([transport({ type })], [], NOW);
    expect(result?.reservationId).toBeDefined();
  });

  it('includes pending transports, excludes cancelled transports and ignores non-transports', () => {
    const cancelled = transport({
      id: 1,
      status: 'cancelled',
      reservation_time: '2026-05-01T08:00',
      endpoints: [origin({ local_date: '2026-05-01', local_time: '08:00' })],
    });
    const restaurant = transport({ id: 2, type: 'restaurant', reservation_time: '2026-05-02T08:00' });
    const pending = transport({
      id: 3,
      status: 'pending',
      title: 'Pending flight',
      reservation_time: '2026-05-03T08:00',
      endpoints: [origin({ local_date: '2026-05-03', local_time: '08:00' })],
    });
    expect(getDepartureTransport([cancelled, restaurant, pending], [], NOW)?.reservationId).toBe(3);
  });

  it('ignores undated drafts when selecting the fixed first dated transport', () => {
    const undated = transport({
      id: 1,
      reservation_time: null,
      day_id: null,
      endpoints: [origin({ local_date: null })],
    });
    const dated = transport({ id: 2 });
    expect(getDepartureTransport([undated, dated], [], NOW)?.reservationId).toBe(2);
  });

  it('falls back to the linked day date for a time-only reservation', () => {
    const day = buildDay({ id: 44, date: '2026-06-03' });
    const result = getDepartureTransport(
      [
        transport({
          id: 8,
          day_id: day.id,
          reservation_time: '09:15',
          endpoints: [origin({ local_date: null, local_time: null })],
        }),
      ],
      [day],
      NOW
    );
    expect(result?.departureAt).toBe(Date.parse('2026-06-03T07:15:00Z'));
    expect(result?.localTime).toBe('09:15');
  });

  it('prefers the origin endpoint date and time over reservation_time', () => {
    const result = getDepartureTransport(
      [
        transport({
          reservation_time: '2026-06-10T18:45',
          endpoints: [origin({ local_date: '2026-06-04', local_time: '07:30' })],
        }),
      ],
      [],
      NOW
    );
    expect(result?.departureAt).toBe(Date.parse('2026-06-04T05:30:00Z'));
    expect(result?.localTime).toBe('07:30');
  });

  it('uses endpoint coordinates when the stored time zone is absent or invalid', () => {
    const missing = getDepartureTransport(
      [transport({ endpoints: [origin({ timezone: null, lat: 48.8566, lng: 2.3522 })] })],
      [],
      NOW
    );
    const invalid = getDepartureTransport(
      [transport({ endpoints: [origin({ timezone: 'Mars/Olympus', lat: 48.8566, lng: 2.3522 })] })],
      [],
      NOW
    );
    expect(missing?.timeZone).toBe('Europe/Paris');
    expect(invalid?.timeZone).toBe('Europe/Paris');
  });

  it('does not skip an earlier dated transport that lacks time or a resolvable origin time zone', () => {
    const completeLater = transport({
      id: 20,
      reservation_time: '2026-06-02T10:00',
      endpoints: [origin({ local_date: '2026-06-02', local_time: '10:00' })],
    });
    const missingTime = transport({
      id: 10,
      reservation_time: '2026-06-01',
      endpoints: [origin({ local_date: '2026-06-01', local_time: null })],
    });
    const missingZone = transport({
      id: 11,
      reservation_time: '2026-06-01T09:00',
      endpoints: [origin({ local_date: '2026-06-01', local_time: '09:00', timezone: null, lat: NaN, lng: NaN })],
    });
    expect(getDepartureTransport([completeLater, missingTime], [], NOW)).toBeNull();
    expect(getDepartureTransport([completeLater, missingZone], [], NOW)).toBeNull();
  });

  it('keeps the fixed first transport after it departs instead of switching to the next future leg', () => {
    const departed = transport({
      id: 1,
      reservation_time: '2026-01-01T09:00',
      endpoints: [origin({ local_date: '2026-01-01', local_time: '09:00' })],
    });
    const later = transport({
      id: 2,
      reservation_time: '2026-06-02T09:00',
      endpoints: [origin({ local_date: '2026-06-02', local_time: '09:00' })],
    });
    expect(getDepartureTransport([departed, later], [], Date.parse('2026-01-01T12:00:00Z'))).toBeNull();
  });

  it('uses reservation id as the deterministic tie-breaker', () => {
    const highId = transport({ id: 20, title: 'High id' });
    const lowId = transport({ id: 10, title: 'Low id' });
    expect(getDepartureTransport([highId, lowId], [], NOW)?.reservationId).toBe(10);
  });
});
