import { Injectable } from '@nestjs/common';
import { logDebug, logError, logInfo } from '../../audit/audit-log.logger';
import { decrypt_api_key } from '../../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../../database/database.service';
import { checkSsrf, createPinnedDispatcher } from '../../../utils/ssrfGuard';
import type { NotifEventType } from '../notification-events';

export interface NtfyConfig {
  server: string | null;
  topic: string | null;
  token: string | null;
}

/** Priority and tags mapped to each notification event type. */
const NTFY_EVENT_META: Partial<Record<NotifEventType, { priority: 1 | 2 | 3 | 4 | 5; tags: string[] }>> = {
  trip_invite: { priority: 4, tags: ['loudspeaker'] },
  booking_change: { priority: 3, tags: ['calendar'] },
  trip_reminder: { priority: 4, tags: ['bell', 'alarm_clock'] },
  vacay_invite: { priority: 4, tags: ['palm_tree'] },
  todo_due: { priority: 4, tags: ['ballot_box_with_check'] },
  vacay_share: { priority: 3, tags: ['palm_tree'] },
  collection_invite: { priority: 3, tags: ['bookmark'] },
  photos_shared: { priority: 3, tags: ['camera'] },
  collab_message: { priority: 3, tags: ['speech_balloon'] },
  packing_tagged: { priority: 3, tags: ['luggage'] },
  version_available: { priority: 4, tags: ['package'] },
  replica_failure: { priority: 5, tags: ['warning', 'floppy_disk'] },
  synology_session_cleared: { priority: 3, tags: ['warning'] },
};
const NTFY_DEFAULT_META = { priority: 3 as const, tags: [] as string[] };

/**
 * Resolve the ntfy POST URL for a per-user send. The topic must come from the
 * user's own config — the admin topic is reserved for admin-scoped sends
 * (see resolveAdminNtfyUrl). Only the server falls back to the admin default.
 * Returns null if the user has no topic.
 */
export function resolveNtfyUrl(adminCfg: NtfyConfig, userCfg: NtfyConfig | null): string | null {
  const topic = userCfg?.topic;
  if (!topic) return null;
  // The lookbehind pins the strip to the start of the trailing run. Without it a
  // configured server of nothing but slashes retries from every one of them.
  const base = (userCfg?.server || adminCfg.server || 'https://ntfy.sh').replace(/(?<!\/)\/+$/, '');
  return `${base}/${encodeURIComponent(topic)}`;
}

/** Resolve the ntfy POST URL for admin-scoped sends. Returns null if no admin topic. */
export function resolveAdminNtfyUrl(adminCfg: NtfyConfig): string | null {
  if (!adminCfg.topic) return null;
  const base = (adminCfg.server || 'https://ntfy.sh').replace(/(?<!\/)\/+$/, '');
  return `${base}/${encodeURIComponent(adminCfg.topic)}`;
}

function encodeHeaderValue(value: string): string {
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    // Control characters go through the same RFC 2047 wrapper as non-ASCII: a
    // trip title with a stray newline in it would otherwise be rejected by
    // undici as an invalid header value and drop the notification silently.
    if (code > 0x7f || code < 0x20 || code === 0x7f) {
      return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
    }
  }
  return value;
}

/** ntfy push: the per-user and admin topic config, and the header-based POST. */
@Injectable()
export class NtfyService {
  constructor(private readonly db: DatabaseService) {}

  private getAppSetting(key: string): string | null {
    return this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value || null;
  }

  getUserNtfyConfig(userId: number): NtfyConfig | null {
    const rows = this.db.all<{ key: string; value: string }>(
      "SELECT key, value FROM settings WHERE user_id = ? AND key IN ('ntfy_topic', 'ntfy_server', 'ntfy_token')",
      userId,
    );
    if (rows.length === 0) return null;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      topic: map['ntfy_topic'] || null,
      server: map['ntfy_server'] || null,
      token: map['ntfy_token'] ? decrypt_api_key(map['ntfy_token']) : null,
    };
  }

  getAdminNtfyConfig(): NtfyConfig {
    const topic = this.getAppSetting('admin_ntfy_topic') || null;
    const server = this.getAppSetting('admin_ntfy_server') || null;
    const rawToken = this.getAppSetting('admin_ntfy_token') || null;
    return {
      topic,
      server,
      token: rawToken ? decrypt_api_key(rawToken) : null,
    };
  }

  async sendNtfy(
    url: string,
    token: string | null,
    payload: { event: string; title: string; body: string; link?: string },
  ): Promise<boolean> {
    if (!url) return false;

    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) {
      logError(`Ntfy blocked by SSRF guard event=${payload.event} url=${url} reason=${ssrf.error}`);
      return false;
    }

    const meta = NTFY_EVENT_META[payload.event as NotifEventType] ?? NTFY_DEFAULT_META;

    // ntfy header-based API: POST to topic URL, body = plain text message, metadata in headers
    const headers: Record<string, string> = {
      Title: encodeHeaderValue(payload.title),
      Priority: String(meta.priority),
    };
    if (meta.tags.length > 0) headers['Tags'] = meta.tags.join(',');
    if (payload.link) headers['Click'] = encodeHeaderValue(payload.link);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: payload.body,
        signal: AbortSignal.timeout(10000),
        dispatcher: createPinnedDispatcher(ssrf.resolvedIp!),
      } as RequestInit);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        logError(`Ntfy HTTP ${res.status}: ${errBody}`);
        return false;
      }

      logInfo(`Ntfy sent event=${payload.event}`);
      logDebug(`Ntfy url=${url} priority=${meta.priority} tags=${meta.tags.join(',')}`);
      return true;
    } catch (err) {
      logError(`Ntfy failed event=${payload.event}: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  async testNtfy(cfg: {
    topic: string;
    server?: string | null;
    token?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const adminCfg = this.getAdminNtfyConfig();
    const url = resolveNtfyUrl(adminCfg, { topic: cfg.topic, server: cfg.server ?? null, token: cfg.token ?? null });
    if (!url) return { success: false, error: 'Could not resolve ntfy URL — missing topic' };
    try {
      const sent = await this.sendNtfy(url, cfg.token ?? null, {
        event: 'test',
        title: 'Test Notification',
        body: 'This is a test notification from TREK. If you received this, your ntfy configuration is working correctly.',
      });
      return sent ? { success: true } : { success: false, error: 'Failed to send ntfy notification' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
}
