import { readCappedJson } from '../../../utils/cappedFetch';
import type { DocsyncErrorCode } from '@trek/shared';
import {
  guardDownload,
  providerFetch,
  statusErrorCode,
  type TransportFailure,
  type TransportFailureCode,
} from './provider-http';

import crypto from 'node:crypto';
import { Readable } from 'node:stream';

/**
 * Thin HTTP client for the Papra REST API (github.com/papra-hq/papra).
 * This is the ONLY place that talks to a Papra instance.
 *
 * Verified against a running 26.6.2 instance on 2026-09-18, because Papra's
 * prose documentation is silent on most of what a two-way sync depends on:
 *
 *  - **Auth** is `Authorization: Bearer ppapi_…`. A key carries per-verb scopes
 *    (`documents:read`, `tags:create`, …) and a missing scope answers **401
 *    `auth.unauthorized`**, exactly like a wrong key: there is no 403 to tell
 *    the two apart, so a failed call names the route it failed on instead.
 *  - **No timestamp is usable for change detection.** `updatedAt` did not move
 *    when a tag was added, when the document was renamed, or when it was
 *    trashed; only `createdAt` and `deletedAt` are ever written. Hence
 *    `snapshotVersion()` (a hash over a fixed field order) rather than an
 *    ETag or a modified time.
 *  - **Uploads deduplicate on the sha256 of the bytes**, not on the name. An
 *    identical file answers 409 `document.already_exists`, and if the twin is
 *    in the trash it is **restored** and returned with its ORIGINAL id under a
 *    plain 200. Both are `deduplicated` to the sync core; see `uploadDocument`.
 *  - **The search grammar needs quoting**: `tag:"Trek Reise 2026"` matches,
 *    `tag:Trek Reise 2026` matches nothing. It is an exact, case-insensitive
 *    match on the tag name (`tag:trek-trip-4` does not find `trek-trip-42`),
 *    and it cannot search a sha256 at all.
 *  - **`custom-properties`, `webhooks` and the restore and hard-delete routes
 *    are session-only.** With a valid API key they answer 401; with a browser
 *    session the same request succeeds. So there is no anchor property to write
 *    and no subscription TREK can register for itself.
 *  - `pageSize` caps at 100 (101 is a 400), `pageIndex` is 0-based, and
 *    `documentsCount` is the total rather than the length of the page. The
 *    trash listing takes those two parameters and refuses every other one.
 */

const TIMEOUT_MS = 20000;

/** Uploads and downloads move real files, so they get their own budget. */
const TRANSFER_TIMEOUT_MS = 180000;

/** Papra's JSON answers are documents metadata; a page of 100 is tens of kilobytes. */
const MAX_JSON_BYTES = 8 * 1024 * 1024;

/**
 * A runaway guard on a download, not the sync core's file-size policy. That
 * one lives in the core, which knows what it is willing to store. This only has
 * to stop an instance that answers a document request with an endless body.
 */
const MAX_DOWNLOAD_BYTES = 512 * 1024 * 1024;

/** Papra refuses anything above this outright. */
export const PAPRA_PAGE_SIZE = 100;

/**
 * How many pages one enumeration walks before reporting itself incomplete.
 *
 * Papra has no change feed, so a sync is a full walk of the tag every time. A
 * cap rather than a loop: a caller told the answer is partial can keep the
 * previous state instead of reading absence as deletion.
 */
export const PAPRA_MAX_PAGES = 50;

/** Papra requires a colour on every tag, so scope creation has to pick one. */
export const PAPRA_DEFAULT_TAG_COLOR = '#4F46E5';

/** `org_` + 24 lowercase alphanumerics. Papra 400s on anything else. */
const ORG_ID_PATTERN = /^org_[a-z0-9]{24}$/;

export interface PapraCreds {
  /** Instance origin. The client appends `/api` itself. */
  baseUrl: string;
  apiKey: string;
  organizationId: string;
  allowInsecureTls: boolean;
}

export interface PapraTag {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  documentsCount: number | null;
}

export interface PapraDocument {
  id: string;
  name: string;
  originalName: string | null;
  originalSize: number | null;
  /** Real sha256 of the stored bytes, and the key Papra deduplicates on. */
  originalSha256Hash: string | null;
  mimeType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  isDeleted: boolean;
  /**
   * Absent from the upload and rename answers, present in every listing. Null
   * therefore means "not stated here", never "no tags".
   */
  tags: PapraTag[] | null;
}

