import { Injectable } from '@nestjs/common';
import type {
  DocResult,
  DocumentConnectionRef,
  DocumentProvider,
  DocumentProviderCapabilities,
  DocumentScopeOption,
  DocumentScopeRef,
  FetchResult,
  PushRequest,
  PushResult,
  RemoteDocument,
} from '../document-provider';
import { docFail, docFailed, docOk } from '../document-provider';
import {
  TREK_PROP_DOC_UID,
  TREK_PROP_TRIP_UID,
  WebdavClient,
  WebdavError,
  davPathOf,
  encodePath,
  normalizeOrigin,
  normalizePath,
  prefixOf,
  stripPrefix,
  type WebdavCreds,
  type WebdavEntry,
  type WebdavFlavor,
} from './webdav.client';

/**
 * The document adapter for Nextcloud and OpenCloud.
 *
 * One implementation serves both, and which one it is talking to is read off
 * the connection: Nextcloud brings a login name, an app password and a folder,
 * OpenCloud a username, an app token and a space. Nothing below branches on the
 * registered `id`; the two subclasses at the end of this file exist only because
 * the registry keys providers by `id` and Nest keys them by class, so two
 * product ids need two tokens. Everything a product does differently lives in
 * `flavorOf()` and the handful of branches it feeds.
 *
 * The scope is a folder (`fileid:<oc:fileid>`) or a space (`drive:<driveId>`).
 * Both ids survive a rename and a move within the same storage, which is what
 * lets `stableId` be true and a trip binding survive someone tidying up.
 *
 * Deliberately NOT here: a change feed. `sync-collection` (RFC 6578) is not
 * implemented by either product (Nextcloud answers HTTP 415 with
 * `ReportNotSupported`), so the listing is a full enumeration, short-circuited
 * by the root ETag, exactly as `DocumentProvider.list` describes.
 */

/** The four Nextcloud events that mean "something in this folder moved". */
const WEBHOOK_EVENTS = [
  'OCP\\Files\\Events\\Node\\NodeCreatedEvent',
  'OCP\\Files\\Events\\Node\\NodeWrittenEvent',
  'OCP\\Files\\Events\\Node\\NodeDeletedEvent',
  'OCP\\Files\\Events\\Node\\NodeRenamedEvent',
] as const;

/**
 * Header the subscription carries the shared secret in.
 *
 * It has to be the one the endpoint reads: `doc-sync-webhook.controller.ts`
 * looks for `x-trek-docsync-secret`. It used to say `X-TREK-Docsync-Signature`
 * here, so every webhook Nextcloud actually sent arrived without a secret the
 * controller could find and was silently dropped: the subscription existed, the
 * calls arrived, and nothing ever came of them.
 */
const WEBHOOK_SECRET_HEADER = 'x-trek-docsync-secret';

/** Where a Nextcloud connection looks for trip folders when nobody said otherwise. */
const DEFAULT_BASE_PATH = '/TREK';

/** Enough scopes for a busy install, and a ceiling so the cache cannot grow forever. */
const MAX_CACHED_SCOPES = 200;

/**
 * A document whose entry carried no `oc:fileid`. Both products always send one,
 * but a reverse proxy stripping the `oc:` namespace would otherwise drop the
 * file from the trip silently; a path-shaped id keeps it visible at the cost of
 * looking renamed if someone renames it.
 */
const PATH_ID_PREFIX = 'path:';

/** Everything the adapter needs to address one bound scope. */
interface ResolvedScope {
  creds: WebdavCreds;
  /** DAV path of the scope root, percent-encoded, on the connection's own origin. */
  rootPath: string;
  /** The same path decoded, for deriving a document's path inside the scope. */
  rootDecoded: string;
  /** The id inside the scope key: an `oc:fileid` or a `driveId`. */
  scopeId: string;
}

