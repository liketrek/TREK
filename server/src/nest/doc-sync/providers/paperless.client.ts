import { randomUUID } from 'node:crypto';
import type { DocsyncErrorCode } from '@trek/shared';
import { readCappedJson, readCappedText, discardBody } from '../../../utils/cappedFetch';
import {
  providerFetch,
  statusErrorCode,
  type TransportFailure,
  type TransportFailureCode,
} from './provider-http';
import {
  PROVIDER_JSON_MAX_BYTES,
  PROVIDER_MAX_PAGES,
  PROVIDER_TIMEOUT_MS,
  PROVIDER_TRANSFER_TIMEOUT_MS,
} from '../doc-sync.constants';

/**
 * Thin HTTP client for the Paperless-ngx REST API.
 * This is the ONLY place that talks to a trip's Paperless instance.
 *
 * Measured against Paperless-ngx 3.1.3 / API version 10, not against its
 * documentation. The two disagree in the places that matter here:
 *
 *  - **A document carries no top-level `checksum` at 3.x.** The hash lives in
 *    `versions[]`, one entry per uploaded revision, and it is a **sha256** of
 *    the original file (verified: an uploaded file's sha256 came back verbatim).
 *    `versions` arrives newest first with the ORIGINAL marked `is_root: true`,
 *    so the entry describing the current bytes is the newest `added`, not the
 *    root one.
 *  - `GET /api/documents/{id}/download/` hands out the **archived**, OCR'd PDF,
 *    whose bytes are not the ones that were uploaded (398 B in, 8483 B out).
 *    Only `?original=true` round-trips, and only it matches the checksum.
 *  - **An upload answers with a task UUID, not a document.** The consume job is
 *    asynchronous (~3 s for a one-page PDF with OCR), and `GET /api/tasks/`
 *    answers a PAGINATED object at 3.x where older builds answered a bare
 *    array. `status` is lower case (`success`, `failure`) where older builds
 *    shouted it, so both spellings are compared case-insensitively.
 *  - **`POST /api/documents/{id}/update_version/` keeps the document id**, and
 *    with it the tags and custom fields, but the task it returns reports a
 *    DIFFERENT, internal document id (the version row), which answers 404 on
 *    `/api/documents/{id}/`. Callers must keep the id they updated.
 *  - **Duplicate bytes are not refused.** Uploading the same file twice yields
 *    two documents with the same checksum and an empty `duplicate_documents`,
 *    so there is no upstream deduplication to report. `?checksum__iexact=` does
 *    filter, which is what makes a lost upload recoverable instead of doubled.
 *  - **Unknown query parameters are ignored, not rejected.** A filter that does
 *    not exist silently widens the result, so every filter used here was proven
 *    with a matching and a non-matching value.
 *  - The MIME allow-list is enforced by the server: an unsupported type comes
 *    back as `400 {"document": ["File type … not supported"]}` before any task
 *    is created. Office formats pass only on an instance with Tika configured.
 *
 * The API version is pinned in the Accept header. Paperless moves its default
 * with the server version, so an unpinned client changes shape under a routine
 * `docker pull`. That is exactly how the `checksum` field moved out of the
 * document serializer.
 */

/** The version this client's response handling was written against. */
const API_ACCEPT = 'application/json; version=10';

/** Tags, documents and tasks are small rows; a page of them is never megabytes. */
const MAX_JSON_BYTES = PROVIDER_JSON_MAX_BYTES;

/** Documents per page. Paperless accepts more, but the response grows with it. */
export const DOCUMENT_PAGE_SIZE = 100;
export const TAG_PAGE_SIZE = 100;

/** How often the consume task is polled, and for how long before giving up. */
export const TASK_POLL_INTERVAL_MS = 1500;
export const TASK_POLL_TIMEOUT_MS = PROVIDER_TRANSFER_TIMEOUT_MS;

export interface PaperlessCreds {
  /** Instance origin. The client appends `/api` itself. */
  baseUrl: string;
  /** The API token from the user's Paperless profile. Never logged. */
  token: string;
  allowInsecureTls: boolean;
}

/**
 * A failed Paperless call, carrying the reason as one of TREK's codes.
 *
 * The upstream text never reaches a user: it is English, it sometimes quotes
 * the URL back, and behind an auth proxy it is an HTML login page. `detail`
 * keeps it for the self-hoster reading their own log.
 */
