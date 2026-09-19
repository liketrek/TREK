import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * Document provider contracts: two-way sync between a trip's documents and a
 * self-hosted document store (Paperless-ngx, Papra, Nextcloud, OpenCloud,
 * Synology Drive).
 *
 * Three deliberate decisions shape every schema below.
 *
 * **The connection belongs to the trip, not to the person.** Every other
 * integration in TREK is per user (`users.immich_*`, `dawarich_connections`,
 * even `trip_album_links` carries a `user_id`), and photos are shared only
 * through an opt-in `shared` flag. That model cannot satisfy "everyone on the
 * trip sees the same documents": it would make a document's visibility depend
 * on whose credentials fetched it. So a trip is bound to exactly one
 * connection, the server talks to the provider under that one identity, and
 * who may see what is decided by TREK's own trip membership, never by the
 * provider. The provider never learns that TREK has members.
 *
 * **TREK keeps the bytes.** A synced document is an ordinary `trip_files` row,
 * so download, trash, offline cache, PDF export and backup keep working
 * untouched, and a provider outage does not blank out a trip that starts
 * tomorrow. The provider is a partner, not a disk.
 *
 * **Deletion never crosses the boundary on its own.** A file that disappears
 * upstream is recorded as missing and waits for a human. An empty listing from
 * an unmounted share must never read as "everything was deleted".
 */

// ── Provider identity ────────────────────────────────────────────────────────

/**
 * Nextcloud and OpenCloud are separate ids on purpose even though one WebDAV
 * adapter serves both: the admin toggles, the setup hints and the scope picker
 * differ (a Nextcloud folder with an `oc:fileid`, an OpenCloud space with a
 * `driveId`), and an operator looking at the addon shelf wants to see the
 * product they run.
 */
export const DOCUMENT_PROVIDER_IDS = ['paperless', 'papra', 'nextcloud', 'opencloud', 'synologydrive'] as const;

export const documentProviderIdSchema = z.enum(DOCUMENT_PROVIDER_IDS);
export type DocumentProviderId = z.infer<typeof documentProviderIdSchema>;

/** Placeholder returned instead of a stored secret. Never the secret itself. */
export const DOCSYNC_SECRET_MASK = '••••••••';

// ── Connection (per trip, created by a trip admin) ───────────────────────────

/**
 * The credential fields are provider-specific and described by rows in
 * `document_provider_fields`, so the payload is an open map rather than a fixed
 * shape. It is still validated: keys must look like field keys and values are
 * length-capped, which is what keeps an oversized blob out of the encrypted
 * column.
 */
export const docsyncCredentialsSchema = z.record(z.string().regex(/^[a-z0-9_]{1,40}$/), z.string().max(4096));

export const docsyncConnectionInputSchema = z.object({
  providerId: documentProviderIdSchema,
  /** Instance origin. The adapter appends its own API path. */
  baseUrl: z.string().trim().min(1).max(2048),
  /**
   * Secret and non-secret fields together, exactly as the generic form renders
   * them. A secret that is omitted, blank or the mask keeps the stored value.
   * That is the same rule the photo providers and Dawarich already use, so the
   * client never has to hold a secret it was given back.
   */
  credentials: docsyncCredentialsSchema.optional().default({}),
  /** LAN instances routinely run self-signed TLS. Default off, never on. */
  allowInsecureTls: z.boolean().optional().default(false),
});
export type DocsyncConnectionInput = z.infer<typeof docsyncConnectionInputSchema>;

/** Probe a set of form values before anything is stored. */
export const docsyncConnectionTestSchema = docsyncConnectionInputSchema;

// ── Scope (which slice of the provider belongs to this trip) ─────────────────

/**
 * A scope key is opaque to everything except its own adapter. It is normalised,
 * never empty, and carries its own kind so a stored binding stays readable
 * after a restore: `tag:12`, `org:org_x/tag:tag_y`, `fileid:437`,
 * `drive:storage-users-1$89ad…`, `path:/trek/japan-2026`.
 *
 * It is NOT null-able, and that is load-bearing: SQLite compares NULLs as
 * distinct, so a unique index over nullable anchor columns would happily accept
 * unlimited duplicate bindings for the same folder.
 */
export const docsyncScopeKeySchema = z.string().trim().min(1).max(512);

export const docsyncScopeOptionSchema = z.object({
  scopeKey: docsyncScopeKeySchema,
  /** What a human sees in the picker: folder name, tag name, space name. */
  label: z.string().max(512),
  /** Stable provider-side id where one exists (fileid, driveId, tag id). */
  remoteRootId: z.string().max(512).nullable(),
  /** Human-readable location, for the "where do my files live" line. */
  remoteRootPath: z.string().max(2048).nullable(),
});
export type DocsyncScopeOption = z.infer<typeof docsyncScopeOptionSchema>;

/**
 * Creating a scope rather than picking one. Only providers with a container
 * concept accept this (a WebDAV folder, an OpenCloud space, a Paperless tag,
 * a Papra tag); the adapter reports whether it can.
 *
 * The connection comes from the path (`connections/:connectionId/scopes`) and
 * is not repeated here. A copy in the body was never read and only let one
 * request name two different connections; a client that still sends it has
 * the key stripped rather than refused.
 */
