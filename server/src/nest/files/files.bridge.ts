import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { FilesService } from './files.service';
import { PermissionsService } from '../permissions/permissions.service';
import { EphemeralTokenService } from '../auth/ephemeral-token.service';

/**
 * Non-Nest entry point for the files domain. Unlike todo.bridge.ts this does
 * NOT serve a legacy MCP registrar (files has no MCP surface) — it exists only
 * because multer interceptor options are module-scope object literals (the
 * UPLOAD configs in files.controller.ts and journey.controller.ts are built
 * before any DI container exists), yet their fileFilter closures need the
 * request-time app_settings read. Everything else injects FilesService.
 * Delete this file if uploads ever move to MulterModule.registerAsync.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const files = new FilesService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new RealtimeService(), new EphemeralTokenService());

export function getAllowedExtensions(): string {
  return files.getAllowedExtensions();
}
