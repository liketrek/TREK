import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AddonsService } from '../addons/addons.service';
import { AuditService } from '../audit/audit.service';
import { BudgetService } from '../budget/budget.service';
import { ExchangeRatesService } from '../budget/exchange-rates.service';
import { ReservationsService } from '../reservations/reservations.service';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { AirtrailSyncService } from './airtrail-sync.service';

/**
 * The ONE airtrail edge that cannot be an injection, and why.
 *
 * `AirtrailSyncService` needs `ReservationsService`: the pull applies remote
 * changes through the real reservation update path, endpoint restamping and all,
 * and reimplementing that against raw SQL would be strictly worse than the
 * coupling. So `AirtrailModule` imports `ReservationsModule`.
 *
 * The write-back trigger runs in the other direction — `reservations.controller`
 * fires it after a local edit — and injecting `AirtrailSyncService` there would
 * close `ReservationsModule -> AirtrailModule -> ReservationsModule`. A
 * `forwardRef` would compile and is exactly the shape this migration has been
 * removing, so it stays a seam instead, documented rather than accidental.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton, the same pattern the other bridges use.
 */
const dbs = () => new DatabaseService(db);
const realtime = new RealtimeService();
const permissions = new PermissionsService(dbs());
const client = new AirtrailClient();
const airtrail = new AirtrailService(dbs(), new AuditService(dbs()), client);
const reservations = new ReservationsService(
  dbs(),
  permissions,
  new BudgetService(dbs(), permissions, new ExchangeRatesService(), realtime),
  realtime,
);
const sync = new AirtrailSyncService(
  dbs(),
  realtime,
  new AddonsService(dbs()),
  reservations,
  client,
  airtrail,
);

/** Fire-and-forget write-back after a local edit to a linked flight (#1240). */
export function pushReservationToAirtrail(reservationId: number, tripId: number): Promise<void> {
  return sync.pushReservationToAirtrail(reservationId, tripId);
}