export interface PapraPage {
  documents: PapraDocument[];
  /** Total across all pages, not the length of this one. */
  total: number;
}

export interface PapraUploadResult {
  document: PapraDocument;
  /**
   * True when Papra answered with a document it already held: a trashed twin it
   * restored under its original id, or, on the 409 path, the live twin this
   * client then looked up.
   */
  deduplicated: boolean;
}

export interface PapraDownload {
  body: Readable;
  /** From `content-length`, which Papra does send on the file route. */
  size: number | null;
}

/**
 * A failed Papra call, carrying the reason as a sync-core error code.
 *
 * The upstream message is English and occasionally an HTML error page from a
 * reverse proxy, so it travels in `detail` for the self-hoster's log while the
 * code is what the user sees through i18n. `papraCode` is kept separately
 * because several branches turn on it: `document.already_exists` is a dedup,
 * not a failure, and `tags.not_found` is a lost scope rather than a bad id.
 */
export class PapraError extends Error {
  readonly code: DocsyncErrorCode;
  readonly status?: number;
  readonly detail?: string;
  readonly papraCode?: string;

  constructor(code: DocsyncErrorCode, message: string, status?: number, detail?: string, papraCode?: string) {
    super(message);
    this.name = 'PapraError';
    this.code = code;
    this.status = status;
    this.detail = detail;
    this.papraCode = papraCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseTag(value: unknown): PapraTag | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const name = str(value.name);
  if (!id || name === null) return null;
  return {
    id,
    name,
    color: str(value.color),
    description: str(value.description),
    documentsCount: num(value.documentsCount),
  };
}

function parseDocument(value: unknown): PapraDocument | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (!id) return null;
  const rawTags = value.tags;
  let tags: PapraTag[] | null = null;
  if (Array.isArray(rawTags)) {
    tags = [];
    for (const entry of rawTags) {
      const tag = parseTag(entry);
      if (tag) tags.push(tag);
    }
  }
  return {
    id,
    // Papra has always sent a name; falling back to the original one keeps a
    // stripped-down answer usable instead of dropping the whole document.
    name: str(value.name) ?? str(value.originalName) ?? id,
    originalName: str(value.originalName),
    originalSize: num(value.originalSize),
    originalSha256Hash: str(value.originalSha256Hash),
    mimeType: str(value.mimeType),
    createdAt: str(value.createdAt),
    updatedAt: str(value.updatedAt),
    deletedAt: str(value.deletedAt),
    isDeleted: value.isDeleted === true,
    tags,
  };
}

/** The `{ error: { message, code } }` envelope Papra answers every 4xx with. */
function parseErrorBody(body: unknown): { message: string | null; code: string | null } {
  if (!isRecord(body) || !isRecord(body.error)) return { message: null, code: null };
  return { message: str(body.error.message), code: str(body.error.code) };
}

/**
 * `https://host/papra/api/` → `https://host/papra/api`, tolerating what people
 * paste. Without it a pasted `…/api` becomes `…/api/api` and every call 404s.
 */
export function papraApiBase(baseUrl: string): string {
  const origin = baseUrl
    .trim()
    .replace(/(?<!\/)\/+$/, '')
    .replace(/\/api$/i, '');
  return `${origin}/api`;
}

/**
 * Stable snapshot hash over a FIXED field order, standing in for the version
 * marker Papra does not have. `updatedAt` is in it although it never moves: it
 * costs nothing and it is the field that would start carrying the signal if a
 * later Papra ever began writing it.
 */
