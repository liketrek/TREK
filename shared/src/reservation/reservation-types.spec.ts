import { CARRIER_TYPES, isCarrierType } from '../roadtrip/carriers';
import {
  BOOKING_RESERVATION_TYPES,
  CARRIER_RESERVATION_TYPES,
  LEG_RESERVATION_TYPES,
  MCP_CREATABLE_TRANSPORT_TYPES,
  RENTAL_RESERVATION_TYPES,
  RESERVATION_STATUSES,
  RESERVATION_TYPE_KEYS,
  ROADTRIP_RESERVATION_TYPES,
  TRANSPORT_RESERVATION_TYPES,
  TRAVEL_RESERVATION_TYPES,
  isTransportReservationType,
  reservationTypeInfo,
} from './reservation-types';
import { reservationSchema, reservationStatusSchema, reservationTypeSchema } from './reservation.schema';

import { describe, expect, it } from 'vitest';

// The subsets pin the hand-written lists they replaced, value for value and in
// order: the MCP tool enums are built from them and list their values as here.
describe('reservation type catalog', () => {
  it('lists every type once', () => {
    expect(new Set(RESERVATION_TYPE_KEYS).size).toBe(RESERVATION_TYPE_KEYS.length);
  });

  it('keeps the transport set of the update_transport gate', () => {
    expect(TRANSPORT_RESERVATION_TYPES).toEqual([
      'flight',
      'train',
      'bus',
      'car',
      'taxi',
      'bicycle',
      'cruise',
      'ferry',
      'cable_car',
      'transit',
      'transport_other',
    ]);
  });

  it('keeps the transport picker an assistant may ask for, without transit', () => {
    expect(MCP_CREATABLE_TRANSPORT_TYPES).toEqual([
      'flight',
      'train',
      'bus',
      'car',
      'taxi',
      'bicycle',
      'cruise',
      'ferry',
      'cable_car',
      'transport_other',
    ]);
  });

  it('keeps the booking picker', () => {
    expect(BOOKING_RESERVATION_TYPES).toEqual(['hotel', 'restaurant', 'event', 'tour', 'activity', 'parking', 'other']);
  });

  it('gives legs to flights and trains only', () => {
    expect(LEG_RESERVATION_TYPES).toEqual(['flight', 'train']);
  });

  it('calls the same rides carriers as the road trip did, without the hire car', () => {
    expect([...CARRIER_RESERVATION_TYPES].sort()).toEqual(['bus', 'cruise', 'ferry', 'flight', 'train']);
    expect(CARRIER_TYPES).toBe(CARRIER_RESERVATION_TYPES);
    expect(isCarrierType('car')).toBe(false);
    expect(RENTAL_RESERVATION_TYPES).toEqual(['car']);
    expect([...ROADTRIP_RESERVATION_TYPES].sort()).toEqual(['bus', 'car', 'cruise', 'ferry', 'flight', 'train']);
  });

  it('counts every transport and the hotel as travel', () => {
    expect(TRAVEL_RESERVATION_TYPES).toEqual([...TRANSPORT_RESERVATION_TYPES, 'hotel']);
  });

  it('looks a stored type up, and knows nothing about a value outside the catalog', () => {
    expect(reservationTypeInfo('ferry')).toMatchObject({ isTransport: true, isCarrier: true, creatableViaMcp: true });
    expect(reservationTypeInfo('transit')).toMatchObject({
      isTransport: true,
      isCarrier: false,
      creatableViaMcp: false,
    });
    expect(reservationTypeInfo('spaceship')).toBeUndefined();
    expect(reservationTypeInfo(null)).toBeUndefined();
    expect(isTransportReservationType('cable_car')).toBe(true);
    expect(isTransportReservationType('hotel')).toBe(false);
    expect(isTransportReservationType(undefined)).toBe(false);
  });

  it('keeps the three statuses', () => {
    expect(RESERVATION_STATUSES).toEqual(['pending', 'confirmed', 'cancelled']);
  });
});

describe('reservation response type and status', () => {
  it('accepts the catalog values and passes stored free text through', () => {
    expect(reservationTypeSchema.parse('flight')).toBe('flight');
    expect(reservationTypeSchema.parse('legacy_kind')).toBe('legacy_kind');
    expect(reservationStatusSchema.parse('confirmed')).toBe('confirmed');
    expect(reservationStatusSchema.parse('waitlisted')).toBe('waitlisted');
    expect(reservationTypeSchema.safeParse(3).success).toBe(false);
  });

  it('still parses a row whose type is outside the catalog', () => {
    const row = { id: 1, trip_id: 2, title: 'Old row', status: 'pending', type: 'balloon' };
    expect(reservationSchema.parse(row)).toMatchObject({ type: 'balloon' });
  });
});
