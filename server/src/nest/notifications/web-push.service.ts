import { readEnv } from '../../app-config';
import { safeFetchFollow } from '../../utils/ssrfGuard';
import { logError } from '../audit/audit-log.logger';
import { AuditService } from '../audit/audit.service';
import { decrypt_api_key, encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../database/database.service';
import type { ChannelMessage, NotifEventType } from './notification-events';
import { Injectable } from '@nestjs/common';
import {
  webPushSubscriptionSchema,
  type WebPushCurrentRequest,
  type WebPushDevice,
  type WebPushSubscription,
} from '@trek/shared';

import crypto from 'node:crypto';
import webpush from 'web-push';

export const MAX_WEB_PUSH_DEVICES = 10;
const PUBLIC_KEY_SETTING = 'web_push_vapid_public_key';
const PRIVATE_KEY_SETTING = 'web_push_vapid_private_key';

type SubscriptionStatus = 'active' | 'revoked' | 'invalid' | 'origin_mismatch';
interface SubscriptionRow {
  id: number;
  user_id: number;
  installation_id: string;
  endpoint_hash: string;
  subscription_encrypted: string;
  origin: string;
  vapid_key_fingerprint: string;
  label: string;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
  last_success_at: string | null;
}
interface VapidConfig {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}

export class WebPushServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'WebPushServiceError';
  }
}

