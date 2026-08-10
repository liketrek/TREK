import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { JourneyDomainService } from './journey-domain.service';

/**
 * Non-Nest entry point for the journey domain — for the four journey MCP
 * resources in src/mcp/resources.ts, which are registered at import time and
 * so cannot be injected. The journey *tools* no longer need it: they became
 * src/nest/journey/journey.mcp.ts. Inside the container, inject
 * JourneyDomainService or JourneyShareService instead. Delete this file when
 * resources.ts moves to @ResourceTemplate.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton, and neither service holds state.
 */
const dbs = new DatabaseService(db);
const journey = new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs));

export function canAccessJourney(...args: Parameters<JourneyDomainService['canAccessJourney']>) {
  return journey.canAccessJourney(...args);
}
export function getJourneyFull(...args: Parameters<JourneyDomainService['getJourneyFull']>) {
  return journey.getJourneyFull(...args);
}
export function listEntries(...args: Parameters<JourneyDomainService['listEntries']>) {
  return journey.listEntries(...args);
}
export function listJourneys(...args: Parameters<JourneyDomainService['listJourneys']>) {
  return journey.listJourneys(...args);
}
