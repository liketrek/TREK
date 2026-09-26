import { Injectable } from '@nestjs/common';
import type { ChannelTestResult, PushPayload } from '@trek/shared';
import { decodeBase64Url } from '../../../app-config';
import { discardBody, readCappedText } from '../../../utils/cappedFetch';
import { safeFetchFollow, SsrfBlockedError } from '../../../utils/ssrfGuard';
import { logError, logInfo } from '../../audit/audit-log.logger';
import type { ChannelMessage } from '../notification-events';
import { isPushServiceEndpoint } from '../push/push-subscription.helpers';
import { PushSubscriptionsService, type PushSubscriptionRow } from '../push/push-subscriptions.service';
import { PUSH_UNAVAILABLE_ERROR, VapidKeysService } from '../push/vapid-keys.service';
import { createVapidSigner, encryptPushMessage, type VapidSigner } from '../push/web-push-crypto';

/**
 * Ceiling for the JSON the service worker receives. A single aes128gcm record
 * can carry just under 4 KB and some push services refuse anything larger, so
 * the payload stays well clear of that and the body gives way first.
 */
export const MAX_PUSH_PAYLOAD_BYTES = 3000;

const TITLE_MAX_CHARS = 120;
/** A navigate target is an app path like /trips/12; anything longer is not one. */
const URL_MAX_LENGTH = 256;
const ELLIPSIS = '…';

const PUSH_TIMEOUT_MS = 10_000;
/** A day: a reminder that reaches a phone after a longer flight is still worth showing, a week-old one is not. */
const PUSH_TTL_SECONDS = 24 * 60 * 60;
const ERROR_BODY_MAX_BYTES = 1024;

/**
 * How many failed sends in a row (with no success between them) a device gets
 * before a 403 removes it. A 403 is not proof the subscription is dead: Apple
 * also answers it for a token it rejects (BadJwtToken, a bad subject, clock
 * skew), which is the server's problem and must not cost the user their device
 * on the first try.
 */
export const FORBIDDEN_FAILURES_BEFORE_REMOVAL = 3;

/**
 * The one event whose notifications replace each other: a burst of chat
 * messages in one trip shows as one notification that keeps updating. Every
 * other event stands on its own, so two todos, two bookings or two plugin
 * notices never hide one another.
 */
const COLLAPSING_EVENT = 'collab_message';

type Urgency = 'normal' | 'high';
/** The events that are about a date, where arriving late defeats the point (RFC 8030 section 5.3). */
const HIGH_URGENCY_EVENTS: ReadonlySet<string> = new Set(['trip_reminder', 'todo_due']);

/** No tag either: two presses of Send test are two notifications, like two of anything but chat. */
const TEST_PAYLOAD: PushPayload = {
  title: 'Test Notification',
  body: 'This is a test notification from TREK. If you received this, push notifications are working on this device.',
  url: '/settings?tab=notifications',
};

/**
 * The target the worker may open: a path on this origin only. Absolute URLs
 * and protocol-relative ones (`//host`, `/\host`) would take the click to
 * another site, so they are dropped rather than passed on.
 */
export function samePagePath(target: string | undefined): string | undefined {
  if (!target || target.length > URL_MAX_LENGTH) return undefined;
  if (!/^\/(?![/\\])[\x21-\x7e]*$/.test(target)) return undefined;
  return target;
}

function truncateChars(value: string, max: number): string {
  const chars = Array.from(value);
  return chars.length <= max ? value : `${chars.slice(0, max - 1).join('')}${ELLIPSIS}`;
}

function payloadBytes(payload: PushPayload): number {
  return Buffer.byteLength(JSON.stringify(payload), 'utf8');
}

/**
 * The rendered notification as the service worker gets it. Title and body are
 * already in the recipient's language; the worker has no translations. Only
 * chat messages carry a tag, `collab_message:<trip path>`, so a burst of them in
 * one trip shows as one notification that keeps updating instead of a pile of
 * them. Everything else has no tag and never replaces an earlier notification.
 *
 * The body is cut, at a character boundary and with an ellipsis, until the
 * JSON fits MAX_PUSH_PAYLOAD_BYTES. The title and the path are capped first, so
 * whatever they are, the body always keeps room of its own.
 */