const toIso = (value: string): string => (value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`);
const endpointHash = (endpoint: string): string => crypto.createHash('sha256').update(endpoint).digest('hex');
const fingerprint = (publicKey: string): string => crypto.createHash('sha256').update(publicKey).digest('hex');

@Injectable()
export class WebPushService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  private getSetting(key: string): string | null {
    return this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value ?? null;
  }

  private putSetting(key: string, value: string): void {
    this.db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', key, value);
  }

  private validateVapid(config: VapidConfig, subject: string): VapidConfig {
    try {
      webpush.setVapidDetails(subject, config.publicKey, config.privateKey);
      return config;
    } catch (error) {
      throw new WebPushServiceError(
        error instanceof Error ? error.message : 'Invalid VAPID configuration',
        503,
        'VAPID_CONFIG_INVALID',
      );
    }
  }

  private loadVapid(subject: string): VapidConfig {
    const app = readEnv().app;
    const envPublic = app.webPushVapidPublicKey?.trim();
    const envPrivate = app.webPushVapidPrivateKey?.trim();
    if (!!envPublic !== !!envPrivate) {
      throw new WebPushServiceError(
        'WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY must be configured together',
        503,
        'VAPID_CONFIG_INVALID',
      );
    }
    if (envPublic && envPrivate) {
      const config = this.validateVapid(
        { publicKey: envPublic, privateKey: envPrivate, fingerprint: fingerprint(envPublic) },
        subject,
      );
      if (this.getSetting(PUBLIC_KEY_SETTING) !== envPublic) this.putSetting(PUBLIC_KEY_SETTING, envPublic);
      if (decrypt_api_key(this.getSetting(PRIVATE_KEY_SETTING)) !== envPrivate) {
        this.putSetting(PRIVATE_KEY_SETTING, encrypt_api_key(envPrivate));
      }
      return config;
    }
    const storedPublic = this.getSetting(PUBLIC_KEY_SETTING);
    const storedPrivate = decrypt_api_key(this.getSetting(PRIVATE_KEY_SETTING));
    if (storedPublic && storedPrivate) {
      return this.validateVapid(
        { publicKey: storedPublic, privateKey: storedPrivate, fingerprint: fingerprint(storedPublic) },
        subject,
      );
    }
    const generated = webpush.generateVAPIDKeys();
    const config = this.validateVapid(
      {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey,
        fingerprint: fingerprint(generated.publicKey),
      },
      subject,
    );
    this.putSetting(PUBLIC_KEY_SETTING, generated.publicKey);
    this.putSetting(PRIVATE_KEY_SETTING, encrypt_api_key(generated.privateKey));
    return config;
  }

  canonicalOrigin(): string {
    const configured = readEnv().app.appUrl?.trim();
    if (!configured)
      throw new WebPushServiceError('APP_URL is required for Web Push', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new WebPushServiceError('APP_URL must be a valid URL', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
    }
    const localhost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(readEnv().app.isProduction === false && localhost)) {
      throw new WebPushServiceError('APP_URL must use HTTPS for Web Push', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
    }
    return url.origin;
  }

  isAdminEnabled(): boolean {
    const raw = this.getSetting('notification_channels') || this.getSetting('notification_channel') || 'none';
    return (
      raw !== 'none' &&
      raw
        .split(',')
        .map((item) => item.trim())
        .includes('webpush')
    );
  }

  private context(): { origin: string; vapid: VapidConfig } {
    const origin = this.canonicalOrigin();
    const defaultSubject = origin.startsWith('https:') ? origin : 'mailto:admin@localhost';
    return {
      origin,
      vapid: this.loadVapid(readEnv().app.webPushVapidSubject?.trim() || defaultSubject),
    };
  }

  config(): {
    enabled: boolean;
    available: boolean;
    publicKey?: string;
    canonicalOrigin?: string;
    maxDevices: number;
    error?: string;
  } {
    const enabled = this.isAdminEnabled();
    try {
      const { origin, vapid } = this.context();
      return {
        enabled,
        available: true,
        publicKey: vapid.publicKey,
        canonicalOrigin: origin,
        maxDevices: MAX_WEB_PUSH_DEVICES,
      };
    } catch (error) {
      return {
        enabled,
        available: false,
        maxDevices: MAX_WEB_PUSH_DEVICES,
        error: error instanceof Error ? error.message : 'Web Push is unavailable',
      };
    }
  }

  private device(row: SubscriptionRow): WebPushDevice {
    return {
      id: row.id,
      installationId: row.installation_id,
      label: row.label,
      createdAt: toIso(row.created_at),
      lastSeenAt: toIso(row.last_seen_at),
      lastSuccessAt: row.last_success_at ? toIso(row.last_success_at) : null,
    };
  }

  listDevices(userId: number): WebPushDevice[] {
    const { origin, vapid } = this.context();
    this.db.run(
      `UPDATE web_push_subscriptions SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND status = 'active' AND origin <> ?`,
      userId,
      origin,
    );
    return this.db
      .all<SubscriptionRow>(
        `SELECT * FROM web_push_subscriptions
       WHERE user_id = ? AND status = 'active' AND origin = ? AND vapid_key_fingerprint = ?
       ORDER BY updated_at DESC, id DESC`,
        userId,
        origin,
        vapid.fingerprint,
      )
      .map((row) => this.device(row));
  }

  registerCurrent(
    userId: number,
    input: WebPushCurrentRequest,
  ): { state: 'active' | 'revoked'; device?: WebPushDevice } {
    if (!this.isAdminEnabled()) {
      throw new WebPushServiceError('Web Push is disabled by the administrator', 409, 'WEB_PUSH_DISABLED');
    }
    const { origin, vapid } = this.context();
    this.db.run(
      `UPDATE web_push_subscriptions SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND status = 'active' AND origin <> ?`,
      userId,
      origin,
    );
    const hash = endpointHash(input.subscription.endpoint);
    const encrypted = encrypt_api_key(JSON.stringify(input.subscription));
    return this.db.transaction(() => {
      const existing = this.db.get<SubscriptionRow>(
        'SELECT * FROM web_push_subscriptions WHERE user_id = ? AND installation_id = ?',
        userId,
        input.installationId,
      );
      if (input.intent === 'reconcile' && (!existing || existing.status !== 'active'))
        return { state: 'revoked' as const };
      if (!existing) {
        const activeCount =
          this.db.get<{ count: number }>(
            "SELECT COUNT(*) AS count FROM web_push_subscriptions WHERE user_id = ? AND status = 'active'",
            userId,
          )?.count ?? 0;
        if (activeCount >= MAX_WEB_PUSH_DEVICES) {
          throw new WebPushServiceError(
            `A TREK account may register at most ${MAX_WEB_PUSH_DEVICES} Web Push devices`,
            409,
            'WEB_PUSH_DEVICE_LIMIT',
          );
        }
      }
      const conflicting = this.db.get<{ id: number }>(
        'SELECT id FROM web_push_subscriptions WHERE endpoint_hash = ? AND NOT (user_id = ? AND installation_id = ?)',
        hash,
        userId,
        input.installationId,
      );
      if (conflicting) {
        this.db.run(
          `UPDATE web_push_subscriptions SET endpoint_hash = ?, status = 'revoked',
             revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          `revoked:${conflicting.id}:${hash}`,
          conflicting.id,
        );
      }
      if (existing) {
        this.db.run(
          `UPDATE web_push_subscriptions SET endpoint_hash = ?, subscription_encrypted = ?,
             origin = ?, vapid_key_fingerprint = ?, label = ?, status = 'active',
             revoked_at = NULL, last_error_at = NULL, last_seen_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          hash,
          encrypted,
          origin,
          vapid.fingerprint,
          input.label,
          existing.id,
        );
      } else {
        this.db.run(
          `INSERT INTO web_push_subscriptions (
             user_id, installation_id, endpoint_hash, subscription_encrypted,
             origin, vapid_key_fingerprint, label, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          userId,
          input.installationId,
          hash,
          encrypted,
          origin,
          vapid.fingerprint,
          input.label,
        );
      }
      const row = this.db.get<SubscriptionRow>(
        'SELECT * FROM web_push_subscriptions WHERE user_id = ? AND installation_id = ?',
        userId,
        input.installationId,
      )!;
      if (input.intent === 'enable') {
        this.audit.writeAudit({
          userId,
          action: 'web_push.device_enable',
          resource: String(row.id),
          details: { label: row.label },
        });
      }
      return { state: 'active' as const, device: this.device(row) };
    });
  }

  revokeDevice(userId: number, deviceId: number): boolean {
    const result = this.db.run(
      `UPDATE web_push_subscriptions SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status = 'active'`,
      deviceId,
      userId,
    );
    if (result.changes > 0)
      this.audit.writeAudit({ userId, action: 'web_push.device_revoke', resource: String(deviceId) });
    return result.changes > 0;
  }

  renameDevice(userId: number, deviceId: number, label: string): WebPushDevice | null {
    const result = this.db.run(
      `UPDATE web_push_subscriptions SET label = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      label.trim(),
      deviceId,
      userId,
    );
    if (result.changes === 0) return null;
    const row = this.db.get<SubscriptionRow>(
      'SELECT * FROM web_push_subscriptions WHERE id = ? AND user_id = ?',
      deviceId,
      userId,
    )!;
    this.audit.writeAudit({
      userId,
      action: 'web_push.device_rename',
      resource: String(deviceId),
      details: { label: row.label },
    });
    return this.device(row);
  }

  private activeRows(userId: number): { rows: SubscriptionRow[]; origin: string; vapid: VapidConfig } {
    const { origin, vapid } = this.context();
    this.db.run(
      `UPDATE web_push_subscriptions SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND status = 'active' AND origin <> ?`,
      userId,
      origin,
    );
    return {
      origin,
      vapid,
      rows: this.db.all<SubscriptionRow>(
        `SELECT * FROM web_push_subscriptions
         WHERE user_id = ? AND status = 'active' AND origin = ? AND vapid_key_fingerprint = ? ORDER BY id`,
        userId,
        origin,
        vapid.fingerprint,
      ),
    };
  }

  hasActiveSubscription(userId: number): boolean {
    try {
      return this.activeRows(userId).rows.length > 0;
    } catch {
      return false;
    }
  }

  private payload(userId: number, message: ChannelMessage): string {
    const unreadCount =
      this.db.get<{ count: number }>(
        'SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = ? AND is_read = 0',
        userId,
      )?.count ?? 0;
    const base = {
      v: 1,
      recipientUserId: userId,
      title: message.title.slice(0, 200),
      body: message.body.slice(0, 1200),
      path: message.navigateTarget?.startsWith('/') ? message.navigateTarget.slice(0, 1024) : '/',
      unreadCount: Math.max(0, Math.floor(unreadCount)),
    };
    let payload = JSON.stringify(base);
    while (Buffer.byteLength(payload, 'utf8') > 3072 && base.body.length > 1) {
      base.body = `${base.body.slice(0, Math.max(1, base.body.length - 64)).replace(/\s+$/u, '')}…`;
      payload = JSON.stringify(base);
    }
    return payload;
  }

  private urgency(event: NotifEventType): 'normal' | 'high' {
    return ['trip_invite', 'booking_change', 'trip_reminder', 'todo_due', 'vacay_invite', 'collection_invite'].includes(
      event,
    )
      ? 'high'
      : 'normal';
  }

  private async sendOne(
    row: SubscriptionRow,
    userId: number,
    message: ChannelMessage,
    vapid: VapidConfig,
    origin: string,
  ): Promise<'sent' | 'invalid' | 'failed'> {
    let subscription: WebPushSubscription;
    try {
      subscription = webPushSubscriptionSchema.parse(JSON.parse(decrypt_api_key(row.subscription_encrypted) ?? 'null'));
    } catch {
      this.db.run(
        `UPDATE web_push_subscriptions SET status = 'invalid', last_error_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        row.id,
      );
      return 'invalid';
    }
    try {
      const request = webpush.generateRequestDetails(subscription, this.payload(userId, message), {
        TTL: 24 * 60 * 60,
        urgency: this.urgency(message.event),
        contentEncoding: 'aes128gcm',
        vapidDetails: {
          subject: readEnv().app.webPushVapidSubject?.trim() || origin,
          publicKey: vapid.publicKey,
          privateKey: vapid.privateKey,
        },
      });
      const response = await safeFetchFollow(
        request.endpoint,
        {
          method: request.method,
          headers: request.headers,
          body: request.body as never,
          signal: AbortSignal.timeout(10_000),
        },
        { maxRedirects: 0, bypassInternalIpAllowed: true },
      );
      void response.body?.cancel().catch(() => {});
      if (response.status >= 200 && response.status < 300) {
        this.db.run(
          `UPDATE web_push_subscriptions SET last_success_at = CURRENT_TIMESTAMP,
             last_error_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          row.id,
        );
        return 'sent';
      }
      if (response.status === 404 || response.status === 410) {
        this.db.run(
          `UPDATE web_push_subscriptions SET status = 'invalid', last_error_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          row.id,
        );
        return 'invalid';
      }
      this.db.run(
        `UPDATE web_push_subscriptions SET last_error_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        row.id,
      );
      logError(`Web Push delivery failed device=${row.id} status=${response.status}`);
      return 'failed';
    } catch (error) {
      this.db.run(
        `UPDATE web_push_subscriptions SET last_error_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        row.id,
      );
      logError(
        `Web Push delivery failed device=${row.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return 'failed';
    }
  }

  async sendToUser(
    userId: number,
    message: ChannelMessage,
  ): Promise<{ sent: number; failed: number; invalid: number }> {
    if (!this.isAdminEnabled()) return { sent: 0, failed: 0, invalid: 0 };
    const { rows, origin, vapid } = this.activeRows(userId);
    const results = await Promise.all(rows.map((row) => this.sendOne(row, userId, message, vapid, origin)));
    return {
      sent: results.filter((result) => result === 'sent').length,
      failed: results.filter((result) => result === 'failed').length,
      invalid: results.filter((result) => result === 'invalid').length,
    };
  }

  async testDevice(userId: number, deviceId: number): Promise<{ success: boolean; error?: string }> {
    if (!this.isAdminEnabled()) return { success: false, error: 'Web Push is disabled by the administrator' };
    const { rows, origin, vapid } = this.activeRows(userId);
    const row = rows.find((candidate) => candidate.id === deviceId);
    if (!row) return { success: false, error: 'Not found' };
    const result = await this.sendOne(
      row,
      userId,
      {
        event: 'plugin_notification',
        title: 'TREK Web Push test',
        body: 'This device is ready to receive TREK notifications.',
        navigateTarget: '/settings',
      },
      vapid,
      origin,
    );
    this.audit.writeAudit({
      userId,
      action: 'web_push.device_test',
      resource: String(deviceId),
      details: { success: result === 'sent' },
    });
    return result === 'sent' ? { success: true } : { success: false, error: 'Web Push test failed' };
  }
}
