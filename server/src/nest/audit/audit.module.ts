import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/** Cross-cutting audit domain (Wave 2). No controller/MCP surface of its own —
 *  the audit-log READ side stays with AdminModule (legacy adminService).
 *  Exports AuditService (writeAudit) for the in-container consumers; the pure
 *  helpers (getClientIp, log*) are plain imports from client-ip.ts /
 *  audit-log.logger.ts. Not @Global — e2e TestingModules resolve it
 *  transitively through each consumer's explicit import. Registered in
 *  AppModule. */
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