function textSetting(values: Readonly<Record<string, string>>, key: string): string {
  const value = values[key];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Which product this connection describes.
 *
 * Read off the field set the admin filled in rather than off the provider id,
 * so a connection cannot end up being addressed as the product it is not
 * because two rows in `document_providers` were swapped.
 */
export function flavorOf(conn: DocumentConnectionRef): WebdavFlavor | null {
  if (textSetting(conn.settings, 'login_name') || textSetting(conn.secrets, 'app_password')) {
    return 'nextcloud';
  }
  if (textSetting(conn.settings, 'username') || textSetting(conn.secrets, 'app_token')) {
    return 'opencloud';
  }
  return null;
}

/**
 * A usable base: scheme and host, then the install's own path if it has one.
 * The second group is that path (`/nextcloud`), or '' for an install at the
 * root, which is what most Docker and snap setups are. A Nextcloud under a
 * sub-path is the ordinary package install, and refusing it here used to read
 * as "wrong password" on the settings screen.
 */
const BASE_URL = /^(https?:\/\/[^/]+)((?:\/[^/]+)*)$/i;

function credsOf(conn: DocumentConnectionRef): WebdavCreds | null {
  const flavor = flavorOf(conn);
  const origin = normalizeOrigin(conn.baseUrl);
  const base = BASE_URL.exec(origin);
  if (!flavor || !base) return null;

  const username =
    flavor === 'nextcloud'
      ? textSetting(conn.settings, 'login_name')
      : textSetting(conn.settings, 'username');
  const password =
    flavor === 'nextcloud'
      ? textSetting(conn.secrets, 'app_password')
      : textSetting(conn.secrets, 'app_token');
  if (!username || !password) return null;

  return { origin, prefix: base[2], username, password, allowInsecureTls: conn.allowInsecureTls, flavor };
}

/** `/remote.php/dav/files/<login>`: the per-account root of Nextcloud's file DAV. */
function filesRoot(creds: WebdavCreds): string {
  return `/remote.php/dav/files/${encodeURIComponent(creds.username)}`;
}

function basePathOf(conn: DocumentConnectionRef): string {
  const configured = textSetting(conn.settings, 'base_path');
  return normalizePath(configured || DEFAULT_BASE_PATH);
}

/** `fileid:437` / `drive:storage$space` → the id, for the kind this flavor uses. */
function scopeIdOf(scopeKey: string, flavor: WebdavFlavor): string | null {
  const expected = flavor === 'nextcloud' ? 'fileid:' : 'drive:';
  if (!scopeKey.startsWith(expected)) return null;
  const id = scopeKey.slice(expected.length).trim();
  return id.length > 0 ? id : null;
}

/**
 * Names both products accept.
 *
 * Nextcloud refuses `\ / < > : " | ? *` and a trailing dot or space outright, so
 * a trip called "Japan: 2026" would fail to get a folder at all. The replacement
 * is visible: the label in the returned option is the name that was really
 * used, not the one that was asked for.
 */
function sanitizeName(name: string): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/<>:"|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return cleaned.slice(0, 200);
}

function parentOf(encodedPath: string): string {
  const cut = encodedPath.lastIndexOf('/');
  return cut > 0 ? encodedPath.slice(0, cut) : '';
}

/** The document's path inside its scope, decoded, with no leading slash. */
function relativeOf(entry: WebdavEntry, rootDecoded: string): string {
  return entry.path.startsWith(`${rootDecoded}/`)
    ? entry.path.slice(rootDecoded.length + 1)
    : entry.name;
}

function documentOf(entry: WebdavEntry, rootDecoded: string): RemoteDocument {
  const relative = relativeOf(entry, rootDecoded);
  return {
    remoteId: entry.fileId ?? `${PATH_ID_PREFIX}${relative}`,
    name: entry.name,
    size: entry.size,
    mimeType: entry.mimeType,
    // An ETag is what both products change on every write. When one is missing
    // the pair below still differs after a write, which is all the core reads
    // out of this field.
    remoteVersion: entry.etag || `mtime:${entry.lastModifiedIso ?? ''}:${entry.size ?? ''}`,
    contentHash: entry.sha256,
    remoteModifiedAt: entry.lastModifiedIso,
    // WebDAV has no tombstone in a listing: a deleted file is simply absent, and
    // the core's own mass-delete guard is what stands between that and a trip
    // emptying itself.
    isDeleted: false,
  };
}

