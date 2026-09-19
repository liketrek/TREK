import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import type { DocsyncErrorCode } from '@trek/shared';
import { discardBody, readCappedJson } from '../../../utils/cappedFetch';
import {
  PROVIDER_JSON_MAX_BYTES,
  PROVIDER_MAX_PAGES,
  PROVIDER_TIMEOUT_MS,
  PROVIDER_TRANSFER_TIMEOUT_MS,
} from '../doc-sync.constants';
import {
  guardDownload,
  providerFetch,
  statusErrorCode,
  type TransportFailure,
  type TransportFailureCode,
} from './provider-http';

/**
 * Thin HTTP client for the Synology DSM Web API (SYNO.API.Auth + FileStation).
 * This is the ONLY place that talks to a user's NAS for document sync.
 *
 * Written against Synology's File Station Official API guide and verified
 * against the FileStation stub in `trek-docsync-testlab/syno-stub`. DSM itself
 * cannot be containerised, so the parts marked below as unverified are the ones
 * no reachable instance could confirm.
 *
 *  - **Every parameter is JSON-encoded.** `folder_path="/trek"` with the quotes,
 *    `path=["/trek/a.pdf"]` with the brackets. DSM tolerates a bare string on
 *    some parameters and silently reads something else on others, so this client
 *    encodes all of them the same way rather than remembering which is which.
 *  - **mtime is seconds on the way out and milliseconds on the way in.** List,
 *    getinfo and search report whole seconds; upload takes milliseconds. Sending
 *    seconds to upload lands the file in 1970 and every later run sees a file
 *    that changed upstream.
 *  - **There is no stable file id.** Identity is the path, so a rename upstream
 *    is indistinguishable from delete + create. `snapshotVersion` therefore
 *    hashes a fixed field order rather than anything DSM hands out.
 *  - **App-level errors ride inside HTTP 200.** `{"success":false,"error":
 *    {"code":408}}` is the normal shape of failure, and the 400-range codes mean
 *    different things on auth.cgi than on entry.cgi (408 is "password expired"
 *    there and "no such file or directory" here), which is why classification
 *    takes the endpoint into account.
 *  - **DSM auto-blocks the source IP after a handful of failed logins.** A retry
 *    loop around a wrong password locks the TREK server out of the NAS for
 *    everyone, so a rejected credential is remembered here and the next attempt
 *    with the same credential fails without touching the network.
 */

/** DSM's own session name for the FileStation API set. */
const SESSION_NAME = 'FileStation';

/** Shown in DSM's connected-devices list, so a user can recognise and revoke it. */
const DEVICE_NAME = 'TREK';

const AUTH_CGI = '/webapi/auth.cgi';
const ENTRY_CGI = '/webapi/entry.cgi';
const QUERY_CGI = '/webapi/query.cgi';

/**
 * Entries per `list` page. FileStation answers `total` alongside the page, so
 * paging is exact rather than "keep asking until it is short"; a thousand keeps
 * a folder of holiday scans to one request without risking the JSON cap.
 */
const LIST_PAGE_SIZE = 1000;

/** How long a cached SID is trusted before a fresh login. DSM expires its own. */
const SESSION_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * How long a rejected credential is not retried. DSM's default auto-block is
 * five failures in five minutes, and a link that polls every five minutes would
 * walk into it in under half an hour. A minute is long enough to keep any one
 * sync run from spending a second attempt, and short enough that an admin who
 * fixes the password does not wait: a corrected password changes the
 * fingerprint and clears the lockout immediately.
 */
const CREDENTIAL_LOCKOUT_MS = 60 * 1000;

/** Already blocked upstream (code 407). Backing off for less is pointless. */
const AUTOBLOCK_LOCKOUT_MS = 15 * 60 * 1000;

/** Poll budget for the task-based APIs (CopyMove, MD5). */
const TASK_MAX_POLLS = 20;
const TASK_POLL_INTERVAL_MS = 250;

/**
 * Path length this client accepts. `docsyncScopeKeySchema` caps a scope key at
 * 512 characters and the key is `path:` plus the path, so a scope has to fit
 * well under that; a document path additionally carries a file name of up to
 * DSM's 255.
 */
export const MAX_SCOPE_PATH_LENGTH = 500;
export const MAX_FILE_PATH_LENGTH = 1024;

/** Session-level codes: the SID is gone, and exactly one fresh login may fix it. */
const SESSION_CODES = new Set([105, 106, 107, 119]);

/**
 * What SYNO.API.Auth answers when a login carried a device token and DSM still
 * wants the second factor (403) or rejects it (404): the token is no longer
 * trusted, because someone removed TREK from the account's trusted devices or
 * it expired.
 */
const DEVICE_TOKEN_REFUSED_CODES = new Set([403, 404]);

/**
 * Generic Web API codes, identical on every endpoint.
 *
 * 105 is in here as `forbidden` for the case a re-login does not fix: on a NAS
 * with CSRF protection enabled it is also what a missing or stale SynoToken
 * produces, which is why it is a session code above as well.
 */
const GENERIC_CODES: Record<number, DocsyncErrorCode> = {
  100: 'provider_error',
  101: 'provider_error',
  102: 'provider_error',
  103: 'provider_error',
  104: 'provider_error',
  105: 'forbidden',
  106: 'unauthorized',
  107: 'unauthorized',
  114: 'provider_error',
  117: 'forbidden',
  118: 'forbidden',
  119: 'unauthorized',
};

