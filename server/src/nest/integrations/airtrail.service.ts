import { UserAirtrailRepository } from '../../db/repositories/UserAirtrail.repository';
import { checkSsrf } from '../../utils/ssrfGuard';
import { AuditService } from '../audit/audit.service';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { UnitOfWork } from '../database/unit-of-work';
import { AirtrailAuthError, AirtrailRequestError, type AirtrailCreds } from './airtrail.client';
import { AirtrailClient } from './airtrail.client';
import { normalizeFlight } from './airtrail.mapper';
import { Injectable } from '@nestjs/common';
import type { AirtrailFlight } from '@trek/shared';

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
 *
 * Plan 3h Task 4 (ATC1-5): the raw `users` reads/writes now go through
 * `UserAirtrailRepository`'s (same `users` table) `getAirtrailConnRow`/`getAirtrailWriteEnabled`/
 * `setAirtrailSettingsWithKey`/`setAirtrailSettings`/`clearAirtrailApiKey`
 * methods (R7 — the repository sees only opaque, already-encrypted TEXT;
 * `maybe_encrypt_api_key`/`decrypt_api_key` stay here). `saveSettings` writes
 * in one `uow.transactional`, as `DawarichService#saveSettings` does: the new
 * address and the key it may no longer carry change together or not at all.
 */
@Injectable()
export class AirtrailService {
  constructor(
    private readonly airtrailRepo: UserAirtrailRepository,
    private readonly audit: AuditService,
    private readonly client: AirtrailClient,
    private readonly uow: UnitOfWork,
  ) {}

  private async readRow(userId: number): Promise<UserConnRow | undefined> {
    const row = await this.airtrailRepo.getAirtrailConnRow(userId);
    return row ?? undefined;
  }

  /** Has this user opted in to TREK writing their flight edits back to AirTrail? (#1240) */
  async isAirtrailWriteEnabled(userId: number): Promise<boolean> {
    const value = await this.airtrailRepo.getAirtrailWriteEnabled(userId);
    return !!value;
  }

  /** Decrypted creds for outbound calls, or null when the user has no connection. */
  async getAirtrailCredentials(userId: number): Promise<AirtrailCreds | null> {
    const row = await this.readRow(userId);
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
  async getConnectionSettings(userId: number) {
    const row = await this.readRow(userId);
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
        await this.audit.writeAudit({
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

    // A key belongs to the instance it was issued on, as in testConnection. A
    // new host with the key field left masked or blank would otherwise send the
    // old instance's key to the new one on the next sync, so the key goes with
    // the host. A path edit on the same origin keeps it. An address cleared with
    // no key left drops the key too: it would be a credential for no server.
    const previousUrl = newKey === undefined ? ((await this.readRow(userId))?.airtrail_url ?? null) : null;
    const dropKey = newKey === undefined && (!trimmedUrl || movedHost(previousUrl, trimmedUrl));

    // The address and the key it may no longer carry change together, so no
    // moment stores the new address beside the old key.
    await this.uow.transactional(async () => {
      if (newKey !== undefined) {
        await this.airtrailRepo.setAirtrailSettingsWithKey(
          userId,
          trimmedUrl || null,
          newKey,
          allowInsecureTls ? 1 : 0,
          writeEnabled ? 1 : 0,
        );
        return;
      }
      await this.airtrailRepo.setAirtrailSettings(
        userId,
        trimmedUrl || null,
        allowInsecureTls ? 1 : 0,
        writeEnabled ? 1 : 0,
      );
      if (dropKey) await this.airtrailRepo.clearAirtrailApiKey(userId);
    });

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
  async getConnectionStatus(userId: number): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
    const creds = await this.getAirtrailCredentials(userId);
    if (!creds) return { connected: false, error: 'Not configured' };
    return this.probe(creds);
  }

  /**
   * "Test connection" from the settings form. Uses the typed URL/key when given;
   * falls back to the stored key when the key field still shows the mask.
   *
   * The stored key only for the origin it was stored against. The form prefills
   * the address and never the key, so retyping the address and pressing Test is
   * the ordinary way to move an instance, and a test button that carried the
   * stored key to whatever address was just typed would post the credential at
   * a stranger's server. A path edit on the same origin is the same instance
   * and keeps it.
   */
  async testConnection(
    userId: number,
    url: string | undefined,
    apiKey: string | undefined,
    allowInsecureTls: boolean,
  ): Promise<{ connected: boolean; flightCount?: number; error?: string }> {
    const trimmedUrl = (url || '').trim();
    const provided = (apiKey || '').trim();

    const stored = await this.getAirtrailCredentials(userId);
    const effectiveUrl = trimmedUrl || stored?.baseUrl;
    const typedKey = provided && provided !== KEY_MASK ? provided : '';

    if (!typedKey && stored && movedHost(stored.baseUrl, trimmedUrl)) {
      return {
        connected: false,
        error: `The stored key was issued for ${stored.baseUrl}. Enter the key for this address to test it.`,
      };
    }
    const effectiveKey = typedKey || stored?.apiKey;

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
    const creds = await this.getAirtrailCredentials(userId);
    if (!creds) throw new AirtrailRequestError('AirTrail is not connected', 400);
    const raw = await this.client.listFlights(creds);
    return raw.map(normalizeFlight);
  }
}

/**
 * Does the typed address point at a different AirTrail instance than the stored one?
 *
 * Scheme, host and port, because that is what decides where a credential is
 * sent. A path change ("/", "/api", a typo) is the same instance. Anything
 * unparseable is compared as written, which errs towards withholding the key
 * rather than shipping it somewhere new. An empty address is no move at all:
 * the stored one stands in for it.
 */
function movedHost(before: string | null, after: string): boolean {
  if (!before || !after) return false;
  try {
    return new URL(before).origin !== new URL(after).origin;
  } catch {
    return before !== after;
  }
}