export class PaperlessError extends Error {
  readonly code: DocsyncErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: DocsyncErrorCode, message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'PaperlessError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export interface PaperlessTag {
  id: number;
  name: string;
  /** Absent on the POST response, present in listings. */
  documentCount: number | null;
}

export interface PaperlessCustomField {
  id: number;
  name: string;
  dataType: string | null;
}

/** One entry of a document's `versions`, i.e. one uploaded revision. */
export interface PaperlessVersion {
  id: number;
  /** sha256 hex of that revision's original file. */
  checksum: string | null;
  added: string | null;
  isRoot: boolean;
}

export interface PaperlessDocument {
  id: number;
  title: string;
  /** The name the file was uploaded under; null on documents created elsewhere. */
  originalFileName: string | null;
  mimeType: string | null;
  /** The opaque version marker. Bumped by edits, uploads and bulk edits alike. */
  modified: string | null;
  added: string | null;
  /** Non-null only in `/api/trash/`; a listed document is never trashed. */
  deletedAt: string | null;
  tagIds: number[];
  versions: PaperlessVersion[];
}

export interface PaperlessTask {
  taskId: string;
  /** Lower case at 3.x, upper case on older builds. Compared case-insensitively. */
  status: string;
  documentIds: number[];
  errorMessage: string | null;
}

export interface PaperlessProfile {
  username: string;
  version: string | null;
  /** Django permission codenames the token's user holds, e.g. `add_workflow`. */
  permissions: string[];
}

export interface PaperlessUploadFile {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}

export interface PaperlessWorkflowSpec {
  name: string;
  /** Only documents carrying this tag fire the webhook. */
  tagId: number;
  callbackUrl: string;
  /** Sent as a request header, so it never lands in an access log. */
  secretHeader: { name: string; value: string };
  /** Flat string map; Paperless sends it as the JSON body. */
  params: Record<string, string>;
}

/**
 * Paperless's own ceiling for a webhook URL (`max_length` on the field). A
 * longer callback is rejected by the serializer with a 400 that reads like a
 * generic validation failure, so it is worth catching before the round trip.
 */
export const WEBHOOK_URL_MAX_LENGTH = 256;

/**
 * Workflow trigger types, as `OPTIONS /api/workflows/` enumerates them. There
 * is deliberately no deletion trigger upstream: a document moved to the trash
 * fires nothing, which is why a webhook can only ever mean "look now".
 */
export const TRIGGER_DOCUMENT_ADDED = 2;
export const TRIGGER_DOCUMENT_UPDATED = 3;
/** Action type 4 is "Webhook". */
export const ACTION_WEBHOOK = 4;
/**
 * Consume folder, API upload, mail fetch, web UI: all four, or a document
 * dropped into Paperless's own interface would never reach TREK.
 */
const TRIGGER_SOURCES = [1, 2, 3, 4];

/**
 * `https://host/paperless/` → `https://host/paperless/api`, tolerating what
 * people paste: a trailing slash, or the `/api` they copied out of the browser.
 */
