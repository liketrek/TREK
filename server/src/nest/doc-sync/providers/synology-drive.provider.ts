import { Injectable } from '@nestjs/common';
import { createHash, type Hash } from 'node:crypto';
import { Readable } from 'node:stream';
import {
  docFail,
  docOk,
  type DocResult,
  type DocumentConnectionRef,
  type DocumentProvider,
  type DocumentProviderCapabilities,
  type DocumentScopeOption,
  type DocumentScopeRef,
  type FetchResult,
  type PushRequest,
  type PushResult,
  type RemoteDocument,
} from '../document-provider';
import { PROVIDER_MAX_PAGES } from '../doc-sync.constants';
import { contentTypeFor } from '../../storage/content-type';
import {
  isValidSynoName,
  isWithinScope,
  joinSynoPath,
  MAX_SCOPE_PATH_LENGTH,
  normalizeSynoPath,
  snapshotVersion,
  SynologyDriveClient,
  SynologyDriveError,
  type SynoEntry,
  type SynologyDriveCreds,
} from './synology-drive.client';

/**
 * Synology Drive over the FileStation Web API.
 *
 * The scope is a folder and identity is its path (FileStation has no file id,
 * no change feed and no webhook), so this adapter is the one the sync core's
 * "full enumeration, nothing assumed" model was shaped around. Everything it
 * cannot honestly promise it declares as absent in `capabilities()` rather than
 * faking: no push, no stable id, no hash in the listing.
 *
 * All HTTP lives in `synology-drive.client.ts`; this file is scope arithmetic,
 * the mapping into the sync core's vocabulary, and the boundary checks DSM does
 * not do for us.
 */

/** Matches `DOCUMENT_PROVIDER_IDS` in shared/src/docsync/docsync.schema.ts. */
const PROVIDER_ID = 'synologydrive';

/** What the connection form offers as a placeholder, and the fallback here. */
const DEFAULT_BASE_PATH = '/trek';

/** Scope keys are `path:` plus the normalised path. See `docsyncScopeKeySchema`. */
const SCOPE_PREFIX = 'path:';

/**
 * DSM exposes no recycle-bin switch on the API's delete, so a propagated delete
 * moves the file here instead. It is inside the scope so it inherits the scope's
 * permissions, and it is skipped by every listing so a trashed document does not
 * come back as a new one on the next run.
 */
const TRASH_FOLDER = '.trek-trash';

/**
 * The adapter's own ceiling for one transfer. Not a policy: the install's limit
 * is the upload limit (`MAX_FILE_SIZE`), enforced by the core before and during
 * every transfer. This is just a bound so a wrong path or a truncated header
 * cannot start an unbounded read.
 */
const MAX_TRANSFER_BYTES = 2 * 1024 * 1024 * 1024;

/**
 * Up to this size an upload is verified against the NAS's own digest.
 *
 * SYNO.FileStation.MD5 is a task that reads the whole file, so it is priced per
 * megabyte on the NAS's disks. Below the threshold that is a fraction of the
 * upload that just happened; above it, the verification would cost more than the
 * transfer and the core's own sha256 of the local bytes is the better check.
 */
const MD5_VERIFY_MAX_BYTES = 64 * 1024 * 1024;

/** How many scope options one picker call may answer with. */
const MAX_SCOPE_OPTIONS = 200;

/**
 * Where the connection keeps DSM's device token among its secrets. No form
 * field has this key, which is what keeps it out of every response and out of
 * the form's reach; see `saveEarnedSecret` in the config service.
 */
const DEVICE_TOKEN_SECRET = 'device_token';

const CAPABILITIES: DocumentProviderCapabilities = {
  // FileStation has no subscription API at all. DSM's own notifications are
  // mail and mobile push, neither reachable from here.
  push: 'none',
  // The path IS the id: a rename upstream reads as delete + create.
  stableId: false,
  // Through the move into TRASH_FOLDER below, not through DSM's own recycle bin:
  // the API's delete is permanent and offers no flag to route it elsewhere.
  remoteTrash: true,
  // An upload with overwrite=true replaces the bytes under the same path.
  replaceInPlace: true,
  // FileStation computes MD5 only, as a task per file, and MD5 is not the
  // sha256 the core compares against. `contentHash` therefore stays null.
  contentHashInListing: false,
  maxUploadBytes: MAX_TRANSFER_BYTES,
  // DSM stores whatever it is given; there is no server-side type allow-list.
  acceptedMimeTypes: null,
  canCreateScope: true,
};

/** Hash the bytes on their way past, without buffering them. */
async function* hashing(source: Readable, hash: Hash): AsyncGenerator<Buffer> {
  for await (const chunk of source) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    hash.update(buffer);
    yield buffer;
  }
}

