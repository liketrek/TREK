import type { AirtrailFlight } from '@trek/shared';
import { db } from '../../db/database';
import { maybe_encrypt_api_key, decrypt_api_key } from '../apiKeyCrypto';
import { checkSsrf } from '../../utils/ssrfGuard';
import { writeAudit } from '../auditLog';
import { AirtrailAuthError, AirtrailCreds, AirtrailRequestError, listFlights } from './airtrailClient';
import { normalizeFlight } from './airtrailMapper';

const KEY_MASK = '••••••••';

interface UserConnRow {
  airtrail_url?: string | null;
  airtrail_api_key?: string | null;
  airtrail_allow_insecure_tls?: number | null;
  airtrail_write_enabled?: number | null;
}

function readRow(userId: number): UserConnRow | undefined {
  return db
    .prepare(
      'SELECT airtrail_url, airtrail_api_key, airtrail_allow_insecure_tls, airtrail_write_enabled FROM users WHERE id = ?',
    )
    .get(userId) as UserConnRow | undefined;
}

/** Has this user opted in to TREK writing their flight edits back to AirTrail? (#1240) */
export function isAirtrailWriteEnabled(userId: number): boolean {
  const row = db.prepare('SELECT airtrail_write_enabled FROM users WHERE id = ?').get(userId) as
    | { airtrail_write_enabled?: number | null }
    | undefined;
  return !!row?.airtrail_write_enabled;
}

/** Decrypted creds for outbound calls, or null when the user has no connection. */
export function getAirtrailCredentials(userId: number): AirtrailCreds | null {
  const row = readRow(userId);
  if (!row?.airtrail_url || !row?.airtrail_api_key) return null;
  const apiKey = decrypt_api_key(row.airtrail_api_key);
  if (!apiKey) return null;
  return {
    baseUrl: row.airtrail_url,
    apiKey,
    allowInsecureTls: !!row.airtrail_allow_insecure_tls,
  };
}

/** Settings as shown in the UI — the key is never echoed, only masked. */
export function getConnectionSettings(userId: number) {
  const row = readRow(userId);
  return {
    url: row?.airtrail_url || '',
    apiKeyMasked: row?.airtrail_api_key ? KEY_MASK : '',
    allowInsecureTls: !!row?.airtrail_allow_insecure_tls,
    writeEnabled: !!row?.airtrail_write_enabled,
    connected: !!(row?.airtrail_url && row?.airtrail_api_key),
  };
}

export async function saveSettings(
  userId: number,
  url: string | undefined,
  apiKey: string | undefined,
  allowInsecureTls: boolean,
  writeEnabled: boolean,
  clientIp: string | null,
): Promise<{ success: boolean; warning?: string; error?: string }> {
  const trimmedUrl = (url || '').trim();
  let warning: string | undefined;

  if (trimmedUrl) {
    const ssrf = await checkSsrf(trimmedUrl);
    // Reject only genuinely unusable URLs (malformed, unresolvable, non-http,
    // loopback). Private/LAN instances are the common self-hosted case, so we
    // persist them with a warning rather than blocking — the outbound calls
    // still need ALLOW_INTERNAL_NETWORK=true to actually reach them.
    if (!ssrf.allowed && !ssrf.isPrivate) {
      return { success: false, error: ssrf.error ?? 'Invalid AirTrail URL' };
    }
    if (ssrf.isPrivate) {
      writeAudit({
        userId,
        action: 'airtrail.private_ip_configured',
        ip: clientIp,
        details: { airtrail_url: trimmedUrl, resolved_ip: ssrf.resolvedIp },
      });
      warning = `AirTrail URL resolves to a private IP (${ssrf.resolvedIp}). Make sure this is intentional — the server may need ALLOW_INTERNAL_NETWORK=true to reach it.`;
    }
  }

  // Only overwrite the stored key when a genuinely new value is supplied;
  // a blank field or the mask means "keep the existing key".
  const provided = (apiKey || '').trim();
  const newKey = provided && provided !== KEY_MASK ? maybe_encrypt_api_key(provided) : undefined;

  if (newKey !== undefined) {
    db.prepare(
      'UPDATE users SET airtrail_url = ?, airtrail_api_key = ?, airtrail_allow_insecure_tls = ?, airtrail_write_enabled = ? WHERE id = ?',
    ).run(trimmedUrl || null, newKey, allowInsecureTls ? 1 : 0, writeEnabled ? 1 : 0, userId);
  } else {
    db.prepare(
      'UPDATE users SET airtrail_url = ?, airtrail_allow_insecure_tls = ?, airtrail_write_enabled = ? WHERE id = ?',
    ).run(trimmedUrl || null, allowInsecureTls ? 1 : 0, writeEnabled ? 1 : 0, userId);
    // Clearing the URL with no key left makes the connection meaningless — drop the key too.
    if (!trimmedUrl) {
      db.prepare('UPDATE users SET airtrail_api_key = NULL WHERE id = ?').run(userId);
    }
  }

  return { success: true, warning };
}

async function probe(creds: AirtrailCreds): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
  try {
    const flights = await listFlights(creds);
    return { connected: true, flightCount: flights.length };
  } catch (err: unknown) {
    if (err instanceof AirtrailAuthError) return { connected: false, error: 'Invalid API key' };
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

/** Live check using the stored connection. */
export async function getConnectionStatus(
  userId: number,
): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
  const creds = getAirtrailCredentials(userId);
  if (!creds) return { connected: false, error: 'Not configured' };
  return probe(creds);
}

/**
 * "Test connection" from the settings form. Uses the typed URL/key when given;
 * falls back to the stored key when the key field still shows the mask.
 */
export async function testConnection(
  userId: number,
  url: string | undefined,
  apiKey: string | undefined,
  allowInsecureTls: boolean,
): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
  const trimmedUrl = (url || '').trim();
  const provided = (apiKey || '').trim();

  const stored = getAirtrailCredentials(userId);
  const effectiveUrl = trimmedUrl || stored?.baseUrl;
  const effectiveKey = provided && provided !== KEY_MASK ? provided : stored?.apiKey;

  if (!effectiveUrl || !effectiveKey) {
    return { connected: false, error: 'URL and API key required' };
  }

  const ssrf = await checkSsrf(effectiveUrl);
  if (!ssrf.allowed && !ssrf.isPrivate) {
    return { connected: false, error: ssrf.error ?? 'Invalid AirTrail URL' };
  }

  return probe({ baseUrl: effectiveUrl, apiKey: effectiveKey, allowInsecureTls });
}

/** The user's AirTrail flights, normalized for the import picker. */
export async function getFlightsForPicker(userId: number): Promise<AirtrailFlight[]> {
  const creds = getAirtrailCredentials(userId);
  if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);
  const raw = await listFlights(creds);
  return raw.map(normalizeFlight);
}
