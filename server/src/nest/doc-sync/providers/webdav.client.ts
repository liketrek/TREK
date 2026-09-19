import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import { XMLParser } from 'fast-xml-parser';
import type { DocsyncErrorCode } from '@trek/shared';
import { readCappedJson, readCappedText } from '../../../utils/cappedFetch';
import {
  PROVIDER_JSON_MAX_BYTES,
  PROVIDER_TIMEOUT_MS,
  PROVIDER_TRANSFER_TIMEOUT_MS,
} from '../doc-sync.constants';
import { DOWNLOAD_MAX_BYTES, guardDownload, providerFetch, statusErrorCode } from './provider-http';

/**
 * HTTP client for Nextcloud and OpenCloud. This is the ONLY place that talks to
 * either instance; the adapter above it holds no URLs and no transport logic.
 *
 * Measured against Nextcloud 31.0.14 and OpenCloud 8.0.1 on 2026-09-18, not
 * against their prose documentation, which is silent or wrong on most of this:
 *
 *  - **`OC-Checksum` is a Nextcloud-only header here.** OpenCloud answers HTTP
 *    400 to `SHA256:<hex>`: it knows SHA1, MD5 and ADLER32, and treats an
 *    unknown algorithm exactly like a mismatch, so sending the sha256 TREK
 *    already has would fail every upload into a space. Nextcloud accepts SHA256
 *    but does NOT verify it: `SHA256:0000` is stored verbatim and served back
 *    through `oc:checksums`. A checksum from a listing is therefore a claim,
 *    never a proof, and the core still has to hash the bytes it downloads.
 *  - **OpenCloud computes SHA1/MD5/ADLER32 itself** for every file, whether or
 *    not one was sent, and never SHA256. That is why `contentHashInListing` is
 *    false for both products rather than true for one.
 *  - **`X-OC-MTime` is honoured by both**, answered with `X-OC-MTime: accepted`.
 *    Without it every file TREK uploads comes back on the next run looking
 *    freshly changed upstream, which is the classic sync loop.
 *  - **Nextcloud's `OC-FileId` response header is not its `oc:fileid`**: the PUT
 *    that creates `oc:fileid` 62 answers `OC-FileId: 00000062oc9fy1g5e2cj`
 *    (zero-padded id plus instance id). Storing the header form would make every
 *    file TREK uploaded look like a stranger on the next listing, so it is
 *    normalised back to the numeric id. OpenCloud's two spellings agree.
 *  - **PROPFIND has no pagination.** `Paginate: true` plus `Nc-Paginate-*` is
 *    advertised in the `DAV:` header (`nc-paginate`) and ignored on PROPFIND, so
 *    one Depth:1 request is the whole folder. Hence the capped read and the
 *    repair of a cut-off body into the responses that did arrive, with
 *    `truncated` set, rather than failing a big folder outright.
 *  - **Webhook registration is form-encoded only.** A JSON body reaches the
 *    controller with every argument null and the instance answers HTTP 500.
 */

/** Which product a connection points at. Decided by the connection, not by the class. */
export type WebdavFlavor = 'nextcloud' | 'opencloud';

export interface WebdavCreds {
  /** Instance origin, already normalised: no trailing slash, no DAV suffix. */
  origin: string;
  username: string;
  password: string;
  allowInsecureTls: boolean;
  flavor: WebdavFlavor;
}

/**
 * A failed call, carrying the reason as a code.
 *
 * The code is what reaches the user through i18n; `detail` keeps the upstream
 * text, which is English, sometimes an HTML login page from a reverse proxy, and
 * in Sabre's case a stack-shaped XML document.
 */
