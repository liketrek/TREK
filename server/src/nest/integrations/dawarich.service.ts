import { Injectable } from '@nestjs/common';
import {
  DAWARICH_KEY_MASK,
  type DawarichCapabilities,
  type DawarichConnection,
  type DawarichStatus,
  type DawarichSyncState,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../audit/audit.service';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { checkSsrf } from '../../utils/ssrfGuard';
import { DawarichClient, DawarichError, type DawarichCreds } from './dawarich.client';

/**
 * The Dawarich connection: credentials, the probe, and what the connected
 * instance can actually do.
 *
 * Credentials live in `dawarich_connections` rather than in more `users`
 * columns. AirTrail put its four on `users` and said so out loud — correct while
 * it was the only integration of that shape, and this is the second one. The
 * deciding difference is that this connection carries state (last sync, last
 * error, probed capabilities) that belongs to a sync, not to an identity, and
 * that a personal location archive is the one credential worth keeping furthest
 * from the row every other feature joins against.
 *
 * The key is encrypted at rest and never leaves again: `getConnection` returns a
 * mask, and there is no route that reads it back.
 */
@Injectable()
export class DawarichService {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly client: DawarichClient,
  ) {}

  private readRow(userId: number): ConnRow | undefined {
    return this.db.get<ConnRow>(
      `SELECT user_id, url, api_key, allow_insecure_tls, sync_enabled,
              last_sync_at, last_sync_state, last_sync_error, capabilities
         FROM dawarich_connections WHERE user_id = ?`,
      userId,
    );
  }

  /** Decrypted credentials for an outbound call, or null when nothing is connected. */
  getCredentials(userId: number): DawarichCreds | null {
    const row = this.readRow(userId);
    if (!row?.url || !row?.api_key) return null;
    const apiKey = decrypt_api_key(row.api_key);
    if (!apiKey) return null;
    return { baseUrl: row.url, apiKey, allowInsecureTls: !!row.allow_insecure_tls };
  }

  /** True when the user has both an address and a key on file. */
  isConnected(userId: number): boolean {
    const row = this.readRow(userId);
    return !!(row?.url && row?.api_key);
  }

  /** Every user whose connection is usable and whose background sync is on. */
  listSyncableUserIds(): number[] {
    const rows = this.db.all<{ user_id: number }>(
      `SELECT user_id FROM dawarich_connections
        WHERE sync_enabled = 1 AND url IS NOT NULL AND url <> '' AND api_key IS NOT NULL`,
    );
    return rows.map((r) => r.user_id);
  }

  /** The connection as the settings card shows it. The key is a mask, always. */
  getConnection(userId: number): DawarichConnection {
    const row = this.readRow(userId);
    return {
      url: row?.url || '',
      apiKeyMasked: row?.api_key ? DAWARICH_KEY_MASK : '',
      allowInsecureTls: !!row?.allow_insecure_tls,
      // A row that does not exist yet is a user who has never opened the card,
      // and the default there is "poll once it is connected".
      syncEnabled: row ? !!row.sync_enabled : true,
      connected: !!(row?.url && row?.api_key),
      lastSyncAt: row?.last_sync_at ?? null,
      lastSyncState: normalizeSyncState(row?.last_sync_state),
      lastSyncError: row?.last_sync_error ?? null,
      capabilities: parseCapabilities(row?.capabilities),
    };
  }

  getCapabilities(userId: number): DawarichCapabilities | null {
    return parseCapabilities(this.readRow(userId)?.capabilities);
  }

  /**
   * Save the address and, when a new one was typed, the key.
   *
   * A blank key field or the mask means "keep what is stored" — the field is
   * never prefilled, so blank is the normal state of a form someone opened to
   * change the URL.
   *
   * A private address is saved with a warning rather than refused: a
   * self-hosted Dawarich on a LAN is the common case, not an attack. Only a URL
   * that could not work at all (malformed, unresolvable, not http) is rejected.
   */
  async saveSettings(
    userId: number,
    url: string | undefined,
    apiKey: string | undefined,
    allowInsecureTls: boolean,
    syncEnabled: boolean,
    clientIp: string | null,
  ): Promise<{ success: boolean; warning?: string; warningCode?: string; warningIp?: string; error?: string; code?: string }> {
    const trimmedUrl = (url || '').trim();
    let warning: string | undefined;
    let warningCode: string | undefined;
    let warningIp: string | undefined;

    if (trimmedUrl) {
      const ssrf = await checkSsrf(trimmedUrl);
      if (!ssrf.allowed && !ssrf.isPrivate) {
        // The sentence is kept for a caller reading the API directly; the code
        // beside it is what the UI renders, in the reader's own language.
        return { success: false, code: 'invalid_url', error: ssrf.error ?? 'Invalid Dawarich URL' };
      }
      if (ssrf.isPrivate) {
        this.audit.writeAudit({
          userId,
          action: 'dawarich.private_ip_configured',
          ip: clientIp,
          details: { dawarich_url: trimmedUrl, resolved_ip: ssrf.resolvedIp },
        });
        warning = `Dawarich URL resolves to a private IP (${ssrf.resolvedIp}). Make sure this is intentional — the server may need ALLOW_INTERNAL_NETWORK=true to reach it.`;
        warningCode = 'private_ip';
        warningIp = ssrf.resolvedIp ?? undefined;
      }
    }

    const previousUrl = this.db.get<{ url: string | null }>(
      'SELECT url FROM dawarich_connections WHERE user_id = ?',
      userId,
    )?.url ?? null;

    const provided = (apiKey || '').trim();
    const newKey = provided && provided !== DAWARICH_KEY_MASK ? maybe_encrypt_api_key(provided) : undefined;

    // All three writes or none: a row that took the new address but not the new
    // key would point a credential minted for one instance at another one, and
    // the next sync would send it there.
    this.db.transaction(() => {
      this.db.run(
        `INSERT INTO dawarich_connections (user_id, url, allow_insecure_tls, sync_enabled, updated_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
              url = excluded.url,
              allow_insecure_tls = excluded.allow_insecure_tls,
              sync_enabled = excluded.sync_enabled,
              updated_at = CURRENT_TIMESTAMP`,
        userId,
        trimmedUrl || null,
        allowInsecureTls ? 1 : 0,
        syncEnabled ? 1 : 0,
      );

      if (newKey !== undefined) {
        this.db.run('UPDATE dawarich_connections SET api_key = ? WHERE user_id = ?', newKey, userId);
      }

      // A key belongs to the instance it was minted on. Pointing the connection
      // at a different host without retyping the key would quietly send that
      // instance's credential somewhere it was never issued for, so the key goes
      // with the host — and only with the host: correcting a typo in the path,
      // or adding a trailing slash, keeps it.
      if (newKey === undefined && movedHost(previousUrl, trimmedUrl)) {
        this.db.run(
          `UPDATE dawarich_connections
              SET api_key = NULL, capabilities = NULL, last_sync_state = 'never',
                  last_sync_error = NULL, last_sync_at = NULL
            WHERE user_id = ?`,
          userId,
        );
      }

      // Clearing the address leaves a key that can no longer be used for
      // anything. Keeping it would be storing a live credential for a server
      // nobody named.
      if (!trimmedUrl) {
        this.db.run(
          `UPDATE dawarich_connections
              SET api_key = NULL, capabilities = NULL, last_sync_state = 'never',
                  last_sync_error = NULL, last_sync_at = NULL
            WHERE user_id = ?`,
          userId,
        );
      }
    });

    return warning ? { success: true, warning, warningCode, warningIp } : { success: true };
  }

  /**
   * Forget the connection entirely.
   *
   * The suggestions it produced are deliberately left alone: one that was
   * accepted became a place or a journal entry the user wrote, and deleting
   * their journal because they revoked an API key would be the integration
   * destroying user content on its way out. What goes is the credential.
   */
  disconnect(userId: number, clientIp: string | null): void {
    this.db.run('DELETE FROM dawarich_connections WHERE user_id = ?', userId);
    this.audit.writeAudit({ userId, action: 'dawarich.disconnected', ip: clientIp, details: {} });
  }

  /**
   * Try the connection as it is about to be saved — with the typed key if there
   * is one, otherwise with the stored one.
   *
   * Answers 200 with `connected: false` rather than throwing, because "wrong
   * key" is an answer the form has to render, not a server error.
   */
  async testConnection(
    userId: number,
    url: string | undefined,
    apiKey: string | undefined,
    allowInsecureTls: boolean,
  ): Promise<DawarichStatus> {
    const typedKey = (apiKey || '').trim();
    const stored = this.getCredentials(userId);
    const baseUrl = (url || '').trim() || stored?.baseUrl || '';
    const key = typedKey && typedKey !== DAWARICH_KEY_MASK ? typedKey : stored?.apiKey;

    if (!baseUrl || !key) {
      return { connected: false, error: 'not_connected' };
    }

    const creds: DawarichCreds = { baseUrl, apiKey: key, allowInsecureTls };
    try {
      const capabilities = await this.probeCapabilities(creds);
      // Only persist against a connection that is actually stored — a test run
      // from a half-filled form must not overwrite what is on file.
      if (stored && baseUrl === stored.baseUrl) this.storeCapabilities(userId, capabilities);
      return {
        connected: true,
        visitCount: capabilities.visits ? await this.countRecentVisits(creds) : 0,
        capabilities,
      };
    } catch (err) {
      if (err instanceof DawarichError) {
        return { connected: false, error: err.code, ...(err.detail ? { errorDetail: err.detail } : {}) };
      }
      return { connected: false, error: 'unreachable' };
    }
  }

  /**
   * Ask the instance what it offers, once, instead of assuming a version.
   *
   * Each endpoint is tried with a tiny window; a 404 means this build does not
   * have it and the feature that needs it stays off, which is how an older
   * Dawarich still connects and still does most of what people want. Anything
   * other than a 404 — an unreachable host, a rejected key — is a real failure
   * and propagates: reporting "connected, but nothing works" would be worse
   * than the error.
   */
  async probeCapabilities(creds: DawarichCreds): Promise<DawarichCapabilities> {
    const { version } = await this.client.probe(creds);
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

    const visitsProbe = await this.tryEndpoint(() => this.client.listVisits(creds, from, to));
    const tracks = await this.tryEndpoint(() => this.client.listTracks(creds, from, to));
    const points = await this.tryEndpoint(() => this.client.listPoints(creds, from, to));
    const visitedCities = await this.tryEndpoint(() => this.client.listVisitedCities(creds, from, to));
    // A coordinate no recording will ever be near: the probe is about whether
    // the route answers, not about what it finds.
    const locations = await this.tryEndpoint(() => this.client.findVisitsNear(creds, 0, 0, 50, 1));

    const sample = visitsProbe.ok ? visitsProbe.value.visits[0] : undefined;
    return {
      visits: visitsProbe.ok,
      tracks: tracks.ok,
      points: points.ok,
      locations: locations.ok,
      visitedCities: visitedCities.ok,
      // Read off a real row when there is one. With no visit in the probe window
      // the honest answer is "not seen", and the sync re-probes on every run, so
      // a later version's new field is picked up on its own.
      visitUpdatedAt: !!sample && sample.updated_at != null,
      visitCountryCode: !!sample?.place && sample.place.country_code != null,
      serverVersion: version,
      probedAt: new Date().toISOString(),
    };
  }

  /** A 404 means "this build has no such endpoint"; everything else is a real failure. */
  private async tryEndpoint<T>(run: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
    try {
      return { ok: true, value: await run() };
    } catch (err) {
      if (err instanceof DawarichError && err.code === 'not_found') return { ok: false };
      throw err;
    }
  }

  /** Visits in the last 30 days — the number the connection card shows as proof of life. */
  private async countRecentVisits(creds: DawarichCreds): Promise<number> {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    try {
      const { visits } = await this.client.listVisits(creds, from, to);
      return visits.length;
    } catch {
      // The connection is already proven at this point; a count is a nicety.
      return 0;
    }
  }

  storeCapabilities(userId: number, capabilities: DawarichCapabilities): void {
    this.db.run(
      'UPDATE dawarich_connections SET capabilities = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      JSON.stringify(capabilities),
      userId,
    );
  }

  recordSyncResult(userId: number, state: DawarichSyncState, error: string | null): void {
    this.db.run(
      `UPDATE dawarich_connections
          SET last_sync_at = ?, last_sync_state = ?, last_sync_error = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
      new Date().toISOString(),
      state,
      error,
      userId,
    );
  }
}

interface ConnRow {
  user_id: number;
  url: string | null;
  api_key: string | null;
  allow_insecure_tls: number | null;
  sync_enabled: number | null;
  last_sync_at: string | null;
  last_sync_state: string | null;
  last_sync_error: string | null;
  capabilities: string | null;
}

/**
 * An unrecognised stored state reads as `never` rather than being passed
 * through: the client switches on it, and a value it has no branch for would
 * render as nothing at all.
 */
function normalizeSyncState(raw: string | null | undefined): DawarichSyncState {
  return raw === 'ok' || raw === 'partial' || raw === 'failed' ? raw : 'never';
}

/**
 * Capabilities are stored as JSON and read back defensively: the column is
 * written by an older build's shape after an upgrade, and a malformed value
 * means "not probed yet", never a crash on the settings page.
 */
function parseCapabilities(raw: string | null | undefined): DawarichCapabilities | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DawarichCapabilities>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      visits: !!parsed.visits,
      tracks: !!parsed.tracks,
      points: !!parsed.points,
      locations: !!parsed.locations,
      visitedCities: !!parsed.visitedCities,
      visitUpdatedAt: !!parsed.visitUpdatedAt,
      visitCountryCode: !!parsed.visitCountryCode,
      serverVersion: typeof parsed.serverVersion === 'string' ? parsed.serverVersion : null,
      probedAt: typeof parsed.probedAt === 'string' ? parsed.probedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Did the connection move to a different Dawarich instance?
 *
 * Scheme, host and port, because that is what decides where a credential is
 * sent. A path change ("/", "/api", a typo) is the same instance. Anything
 * unparseable is compared as written — a conservative answer that errs towards
 * dropping the key rather than shipping it somewhere new.
 */
function movedHost(before: string | null, after: string): boolean {
  if (!before || !after) return false;
  try {
    const a = new URL(before);
    const b = new URL(after);
    return a.origin !== b.origin;
  } catch {
    return before !== after;
  }
}
