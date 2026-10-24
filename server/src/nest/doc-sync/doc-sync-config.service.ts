import { DocumentConnections } from '../../db/entities/DocumentConnections.entity';
import { DocumentProviderFields } from '../../db/entities/DocumentProviderFields.entity';
import { DocumentProviders } from '../../db/entities/DocumentProviders.entity';
import { DocumentSyncItems } from '../../db/entities/DocumentSyncItems.entity';
import { TripDocumentLinks } from '../../db/entities/TripDocumentLinks.entity';
import { Trips } from '../../db/entities/Trips.entity';
import type {
  DocumentConnectionRow,
  DocumentConnectionsRepository,
} from '../../db/repositories/DocumentConnections.repository';
import type {
  DocumentProviderFieldRow,
  DocumentProviderFieldsRepository,
} from '../../db/repositories/DocumentProviderFields.repository';
import type {
  DocumentProviderCatalogRow,
  DocumentProvidersRepository,
} from '../../db/repositories/DocumentProviders.repository';
import type { DocumentSyncItemsRepository } from '../../db/repositories/DocumentSyncItems.repository';
import type {
  TripDocumentLinkPatch,
  TripDocumentLinkRow,
  TripDocumentLinksRepository,
} from '../../db/repositories/TripDocumentLinks.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { User } from '../../types';
import { checkSsrf } from '../../utils/ssrfGuard';
import { UnitOfWork } from '../database/unit-of-work';
import { decryptSecrets, encryptSecrets, maskSecrets, mergeSecrets } from './doc-sync-secrets';
import { sameOrigin } from './doc-sync.helpers';
import type { DocumentConnectionRef, DocumentScopeRef, DocResult } from './document-provider';
import { docFailed } from './document-provider';
import { DocumentProviderRegistry } from './document-provider.registry';
import { InjectRepository } from '@mikro-orm/nestjs';
import { HttpException, Injectable } from '@nestjs/common';
import { DOCSYNC_SECRET_MASK, type DocsyncConnectionInput, type DocsyncLinkInput } from '@trek/shared';

import crypto from 'crypto';

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
 *
 * R2 (Plan 3h Task 5): also owns the two controller-level statements that
 * gate a trip's bindings (`assertCanManage`, DSCTRL1) and the provider
 * catalog composition (`providersCatalog`, DSCTRL2) — both used to live
 * directly in `DocSyncController`, the one architecture deviation this
 * program's whole gather ever found (raw SQL inside a `@Controller`).
 */

export type ConnectionRow = DocumentConnectionRow;
export type LinkRow = TripDocumentLinkRow;
type ProviderFieldRow = DocumentProviderFieldRow;

@Injectable()
export class DocSyncConfigService {
  constructor(
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(DocumentProviders) private readonly providers: DocumentProvidersRepository,
    @InjectRepository(DocumentProviderFields) private readonly providerFieldsRepo: DocumentProviderFieldsRepository,
    @InjectRepository(DocumentConnections) private readonly connections: DocumentConnectionsRepository,
    @InjectRepository(TripDocumentLinks) private readonly links: TripDocumentLinksRepository,
    @InjectRepository(DocumentSyncItems) private readonly items: DocumentSyncItemsRepository,
    private readonly registry: DocumentProviderRegistry,
    private readonly uow: UnitOfWork,
  ) {}

  // ── Provider metadata ──────────────────────────────────────────────────────

  /** DSC1 — Only providers the instance admin switched on may be configured. */
  async enabledProviderIds(): Promise<string[]> {
    return this.providers.listEnabledIds();
  }

  /** DSC2 — every column the form needs, not just the three the secret bookkeeping uses. */
  async providerFields(providerId: string): Promise<ProviderFieldRow[]> {
    return this.providerFieldsRepo.listForProvider(providerId);
  }

  private async secretKeys(providerId: string): Promise<string[]> {
    return (await this.providerFields(providerId)).filter((f) => f.secret === 1).map((f) => f.field_key);
  }

  /**
   * DSC3 — the display name whatever the enabled flag says. A binding
   * outlives the admin switching its provider off, and the client only gets
   * names for the providers that are still on, so without this it would
   * show the raw id.
   */
  private async providerName(providerId: string): Promise<string> {
    return (await this.providers.findName(providerId)) ?? providerId;
  }

  // ── R2 — the controller's own two statements ────────────────────────────

