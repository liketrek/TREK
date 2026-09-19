import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DOCSYNC_SECRET_MASK, type DocsyncConnectionInput, type DocsyncLinkInput } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { checkSsrf } from '../../utils/ssrfGuard';
import { DocumentProviderRegistry } from './document-provider.registry';
import type { DocumentConnectionRef, DocumentScopeRef, DocResult } from './document-provider';
import { docFailed } from './document-provider';
import { decryptSecrets, encryptSecrets, maskSecrets, mergeSecrets } from './doc-sync-secrets';

/**
 * Connections and trip bindings: everything a human configures, as opposed to
 * what the reconciler does with it.
 *
 * The connection carries a `trip_id`, and that is the one place this design
 * leaves the pattern every other integration in the repo follows. Immich,
 * Synology Photos, AirTrail and Dawarich all store credentials per user, and
 * `trip_album_links` carries a `user_id` so that photos are shared only through
 * an explicit flag. None of that can deliver "everyone on the trip sees the
 * same documents": visibility would depend on whose credentials fetched a file,
 * and a member without their own Paperless account would see nothing.
 *
 * So the trip admin binds the trip once, the server talks to the provider under
 * that single identity, and TREK's own membership decides who sees what. The
 * provider never learns that TREK has members. `owner_user_id` stays explicit
 * beside `trip_id` precisely so that the credential holder is nameable: when
 * they leave the trip the binding goes to `orphaned` rather than quietly
 * carrying on with an ex-member's token.
 */

export interface ConnectionRow {
  id: number;
  trip_id: number;
  provider_id: string;
  owner_user_id: number;
  base_url: string;
  secrets: string | null;
  settings: string;
  allow_insecure_tls: number;
  capabilities: string | null;
  last_probe_at: string | null;
  last_probe_state: string;
  last_probe_error: string | null;
  created_at: string;
}

export interface LinkRow {
  id: number;
  trip_id: number;
  connection_id: number;
  provider_id: string;
  remote_scope_key: string;
  remote_root_id: string | null;
  remote_root_path: string | null;
  remote_label: string;
  direction: string;
  delete_policy: string;
  conflict_policy: string;
  sync_enabled: number;
  webhook_token: string | null;
  webhook_secret: string | null;
  webhook_subscription_id: string | null;
  remote_cursor: string | null;
  last_sync_at: string | null;
  last_sync_state: string;
  last_sync_error: string | null;
  failure_count: number;
  next_attempt_at: string | null;
}

interface ProviderFieldRow {
  field_key: string;
  /** i18n key suffix, never display text: the client resolves `docsync.<label>`. */
  label: string;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  secret: number;
  required: number;
  sort_order: number;
}

@Injectable()
export class DocSyncConfigService {
  constructor(
    private readonly db: DatabaseService,
    private readonly registry: DocumentProviderRegistry,
  ) {}

  // ── Provider metadata ──────────────────────────────────────────────────────

  /** Only providers the instance admin switched on may be configured. */
  enabledProviderIds(): string[] {
    return this.db.connection
      .prepare('SELECT id FROM document_providers WHERE enabled = 1 ORDER BY sort_order')
      .all()
      .map((r) => (r as { id: string }).id);
  }

  providerFields(providerId: string): ProviderFieldRow[] {
    // Every column the form needs, not just the three the secret bookkeeping
    // uses: the client renders the field from this row, and a missing `label`
    // turns into a literal "docsync.undefined" on screen.
    return this.db.connection
      .prepare(
        `SELECT field_key, label, input_type, placeholder, hint, secret, required, sort_order
           FROM document_provider_fields WHERE provider_id = ? ORDER BY sort_order`,
      )
      .all(providerId) as ProviderFieldRow[];
  }

  private secretKeys(providerId: string): string[] {
    return this.providerFields(providerId).filter((f) => f.secret === 1).map((f) => f.field_key);
  }

