import { serviceTierSchema, type ServiceQuotaView, type ServiceTier } from '@trek/shared';

import { createHash } from 'node:crypto';

/**
 * Two service addresses name the same service when host and path agree. The
 * scheme, the case and trailing slashes do not count, so a compose line that
 * was only uncommented still reads as the public instance.
 */
export function sameServiceUrl(a: string, b: string): boolean {
  const left = serviceAddress(a);
  return left !== null && left === serviceAddress(b);
}

function serviceAddress(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return `${url.host}${url.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return null;
  }
}

/** Only an https request to a listed host carries the installation key. */
export function isAllowlisted(url: URL, hosts: readonly string[]): boolean {
  return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase());
}

export interface QuotaReading {
  tier: ServiceTier | null;
  quota: ServiceQuotaView | null;
}

/** The X-TREK-Tier and X-TREK-Quota-* headers a liketrek answer carries, or null without any. */
export function readQuotaHeaders(headers: Headers): QuotaReading | null {
  const tier = serviceTierSchema.safeParse(headers.get('x-trek-tier'));
  const limit = wholeNumber(headers.get('x-trek-quota-limit'));
  const remaining = wholeNumber(headers.get('x-trek-quota-remaining'));
  const reset = wholeNumber(headers.get('x-trek-quota-reset'));
  const quota =
    limit !== null && remaining !== null && reset !== null
      ? { limit, used: Math.max(0, limit - remaining), remaining, resetAt: new Date(reset * 1000).toISOString() }
      : null;
  if (!tier.success && !quota) return null;
  return { tier: tier.success ? tier.data : null, quota };
}

function wholeNumber(raw: string | null): number | null {
  if (raw === null || !/^\d{1,12}$/.test(raw.trim())) return null;
  return Number(raw.trim());
}

/** Retry-After as milliseconds from now, in either of its two spellings. */
export function retryAfterMs(headers: Headers, now = Date.now()): number | null {
  const raw = headers.get('retry-after')?.trim();
  if (!raw) return null;
  if (/^\d{1,9}$/.test(raw)) return Number(raw) * 1000;
  const at = Date.parse(raw);
  return Number.isNaN(at) ? null : Math.max(0, at - now);
}

/** The answering server's clock from its Date header. */
export function serverDateMs(headers: Headers): number | null {
  const raw = headers.get('date');
  const at = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(at) ? null : at;
}

/** Names a key in stored bookkeeping without storing the key itself. */
export function keyFingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}
