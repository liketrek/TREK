import { MAX_PUSH_ENDPOINT_LENGTH, type PushSubscriptionInput } from '@trek/shared';
import { decodeBase64Url } from '../../../app-config';
import { isP256Point } from './web-push-crypto';

/**
 * The browser hands us a URL and the server POSTs to it for as long as the row
 * lives, so the URL is checked like any other user-supplied target, and more
 * narrowly: it has to be one of the push services browsers actually use. The
 * SSRF guard still runs on every send; this list is what keeps a subscription
 * from turning the server into a POST relay towards some other public host.
 */
export const PUSH_SERVICE_HOSTS: readonly string[] = [
  // Chrome, Edge on Android, and every Chromium browser that uses Google's push.
  'fcm.googleapis.com',
  'android.googleapis.com',
  // Firefox (autopush).
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  // Safari on macOS, and Home Screen apps on iOS and iPadOS 16.4+.
  'web.push.apple.com',
];

/** Services that hand out per-region or per-cluster hosts under one domain. */
export const PUSH_SERVICE_HOST_SUFFIXES: readonly string[] = [
  '.push.apple.com',
  // Edge on Windows (WNS).
  '.notify.windows.com',
];

/** The bespoke 400 bodies for a subscription the browser should not have sent. */
export const PUSH_SUBSCRIPTION_ERRORS = {
  endpoint: 'Invalid push endpoint',
  service: 'Push endpoint is not a known push service',
  p256dh: 'Invalid push subscription key',
  auth: 'Invalid push subscription auth secret',
} as const;

export interface CheckedPushSubscription {
  endpoint: string;
  /** Canonical base64url, no padding. */
  p256dh: string;
  /** Canonical base64url, no padding. */
  auth: string;
}

export type PushSubscriptionCheck = { ok: true; value: CheckedPushSubscription } | { ok: false; error: string };

function isKnownPushServiceHost(host: string): boolean {
  return (
    PUSH_SERVICE_HOSTS.includes(host) ||
    PUSH_SERVICE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length)
  );
}

/**
 * The endpoint half of the check, shared with the sender so a row that no
 * longer passes (a host dropped from the list) is not posted to again.
 * Answers 'ok', or which of the errors applies: 'endpoint' for anything that is
 * not a plain https URL on the default port without credentials, 'service' for
 * a host that is not on the list.
 */
export function checkPushEndpoint(endpoint: string): 'ok' | 'endpoint' | 'service' {
  if (endpoint.length > MAX_PUSH_ENDPOINT_LENGTH) return 'endpoint';
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return 'endpoint';
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return 'endpoint';
  return isKnownPushServiceHost(url.hostname) ? 'ok' : 'service';
}

export function isPushServiceEndpoint(endpoint: string): boolean {
  return checkPushEndpoint(endpoint) === 'ok';
}

/**
 * Everything the Zod contract cannot say about a subscription: where it points,
 * and that its keys have the sizes RFC 8291 needs (and the p256dh a point on
 * the curve), so the sender never meets a row it cannot encrypt for.
 */
export function checkPushSubscription(input: PushSubscriptionInput): PushSubscriptionCheck {
  const endpointVerdict = checkPushEndpoint(input.endpoint);
  if (endpointVerdict !== 'ok') return { ok: false, error: PUSH_SUBSCRIPTION_ERRORS[endpointVerdict] };

  const p256dh = decodeBase64Url(input.keys.p256dh);
  if (!p256dh || !isP256Point(p256dh)) return { ok: false, error: PUSH_SUBSCRIPTION_ERRORS.p256dh };

  const auth = decodeBase64Url(input.keys.auth);
  if (auth?.length !== 16) return { ok: false, error: PUSH_SUBSCRIPTION_ERRORS.auth };

  return {
    ok: true,
    value: { endpoint: input.endpoint, p256dh: p256dh.toString('base64url'), auth: auth.toString('base64url') },
  };
}