/**
 * Anything that goes wrong, as a result rather than an exception.
 *
 * `probe` and its siblings always resolve because the settings screen renders
 * the answer inline. An error that is not a WebdavError is a bug in this file
 * rather than a provider problem, and it still has to come back as data: one
 * broken adapter must not take down the run for every other link.
 */
function failureOf<T>(err: unknown): DocResult<T> {
  if (err instanceof WebdavError) {
    return docFail<T>(err.code, err.detail ?? err.message, err.status);
  }
  return docFail<T>('unknown', err instanceof Error ? err.message : String(err));
}

@Injectable()
export class WebdavDocumentProvider implements DocumentProvider {
  readonly id: string = 'nextcloud';

  /**
   * Scope key → (remote id → still-encoded href), refilled by every listing.
   *
   * WebDAV addresses resources by path while the core hands back the stable id
   * it stored, and neither product can PROPFIND a Nextcloud file id directly.
   * Without this, every download, rename and trash would re-walk the folder
   * first. It is a cache, not state: a miss costs one PROPFIND, never a wrong
   * answer.
   */
  private readonly hrefCache = new Map<string, Map<string, string>>();

  constructor(private readonly client: WebdavClient) {}

  capabilities(conn: DocumentConnectionRef): DocumentProviderCapabilities {
    return {
      // Conservative on purpose: most Nextcloud connections are an ordinary
      // account's app password, and `webhook_listeners` is admin-only. `probe`
      // upgrades this to `webhook-self-registered` once it has asked the
      // instance. OpenCloud has no HTTP subscription API at all (its change
      // events live on an internal NATS bus that no trip admin can point at
      // TREK), so it is `none` rather than a `webhook-manual` that would send
      // someone looking for a settings page that does not exist.
      push: flavorOf(conn) === 'nextcloud' ? 'webhook-manual' : 'none',
      stableId: true,
      remoteTrash: true,
      replaceInPlace: true,
      // False for both: Nextcloud stores whatever checksum the uploader claimed
      // without verifying it, and OpenCloud computes SHA1/MD5/ADLER32 but never
      // SHA256. See the header of webdav.client.ts.
      contentHashInListing: false,
      maxUploadBytes: null,
      acceptedMimeTypes: null,
      canCreateScope: true,
    };
  }