/** SYNO.API.Auth codes. Only login and logout are classified with this table. */
const AUTH_CODES: Record<number, DocsyncErrorCode> = {
  400: 'unauthorized',
  401: 'unauthorized',
  402: 'forbidden',
  403: 'unauthorized',
  404: 'unauthorized',
  406: 'unauthorized',
  407: 'rate_limited',
  408: 'unauthorized',
  409: 'unauthorized',
  410: 'unauthorized',
  411: 'unauthorized',
  412: 'unauthorized',
  413: 'unauthorized',
  414: 'unauthorized',
  415: 'unauthorized',
  416: 'unauthorized',
  417: 'unauthorized',
  418: 'unauthorized',
  419: 'unauthorized',
};

/**
 * FileStation codes. The 400-range overlaps SYNO.API.Auth numerically and means
 * something entirely different, so this table is only ever consulted for
 * entry.cgi.
 */
const FILE_CODES: Record<number, DocsyncErrorCode> = {
  400: 'provider_error',
  401: 'provider_error',
  402: 'rate_limited',
  403: 'forbidden',
  404: 'forbidden',
  405: 'forbidden',
  406: 'forbidden',
  407: 'forbidden',
  408: 'not_found',
  409: 'provider_error',
  410: 'provider_error',
  411: 'forbidden',
  412: 'provider_error',
  413: 'provider_error',
  414: 'conflict',
  415: 'quota_exceeded',
  416: 'quota_exceeded',
  417: 'provider_error',
  418: 'provider_error',
  419: 'provider_error',
  420: 'provider_error',
  421: 'rate_limited',
  599: 'provider_error',
  900: 'provider_error',
  1000: 'provider_error',
  1003: 'conflict',
  1004: 'not_found',
  1100: 'provider_error',
  1101: 'quota_exceeded',
  1200: 'provider_error',
  1400: 'provider_error',
  1401: 'not_found',
  1500: 'provider_error',
  1800: 'provider_error',
  1801: 'timeout',
  1802: 'provider_error',
  1803: 'provider_error',
  1804: 'too_large',
  1805: 'conflict',
};

const TRANSPORT_MESSAGES: Record<TransportFailureCode, string> = {
  ssrf_blocked: 'Blocked by the SSRF guard',
  timeout: 'The NAS did not answer in time',
  tls_untrusted: 'The certificate the NAS presented is not trusted',
  unreachable: 'Could not reach the NAS',
};

export interface SynologyDriveCreds {
  /**
   * The TREK connection these credentials belong to, or 0 for a form that has
   * not been saved yet. It keys the device token; see `deviceTokens`.
   */
  connectionId: number;
  /** When that connection's row was created. With the id, it keys the device token. */
  connectionCreatedAt: string;
  /** Instance origin including the DSM port, e.g. `https://nas.example.com:5001`. */
  baseUrl: string;
  username: string;
  password: string;
  /**
   * A TOTP code from the connection form. Single-use by construction, so it can
   * only ever serve the first login; the device token that login returns is what
   * keeps later logins working.
   */
  otpCode?: string;
  /** The connection's device token as stored, in the form `storedDeviceToken` writes. */
  storedDeviceToken?: string;
  /**
   * Store a new token in that form, or drop it with null. Only a saved
   * connection passes one; a probe of form values uses the stored token without
   * being able to change it.
   */
  saveDeviceToken?: (stored: string | null) => void;
  allowInsecureTls: boolean;
}

/** One file or folder as FileStation describes it, with the bits TREK reads. */
export interface SynoEntry {
  path: string;
  name: string;
  isdir: boolean;
  size: number | null;
  /** Whole seconds, which is all DSM stores. */
  mtimeSeconds: number | null;
  /** The extension in capitals ("PDF"), not a MIME type. */
  type: string | null;
}

export interface SynoUploadRequest {
  folderPath: string;
  fileName: string;
  body: Readable;
  /** Exact byte count. It becomes Content-Length, so a wrong value breaks the request. */
  size: number;
  mimeType: string;
  mtimeSeconds: number;
  overwrite: boolean;
  createParents: boolean;
}

export interface SynoDownload {
  body: Readable;
  size: number | null;
  mimeType: string | null;
}

export interface SynoProbe {
  hostname: string | null;
  /** Which of the FileStation APIs this DSM actually exposes. */
  availableApis: string[];
}

/**
 * A failed call, carrying the reason as one of the shared docsync codes.
 *
 * The code is what reaches the user through i18n; `detail` keeps DSM's own
 * number for the self-hoster reading a log, because "code 418" is searchable
 * and "the file operation failed" is not.
 */
export class SynologyDriveError extends Error {
  readonly code: DocsyncErrorCode;
  readonly synoCode?: number;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: DocsyncErrorCode, message: string, opts: { synoCode?: number; status?: number; detail?: string } = {}) {
    super(message);
    this.name = 'SynologyDriveError';
    this.code = code;
    this.synoCode = opts.synoCode;
    this.status = opts.status;
    this.detail = opts.detail ?? message;
  }
}

