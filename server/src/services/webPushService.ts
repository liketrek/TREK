import { db } from '../db/database';
import { safeFetchFollow } from '../utils/ssrfGuard';
import { decrypt_api_key, encrypt_api_key } from './apiKeyCrypto';
import { logError, writeAudit } from './auditLog';
import type { NotifEventType } from './notificationPreferencesService';
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

export interface WebPushMessage {
  event: NotifEventType;
  title: string;
  body: string;
  navigateTarget?: string;
  unreadCount?: number;
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

function getSetting(key: string): string | null {
  return (
    (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value ??
    null
  );
}

function putSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

function fingerprint(publicKey: string): string {
  return crypto.createHash('sha256').update(publicKey).digest('hex');
}

function validateVapidConfig(config: VapidConfig, subject: string): VapidConfig {
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

function loadVapidConfig(subject: string): VapidConfig {
  const envPublic = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const envPrivate = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  if (!!envPublic !== !!envPrivate) {
    throw new WebPushServiceError(
      'WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY must be configured together',
      503,
      'VAPID_CONFIG_INVALID',
    );
  }

  if (envPublic && envPrivate) {
    const config = validateVapidConfig(
      { publicKey: envPublic, privateKey: envPrivate, fingerprint: fingerprint(envPublic) },
      subject,
    );
    if (getSetting(PUBLIC_KEY_SETTING) !== envPublic) putSetting(PUBLIC_KEY_SETTING, envPublic);
    if (decrypt_api_key(getSetting(PRIVATE_KEY_SETTING)) !== envPrivate) {
      putSetting(PRIVATE_KEY_SETTING, encrypt_api_key(envPrivate));
    }
    return config;
  }

  const storedPublic = getSetting(PUBLIC_KEY_SETTING);
  const storedPrivate = decrypt_api_key(getSetting(PRIVATE_KEY_SETTING));
  if (storedPublic && storedPrivate) {
    return validateVapidConfig(
      { publicKey: storedPublic, privateKey: storedPrivate, fingerprint: fingerprint(storedPublic) },
      subject,
    );
  }

  const generated = webpush.generateVAPIDKeys();
  const config = validateVapidConfig(
    {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      fingerprint: fingerprint(generated.publicKey),
    },
    subject,
  );
  putSetting(PUBLIC_KEY_SETTING, generated.publicKey);
  putSetting(PRIVATE_KEY_SETTING, encrypt_api_key(generated.privateKey));
  return config;
}

export function getCanonicalWebPushOrigin(): string {
  const configured = process.env.APP_URL?.trim();
  if (!configured) {
    throw new WebPushServiceError('APP_URL is required for Web Push', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
  }
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new WebPushServiceError('APP_URL must be a valid URL', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
  }
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && isLocalhost)) {
    throw new WebPushServiceError('APP_URL must use HTTPS for Web Push', 503, 'WEB_PUSH_ORIGIN_UNAVAILABLE');
  }
  return url.origin;
}

export function isWebPushAdminEnabled(): boolean {
  const raw = getSetting('notification_channels') || getSetting('notification_channel') || 'none';
  return (
    raw !== 'none' &&
    raw
      .split(',')
      .map((item) => item.trim())
      .includes('webpush')
  );
}

function endpointHash(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

function toIso(value: string): string {
  if (value.endsWith('Z')) return value;
  return `${value.replace(' ', 'T')}Z`;
}

function deviceFromRow(row: SubscriptionRow): WebPushDevice {
  return {
    id: row.id,
    installationId: row.installation_id,
    label: row.label,
    createdAt: toIso(row.created_at),
    lastSeenAt: toIso(row.last_seen_at),
    lastSuccessAt: row.last_success_at ? toIso(row.last_success_at) : null,
  };
}

function activeContext(): { origin: string; vapid: VapidConfig } {
  const origin = getCanonicalWebPushOrigin();
  const defaultSubject = origin.startsWith('https:') ? origin : 'mailto:admin@localhost';
  const vapid = loadVapidConfig(process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || defaultSubject);
  return { origin, vapid };
}

export function getWebPushConfig(): {
  enabled: boolean;
  available: boolean;
  publicKey?: string;
  canonicalOrigin?: string;
  maxDevices: number;
  error?: string;
} {
  const enabled = isWebPushAdminEnabled();
  try {
    const { origin, vapid } = activeContext();
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

export function listWebPushDevices(userId: number): WebPushDevice[] {
  const { origin, vapid } = activeContext();
  db.prepare(
    `
    UPDATE web_push_subscriptions
    SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND status = 'active' AND origin <> ?
  `,
  ).run(userId, origin);
  const rows = db
    .prepare(
      `
    SELECT * FROM web_push_subscriptions
    WHERE user_id = ? AND status = 'active' AND origin = ? AND vapid_key_fingerprint = ?
    ORDER BY updated_at DESC, id DESC
  `,
    )
    .all(userId, origin, vapid.fingerprint) as SubscriptionRow[];
  return rows.map(deviceFromRow);
}

export function registerWebPushCurrent(
  userId: number,
  input: WebPushCurrentRequest,
): { state: 'active' | 'revoked'; device?: WebPushDevice } {
  if (!isWebPushAdminEnabled()) {
    throw new WebPushServiceError('Web Push is disabled by the administrator', 409, 'WEB_PUSH_DISABLED');
  }
  const { origin, vapid } = activeContext();
  db.prepare(`
    UPDATE web_push_subscriptions
    SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND status = 'active' AND origin <> ?
  `).run(userId, origin);
  const hash = endpointHash(input.subscription.endpoint);
  const encrypted = encrypt_api_key(JSON.stringify(input.subscription));

  return db.transaction(() => {
    const existing = db
      .prepare('SELECT * FROM web_push_subscriptions WHERE user_id = ? AND installation_id = ?')
      .get(userId, input.installationId) as SubscriptionRow | undefined;

    if (input.intent === 'reconcile' && (!existing || existing.status !== 'active')) {
      return { state: 'revoked' as const };
    }

    if (!existing) {
      const activeCount = (
        db
          .prepare("SELECT COUNT(*) AS count FROM web_push_subscriptions WHERE user_id = ? AND status = 'active'")
          .get(userId) as { count: number }
      ).count;
      if (activeCount >= MAX_WEB_PUSH_DEVICES) {
        throw new WebPushServiceError(
          `A TREK account may register at most ${MAX_WEB_PUSH_DEVICES} Web Push devices`,
          409,
          'WEB_PUSH_DEVICE_LIMIT',
        );
      }
    }

    const conflicting = db
      .prepare(
        'SELECT id FROM web_push_subscriptions WHERE endpoint_hash = ? AND NOT (user_id = ? AND installation_id = ?)',
      )
      .get(hash, userId, input.installationId) as { id: number } | undefined;
    if (conflicting) {
      db.prepare(
        `
        UPDATE web_push_subscriptions
        SET endpoint_hash = ?, status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(`revoked:${conflicting.id}:${hash}`, conflicting.id);
    }

    if (existing) {
      db.prepare(
        `
        UPDATE web_push_subscriptions
        SET endpoint_hash = ?, subscription_encrypted = ?, origin = ?, vapid_key_fingerprint = ?,
            label = ?, status = 'active', revoked_at = NULL, last_error_at = NULL,
            last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(hash, encrypted, origin, vapid.fingerprint, input.label, existing.id);
    } else {
      db.prepare(
        `
        INSERT INTO web_push_subscriptions (
          user_id, installation_id, endpoint_hash, subscription_encrypted,
          origin, vapid_key_fingerprint, label, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `,
      ).run(userId, input.installationId, hash, encrypted, origin, vapid.fingerprint, input.label);
    }

    const row = db
      .prepare('SELECT * FROM web_push_subscriptions WHERE user_id = ? AND installation_id = ?')
      .get(userId, input.installationId) as SubscriptionRow;
    if (input.intent === 'enable') {
      writeAudit({ userId, action: 'web_push.device_enable', resource: String(row.id), details: { label: row.label } });
    }
    return { state: 'active' as const, device: deviceFromRow(row) };
  })();
}

export function revokeWebPushDevice(userId: number, deviceId: number): boolean {
  const result = db
    .prepare(
      `
    UPDATE web_push_subscriptions
    SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND status = 'active'
  `,
    )
    .run(deviceId, userId);
  if (result.changes > 0) writeAudit({ userId, action: 'web_push.device_revoke', resource: String(deviceId) });
  return result.changes > 0;
}

export function renameWebPushDevice(userId: number, deviceId: number, label: string): WebPushDevice | null {
  const result = db
    .prepare(
      `
    UPDATE web_push_subscriptions
    SET label = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND status = 'active'
  `,
    )
    .run(label.trim(), deviceId, userId);
  if (result.changes === 0) return null;
  const row = db
    .prepare('SELECT * FROM web_push_subscriptions WHERE id = ? AND user_id = ?')
    .get(deviceId, userId) as SubscriptionRow;
  writeAudit({ userId, action: 'web_push.device_rename', resource: String(deviceId), details: { label: row.label } });
  return deviceFromRow(row);
}

export function hasActiveWebPushSubscription(userId: number): boolean {
  try {
    return activeSubscriptionRows(userId).rows.length > 0;
  } catch {
    return false;
  }
}

function activeSubscriptionRows(userId: number): { rows: SubscriptionRow[]; origin: string; vapid: VapidConfig } {
  const { origin, vapid } = activeContext();
  db.prepare(
    `
    UPDATE web_push_subscriptions
    SET status = 'origin_mismatch', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND status = 'active' AND origin <> ?
  `,
  ).run(userId, origin);
  const rows = db
    .prepare(
      `
    SELECT * FROM web_push_subscriptions
    WHERE user_id = ? AND status = 'active' AND origin = ? AND vapid_key_fingerprint = ?
    ORDER BY id
  `,
    )
    .all(userId, origin, vapid.fingerprint) as SubscriptionRow[];
  return { rows, origin, vapid };
}

function boundedPayload(userId: number, message: WebPushMessage): string {
  const base = {
    v: 1,
    recipientUserId: userId,
    title: message.title.slice(0, 200),
    body: message.body.slice(0, 1200),
    path: message.navigateTarget?.startsWith('/') ? message.navigateTarget.slice(0, 1024) : '/',
    unreadCount: Math.max(0, Math.floor(message.unreadCount ?? 0)),
  };
  let payload = JSON.stringify(base);
  while (Buffer.byteLength(payload, 'utf8') > 3072 && base.body.length > 1) {
    base.body = `${base.body.slice(0, Math.max(1, base.body.length - 64)).replace(/\s+$/u, '')}…`;
    payload = JSON.stringify(base);
  }
  return payload;
}

function urgencyFor(event: NotifEventType): 'normal' | 'high' {
  return ['trip_invite', 'booking_change', 'trip_reminder', 'todo_due', 'vacay_invite', 'collection_invite'].includes(
    event,
  )
    ? 'high'
    : 'normal';
}

async function sendToSubscription(
  row: SubscriptionRow,
  userId: number,
  message: WebPushMessage,
  vapid: VapidConfig,
  origin: string,
): Promise<'sent' | 'invalid' | 'failed'> {
  let subscription: WebPushSubscription;
  try {
    const decrypted = decrypt_api_key(row.subscription_encrypted);
    subscription = webPushSubscriptionSchema.parse(JSON.parse(decrypted ?? 'null'));
  } catch {
    db.prepare(
      `
      UPDATE web_push_subscriptions
      SET status = 'invalid', last_error_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(row.id);
    return 'invalid';
  }

  try {
    const request = webpush.generateRequestDetails(subscription, boundedPayload(userId, message), {
      TTL: 24 * 60 * 60,
      urgency: urgencyFor(message.event),
      contentEncoding: 'aes128gcm',
      vapidDetails: {
        subject: process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || origin,
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
      db.prepare(
        `
        UPDATE web_push_subscriptions
        SET last_success_at = CURRENT_TIMESTAMP, last_error_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(row.id);
      return 'sent';
    }
    if (response.status === 404 || response.status === 410) {
      db.prepare(
        `
        UPDATE web_push_subscriptions
        SET status = 'invalid', last_error_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(row.id);
      return 'invalid';
    }
    db.prepare(
      `
      UPDATE web_push_subscriptions
      SET last_error_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(row.id);
    logError(`Web Push delivery failed device=${row.id} status=${response.status}`);
    return 'failed';
  } catch (error) {
    db.prepare(
      `
      UPDATE web_push_subscriptions
      SET last_error_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    ).run(row.id);
    logError(`Web Push delivery failed device=${row.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
    return 'failed';
  }
}

export async function sendWebPushToUser(
  userId: number,
  message: WebPushMessage,
): Promise<{ sent: number; failed: number; invalid: number }> {
  if (!isWebPushAdminEnabled()) return { sent: 0, failed: 0, invalid: 0 };
  const { rows, origin, vapid } = activeSubscriptionRows(userId);
  const results = await Promise.all(rows.map((row) => sendToSubscription(row, userId, message, vapid, origin)));
  return {
    sent: results.filter((result) => result === 'sent').length,
    failed: results.filter((result) => result === 'failed').length,
    invalid: results.filter((result) => result === 'invalid').length,
  };
}

export async function testWebPushDevice(
  userId: number,
  deviceId: number,
): Promise<{ success: boolean; error?: string }> {
  if (!isWebPushAdminEnabled()) return { success: false, error: 'Web Push is disabled by the administrator' };
  const { rows, origin, vapid } = activeSubscriptionRows(userId);
  const row = rows.find((candidate) => candidate.id === deviceId);
  if (!row) return { success: false, error: 'Not found' };
  const result = await sendToSubscription(
    row,
    userId,
    {
      event: 'plugin_notification',
      title: 'TREK Web Push test',
      body: 'This device is ready to receive TREK notifications.',
      navigateTarget: '/settings',
      unreadCount: 0,
    },
    vapid,
    origin,
  );
  writeAudit({
    userId,
    action: 'web_push.device_test',
    resource: String(deviceId),
    details: { success: result === 'sent' },
  });
  return result === 'sent' ? { success: true } : { success: false, error: 'Web Push test failed' };
}
