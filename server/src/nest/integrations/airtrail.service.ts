import { Injectable } from '@nestjs/common';
import type { AirtrailFlight } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { checkSsrf } from '../../utils/ssrfGuard';
import { AirtrailAuthError, AirtrailRequestError, type AirtrailCreds } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { normalizeFlight } from './airtrail.mapper';

const KEY_MASK = '••••••••';

interface UserConnRow {
  airtrail_url?: string | null;
  airtrail_api_key?: string | null;
  airtrail_allow_insecure_tls?: number | null;
  airtrail_write_enabled?: number | null;
}

/**
 * AirTrail credentials, connection settings and the connection probe.
 *
 * Folded out of services/airtrail/airtrailService.ts: the SQL, the SSRF
 * handling, the audit entry and the error mapping are unchanged. What moved is
 * where the collaborators come from — the db singleton and the audit bridge were
 * module-level imports and are injected now.
 *
 * The credentials stay in the users columns (airtrail_url, airtrail_api_key,
 * airtrail_allow_insecure_tls, airtrail_write_enabled). That was a deliberate
 * decision, not an omission: an integrations table would have needed a migration
 * and bought nothing while AirTrail is the only integration of this shape.
 */
@Injectable()
export class AirtrailService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly client: AirtrailClient,
  ) {}

  private readRow(userId: number): UserConnRow | undefined {
    return this.db.get<UserConnRow>(
      'SELECT airtrail_url, airtrail_api_key, airtrail_allow_insecure_tls, airtrail_write_enabled FROM users WHERE id = ?',
      userId,
    );
  }

  /** Has this user opted in to TREK writing their flight edits back to AirTrail? (#1240) */
  isAirtrailWriteEnabled(userId: number): boolean {
    const row = this.db.get<{ airtrail_write_enabled?: number | null }>(
      'SELECT airtrail_write_enabled FROM users WHERE id = ?',
      userId,
    );
    return !!row?.airtrail_write_enabled;
  }

  /** Decrypted creds for outbound calls, or null when the user has no connection. */
  getAirtrailCredentials(userId: number): AirtrailCreds | null {
    const row = this.readRow(userId);
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
  getConnectionSettings(userId: number) {
    const row = this.readRow(userId);
    return {
      url: row?.airtrail_url || '',
      apiKeyMasked: row?.airtrail_api_key ? KEY_MASK : '',
      allowInsecureTls: !!row?.airtrail_allow_insecure_tls,
      writeEnabled: !!row?.airtrail_write_enabled,
      connected: !!(row?.airtrail_url && row?.airtrail_api_key),
    };
  }

  async saveSettings(
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
        this.audit.writeAudit({
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
      this.db.run(
        'UPDATE users SET airtrail_url = ?, airtrail_api_key = ?, airtrail_allow_insecure_tls = ?, airtrail_write_enabled = ? WHERE id = ?',
        trimmedUrl || null, newKey, allowInsecureTls ? 1 : 0, writeEnabled ? 1 : 0, userId,
      );
    } else {
      this.db.run(
        'UPDATE users SET airtrail_url = ?, airtrail_allow_insecure_tls = ?, airtrail_write_enabled = ? WHERE id = ?',
        trimmedUrl || null, allowInsecureTls ? 1 : 0, writeEnabled ? 1 : 0, userId,
      );
      // Clearing the URL with no key left makes the connection meaningless — drop the key too.
      if (!trimmedUrl) {
        this.db.run('UPDATE users SET airtrail_api_key = NULL WHERE id = ?', userId);
      }
    }

    return { success: true, warning };
  }

  private async probe(creds: AirtrailCreds): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
    try {
      const flights = await this.client.listFlights(creds);
      return { connected: true, flightCount: flights.length };
    } catch (err: unknown) {
      if (err instanceof AirtrailAuthError) return { connected: false, error: 'Invalid API key' };
      return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  /** Live check using the stored connection. */
  async getConnectionStatus(
    userId: number,
  ): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
    const creds = this.getAirtrailCredentials(userId);
    if (!creds) return { connected: false, error: 'Not configured' };
    return this.probe(creds);
  }

  /**
   * "Test connection" from the settings form. Uses the typed URL/key when given;
   * falls back to the stored key when the key field still shows the mask.
   */
  async testConnection(
    userId: number,
    url: string | undefined,
    apiKey: string | undefined,
    allowInsecureTls: boolean,
  ): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
    const trimmedUrl = (url || '').trim();
    const provided = (apiKey || '').trim();

    const stored = this.getAirtrailCredentials(userId);
    const effectiveUrl = trimmedUrl || stored?.baseUrl;
    const effectiveKey = provided && provided !== KEY_MASK ? provided : stored?.apiKey;

    if (!effectiveUrl || !effectiveKey) {
      return { connected: false, error: 'URL and API key required' };
    }

    const ssrf = await checkSsrf(effectiveUrl);
    if (!ssrf.allowed && !ssrf.isPrivate) {
      return { connected: false, error: ssrf.error ?? 'Invalid AirTrail URL' };
    }

    return this.probe({ baseUrl: effectiveUrl, apiKey: effectiveKey, allowInsecureTls });
  }

  /** The user's AirTrail flights, normalized for the import picker. */
  async getFlightsForPicker(userId: number): Promise<AirtrailFlight[]> {
    const creds = this.getAirtrailCredentials(userId);
    if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);
    const raw = await this.client.listFlights(creds);
    return raw.map(normalizeFlight);
  }
}
