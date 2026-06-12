import { db } from '../db/database';
import { getAppUrl } from './notifications';

/**
 * Resolves the WebAuthn Relying Party ID + allowed origins for this deployment.
 *
 * SECURITY: the RP ID and the allowed origins are derived ONLY from server-side
 * configuration — the `webauthn_rp_id` / `webauthn_origins` admin settings (or
 * the matching env vars), falling back to APP_URL. They are NEVER taken from the
 * request `Host` / `X-Forwarded-Host` header: a forged forwarded host would
 * otherwise let an attacker bind credentials to a domain they control, or brick
 * every enrolled user. This mirrors how OIDC derives its redirect URI from
 * APP_URL (oidc.controller.ts) rather than from request input.
 *
 * Returns null when no usable RP ID can be resolved (bare IP host, or nothing
 * configured) — the feature then reports itself as "not configured" and stays
 * disabled so nobody can enrol a credential bound to the wrong origin.
 */

function getSetting(key: string): string | null {
  const raw = (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

/** WebAuthn RP IDs must be registrable domains — never bare IP literals. */
function isIpHost(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // IPv4
  if (host.includes(':')) return true; // IPv6 (hostname keeps the colons)
  return false;
}

export interface WebauthnConfig {
  rpID: string;
  rpName: string;
  /** Exact allowed origins (scheme + host + port). One in prod; localhost dev adds the Vite/API ports. */
  origins: string[];
}

export function resolveWebauthnConfig(): WebauthnConfig | null {
  // 1. Explicit operator config always wins.
  const explicitRpId = (process.env.WEBAUTHN_RP_ID || getSetting('webauthn_rp_id'))?.trim() || null;
  const explicitOrigins = (process.env.WEBAUTHN_ORIGINS || getSetting('webauthn_origins') || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const appUrl = getAppUrl();
  const appHost = hostOf(appUrl);

  // 2. Derive the RP ID from APP_URL when not explicitly set.
  let rpID = explicitRpId;
  if (!rpID && appHost && !isIpHost(appHost)) {
    rpID = appHost; // a real domain, or "localhost"
  }
  if (!rpID) return null; // bare IP / unresolved → WebAuthn cannot be used here

  // 3. Resolve the allowed origins. Explicit list wins verbatim (operator's
  //    responsibility). Otherwise derive a SINGLE origin from APP_URL — we never
  //    silently union dev localhost origins into a production allow-list.
  let origins = explicitOrigins;
  if (origins.length === 0) {
    if (appHost) origins = [appUrl.replace(/\/+$/, '')];
    if (rpID === 'localhost') {
      // Dev: the browser origin is the Vite dev server (:5173), not the API port.
      origins = Array.from(new Set([...origins, 'http://localhost:5173', 'http://localhost:3001']));
    }
  }
  if (origins.length === 0) return null;

  return { rpID, rpName: 'TREK', origins };
}

/** True when a usable RP ID resolves for this deployment (exposed as a pure boolean on app-config). */
export function isPasskeyConfigured(): boolean {
  return resolveWebauthnConfig() !== null;
}