export function apiBase(baseUrl: string): string {
  const origin = baseUrl
    .trim()
    .replace(/(?<!\/)\/+$/, '')
    .replace(/\/api$/i, '');
  return `${origin}/api`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * The rows of a paginated answer, or of a bare array.
 *
 * Both shapes are live: `/api/tasks/` answers a bare array on older builds and
 * a paginated object at 3.x, and reading only one of them would make the upload
 * path fail on whichever half of the installed base it guessed wrong.
 */
function pageRows(data: unknown): { rows: unknown[]; hasNext: boolean; count: number | null } {
  if (Array.isArray(data)) return { rows: data, hasNext: false, count: data.length };
  if (isRecord(data) && Array.isArray(data.results)) {
    return {
      rows: data.results,
      hasNext: typeof data.next === 'string' && data.next.length > 0,
      count: asNumber(data.count),
    };
  }
  throw new PaperlessError('provider_error', 'Paperless answered a listing in an unknown shape');
}

function parseTag(row: unknown): PaperlessTag | null {
  if (!isRecord(row)) return null;
  const id = asNumber(row.id);
  const name = asString(row.name);
  if (id === null || name === null) return null;
  return { id, name, documentCount: asNumber(row.document_count) };
}

function parseCustomField(row: unknown): PaperlessCustomField | null {
  if (!isRecord(row)) return null;
  const id = asNumber(row.id);
  const name = asString(row.name);
  if (id === null || name === null) return null;
  return { id, name, dataType: asString(row.data_type) };
}

function parseVersions(value: unknown): PaperlessVersion[] {
  if (!Array.isArray(value)) return [];
  const versions: PaperlessVersion[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const id = asNumber(row.id);
    if (id === null) continue;
    versions.push({
      id,
      checksum: asString(row.checksum),
      added: asString(row.added),
      isRoot: row.is_root === true,
    });
  }
  return versions;
}

function parseDocument(row: unknown): PaperlessDocument | null {
  if (!isRecord(row)) return null;
  const id = asNumber(row.id);
  if (id === null) return null;
  const tagIds = Array.isArray(row.tags)
    ? row.tags.filter((tag): tag is number => typeof tag === 'number')
    : [];
  return {
    id,
    title: asString(row.title) ?? '',
    originalFileName: asString(row.original_file_name),
    mimeType: asString(row.mime_type),
    modified: asString(row.modified),
    added: asString(row.added),
    deletedAt: asString(row.deleted_at),
    tagIds,
    versions: parseVersions(row.versions),
  };
}

function parseTask(row: unknown): PaperlessTask | null {
  if (!isRecord(row)) return null;
  const taskId = asString(row.task_id);
  if (taskId === null) return null;
  const related = Array.isArray(row.related_document_ids)
    ? row.related_document_ids.filter((value): value is number => typeof value === 'number')
    : [];
  const fromResult = isRecord(row.result_data) ? asNumber(row.result_data.document_id) : null;
  const documentIds = related.length > 0 ? related : fromResult === null ? [] : [fromResult];
  return {
    taskId,
    status: asString(row.status) ?? '',
    documentIds,
    errorMessage: isRecord(row.result_data) ? asString(row.result_data.error_message) : null,
  };
}

/**
 * The revision whose bytes `?original=true` currently serves.
 *
 * `versions` arrives newest first at 3.1.3, but that is an ordering nobody
 * promised, so the newest `added` decides and the array order is only the
 * tie-breaker. The root entry is explicitly NOT it: after an in-place replace
 * the root is the file that was replaced.
 */
export function currentVersion(doc: PaperlessDocument): PaperlessVersion | null {
  let best: PaperlessVersion | null = null;
  let bestAt = Number.NEGATIVE_INFINITY;
  for (const version of doc.versions) {
    const parsed = version.added === null ? Number.NaN : Date.parse(version.added);
    const rank = Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
    if (best === null || rank > bestAt) {
      best = version;
      bestAt = rank;
    }
  }
  return best;
}

/** sha256 hex, or null. A hash of another shape must not be sold as one. */
export function sha256OrNull(value: string | null): string | null {
  return value !== null && /^[0-9a-f]{64}$/i.test(value) ? value.toLowerCase() : null;
}

const TRANSPORT_MESSAGES: Record<TransportFailureCode, string> = {
  ssrf_blocked: 'The address is blocked',
  timeout: 'Paperless did not answer in time',
  tls_untrusted: 'The certificate of this Paperless instance is not trusted',
  unreachable: 'Could not reach Paperless',
};

function transportError(failure: TransportFailure): PaperlessError {
  return new PaperlessError(failure.code, TRANSPORT_MESSAGES[failure.code], undefined, failure.detail);
}

/**
 * The code for an HTTP status, refined by the body where the status alone is
 * ambiguous. Paperless answers 400 both for "I do not take this file type"
 * (a per-document verdict the user can act on) and for a malformed request,
 * and the difference is only in the text.
 */
function classify(status: number, body: string): DocsyncErrorCode {
  if (status === 400) {
    if (/not supported/i.test(body)) return 'unsupported_type';
    if (/unique constraint|already exists/i.test(body)) return 'conflict';
    return 'provider_error';
  }
  return statusErrorCode(status);
}

/** Trim an upstream message to something a log line can hold. */
function shorten(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 400 ? `${flat.slice(0, 400)}…` : flat;
}

interface RequestOptions {
  method?: string;
  query?: Record<string, string | undefined>;
  json?: unknown;
  body?: Buffer;
  contentType?: string;
  timeoutMs?: number;
  /** Streaming responses are handed back unread; everything else is capped. */
  raw?: boolean;
}

interface MultipartField {
  name: string;
  value: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Everything a header value may not contain, replaced rather than rejected. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n"\\]/g, '_');
}

/**
 * A multipart/form-data body, built by hand.
 *
 * `FormData` plus `Blob` would be shorter but hands undici a body without a
 * length; a Buffer keeps Content-Length honest, which is what lets a reverse
 * proxy in front of Paperless enforce its own upload limit instead of buffering
 * an unbounded stream. Field and file names are stripped of quotes and line
 * breaks first: a document called `a".pdf` would otherwise end the
 * Content-Disposition header early and rewrite the rest of the request.
 */
export function buildMultipart(
  fields: MultipartField[],
  file: PaperlessUploadFile,
): { body: Buffer; contentType: string } {
  const boundary = `----TrekDocSync${randomUUID().replace(/-/g, '')}`;
  const parts: Buffer[] = [];
  for (const field of fields) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${headerSafe(field.name)}"\r\n\r\n${field.value}\r\n`,
        'utf8',
      ),
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${headerSafe(file.fileName)}"\r\n` +
        `Content-Type: ${headerSafe(file.mimeType)}\r\n\r\n`,
      'utf8',
    ),
  );
  parts.push(file.bytes);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));
  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