export class WebdavError extends Error {
  readonly code: DocsyncErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: DocsyncErrorCode, message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'WebdavError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

/** One `<d:response>` of a PROPFIND, reduced to what the sync core reads. */
export interface WebdavEntry {
  /** Path portion of the `d:href`, still percent-encoded, as sent. */
  href: string;
  /** The same path decoded, for comparing against a requested path. */
  path: string;
  name: string;
  isCollection: boolean;
  /** Quoted ETag exactly as the server spelled it, or '' when absent. */
  etag: string;
  fileId: string | null;
  size: number | null;
  mimeType: string | null;
  lastModifiedIso: string | null;
  /** Only when the instance carries a SHA256; see the header note above. */
  sha256: string | null;
}

export interface WebdavPropfindResult {
  /** The requested resource itself. */
  self: WebdavEntry;
  children: WebdavEntry[];
  /** The body hit the size cap, so `children` is a prefix of the folder. */
  truncated: boolean;
}

/** An OpenCloud space, as `/graph/v1.0/…/drives` describes it. */
export interface WebdavDrive {
  id: string;
  name: string;
  driveType: string;
  /**
   * Path of `root.webDavUrl`, never its origin: the instance answers with its
   * own configured `OC_URL` (`https://localhost:8804` for a host reached as
   * 127.0.0.1), and following a host that an untrusted response chose is how an
   * SSRF guard gets walked around. Only the path survives, re-based on the
   * connection's own origin.
   */
  webDavPath: string;
}

export interface WebdavPutOptions {
  size: number;
  mimeType: string;
  /** Unix seconds, sent as `X-OC-MTime`. */
  mtimeSeconds: number;
  sha256: string;
  /** Optimistic concurrency. Both products answer a mismatch with 412. */
  ifMatch?: string;
  /** `*` refuses to create over an existing resource (RFC 9110 §13.1.2). */
  ifNoneMatch?: string;
}

export interface WebdavPutResult {
  fileId: string | null;
  etag: string | null;
  /** 201 rather than 204: a new resource rather than a replaced one. */
  created: boolean;
}

export interface WebdavDownload {
  body: Readable;
  size: number | null;
  mimeType: string | null;
  etag: string;
}

const PROPFIND_BODY =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop>' +
  '<d:getetag/><d:getlastmodified/><d:getcontentlength/><d:getcontenttype/><d:resourcetype/>' +
  '<oc:fileid/><oc:checksums/>' +
  '</d:prop></d:propfind>';

/**
 * Namespace for the dead properties TREK writes. A URI, not an address: it is
 * never fetched, it only has to be unmistakably ours so a second tool writing
 * `doc-uid` on the same file cannot collide with it.
 */
export const TREK_PROP_NS = 'https://github.com/liketrek/TREK/ns/docsync';

/** Property names under that namespace, matching the anchors in `PushRequest`. */
export const TREK_PROP_DOC_UID = 'doc-uid';
export const TREK_PROP_TRIP_UID = 'trip-uid';

const OCS_WEBHOOKS = '/ocs/v2.php/apps/webhook_listeners/api/v1/webhooks';

/** OCS refuses any request without the first header and answers XML without the second. */
const OCS_HEADERS: Record<string, string> = {
  'OCS-APIRequest': 'true',
  Accept: 'application/json',
};

/**
 * `removeNSPrefix` because the prefix is the server's choice rather than the
 * protocol's (`d:` on both of these, `D:` on other Sabre builds), and
 * `parseTagValue: false` because an ETag, a file id and a checksum are opaque
 * strings that have to survive a server spelling them as digits.
 */
const propfindParser = new XMLParser({
  removeNSPrefix: true,
  parseTagValue: false,
  ignoreAttributes: true,
  isArray: (name) => name === 'response' || name === 'propstat' || name === 'checksum',
});

/** Nextcloud's `OC-FileId` header carries the instance id after the number. */
export function normalizeFileId(raw: string | null, flavor: WebdavFlavor): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (flavor !== 'nextcloud') return value;
  const digits = /^0*(\d+)/.exec(value);
  return digits ? digits[1] : value;
}

/**
 * What a user pastes into the URL field, reduced to an origin.
 *
 * People paste the address bar of their own file list, so the DAV and Graph
 * prefixes come off rather than turning into `/remote.php/dav/remote.php/dav`
 * 404s, which read like a wrong password.
 */
