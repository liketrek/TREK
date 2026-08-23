import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { logInfo, logDebug, logError } from './audit-log.logger';

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
  constructor(private readonly dbs: DatabaseService) {}

  private resolveUserEmail(userId: number | null): string {
    if (userId == null) return 'anonymous';
    try {
      const row = this.dbs.get<{ email: string }>('SELECT email FROM users WHERE id = ?', userId);
      return row?.email || `uid:${userId}`;
    } catch { return `uid:${userId}`; }
  }

  /** Best-effort; never throws — failures are logged only. */
  writeAudit(entry: {
    userId: number | null;
    action: string;
    resource?: string | null;
    details?: Record<string, unknown>;
    debugDetails?: Record<string, unknown>;
    ip?: string | null;
  }): void {
    try {
      const detailsJson = entry.details && Object.keys(entry.details).length > 0 ? JSON.stringify(entry.details) : null;
      this.dbs.run(
        `INSERT INTO audit_log (user_id, action, resource, details, ip) VALUES (?, ?, ?, ?, ?)`,
        entry.userId, entry.action, entry.resource ?? null, detailsJson, entry.ip ?? null
      );

      const email = this.resolveUserEmail(entry.userId);
      const label = ACTION_LABELS[entry.action] || entry.action;
      const brief = buildInfoSummary(entry.action, entry.details);
      logInfo(oneLine(`${email} ${label}${brief} ip=${entry.ip || '-'}`));

      if (entry.debugDetails && Object.keys(entry.debugDetails).length > 0) {
        logDebug(oneLine(`AUDIT ${entry.action} userId=${entry.userId} ${JSON.stringify(entry.debugDetails)}`));
      } else if (detailsJson) {
        logDebug(oneLine(`AUDIT ${entry.action} userId=${entry.userId} ${detailsJson}`));
      }
    } catch (e) {
      logError(`Audit write failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