export class PaperlessClient {
  /**
   * One authenticated request. Every call in this file goes through it, so the
   * token header, the pinned API version, the timeout and the TLS decision are
   * made in exactly one place.
   */
  private async request(
    creds: PaperlessCreds,
    path: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const url = new URL(apiBase(creds.baseUrl) + path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Authorization: `Token ${creds.token}`,
      Accept: options.raw === true ? '*/*' : API_ACCEPT,
    };
    let body: Buffer | string | undefined;
    if (options.json !== undefined) {
      body = JSON.stringify(options.json);
      headers['Content-Type'] = 'application/json';
    } else if (options.body !== undefined) {
      body = options.body;
      headers['Content-Type'] = options.contentType ?? 'application/octet-stream';
      // Content-Length is deliberately NOT set: undici derives it from a buffer
      // body and rejects the request outright (`UND_ERR_INVALID_ARG: invalid
      // content-length header`) when the header is also present, which surfaces
      // as a bare `TypeError: fetch failed` two layers up.
    }

    const response = await providerFetch(
      url.toString(),
      { method: options.method ?? 'GET', headers, body },
      {
        timeoutMs: options.timeoutMs ?? PROVIDER_TIMEOUT_MS,
        allowInsecureTls: creds.allowInsecureTls,
        onTransportFailure: transportError,
      },
    );

    if (!response.ok) {
      // The body is what separates "wrong file type" from "wrong request", so it
      // is read, through the cap, because a proxy's error page is HTML of
      // unbounded length.
      const { text } = await readCappedText(response, MAX_JSON_BYTES);
      throw new PaperlessError(
        classify(response.status, text),
        `Paperless answered HTTP ${response.status}`,
        response.status,
        shorten(text),
      );
    }
    return response;
  }

  private async requestJson<T>(
    creds: PaperlessCreds,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const response = await this.request(creds, path, options);
    const data = await readCappedJson<T>(response, MAX_JSON_BYTES);
    if (data === undefined) {
      throw new PaperlessError(
        'provider_error',
        'Paperless returned something that is not JSON',
        response.status,
        'Check that the URL points at Paperless itself and is reachable without a separate login.',
      );
    }
    return data;
  }

