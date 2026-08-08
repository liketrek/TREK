import { Injectable } from '@nestjs/common';
import { logDebug, logError, logInfo } from '../../audit/audit-log.logger';
import { decrypt_api_key } from '../../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../../database/database.service';
import { checkSsrf, createPinnedDispatcher } from '../../../utils/ssrfGuard';

/**
 * Renders the outgoing body. Discord and Slack get their native shapes; anything
 * else gets the raw payload. Pure, so the shape can be asserted without a send.
 */
export function buildWebhookBody(
  url: string,
  payload: { event: string; title: string; body: string; tripName?: string; link?: string },
): string {
  const isDiscord = /discord(?:app)?\.com\/api\/webhooks\//.test(url);
  const isSlack = /hooks\.slack\.com\//.test(url);

  if (isDiscord) {
    return JSON.stringify({
      embeds: [
        {
          title: `📍 ${payload.title}`,
          description: payload.body,
          url: payload.link,
          color: 0x3b82f6,
          footer: { text: payload.tripName ? `Trip: ${payload.tripName}` : 'TREK' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  if (isSlack) {
    const trip = payload.tripName ? `  •  _${payload.tripName}_` : '';
    const link = payload.link ? `\n<${payload.link}|Open in TREK>` : '';
    return JSON.stringify({
      text: `*${payload.title}*\n${payload.body}${trip}${link}`,
    });
  }

  return JSON.stringify({ ...payload, timestamp: new Date().toISOString(), source: 'TREK' });
}

/** Outgoing webhooks: the per-user and the admin-global URL, and the POST itself. */
@Injectable()
export class WebhookService {
  constructor(private readonly db: DatabaseService) {}

  getUserWebhookUrl(userId: number): string | null {
    const value = this.db.get<{ value: string }>(
      "SELECT value FROM settings WHERE user_id = ? AND key = 'webhook_url'", userId,
    )?.value || null;
    return value ? decrypt_api_key(value) : null;
  }

  getAdminWebhookUrl(): string | null {
    const value = this.db.get<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?', 'admin_webhook_url',
    )?.value || null;
    return value ? decrypt_api_key(value) : null;
  }

  async sendWebhook(
    url: string,
    payload: { event: string; title: string; body: string; tripName?: string; link?: string },
  ): Promise<boolean> {
    if (!url) return false;

    const ssrf = await checkSsrf(url);
    if (!ssrf.allowed) {
      logError(`Webhook blocked by SSRF guard event=${payload.event} url=${url} reason=${ssrf.error}`);
      return false;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildWebhookBody(url, payload),
        signal: AbortSignal.timeout(10000),
        dispatcher: createPinnedDispatcher(ssrf.resolvedIp!),
      } as RequestInit);

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        logError(`Webhook HTTP ${res.status}: ${errBody}`);
        return false;
      }

      logInfo(`Webhook sent event=${payload.event} trip=${payload.tripName || '-'}`);
      logDebug(`Webhook url=${url} payload=${buildWebhookBody(url, payload).substring(0, 500)}`);
      return true;
    } catch (err) {
      logError(`Webhook failed event=${payload.event}: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  async testWebhook(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sent = await this.sendWebhook(url, {
        event: 'test',
        title: 'Test Notification',
        body: 'This is a test webhook from TREK. If you received this, your webhook configuration is working correctly.',
      });
      return sent ? { success: true } : { success: false, error: 'Failed to send webhook' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
}