interface SynoSession {
  sid: string;
  /** Present when the NAS enforces CSRF, and harmless to send when it does not. */
  synoToken: string | null;
  /** DSM's trusted-device token, so a re-login needs no second TOTP code. */
  deviceId: string | null;
  createdAt: number;
}

interface CredentialLockout {
  until: number;
  code: DocsyncErrorCode;
  synoCode: number;
}

/** One connection's device token, and what its storage holds as far as this process knows. */
interface DeviceTokenSlot {
  /** Digest of the instance and account the token was issued for. */
  account: string;
  token: string | null;
  /**
   * The stored form this process last read or wrote, or undefined until a
   * caller that can write has shown what storage holds.
   */
  stored?: string | null;
}

interface SynoEnvelope {
  success?: unknown;
  data?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * `https://nas:5001/` → `https://nas:5001`, tolerating what people paste out of
 * a browser: a trailing slash, the `/webapi` path, or a full `entry.cgi` URL. A
 * missing scheme becomes https, which is the only thing DSM's admin port speaks.
 */
export function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme
    .replace(/\/+$/, '')
    .replace(/\/webapi\/(entry|auth|query)\.cgi$/i, '')
    .replace(/\/webapi$/i, '');
}

/**
 * A FileStation path in the one spelling this adapter stores and compares.
 *
 * Rejects rather than resolves `..`: DSM normalises the path itself and then
 * checks only DSM permissions, so `/trip/../../other-share` is a perfectly
 * legal request that lands outside the trip's scope. Resolving it here would
 * produce a path that passes the scope check for a folder the trip was never
 * bound to.
 */
export function normalizeSynoPath(raw: string, maxLength = MAX_FILE_PATH_LENGTH): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\\]/.test(trimmed)) return null;

  const segments: string[] = [];
  for (const segment of trimmed.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') return null;
    if (segment.length > 255) return null;
    segments.push(segment);
  }
  const normalized = `/${segments.join('/')}`;
  if (normalized.length > maxLength) return null;
  return normalized;
}

/** True when `candidate` is the scope itself or lives under it. */
export function isWithinScope(scopePath: string, candidate: string): boolean {
  return candidate === scopePath || candidate.startsWith(`${scopePath}/`);
}

