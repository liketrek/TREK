import type { Readable } from 'node:stream';
import type { DocsyncErrorCode } from '@trek/shared';

/**
 * The adapter seam for document providers.
 *
 * Shaped after `PhotoProvider` (memories/photo-provider.ts): interface, symbol
 * token, registry. One difference is deliberate: that interface only covers
 * handing out bytes, and everything else (settings, test, search, album list)
 * is dispatched through hand-written `if (provider === 'immich')` branches in
 * the service, the MCP tools and two separate controllers. With two providers
 * that is untidy; with five it would be five parallel controllers and five
 * branches per tool. So every operation the sync core needs lives here, and the
 * core never learns which provider it is talking to.
 *
 * Capability differences are answered by data (`DocumentProviderCapabilities`),
 * never by type-switching: the core asks what a provider can do and plans
 * accordingly. Synology FileStation has no change feed and no stable file id,
 * so the core must be correct with nothing but a full enumeration, and because
 * the weakest provider sets the model, every provider is driven the same way.
 * A webhook is only ever "look now", never a source of truth.
 */

/** Uniform result shape, mirroring `ServiceResult` in memories.helpers.ts. */
export type DocResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: DocsyncErrorCode; detail?: string; status?: number } };

export type DocFailure = { success: false; error: { code: DocsyncErrorCode; detail?: string; status?: number } };

export const docOk = <T>(data: T): DocResult<T> => ({ success: true, data });
export const docFail = <T>(
  code: DocsyncErrorCode,
  detail?: string,
  status?: number,
): DocResult<T> => ({ success: false, error: { code, detail, status } });

/**
 * Narrow a result to its failure half.
 *
 * `if (!res.success)` does NOT narrow here: the server workspace compiles with
 * `strict: false`, and without `strictNullChecks` a boolean discriminant stops
 * discriminating. Testing for the property is what the memories domain already
 * does (`if ('error' in result)`), and wrapping it in a predicate keeps every
 * call site reading as an intention rather than as a workaround.
 */
export function docFailed<T>(result: DocResult<T>): result is DocFailure {
  return 'error' in result;
}

/**
 * Whose credentials, against which instance.
 *
 * A ref object rather than positional arguments, for the reason written into
 * `PhotoAssetRef`: two providers took the same three values in a different
 * order, and swapping them compiled cleanly and served another user's data.
 */
export interface DocumentConnectionRef {
  connectionId: number;
  /**
   * When the connection's row was created, or '' for form values that were
   * never saved. The id alone does not name one row for good: a backup
   * restored in place rolls the id sequence back, and the id comes round
   * again on the next connection saved, on any trip. The two together do.
   */
  createdAt: string;
  /**
   * The user whose credentials these are: the trip admin who set the binding
   * up, not whoever is asking. The core passes both around separately and never
   * derives one from the other.
   */
  ownerId: number;
  baseUrl: string;
  /**
   * Decrypted `secret = 1` fields, plus whatever the provider earned and kept
   * through `saveSecret`. Never logged, never returned to a client.
   */
  secrets: Readonly<Record<string, string>>;
  /** Non-secret fields: username, organization_id, base_path, root_tag, … */
  settings: Readonly<Record<string, string>>;
  allowInsecureTls: boolean;
  /**
   * Keep a secret the provider earned itself (DSM's device token) with this
   * connection, or drop it with null. `secrets` is the snapshot this ref was
   * made from and does not change when this writes.
   *
   * Only a saved connection has one. A probe of form values may use what is
   * stored but never changes it: the values on screen may be for another
   * account, or never be saved at all.
   */
  saveSecret?: (key: string, value: string | null) => void;
}

/** The container at the provider that one trip is bound to. */
export interface DocumentScopeRef {
  linkId: number;
  tripId: number;
  /** Opaque, normalised, never empty. See `docsyncScopeKeySchema`. */
  scopeKey: string;
  remoteRootId: string | null;
  remoteRootPath: string | null;
  /**
   * Whatever the adapter stored last run. A WebDAV adapter puts the root ETag
   * here and can skip the whole walk when it is unchanged; Paperless stores the
   * highest `modified` it saw. The core treats it as a black box and hands it
   * back untouched.
   */
  cursor: string | null;
}

export interface RemoteDocument {
  /** Stable where the provider has one; a normalised path where it does not. */
  remoteId: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  /**
   * Opaque version marker. Different means changed. That is all the core may
   * conclude from it. It is not a content hash, not comparable across
   * instances, and not ordered.
   */
  remoteVersion: string;
  /** sha256 hex when the listing carries one, otherwise null. */
  contentHash: string | null;
  remoteModifiedAt: string | null;
  /** Provider-side tombstone, where one exists (Synology Drive `removed`). */
  isDeleted: boolean;
}

export interface DocumentScopeOption {
  scopeKey: string;
  label: string;
  remoteRootId: string | null;
  remoteRootPath: string | null;
}