export function normalizeOrigin(baseUrl: string): string {
  return baseUrl
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .replace(/\/(?:remote|index)\.php(?:\/.*)?$/i, '')
    .replace(/\/dav\/spaces(?:\/.*)?$/i, '')
    .replace(/\/graph(?:\/.*)?$/i, '')
    .replace(/\/+$/, '');
}

/** Percent-encode each segment of a decoded path, keeping the separators. */
export function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/** `/a/b/` and `a//b` both mean `/a/b`. Every comparison here depends on one spelling. */
export function normalizePath(path: string): string {
  const collapsed = `/${path}`.replace(/\/+/g, '/').replace(/\/+$/, '');
  return collapsed === '' ? '/' : collapsed;
}

/** The path portion of a stored root, which is a URL on OpenCloud and a path on Nextcloud. */
export function davPathOf(rootPathOrUrl: string): string | null {
  const value = rootPathOrUrl.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      return normalizePath(new URL(value).pathname);
    } catch {
      return null;
    }
  }
  return value.startsWith('/') ? normalizePath(value) : null;
}

function hrefPathname(href: string): string {
  try {
    return new URL(href).pathname;
  } catch {
    return href;
  }
}

/** The still-encoded path of an href, which is what the next request is built from. */
function hrefPath(href: string): string {
  return /^https?:\/\//i.test(href) ? hrefPathname(href) : href;
}

function decodeHrefPath(href: string): string {
  const raw = hrefPath(href);
  try {
    return normalizePath(decodeURIComponent(raw));
  } catch {
    return normalizePath(raw);
  }
}

/**
 * 405 is MKCOL on an existing collection, 412 a failed If-Match, 423 a locked
 * node: with 409, four ways of saying the caller's picture of the remote is
 * stale.
 */
const STALE_STATUSES: Readonly<Record<number, DocsyncErrorCode>> = {
  405: 'conflict',
  412: 'conflict',
  423: 'conflict',
};

function classifyStatus(status: number): DocsyncErrorCode {
  return statusErrorCode(status, STALE_STATUSES, status >= 500 ? 'provider_error' : 'unknown');
}

/**
 * A body cut off at the cap is still a run of complete `<d:response>` blocks
 * followed by a fragment. Dropping the fragment and closing the document keeps
 * the first few thousand files of a huge folder usable, which is what
 * `truncated` is for. The alternative is telling someone with one big folder
 * that nothing works at all.
 */