  /**
   * DSCTRL1 (`DocSyncController.assertCanManage`) — the trip owner or an
   * instance admin, the same rule as `canManageDocSync` on the client.
   * Checked here rather than through `@RequirePermission`: the permission
   * table has no "manage integrations" action and inventing one would grant
   * it to every trip_member by default, which is the opposite of what a
   * credential this broad needs. The 403 still says "owner": an admin never
   * sees it, and to everybody who does, the owner is the person to ask.
   */
  async assertCanManage(tripId: number, user: User): Promise<void> {
    if (user.role === 'admin') return;
    const ownerId = await this.trips.getOwnerId(tripId);
    if (ownerId === null) throw new HttpException('Trip not found', 404);
    if (Number(ownerId) !== Number(user.id)) {
      throw new HttpException('Only the trip owner can change document sync', 403);
    }
  }

  /**
   * DSCTRL2 (`DocSyncController.providers`) — which providers this instance
   * has switched on, with their form fields, composed exactly as the
   * controller used to: `available` (whether a registered adapter exists)
   * and `fields` (booleanised `secret`/`required`) around the raw catalog
   * read. A wider column list than {@link enabledProviderIds} (DSC1) — kept
   * its own method, R2's own instruction not to unify near-duplicate reads
   * with different shapes.
   */
  async providersCatalog(): Promise<
    Array<
      DocumentProviderCatalogRow & {
        available: boolean;
        fields: Array<Omit<ProviderFieldRow, 'secret' | 'required'> & { secret: boolean; required: boolean }>;
      }
    >
  > {
    const rows = await this.providers.listEnabledCatalog();
    return await Promise.all(
      rows.map(async (p) => ({
        ...p,
        available: !!this.registry.get(p.id),
        fields: (await this.providerFields(p.id)).map((f) => ({
          ...f,
          secret: f.secret === 1,
          required: f.required === 1,
        })),
      })),
    );
  }

  // ── Connections ────────────────────────────────────────────────────────────

  async getConnection(id: number): Promise<ConnectionRow | undefined> {
    return this.connections.findById(id);
  }