export function snapshotVersion(doc: PapraDocument): string {
  const snapshot = [doc.id, doc.name, doc.originalSha256Hash ?? '', doc.updatedAt ?? ''];
  return crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

/**
 * A tag name as the search grammar wants it: quoted, because an unquoted name
 * with a space matches nothing at all.
 *
 * Returns null for a name the grammar cannot express (Papra accepts `"` in a
 * tag name and offers no escape for it), so the caller can fall back to
 * enumerating the organisation and filtering by tag id.
 */
export function tagSearchQuery(tagName: string): string | null {
  if (tagName.includes('"') || tagName.includes('\\')) return null;
  return `tag:"${tagName}"`;
}

/**
 * Papra's status codes mapped onto the sync core's vocabulary.
 *
 * 400 on a path parameter is a `not_found` rather than a provider fault: the
 * ids are format-checked upstream, so a remote id Papra refuses to parse is one
 * that cannot exist. The organisation id is validated here before the call, so
 * it can never be the parameter Papra is complaining about.
 */
function classify(status: number, papraCode: string | null): DocsyncErrorCode {
  if (papraCode === 'tags.not_found') return 'scope_missing';
  if (status === 400) return papraCode === 'server.invalid_request.params' ? 'not_found' : 'provider_error';
  return statusErrorCode(status);
}

const TRANSPORT_MESSAGES: Record<TransportFailureCode, string> = {
  ssrf_blocked: 'The Papra URL is not allowed',
  timeout: 'Papra did not answer in time',
  tls_untrusted: 'Papra presented a certificate that is not trusted',
  unreachable: 'Could not reach Papra',
};

/** Why a request never produced a response at all. */
function transportError(failure: TransportFailure): PapraError {
  return new PapraError(failure.code, TRANSPORT_MESSAGES[failure.code], undefined, failure.detail);
}

/** RFC 7578 as undici's own FormData writes it: UTF-8 bytes, three characters escaped. */
function escapeFormValue(value: string): string {
  return value.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22');
}

/**
 * A media type that is safe to put in a header.
 *
 * The value comes from `trip_files.mime_type`, which an upload can influence,
 * and it went into the part header untouched while the filename beside it was
 * escaped. A CR or LF in it ends the header early and lets whatever follows be
 * read as headers of its own. Anything that is not a plain media type is
 * replaced rather than repaired: a mangled type is not worth guessing at, and
 * the generic one is what an unknown file gets anyway.
 */
function safeMimeType(raw: string): string {
  const TOKEN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;
  return TOKEN.test(raw) ? raw : 'application/octet-stream';
}

/** The bytes before the file in a one-field multipart body. Exported so the tests can read them. */
export function multipartHeader(boundary: string, fileName: string, mimeType: string): Buffer {
  return Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${escapeFormValue(fileName)}"\r\n` +
      `Content-Type: ${safeMimeType(mimeType)}\r\n\r\n`,
    'utf8',
  );
}

export function multipartFooter(boundary: string): Buffer {
  return Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
}

