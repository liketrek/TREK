import { AuditLog } from '../../db/entities/AuditLog.entity';
import { Users } from '../../db/entities/Users.entity';
import type { AuditLogRepository } from '../../db/repositories/AuditLog.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { logInfo, logDebug, logError } from './audit-log.logger';
import { ValidationError } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

const ACTION_LABELS: Record<string, string> = {
  'user.register': 'registered',
  'user.login': 'logged in',
  'user.login_failed': 'login failed',
  'user.password_change': 'changed password',
  'user.account_delete': 'deleted account',
  'user.mfa_enable': 'enabled MFA',
  'user.mfa_disable': 'disabled MFA',
  'settings.app_update': 'updated settings',
  'settings.api_keys_update': 'updated API keys',
  'trip.create': 'created trip',
  'trip.delete': 'deleted trip',
  'admin.user_role_change': 'changed user role',
  'admin.user_delete': 'deleted user',
  'admin.plugin_retrust': "re-trusted a plugin's author signing key",
  'admin.invite_create': 'created invite',
  'admin.storage_update': 'updated storage configuration',
  'admin.storage_test': 'tested a storage backend',
  'admin.storage_backfill': 'started a storage sync',
  'admin.storage_backfill_cancel': 'cancelled a storage sync',
  'admin.storage_stats_refresh': 'refreshed storage usage stats',
  'immich.private_ip_configured': 'configured Immich with private IP',
  'oidc.role_change': 'role changed by OIDC claim mapping',
};

/**
 * Collapses line breaks so a trip title (free user text) cannot forge a second
 * log line. Scoped to the audit lines rather than the shared logger, which
 * still has to print multi-line stack traces as they are.
 */
const oneLine = (s: string): string => s.replace(/[\r\n\u2028\u2029]+/g, ' ');

function buildInfoSummary(action: string, details?: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return '';
  if (action === 'trip.create') return ` "${details.title}"`;
  if (action === 'trip.delete') return ` tripId=${details.tripId}`;
  if (action === 'user.register') return ` ${details.email}`;
  if (action === 'user.login') return '';
  if (action === 'user.login_failed') return ` reason=${details.reason}`;
  if (action === 'settings.app_update') {
    const parts: string[] = [];
    if (details.notification_channel) parts.push(`channel=${details.notification_channel}`);
    if (details.smtp_settings_updated) parts.push('smtp');
    if (details.notification_events_updated) parts.push('events');
    if (details.webhook_url_updated) parts.push('webhook_url');
    if (details.allowed_file_types_updated) parts.push('file_types');
    if (details.allow_registration !== undefined) parts.push(`registration=${details.allow_registration}`);
    if (details.require_mfa !== undefined) parts.push(`mfa=${details.require_mfa}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
  }
  if (action === 'settings.api_keys_update') {
    // The names, read straight out of details — the writer puts nothing else in
    // there, and a key value must never reach a log line.
    const changed = Array.isArray(details.changed) ? details.changed : [];
    return changed.length ? ` (${changed.join(', ')})` : '';
  }
  if (action === 'immich.private_ip_configured') {
    return details.resolved_ip ? ` url=${details.immich_url} ip=${details.resolved_ip}` : '';
  }
  return '';
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly auditLog: AuditLogRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  private async resolveUserEmail(userId: number | null): Promise<string> {
    if (userId == null) return 'anonymous';
    try {
      const email = await this.users.getEmail(userId);
      return email || `uid:${userId}`;
    } catch (e) {
      // RULING (task-6-fix-brief.md item 4): an audit write must never block
      // the request it is auditing, so this stays a swallow — the documented
      // exception to "fail closed on a MikroORM ValidationError" every other
      // domain in this plan follows. But a ValidationError here (typically
      // cannotUseGlobalContext) is a wiring bug, not an ordinary DB failure,
      // and folding it into the generic `uid:${userId}` fallback with no log
      // line would hide a future unwrapped entrypoint. Log it distinctly so
      // it is never confused with (or lost among) an actual missing user.
      if (e instanceof ValidationError) {
        logError(`Audit email lookup ran with no request context: ${e.message}`);
      }
      return `uid:${userId}`;
    }
  }

  /**
   * Best-effort; never throws — failures are logged only. RULING
   * (task-6-fix-brief.md item 4): this is the one documented exception to
   * "fail closed on a MikroORM ValidationError" — an audit row must never
   * become a 500 for the mutation it is recording. A ValidationError still
   * gets a message distinct from every other write failure (below), so an
   * unwrapped entrypoint stays visible in the log even though it never
   * throws.
   */
  async writeAudit(entry: {
    userId: number | null;
    action: string;
    resource?: string | null;
    details?: Record<string, unknown>;
    debugDetails?: Record<string, unknown>;
    ip?: string | null;
  }): Promise<void> {
    try {
      const detailsJson = entry.details && Object.keys(entry.details).length > 0 ? JSON.stringify(entry.details) : null;
      await this.auditLog.insertEntry({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource ?? null,
        details: detailsJson,
        ip: entry.ip ?? null,
      });

      const email = await this.resolveUserEmail(entry.userId);
      const label = ACTION_LABELS[entry.action] || entry.action;
      const brief = buildInfoSummary(entry.action, entry.details);
      logInfo(oneLine(`${email} ${label}${brief} ip=${entry.ip || '-'}`));

      if (entry.debugDetails && Object.keys(entry.debugDetails).length > 0) {
        logDebug(oneLine(`AUDIT ${entry.action} userId=${entry.userId} ${JSON.stringify(entry.debugDetails)}`));
      } else if (detailsJson) {
        logDebug(oneLine(`AUDIT ${entry.action} userId=${entry.userId} ${detailsJson}`));
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        logError(`Audit write ran with no request context (row not written): ${e.message}`);
      } else {
        logError(`Audit write failed: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}