  /**
   * The display name whatever the enabled flag says. A binding outlives the
   * admin switching its provider off, and the client only gets names for the
   * providers that are still on, so without this it would show the raw id.
   */
  private providerName(providerId: string): string {
    const row = this.db.connection
      .prepare('SELECT name FROM document_providers WHERE id = ?')
      .get(providerId) as { name: string } | undefined;
    return row?.name ?? providerId;
  }

  // ── Connections ────────────────────────────────────────────────────────────

  getConnection(id: number): ConnectionRow | undefined {
    return this.db.connection.prepare('SELECT * FROM document_connections WHERE id = ?').get(id) as ConnectionRow | undefined;
  }

  listConnections(tripId: number): ConnectionRow[] {
    return this.db.connection
      .prepare('SELECT * FROM document_connections WHERE trip_id = ? ORDER BY id')
      .all(tripId) as ConnectionRow[];
  }

  /**
   * Turn a stored row into what an adapter needs. Secrets are decrypted here
   * and nowhere else, so there is one place to audit and one place that could
   * leak them into a log. The ref can write back what the adapter earns, which
   * is what makes it a saved connection's ref; see `saveEarnedSecret`.
   */
  toRef(row: ConnectionRow): DocumentConnectionRef {
    let settings: Record<string, string> = {};
    try {
      const parsed: unknown = JSON.parse(row.settings || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') settings[k] = v;
        }
      }
    } catch {
      settings = {};
    }
    return {
      connectionId: row.id,
      createdAt: row.created_at,
      ownerId: row.owner_user_id,
      baseUrl: row.base_url,
      secrets: decryptSecrets(row.secrets),
      settings,
      allowInsecureTls: row.allow_insecure_tls === 1,
      saveSecret: (key, value) => this.saveEarnedSecret(row.id, key, value),
    };
  }

  /**
   * Keep a secret the provider earned itself rather than one typed into the
   * form, or drop it with null. DSM's device token is the one there is: without
   * it, a restart would leave every two-factor NAS waiting for its owner to
   * type a fresh code.
   *
   * It lives in the same encrypted blob as the form's secrets, under a key no
   * form field has, and that is what keeps it out of every response
   * (`maskSecrets` reports form fields only) and out of the form's reach
   * (`mergeSecrets` writes form fields only).
   *
   * The blob is read back inside the transaction rather than taken from the
   * caller's ref: a sync run holds its ref for minutes, and writing that
   * snapshot back would undo a password the owner changed in the meantime.
   */
  saveEarnedSecret(connectionId: number, key: string, value: string | null): void {
    this.db.transaction(() => {
      const row = this.getConnection(connectionId);
      if (!row) return;
      const secrets = decryptSecrets(row.secrets);
      if (value === null) delete secrets[key];
      else secrets[key] = value;
      this.db.connection
        .prepare('UPDATE document_connections SET secrets = ? WHERE id = ?')
        .run(encryptSecrets(secrets), connectionId);
    });
  }

  /** What a client may see: no secret values, only whether each one is set. */
  publicConnection(row: ConnectionRow): Record<string, unknown> {
    const ref = this.toRef(row);
    return {
      id: row.id,
      tripId: row.trip_id,
      providerId: row.provider_id,
      ownerUserId: row.owner_user_id,
      baseUrl: row.base_url,
      settings: ref.settings,
      secrets: maskSecrets(ref.secrets, this.secretKeys(row.provider_id)),
      allowInsecureTls: row.allow_insecure_tls === 1,
      capabilities: row.capabilities ? safeParse(row.capabilities) : null,
      lastProbeAt: row.last_probe_at,
      lastProbeState: row.last_probe_state,
      lastProbeError: row.last_probe_error,
    };
  }

  /**
   * Validate a base URL before it is stored.
   *
   * A private address is stored WITH a warning rather than refused, because
   * self-hosting is the normal case here: a Paperless on 192.168.x is the
   * point of the feature, not an attack. That is the same call airtrail.service
   * and dawarich.service already made. What is refused is an address that the
   * SSRF guard rejects for a reason other than being private.
   */
  async validateBaseUrl(raw: string): Promise<DocResult<{ url: string; isPrivate: boolean }>> {
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (!trimmed) return { success: false, error: { code: 'unreachable', detail: 'empty url' } };
    const verdict = await checkSsrf(trimmed);
    if (!verdict.allowed && !verdict.isPrivate) {
      return { success: false, error: { code: 'ssrf_blocked', detail: verdict.error } };
    }
    return { success: true, data: { url: trimmed, isPrivate: verdict.isPrivate } };
  }

  /**
   * Create or update the trip's connection for one provider.
   *
   * Secrets that arrive blank or masked keep their stored value, so a client
   * that renders the form from a GET never has to hold the real credential.
   * A secret the provider earned itself is kept too, whatever the form sends.
   * DSM's device token is stored with the address and account it was issued
   * for, so an edit that points the connection somewhere else leaves it
   * unusable, and the adapter drops it on its next call.
   */
  async upsertConnection(
    tripId: number,
    userId: number,
    input: DocsyncConnectionInput,
  ): Promise<DocResult<ConnectionRow>> {
    const urlCheck = await this.validateBaseUrl(input.baseUrl);
    if (docFailed(urlCheck)) return { success: false, error: urlCheck.error };

    const fields = this.providerFields(input.providerId);
    const secretKeys = fields.filter((f) => f.secret === 1).map((f) => f.field_key);
    const plainKeys = fields.filter((f) => f.secret !== 1).map((f) => f.field_key);

    const existing = this.db.connection
      .prepare('SELECT * FROM document_connections WHERE trip_id = ? AND provider_id = ?')
      .get(tripId, input.providerId) as ConnectionRow | undefined;

    const storedSecrets = existing ? decryptSecrets(existing.secrets) : {};
    const nextSecrets = mergeSecrets(storedSecrets, input.credentials, secretKeys);

    const settings: Record<string, string> = {};
    for (const key of plainKeys) {
      if (key === 'allow_insecure_tls') continue;
      const submitted = input.credentials[key];
      if (submitted !== undefined) settings[key] = submitted;
      else if (existing) {
        const prev = this.toRef(existing).settings[key];
        if (prev !== undefined) settings[key] = prev;
      }
    }

    for (const f of fields) {
      if (f.required !== 1) continue;
      const present = f.secret === 1 ? !!nextSecrets[f.field_key] : !!settings[f.field_key] || f.field_key === 'base_url';
      if (!present) {
        return { success: false, error: { code: 'unauthorized', detail: `missing required field ${f.field_key}` } };
      }
    }

    const encrypted = encryptSecrets(nextSecrets);
    const settingsJson = JSON.stringify(settings);
    const insecure = input.allowInsecureTls ? 1 : 0;

    const row = this.db.transaction(() => {
      if (existing) {
        this.db.connection
          .prepare(
            `UPDATE document_connections
                SET base_url = ?, secrets = ?, settings = ?, allow_insecure_tls = ?,
                    owner_user_id = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
          )
          .run(urlCheck.data.url, encrypted, settingsJson, insecure, userId, existing.id);
        return this.getConnection(existing.id) as ConnectionRow;
      }
      const info = this.db.connection
        .prepare(
          `INSERT INTO document_connections (trip_id, provider_id, owner_user_id, base_url, secrets, settings, allow_insecure_tls)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(tripId, input.providerId, userId, urlCheck.data.url, encrypted, settingsJson, insecure);
      return this.getConnection(Number(info.lastInsertRowid)) as ConnectionRow;
    });

    return { success: true, data: row };
  }

  recordProbe(connectionId: number, state: 'ok' | 'failed', error: string | null, capabilities: unknown): void {
    this.db.connection
      .prepare(
        `UPDATE document_connections
            SET last_probe_at = CURRENT_TIMESTAMP, last_probe_state = ?, last_probe_error = ?,
                capabilities = COALESCE(?, capabilities), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .run(state, error, capabilities ? JSON.stringify(capabilities) : null, connectionId);
  }

  /**
   * Deleting a connection leaves every document in place. It unbinds, nothing
   * more: the same promise Dawarich's disconnect makes, and the only version
   * of this action that is safe to offer without a confirmation dialog.
   */
  deleteConnection(id: number): void {
    this.db.connection.prepare('DELETE FROM document_connections WHERE id = ?').run(id);
  }

  // ── Trip bindings ──────────────────────────────────────────────────────────

  listLinks(tripId: number): LinkRow[] {
    return this.db.connection
      .prepare('SELECT * FROM trip_document_links WHERE trip_id = ? ORDER BY id')
      .all(tripId) as LinkRow[];
  }

  getLink(id: number): LinkRow | undefined {
    return this.db.connection.prepare('SELECT * FROM trip_document_links WHERE id = ?').get(id) as LinkRow | undefined;
  }

  getLinkByToken(token: string): LinkRow | undefined {
    return this.db.connection
      .prepare('SELECT * FROM trip_document_links WHERE webhook_token = ?')
      .get(token) as LinkRow | undefined;
  }

  toScopeRef(link: LinkRow): DocumentScopeRef {
    return {
      linkId: link.id,
      tripId: link.trip_id,
      scopeKey: link.remote_scope_key,
      remoteRootId: link.remote_root_id,
      remoteRootPath: link.remote_root_path,
      cursor: link.remote_cursor,
    };
  }

  /**
   * The anchor fields (`remoteRootId`, `remoteRootPath`, `remoteLabel`) are
   * what the picker was handed by `listScopes` or `createScope` a moment
   * earlier, sent back by the client. Taking them on trust is fine: only the
   * trip owner or an instance admin gets here, and an anchor typed in by hand
   * still goes through the connection's own credential, so it cannot open
   * anything that credential could not open anyway.
   */
  createLink(tripId: number, userId: number, input: DocsyncLinkInput): DocResult<LinkRow> {
    const conn = this.getConnection(input.connectionId);
    if (!conn || conn.trip_id !== tripId) {
      return { success: false, error: { code: 'not_found', detail: 'connection not found for this trip' } };
    }
    const existing = this.db.connection
      .prepare('SELECT * FROM trip_document_links WHERE trip_id = ? AND connection_id = ? AND remote_scope_key = ?')
      .get(tripId, input.connectionId, input.scopeKey) as LinkRow | undefined;
    if (existing) return { success: true, data: existing };

    // A per-link token, so revoking one binding cannot be used to poke another,
    // and so a leaked webhook URL identifies exactly one trip.
    const token = crypto.randomBytes(24).toString('base64url');
    const secret = crypto.randomBytes(24).toString('base64url');

    const info = this.db.connection
      .prepare(
        `INSERT INTO trip_document_links
           (trip_id, connection_id, provider_id, remote_scope_key, remote_root_id, remote_root_path,
            remote_label, direction, delete_policy, conflict_policy, sync_enabled,
            webhook_token, webhook_secret, created_by, next_attempt_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .run(
        tripId,
        input.connectionId,
        conn.provider_id,
        input.scopeKey,
        input.remoteRootId ?? null,
        input.remoteRootPath ?? null,
        input.remoteLabel ?? '',
        input.direction,
        input.deletePolicy,
        input.conflictPolicy,
        input.syncEnabled ? 1 : 0,
        token,
        String(encryptSecrets({ webhook: secret })),
        userId,
      );
    return { success: true, data: this.getLink(Number(info.lastInsertRowid)) as LinkRow };
  }

  updateLink(id: number, patch: Partial<DocsyncLinkInput>): LinkRow | undefined {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (patch.direction !== undefined) { sets.push('direction = ?'); values.push(patch.direction); }
    if (patch.deletePolicy !== undefined) { sets.push('delete_policy = ?'); values.push(patch.deletePolicy); }
    if (patch.conflictPolicy !== undefined) { sets.push('conflict_policy = ?'); values.push(patch.conflictPolicy); }
    if (patch.syncEnabled !== undefined) { sets.push('sync_enabled = ?'); values.push(patch.syncEnabled ? 1 : 0); }
    if (patch.remoteLabel !== undefined) { sets.push('remote_label = ?'); values.push(patch.remoteLabel); }
    if (sets.length === 0) return this.getLink(id);
    sets.push('updated_at = CURRENT_TIMESTAMP');
    this.db.connection.prepare(`UPDATE trip_document_links SET ${sets.join(', ')} WHERE id = ?`).run(...values, id);
    return this.getLink(id);
  }

  /**
   * Unbinding keeps both copies and drops the pairing rows. It never deletes a
   * document on either side. A user who wants that does it deliberately, in
   * the system that holds the file.
   */
  deleteLink(id: number): void {
    this.db.transaction(() => {
      this.db.connection.prepare('DELETE FROM document_sync_items WHERE link_id = ?').run(id);
      this.db.connection.prepare('DELETE FROM trip_document_links WHERE id = ?').run(id);
    });
  }

  webhookSecret(link: LinkRow): string {
    return decryptSecrets(link.webhook_secret).webhook ?? '';
  }

  /** The masked view a client gets, with the webhook URL it may need to paste. */
  publicLink(link: LinkRow, webhookBaseUrl: string | null): Record<string, unknown> {
    return {
      id: link.id,
      tripId: link.trip_id,
      connectionId: link.connection_id,
      providerId: link.provider_id,
      providerName: this.providerName(link.provider_id),
      scopeKey: link.remote_scope_key,
      remoteRootId: link.remote_root_id,
      remoteRootPath: link.remote_root_path,
      remoteLabel: link.remote_label,
      direction: link.direction,
      deletePolicy: link.delete_policy,
      conflictPolicy: link.conflict_policy,
      syncEnabled: link.sync_enabled === 1,
      lastSyncAt: link.last_sync_at,
      lastSyncState: link.last_sync_state,
      lastSyncError: link.last_sync_error,
      failureCount: link.failure_count,
      // Shown so a user can paste it into a provider that will not let TREK
      // subscribe on its own (Papra, and Nextcloud without admin rights).
      webhookUrl: webhookBaseUrl && link.webhook_token
        ? `${webhookBaseUrl}/api/docsync/webhook/${link.webhook_token}`
        : null,
      webhookSecret: link.webhook_secret ? DOCSYNC_SECRET_MASK : null,
    };
  }

  /**
   * Bindings whose credential owner is no longer on the trip.
   *
   * Checked on every run rather than hooked to member removal, because a
   * membership can also disappear through a trip transfer or a direct DB edit,
   * and a binding that keeps using an ex-member's token is the kind of thing
   * nobody notices until it is a complaint.
   */
  markOrphanedLinks(): number {
    const info = this.db.connection
      .prepare(
        `UPDATE trip_document_links
            SET last_sync_state = 'orphaned', sync_enabled = 0, updated_at = CURRENT_TIMESTAMP
          WHERE sync_enabled = 1
            AND last_sync_state != 'orphaned'
            AND connection_id IN (
              SELECT c.id FROM document_connections c
               WHERE c.owner_user_id NOT IN (
                 SELECT tm.user_id FROM trip_members tm WHERE tm.trip_id = c.trip_id
                 UNION SELECT t.user_id FROM trips t WHERE t.id = c.trip_id
               )
            )`,
      )
      .run();
    return info.changes;
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
