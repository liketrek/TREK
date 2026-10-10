import { ReservationEndpoints } from '../../../src/db/entities/ReservationEndpoints.entity';
import { ReservationTravelers } from '../../../src/db/entities/ReservationTravelers.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import type { FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type ReservationRow = EntityDTO<Reservations>;
export type ReservationEndpointRow = EntityDTO<ReservationEndpoints>;

/** A booking on the trip: a flight titled "Test Reservation" unless told otherwise. */
export function makeReservation(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<Reservations> = {},
): Promise<ReservationRow> {
  return createRow(orm, Reservations, {
    trip: tripId,
    title: 'Test Reservation',
    type: 'flight',
    day: null,
    ...overrides,
  });
}

/**
 * One end of a transport booking (`role` 'from' or 'to'), at Paris CDG
 * unless told otherwise.
 */
export function makeReservationEndpoint(
  orm: FactoryOrm,
  reservationId: number,
  overrides: EntityData<ReservationEndpoints> = {},
): Promise<ReservationEndpointRow> {
  return createRow(orm, ReservationEndpoints, {
    reservation: reservationId,
    role: 'from',
    sequence: 0,
    name: 'Paris Charles de Gaulle',
    code: 'CDG',
    lat: 49.0097,
    lng: 2.5479,
    ...overrides,
  });
}

/** Puts the user on the booking's traveller list. */
export function addReservationTraveler(
  orm: FactoryOrm,
  reservationId: number,
  userId: number,
): Promise<EntityDTO<ReservationTravelers>> {
  return createRow(orm, ReservationTravelers, { reservation: reservationId, user: userId });
}
