import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { AuditService } from './audit.service';

/**
 * Non-Nest entry point for the audit domain — for code running OUTSIDE the
 * Nest container (src/index.ts lazy-requires, src/mcp/index.ts and
 * oauthProvider.ts, and the legacy airtrail/immich/oauth services). Exports
 * the full legacy services/auditLog surface 1:1 so repointing a consumer is an
 * import-path-only diff (log*-only consumers import audit-log.logger
 * directly). Inside the container, inject AuditService instead. Delete this
 * file when the last legacy consumer migrates.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const audit = new AuditService(new DatabaseService(db));

export function writeAudit(entry: Parameters<AuditService['writeAudit']>[0]): void {
  return audit.writeAudit(entry);
}

export { getClientIp } from './client-ip';
// LOG_LEVEL has no external consumers today — re-exported purely for 1:1
// surface parity with the legacy module.
export { LOG_LEVEL, logInfo, logDebug, logError, logWarn } from './audit-log.logger';