  async listConnections(tripId: number): Promise<ConnectionRow[]> {
    return this.connections.listForTrip(tripId);
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
      createdAt: row.created_at ?? '',
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
  async saveEarnedSecret(connectionId: number, key: string, value: string | null): Promise<void> {
    await this.uow.transactional(async () => {
      const row = await this.getConnection(connectionId);
      if (!row) return;
      const secrets = decryptSecrets(row.secrets);
      if (value === null) delete secrets[key];
      else secrets[key] = value;
      await this.connections.updateSecrets(connectionId, encryptSecrets(secrets));
    });
  }

  /** What a client may see: no secret values, only whether each one is set. */
  async publicConnection(row: ConnectionRow): Promise<Record<string, unknown>> {
    const ref = this.toRef(row);
    return {
      id: row.id,
      tripId: row.trip_id,
      providerId: row.provider_id,
      ownerUserId: row.owner_user_id,
      baseUrl: row.base_url,
      settings: ref.settings,
      secrets: maskSecrets(ref.secrets, await this.secretKeys(row.provider_id)),
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
   *
   * Only for the address the credential was stored against, the same rule the
   * probe route applies. Written under a new host, a blank form would carry
   * the stored token to a server of the caller's choosing: a trip changes
   * hands with its connection, and the new owner, or an instance admin, could
   * point the previous owner's Paperless token at a machine of their own and
   * read it off the first request. A new address takes the credentials typed
   * for it and nothing stored, DSM's device token included: it was issued for
   * the old address and account and would only be sent somewhere it does not
   * belong.
   *
   * `owner_user_id` names whose credential the connection runs under. It moves
   * to the caller only when the caller typed every required secret in, so the
   * connection now runs on a credential of their own; an edit that keeps the
   * stored one keeps its owner, or the orphan check would read the previous
   * owner's token as the caller's own. An optional secret alone (DSM's
   * one-time code) does not count: it is used against the stored password.
   */
  async upsertConnection(
    tripId: number,
    userId: number,
    input: DocsyncConnectionInput,
  ): Promise<DocResult<ConnectionRow>> {
    const urlCheck = await this.validateBaseUrl(input.baseUrl);
    if (docFailed(urlCheck)) return { success: false, error: urlCheck.error };

    const fields = await this.providerFields(input.providerId);
    const secretKeys = fields.filter((f) => f.secret === 1).map((f) => f.field_key);
    const plainKeys = fields.filter((f) => f.secret !== 1).map((f) => f.field_key);

    const existing = await this.connections.findForTripAndProvider(tripId, input.providerId);

    const storedSecrets = existing ? decryptSecrets(existing.secrets) : {};
    // What the form actually filled in, by the same rule the merge below uses.
    const typedSecrets = mergeSecrets({}, input.credentials, secretKeys);
    const sameTarget = !existing || sameOrigin(existing.base_url, urlCheck.data.url);
    if (!sameTarget) {
      const kept = fields.find(
        (f) => f.secret === 1 && f.required === 1 && !!storedSecrets[f.field_key] && !typedSecrets[f.field_key],
      );
      if (kept) {
        return {
          success: false,
          error: { code: 'unauthorized', detail: `${kept.field_key} has to be entered again for a new address` },
        };
      }
    }
    const nextSecrets = sameTarget ? mergeSecrets(storedSecrets, input.credentials, secretKeys) : typedSecrets;
    const ownCredential = fields.every((f) => f.secret !== 1 || f.required !== 1 || !!typedSecrets[f.field_key]);
    const ownerId = existing && !ownCredential ? existing.owner_user_id : userId;

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
      const present =
        f.secret === 1 ? !!nextSecrets[f.field_key] : !!settings[f.field_key] || f.field_key === 'base_url';
      if (!present) {
        return { success: false, error: { code: 'unauthorized', detail: `missing required field ${f.field_key}` } };
      }
    }

    const encrypted = encryptSecrets(nextSecrets);
    const settingsJson = JSON.stringify(settings);
    const insecure = input.allowInsecureTls ? 1 : 0;

    const row = await this.uow.transactional(async () => {
      if (existing) {
        await this.connections.updateConnection(existing.id, {
          base_url: urlCheck.data.url,
          secrets: encrypted,
          settings: settingsJson,
          allow_insecure_tls: insecure,
          owner_user_id: ownerId,
        });
        return (await this.getConnection(existing.id)) as ConnectionRow;
      }
      const id = await this.connections.insertConnection({
        trip_id: tripId,
        provider_id: input.providerId,
        owner_user_id: userId,
        base_url: urlCheck.data.url,
        secrets: encrypted,
        settings: settingsJson,
        allow_insecure_tls: insecure,
      });
      return (await this.getConnection(id)) as ConnectionRow;
    });

    return { success: true, data: row };
  }

  async recordProbe(
    connectionId: number,
    state: 'ok' | 'failed',
    error: string | null,
    capabilities: unknown,
  ): Promise<void> {
    await this.connections.recordProbe(connectionId, state, error, capabilities ? JSON.stringify(capabilities) : null);
  }

  /**
   * Deleting a connection leaves every document in place. It unbinds, nothing
   * more: the same promise Dawarich's disconnect makes, and the only version
   * of this action that is safe to offer without a confirmation dialog.
   */
  async deleteConnection(id: number): Promise<void> {
    await this.connections.deleteById(id);
  }

  // ── Trip bindings ──────────────────────────────────────────────────────────

  async listLinks(tripId: number): Promise<LinkRow[]> {
    return this.links.listForTrip(tripId);
  }

  async getLink(id: number): Promise<LinkRow | undefined> {
    return this.links.findById(id);
  }

  async getLinkByToken(token: string): Promise<LinkRow | undefined> {
    return this.links.findByToken(token);
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
  async createLink(tripId: number, userId: number, input: DocsyncLinkInput): Promise<DocResult<LinkRow>> {
    const conn = await this.getConnection(input.connectionId);
    if (!conn || conn.trip_id !== tripId) {
      return { success: false, error: { code: 'not_found', detail: 'connection not found for this trip' } };
    }
    const existing = await this.links.findByTripConnectionScope(tripId, input.connectionId, input.scopeKey);
    if (existing) return { success: true, data: existing };

    // A per-link token, so revoking one binding cannot be used to poke another,
    // and so a leaked webhook URL identifies exactly one trip.
    const token = crypto.randomBytes(24).toString('base64url');
    const secret = crypto.randomBytes(24).toString('base64url');

    const id = await this.links.insertLink({
      trip_id: tripId,
      connection_id: input.connectionId,
      provider_id: conn.provider_id,
      remote_scope_key: input.scopeKey,
      remote_root_id: input.remoteRootId ?? null,
      remote_root_path: input.remoteRootPath ?? null,
      remote_label: input.remoteLabel ?? '',
      direction: input.direction,
      delete_policy: input.deletePolicy,
      conflict_policy: input.conflictPolicy,
      sync_enabled: input.syncEnabled ? 1 : 0,
      webhook_token: token,
      webhook_secret: String(encryptSecrets({ webhook: secret })),
      created_by: userId,
    });
    return { success: true, data: (await this.getLink(id)) as LinkRow };
  }

  async updateLink(id: number, patch: Partial<DocsyncLinkInput>): Promise<LinkRow | undefined> {
    // Sync automatically is the way back for an orphaned binding, but only once
    // the person whose credential it runs under is on the trip again. Until
    // then the switch stays off rather than handing that credential back.
    const current = patch.syncEnabled === true ? await this.getLink(id) : undefined;
    let resetNever = false;
    if (current?.last_sync_state === 'orphaned') {
      if (await this.ownerLeft(current.connection_id)) patch = { ...patch, syncEnabled: undefined };
      else resetNever = true;
    }
    const fields: TripDocumentLinkPatch = {};
    if (patch.direction !== undefined) fields.direction = patch.direction;
    if (patch.deletePolicy !== undefined) fields.delete_policy = patch.deletePolicy;
    if (patch.conflictPolicy !== undefined) fields.conflict_policy = patch.conflictPolicy;
    if (patch.syncEnabled !== undefined) fields.sync_enabled = patch.syncEnabled ? 1 : 0;
    if (patch.remoteLabel !== undefined) fields.remote_label = patch.remoteLabel;
    if (resetNever) fields.last_sync_state = 'never';
    if (Object.keys(fields).length === 0) return await this.getLink(id);
    await this.links.updateFields(id, fields);
    return await this.getLink(id);
  }

  /**
   * Unbinding keeps both copies and drops the pairing rows. It never deletes a
   * document on either side. A user who wants that does it deliberately, in
   * the system that holds the file.
   */
  async deleteLink(id: number): Promise<void> {
    await this.uow.transactional(async () => {
      await this.items.deleteByLink(id);
      await this.links.deleteById(id);
    });
  }

  /**
   * DSCTRL3 (R2 — moved off the controller) — the webhook-registration
   * follow-up: `UPDATE trip_document_links SET webhook_subscription_id = ?
   * WHERE id = ?`, run after `createLink`'s provider `registerWebhook` call
   * succeeds.
   */
  async setWebhookSubscriptionId(linkId: number, subscriptionId: string): Promise<void> {
    await this.links.setWebhookSubscriptionId(linkId, subscriptionId);
  }

  webhookSecret(link: LinkRow): string {
    return decryptSecrets(link.webhook_secret).webhook ?? '';
  }

  /** The masked view a client gets, with the webhook URL it may need to paste. */
  async publicLink(link: LinkRow, webhookBaseUrl: string | null): Promise<Record<string, unknown>> {
    return {
      id: link.id,
      tripId: link.trip_id,
      connectionId: link.connection_id,
      providerId: link.provider_id,
      providerName: await this.providerName(link.provider_id),
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
      // subscribe on its own (Papra, and Nextcloud without admin rights). Not
      // for a provider that takes no webhook at all: an address with nowhere
      // to paste it only promises what the timer delivers anyway.
      webhookUrl:
        webhookBaseUrl && link.webhook_token && (await this.takesWebhook(link))
          ? `${webhookBaseUrl}/api/docsync/webhook/${link.webhook_token}`
          : null,
      webhookSecret: link.webhook_secret ? DOCSYNC_SECRET_MASK : null,
    };
  }

  /**
   * Whether the store behind a binding can call TREK at all, as the last probe
   * recorded it. Unknown counts as yes: a connection that was never probed
   * still gets the address, and a stale answer costs nothing but a line.
   */
  private async takesWebhook(link: LinkRow): Promise<boolean> {
    const recorded = (await this.getConnection(link.connection_id))?.capabilities;
    const caps = recorded ? safeParse(recorded) : null;
    return !(caps && typeof caps === 'object' && (caps as { push?: unknown }).push === 'none');
  }

  /**
   * Whether a binding must not run. The sweep below marks it, but only while
   * Sync automatically is on, so a paused binding whose owner left is not
   * marked; every path that starts a run asks here rather than reading the
   * mark alone.
   */
  async isOrphaned(link: LinkRow): Promise<boolean> {
    return link.last_sync_state === 'orphaned' || (await this.ownerLeft(link.connection_id));
  }

  /**
   * DSC20 — whether a connection's credential owner is no longer on its
   * trip. Consumes {@link DocumentConnectionsRepository.listOrphanedIds},
   * the ONE shared predicate DSC20 (this single-link check) and DSC21
   * (`markOrphanedLinks`'s bulk sweep, below) both draw from — the legacy
   * code re-implemented the identical `NOT IN (... UNION ...)` subquery at
   * both call sites; this is the single converted version.
   */
  private async ownerLeft(connectionId: number): Promise<boolean> {
    return (await this.connections.listOrphanedIds()).includes(connectionId);
  }

  /**
   * DSC21 — bindings whose credential owner is no longer on the trip.
   *
   * Checked on every run rather than hooked to member removal, because a
   * membership can also disappear through a trip transfer or a direct DB edit,
   * and a binding that keeps using an ex-member's token is the kind of thing
   * nobody notices until it is a complaint. Shares {@link ownerLeft}'s
   * predicate (via {@link DocumentConnectionsRepository.listOrphanedIds}) —
   * the bulk-sweep variant of the same underlying condition.
   */
  async markOrphanedLinks(): Promise<number> {
    const ids = await this.connections.listOrphanedIds();
    return await this.links.markOrphanedByConnectionIds(ids);
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