export const docsyncScopeCreateSchema = z.object({
  /** Name for the new folder, tag or space. */
  name: z.string().trim().min(1).max(200),
});

// ── Binding a trip to a scope ────────────────────────────────────────────────

/**
 * `both` is the point of the feature. The one-way modes exist because a shared
 * Paperless holding a household's private papers is a place some people will
 * only ever want to read from, and forcing a write path on them would mean
 * they do not turn the feature on at all.
 */
export const docsyncDirectionSchema = z.enum(['both', 'pull', 'push']);

/**
 * What happens to the other side when a document is deleted here.
 *
 * `unlink` is the default and the only safe one: the pairing is dropped, both
 * copies stay. `trash` propagates into the provider's own recycle bin (never a
 * hard delete, which several of these APIs do not even expose to a token) and
 * has to be chosen deliberately, because a misclick in a file manager should
 * not empty a trip four people are travelling on.
 */
export const docsyncDeletePolicySchema = z.enum(['unlink', 'trash']);

/** Who wins when both sides changed since the last agreed state. */
export const docsyncConflictPolicySchema = z.enum(['manual', 'trek_wins', 'provider_wins']);

export const docsyncLinkInputSchema = z.object({
  connectionId: idSchema,
  scopeKey: docsyncScopeKeySchema,
  remoteRootId: z.string().max(512).nullable().optional(),
  remoteRootPath: z.string().max(2048).nullable().optional(),
  remoteLabel: z.string().max(512).optional().default(''),
  direction: docsyncDirectionSchema.optional().default('both'),
  deletePolicy: docsyncDeletePolicySchema.optional().default('unlink'),
  conflictPolicy: docsyncConflictPolicySchema.optional().default('manual'),
  syncEnabled: z.boolean().optional().default(true),
});
export type DocsyncLinkInput = z.infer<typeof docsyncLinkInputSchema>;

/**
 * Which folder or tag a binding points at is fixed once it exists: every
 * pairing in `document_sync_items` was made against that container, and moving
 * it would leave them all pointing somewhere else. The root fields are left out
 * rather than ignored: they were accepted and silently dropped, so a client
 * sending one was told the move had happened.
 *
 * Spelled out instead of derived from the input schema with `.partial()`. In
 * Zod 4 a `.default()` still fires inside an optional field, so the derived
 * version filled in every default the patch left out: `{ syncEnabled: false }`
 * arrived as a full set of settings and reset direction, both policies and the
 * label with it. A pull-only binding turned two-way the moment somebody paused
 * it.
 */
export const docsyncLinkUpdateSchema = z
  .object({
    remoteLabel: z.string().max(512),
    direction: docsyncDirectionSchema,
    deletePolicy: docsyncDeletePolicySchema,
    conflictPolicy: docsyncConflictPolicySchema,
    syncEnabled: z.boolean(),
  })
  .partial();

// ── Sync state ───────────────────────────────────────────────────────────────

/**
 * `needs_reauth`, `scope_lost` and `orphaned` are separate from plain `failed`
 * because each needs a different human action, and a single "error" state would
 * hide which one. `scope_lost` means the folder or tag the trip is bound to no
 * longer exists: someone renamed or deleted it upstream. `orphaned` means the
 * person whose credentials drive this binding left the trip.
 */
export const docsyncLinkStateSchema = z.enum([
  'never',
  'ok',
  'partial',
  'failed',
  'needs_reauth',
  'scope_lost',
  'orphaned',
]);

/**
 * Per-document state. `rejected_type` and `too_large` are visible states rather
 * than silent skips: a Paperless that refuses .gpx and a TREK that refuses .svg
 * both drop files on the floor otherwise, and the person who uploaded them has
 * no way to find out.
 */
export const docsyncItemStateSchema = z.enum([
  'pending',
  'synced',
  'conflict',
  'rejected_type',
  'too_large',
  'error',
  'remote_missing',
  'local_deleted',
  'scope_drift',
]);

/**
 * Failure reasons travel as codes, not as upstream text. A provider answers in
 * English, or with an HTML login page from a reverse proxy, and neither belongs
 * in a German user's file list. The client resolves these through i18n; the
 * detail string stays for the self-hoster's log.
 */
export const DOCSYNC_ERROR_CODES = [
  'unreachable',
  'tls_untrusted',
  'unauthorized',
  'forbidden',
  'not_found',
  'scope_missing',
  'rate_limited',
  'too_large',
  'unsupported_type',
  'quota_exceeded',
  'conflict',
  'checksum_mismatch',
  'provider_error',
  'timeout',
  'ssrf_blocked',
  'mass_delete_guard',
  'unknown',
] as const;
export const docsyncErrorCodeSchema = z.enum(DOCSYNC_ERROR_CODES);
export type DocsyncErrorCode = z.infer<typeof docsyncErrorCodeSchema>;

// ── Conflict resolution ──────────────────────────────────────────────────────

export const docsyncResolveConflictSchema = z.object({
  /** Which side becomes the agreed state. */
  keep: z.enum(['trek', 'provider', 'both']),
});

/** Manual "sync now", so a user never has to wait out the poll interval. */
export const docsyncSyncNowSchema = z.object({
  /** Skip the cursor short-circuit and enumerate both sides in full. */
  full: z.boolean().optional().default(false),
});