  /**
   * Who the token belongs to, which build answers, and what that user may do.
   *
   * `/api/ui_settings/` rather than `/api/profile/`: profile echoes the token
   * back in its own body, and nothing here should carry a credential it does not
   * need. ui_settings also carries the permission list, which is the only way to
   * know in advance whether this token may create the webhook workflow.
   */
  async probe(creds: PaperlessCreds): Promise<PaperlessProfile> {
    const data = await this.requestJson<unknown>(creds, '/ui_settings/');
    if (!isRecord(data)) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown profile shape');
    }
    const user = isRecord(data.user) ? data.user : {};
    const settings = isRecord(data.settings) ? data.settings : {};
    return {
      username: asString(user.username) ?? '',
      version: asString(settings.version),
      permissions: Array.isArray(data.permissions)
        ? data.permissions.filter((permission): permission is string => typeof permission === 'string')
        : [],
    };
  }

  /** Every tag, or those whose name contains `query`. */
  async listTags(creds: PaperlessCreds, query?: string): Promise<PaperlessTag[]> {
    const tags: PaperlessTag[] = [];
    for (let page = 1; page <= PROVIDER_MAX_PAGES; page++) {
      const data = await this.requestJson<unknown>(creds, '/tags/', {
        query: {
          page: String(page),
          page_size: String(TAG_PAGE_SIZE),
          ordering: 'name',
          name__icontains: query !== undefined && query.trim().length > 0 ? query.trim() : undefined,
        },
      });
      const { rows, hasNext } = pageRows(data);
      for (const row of rows) {
        const tag = parseTag(row);
        if (tag !== null) tags.push(tag);
      }
      if (!hasNext) break;
    }
    return tags;
  }

  async getTag(creds: PaperlessCreds, tagId: number): Promise<PaperlessTag> {
    const tag = parseTag(await this.requestJson<unknown>(creds, `/tags/${tagId}/`));
    if (tag === null) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown tag shape');
    }
    return tag;
  }

  async createTag(creds: PaperlessCreds, name: string): Promise<PaperlessTag> {
    const tag = parseTag(
      await this.requestJson<unknown>(creds, '/tags/', { method: 'POST', json: { name } }),
    );
    if (tag === null) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown tag shape');
    }
    return tag;
  }

  /**
   * Every document carrying the tag, oldest id first.
   *
   * `tags__id__all` rather than `tags__id__in`: with a single tag the two agree,
   * and `__all` keeps meaning "carries this tag" if a caller ever passes more.
   * Ordering by id keeps the pages stable while documents are being added:
   * ordering by `modified`, the field that changes under us, would let a
   * document move between pages and never be seen at all.
   *
   * Pages are walked by number instead of by following `next`: Paperless builds
   * that URL from the request's own Host header, so behind a reverse proxy it
   * can name an origin this connection was never allowed to talk to.
   */
  async listDocuments(
    creds: PaperlessCreds,
    tagId: number,
  ): Promise<{ documents: PaperlessDocument[]; truncated: boolean; count: number | null }> {
    const documents: PaperlessDocument[] = [];
    let truncated = false;
    let count: number | null = null;

    for (let page = 1; page <= PROVIDER_MAX_PAGES; page++) {
      const data = await this.requestJson<unknown>(creds, '/documents/', {
        query: {
          tags__id__all: String(tagId),
          ordering: 'id',
          page: String(page),
          page_size: String(DOCUMENT_PAGE_SIZE),
        },
      });
      const { rows, hasNext, count: total } = pageRows(data);
      count ??= total;
      for (const row of rows) {
        const doc = parseDocument(row);
        if (doc !== null) documents.push(doc);
      }
      if (!hasNext) break;
      if (page === PROVIDER_MAX_PAGES) truncated = true;
    }

    return { documents, truncated, count };
  }

  async getDocument(creds: PaperlessCreds, documentId: number): Promise<PaperlessDocument> {
    const doc = parseDocument(await this.requestJson<unknown>(creds, `/documents/${documentId}/`));
    if (doc === null) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown document shape');
    }
    return doc;
  }

  /**
   * Documents whose original file has exactly these bytes.
   *
   * The filter is server-side and exact. It exists here for one case: an upload
   * whose consume task was never observed, where the document may or may not
   * have landed and a blind retry would leave two: Paperless does not refuse
   * duplicate bytes.
   */
  async findByChecksum(creds: PaperlessCreds, sha256: string): Promise<PaperlessDocument[]> {
    const data = await this.requestJson<unknown>(creds, '/documents/', {
      query: { checksum__iexact: sha256, ordering: '-id', page_size: String(DOCUMENT_PAGE_SIZE) },
    });
    const { rows } = pageRows(data);
    const documents: PaperlessDocument[] = [];
    for (const row of rows) {
      const doc = parseDocument(row);
      if (doc !== null) documents.push(doc);
    }
    return documents;
  }

  async patchDocument(
    creds: PaperlessCreds,
    documentId: number,
    patch: { title?: string },
  ): Promise<PaperlessDocument> {
    const doc = parseDocument(
      await this.requestJson<unknown>(creds, `/documents/${documentId}/`, {
        method: 'PATCH',
        json: patch,
      }),
    );
    if (doc === null) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown document shape');
    }
    return doc;
  }

  /** Moves the document to Paperless's trash. There is no hard delete here. */
  async deleteDocument(creds: PaperlessCreds, documentId: number): Promise<void> {
    discardBody(await this.request(creds, `/documents/${documentId}/`, { method: 'DELETE' }));
  }

  /**
   * The ORIGINAL bytes, streaming. The caller owns the body from here.
   *
   * Without `original=true` Paperless serves the archived PDF it produced
   * itself, which is a different file with a different length and a different
   * hash. TREK would store something the user never uploaded, and every
   * comparison against the checksum would fail.
   */
  async downloadOriginal(creds: PaperlessCreds, documentId: number): Promise<Response> {
    return this.request(creds, `/documents/${documentId}/download/`, {
      query: { original: 'true' },
      timeoutMs: PROVIDER_TRANSFER_TIMEOUT_MS,
      raw: true,
    });
  }

  /** Upload a new document. Answers the consume task's id, not a document id. */
  async postDocument(
    creds: PaperlessCreds,
    file: PaperlessUploadFile,
    fields: { title?: string; tagId: number; customFields?: Record<string, string> },
  ): Promise<string> {
    const parts: MultipartField[] = [{ name: 'tags', value: String(fields.tagId) }];
    if (fields.title !== undefined && fields.title.length > 0) {
      parts.push({ name: 'title', value: fields.title });
    }
    if (fields.customFields !== undefined && Object.keys(fields.customFields).length > 0) {
      // Paperless expects the custom fields as ONE JSON object in a single form
      // field, keyed by field id. Repeating `custom_fields=<id>` instead
      // attaches the fields with no value, which loses the anchor silently.
      parts.push({ name: 'custom_fields', value: JSON.stringify(fields.customFields) });
    }
    return this.postMultipart(creds, '/documents/post_document/', parts, file);
  }

  /**
   * Replace the bytes of an existing document, keeping its id, tags and custom
   * fields. Answers the consume task's id.
   */
  async updateVersion(
    creds: PaperlessCreds,
    documentId: number,
    file: PaperlessUploadFile,
  ): Promise<string> {
    return this.postMultipart(creds, `/documents/${documentId}/update_version/`, [], file);
  }

  private async postMultipart(
    creds: PaperlessCreds,
    path: string,
    fields: MultipartField[],
    file: PaperlessUploadFile,
  ): Promise<string> {
    const { body, contentType } = buildMultipart(fields, file);
    const data = await this.requestJson<unknown>(creds, path, {
      method: 'POST',
      body,
      contentType,
      timeoutMs: PROVIDER_TRANSFER_TIMEOUT_MS,
    });
    // The whole answer is the task UUID as a bare JSON string.
    const taskId = asString(data);
    if (taskId === null || taskId.length === 0) {
      throw new PaperlessError('provider_error', 'Paperless accepted the upload without naming a task');
    }
    return taskId;
  }

  async getTask(creds: PaperlessCreds, taskId: string): Promise<PaperlessTask | null> {
    const data = await this.requestJson<unknown>(creds, '/tasks/', { query: { task_id: taskId } });
    const { rows } = pageRows(data);
    for (const row of rows) {
      const task = parseTask(row);
      // `task_id` is compared rather than trusted: the filter is a query
      // parameter, and Paperless ignores parameters it does not know instead of
      // rejecting them, so an older build would answer with every task there is.
      if (task !== null && task.taskId === taskId) return task;
    }
    return null;
  }

  /**
   * Wait for a consume task to finish and answer the document it produced.
   *
   * Bounded twice: each poll carries its own request timeout, and the loop as a
   * whole gives up at `timeoutMs`. A large scan with OCR can outlast any budget
   * worth holding a worker for, and the caller has a cheaper way to find out
   * whether the upload landed (the checksum filter), so this reports `timeout`
   * rather than waiting longer.
   */
  async awaitConsume(
    creds: PaperlessCreds,
    taskId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<{ documentId: number }> {
    const interval = options.intervalMs ?? TASK_POLL_INTERVAL_MS;
    const deadline = Date.now() + (options.timeoutMs ?? TASK_POLL_TIMEOUT_MS);

    for (;;) {
      const task = await this.getTask(creds, taskId);
      const status = task?.status.toLowerCase() ?? '';
      if (status === 'failure' || status === 'revoked') {
        // A consume that fails on the file itself (a broken PDF, an encrypted
        // one) is a per-document verdict, not a transport fault.
        const detail = task?.errorMessage ?? null;
        throw new PaperlessError(
          detail !== null && /duplicate/i.test(detail) ? 'conflict' : 'provider_error',
          'Paperless could not process the uploaded file',
          undefined,
          detail === null ? undefined : shorten(detail),
        );
      }
      if (status === 'success' && task !== null) {
        const documentId = task.documentIds[0];
        if (documentId === undefined) {
          throw new PaperlessError(
            'provider_error',
            'Paperless finished the upload without naming a document',
          );
        }
        return { documentId };
      }
      if (Date.now() + interval >= deadline) {
        throw new PaperlessError(
          'timeout',
          'Paperless is still processing the uploaded file',
          undefined,
          `task ${taskId} was still ${status === '' ? 'unknown' : status}`,
        );
      }
      await sleep(interval);
    }
  }

  /** The custom field with this exact name, or null. */
  async findCustomField(creds: PaperlessCreds, name: string): Promise<PaperlessCustomField | null> {
    const data = await this.requestJson<unknown>(creds, '/custom_fields/', {
      query: { name__iexact: name, page_size: String(TAG_PAGE_SIZE) },
    });
    const { rows } = pageRows(data);
    for (const row of rows) {
      const field = parseCustomField(row);
      // The filter is server-side, but an unknown query parameter is IGNORED by
      // Paperless rather than rejected, so a build without it would hand back
      // every field there is. Comparing the name here makes that harmless.
      if (field !== null && field.name.toLowerCase() === name.toLowerCase()) return field;
    }
    return null;
  }

  async createCustomField(creds: PaperlessCreds, name: string): Promise<PaperlessCustomField> {
    const field = parseCustomField(
      await this.requestJson<unknown>(creds, '/custom_fields/', {
        method: 'POST',
        json: { name, data_type: 'string' },
      }),
    );
    if (field === null) {
      throw new PaperlessError('provider_error', 'Paperless answered an unknown custom field shape');
    }
    return field;
  }

  /**
   * Subscribe Paperless to its own changes for one tag.
   *
   * Two triggers rather than one: "document added" misses every later edit, and
   * "document updated" misses the arrival. Both are filtered on the tag, so the
   * rest of a household's papers never cause a callback.
   *
   * The payload is deliberately thin. Placeholders such as `{doc_id}` are NOT
   * substituted in a webhook body at 3.1.3 (measured: they arrive literally),
   * and `as_json` wraps a body STRING into a JSON string rather than sending an
   * object, so the parameters, which do arrive as a real JSON object, carry the
   * link, and the callback means nothing more than "look now".
   */
  async createWorkflow(creds: PaperlessCreds, spec: PaperlessWorkflowSpec): Promise<number> {
    if (spec.callbackUrl.length > WEBHOOK_URL_MAX_LENGTH) {
      throw new PaperlessError(
        'provider_error',
        'The callback URL is longer than Paperless accepts',
        undefined,
        `${spec.callbackUrl.length} characters, limit ${WEBHOOK_URL_MAX_LENGTH}`,
      );
    }
    const trigger = (type: number) => ({
      type,
      sources: TRIGGER_SOURCES,
      filter_has_tags: [spec.tagId],
      matching_algorithm: 0,
      match: '',
      is_insensitive: true,
    });
    const data = await this.requestJson<unknown>(creds, '/workflows/', {
      method: 'POST',
      json: {
        name: spec.name,
        order: 1,
        enabled: true,
        triggers: [trigger(TRIGGER_DOCUMENT_ADDED), trigger(TRIGGER_DOCUMENT_UPDATED)],
        actions: [
          {
            type: ACTION_WEBHOOK,
            webhook: {
              url: spec.callbackUrl,
              use_params: true,
              as_json: true,
              params: spec.params,
              headers: { [spec.secretHeader.name]: spec.secretHeader.value },
              include_document: false,
            },
          },
        ],
      },
    });
    const id = isRecord(data) ? asNumber(data.id) : null;
    if (id === null) {
      throw new PaperlessError('provider_error', 'Paperless created the workflow without naming it');
    }
    return id;
  }

  /** Removing a subscription that is already gone is success, not a failure. */
  async deleteWorkflow(creds: PaperlessCreds, workflowId: number): Promise<void> {
    try {
      discardBody(await this.request(creds, `/workflows/${workflowId}/`, { method: 'DELETE' }));
    } catch (err: unknown) {
      if (err instanceof PaperlessError && err.code === 'not_found') return;
      throw err;
    }
  }
}