function repairTruncatedMultistatus(xml: string): string | null {
  const closing = /<\/([a-z0-9]+:)?response\s*>/gi;
  let cut = -1;
  for (let match = closing.exec(xml); match !== null; match = closing.exec(xml)) {
    cut = match.index + match[0].length;
  }
  if (cut < 0) return null;
  const open = /<([a-z0-9]+:)?multistatus[^>]*>/i.exec(xml);
  if (!open) return null;
  return `${xml.slice(0, cut)}</${open[1] ?? ''}multistatus>`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function textOf(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

/**
 * Props out of the propstat blocks that reported 2xx only. A PROPFIND answers
 * one block per status, and reading the 404 block too turns "this folder has no
 * content type" into an empty string that looks like a real value.
 */
function propsOf(response: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const stat of asArray(response.propstat)) {
    const record = asRecord(stat);
    if (!record) continue;
    const status = textOf(record.status) ?? '';
    if (!/\s2\d\d(\s|$)/.test(status)) continue;
    const prop = asRecord(record.prop);
    if (prop) Object.assign(props, prop);
  }
  return props;
}

/**
 * `SHA256:<hex>` out of either spelling: Nextcloud sends one element carrying
 * one algorithm, OpenCloud sends one element carrying all three separated by
 * spaces.
 */
function sha256Of(checksums: unknown): string | null {
  const record = asRecord(checksums);
  if (!record) return null;
  for (const entry of asArray(record.checksum)) {
    const text = textOf(entry);
    if (!text) continue;
    for (const token of text.split(/\s+/)) {
      const match = /^SHA256:([0-9a-f]{64})$/i.exec(token);
      if (match) return match[1].toLowerCase();
    }
  }
  return null;
}

function entryOf(response: Record<string, unknown>, flavor: WebdavFlavor): WebdavEntry | null {
  const href = textOf(response.href);
  if (!href) return null;

  const props = propsOf(response);
  const path = decodeHrefPath(href);
  const segments = path.split('/');
  const length = textOf(props.getcontentlength);
  const modified = textOf(props.getlastmodified);
  const parsedModified = modified ? new Date(modified) : null;
  const mimeType = textOf(props.getcontenttype);
  const resourceType = asRecord(props.resourcetype);

  return {
    href: hrefPath(href),
    path,
    name: segments[segments.length - 1] ?? '',
    isCollection: resourceType !== null && 'collection' in resourceType,
    etag: textOf(props.getetag) ?? '',
    fileId: normalizeFileId(textOf(props.fileid), flavor),
    size: length !== null && length !== '' && Number.isFinite(Number(length)) ? Number(length) : null,
    mimeType: mimeType ? mimeType.split(';')[0].trim() : null,
    lastModifiedIso:
      parsedModified && !Number.isNaN(parsedModified.getTime()) ? parsedModified.toISOString() : null,
    sha256: sha256Of(props.checksums),
  };
}

function toDrive(value: unknown): WebdavDrive | null {
  const record = asRecord(value);
  const id = textOf(record?.id);
  if (!record || !id) return null;
  const webDavUrl = textOf(asRecord(record.root)?.webDavUrl);
  return {
    id,
    name: textOf(record.name) ?? id,
    driveType: textOf(record.driveType) ?? '',
    webDavPath: (webDavUrl ? davPathOf(webDavUrl) : null) ?? `/dav/spaces/${encodeURIComponent(id)}`,
  };
}

/** Text content for the PROPPATCH body, which is built as a string rather than parsed back. */
function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

@Injectable()
export class WebdavClient {
  /**
   * One authenticated request. Throws for anything that never reached the
   * application, and hands the caller the response otherwise: a 404 on DELETE
   * and a 405 on MKCOL are answers, not failures.
   */
  private async send(
    creds: WebdavCreds,
    path: string,
    init: RequestInit,
    timeoutMs = PROVIDER_TIMEOUT_MS,
  ): Promise<Response> {
    const auth = Buffer.from(`${creds.username}:${creds.password}`, 'utf8').toString('base64');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Basic ${auth}`);

    return providerFetch(`${creds.origin}${path}`, { ...init, headers }, {
      timeoutMs,
      allowInsecureTls: creds.allowInsecureTls,
      onTransportFailure: ({ code, detail }) =>
        new WebdavError(code, 'Could not reach the WebDAV instance', undefined, detail),
    });
  }

  /** The error for a response nobody wanted, with a bounded slice of its body as detail. */
  private async failed(response: Response, what: string): Promise<WebdavError> {
    const { text } = await readCappedText(response, 8 * 1024);
    return new WebdavError(
      classifyStatus(response.status),
      `${what} answered HTTP ${response.status}`,
      response.status,
      text.slice(0, 500),
    );
  }

  /**
   * PROPFIND with the props the sync core reads.
   *
   * Depth 0 is the cursor probe: a write anywhere below a collection changes
   * that collection's ETag on both products, up to the root, so an unchanged
   * root ETag means the whole walk can be skipped. Depth 1 is the walk.
   */
  async propfind(creds: WebdavCreds, path: string, depth: 0 | 1): Promise<WebdavPropfindResult> {
    const response = await this.send(creds, path, {
      method: 'PROPFIND',
      headers: { Depth: String(depth), 'Content-Type': 'application/xml; charset=utf-8' },
      body: PROPFIND_BODY,
    });
    if (response.status !== 207) {
      throw await this.failed(response, 'PROPFIND');
    }

    const { text, truncated } = await readCappedText(response, PROVIDER_JSON_MAX_BYTES);
    const xml = truncated ? repairTruncatedMultistatus(text) : text;
    if (xml === null) {
      throw new WebdavError('too_large', 'The folder listing exceeded the size limit', response.status);
    }

    const multistatus = asRecord(asRecord(propfindParser.parse(xml))?.multistatus);
    if (!multistatus) {
      throw new WebdavError(
        'provider_error',
        'The instance answered something that is not a WebDAV multistatus',
        response.status,
        text.slice(0, 200),
      );
    }

    const entries: WebdavEntry[] = [];
    for (const element of asArray(multistatus.response)) {
      const record = asRecord(element);
      const entry = record ? entryOf(record, creds.flavor) : null;
      if (entry) entries.push(entry);
    }
    if (entries.length === 0) {
      throw new WebdavError('provider_error', 'The instance answered an empty multistatus', response.status);
    }

    // RFC 4918 puts the requested resource first, but it is matched by path
    // rather than trusted by position: the root must never end up in the
    // document list, and one misordered server would put it there.
    const wanted = decodeHrefPath(path);
    const selfIndex = Math.max(
      entries.findIndex((entry) => entry.path === wanted),
      0,
    );
    return {
      self: entries[selfIndex],
      children: entries.filter((_, index) => index !== selfIndex),
      truncated,
    };
  }

  /**
   * Write dead properties, which both products persist (Nextcloud in
   * `oc_properties`, OpenCloud in the space's metadata) and hand back through a
   * PROPFIND that asks for them. That is where the TREK anchors go: they are the
   * only thing that still identifies a document after a human has renamed it and
   * moved it somewhere else in the folder.
   *
   * Answers whether the server accepted them. A 207 is not enough on its own:
   * a refusal arrives as a non-2xx status inside the multistatus.
   */
  async proppatch(creds: WebdavCreds, path: string, props: Record<string, string>): Promise<boolean> {
    const body =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      `<d:propertyupdate xmlns:d="DAV:" xmlns:trek="${TREK_PROP_NS}"><d:set><d:prop>` +
      Object.entries(props)
        .map(([name, value]) => `<trek:${name}>${escapeXmlText(value)}</trek:${name}>`)
        .join('') +
      '</d:prop></d:set></d:propertyupdate>';

    const response = await this.send(creds, path, {
      method: 'PROPPATCH',
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      body,
    });
    if (response.status !== 207) {
      throw await this.failed(response, 'PROPPATCH');
    }
    const { text } = await readCappedText(response, PROVIDER_JSON_MAX_BYTES);
    const multistatus = asRecord(asRecord(propfindParser.parse(text))?.multistatus);
    for (const element of asArray(multistatus?.response)) {
      const record = asRecord(element);
      if (!record) continue;
      const accepted = propsOf(record);
      if (Object.keys(props).every((name) => name in accepted)) return true;
    }
    return false;
  }

  /** MKCOL. `exists` rather than an error, because 405 is how both say "already there". */
  async mkcol(creds: WebdavCreds, path: string): Promise<'created' | 'exists'> {
    const response = await this.send(creds, path, { method: 'MKCOL' });
    void response.body?.cancel().catch(() => {});
    if (response.ok) return 'created';
    if (response.status === 405) return 'exists';
    throw await this.failed(response, 'MKCOL');
  }

  async put(
    creds: WebdavCreds,
    path: string,
    body: Readable,
    options: WebdavPutOptions,
  ): Promise<WebdavPutResult> {
    const headers: Record<string, string> = {
      'Content-Type': options.mimeType,
      // Explicit, so the upload does not go out chunked: a reverse proxy in
      // front of a self-hosted instance is the common case and several refuse
      // a chunked PUT outright.
      'Content-Length': String(options.size),
      'X-OC-MTime': String(options.mtimeSeconds),
    };
    if (creds.flavor === 'nextcloud' && /^[0-9a-f]{64}$/i.test(options.sha256)) {
      headers['OC-Checksum'] = `SHA256:${options.sha256.toLowerCase()}`;
    }
    if (options.ifNoneMatch) {
      headers['If-None-Match'] = options.ifNoneMatch;
    }
    if (options.ifMatch) {
      headers['If-Match'] = options.ifMatch;
    }

    const response = await this.send(
      creds,
      path,
      { method: 'PUT', headers, body, duplex: 'half' },
      PROVIDER_TRANSFER_TIMEOUT_MS,
    );
    if (!response.ok) {
      throw await this.failed(response, 'PUT');
    }
    void response.body?.cancel().catch(() => {});
    return {
      fileId: normalizeFileId(response.headers.get('oc-fileid'), creds.flavor),
      etag: response.headers.get('oc-etag') ?? response.headers.get('etag'),
      created: response.status === 201,
    };
  }

  /**
   * GET, handed back as a stream.
   *
   * Never buffered: the caller pipes it into storage, and holding a trip's
   * scanned passport in memory to count its bytes is the opposite of what a
   * cap is for. The guard counts them on the way through instead.
   */
  async get(creds: WebdavCreds, path: string): Promise<WebdavDownload> {
    const response = await this.send(creds, path, { method: 'GET' }, PROVIDER_TRANSFER_TIMEOUT_MS);
    if (!response.ok) {
      throw await this.failed(response, 'GET');
    }
    const { body, size } = guardDownload(response, {
      maxBytes: DOWNLOAD_MAX_BYTES,
      tooLarge: (declared) =>
        new WebdavError(
          'too_large',
          'The document is larger than TREK will transfer',
          response.status,
          `content_length=${declared}`,
        ),
      noBody: () =>
        new WebdavError('provider_error', 'The instance answered a download without a body', response.status),
    });
    const mimeType = response.headers.get('content-type');
    return {
      body,
      size,
      mimeType: mimeType ? mimeType.split(';')[0].trim() : null,
      etag: response.headers.get('oc-etag') ?? response.headers.get('etag') ?? '',
    };
  }

  /**
   * MOVE within one instance. `Overwrite: F` on purpose: a rename that silently
   * replaced a namesake would destroy a document nobody asked about, and the
   * 412 it produces instead is a conflict the core can show someone.
   */
  async move(creds: WebdavCreds, fromPath: string, toPath: string): Promise<{ etag: string | null }> {
    const response = await this.send(creds, fromPath, {
      method: 'MOVE',
      headers: { Destination: `${creds.origin}${toPath}`, Overwrite: 'F' },
    });
    if (!response.ok) {
      throw await this.failed(response, 'MOVE');
    }
    void response.body?.cancel().catch(() => {});
    return { etag: response.headers.get('oc-etag') ?? response.headers.get('etag') };
  }

  /** DELETE, which lands in the owner's trash on Nextcloud and the space trash on OpenCloud. */
  async delete(creds: WebdavCreds, path: string): Promise<void> {
    const response = await this.send(creds, path, { method: 'DELETE' });
    void response.body?.cancel().catch(() => {});
    // A document that is already gone is the state the caller asked for.
    if (response.ok || response.status === 404) return;
    throw await this.failed(response, 'DELETE');
  }

  private async graph(
    creds: WebdavCreds,
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const response = await this.send(creds, path, {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw await this.failed(response, 'The Graph API');
    }
    const parsed = await readCappedJson<unknown>(response, PROVIDER_JSON_MAX_BYTES);
    if (parsed === undefined) {
      throw new WebdavError(
        'provider_error',
        'The Graph API answered something that is not JSON. Check that the URL points at OpenCloud itself.',
        response.status,
      );
    }
    return parsed;
  }

  async listDrives(creds: WebdavCreds): Promise<WebdavDrive[]> {
    const parsed = asRecord(await this.graph(creds, 'GET', '/graph/v1.0/me/drives'));
    const drives: WebdavDrive[] = [];
    for (const value of asArray(parsed?.value)) {
      const drive = toDrive(value);
      if (drive) drives.push(drive);
    }
    return drives;
  }

  /** One space, or null when it is gone, which is what makes `scope_missing` detectable. */
  async getDrive(creds: WebdavCreds, driveId: string): Promise<WebdavDrive | null> {
    try {
      return toDrive(await this.graph(creds, 'GET', `/graph/v1.0/drives/${encodeURIComponent(driveId)}`));
    } catch (err: unknown) {
      if (err instanceof WebdavError && err.status === 404) return null;
      throw err;
    }
  }

  async createDrive(creds: WebdavCreds, name: string): Promise<WebdavDrive> {
    const drive = toDrive(
      await this.graph(creds, 'POST', '/graph/v1.0/drives', { name, driveType: 'project' }),
    );
    if (!drive) {
      throw new WebdavError('provider_error', 'OpenCloud created a space it then described incompletely');
    }
    return drive;
  }

  /** The account's own name, for the line the settings screen shows after a test. */
  async whoAmI(creds: WebdavCreds): Promise<string> {
    const me = asRecord(await this.graph(creds, 'GET', '/graph/v1.0/me'));
    return (
      textOf(me?.onPremisesSamAccountName) ??
      textOf(me?.displayName) ??
      textOf(me?.mail) ??
      creds.username
    );
  }

  /**
   * Whether this account may manage webhooks at all.
   *
   * The endpoint is admin-only and a read is harmless, so asking is cheaper and
   * more honest than registering four subscriptions to find out. A non-admin
   * app password gets 403 here, which is exactly the case `webhook-manual`
   * exists for.
   */
  async canRegisterWebhooks(creds: WebdavCreds): Promise<boolean> {
    const response = await this.send(creds, OCS_WEBHOOKS, { method: 'GET', headers: OCS_HEADERS });
    void response.body?.cancel().catch(() => {});
    return response.ok;
  }

  /**
   * Register one event, unfiltered.
   *
   * Form-encoded, because a JSON body arrives at the controller with every
   * argument null and the instance answers HTTP 500.
   *
   * No `eventFilter`, and that is measured rather than lazy. The filter is
   * evaluated by the app's own bundled PHPMongoQuery, which implements
   * `$all $e $in $lt $lte $gt $gte $ne $nin $exists $mod` and nothing else, so a
   * `$regex` prefix match on the changed path throws "Operator $regex is
   * unknown" inside the event listener. The damage does not stop at this
   * subscription: the throw aborts the listener for that event, so one filtered
   * webhook silently stops delivery for every other webhook on the same event,
   * including ones belonging to other applications. An unfiltered subscription
   * that occasionally says "look now" about an unrelated folder is the cheap
   * mistake; the filter is the expensive one.
   */
  async createWebhook(
    creds: WebdavCreds,
    options: { uri: string; event: string; secretHeader: string; secret: string },
  ): Promise<number> {
    const form = new URLSearchParams();
    form.set('httpMethod', 'POST');
    form.set('uri', options.uri);
    form.set('event', options.event);
    form.set('authMethod', 'header');
    form.set(`authData[${options.secretHeader}]`, options.secret);

    const response = await this.send(creds, OCS_WEBHOOKS, {
      method: 'POST',
      headers: { ...OCS_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!response.ok) {
      throw await this.failed(response, 'The webhook API');
    }
    const parsed = await readCappedJson<unknown>(response, PROVIDER_JSON_MAX_BYTES);
    const id = Number(textOf(asRecord(asRecord(asRecord(parsed)?.ocs)?.data)?.id));
    if (!Number.isInteger(id) || id <= 0) {
      throw new WebdavError('provider_error', 'The webhook API answered without an id', response.status);
    }
    return id;
  }

  async deleteWebhook(creds: WebdavCreds, id: number): Promise<void> {
    const response = await this.send(creds, `${OCS_WEBHOOKS}/${id}`, {
      method: 'DELETE',
      headers: OCS_HEADERS,
    });
    void response.body?.cancel().catch(() => {});
    if (!response.ok && response.status !== 404) {
      throw new WebdavError(
        classifyStatus(response.status),
        `Removing the webhook answered HTTP ${response.status}`,
        response.status,
      );
    }
  }
}