  async probe(
    conn: DocumentConnectionRef,
  ): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>> {
    const creds = credsOf(conn);
    if (!creds) return docFail('unauthorized', 'The connection is missing a URL, a username or a password');

    try {
      const capabilities = this.capabilities(conn);
      if (creds.flavor === 'opencloud') {
        const account = await this.client.whoAmI(creds);
        return docOk({ account, capabilities });
      }

      // The WebDAV root rather than an OCS endpoint: it is the surface every
      // other call uses, and a login name that does not match the account
      // answers 404 here while the password checks out fine.
      try {
        await this.client.propfind(creds, filesRoot(creds), 0);
      } catch (err: unknown) {
        if (err instanceof WebdavError && err.status === 404) {
          return docFail(
            'not_found',
            `No WebDAV home for login name "${creds.username}". Nextcloud shows the exact spelling under Settings → Personal → Security.`,
            404,
          );
        }
        throw err;
      }

      const canRegister = await this.client.canRegisterWebhooks(creds);
      return docOk({
        account: creds.username,
        capabilities: {
          ...capabilities,
          push: canRegister ? 'webhook-self-registered' : 'webhook-manual',
        },
      });
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  async listScopes(conn: DocumentConnectionRef, query?: string): Promise<DocResult<DocumentScopeOption[]>> {
    const creds = credsOf(conn);
    if (!creds) return docFail('unauthorized', 'The connection is missing a URL, a username or a password');
    const needle = query?.trim().toLowerCase() ?? '';

    try {
      const options =
        creds.flavor === 'nextcloud'
          ? await this.nextcloudScopes(conn, creds)
          : await this.opencloudScopes(creds);
      return docOk(needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options);
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  private async nextcloudScopes(
    conn: DocumentConnectionRef,
    creds: WebdavCreds,
  ): Promise<DocumentScopeOption[]> {
    const basePath = basePathOf(conn);
    let listing;
    try {
      listing = await this.client.propfind(creds, `${filesRoot(creds)}${encodePath(basePath)}`, 1);
    } catch (err: unknown) {
      // The base folder does not exist yet on a fresh instance. An empty picker
      // plus a working "create" is a better answer than an error that reads
      // like the credentials are wrong.
      if (err instanceof WebdavError && err.status === 404) return [];
      throw err;
    }

    const options: DocumentScopeOption[] = [];
    for (const child of listing.children) {
      if (!child.isCollection || !child.fileId) continue;
      options.push({
        scopeKey: `fileid:${child.fileId}`,
        label: child.name,
        remoteRootId: child.fileId,
        remoteRootPath: `${basePath}/${child.name}`,
      });
    }
    return options;
  }

  private async opencloudScopes(creds: WebdavCreds): Promise<DocumentScopeOption[]> {
    const drives = await this.client.listDrives(creds);
    return drives
      // `virtual` is the synthetic "Shares" drive, which has no storage of its
      // own and cannot hold an upload.
      .filter((drive) => drive.driveType !== 'virtual')
      .map((drive) => ({
        scopeKey: `drive:${drive.id}`,
        label: drive.name,
        remoteRootId: drive.id,
        remoteRootPath: `${creds.origin}${drive.webDavPath}`,
      }));
  }

  async createScope(conn: DocumentConnectionRef, name: string): Promise<DocResult<DocumentScopeOption>> {
    const creds = credsOf(conn);
    if (!creds) return docFail('unauthorized', 'The connection is missing a URL, a username or a password');
    const safeName = sanitizeName(name);
    if (!safeName) return docFail('provider_error', 'The name has no characters the provider accepts');

    try {
      if (creds.flavor === 'opencloud') {
        const drive = await this.client.createDrive(creds, safeName);
        return docOk({
          scopeKey: `drive:${drive.id}`,
          label: drive.name,
          remoteRootId: drive.id,
          remoteRootPath: `${creds.origin}${drive.webDavPath}`,
        });
      }

      const basePath = basePathOf(conn);
      const path = `${filesRoot(creds)}${encodePath(`${basePath}/${safeName}`)}`;
      let created: 'created' | 'exists';
      try {
        created = await this.client.mkcol(creds, path);
      } catch (err: unknown) {
        // 409 is Sabre's "parent node does not exist", i.e. the base folder has
        // never been created. Making it is the whole point of this call.
        if (!(err instanceof WebdavError) || err.status !== 409) throw err;
        await this.client.mkcol(creds, `${filesRoot(creds)}${encodePath(basePath)}`);
        created = await this.client.mkcol(creds, path);
      }
      if (created === 'exists') {
        return docFail(
          'conflict',
          `"${safeName}" already exists under ${basePath}. Pick it in the list instead of creating it again.`,
          405,
        );
      }

      // MKCOL answers an OC-FileId header, but only on Nextcloud and only in the
      // padded spelling; one PROPFIND gets the id in the form every listing
      // will use, which is the form the scope key has to carry.
      const folder = await this.client.propfind(creds, path, 0);
      if (!folder.self.fileId) {
        return docFail('provider_error', 'The new folder came back without an oc:fileid');
      }
      return docOk({
        scopeKey: `fileid:${folder.self.fileId}`,
        label: safeName,
        remoteRootId: folder.self.fileId,
        remoteRootPath: `${basePath}/${safeName}`,
      });
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  async resolveScope(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<DocumentScopeOption>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;
    const { creds, rootPath, scopeId } = resolved.data;

    try {
      if (creds.flavor === 'opencloud') {
        const drive = await this.client.getDrive(creds, scopeId);
        if (!drive) return docFail('scope_missing', `The space ${scopeId} no longer exists`);
        return docOk({
          scopeKey: `drive:${drive.id}`,
          label: drive.name,
          remoteRootId: drive.id,
          remoteRootPath: `${creds.origin}${drive.webDavPath}`,
        });
      }

      const folder = await this.client.propfind(creds, rootPath, 0);
      // The path still resolves but the id behind it changed: someone deleted
      // the folder and made a new one with the same name, and its contents have
      // nothing to do with this trip.
      if (folder.self.fileId !== scopeId) {
        return docFail(
          'scope_missing',
          `${scope.remoteRootPath ?? rootPath} is a different folder now (oc:fileid ${folder.self.fileId ?? 'missing'} instead of ${scopeId})`,
        );
      }
      return docOk({
        scopeKey: `fileid:${scopeId}`,
        label: folder.self.name,
        remoteRootId: scopeId,
        remoteRootPath: scope.remoteRootPath,
      });
    } catch (err: unknown) {
      if (err instanceof WebdavError && err.status === 404) {
        return docFail('scope_missing', err.detail ?? err.message, 404);
      }
      return failureOf(err);
    }
  }

  async list(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<{
    documents: RemoteDocument[];
    cursor: string | null;
    cursorUnchanged: boolean;
    truncated: boolean;
  }>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;
    const { creds, rootPath, rootDecoded } = resolved.data;

    try {
      // A write anywhere below a collection changes that collection's ETag up to
      // the root on both products, so one Depth:0 request answers "has anything
      // at all happened here" for a folder of any size.
      if (scope.cursor) {
        const head = await this.client.propfind(creds, rootPath, 0);
        if (head.self.etag && head.self.etag === scope.cursor) {
          return docOk({ documents: [], cursor: scope.cursor, cursorUnchanged: true, truncated: false });
        }
      }

      const listing = await this.client.propfind(creds, rootPath, 1);
      const documents: RemoteDocument[] = [];
      const hrefs = new Map<string, string>();
      for (const child of listing.children) {
        // Sub-folders are not documents and are not descended into: Depth:1 is
        // one request per run whatever the folder holds, and a recursive walk
        // would trade that for one request per directory.
        if (child.isCollection) continue;
        const document = documentOf(child, rootDecoded);
        documents.push(document);
        hrefs.set(document.remoteId, child.href);
      }
      this.rememberHrefs(conn, scope, hrefs);

      return docOk({
        documents,
        cursor: listing.self.etag || null,
        cursorUnchanged: false,
        truncated: listing.truncated,
      });
    } catch (err: unknown) {
      if (err instanceof WebdavError && err.status === 404) {
        return docFail('scope_missing', err.detail ?? err.message, 404);
      }
      return failureOf(err);
    }
  }

  async fetch(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<FetchResult>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;

    try {
      const href = await this.hrefFor(conn, scope, resolved.data, remoteId);
      if (!href) return docFail('not_found', `${remoteId} is no longer in this folder`);
      const download = await this.client.get(resolved.data.creds, href);
      return docOk({
        body: download.body,
        size: download.size,
        mimeType: download.mimeType,
        remoteVersion: download.etag,
      });
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  async push(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    req: PushRequest,
  ): Promise<DocResult<PushResult>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;
    const { creds, rootPath } = resolved.data;

    const name = sanitizeName(req.fileName);
    if (!name) return docFail('provider_error', 'The file name has no characters the provider accepts');

    try {
      let target: string;
      if (req.remoteId) {
        const href = await this.hrefFor(conn, scope, resolved.data, req.remoteId);
        // Replacing something that is gone is not the same as creating it: the
        // core records the document as missing and asks a human, rather than
        // resurrecting a file somebody deleted upstream on purpose.
        if (!href) return docFail('not_found', `${req.remoteId} is no longer in this folder`);
        target = href;
      } else {
        target = `${rootPath}/${encodeURIComponent(name)}`;
      }

      const result = await this.client.put(creds, target, req.body, {
        size: req.size,
        mimeType: req.mimeType,
        // Without this the file TREK just uploaded looks freshly changed
        // upstream on the next run, and the two sides push it back and forth.
        mtimeSeconds: req.mtimeSeconds,
        sha256: req.sha256,
        ifMatch: req.expectedRemoteVersion,
        // Creating means creating: an unconditional PUT to a name that is
        // already taken overwrites somebody else's document without a word.
        // Two trips bound to one folder, or a person who put a `receipt.pdf`
        // there by hand, are enough for that to happen.
        ifNoneMatch: req.remoteId ? undefined : '*',
      });

      // Best effort, and deliberately not fatal: the bytes are already stored,
      // so failing here would make the core upload them again on every run. The
      // anchors are a recovery aid, not part of the document's identity.
      try {
        await this.client.proppatch(creds, target, {
          [TREK_PROP_DOC_UID]: req.trekDocUid,
          [TREK_PROP_TRIP_UID]: req.trekTripUid,
        });
      } catch (err: unknown) {
        if (!(err instanceof WebdavError)) throw err;
      }

      let { fileId, etag } = result;
      // A reverse proxy that drops the OC-* headers leaves the upload done and
      // unidentifiable, so ask for what it swallowed.
      if (!fileId || !etag) {
        const stored = await this.client.propfind(creds, target, 0);
        fileId ??= stored.self.fileId;
        etag ||= stored.self.etag;
      }
      if (!fileId || !etag) {
        return docFail('provider_error', 'The upload succeeded but the instance never named the stored file');
      }

      this.rememberHrefs(conn, scope, new Map([[fileId, target]]));
      return docOk({
        remoteId: fileId,
        remoteVersion: etag,
        remoteModifiedAt: new Date(req.mtimeSeconds * 1000).toISOString(),
        // Neither product de-duplicates by content; a second upload of the same
        // bytes is a second file.
        deduplicated: false,
      });
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  async rename(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
    name: string,
  ): Promise<DocResult<{ remoteVersion: string }>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;
    const safeName = sanitizeName(name);
    if (!safeName) return docFail('provider_error', 'The new name has no characters the provider accepts');

    try {
      const href = await this.hrefFor(conn, scope, resolved.data, remoteId);
      if (!href) return docFail('not_found', `${remoteId} is no longer in this folder`);

      // Within the same parent: a rename moves a document inside the trip's
      // folder, it never moves it out of the scope the trip is bound to.
      const destination = `${parentOf(href)}/${encodeURIComponent(safeName)}`;
      const moved = await this.client.move(resolved.data.creds, href, destination);
      this.rememberHrefs(conn, scope, new Map([[remoteId, destination]]));

      if (moved.etag) return docOk({ remoteVersion: moved.etag });
      const renamed = await this.client.propfind(resolved.data.creds, destination, 0);
      return docOk({ remoteVersion: renamed.self.etag });
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  async trash(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<void>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;

    try {
      const href = await this.hrefFor(conn, scope, resolved.data, remoteId);
      // Already gone is the state the caller asked for.
      if (!href) return docOk(undefined);
      await this.client.delete(resolved.data.creds, href);
      this.forgetHref(conn, scope, remoteId);
      return docOk(undefined);
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  /**
   * Subscribe to the four file events, one subscription each.
   *
   * A failure here is never a broken connection: the endpoint is admin-only, so
   * the ordinary case of a non-admin app password is a plain "no", the link
   * stays on polling, and `probe` already reported `webhook-manual` for exactly
   * this account. Partial registrations are rolled back so a retry does not
   * leave a pile of orphaned subscriptions behind.
   *
   * Two things a self-hoster has to know, neither of which this call can fix:
   * Nextcloud delivers webhooks through its background-job queue, so the
   * notification is as prompt as that instance's cron and no prompter, and
   * `allow_local_remote_servers` must be on or a callback to a LAN address is
   * refused at delivery time while the subscription still looks healthy.
   */
  async registerWebhook(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    callbackUrl: string,
    secret: string,
  ): Promise<DocResult<{ subscriptionId: string }>> {
    const resolved = this.resolve(conn, scope);
    if (docFailed(resolved)) return resolved;
    const { creds } = resolved.data;
    if (creds.flavor === 'opencloud') {
      return docFail('forbidden', 'OpenCloud has no webhook API a trip admin can subscribe to');
    }

    const created: number[] = [];
    try {
      if (!(await this.client.canRegisterWebhooks(creds))) {
        return docFail(
          'forbidden',
          'This Nextcloud account may not manage webhooks, so the link keeps polling instead',
          403,
        );
      }
      // Deliberately unscoped: the obvious `eventFilter` on the changed path
      // needs `$regex`, which the app's query engine does not implement, and the
      // exception it throws stops delivery for every other webhook on the same
      // event. A subscription that says "look now" about a folder this trip does
      // not care about costs one listing; the filter costs the whole channel.
      for (const event of WEBHOOK_EVENTS) {
        created.push(
          await this.client.createWebhook(creds, {
            uri: callbackUrl,
            event,
            secretHeader: WEBHOOK_SECRET_HEADER,
            secret,
          }),
        );
      }
      return docOk({ subscriptionId: created.join(',') });
    } catch (err: unknown) {
      for (const id of created) {
        await this.client.deleteWebhook(creds, id).catch(() => undefined);
      }
      return failureOf(err);
    }
  }

  async unregisterWebhook(conn: DocumentConnectionRef, subscriptionId: string): Promise<DocResult<void>> {
    const creds = credsOf(conn);
    if (!creds) return docFail('unauthorized', 'The connection is missing a URL, a username or a password');

    try {
      for (const part of subscriptionId.split(',')) {
        const id = Number(part.trim());
        if (Number.isInteger(id) && id > 0) {
          await this.client.deleteWebhook(creds, id);
        }
      }
      return docOk(undefined);
    } catch (err: unknown) {
      return failureOf(err);
    }
  }

  /** Connection plus scope key turned into an addressable root, or the reason it is not one. */
  private resolve(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): DocResult<ResolvedScope> {
    const creds = credsOf(conn);
    if (!creds) return docFail('unauthorized', 'The connection is missing a URL, a username or a password');

    const scopeId = scopeIdOf(scope.scopeKey, creds.flavor);
    if (!scopeId) {
      return docFail('scope_missing', `"${scope.scopeKey}" is not a scope key this provider issued`);
    }

    if (creds.flavor === 'nextcloud') {
      const userPath = scope.remoteRootPath ? normalizePath(scope.remoteRootPath) : null;
      if (!userPath || userPath === '/') {
        return docFail('scope_missing', 'The binding has no folder path, and a file id cannot be addressed over WebDAV');
      }
      const rootPath = `${filesRoot(creds)}${encodePath(userPath)}`;
      return docOk({ creds, rootPath, rootDecoded: `${filesRoot(creds)}${userPath}`, scopeId });
    }

    // The stored root is the space's own webDavUrl. Only its path is used, and
    // it is re-based on the connection's origin: the URL came out of a provider
    // response, and following the host in it would hand an attacker who can
    // answer for that instance a way past the SSRF guard. The origin already
    // carries the install's prefix, so the path is stored with it and loses it
    // here, or the request would spell it twice.
    const path = scope.remoteRootPath ? davPathOf(scope.remoteRootPath) : null;
    const rootPath = path === null ? `/dav/spaces/${encodeURIComponent(scopeId)}` : stripPrefix(path, prefixOf(creds));
    let decoded: string;
    try {
      decoded = normalizePath(decodeURIComponent(rootPath));
    } catch {
      // A stored path with a stray percent sign is still usable as-is; failing
      // the whole binding over a decoding quirk would be worse than the quirk.
      decoded = rootPath;
    }
    return docOk({ creds, rootPath, rootDecoded: decoded, scopeId });
  }

  private cacheKey(conn: DocumentConnectionRef, scope: DocumentScopeRef): string {
    return `${conn.connectionId}:${scope.scopeKey}`;
  }

  private rememberHrefs(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    hrefs: Map<string, string>,
  ): void {
    const key = this.cacheKey(conn, scope);
    const existing = this.hrefCache.get(key);
    if (existing) {
      for (const [id, href] of hrefs) existing.set(id, href);
      return;
    }
    if (this.hrefCache.size >= MAX_CACHED_SCOPES) {
      // Map iterates in insertion order, so the first key is the oldest scope.
      const oldest = this.hrefCache.keys().next();
      if (!oldest.done) this.hrefCache.delete(oldest.value);
    }
    this.hrefCache.set(key, new Map(hrefs));
  }

  private forgetHref(conn: DocumentConnectionRef, scope: DocumentScopeRef, remoteId: string): void {
    this.hrefCache.get(this.cacheKey(conn, scope))?.delete(remoteId);
  }

  /** The href for a remote id, re-walking the folder once when the cache cannot say. */
  private async hrefFor(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    resolved: ResolvedScope,
    remoteId: string,
  ): Promise<string | null> {
    if (remoteId.startsWith(PATH_ID_PREFIX)) {
      const relative = remoteId.slice(PATH_ID_PREFIX.length);
      // The path comes out of a listing, which is the provider's word and not
      // TREK's. A `..` in it would address a file outside the folder the trip is
      // bound to. Every other id here is opaque, this one is a path and has to
      // be treated like one.
      if (!relative || relative.split('/').some(seg => seg === '..' || seg === '.')) return null;
      return `${resolved.rootPath}/${encodePath(relative)}`;
    }

    const cached = this.hrefCache.get(this.cacheKey(conn, scope))?.get(remoteId);
    if (cached) return cached;

    const listing = await this.client.propfind(resolved.creds, resolved.rootPath, 1);
    const hrefs = new Map<string, string>();
    for (const child of listing.children) {
      if (child.isCollection) continue;
      hrefs.set(child.fileId ?? `${PATH_ID_PREFIX}${relativeOf(child, resolved.rootDecoded)}`, child.href);
    }
    this.rememberHrefs(conn, scope, hrefs);
    return hrefs.get(remoteId) ?? null;
  }
}

/**
 * The two registrations.
 *
 * They carry an id and nothing else. The registry maps a connection's
 * `provider_id` onto a provider instance and Nest maps a class onto a token, so
 * two product ids need two classes, but both run the implementation above, and
 * that implementation never asks which one it is.
 *
 * The constructors are spelled out rather than inherited: Nest reads
 * `design:paramtypes` off the concrete class, and a subclass without its own
 * constructor is emitted without that metadata and resolved with no arguments.
 */
@Injectable()
export class NextcloudDocumentProvider extends WebdavDocumentProvider {
  override readonly id = 'nextcloud';

  constructor(client: WebdavClient) {
    super(client);
  }
}

@Injectable()
export class OpencloudDocumentProvider extends WebdavDocumentProvider {
  override readonly id = 'opencloud';

  constructor(client: WebdavClient) {
    super(client);
  }
}