export interface DocumentProviderCapabilities {
  /**
   * `webhook-self-registered`: TREK can create the subscription itself
   * (Paperless workflows). `webhook-manual`: the API exists but is closed to
   * API keys, so a human has to paste a URL (Papra, and Nextcloud unless the
   * account is an admin). `none`: polling only (Synology).
   */
  push: 'webhook-self-registered' | 'webhook-manual' | 'none';
  /** False means identity is the path, so rename looks like delete + create. */
  stableId: boolean;
  /** A delete lands in a recycle bin the user can recover from. */
  remoteTrash: boolean;
  /** A new revision can replace the bytes under the same remoteId. */
  replaceInPlace: boolean;
  /** The listing already carries a content hash, so no extra round trip. */
  contentHashInListing: boolean;
  maxUploadBytes: number | null;
  /** null means anything; otherwise the provider's own MIME allowlist. */
  acceptedMimeTypes: readonly string[] | null;
  /** The adapter can create a new scope container, not just pick one. */
  canCreateScope: boolean;
}

export interface PushRequest {
  /** Bytes, streamed straight out of `StorageService.getStream('files', …)`. */
  body: Readable;
  fileName: string;
  mimeType: string;
  size: number;
  /** sha256 of those bytes; adapters that can pin it upstream should. */
  sha256: string;
  /**
   * Unix seconds. WebDAV sends `X-OC-MTime`, Synology multiplies by 1000.
   * Without it every file TREK uploads comes back looking freshly changed,
   * which is the classic sync loop.
   */
  mtimeSeconds: number;
  /** Present means replace that document rather than create a new one. */
  remoteId?: string;
  /** Optimistic concurrency (WebDAV `If-Match`); ignored where unsupported. */
  expectedRemoteVersion?: string;
  /**
   * The anchors that survive a human renaming or re-tagging things upstream.
   * Written into a custom field, a property or a tag where the provider has
   * somewhere to put them.
   */
  trekDocUid: string;
  trekTripUid: string;
}

export interface PushResult {
  remoteId: string;
  remoteVersion: string;
  remoteModifiedAt: string | null;
  /**
   * True when the provider matched existing bytes instead of storing new ones
   * (Papra answers 409 on a duplicate hash, and restores a trashed twin under
   * its ORIGINAL id). The core must not book that as a fresh document.
   */
  deduplicated: boolean;
}

export interface FetchResult {
  body: Readable;
  size: number | null;
  mimeType: string | null;
  remoteVersion: string;
}

export interface DocumentProvider {
  readonly id: string;

  capabilities(conn: DocumentConnectionRef): DocumentProviderCapabilities;

  /**
   * Verify form values before anything is stored, and report what the account
   * can actually do. Always resolves: a failed probe is data, not an
   * exception, because the settings UI shows it inline (the photo providers
   * pin that with a test marked CRITICAL in their e2e suite).
   */
  probe(conn: DocumentConnectionRef): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>>;

  /** Offer the containers a trip could be bound to: folders, tags, spaces. */
  listScopes(conn: DocumentConnectionRef, query?: string): Promise<DocResult<DocumentScopeOption[]>>;

  /** Create one, where the provider has the concept. */
  createScope(conn: DocumentConnectionRef, name: string): Promise<DocResult<DocumentScopeOption>>;

  /** Confirm the bound scope still exists, so `scope_lost` is detectable. */
  resolveScope(conn: DocumentConnectionRef, scope: DocumentScopeRef): Promise<DocResult<DocumentScopeOption>>;

  /**
   * Enumerate everything currently in the scope, plus the cursor to hand back
   * next time.
   *
   * Full enumeration rather than a delta, deliberately: a changed-since query
   * cannot see a deletion, several of these providers bump no timestamp when a
   * tag changes, and Paperless's bulk edit changes documents without touching
   * `modified` at all. `cursorUnchanged` lets an adapter short-circuit the walk
   * (the WebDAV root ETag) while keeping the core's model identical.
   */
  list(conn: DocumentConnectionRef, scope: DocumentScopeRef): Promise<DocResult<{
    documents: RemoteDocument[];
    cursor: string | null;
    cursorUnchanged: boolean;
    /** True when the listing hit a page cap and is therefore not the whole truth. */
    truncated: boolean;
  }>>;

  fetch(conn: DocumentConnectionRef, scope: DocumentScopeRef, remoteId: string): Promise<DocResult<FetchResult>>;

  push(conn: DocumentConnectionRef, scope: DocumentScopeRef, req: PushRequest): Promise<DocResult<PushResult>>;

  rename(conn: DocumentConnectionRef, scope: DocumentScopeRef, remoteId: string, name: string): Promise<DocResult<{ remoteVersion: string }>>;

  /**
   * Move to the provider's recycle bin. Never a hard delete: Papra and
   * Paperless only expose permanent deletion to a session, not to a token, and
   * on the others an accidental propagation would be unrecoverable.
   */
  trash(conn: DocumentConnectionRef, scope: DocumentScopeRef, remoteId: string): Promise<DocResult<void>>;

  /** Subscribe to change notifications, where TREK is allowed to do it itself. */
  registerWebhook?(conn: DocumentConnectionRef, scope: DocumentScopeRef, callbackUrl: string, secret: string): Promise<DocResult<{ subscriptionId: string }>>;
  unregisterWebhook?(conn: DocumentConnectionRef, subscriptionId: string): Promise<DocResult<void>>;
}

export const DOCUMENT_PROVIDERS = Symbol('DOCUMENT_PROVIDERS');