export function buildPushPayload(
  msg: Pick<ChannelMessage, 'event' | 'title' | 'body' | 'navigateTarget'>,
): PushPayload {
  const url = samePagePath(msg.navigateTarget);
  const base: PushPayload = {
    title: truncateChars(msg.title, TITLE_MAX_CHARS),
    body: '',
    ...(url ? { url } : {}),
    ...(url && msg.event === COLLAPSING_EVENT ? { tag: `${COLLAPSING_EVENT}:${url}` } : {}),
  };
  const full = { ...base, body: msg.body };
  if (payloadBytes(full) <= MAX_PUSH_PAYLOAD_BYTES) return full;

  const chars = Array.from(msg.body);
  let fits = 0;
  let tooLong = chars.length;
  // Largest prefix that still fits with the ellipsis behind it.
  while (tooLong - fits > 1) {
    const mid = Math.floor((fits + tooLong) / 2);
    if (payloadBytes({ ...base, body: `${chars.slice(0, mid).join('')}${ELLIPSIS}` }) <= MAX_PUSH_PAYLOAD_BYTES)
      fits = mid;
    else tooLong = mid;
  }
  return { ...base, body: `${chars.slice(0, fits).join('')}${ELLIPSIS}` };
}

function hostOf(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return 'invalid-endpoint';
  }
}

/**
 * Web Push delivery: encrypt the payload for each of a user's browsers and
 * POST it to that browser's push service, through the SSRF guard.
 *
 * Mirrors the ntfy and webhook transports: every failure is logged and turned
 * into `false`, nothing throws into the dispatcher. It also tends the table as
 * it goes, because the push services are the only ones who know a browser is
 * gone: 404 and 410 mean the subscription expired or was revoked, and the row
 * is deleted at once. A 403 is counted like any other failure and only removes
 * the row once it has failed FORBIDDEN_FAILURES_BEFORE_REMOVAL times in a row,
 * because the same status also means a rejected token. While the server's key
 * pair is unusable (VapidKeysService logs why) nothing is sent, every row
 * stays and the test send says so. Endpoints are capability URLs, so the log
 * names the push service host, never the URL.
 */
@Injectable()
export class WebPushService {
  constructor(
    private readonly keys: VapidKeysService,
    private readonly subscriptions: PushSubscriptionsService,
  ) {}

  hasDevices(userId: number): boolean {
    return this.subscriptions.hasAny(userId);
  }

  /**
   * False while the server has no key pair it can sign with. The channel
   * reports it as its instance readiness, so the dispatcher skips push for
   * everyone (every device stays subscribed) and the user's settings drop the
   * Push card and column instead of offering a switch that could only fail.
   */
  isAvailable(): boolean {
    return this.keys.isAvailable();
  }

  /** True when at least one of the user's browsers accepted the message. */
  sendToUser(userId: number, msg: ChannelMessage): Promise<boolean> {
    const urgency: Urgency = HIGH_URGENCY_EVENTS.has(msg.event) ? 'high' : 'normal';
    return this.deliver(userId, buildPushPayload(msg), urgency, msg.event);
  }

  /** The Send test button: a short fixed message to every browser the user turned push on in. */
  async sendTest(userId: number): Promise<ChannelTestResult> {
    if (!this.isAvailable()) return { success: false, error: PUSH_UNAVAILABLE_ERROR };
    const sent = await this.deliver(userId, TEST_PAYLOAD, 'normal', 'test');
    return sent ? { success: true } : { success: false, error: 'Failed to send push notification' };
  }

