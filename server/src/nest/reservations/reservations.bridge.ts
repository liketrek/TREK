import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService } from './reservations.service';
import { PermissionsService } from '../permissions/permissions.service';
import { BudgetService } from '../budget/budget.service';
import { ExchangeRatesService } from '../budget/exchange-rates.service';

export type { EndpointInput, ReservationEndpoint, ReservationTraveler } from './reservations.service';

/**
 * Non-Nest entry point for the reservations domain — for code running OUTSIDE
 * the Nest container (the legacy tripService, the airtrail import/sync
 * services, and the still-legacy transports MCP registrar; the reservation
 * MCP tools and resource moved to the DI-discovered reservations.mcp.ts, the
 * transit tools to the DI-discovered transit.mcp.ts (which injects
 * ReservationsService), and the plugin RPC host injects ReservationsService
 * via ReservationsRpc). Exports only the legacy services/reservationService
 * names still consumed outside the container, 1:1, so repointing a consumer is
 * an import-path-only diff. Inside the container, inject ReservationsService
 * instead. Delete exports here as their consumers migrate.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const reservations = new ReservationsService(
  new DatabaseService(db),
  new PermissionsService(new DatabaseService(db)),
  new BudgetService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new ExchangeRatesService(), new RealtimeService()),
  new RealtimeService(),
);

export function listReservations(tripId: string | number) {
  return reservations.list(tripId);
}

export function loadEndpointsByTrip(tripId: string | number) {
  return reservations.loadEndpointsByTrip(tripId);
}

export function resyncReservationDays(tripId: string | number): void {
  reservations.resyncReservationDays(tripId);
}

export function createReservation(tripId: string | number, data: Parameters<ReservationsService['create']>[1]) {
  return reservations.create(tripId, data);
}

export function getReservation(id: string | number, tripId: string | number) {
  return reservations.getReservation(id, tripId);
}

export function getReservationWithJoins(id: string | number) {
  return reservations.getReservationWithJoins(id);
}

export function updateReservation(
  id: string | number,
  tripId: string | number,
  data: Parameters<ReservationsService['update']>[2],
  current: Parameters<ReservationsService['update']>[3]
) {
  return reservations.update(id, tripId, data, current);
}

export function deleteReservation(id: string | number, tripId: string | number) {
  return reservations.remove(id, tripId);
}

export function notifyBookingChange(tripId: string | number, actorId: number, booking: string, type: string): void {
  reservations.notifyBookingChange(tripId, actorId, booking, type);
}