export class PapraClient {
  /**
   * One authenticated JSON call.
   *
   * `expectedEmpty` covers the 204s (tagging, some deletes): those have no body
   * to parse and asking for one would turn a success into a parse failure.
   */
  private async call(
    creds: PapraCreds,
    method: string,
    path: string,
    options: { query?: Record<string, string>; json?: unknown; expectEmpty?: boolean } = {},
  ): Promise<unknown> {
    const url = new URL(papraApiBase(creds.baseUrl) + path);
    for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, value);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${creds.apiKey}`,
      Accept: 'application/json',
    };
    if (options.json !== undefined) headers['Content-Type'] = 'application/json';

    const response = await providerFetch(
      url.toString(),
      { method, headers, body: options.json === undefined ? undefined : JSON.stringify(options.json) },
      { timeoutMs: TIMEOUT_MS, allowInsecureTls: creds.allowInsecureTls, onTransportFailure: transportError },
    );

    return this.readBody(response, `${method} ${path}`, options.expectEmpty === true);
  }

  /** Shared tail of every JSON call: cap the body, parse it, turn a non-2xx into a PapraError. */
  private async readBody(response: Response, route: string, expectEmpty: boolean): Promise<unknown> {
    const body = response.status === 204 ? null : await readCappedJson<unknown>(response, MAX_JSON_BYTES);

    if (!response.ok) {
      const { message, code } = parseErrorBody(body);
      throw new PapraError(
        classify(response.status, code),
        `Papra answered HTTP ${response.status} on ${route}`,
        response.status,
        message ?? undefined,
        code ?? undefined,
      );
    }
    if (expectEmpty) return null;
    if (body === undefined) {
      throw new PapraError(
        'provider_error',
        'Papra returned something that is not JSON',
        response.status,
        `on ${route}; check the URL points at Papra itself and not at a login page in front of it`,
      );
    }
    return body;
  }

  /**
   * The organisation the connection names, checked before it is put in a URL.
   *
   * Papra answers a malformed organisation id with the same 400 shape it uses
   * for a malformed document id, and those two mean very different things to a
   * caller. Settling it here keeps the wire-level mapping unambiguous.
   */
  private orgPath(creds: PapraCreds): string {
    if (!ORG_ID_PATTERN.test(creds.organizationId)) {
      throw new PapraError(
        'provider_error',
        'The organisation id is not in Papra’s format',
        undefined,
        `expected org_ followed by 24 lowercase alphanumerics, got "${creds.organizationId}"`,
      );
    }
    return `/organizations/${creds.organizationId}`;
  }

  /**
   * The organisations the key can reach, for the connection's display name.
   *
   * Separate from the reachability test on purpose: this needs the
   * `organizations:read` scope, which a key limited to documents and tags does
   * not carry, and a connection that syncs perfectly well should not fail its
   * probe over a missing label.
   */
  async listOrganizations(creds: PapraCreds): Promise<Array<{ id: string; name: string }>> {
    const body = await this.call(creds, 'GET', '/organizations');
    const raw = isRecord(body) && Array.isArray(body.organizations) ? body.organizations : [];
    const out: Array<{ id: string; name: string }> = [];
    for (const entry of raw) {
      if (!isRecord(entry)) continue;
      const id = str(entry.id);
      if (!id) continue;
      out.push({ id, name: str(entry.name) ?? id });
    }
    return out;
  }

  async listTags(creds: PapraCreds): Promise<PapraTag[]> {
    const body = await this.call(creds, 'GET', `${this.orgPath(creds)}/tags`);
    const raw = isRecord(body) && Array.isArray(body.tags) ? body.tags : [];
    const tags: PapraTag[] = [];
    for (const entry of raw) {
      const tag = parseTag(entry);
      if (tag) tags.push(tag);
    }
    return tags;
  }

  async createTag(creds: PapraCreds, name: string, color: string): Promise<PapraTag> {
    const body = await this.call(creds, 'POST', `${this.orgPath(creds)}/tags`, { json: { name, color } });
    const tag = isRecord(body) ? parseTag(body.tag) : null;
    if (!tag) throw new PapraError('provider_error', 'Papra created a tag but did not describe it');
    return tag;
  }

  /**
   * One page of documents.
   *
   * Sorted by `createdAt` ascending rather than descending: a document uploaded
   * while the walk is in flight then lands at the END of the last page, where
   * missing it costs one sync cycle. Descending puts it at the front and pushes
   * every later page down by one, which silently skips an existing document.
   *
   * The trash route takes `pageIndex` and `pageSize` and NOTHING else (it
   * rejects a sort or a search with 400 `Invalid key: Expected never` rather
   * than ignoring it), so the sort and the query are dropped there.
   */
  async listDocuments(
    creds: PapraCreds,
    options: { searchQuery?: string; pageIndex: number; deleted?: boolean },
  ): Promise<PapraPage> {
    const trash = options.deleted === true;
    const query: Record<string, string> = {
      pageIndex: String(options.pageIndex),
      pageSize: String(PAPRA_PAGE_SIZE),
    };
    if (!trash) {
      query.sortField = 'createdAt';
      query.sortOrder = 'asc';
      if (options.searchQuery) query.searchQuery = options.searchQuery;
    }

    const path = `${this.orgPath(creds)}/documents${trash ? '/deleted' : ''}`;
    const body = await this.call(creds, 'GET', path, { query });
    const raw = isRecord(body) && Array.isArray(body.documents) ? body.documents : [];
    const documents: PapraDocument[] = [];
    for (const entry of raw) {
      const doc = parseDocument(entry);
      if (doc) documents.push(doc);
    }
    const total = isRecord(body) ? num(body.documentsCount) : null;
    return { documents, total: total ?? documents.length };
  }

  /**
   * Every page, up to the cap.
   *
   * `truncated` is the honest half of the answer: the sync core reads absence
   * from a listing as a possible deletion, so a walk that stopped early has to
   * say so or a capped enumeration would look like a mass delete.
   */
  async listAllDocuments(
    creds: PapraCreds,
    options: { searchQuery?: string; deleted?: boolean } = {},
  ): Promise<{ documents: PapraDocument[]; truncated: boolean }> {
    const documents: PapraDocument[] = [];
    let truncated = false;

    for (let pageIndex = 0; pageIndex < PAPRA_MAX_PAGES; pageIndex++) {
      const page = await this.listDocuments(creds, { ...options, pageIndex });
      documents.push(...page.documents);
      if (page.documents.length < PAPRA_PAGE_SIZE) break;
      if (documents.length >= page.total) break;
      if (pageIndex === PAPRA_MAX_PAGES - 1) truncated = true;
    }

    return { documents, truncated };
  }

  async getDocument(creds: PapraCreds, documentId: string): Promise<PapraDocument> {
    const body = await this.call(creds, 'GET', `${this.orgPath(creds)}/documents/${encodeURIComponent(documentId)}`);
    const doc = isRecord(body) ? parseDocument(body.document) : null;
    if (!doc) throw new PapraError('provider_error', 'Papra returned a document in an unexpected shape');
    return doc;
  }

  /**
   * The stored bytes.
   *
   * The response's own `content-type` is always `application/octet-stream`, so
   * the caller takes the MIME type from the document record instead of from the
   * transfer.
   */
  async downloadDocument(creds: PapraCreds, documentId: string): Promise<PapraDownload> {
    const url = `${papraApiBase(creds.baseUrl) + this.orgPath(creds)}/documents/${encodeURIComponent(documentId)}/file`;

    const response = await providerFetch(
      url,
      { method: 'GET', headers: { Authorization: `Bearer ${creds.apiKey}` } },
      { timeoutMs: TRANSFER_TIMEOUT_MS, allowInsecureTls: creds.allowInsecureTls, onTransportFailure: transportError },
    );

    if (!response.ok) {
      const body = await readCappedJson<unknown>(response, MAX_JSON_BYTES);
      const { message, code } = parseErrorBody(body);
      throw new PapraError(
        classify(response.status, code),
        `Papra answered HTTP ${response.status} on the document file`,
        response.status,
        message ?? undefined,
        code ?? undefined,
      );
    }
    return guardDownload(response, {
      maxBytes: MAX_DOWNLOAD_BYTES,
      tooLarge: () =>
        new PapraError('too_large', 'The Papra document is larger than TREK will transfer', response.status),
      noBody: () => new PapraError('provider_error', 'Papra answered the document file with no body', response.status),
    });
  }

  /**
   * Store bytes as a new document.
   *
   * Streamed rather than buffered: the sync core hands over whatever is in trip
   * storage, and holding a document in memory to build a multipart body is the
   * one thing a file sync must not do. The body is assembled by hand because
   * `FormData` would want the bytes first.
   *
   * Two answers are not what they look like. A 200 carrying a `createdAt` from
   * before this request is a trashed twin Papra restored under its original id,
   * and a 409 `document.already_exists` is a live twin. Neither is a new
   * document, and the caller resolves the second one through `findByHash`.
   */
  async uploadDocument(
    creds: PapraCreds,
    file: { body: Readable; fileName: string; mimeType: string },
  ): Promise<PapraUploadResult> {
    const boundary = `----trek${crypto.randomBytes(16).toString('hex')}`;
    const header = multipartHeader(boundary, file.fileName, file.mimeType);
    const footer = multipartFooter(boundary);

    async function* frame(): AsyncGenerator<Buffer> {
      yield header;
      for await (const chunk of file.body) {
        yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      }
      yield footer;
    }

    const sentAt = Date.now();
    const response = await providerFetch(
      `${papraApiBase(creds.baseUrl) + this.orgPath(creds)}/documents`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          Accept: 'application/json',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: Readable.toWeb(Readable.from(frame())),
        // Required by undici for a streamed request body; the platform types
        // carry the field, the DOM lib this project does not load does not.
        duplex: 'half',
      },
      { timeoutMs: TRANSFER_TIMEOUT_MS, allowInsecureTls: creds.allowInsecureTls, onTransportFailure: transportError },
    );
    const elapsedMs = Date.now() - sentAt;

    const body = await this.readBody(response, 'POST /documents', false);
    const document = isRecord(body) ? parseDocument(body.document) : null;
    if (!document)
      throw new PapraError('provider_error', 'Papra accepted the upload but did not describe the document');

    return {
      document,
      deduplicated: isRestoredTwin(document, response.headers.get('date'), elapsedMs),
    };
  }

  /**
   * The document holding these bytes, for the 409 path.
   *
   * Three widening passes because Papra cannot search a hash: the name the
   * upload used, then every live document, then the trash. The name pass is
   * almost always enough and costs one request; the others exist because a twin
   * can have been stored under a different name entirely, which is exactly the
   * case where guessing would pair the wrong document.
   */
  async findByHash(creds: PapraCreds, sha256: string, nameHint?: string): Promise<PapraDocument | null> {
    const wanted = sha256.toLowerCase();
    const match = (docs: PapraDocument[]): PapraDocument | null =>
      docs.find((doc) => doc.originalSha256Hash?.toLowerCase() === wanted) ?? null;

    if (nameHint) {
      const byName = await this.listAllDocuments(creds, { searchQuery: nameHint });
      const hit = match(byName.documents);
      if (hit) return hit;
    }
    const live = await this.listAllDocuments(creds);
    const hit = match(live.documents);
    if (hit) return hit;

    const trashed = await this.listAllDocuments(creds, { deleted: true });
    return match(trashed.documents);
  }

  /**
   * Put a tag on a document.
   *
   * An already-present tag answers 409 `documents.already_has_tag`, which is the
   * state the caller wanted, so it is swallowed here rather than left for every
   * call site to recognise.
   */
  async addTag(creds: PapraCreds, documentId: string, tagId: string): Promise<void> {
    try {
      await this.call(creds, 'POST', `${this.orgPath(creds)}/documents/${encodeURIComponent(documentId)}/tags`, {
        json: { tagId },
        expectEmpty: true,
      });
    } catch (err: unknown) {
      if (err instanceof PapraError && err.papraCode === 'documents.already_has_tag') return;
      throw err;
    }
  }

  async renameDocument(creds: PapraCreds, documentId: string, name: string): Promise<PapraDocument> {
    const body = await this.call(creds, 'PATCH', `${this.orgPath(creds)}/documents/${encodeURIComponent(documentId)}`, {
      json: { name },
    });
    const doc = isRecord(body) ? parseDocument(body.document) : null;
    if (!doc) throw new PapraError('provider_error', 'Papra renamed the document but did not describe it');
    return doc;
  }

  /**
   * Move a document to Papra's trash.
   *
   * This is the only destructive call the API offers a key: permanent deletion
   * and restoring are session-only, and `?permanent=true` is accepted and then
   * ignored, which is worse than being refused. Papra keeps trashed documents
   * for its configured retention window, so a wrong propagation stays
   * recoverable through its web interface.
   */
  async trashDocument(creds: PapraCreds, documentId: string): Promise<void> {
    await this.call(creds, 'DELETE', `${this.orgPath(creds)}/documents/${encodeURIComponent(documentId)}`, {
      expectEmpty: true,
    });
  }
}

/**
 * Whether a 200 from the upload route describes a document Papra already held:
 * a trashed twin it silently restored under its original id.
 *
 * Papra says nothing about which of the two happened, so this has to be read
 * off `createdAt`: a restored document was created before this request started.
 * That start is not a time this process knows in Papra's clock, so it is
 * reconstructed from the answer as `Date` minus how long the call took.
 * Comparing a duration instead of two clocks is what makes the test survive a
 * self-hosted instance whose clock is minutes out.
 *
 * `Date` carries whole seconds, so the reconstruction always lands at or BEFORE
 * the true start. That asymmetry is chosen rather than tolerated: a document
 * this request really did create can never be mistaken for a restore, and the
 * price is blindness to a twin trashed and re-pushed within roughly a second of
 * being created. Nothing else in the answer closes that second: the name is
 * not a tiebreaker, because a restore overwrites the stored name with the
 * filename of the upload that triggered it.
 *
 * Without a `Date` header at all there is nothing to anchor to and the local
 * clock has to stand in, which is why that branch needs a tolerance.
 */
function isRestoredTwin(doc: PapraDocument, dateHeader: string | null, elapsedMs: number): boolean {
  if (!doc.createdAt) return false;
  const created = Date.parse(doc.createdAt);
  if (!Number.isFinite(created)) return false;

  const answeredAt = dateHeader ? Date.parse(dateHeader) : Number.NaN;
  if (Number.isFinite(answeredAt)) return created < answeredAt - elapsedMs;
  return created < Date.now() - elapsedMs - UNANCHORED_CLOCK_TOLERANCE_MS;
}

/** How far a headerless instance's clock may sit from this one before dedup detection misfires. */
const UNANCHORED_CLOCK_TOLERANCE_MS = 30000;