  private async deliver(userId: number, payload: PushPayload, urgency: Urgency, event: string): Promise<boolean> {
    try {
      const rows = this.subscriptions.listForUser(userId);
      if (rows.length === 0) return false;
      const keys = this.keys.getKeys();
      const sign = createVapidSigner(keys, this.keys.getSubject());
      const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
      const results = await Promise.all(
        rows.map((row) => this.deliverTo(row, plaintext, keys.publicKey, sign, urgency, event)),
      );
      return results.includes(true);
    } catch (err) {
      logError(`Web Push failed event=${event} user=${userId}: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  private async deliverTo(
    row: PushSubscriptionRow,
    plaintext: Buffer,
    publicKey: string,
    sign: VapidSigner,
    urgency: Urgency,
    event: string,
  ): Promise<boolean> {
    const host = hostOf(row.endpoint);
    if (row.vapid_public_key !== publicKey) {
      // Subscribed against a key this server no longer signs with, so the push
      // service would refuse every message. Until the browser subscribes again
      // with the current key there is nothing to send to.
      this.subscriptions.deleteById(row.id);
      logInfo(`Web Push dropped a device subscribed with a previous server key user=${row.user_id} host=${host}`);
      return false;
    }
    if (!isPushServiceEndpoint(row.endpoint)) {
      this.subscriptions.deleteById(row.id);
      logError(`Web Push dropped a device whose endpoint is not a known push service user=${row.user_id} host=${host}`);
      return false;
    }

    try {
      const p256dh = decodeBase64Url(row.p256dh);
      const auth = decodeBase64Url(row.auth);
      if (!p256dh || !auth) throw new Error('stored subscription keys are not base64url');
      const body = encryptPushMessage(plaintext, { p256dh, auth });
      // maxRedirects 0: a push service answers, it does not redirect, and a
      // redirect would carry the VAPID token somewhere it was not minted for.
      // bypassInternalIpAllowed keeps private addresses closed even on an
      // install that opened ALLOW_INTERNAL_NETWORK for its own services.
      const res = await safeFetchFollow(
        row.endpoint,
        {
          method: 'POST',
          headers: {
            TTL: String(PUSH_TTL_SECONDS),
            Urgency: urgency,
            'Content-Encoding': 'aes128gcm',
            'Content-Type': 'application/octet-stream',
            Authorization: sign(row.endpoint),
          },
          body: new Uint8Array(body),
          signal: AbortSignal.timeout(PUSH_TIMEOUT_MS),
        },
        { maxRedirects: 0, bypassInternalIpAllowed: true },
      );
      return await this.settle(row, res, host, event);
    } catch (err) {
      this.subscriptions.recordFailure(row.id);
      if (err instanceof SsrfBlockedError) {
        logError(
          `Web Push blocked by SSRF guard event=${event} user=${row.user_id} host=${host} reason=${err.message}`,
        );
      } else {
        logError(
          `Web Push failed event=${event} user=${row.user_id} host=${host}: ${err instanceof Error ? err.message : err}`,
        );
      }
      return false;
    }
  }

  private async settle(row: PushSubscriptionRow, res: Response, host: string, event: string): Promise<boolean> {
    if (res.ok) {
      discardBody(res);
      this.subscriptions.recordSuccess(row.id);
      logInfo(`Web Push sent event=${event} user=${row.user_id} host=${host}`);
      return true;
    }

    const { text } = await readCappedText(res, ERROR_BODY_MAX_BYTES).catch(() => ({ text: '' }));
    if (res.status === 404 || res.status === 410) {
      this.subscriptions.deleteById(row.id);
      logInfo(`Web Push removed an expired device (HTTP ${res.status}) user=${row.user_id} host=${host}`);
      return false;
    }
    if (res.status === 403) {
      // Either the subscription was made for a different key, or the push
      // service rejects the token itself (Apple's BadJwtToken), which is a
      // configuration problem and not the device's. Only a run of refusals
      // with no success between them removes the row; the reason is logged
      // every time so the second case can be told apart.
      const failures = this.subscriptions.recordFailure(row.id);
      if (failures >= FORBIDDEN_FAILURES_BEFORE_REMOVAL) {
        this.subscriptions.deleteById(row.id);
        logError(
          `Web Push removed a device after ${failures} failed sends in a row ending in HTTP 403 ` +
            `user=${row.user_id} host=${host}: ${text}`,
        );
      } else {
        logError(
          `Web Push HTTP 403 event=${event} user=${row.user_id} host=${host} ` +
            `(failure ${failures} of ${FORBIDDEN_FAILURES_BEFORE_REMOVAL} before removal): ${text}`,
        );
      }
      return false;
    }
    this.subscriptions.recordFailure(row.id);
    logError(`Web Push HTTP ${res.status} event=${event} user=${row.user_id} host=${host}: ${text}`);
    return false;
  }
}