export function joinSynoPath(parent: string, name: string): string {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

/**
 * The characters DSM refuses in a file or folder name, plus the two that would
 * change what a path means. Checked here so a bad name fails with a code the UI
 * can explain instead of a bare 419 out of the NAS.
 */
export function isValidSynoName(name: string): boolean {
  if (!name || name.length > 255) return false;
  if (name === '.' || name === '..') return false;
  // eslint-disable-next-line no-control-regex
  return !/[\\/:*?"<>|\u0000-\u001f]/.test(name);
}

/**
 * The version marker for a FileStation entry.
 *
 * A hash over a FIXED field order rather than over the entry object: a digest
 * taken from whatever keys DSM happened to send would change when DSM adds an
 * `additional` field, and every document in every trip would look modified.
 */
export function snapshotVersion(path: string, size: number | null, mtimeSeconds: number | null): string {
  return createHash('sha256')
    .update(`${path}\n${size ?? ''}\n${mtimeSeconds ?? ''}`)
    .digest('hex');
}

function parseEntry(value: unknown): SynoEntry | null {
  if (!isRecord(value)) return null;
  const { path, name, isdir } = value;
  if (typeof path !== 'string' || typeof name !== 'string') return null;
  const additional = isRecord(value.additional) ? value.additional : undefined;
  const time = additional && isRecord(additional.time) ? additional.time : undefined;
  const mtime = time?.mtime;
  const size = additional?.size;
  const type = additional?.type;
  return {
    path,
    name,
    isdir: isdir === true,
    size: typeof size === 'number' ? size : null,
    mtimeSeconds: typeof mtime === 'number' ? mtime : null,
    type: typeof type === 'string' ? type : null,
  };
}

function parseEntryList(value: unknown, key: string): SynoEntry[] {
  if (!isRecord(value)) return [];
  const raw = value[key];
  if (!Array.isArray(raw)) return [];
  const entries: SynoEntry[] = [];
  for (const item of raw) {
    const entry = parseEntry(item);
    if (entry) entries.push(entry);
  }
  return entries;
}

function transportError(failure: TransportFailure): SynologyDriveError {
  return new SynologyDriveError(failure.code, TRANSPORT_MESSAGES[failure.code], { detail: failure.detail });
}

function httpError(status: number): SynologyDriveError {
  return new SynologyDriveError(statusErrorCode(status), `The NAS answered HTTP ${status}`, { status });
}

function appError(synoCode: number, isAuth: boolean): SynologyDriveError {
  const table = isAuth ? AUTH_CODES : FILE_CODES;
  const code = GENERIC_CODES[synoCode] ?? table[synoCode] ?? 'provider_error';
  return new SynologyDriveError(code, `The NAS refused the request (code ${synoCode})`, {
    synoCode,
    detail: `syno_code=${synoCode}`,
  });
}

/**
 * A device token the way a connection stores it: `<account digest>:<token>`.
 * The account travels with it, so a connection repointed at another NAS or
 * another account reads its old token as foreign instead of offering it there.
 */
function storedDeviceToken(account: string, token: string): string {
  return `${account}:${token}`;
}

/** The token out of its stored form, or null when none is stored for this account. */
function deviceTokenFor(stored: string | undefined, account: string): string | null {
  const prefix = `${account}:`;
  if (!stored?.startsWith(prefix) || stored.length === prefix.length) return null;
  return stored.slice(prefix.length);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SynologyDriveClient {
  /**
   * SID per credential, in this process only.
   *
   * Keyed by the whole credential rather than by connection id: DSM counts
   * concurrent sessions for one account and answers 107 when a second login
   * displaces the first, so two TREK connections pointing at the same NAS with
   * the same account share one session instead of evicting each other. The
   * password is part of the key because a connection test with a corrected
   * password has to reach the NAS: riding the session the old password opened
   * would report success for a credential that no longer works. It is also what
   * makes an explicit "forget this session" unnecessary: an edited credential
   * is a different key and cannot reach the old entry.
   */
  private readonly sessions = new Map<string, SynoSession>();

  /** Same key. A rejected credential is not retried until it changes. */
  private readonly lockouts = new Map<string, CredentialLockout>();

  /**
   * DSM's trusted-device tokens, one slot per TREK connection.
   *
   * The token is DSM's record that somebody passed the second factor, and that
   * somebody is whoever typed the code into this connection's form. Keyed by
   * instance and account alone, a second trip's owner who knew the password but
   * never had the authenticator could point a connection at the same account
   * and log in on the first trip's token.
   *
   * The connection is its id together with the time its row was created. The
   * id alone comes round again: a backup restored in place, or the demo reset,
   * rolls the id sequence back without restarting the process, and the next
   * connection saved, on whatever trip, is handed an id this map may still hold
   * a token under.
   *
   * Not keyed by the password or the code: the token has to survive a password
   * edit and the single-use OTP going stale in the form, or the next session
   * expiry needs a human with an authenticator app. An edit updates the row in
   * place, so it keeps the token. The slot remembers the instance and
   * account the token was issued for, so a connection repointed at another NAS
   * or account starts without one.
   *
   * A form that has not been saved has no id to file a token under (every
   * unsaved form is connection 0), so what its probe earns rides on the session
   * only, and the saved connection adopts it from there; see `session()`.
   *
   * This is the working copy. The one that survives a restart is in the
   * connection's encrypted secrets; see `deviceSlot()`.
   */
  private readonly deviceTokens = new Map<string, DeviceTokenSlot>();

  /** The credential this session and lockout belong to, without storing it. */
  private sessionKey(creds: SynologyDriveCreds): string {
    return createHash('sha256')
      .update(`${this.accountKey(creds)}\u0000${creds.password}\u0000${creds.otpCode ?? ''}`)
      .digest('hex');
  }

  private accountKey(creds: SynologyDriveCreds): string {
    return `${normalizeBaseUrl(creds.baseUrl)}\u0000${creds.username}`;
  }

  /** What a device token is filed under: instance and account, never the password. */
  private accountDigest(creds: SynologyDriveCreds): string {
    return createHash('sha256').update(this.accountKey(creds)).digest('hex');
  }

  /**
   * This connection's device token slot, with storage brought in line with it.
   * Null for a form that has not been saved.
   *
   * Memory is what a login reads, because a sync run holds one snapshot of the
   * stored secrets from its start, and a token earned or refused halfway
   * through would otherwise be lost to the rest of the run. Storage is what
   * survives a restart, and a process that has no slot for the connection yet
   * starts from it.
   *
   * Whenever the two disagree and the caller can write, storage follows memory.
   * That covers a token earned or refused here, one that a test of the saved
   * form earned, and one left behind for an instance or account the connection
   * no longer points at. The comparison is with what this process last read or
   * wrote rather than with the caller's snapshot, which goes stale the moment
   * anything is written, so a change is written once and not on every call of
   * the run that made it.
   */
  private deviceSlot(creds: SynologyDriveCreds): DeviceTokenSlot | null {
    if (creds.connectionId <= 0) return null;
    const key = `${creds.connectionId}\u0000${creds.connectionCreatedAt}`;
    const account = this.accountDigest(creds);
    let slot = this.deviceTokens.get(key);
    if (!slot || slot.account !== account) {
      slot = { account, token: deviceTokenFor(creds.storedDeviceToken, account) };
      this.deviceTokens.set(key, slot);
    }
    this.persist(creds, slot);
    return slot;
  }

  private persist(creds: SynologyDriveCreds, slot: DeviceTokenSlot): void {
    if (!creds.saveDeviceToken) return;
    if (slot.stored === undefined) slot.stored = creds.storedDeviceToken ?? null;
    const wanted = slot.token === null ? null : storedDeviceToken(slot.account, slot.token);
    if (wanted === slot.stored) return;
    creds.saveDeviceToken(wanted);
    slot.stored = wanted;
  }

  private setDeviceToken(creds: SynologyDriveCreds, token: string | null): void {
    const slot = this.deviceSlot(creds);
    if (!slot || slot.token === token) return;
    slot.token = token;
    this.persist(creds, slot);
  }

  private async request(
    url: string,
    init: RequestInit,
    creds: SynologyDriveCreds,
    timeoutMs: number,
  ): Promise<Response> {
    return providerFetch(url, init, {
      timeoutMs,
      allowInsecureTls: creds.allowInsecureTls,
      onTransportFailure: transportError,
    });
  }

  /**
   * One Web API call, returning the `data` object.
   *
   * Everything goes out as a POST form body, including the SID: DSM accepts the
   * session either way, and a `_sid` in a query string is a live credential in
   * every access log and proxy cache between here and the NAS.
   */
  private async call(
    creds: SynologyDriveCreds,
    params: Record<string, string>,
    opts: { cgi?: string; session?: SynoSession; timeoutMs?: number } = {},
  ): Promise<unknown> {
    const cgi = opts.cgi ?? ENTRY_CGI;
    const isAuth = cgi === AUTH_CGI;
    const body = new URLSearchParams(params);
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
    };
    if (opts.session) {
      body.set('_sid', opts.session.sid);
      headers.Cookie = `id=${opts.session.sid}`;
      if (opts.session.synoToken) {
        body.set('SynoToken', opts.session.synoToken);
        // DSM's own UI sends the CSRF token as a header; older builds only read
        // the parameter. Sending both costs nothing and covers either.
        headers['X-SYNO-TOKEN'] = opts.session.synoToken;
      }
    }

    const response = await this.request(
      normalizeBaseUrl(creds.baseUrl) + cgi,
      { method: 'POST', headers, body },
      creds,
      opts.timeoutMs ?? PROVIDER_TIMEOUT_MS,
    );

    if (!response.ok) {
      discardBody(response);
      throw httpError(response.status);
    }

    const parsed = await readCappedJson<SynoEnvelope>(response, PROVIDER_JSON_MAX_BYTES);
    if (!isRecord(parsed)) {
      throw new SynologyDriveError('provider_error', 'The NAS answered with something that is not JSON', {
        detail: 'Check that the URL points at DSM itself and that no login portal sits in front of it',
      });
    }
    if (parsed.success !== true) {
      const error = isRecord(parsed.error) ? parsed.error : undefined;
      const synoCode = typeof error?.code === 'number' ? error.code : 0;
      throw appError(synoCode, isAuth);
    }
    return parsed.data;
  }

  /**
   * A FileStation call with a session, retried exactly once after a session
   * error.
   *
   * Once, not "until it works": 106/107/119 mean the SID is gone and a fresh
   * login is the cure, while a second failure means something that another
   * login will not fix. Looping would spend login attempts, and DSM counts
   * those against its auto-block.
   */
  private async fileStation(
    creds: SynologyDriveCreds,
    params: Record<string, string>,
    opts: { timeoutMs?: number } = {},
  ): Promise<unknown> {
    const session = await this.session(creds);
    try {
      return await this.call(creds, params, { session, timeoutMs: opts.timeoutMs });
    } catch (error: unknown) {
      if (!(error instanceof SynologyDriveError) || !error.synoCode || !SESSION_CODES.has(error.synoCode)) {
        throw error;
      }
      this.sessions.delete(this.sessionKey(creds));
      const retrySession = await this.session(creds);
      return await this.call(creds, params, { session: retrySession, timeoutMs: opts.timeoutMs });
    }
  }

  /**
   * The cached session for this credential, or a fresh login.
   *
   * A cached session hands its device token to a saved connection that has
   * none yet. That is how the code typed into a form that was tested before it
   * was saved reaches the saved connection: the session is keyed by the whole
   * credential, code included, so only a connection presenting that same code
   * can find it.
   */
  private async session(creds: SynologyDriveCreds): Promise<SynoSession> {
    const cached = this.sessions.get(this.sessionKey(creds));
    if (cached && Date.now() - cached.createdAt < SESSION_MAX_AGE_MS) {
      const slot = this.deviceSlot(creds);
      if (slot && slot.token === null && cached.deviceId) this.setDeviceToken(creds, cached.deviceId);
      return cached;
    }
    return await this.login(creds);
  }

  /**
   * Log in, honouring the lockout.
   *
   * The connection's device token is reused when there is one: the form's OTP
   * is a single TOTP code that expires in thirty seconds, so it can only ever
   * serve the first login. Without the device token, every session expiry would
   * need a human to type a new code.
   */
  private async login(creds: SynologyDriveCreds): Promise<SynoSession> {
    const key = this.sessionKey(creds);
    const lockout = this.lockouts.get(key);
    if (lockout && lockout.until > Date.now()) {
      throw new SynologyDriveError(lockout.code, 'The NAS rejected these credentials; not retrying yet', {
        synoCode: lockout.synoCode,
        detail: `syno_code=${lockout.synoCode}; retrying before ${new Date(lockout.until).toISOString()} risks a DSM auto-block`,
      });
    }

    let answer: { data: unknown; deviceId: string | null };
    try {
      answer = await this.authenticate(creds);
    } catch (error: unknown) {
      if (error instanceof SynologyDriveError && error.synoCode && error.synoCode >= 400) {
        this.lockouts.set(key, {
          until: Date.now() + (error.synoCode === 407 ? AUTOBLOCK_LOCKOUT_MS : CREDENTIAL_LOCKOUT_MS),
          code: error.code,
          synoCode: error.synoCode,
        });
      }
      throw error;
    }

    const { data, deviceId } = answer;
    const sid = isRecord(data) && typeof data.sid === 'string' ? data.sid : null;
    if (!sid) {
      throw new SynologyDriveError('provider_error', 'The NAS accepted the login but returned no session id');
    }
    const issuedDeviceId = isRecord(data) && typeof data.did === 'string' ? data.did : deviceId;
    if (issuedDeviceId) this.setDeviceToken(creds, issuedDeviceId);
    const session: SynoSession = {
      sid,
      synoToken: isRecord(data) && typeof data.synotoken === 'string' ? data.synotoken : null,
      deviceId: issuedDeviceId,
      createdAt: Date.now(),
    };
    this.lockouts.delete(key);
    this.sessions.set(key, session);
    return session;
  }

  /**
   * The login request, on the connection's device token when it has one and on
   * the form's code otherwise.
   *
   * A token DSM refuses (someone removed TREK from the account's trusted
   * devices, or it expired) is dropped on the spot, and the code in the form
   * gets its turn in the same call. That code is usually what the owner just
   * typed to repair exactly this, and a dead token sent ahead of it would fail
   * every attempt, now that a stored token outlives the process. It is a second
   * credential rather than a second try of the first, and whichever fails last
   * is what the lockout records.
   */
  private async authenticate(creds: SynologyDriveCreds): Promise<{ data: unknown; deviceId: string | null }> {
    const deviceId = this.deviceSlot(creds)?.token ?? null;
    try {
      return { data: await this.call(creds, this.loginParams(creds, deviceId), { cgi: AUTH_CGI }), deviceId };
    } catch (error: unknown) {
      if (!deviceId || !(error instanceof SynologyDriveError) || !DEVICE_TOKEN_REFUSED_CODES.has(error.synoCode ?? 0)) {
        throw error;
      }
      // Unless another login replaced it while this one was out.
      if (this.deviceSlot(creds)?.token === deviceId) this.setDeviceToken(creds, null);
      if (!creds.otpCode) throw error;
      return { data: await this.call(creds, this.loginParams(creds, null), { cgi: AUTH_CGI }), deviceId: null };
    }
  }

  private loginParams(creds: SynologyDriveCreds, deviceId: string | null): Record<string, string> {
    const params: Record<string, string> = {
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: JSON.stringify(creds.username),
      passwd: JSON.stringify(creds.password),
      session: SESSION_NAME,
      format: 'sid',
      client: 'browser',
      device_name: DEVICE_NAME,
      // Ask for the CSRF token unconditionally. A NAS with CSRF protection on
      // refuses every later call without it, and one with it off ignores it.
      enable_syno_token: 'yes',
    };
    if (deviceId) {
      params.device_id = deviceId;
    } else if (creds.otpCode) {
      params.otp_code = creds.otpCode;
      params.enable_device_token = 'yes';
    }
    return params;
  }

  /**
   * Authenticate and report what this DSM offers.
   *
   * The API inventory is part of it because a DSM with File Station uninstalled
   * logs in perfectly and then answers 102 to everything, a failure that looks
   * like a TREK bug unless the connection test says so.
   */
  async probe(creds: SynologyDriveCreds): Promise<SynoProbe> {
    const info = await this.fileStation(creds, {
      api: 'SYNO.FileStation.Info',
      version: '2',
      method: 'get',
    });
    const hostname = isRecord(info) && typeof info.hostname === 'string' ? info.hostname : null;

    const session = await this.session(creds);
    const query = await this.call(
      creds,
      {
        api: 'SYNO.API.Info',
        version: '1',
        method: 'query',
        query: 'SYNO.FileStation.List,SYNO.FileStation.Upload,SYNO.FileStation.Download,SYNO.FileStation.CreateFolder,SYNO.FileStation.Rename,SYNO.FileStation.CopyMove,SYNO.FileStation.MD5',
      },
      { cgi: QUERY_CGI, session },
    );
    const availableApis = isRecord(query) ? Object.keys(query) : [];
    return { hostname, availableApis };
  }

  /** The shared folders this account can see. They are the roots of every path. */
  async listShares(creds: SynologyDriveCreds): Promise<SynoEntry[]> {
    const data = await this.fileStation(creds, {
      api: 'SYNO.FileStation.List',
      version: '2',
      method: 'list_share',
      additional: JSON.stringify(['size', 'time']),
    });
    return parseEntryList(data, 'shares');
  }

  /**
   * One folder's direct children, paged.
   *
   * Not recursive: FileStation's `list` has no recursion, and walking the tree
   * is the caller's decision because only the caller knows its request budget.
   */
  async listFolder(
    creds: SynologyDriveCreds,
    folderPath: string,
    opts: { maxPages?: number } = {},
  ): Promise<{ entries: SynoEntry[]; truncated: boolean; pages: number }> {
    const maxPages = Math.max(1, opts.maxPages ?? PROVIDER_MAX_PAGES);
    const entries: SynoEntry[] = [];
    let offset = 0;
    let pages = 0;

    while (pages < maxPages) {
      const data = await this.fileStation(creds, {
        api: 'SYNO.FileStation.List',
        version: '2',
        method: 'list',
        folder_path: JSON.stringify(folderPath),
        additional: JSON.stringify(['size', 'time', 'type']),
        offset: String(offset),
        limit: String(LIST_PAGE_SIZE),
      });
      pages += 1;
      const batch = parseEntryList(data, 'files');
      entries.push(...batch);
      const total = isRecord(data) && typeof data.total === 'number' ? data.total : entries.length;
      offset += batch.length;
      if (batch.length === 0 || entries.length >= total) return { entries, truncated: false, pages };
    }
    return { entries, truncated: true, pages };
  }

  /** One entry by path, or `not_found`. */
  async getInfo(creds: SynologyDriveCreds, path: string): Promise<SynoEntry> {
    const data = await this.fileStation(creds, {
      api: 'SYNO.FileStation.List',
      version: '2',
      method: 'getinfo',
      path: JSON.stringify([path]),
      additional: JSON.stringify(['size', 'time', 'type']),
    });
    const entry = parseEntryList(data, 'files')[0];
    if (!entry) {
      throw new SynologyDriveError('not_found', 'The NAS returned no entry for that path', { detail: path });
    }
    return entry;
  }

  /**
   * Create a folder. Succeeds silently when it already exists, which is what
   * makes "ensure the trash folder is there" a single call.
   */
  async createFolder(creds: SynologyDriveCreds, parentPath: string, name: string): Promise<SynoEntry> {
    const data = await this.fileStation(creds, {
      api: 'SYNO.FileStation.CreateFolder',
      version: '2',
      method: 'create',
      folder_path: JSON.stringify([parentPath]),
      name: JSON.stringify([name]),
      force_parent: 'true',
      additional: JSON.stringify(['size', 'time']),
    });
    const entry = parseEntryList(data, 'folders')[0];
    if (!entry) {
      throw new SynologyDriveError('provider_error', 'The NAS reported no folder after creating one', {
        detail: joinSynoPath(parentPath, name),
      });
    }
    return entry;
  }

  /**
   * Upload one file.
   *
   * The body is streamed rather than buffered, with an exact Content-Length:
   * FileStation answers 1800 to a chunked upload because it wants to know the
   * length up front, and buffering a 40 MB scan to satisfy that would put every
   * concurrent sync of a large trip in this process's heap.
   *
   * `mtime` goes out in MILLISECONDS while every read path reports seconds. The
   * point of sending it at all is that the file keeps TREK's timestamp, so the
   * next listing does not read TREK's own upload as an upstream change.
   */
  async upload(creds: SynologyDriveCreds, req: SynoUploadRequest): Promise<void> {
    if (!isValidSynoName(req.fileName)) {
      throw new SynologyDriveError('provider_error', 'DSM will not accept that file name', {
        detail: `illegal_name=${req.fileName}`,
      });
    }

    // The session is resolved before the body is touched. A stream can only be
    // read once, so the 106/119 re-login retry that every other call gets is not
    // available here: better to spend the round trip up front than to fail an
    // upload that already read half the file.
    const session = await this.session(creds);

    const boundary = `----trek${createHash('sha256').update(`${Date.now()}:${req.folderPath}:${req.fileName}`).digest('hex').slice(0, 24)}`;
    const fields: Record<string, string> = {
      api: 'SYNO.FileStation.Upload',
      version: '2',
      method: 'upload',
      path: req.folderPath,
      create_parents: req.createParents ? 'true' : 'false',
      overwrite: req.overwrite ? 'true' : 'false',
      mtime: String(req.mtimeSeconds * 1000),
      _sid: session.sid,
    };
    if (session.synoToken) fields.SynoToken = session.synoToken;

    let prologue = '';
    for (const [key, value] of Object.entries(fields)) {
      prologue += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    // The file part goes last. FileStation reads the fields as it parses and
    // starts writing at the file part, so a field after it is ignored.
    prologue += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${req.fileName}"\r\nContent-Type: ${req.mimeType}\r\n\r\n`;
    const head = Buffer.from(prologue, 'utf8');
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

    const source = req.body;
    async function* multipart(): AsyncGenerator<Buffer> {
      yield head;
      for await (const chunk of source) yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      yield tail;
    }

    const headers: Record<string, string> = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': String(head.length + req.size + tail.length),
      Cookie: `id=${session.sid}`,
      Accept: 'application/json',
    };
    if (session.synoToken) headers['X-SYNO-TOKEN'] = session.synoToken;

    const response = await this.request(
      `${normalizeBaseUrl(creds.baseUrl)}${ENTRY_CGI}?api=SYNO.FileStation.Upload&version=2&method=upload`,
      {
        method: 'POST',
        headers,
        body: Readable.toWeb(Readable.from(multipart())),
        // undici refuses a streaming body without it, and a stream is the point:
        // nothing here ever holds the whole file.
        duplex: 'half',
      },
      creds,
      PROVIDER_TRANSFER_TIMEOUT_MS,
    );

    if (!response.ok) {
      discardBody(response);
      throw httpError(response.status);
    }
    const parsed = await readCappedJson<SynoEnvelope>(response, PROVIDER_JSON_MAX_BYTES);
    if (!isRecord(parsed)) {
      throw new SynologyDriveError('provider_error', 'The NAS answered the upload with something that is not JSON');
    }
    if (parsed.success !== true) {
      const error = isRecord(parsed.error) ? parsed.error : undefined;
      throw appError(typeof error?.code === 'number' ? error.code : 0, false);
    }
  }

  /**
   * Download one file as a stream.
   *
   * A GET, because Download is the one FileStation method documented as one and
   * the session travels in the cookie, so nothing secret reaches the query
   * string.
   */
  async download(creds: SynologyDriveCreds, path: string, maxBytes: number): Promise<SynoDownload> {
    const session = await this.session(creds);
    const url = new URL(normalizeBaseUrl(creds.baseUrl) + ENTRY_CGI);
    url.searchParams.set('api', 'SYNO.FileStation.Download');
    url.searchParams.set('version', '2');
    url.searchParams.set('method', 'download');
    url.searchParams.set('path', JSON.stringify([path]));
    url.searchParams.set('mode', JSON.stringify('download'));

    const headers: Record<string, string> = { Cookie: `id=${session.sid}` };
    if (session.synoToken) headers['X-SYNO-TOKEN'] = session.synoToken;

    const response = await this.request(
      url.toString(),
      { method: 'GET', headers },
      creds,
      PROVIDER_TRANSFER_TIMEOUT_MS,
    );

    if (!response.ok) {
      discardBody(response);
      throw httpError(response.status);
    }

    // A refused download is JSON with HTTP 200, the same as every other error.
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const parsed = await readCappedJson<SynoEnvelope>(response, PROVIDER_JSON_MAX_BYTES);
      const error = isRecord(parsed) && isRecord(parsed.error) ? parsed.error : undefined;
      throw appError(typeof error?.code === 'number' ? error.code : 0, false);
    }
    const { body, size } = guardDownload(response, {
      maxBytes,
      tooLarge: (declared) =>
        new SynologyDriveError('too_large', 'The file is larger than this install allows', {
          detail: `content_length=${declared}`,
        }),
      noBody: () => new SynologyDriveError('provider_error', 'The NAS answered the download with an empty body'),
    });
    return { body, size, mimeType: contentType };
  }

  /** Rename in place. The path is the identity here, so this also moves it. */
  async rename(creds: SynologyDriveCreds, path: string, newName: string): Promise<SynoEntry> {
    if (!isValidSynoName(newName)) {
      throw new SynologyDriveError('provider_error', 'DSM will not accept that file name', {
        detail: `illegal_name=${newName}`,
      });
    }
    const data = await this.fileStation(creds, {
      api: 'SYNO.FileStation.Rename',
      version: '2',
      method: 'rename',
      path: JSON.stringify([path]),
      name: JSON.stringify([newName]),
      additional: JSON.stringify(['size', 'time', 'type']),
    });
    const entry = parseEntryList(data, 'files')[0];
    if (!entry) {
      throw new SynologyDriveError('provider_error', 'The NAS reported no entry after renaming', { detail: path });
    }
    return entry;
  }

  /**
   * Move one path into a folder, waiting for DSM's task to finish.
   *
   * CopyMove is asynchronous: the start call answers with a task id and the move
   * may still be running. Returning before it finished would let the caller list
   * the folder and find the file in both places, or in neither.
   */
  async move(
    creds: SynologyDriveCreds,
    path: string,
    destFolderPath: string,
    opts: { overwrite: boolean },
  ): Promise<void> {
    const data = await this.fileStation(creds, {
      api: 'SYNO.FileStation.CopyMove',
      version: '3',
      method: 'start',
      path: JSON.stringify([path]),
      dest_folder_path: JSON.stringify(destFolderPath),
      remove_src: 'true',
      overwrite: opts.overwrite ? 'true' : 'false',
      accurate_progress: 'false',
    });
    const taskId = isRecord(data) && typeof data.taskid === 'string' ? data.taskid : null;
    if (!taskId) return;
    await this.awaitTask(creds, 'SYNO.FileStation.CopyMove', '3', taskId);
  }

  /**
   * MD5 of a file already on the NAS.
   *
   * MD5, not sha256, because MD5 is the only digest FileStation computes, and
   * it is a task per file, so this is only ever a targeted question about one
   * file, never part of a listing.
   */
  async md5(creds: SynologyDriveCreds, path: string): Promise<string> {
    const started = await this.fileStation(creds, {
      api: 'SYNO.FileStation.MD5',
      version: '2',
      method: 'start',
      file_path: JSON.stringify(path),
    });
    const taskId = isRecord(started) && typeof started.taskid === 'string' ? started.taskid : null;
    if (!taskId) {
      throw new SynologyDriveError('provider_error', 'The NAS started no MD5 task', { detail: path });
    }
    const status = await this.awaitTask(creds, 'SYNO.FileStation.MD5', '2', taskId);
    const md5 = isRecord(status) && typeof status.md5 === 'string' ? status.md5 : null;
    if (!md5) {
      throw new SynologyDriveError('provider_error', 'The NAS finished the MD5 task without a digest', { detail: path });
    }
    return md5.toLowerCase();
  }

  private async awaitTask(
    creds: SynologyDriveCreds,
    api: string,
    version: string,
    taskId: string,
  ): Promise<unknown> {
    for (let poll = 0; poll < TASK_MAX_POLLS; poll++) {
      const status = await this.fileStation(creds, {
        api,
        version,
        method: 'status',
        taskid: JSON.stringify(taskId),
      });
      if (isRecord(status) && status.finished === true) return status;
      await sleep(TASK_POLL_INTERVAL_MS);
    }
    throw new SynologyDriveError('timeout', 'The NAS did not finish the operation in time', {
      detail: `${api} task ${taskId}`,
    });
  }
}