function baseName(path: string): string {
  const cut = path.lastIndexOf('/');
  return cut === -1 ? path : path.slice(cut + 1);
}

function parentPath(path: string): string {
  const cut = path.lastIndexOf('/');
  return cut <= 0 ? '/' : path.slice(0, cut);
}

function isoFromSeconds(seconds: number | null): string | null {
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function toRemoteDocument(entry: SynoEntry): RemoteDocument {
  return {
    remoteId: entry.path,
    name: entry.name,
    size: entry.size,
    // `additional.type` is the extension in capitals, not a media type, so the
    // shared mapping is the honest source for what the bytes are.
    mimeType: contentTypeFor(entry.name),
    remoteVersion: snapshotVersion(entry.path, entry.size, entry.mtimeSeconds),
    contentHash: null,
    remoteModifiedAt: isoFromSeconds(entry.mtimeSeconds),
    // FileStation keeps no tombstone: a file that is gone is simply absent.
    isDeleted: false,
  };
}

function scopeOption(path: string, label?: string): DocumentScopeOption {
  return {
    scopeKey: `${SCOPE_PREFIX}${path}`,
    label: label ?? baseName(path),
    // There is no stable folder id on a Synology share: the path is all there
    // is, and pretending otherwise would put a fiction in the binding.
    remoteRootId: null,
    remoteRootPath: path,
  };
}

@Injectable()
export class SynologyDriveDocumentProvider implements DocumentProvider {
  readonly id = PROVIDER_ID;

  /**
   * Injected, like the Paperless and WebDAV clients: it holds the SID cache,
   * the lockouts and the device token slots, so there has to be exactly one of
   * it per process, and the module's singleton is that one.
   */
  constructor(private readonly client: SynologyDriveClient) {}

  capabilities(): DocumentProviderCapabilities {
    return CAPABILITIES;
  }

  async probe(
    conn: DocumentConnectionRef,
  ): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    try {
      const probe = await this.client.probe(creds);
      if (!probe.availableApis.includes('SYNO.FileStation.List')) {
        return docFail(
          'provider_error',
          'The account logged in, but this DSM does not expose File Station. Install the File Station package and allow this account to use it.',
        );
      }
      return docOk({ account: creds.username, capabilities: CAPABILITIES });
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  /**
   * The shares this account can see, plus the folders under the configured base
   * path, the two levels an operator actually picks from. Shares are offered
   * too because a small NAS often has a share per purpose and no sub-folders.
   */
  async listScopes(conn: DocumentConnectionRef, query?: string): Promise<DocResult<DocumentScopeOption[]>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    const basePath = this.basePath(conn);

    try {
      const options = new Map<string, DocumentScopeOption>();
      for (const share of await this.client.listShares(creds)) {
        const path = normalizeSynoPath(share.path, MAX_SCOPE_PATH_LENGTH);
        if (path && share.isdir) options.set(path, scopeOption(path, share.name));
      }

      // The base path is a convenience, not a requirement: an install that has
      // not created it yet should still see its shares rather than an error.
      try {
        const listing = await this.client.listFolder(creds, basePath);
        for (const entry of listing.entries) {
          if (!entry.isdir || entry.name === TRASH_FOLDER) continue;
          const path = normalizeSynoPath(entry.path, MAX_SCOPE_PATH_LENGTH);
          if (path) options.set(path, scopeOption(path, entry.name));
        }
      } catch (error: unknown) {
        if (!(error instanceof SynologyDriveError) || error.code !== 'not_found') throw error;
      }

      const needle = query?.trim().toLowerCase();
      const filtered = [...options.values()]
        .filter((option) => !needle || option.label.toLowerCase().includes(needle) || option.remoteRootPath!.toLowerCase().includes(needle))
        .sort((a, b) => a.remoteRootPath!.localeCompare(b.remoteRootPath!))
        .slice(0, MAX_SCOPE_OPTIONS);
      return docOk(filtered);
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  async createScope(conn: DocumentConnectionRef, name: string): Promise<DocResult<DocumentScopeOption>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    const trimmed = name.trim();
    if (!isValidSynoName(trimmed)) {
      return docFail('provider_error', 'DSM will not accept that folder name');
    }
    const basePath = this.basePath(conn);
    const path = normalizeSynoPath(joinSynoPath(basePath, trimmed), MAX_SCOPE_PATH_LENGTH);
    if (!path) return docFail('provider_error', 'The resulting folder path is not one DSM accepts');

    try {
      const folder = await this.client.createFolder(creds, basePath, trimmed);
      const created = normalizeSynoPath(folder.path, MAX_SCOPE_PATH_LENGTH) ?? path;
      return docOk(scopeOption(created, folder.name));
    } catch (error: unknown) {
      // With force_parent DSM creates missing folders, but never a missing
      // share: that is a storage operation, not a file one. Saying "the base
      // path does not exist" is the actionable version of its 408.
      if (error instanceof SynologyDriveError && error.code === 'not_found') {
        return docFail('scope_missing', `The base path ${basePath} does not exist on the NAS`);
      }
      return this.failure(error);
    }
  }

  async resolveScope(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<DocumentScopeOption>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    const scopePath = this.scopePath(scope);
    if (!scopePath) return docFail('scope_missing', 'The stored scope key is not a usable path');

    try {
      const entry = await this.client.getInfo(creds, scopePath);
      if (!entry.isdir) {
        return docFail('scope_missing', 'The bound path is a file on the NAS, not a folder');
      }
      return docOk(scopeOption(scopePath, entry.name));
    } catch (error: unknown) {
      if (error instanceof SynologyDriveError && error.code === 'not_found') {
        return docFail('scope_missing', `The NAS no longer has ${scopePath}`);
      }
      return this.failure(error);
    }
  }

  /**
   * Every file under the scope, folders walked breadth-first.
   *
   * Recursive because FileStation's `list` is not, and a sub-folder someone made
   * upstream would otherwise be an invisible hole in the trip's documents. One
   * request budget covers the whole walk, so a deep tree runs out of budget and
   * says `truncated` instead of holding a worker.
   *
   * The cursor is a digest of the result, not a change token: DSM offers nothing
   * to ask "what changed", and a folder's own mtime does not move when a file
   * inside it is edited in place. It cannot save the walk, so it is only used to
   * tell the core that the walk found exactly what it found last time.
   */
  async list(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
  ): Promise<DocResult<{ documents: RemoteDocument[]; cursor: string | null; cursorUnchanged: boolean; truncated: boolean }>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    const scopePath = this.scopePath(scope);
    if (!scopePath) return docFail('scope_missing', 'The stored scope key is not a usable path');

    const documents: RemoteDocument[] = [];
    const folders = [scopePath];
    const seen = new Set<string>([scopePath]);
    let budget = PROVIDER_MAX_PAGES;
    let truncated = false;

    try {
      while (folders.length > 0) {
        if (budget <= 0) {
          truncated = true;
          break;
        }
        const folder = folders.shift()!;
        const listing = await this.client.listFolder(creds, folder, { maxPages: budget });
        budget -= listing.pages;
        if (listing.truncated) truncated = true;

        for (const entry of listing.entries) {
          const path = normalizeSynoPath(entry.path);
          // A path the adapter cannot spell is one it could not fetch, rename or
          // trash either, so it is left out rather than offered to the core.
          if (!path || !isWithinScope(scopePath, path)) continue;
          if (entry.isdir) {
            if (entry.name === TRASH_FOLDER || seen.has(path)) continue;
            seen.add(path);
            folders.push(path);
            continue;
          }
          documents.push(toRemoteDocument({ ...entry, path }));
        }
      }
    } catch (error: unknown) {
      if (error instanceof SynologyDriveError && error.code === 'not_found') {
        return docFail('scope_missing', `The NAS no longer has ${scopePath}`);
      }
      return this.failure(error);
    }

    const digest = createHash('sha256');
    for (const document of [...documents].sort((a, b) => a.remoteId.localeCompare(b.remoteId))) {
      digest.update(`${document.remoteId}\t${document.remoteVersion}\n`);
    }
    const cursor = `v1:${digest.digest('hex')}`;
    return docOk({
      documents,
      cursor,
      // A partial walk saw a partial tree, so its digest says nothing about
      // whether anything changed.
      cursorUnchanged: !truncated && scope.cursor === cursor,
      truncated,
    });
  }

  async fetch(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<FetchResult>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');

    try {
      const path = this.requireInScope(scope, remoteId);
      // The version is read before the bytes so it describes the file that is
      // about to be streamed. Reading it after would describe whatever the file
      // became while it was being read.
      const entry = await this.client.getInfo(creds, path);
      if (entry.isdir) return docFail('not_found', 'That path is a folder on the NAS');
      const download = await this.client.download(creds, path, MAX_TRANSFER_BYTES);
      return docOk({
        body: download.body,
        size: download.size ?? entry.size,
        mimeType: contentTypeFor(entry.name),
        remoteVersion: snapshotVersion(entry.path, entry.size, entry.mtimeSeconds),
      });
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  /**
   * Upload, then confirm what landed.
   *
   * The confirmation is not ceremony: FileStation answers `success: true` as
   * soon as it has written the part, and the version the core stores has to
   * describe the file as the NAS now sees it (including the mtime DSM rounded
   * to whole seconds), or the next listing reads TREK's own upload as a change
   * made upstream.
   */
  async push(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    req: PushRequest,
  ): Promise<DocResult<PushResult>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    if (req.size > MAX_TRANSFER_BYTES) {
      return docFail('too_large', `This adapter refuses transfers over ${MAX_TRANSFER_BYTES} bytes`);
    }

    const md5 = createHash('md5');
    try {
      const scopePath = this.requireScopePath(scope);
      let folderPath = scopePath;
      let fileName = req.fileName;
      if (req.remoteId !== undefined) {
        const replacing = this.requireInScope(scope, req.remoteId);
        folderPath = parentPath(replacing);
        // The name follows the path being replaced, not the request: changing
        // both the bytes and the name in one upload would leave the old path
        // behind as a second document.
        fileName = baseName(replacing);
      }
      if (!isValidSynoName(fileName)) {
        return docFail('provider_error', 'DSM will not accept that file name');
      }
      const targetPath = joinSynoPath(folderPath, fileName);
      if (normalizeSynoPath(targetPath) !== targetPath || !isWithinScope(scopePath, targetPath)) {
        return docFail('provider_error', 'The resulting file path is not one DSM accepts');
      }

      await this.client.upload(creds, {
        folderPath,
        fileName,
        body: Readable.from(hashing(req.body, md5)),
        size: req.size,
        mimeType: req.mimeType,
        mtimeSeconds: req.mtimeSeconds,
        // Replacing is only ever what the caller asked for. Without a remoteId a
        // name collision is a real conflict: the file at that path is somebody
        // else's, and overwriting it would destroy it silently.
        overwrite: req.remoteId !== undefined,
        createParents: true,
      });

      const entry = await this.client.getInfo(creds, targetPath);
      if (entry.size !== null && entry.size !== req.size) {
        return docFail(
          'checksum_mismatch',
          `The NAS stored ${entry.size} bytes of an ${req.size}-byte upload`,
        );
      }
      if (req.size <= MD5_VERIFY_MAX_BYTES) {
        const remote = await this.client.md5(creds, targetPath);
        if (remote !== md5.digest('hex')) {
          return docFail('checksum_mismatch', 'The NAS computed a different digest for the uploaded bytes');
        }
      }

      return docOk({
        remoteId: entry.path,
        remoteVersion: snapshotVersion(entry.path, entry.size, entry.mtimeSeconds),
        remoteModifiedAt: isoFromSeconds(entry.mtimeSeconds),
        // FileStation stores what it is given; there is no content-addressed
        // store behind it that could answer with an existing file.
        deduplicated: false,
      });
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  /**
   * Rename in place.
   *
   * The caller's `remoteId` is stale afterwards, because the path is the id.
   * That is why `capabilities().stableId` is false: the core is expected to
   * re-derive the id from the folder and the new name, or to find it on the next
   * enumeration.
   */
  async rename(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
    name: string,
  ): Promise<DocResult<{ remoteVersion: string }>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');
    const trimmed = name.trim();
    if (!isValidSynoName(trimmed)) {
      return docFail('provider_error', 'DSM will not accept that file name');
    }

    try {
      const entry = await this.client.rename(creds, this.requireInScope(scope, remoteId), trimmed);
      return docOk({ remoteVersion: snapshotVersion(entry.path, entry.size, entry.mtimeSeconds) });
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  /**
   * Move into the scope's own bin.
   *
   * DSM's API delete is permanent and takes no "to the recycle bin" flag, and a
   * recycle bin is not even enabled on every share. A document that four people
   * are travelling on must not be one API call away from gone, so a propagated
   * delete becomes a move that any of them can undo in File Station.
   */
  async trash(
    conn: DocumentConnectionRef,
    scope: DocumentScopeRef,
    remoteId: string,
  ): Promise<DocResult<void>> {
    const creds = this.credentials(conn);
    if (!creds) return docFail('unauthorized', 'username and password are required');

    try {
      const scopePath = this.requireScopePath(scope);
      const path = this.requireInScope(scope, remoteId);
      const trashPath = joinSynoPath(scopePath, TRASH_FOLDER);
      await this.client.createFolder(creds, scopePath, TRASH_FOLDER);
      try {
        await this.client.move(creds, path, trashPath, { overwrite: false });
      } catch (error: unknown) {
        if (!(error instanceof SynologyDriveError) || error.code !== 'conflict') throw error;
        // A file of that name is already in the bin. Overwriting it would throw
        // away the older copy, which is the one thing a bin exists to prevent,
        // so the older copy steps aside under a timestamped name.
        const occupant = joinSynoPath(trashPath, baseName(path));
        await this.client.rename(creds, occupant, this.archivedName(baseName(path)));
        await this.client.move(creds, path, trashPath, { overwrite: false });
      }
      return docOk(undefined);
    } catch (error: unknown) {
      return this.failure(error);
    }
  }

  /** `boarding.pdf` → `boarding.1789745537.pdf`, keeping the extension readable. */
  private archivedName(name: string): string {
    const stamp = Math.floor(Date.now() / 1000);
    const dot = name.lastIndexOf('.');
    return dot <= 0 ? `${name}.${stamp}` : `${name.slice(0, dot)}.${stamp}${name.slice(dot)}`;
  }

  private credentials(conn: DocumentConnectionRef): SynologyDriveCreds | null {
    const username = (conn.settings.username ?? '').trim();
    const password = conn.secrets.password ?? '';
    if (!username || !password || !conn.baseUrl.trim()) return null;
    const otpCode = (conn.secrets.otp_code ?? '').trim();
    const save = conn.saveSecret;
    return {
      connectionId: conn.connectionId,
      connectionCreatedAt: conn.createdAt,
      baseUrl: conn.baseUrl,
      username,
      password,
      otpCode: otpCode === '' ? undefined : otpCode,
      storedDeviceToken: conn.secrets[DEVICE_TOKEN_SECRET],
      saveDeviceToken: save ? (stored) => save(DEVICE_TOKEN_SECRET, stored) : undefined,
      allowInsecureTls: conn.allowInsecureTls,
    };
  }

  private basePath(conn: DocumentConnectionRef): string {
    const configured = (conn.settings.base_path ?? '').trim();
    if (!configured) return DEFAULT_BASE_PATH;
    return normalizeSynoPath(configured, MAX_SCOPE_PATH_LENGTH) ?? DEFAULT_BASE_PATH;
  }

  /**
   * The folder this trip is bound to, from the scope key.
   *
   * `remoteRootPath` is only a fallback: the key is what a unique index protects
   * and what a restore keeps, so a row whose two columns disagree is read the
   * way the constraint reads it.
   */
  private scopePath(scope: DocumentScopeRef): string | null {
    const raw = scope.scopeKey.startsWith(SCOPE_PREFIX)
      ? scope.scopeKey.slice(SCOPE_PREFIX.length)
      : scope.remoteRootPath;
    if (!raw) return null;
    const path = normalizeSynoPath(raw, MAX_SCOPE_PATH_LENGTH);
    // The FileStation root is not a scope: it holds the shares, and binding a
    // trip to it would put every share on the NAS inside one trip.
    return path === null || path === '/' ? null : path;
  }

  /**
   * A remote id turned into a path this call is allowed to touch.
   *
   * DSM checks DSM permissions and nothing else: the account TREK logs in with
   * can reach every share it owns, so `/trips/japan/../../payroll/2026.pdf` is a
   * perfectly legal request that another trip's binding must never be able to
   * make. The trip boundary exists only here.
   *
   * Throws rather than returning a result, so a caller cannot forget to check
   * it. Every caller already runs inside the try that turns a
   * `SynologyDriveError` into a `DocResult`.
   */
  private requireInScope(scope: DocumentScopeRef, remoteId: string): string {
    const scopePath = this.requireScopePath(scope);
    const path = normalizeSynoPath(remoteId);
    if (!path || path === scopePath || !isWithinScope(scopePath, path)) {
      throw new SynologyDriveError('not_found', 'That path is outside the folder this trip is bound to', {
        detail: 'That path is outside the folder this trip is bound to',
      });
    }
    if (path.split('/').includes(TRASH_FOLDER)) {
      throw new SynologyDriveError('not_found', 'That path is inside the sync bin', {
        detail: 'That path is inside the sync bin',
      });
    }
    return path;
  }

  private requireScopePath(scope: DocumentScopeRef): string {
    const scopePath = this.scopePath(scope);
    if (!scopePath) {
      throw new SynologyDriveError('scope_missing', 'The stored scope key is not a usable path', {
        detail: 'The stored scope key is not a usable path',
      });
    }
    return scopePath;
  }

  private failure<T>(error: unknown): DocResult<T> {
    if (error instanceof SynologyDriveError) {
      return docFail<T>(error.code, error.detail, error.status);
    }
    return docFail<T>('unknown', error instanceof Error ? error.message : undefined);
  }
}
