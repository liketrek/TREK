/**
 * SynologyDriveDocumentProvider: what it puts on the wire, and what it makes
 * of what comes back.
 *
 * FileStation is the provider the sync core's weakest-common-denominator model
 * was shaped around: no change feed, no stable file id, app-level errors inside
 * HTTP 200, and one number meaning different things on two endpoints. So both
 * halves of that contract are pinned here: the exact parameters and their JSON
 * encoding, and the docsync error code each way a NAS can disappoint maps to.
 *
 * Only `safeFetch` is mocked. `cappedFetch` runs for real against the fake
 * responses, so "the NAS answered an HTML login page" stays a genuine parse
 * failure rather than a mock returning undefined on command, and the size cap
 * is the one that ships.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

const { safeFetchMock, SsrfBlockedErrorMock } = vi.hoisted(() => {
  class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  }
  return { safeFetchMock: vi.fn(), SsrfBlockedErrorMock: SsrfBlockedError };
});
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  safeFetch: safeFetchMock,
  SsrfBlockedError: SsrfBlockedErrorMock,
}));

import { SynologyDriveDocumentProvider } from '../../../../src/nest/doc-sync/providers/synology-drive.provider';
import {
  isValidSynoName,
  isWithinScope,
  normalizeBaseUrl,
  normalizeSynoPath,
  snapshotVersion,
  SynologyDriveClient,
} from '../../../../src/nest/doc-sync/providers/synology-drive.client';
import type {
  DocumentConnectionRef,
  DocumentProvider,
  DocumentScopeRef,
  PushRequest,
} from '../../../../src/nest/doc-sync/document-provider';

const BASE_URL = 'https://nas.example.org:5001';
const SCOPE = '/trek/japan-2026';

// ── the fake NAS ─────────────────────────────────────────────────────────────

interface Recorded {
  url: string;
  method: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  /** The multipart body, for the upload assertions. */
  raw?: Buffer;
  rejectUnauthorized?: boolean;
}

interface Reply {
  ok: boolean;
  status: number;
  headers: Headers;
  text(): Promise<string>;
  body?: ReadableStream<Uint8Array>;
}

type Handler = (call: Recorded) => Reply | Promise<Reply>;

let calls: Recorded[] = [];
let routes: Record<string, Handler> = {};

function reply(body: unknown, opts: { status?: number; raw?: string; contentType?: string; headers?: Record<string, string> } = {}): Reply {
  const status = opts.status ?? 200;
  const text = opts.raw ?? JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': opts.contentType ?? 'application/json', ...(opts.headers ?? {}) }),
    text: async () => text,
  };
}

const ok = (data: unknown = {}): Reply => reply({ success: true, data });
const fail = (code: number): Reply => reply({ success: false, error: { code } });

function binary(bytes: Buffer, contentType = 'application/octet-stream', declaredLength?: number): Reply {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': contentType, 'content-length': String(declaredLength ?? bytes.length) }),
    text: async () => bytes.toString('utf8'),
    body: Readable.toWeb(Readable.from([bytes])) as ReadableStream<Uint8Array>,
  };
}

/** One FileStation entry, in the shape `additional` really arrives in. */
function entry(path: string, opts: { dir?: boolean; size?: number; mtime?: number } = {}) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  return {
    path,
    name,
    isdir: opts.dir ?? false,
    additional: {
      size: opts.dir ? 0 : (opts.size ?? 100),
      time: { atime: 1, ctime: 2, crtime: 3, mtime: opts.mtime ?? 1_700_000_000 },
      ...(opts.dir ? {} : { type: name.slice(name.lastIndexOf('.') + 1).toUpperCase() }),
    },
  };
}

async function readStream(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

/** Field values out of the multipart body the upload builds by hand. */
function multipartFields(raw: Buffer): Record<string, string> {
  const fields: Record<string, string> = {};
  const text = raw.toString('binary');
  const pattern = /name="([^"]+)"(?:; filename="([^"]*)")?\r\n(?:Content-Type: [^\r\n]+\r\n)?\r\n([\s\S]*?)\r\n--/g;
  for (const match of text.matchAll(pattern)) {
    if (match[2] === undefined) fields[match[1]] = match[3];
    else fields[`file:${match[1]}`] = match[2];
  }
  return fields;
}

function install(): void {
  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      const parsed = new URL(url);
      const params: Record<string, string> = Object.fromEntries(parsed.searchParams.entries());
      const call: Recorded = {
        url,
        method: init.method ?? 'GET',
        params,
        headers: { ...((init.headers ?? {}) as Record<string, string>) },
        rejectUnauthorized: options?.rejectUnauthorized,
      };
      if (init.body instanceof URLSearchParams) {
        for (const [key, value] of init.body.entries()) params[key] = value;
      } else if (init.body) {
        call.raw = await readStream(init.body);
        Object.assign(params, multipartFields(call.raw));
      }
      calls.push(call);
      const handler = routes[`${params.api}:${params.method}`] ?? routes[params.api ?? ''];
      if (!handler) throw new Error(`the test queued no answer for ${params.api}:${params.method}`);
      return (await handler(call)) as unknown as Response;
    },
  );
}

/** Answers, keyed `<api>:<method>`. A login is always available. */
function route(table: Record<string, Handler | Reply>): void {
  routes = {
    'SYNO.API.Auth:login': () => ok({ sid: 'SID-1', is_portal_port: false }),
    'SYNO.API.Info:query': () => ok({ 'SYNO.FileStation.List': { path: 'entry.cgi', maxVersion: 2 } }),
    ...Object.fromEntries(
      Object.entries(table).map(([key, value]) => [key, typeof value === 'function' ? value : () => value]),
    ),
  };
}

/** Successive answers for one route. The last one repeats. */
function sequence(...replies: Reply[]): Handler {
  const queue = [...replies];
  return () => (queue.length > 1 ? queue.shift()! : queue[0]);
}

function paramsOf(index: number): Record<string, string> {
  return calls[index].params;
}

function callsTo(api: string, method?: string): Recorded[] {
  return calls.filter((call) => call.params.api === api && (!method || call.params.method === method));
}

// ── fixtures ─────────────────────────────────────────────────────────────────

function connection(overrides: Partial<DocumentConnectionRef> = {}): DocumentConnectionRef {
  return {
    connectionId: 3,
    createdAt: '2026-09-01 08:00:00',
    ownerId: 11,
    baseUrl: BASE_URL,
    secrets: { password: 'nas-secret' },
    settings: { username: 'trek', base_path: '/trek' },
    allowInsecureTls: false,
    ...overrides,
  };
}

function scope(overrides: Partial<DocumentScopeRef> = {}): DocumentScopeRef {
  return {
    linkId: 5,
    tripId: 42,
    scopeKey: `path:${SCOPE}`,
    remoteRootId: null,
    remoteRootPath: SCOPE,
    cursor: null,
    ...overrides,
  };
}

const BYTES = Buffer.from('%PDF-1.7 itinerary\n', 'utf8');
const BYTES_MD5 = createHash('md5').update(BYTES).digest('hex');

function push(overrides: Partial<PushRequest> = {}): PushRequest {
  return {
    body: Readable.from([BYTES]),
    fileName: 'itinerary.pdf',
    mimeType: 'application/pdf',
    size: BYTES.length,
    sha256: createHash('sha256').update(BYTES).digest('hex'),
    mtimeSeconds: 1_700_000_000,
    trekDocUid: 'doc_7',
    trekTripUid: 'trip_9',
    ...overrides,
  };
}

/** The answers a successful push needs: nothing at the path before the upload, the stored file after it. */
function pushRoutes(path: string, size = BYTES.length, md5 = BYTES_MD5): Record<string, Handler | Reply> {
  return {
    'SYNO.FileStation.Upload:upload': ok({ file: path.slice(path.lastIndexOf('/') + 1) }),
    'SYNO.FileStation.List:getinfo': sequence(fail(408), ok({ files: [entry(path, { size })] })),
    'SYNO.FileStation.MD5:start': ok({ taskid: 'T-md5' }),
    'SYNO.FileStation.MD5:status': ok({ finished: true, md5 }),
  };
}

let provider: SynologyDriveDocumentProvider;

beforeEach(() => {
  calls = [];
  routes = {};
  safeFetchMock.mockReset();
  safeFetchMock.mockImplementation(async () => {
    throw new Error('unstubbed safeFetch');
  });
  install();
  provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
});

// ── capabilities ─────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: capabilities', () => {
  it('SYNO-PROVIDER-001: promises nothing FileStation cannot do', () => {
    expect(provider.id).toBe('synologydrive');
    expect(provider.capabilities()).toMatchObject({
      push: 'none',
      stableId: false,
      remoteTrash: true,
      replaceInPlace: true,
      contentHashInListing: false,
      acceptedMimeTypes: null,
      canCreateScope: true,
    });
  });

  it('SYNO-PROVIDER-002: registerWebhook is absent, not a stub that resolves', () => {
    // Read through the interface: the class does not declare the optional
    // members at all, which is the point being pinned.
    const asProvider: DocumentProvider = provider;
    expect(asProvider.registerWebhook).toBeUndefined();
    expect(asProvider.unregisterWebhook).toBeUndefined();
  });
});

// ── login and session ────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: login', () => {
  it('SYNO-PROVIDER-010: logs in on auth.cgi with JSON-quoted values and asks for a CSRF token', async () => {
    route({ 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    const result = await provider.probe(connection());

    expect(result).toMatchObject({ success: true, data: { account: 'trek' } });
    expect(calls[0].url).toBe(`${BASE_URL}/webapi/auth.cgi`);
    expect(paramsOf(0)).toMatchObject({
      api: 'SYNO.API.Auth',
      version: '6',
      method: 'login',
      account: '"trek"',
      passwd: '"nas-secret"',
      session: 'FileStation',
      format: 'sid',
      enable_syno_token: 'yes',
    });
  });

  it('SYNO-PROVIDER-011: never puts the session id in a query string', async () => {
    route({ 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    await provider.probe(connection());
    for (const call of calls) expect(call.url).not.toContain('_sid');
  });

  it('SYNO-PROVIDER-012: refuses a DSM without File Station rather than failing later', async () => {
    route({
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
      'SYNO.API.Info:query': ok({}),
    });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
  });

  it('SYNO-PROVIDER-013: a wrong password is unauthorized and keeps DSM\'s own code', async () => {
    route({ 'SYNO.API.Auth:login': fail(400) });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized', detail: 'syno_code=400' } });
  });

  it('SYNO-PROVIDER-014: a rejected credential is not retried, since that is what earns an auto-block', async () => {
    route({ 'SYNO.API.Auth:login': fail(400) });
    await provider.probe(connection());
    const after = calls.length;
    const second = await provider.probe(connection());

    expect(calls.length).toBe(after);
    expect(second).toMatchObject({ success: false, error: { code: 'unauthorized' } });
  });

  it('SYNO-PROVIDER-015: a corrected password reaches the NAS immediately', async () => {
    route({ 'SYNO.API.Auth:login': fail(400) });
    await provider.probe(connection());
    route({ 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });

    const result = await provider.probe(connection({ secrets: { password: 'corrected' } }));
    expect(result).toMatchObject({ success: true });
  });

  it('SYNO-PROVIDER-016: DSM\'s auto-block (407) is rate_limited, not a credential problem', async () => {
    route({ 'SYNO.API.Auth:login': fail(407) });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'rate_limited', detail: 'syno_code=407' } });
  });

  it('SYNO-PROVIDER-017: a one-time code is sent once, with the device-token request', async () => {
    route({
      'SYNO.API.Auth:login': ok({ sid: 'SID-1', did: 'DEVICE-1' }),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
    });
    await provider.probe(connection({ secrets: { password: 'nas-secret', otp_code: '123456' } }));
    expect(paramsOf(0)).toMatchObject({ otp_code: '123456', enable_device_token: 'yes' });
  });

  it('SYNO-PROVIDER-018: the re-login uses the device token and no second one-time code', async () => {
    route({
      'SYNO.API.Auth:login': ok({ sid: 'SID-1', did: 'DEVICE-1' }),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
      'SYNO.FileStation.List:list_share': sequence(fail(106), ok({ shares: [] })),
      'SYNO.FileStation.List:list': ok({ total: 0, files: [] }),
    });
    const conn = connection({ secrets: { password: 'nas-secret', otp_code: '123456' } });
    await provider.probe(conn);
    await provider.listScopes(conn);

    const logins = callsTo('SYNO.API.Auth', 'login');
    expect(logins).toHaveLength(2);
    expect(logins[1].params.device_id).toBe('DEVICE-1');
    expect(logins[1].params.otp_code).toBeUndefined();
  });

  it('SYNO-PROVIDER-019: the CSRF token travels as a parameter and as a header', async () => {
    route({
      'SYNO.API.Auth:login': ok({ sid: 'SID-1', synotoken: 'CSRF-7' }),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
    });
    await provider.probe(connection());
    expect(paramsOf(1).SynoToken).toBe('CSRF-7');
    expect(calls[1].headers['X-SYNO-TOKEN']).toBe('CSRF-7');
    expect(calls[1].headers.Cookie).toBe('id=SID-1');
  });

  it('SYNO-PROVIDER-020: one session serves every call of a run', async () => {
    route({
      'SYNO.FileStation.List:list_share': ok({ shares: [entry('/trek', { dir: true })] }),
      'SYNO.FileStation.List:list': ok({ total: 0, files: [] }),
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(SCOPE, { dir: true })] }),
    });
    const conn = connection();
    await provider.listScopes(conn);
    await provider.resolveScope(conn, scope());
    expect(callsTo('SYNO.API.Auth', 'login')).toHaveLength(1);
  });

  it('SYNO-PROVIDER-021: an expired session is re-logged in once and the call replayed', async () => {
    route({
      'SYNO.FileStation.List:getinfo': sequence(fail(119), ok({ files: [entry(SCOPE, { dir: true })] })),
    });
    const result = await provider.resolveScope(connection(), scope());

    expect(result).toMatchObject({ success: true });
    expect(callsTo('SYNO.API.Auth', 'login')).toHaveLength(2);
    expect(callsTo('SYNO.FileStation.List', 'getinfo')).toHaveLength(2);
  });

  it('SYNO-PROVIDER-022: a session error that survives the retry is not retried again', async () => {
    route({ 'SYNO.FileStation.List:getinfo': fail(106) });
    const result = await provider.resolveScope(connection(), scope());

    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(callsTo('SYNO.API.Auth', 'login')).toHaveLength(2);
    expect(callsTo('SYNO.FileStation.List', 'getinfo')).toHaveLength(2);
  });

  it('SYNO-PROVIDER-023: a connection without credentials never opens a socket', async () => {
    const result = await provider.probe(connection({ secrets: {}, settings: { username: '' } }));
    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-024: self-signed TLS is only relaxed when the connection says so', async () => {
    route({ 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    await provider.probe(connection({ allowInsecureTls: true }));
    expect(calls[0].rejectUnauthorized).toBe(false);
  });
});

// ── device tokens ────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: device tokens', () => {
  /** Codes the fake NAS has accepted. A TOTP code is good for one login, as on DSM. */
  let spent = new Set<string>();

  /** DSM with two-factor on: a login needs a trusted device or a fresh code, and a code earns a device. */
  function twoFactorNas(refused: string[] = []): Handler {
    return (call) => {
      const { device_id: deviceId, otp_code: otpCode } = call.params;
      if (deviceId && refused.includes(deviceId)) return fail(403);
      if (deviceId) return ok({ sid: `SID-${deviceId}` });
      if (otpCode && spent.has(otpCode)) return fail(404);
      if (otpCode) {
        spent.add(otpCode);
        return ok({ sid: `SID-${otpCode}`, did: `DEVICE-${otpCode}` });
      }
      return fail(403);
    };
  }

  const withCode = (code: string) => ({ secrets: { password: 'nas-secret', otp_code: code } });
  const logins = () => callsTo('SYNO.API.Auth', 'login');

  /** Push every cached session past its age, so the next call logs in again. */
  function expireSessions(): void {
    vi.setSystemTime(Date.now() + 31 * 60 * 1000);
    calls = [];
  }

  /** Every write a saved connection made into its stored secrets. */
  let writes: Array<[string, string | null]> = [];

  /**
   * A saved connection the way `DocSyncConfigService.toRef` hands one out: the
   * secrets as they were stored when the ref was made, and a way to write back
   * into `store`, which stands in for the connection's row.
   */
  function saved(store: Record<string, string>, overrides: Partial<DocumentConnectionRef> = {}): DocumentConnectionRef {
    return connection({
      secrets: { ...store },
      saveSecret: (key, value) => {
        writes.push([key, value]);
        if (value === null) delete store[key];
        else store[key] = value;
      },
      ...overrides,
    });
  }

  /** A new process: nothing in memory, only what the connections stored. */
  function restart(): void {
    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    calls = [];
    writes = [];
  }

  const picker = {
    'SYNO.FileStation.List:list_share': ok({ shares: [] }),
    'SYNO.FileStation.List:list': ok({ total: 0, files: [] }),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    spent = new Set();
    writes = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SYNO-PROVIDER-025: another trip on the same account cannot log in on this trip\'s token', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    expect(await provider.probe(connection(withCode('111111')))).toMatchObject({ success: true });

    // Same NAS, same account, same password, a different trip and owner, and
    // never a code from the authenticator.
    const stranger = await provider.probe(connection({ connectionId: 4, ownerId: 12 }));

    expect(stranger).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(logins()[1].params.device_id).toBeUndefined();
  });

  it('SYNO-PROVIDER-026: two connections to one account each log in again on their own token', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    const first = connection(withCode('111111'));
    const second = connection({ connectionId: 4, ownerId: 12, ...withCode('222222') });
    await provider.probe(first);
    await provider.probe(second);

    expireSessions();
    await provider.probe(first);
    await provider.probe(second);

    expect(logins().map((call) => call.params.device_id)).toEqual(['DEVICE-111111', 'DEVICE-222222']);
    expect(logins().every((call) => call.params.otp_code === undefined)).toBe(true);
  });

  it('SYNO-PROVIDER-027: a token DSM stops trusting is dropped on that connection and no other', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    const first = connection(withCode('111111'));
    const second = connection({ connectionId: 4, ownerId: 12, ...withCode('222222') });
    await provider.probe(first);
    await provider.probe(second);

    // Someone removed the first connection's device from DSM's trusted list.
    route({
      'SYNO.API.Auth:login': twoFactorNas(['DEVICE-111111']),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
    });
    expireSessions();
    expect(await provider.probe(first)).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    // The code in the form gets its turn in the same call; this one was spent
    // long ago, so DSM turns it down as well.
    expect(logins().map((call) => [call.params.device_id, call.params.otp_code])).toEqual([
      ['DEVICE-111111', undefined],
      [undefined, '111111'],
    ]);
    expect(await provider.probe(second)).toMatchObject({ success: true });

    // Once the lockout has passed, the first connection offers the code in its
    // form again and never the token DSM refused.
    vi.setSystemTime(Date.now() + 61 * 1000);
    calls = [];
    await provider.probe(first);
    expect(logins()).toHaveLength(1);
    expect(logins()[0].params).toMatchObject({ otp_code: '111111', enable_device_token: 'yes' });
    expect(logins()[0].params.device_id).toBeUndefined();
  });

  it('SYNO-PROVIDER-028: the token outlives a password edit and a stale code, but not a new account', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    await provider.probe(connection(withCode('111111')));

    await provider.probe(connection({ secrets: { password: 'rotated', otp_code: '111111' } }));
    await provider.probe(connection({ secrets: { password: 'rotated' } }));
    expect(logins().slice(1).map((call) => call.params.device_id)).toEqual(['DEVICE-111111', 'DEVICE-111111']);

    // The same connection repointed at another NAS, or at another account on
    // this one, has passed nobody's second factor there.
    await provider.probe(connection({ baseUrl: 'https://other-nas.example.org:5001' }));
    await provider.probe(connection({ settings: { username: 'someone-else', base_path: '/trek' } }));
    expect(logins().slice(3).map((call) => call.params.device_id)).toEqual([undefined, undefined]);
  });

  it('SYNO-PROVIDER-029: a code tested before the form was saved carries over to the saved connection', async () => {
    route({
      'SYNO.API.Auth:login': twoFactorNas(),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
      'SYNO.FileStation.List:list_share': ok({ shares: [] }),
      'SYNO.FileStation.List:list': ok({ total: 0, files: [] }),
    });
    // Every unsaved form is connection 0, so what one of them earns must not
    // be something the next unsaved form can use.
    await provider.probe(connection({ connectionId: 0, ...withCode('111111') }));
    expect(await provider.probe(connection({ connectionId: 0, ownerId: 12 }))).toMatchObject({ success: false });
    expect(logins()[1].params.device_id).toBeUndefined();

    // Saved as connection 9: the scope picker runs on the session the test
    // opened, and the next login after it expired needs no second code.
    const saved = connection({ connectionId: 9, ...withCode('111111') });
    await provider.listScopes(saved);
    expireSessions();
    await provider.listScopes(saved);

    expect(logins()).toHaveLength(1);
    expect(logins()[0].params.device_id).toBe('DEVICE-111111');
    expect(logins()[0].params.otp_code).toBeUndefined();
  });

  it('SYNO-PROVIDER-100: the token a code earns is stored with the connection once, tied to its NAS and account', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));
    await provider.listScopes(saved(store));

    expect(store.device_token).toMatch(/^[0-9a-f]{64}:DEVICE-111111$/);
    // Four FileStation calls, one change, one write.
    expect(writes).toEqual([['device_token', store.device_token]]);
  });

  it('SYNO-PROVIDER-101: after a restart the stored token logs in, and nobody has to type a code', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    restart();
    expect(await provider.listScopes(saved(store))).toMatchObject({ success: true });
    expect(logins()).toHaveLength(1);
    expect(logins()[0].params.device_id).toBe('DEVICE-111111');
    expect(logins()[0].params.otp_code).toBeUndefined();
    expect(writes).toEqual([]);
  });

  it('SYNO-PROVIDER-102: the stored token outlives a password edit and a spent or cleared code', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    store.password = 'rotated';
    restart();
    await provider.listScopes(saved(store));
    expect(logins()[0].params).toMatchObject({ device_id: 'DEVICE-111111', passwd: '"rotated"' });
    expect(logins()[0].params.otp_code).toBeUndefined();

    delete store.otp_code;
    restart();
    await provider.listScopes(saved(store));
    expect(logins()[0].params.device_id).toBe('DEVICE-111111');
    expect(store.device_token).toMatch(/:DEVICE-111111$/);
  });

  it('SYNO-PROVIDER-103: an unsaved form writes nothing, even when handed a place to write', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }) });
    const saveSecret = vi.fn();
    await provider.probe(connection({ connectionId: 0, ...withCode('111111'), saveSecret }));
    expect(logins()[0].params.otp_code).toBe('111111');
    expect(saveSecret).not.toHaveBeenCalled();
  });

  it('SYNO-PROVIDER-104: a token DSM refuses is dropped from storage too, and no error names it', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    route({ 'SYNO.API.Auth:login': twoFactorNas(['DEVICE-111111']), ...picker });
    restart();
    const result = await provider.listScopes(saved(store));
    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(store.device_token).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('DEVICE-111111');

    // The next process has nothing left to offer DSM but the code.
    restart();
    await provider.listScopes(saved(store));
    expect(logins()[0].params.device_id).toBeUndefined();
  });

  it('SYNO-PROVIDER-105: a fresh code wins over a refused token in the same test, and the saved connection keeps it', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), 'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    // TREK was removed from the account's trusted devices. After a restart the
    // owner types a new code and tests the form, which merges in what is stored
    // but has no way to write.
    route({
      'SYNO.API.Auth:login': twoFactorNas(['DEVICE-111111']),
      'SYNO.FileStation.Info:get': ok({ hostname: 'nas' }),
      ...picker,
    });
    restart();
    expect(await provider.probe(connection({ secrets: { ...store, otp_code: '222222' } }))).toMatchObject({ success: true });
    expect(logins().map((call) => [call.params.device_id, call.params.otp_code])).toEqual([
      ['DEVICE-111111', undefined],
      [undefined, '222222'],
    ]);
    expect(store.device_token).toMatch(/:DEVICE-111111$/);

    // Saved with that code: the connection's next call stores what the test earned.
    store.otp_code = '222222';
    await provider.listScopes(saved(store));
    expect(store.device_token).toMatch(/:DEVICE-222222$/);

    restart();
    await provider.listScopes(saved(store));
    expect(logins()[0].params.device_id).toBe('DEVICE-222222');
  });

  it('SYNO-PROVIDER-106: a connection repointed at another account forgets its token, in memory and in storage', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));
    calls = [];

    await provider.listScopes(saved(store, { settings: { username: 'someone-else', base_path: '/trek' } }));
    expect(logins()[0].params.device_id).toBeUndefined();
    expect(store.device_token).toBeUndefined();

    // Pointed back, it has passed nobody's second factor there either.
    expireSessions();
    await provider.listScopes(saved(store));
    expect(logins()[0].params.device_id).toBeUndefined();
  });

  it('SYNO-PROVIDER-107: after a restart, a token stored for another NAS is dropped rather than offered there', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    restart();
    await provider.listScopes(saved(store, { baseUrl: 'https://other-nas.example.org:5001' }));
    expect(logins()[0].params.device_id).toBeUndefined();
    expect(store.device_token).toBeUndefined();
  });

  it('SYNO-PROVIDER-108: a connection that a restore hands the same id is a stranger to the token under it', async () => {
    route({ 'SYNO.API.Auth:login': twoFactorNas(), ...picker });
    const store: Record<string, string> = { password: 'nas-secret', otp_code: '111111' };
    await provider.listScopes(saved(store));

    // A backup from before that connection is restored without a restart, and
    // another trip's owner, who knows the password but has no authenticator,
    // saves a connection to the same account. The id sequence went back with
    // the database, so the new row gets the same id.
    const reissued: Record<string, string> = { password: 'nas-secret' };
    const stranger = await provider.listScopes(saved(reissued, { ownerId: 12, createdAt: '2026-09-02 09:30:00' }));

    expect(stranger).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(logins()[1].params.device_id).toBeUndefined();
    expect(reissued.device_token).toBeUndefined();

    // A later backup brings the first row back, and it logs in on its token as before.
    expireSessions();
    await provider.listScopes(saved(store));
    expect(logins()[0].params.device_id).toBe('DEVICE-111111');
  });
});

// ── scopes ───────────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: scopes', () => {
  it('SYNO-PROVIDER-030: offers the shares and the folders under the base path', async () => {
    route({
      'SYNO.FileStation.List:list_share': ok({ shares: [entry('/trek', { dir: true }), entry('/photo', { dir: true })] }),
      'SYNO.FileStation.List:list': ok({
        total: 3,
        files: [
          entry('/trek/japan-2026', { dir: true }),
          entry('/trek/.trek-trash', { dir: true }),
          entry('/trek/readme.txt'),
        ],
      }),
    });
    const result = await provider.listScopes(connection());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.map((option) => option.scopeKey)).toEqual([
      'path:/photo',
      'path:/trek',
      'path:/trek/japan-2026',
    ]);
    // There is no stable folder id on a Synology share; inventing one would put
    // a fiction into the stored binding.
    expect(result.data.every((option) => option.remoteRootId === null)).toBe(true);
  });

  it('SYNO-PROVIDER-031: a base path that does not exist yet still lists the shares', async () => {
    route({
      'SYNO.FileStation.List:list_share': ok({ shares: [entry('/trek', { dir: true })] }),
      'SYNO.FileStation.List:list': fail(408),
    });
    const result = await provider.listScopes(connection());
    expect(result).toMatchObject({ success: true });
    if (result.success) expect(result.data).toHaveLength(1);
  });

  it('SYNO-PROVIDER-032: the picker query filters on label and path', async () => {
    route({
      'SYNO.FileStation.List:list_share': ok({ shares: [entry('/trek', { dir: true }), entry('/photo', { dir: true })] }),
      'SYNO.FileStation.List:list': ok({ total: 1, files: [entry('/trek/japan-2026', { dir: true })] }),
    });
    const result = await provider.listScopes(connection(), 'japan');
    expect(result.success && result.data.map((option) => option.scopeKey)).toEqual(['path:/trek/japan-2026']);
  });

  it('SYNO-PROVIDER-033: creates a folder under the base path with JSON arrays and force_parent', async () => {
    route({ 'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry('/trek/kyoto', { dir: true })] }) });
    const result = await provider.createScope(connection(), '  kyoto  ');

    expect(result).toMatchObject({ success: true, data: { scopeKey: 'path:/trek/kyoto', remoteRootPath: '/trek/kyoto' } });
    expect(paramsOf(1)).toMatchObject({
      api: 'SYNO.FileStation.CreateFolder',
      version: '2',
      folder_path: '["/trek"]',
      name: '["kyoto"]',
      force_parent: 'true',
    });
  });

  it('SYNO-PROVIDER-034: a folder name with a separator is refused before any request', async () => {
    const result = await provider.createScope(connection(), 'kyoto/2026');
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-035: a missing share is scope_missing, because force_parent cannot create one', async () => {
    route({ 'SYNO.FileStation.CreateFolder:create': fail(408) });
    const result = await provider.createScope(connection({ settings: { username: 'trek', base_path: '/nope' } }), 'kyoto');
    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
  });

  it('SYNO-PROVIDER-036: a scope that vanished upstream is scope_missing, not not_found', async () => {
    route({ 'SYNO.FileStation.List:getinfo': fail(408) });
    const result = await provider.resolveScope(connection(), scope());
    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
  });

  it('SYNO-PROVIDER-037: a scope key pointing at a file is scope_missing', async () => {
    route({ 'SYNO.FileStation.List:getinfo': ok({ files: [entry(SCOPE)] }) });
    const result = await provider.resolveScope(connection(), scope());
    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
  });

  it('SYNO-PROVIDER-038: the FileStation root is not a scope a trip can be bound to', async () => {
    const result = await provider.resolveScope(connection(), scope({ scopeKey: 'path:/', remoteRootPath: '/' }));
    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
    expect(calls).toHaveLength(0);
  });
});

// ── listing ──────────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: list', () => {
  it('SYNO-PROVIDER-040: walks sub-folders, skips the bin and maps each file', async () => {
    const byFolder: Record<string, unknown[]> = {
      [SCOPE]: [entry(`${SCOPE}/boarding.pdf`, { size: 12, mtime: 1_700_000_500 }), entry(`${SCOPE}/leg-2`, { dir: true }), entry(`${SCOPE}/.trek-trash`, { dir: true })],
      [`${SCOPE}/leg-2`]: [entry(`${SCOPE}/leg-2/hotel.pdf`)],
    };
    route({
      'SYNO.FileStation.List:list': (call) => {
        const folder = JSON.parse(call.params.folder_path) as string;
        const files = byFolder[folder] ?? [];
        return ok({ total: files.length, files });
      },
    });
    const result = await provider.list(connection(), scope());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.documents.map((document) => document.remoteId)).toEqual([
      `${SCOPE}/boarding.pdf`,
      `${SCOPE}/leg-2/hotel.pdf`,
    ]);
    expect(result.data.documents[0]).toMatchObject({
      name: 'boarding.pdf',
      size: 12,
      mimeType: 'application/pdf',
      // MD5 is the only digest FileStation computes, and it is not the sha256
      // the core compares against, so there is nothing honest to put here.
      contentHash: null,
      remoteModifiedAt: new Date(1_700_000_500 * 1000).toISOString(),
      isDeleted: false,
      remoteVersion: snapshotVersion(`${SCOPE}/boarding.pdf`, 12, 1_700_000_500),
    });
    expect(result.data.truncated).toBe(false);
    // The bin is never walked: a trashed document must not come back as a new one.
    expect(callsTo('SYNO.FileStation.List', 'list').map((call) => JSON.parse(call.params.folder_path))).toEqual([
      SCOPE,
      `${SCOPE}/leg-2`,
    ]);
  });

  it('SYNO-PROVIDER-041: pages one folder with offset and limit until total is reached', async () => {
    route({
      'SYNO.FileStation.List:list': (call) => {
        const offset = Number(call.params.offset);
        return ok({
          total: 3,
          offset,
          files: offset === 0
            ? [entry(`${SCOPE}/a.pdf`), entry(`${SCOPE}/b.pdf`)]
            : [entry(`${SCOPE}/c.pdf`)],
        });
      },
    });
    const result = await provider.list(connection(), scope());

    expect(result.success && result.data.documents).toHaveLength(3);
    expect(result.success && result.data.truncated).toBe(false);
    expect(callsTo('SYNO.FileStation.List', 'list').map((call) => call.params.offset)).toEqual(['0', '2']);
  });

  it('SYNO-PROVIDER-042: a tree deeper than the request budget says truncated instead of stalling', async () => {
    // Every folder holds one more folder, so the walk can never finish.
    route({
      'SYNO.FileStation.List:list': (call) => {
        const folder = JSON.parse(call.params.folder_path) as string;
        return ok({ total: 1, files: [entry(`${folder}/deeper`, { dir: true })] });
      },
    });
    const result = await provider.list(connection(), scope());

    expect(result.success && result.data.truncated).toBe(true);
    expect(result.success && result.data.documents).toHaveLength(0);
    expect(callsTo('SYNO.FileStation.List', 'list').length).toBeLessThanOrEqual(40);
  });

  it('SYNO-PROVIDER-043: an unchanged tree reports cursorUnchanged, a changed one does not', async () => {
    route({ 'SYNO.FileStation.List:list': ok({ total: 1, files: [entry(`${SCOPE}/a.pdf`)] }) });
    const first = await provider.list(connection(), scope());
    expect(first.success).toBe(true);
    if (!first.success) return;

    const second = await provider.list(connection(), scope({ cursor: first.data.cursor }));
    expect(second).toMatchObject({ success: true, data: { cursorUnchanged: true } });

    route({ 'SYNO.FileStation.List:list': ok({ total: 1, files: [entry(`${SCOPE}/a.pdf`, { size: 999 })] }) });
    const third = await provider.list(connection(), scope({ cursor: first.data.cursor }));
    expect(third).toMatchObject({ success: true, data: { cursorUnchanged: false } });
  });

  it('SYNO-PROVIDER-044: a truncated walk never claims the tree is unchanged', async () => {
    route({
      'SYNO.FileStation.List:list': (call) => {
        const folder = JSON.parse(call.params.folder_path) as string;
        return ok({ total: 1, files: [entry(`${folder}/deeper`, { dir: true })] });
      },
    });
    const first = await provider.list(connection(), scope());
    expect(first.success).toBe(true);
    if (!first.success) return;
    calls = [];
    const second = await provider.list(connection(), scope({ cursor: first.data.cursor }));
    expect(second).toMatchObject({ success: true, data: { cursorUnchanged: false, truncated: true } });
  });

  it('SYNO-PROVIDER-045: a scope that disappeared mid-run is scope_missing, not an empty listing', async () => {
    route({ 'SYNO.FileStation.List:list': fail(408) });
    const result = await provider.list(connection(), scope());
    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
  });

  it('SYNO-PROVIDER-046: an entry outside the scope is dropped rather than handed to the core', async () => {
    route({
      'SYNO.FileStation.List:list': ok({
        total: 2,
        files: [entry(`${SCOPE}/ok.pdf`), entry('/payroll/2026.pdf')],
      }),
    });
    const result = await provider.list(connection(), scope());
    expect(result.success && result.data.documents.map((document) => document.remoteId)).toEqual([`${SCOPE}/ok.pdf`]);
  });
});

// ── fetch ────────────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: fetch', () => {
  it('SYNO-PROVIDER-050: reads the version before the bytes and streams them', async () => {
    route({
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/a.pdf`, { size: BYTES.length, mtime: 1_700_000_300 })] }),
      'SYNO.FileStation.Download:download': binary(BYTES),
    });
    const result = await provider.fetch(connection(), scope(), `${SCOPE}/a.pdf`);

    expect(result.success).toBe(true);
    if (!result.success) return;
    const chunks: Buffer[] = [];
    for await (const chunk of result.data.body) chunks.push(Buffer.from(chunk as Uint8Array));
    expect(Buffer.concat(chunks).equals(BYTES)).toBe(true);
    expect(result.data.mimeType).toBe('application/pdf');
    expect(result.data.remoteVersion).toBe(snapshotVersion(`${SCOPE}/a.pdf`, BYTES.length, 1_700_000_300));
    // The session travels in the cookie so the download URL carries nothing secret.
    const download = callsTo('SYNO.FileStation.Download')[0];
    expect(download.method).toBe('GET');
    expect(download.url).not.toContain('SID');
    expect(download.headers.Cookie).toBe('id=SID-1');
  });

  it('SYNO-PROVIDER-051: a refusal arrives as JSON inside HTTP 200 and is classified', async () => {
    route({
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/a.pdf`)] }),
      'SYNO.FileStation.Download:download': fail(408),
    });
    const result = await provider.fetch(connection(), scope(), `${SCOPE}/a.pdf`);
    expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
  });

  it('SYNO-PROVIDER-052: a body larger than the ceiling is refused before it is read', async () => {
    route({
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/a.pdf`)] }),
      'SYNO.FileStation.Download:download': binary(BYTES, 'application/octet-stream', 3 * 1024 * 1024 * 1024),
    });
    const result = await provider.fetch(connection(), scope(), `${SCOPE}/a.pdf`);
    expect(result).toMatchObject({ success: false, error: { code: 'too_large' } });
  });

  it('SYNO-PROVIDER-053: a path that walks out of the scope never reaches the NAS', async () => {
    route({});
    for (const escape of [`${SCOPE}/../../payroll/2026.pdf`, '/payroll/2026.pdf', SCOPE, `${SCOPE}/.trek-trash/a.pdf`]) {
      const result = await provider.fetch(connection(), scope(), escape);
      expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
    }
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-054: a folder is not a document', async () => {
    route({ 'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/leg-2`, { dir: true })] }) });
    const result = await provider.fetch(connection(), scope(), `${SCOPE}/leg-2`);
    expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
  });

  it('SYNO-PROVIDER-055: a download that arrives without a body is a provider error, not an empty file', async () => {
    route({
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/a.pdf`)] }),
      'SYNO.FileStation.Download:download': reply(null, { raw: '', contentType: 'application/pdf' }),
    });
    const result = await provider.fetch(connection(), scope(), `${SCOPE}/a.pdf`);
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
  });
});

// ── push ─────────────────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: push', () => {
  it('SYNO-PROVIDER-060: sends the fields first, the file last, and the mtime in milliseconds', async () => {
    route(pushRoutes(`${SCOPE}/itinerary.pdf`));
    const result = await provider.push(connection(), scope(), push());

    expect(result).toMatchObject({
      success: true,
      data: { remoteId: `${SCOPE}/itinerary.pdf`, deduplicated: false },
    });
    const upload = callsTo('SYNO.FileStation.Upload')[0];
    expect(upload.params).toMatchObject({
      path: SCOPE,
      create_parents: 'true',
      overwrite: 'false',
      // Seconds everywhere else, milliseconds here. Getting this wrong dates
      // every uploaded file to 1970 and the next run reads it as changed.
      mtime: String(1_700_000_000 * 1000),
      'file:file': 'itinerary.pdf',
    });
    const raw = upload.raw!;
    expect(raw.indexOf('name="mtime"')).toBeLessThan(raw.indexOf('filename="itinerary.pdf"'));
    // FileStation answers 1800 to an upload without a length, so it is computed
    // rather than left to chunked encoding.
    expect(upload.headers['Content-Length']).toBe(String(raw.length));
    expect(raw.includes(BYTES)).toBe(true);
  });

  it('SYNO-PROVIDER-061: a name collision without a remoteId is a conflict, never an overwrite', async () => {
    // A namesake that appears between the check and the upload is not
    // overwritten: the upload never goes out with overwrite on for a new file,
    // and a refusal from the NAS at that point is a conflict.
    route({
      'SYNO.FileStation.List:getinfo': fail(408),
      'SYNO.FileStation.Upload:upload': fail(1805),
    });
    const result = await provider.push(connection(), scope(), push());
    expect(result).toMatchObject({ success: false, error: { code: 'conflict', detail: 'syno_code=1805' } });
    expect(callsTo('SYNO.FileStation.Upload')[0].params.overwrite).toBe('false');
  });

  it('SYNO-PROVIDER-061a: a name already taken is a conflict before a single byte is uploaded', async () => {
    // A success from the upload says nothing about a file that was already
    // there, and the size and digest checks would read it as a broken transfer
    // and upload the whole file again on every retry. So the path is asked first.
    route({ 'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/itinerary.pdf`, { size: 200 })] }) });
    const result = await provider.push(connection(), scope(), push());

    expect(result).toMatchObject({ success: false, error: { code: 'conflict' } });
    expect(result.success === false && result.error.detail).toContain(`${SCOPE}/itinerary.pdf`);
    expect(callsTo('SYNO.FileStation.Upload')).toHaveLength(0);
    expect(callsTo('SYNO.FileStation.MD5')).toHaveLength(0);
  });

  it('SYNO-PROVIDER-062: a remoteId means replace in place, and the request name is ignored', async () => {
    // The path is expected to be taken: it is the file being replaced.
    route({
      ...pushRoutes(`${SCOPE}/leg-2/hotel.pdf`),
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/leg-2/hotel.pdf`, { size: BYTES.length })] }),
    });
    const result = await provider.push(
      connection(),
      scope(),
      push({ remoteId: `${SCOPE}/leg-2/hotel.pdf`, fileName: 'something-else.pdf' }),
    );

    expect(result).toMatchObject({ success: true, data: { remoteId: `${SCOPE}/leg-2/hotel.pdf` } });
    expect(callsTo('SYNO.FileStation.Upload')[0].params).toMatchObject({
      path: `${SCOPE}/leg-2`,
      overwrite: 'true',
      'file:file': 'hotel.pdf',
    });
  });

  it('SYNO-PROVIDER-063: a remoteId outside the scope is refused before the bytes move', async () => {
    route({});
    const result = await provider.push(connection(), scope(), push({ remoteId: '/payroll/2026.pdf' }));
    expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-064: the NAS storing a different number of bytes is a checksum_mismatch', async () => {
    route(pushRoutes(`${SCOPE}/itinerary.pdf`, BYTES.length - 3));
    const result = await provider.push(connection(), scope(), push());
    expect(result).toMatchObject({ success: false, error: { code: 'checksum_mismatch' } });
  });

  it('SYNO-PROVIDER-065: the NAS computing a different digest is a checksum_mismatch', async () => {
    route(pushRoutes(`${SCOPE}/itinerary.pdf`, BYTES.length, 'deadbeefdeadbeefdeadbeefdeadbeef'));
    const result = await provider.push(connection(), scope(), push());
    expect(result).toMatchObject({ success: false, error: { code: 'checksum_mismatch' } });
  });

  it('SYNO-PROVIDER-066: the digest check is skipped for a file too big to be worth it', async () => {
    const huge = 128 * 1024 * 1024;
    route(pushRoutes(`${SCOPE}/itinerary.pdf`, huge));
    const result = await provider.push(connection(), scope(), push({ size: huge }));

    expect(result).toMatchObject({ success: true });
    expect(callsTo('SYNO.FileStation.MD5')).toHaveLength(0);
  });

  it('SYNO-PROVIDER-067: a file name DSM would reject never leaves the process', async () => {
    route({});
    const result = await provider.push(connection(), scope(), push({ fileName: 'a/b.pdf' }));
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-068: a transfer over the adapter ceiling is refused up front', async () => {
    route({});
    const result = await provider.push(connection(), scope(), push({ size: 3 * 1024 * 1024 * 1024 }));
    expect(result).toMatchObject({ success: false, error: { code: 'too_large' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-069: the stored version describes what the NAS kept, not what was sent', async () => {
    // DSM rounds the mtime to whole seconds and reports its own size; the
    // version has to come from that, or the next listing looks like a change.
    route({
      'SYNO.FileStation.Upload:upload': ok({}),
      'SYNO.FileStation.List:getinfo': sequence(
        fail(408),
        ok({ files: [entry(`${SCOPE}/itinerary.pdf`, { size: BYTES.length, mtime: 1_700_000_042 })] }),
      ),
      'SYNO.FileStation.MD5:start': ok({ taskid: 'T' }),
      'SYNO.FileStation.MD5:status': ok({ finished: true, md5: BYTES_MD5 }),
    });
    const result = await provider.push(connection(), scope(), push());
    expect(result).toMatchObject({
      success: true,
      data: {
        remoteVersion: snapshotVersion(`${SCOPE}/itinerary.pdf`, BYTES.length, 1_700_000_042),
        remoteModifiedAt: new Date(1_700_000_042 * 1000).toISOString(),
      },
    });
  });
});

// ── rename and trash ─────────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: rename and trash', () => {
  it('SYNO-PROVIDER-070: rename sends the v2 array form and answers with the new version', async () => {
    route({
      'SYNO.FileStation.Rename:rename': ok({ files: [entry(`${SCOPE}/gate-b12.pdf`, { size: 7, mtime: 1_700_000_777 })] }),
    });
    const result = await provider.rename(connection(), scope(), `${SCOPE}/a.pdf`, ' gate-b12.pdf ');

    expect(result).toMatchObject({
      success: true,
      data: { remoteVersion: snapshotVersion(`${SCOPE}/gate-b12.pdf`, 7, 1_700_000_777) },
    });
    expect(paramsOf(1)).toMatchObject({
      api: 'SYNO.FileStation.Rename',
      version: '2',
      path: `["${SCOPE}/a.pdf"]`,
      name: '["gate-b12.pdf"]',
    });
  });

  it('SYNO-PROVIDER-071: a name with a separator is refused without a request', async () => {
    route({});
    const result = await provider.rename(connection(), scope(), `${SCOPE}/a.pdf`, 'sub/dir.pdf');
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-072: trash ensures the bin, then moves with remove_src and waits for the task', async () => {
    route({
      'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
      'SYNO.FileStation.CopyMove:start': ok({ taskid: 'T-move' }),
      'SYNO.FileStation.CopyMove:status': sequence(ok({ finished: false }), ok({ finished: true })),
      'SYNO.FileStation.List:getinfo': fail(408),
    });
    const result = await provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);

    expect(result).toMatchObject({ success: true });
    expect(callsTo('SYNO.FileStation.CopyMove', 'start')[0].params).toMatchObject({
      version: '3',
      path: `["${SCOPE}/a.pdf"]`,
      dest_folder_path: `"${SCOPE}/.trek-trash"`,
      remove_src: 'true',
      overwrite: 'false',
    });
    // A CopyMove is asynchronous: returning on the start call would let the
    // caller list the folder and find the file in both places, or in neither.
    expect(callsTo('SYNO.FileStation.CopyMove', 'status')).toHaveLength(2);
    // And a finished task is not the same as a moved file: the source is asked.
    const asked = callsTo('SYNO.FileStation.List', 'getinfo');
    expect(asked).toHaveLength(1);
    expect(JSON.parse(asked[0].params.path)).toEqual([`${SCOPE}/a.pdf`]);
    expect(calls.indexOf(asked[0])).toBeGreaterThan(calls.indexOf(callsTo('SYNO.FileStation.CopyMove', 'status')[1]));
  });

  it('SYNO-PROVIDER-073: a twin already in the bin steps aside instead of being overwritten', async () => {
    route({
      'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
      'SYNO.FileStation.CopyMove:start': sequence(fail(1805), ok({ taskid: 'T-move' })),
      'SYNO.FileStation.CopyMove:status': ok({ finished: true }),
      'SYNO.FileStation.Rename:rename': ok({ files: [entry(`${SCOPE}/.trek-trash/a.123.pdf`)] }),
      'SYNO.FileStation.List:getinfo': fail(408),
    });
    const result = await provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);

    expect(result).toMatchObject({ success: true });
    const renamed = callsTo('SYNO.FileStation.Rename', 'rename')[0];
    expect(JSON.parse(renamed.params.path)).toEqual([`${SCOPE}/.trek-trash/a.pdf`]);
    expect(JSON.parse(renamed.params.name)[0]).toMatch(/^a\.\d+\.pdf$/);
    expect(callsTo('SYNO.FileStation.CopyMove', 'start')).toHaveLength(2);
  });

  it('SYNO-PROVIDER-074: nothing inside the bin can be trashed again', async () => {
    route({});
    const result = await provider.trash(connection(), scope(), `${SCOPE}/.trek-trash/a.pdf`);
    expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
    expect(calls).toHaveLength(0);
  });

  it('SYNO-PROVIDER-075: a task that finished while the file stayed put is a twin in the bin, not a done deal', async () => {
    // Nothing in a finished task says whether the file moved. The source path
    // does: still there means not moved, so the twin steps aside and the move
    // runs again, and only a source that is gone counts as binned.
    route({
      'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
      'SYNO.FileStation.CopyMove:start': ok({ taskid: 'T-move' }),
      'SYNO.FileStation.CopyMove:status': ok({ finished: true }),
      'SYNO.FileStation.List:getinfo': sequence(ok({ files: [entry(`${SCOPE}/a.pdf`)] }), fail(408)),
      'SYNO.FileStation.Rename:rename': ok({ files: [entry(`${SCOPE}/.trek-trash/a.123.pdf`)] }),
    });
    const result = await provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);

    expect(result).toMatchObject({ success: true });
    const renamed = callsTo('SYNO.FileStation.Rename', 'rename');
    expect(renamed).toHaveLength(1);
    expect(JSON.parse(renamed[0].params.path)).toEqual([`${SCOPE}/.trek-trash/a.pdf`]);
    expect(callsTo('SYNO.FileStation.CopyMove', 'start')).toHaveLength(2);
    expect(callsTo('SYNO.FileStation.List', 'getinfo')).toHaveLength(2);
  });

  it('SYNO-PROVIDER-076: a file that will not leave even after the bin made room is a conflict, not a success', async () => {
    route({
      'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
      'SYNO.FileStation.CopyMove:start': ok({ taskid: 'T-move' }),
      'SYNO.FileStation.CopyMove:status': ok({ finished: true }),
      'SYNO.FileStation.List:getinfo': ok({ files: [entry(`${SCOPE}/a.pdf`)] }),
      'SYNO.FileStation.Rename:rename': ok({ files: [entry(`${SCOPE}/.trek-trash/a.123.pdf`)] }),
    });
    const result = await provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);

    expect(result).toMatchObject({ success: false, error: { code: 'conflict' } });
    expect(callsTo('SYNO.FileStation.CopyMove', 'start')).toHaveLength(2);
    expect(callsTo('SYNO.FileStation.Rename', 'rename')).toHaveLength(1);
  });
});

// ── error classification ─────────────────────────────────────────────────────

describe('SynologyDriveDocumentProvider: how a NAS disappoints', () => {
  it('SYNO-PROVIDER-080: 408 means "password expired" on auth.cgi and "no such file" on entry.cgi', async () => {
    route({ 'SYNO.API.Auth:login': fail(408) });
    expect(await provider.resolveScope(connection(), scope())).toMatchObject({
      success: false,
      error: { code: 'unauthorized' },
    });

    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    calls = [];
    route({ 'SYNO.FileStation.List:getinfo': fail(408) });
    expect(await provider.resolveScope(connection(), scope())).toMatchObject({
      success: false,
      error: { code: 'scope_missing' },
    });
  });

  it('SYNO-PROVIDER-081: the file-operation codes map to what a user can act on', async () => {
    const expected: Array<[number, string]> = [
      [403, 'forbidden'],
      [407, 'forbidden'],
      [414, 'conflict'],
      [415, 'quota_exceeded'],
      [416, 'quota_exceeded'],
      [1804, 'too_large'],
      [105, 'forbidden'],
      [117, 'forbidden'],
    ];
    for (const [synoCode, code] of expected) {
      provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
      calls = [];
      route({ 'SYNO.FileStation.List:list': sequence(fail(synoCode), fail(synoCode)) });
      const result = await provider.list(connection(), scope());
      expect(result, `syno code ${synoCode}`).toMatchObject({ success: false, error: { code } });
    }
  });

  it('SYNO-PROVIDER-082: the SSRF guard refusing is its own code, not a network failure', async () => {
    safeFetchMock.mockImplementation(async () => {
      throw new SsrfBlockedErrorMock('Requests to loopback are not allowed');
    });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'ssrf_blocked' } });
  });

  it('SYNO-PROVIDER-083: an abort is a timeout, not an unreachable NAS', async () => {
    safeFetchMock.mockImplementation(async () => {
      const error = new Error('aborted');
      error.name = 'TimeoutError';
      throw error;
    });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'timeout' } });
  });

  it('SYNO-PROVIDER-084: a certificate a self-hoster has to trust is named as such', async () => {
    safeFetchMock.mockImplementation(async () => {
      throw new Error('fetch failed', { cause: Object.assign(new Error('self signed'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }) });
    });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'tls_untrusted' } });
  });

  it('SYNO-PROVIDER-085: a login portal answering HTML is a provider_error with a usable hint', async () => {
    route({ 'SYNO.API.Auth:login': reply(null, { raw: '<!doctype html><title>Sign in</title>', contentType: 'text/html' }) });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
    expect(result.success === false && result.error.detail).toContain('DSM');
  });

  it('SYNO-PROVIDER-086: an HTTP status from a proxy keeps the status alongside the code', async () => {
    route({ 'SYNO.API.Auth:login': reply({}, { status: 502 }) });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error', status: 502 } });
  });

  it('SYNO-PROVIDER-087: a proxy demanding its own auth is unauthorized', async () => {
    route({ 'SYNO.API.Auth:login': reply({}, { status: 401 }) });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized', status: 401 } });
  });

  it('SYNO-PROVIDER-088: the remaining HTTP statuses a NAS or its proxy answers', async () => {
    for (const [status, code] of [[403, 'forbidden'], [404, 'not_found'], [413, 'too_large'], [429, 'rate_limited']] as const) {
      provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
      calls = [];
      route({ 'SYNO.API.Auth:login': reply({}, { status }) });
      expect(await provider.probe(connection()), `http ${status}`).toMatchObject({
        success: false,
        error: { code, status },
      });
    }
  });

  it('SYNO-PROVIDER-089: a NAS that is simply not there is unreachable', async () => {
    safeFetchMock.mockImplementation(async () => {
      throw new Error('getaddrinfo ENOTFOUND nas.example.org');
    });
    const result = await provider.probe(connection());
    expect(result).toMatchObject({ success: false, error: { code: 'unreachable' } });
  });

  it('SYNO-PROVIDER-090: an upload the NAS answers with a bare HTTP error keeps the status', async () => {
    // 507 reads as a full volume, the same verdict DSM's own 415/416/1101 give.
    route({
      'SYNO.FileStation.List:getinfo': fail(408),
      'SYNO.FileStation.Upload:upload': reply({}, { status: 507 }),
    });
    expect(await provider.push(connection(), scope(), push())).toMatchObject({
      success: false,
      error: { code: 'quota_exceeded', status: 507 },
    });

    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    route({
      'SYNO.FileStation.List:getinfo': fail(408),
      'SYNO.FileStation.Upload:upload': reply({}, { status: 500 }),
    });
    expect(await provider.push(connection(), scope(), push())).toMatchObject({
      success: false,
      error: { code: 'provider_error', status: 500 },
    });
  });

  it('SYNO-PROVIDER-091: an upload answered with HTML is a provider_error, not a parse crash', async () => {
    route({
      'SYNO.FileStation.List:getinfo': fail(408),
      'SYNO.FileStation.Upload:upload': reply(null, { raw: '<html>413</html>', contentType: 'text/html' }),
    });
    const result = await provider.push(connection(), scope(), push());
    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
  });

  it('SYNO-PROVIDER-092: an empty answer where an entry was promised is not read as success', async () => {
    route({ 'SYNO.FileStation.List:getinfo': ok({ files: [] }) });
    expect(await provider.resolveScope(connection(), scope())).toMatchObject({
      success: false,
      error: { code: 'scope_missing' },
    });

    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    route({ 'SYNO.FileStation.CreateFolder:create': ok({ folders: [] }) });
    expect(await provider.createScope(connection(), 'kyoto')).toMatchObject({
      success: false,
      error: { code: 'provider_error' },
    });

    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    route({ 'SYNO.FileStation.Rename:rename': ok({ files: [] }) });
    expect(await provider.rename(connection(), scope(), `${SCOPE}/a.pdf`, 'b.pdf')).toMatchObject({
      success: false,
      error: { code: 'provider_error' },
    });

    provider = new SynologyDriveDocumentProvider(new SynologyDriveClient());
    route({
      'SYNO.FileStation.Upload:upload': ok({}),
      'SYNO.FileStation.List:getinfo': sequence(fail(408), ok({ files: [entry(`${SCOPE}/itinerary.pdf`)] })),
      'SYNO.FileStation.MD5:start': ok({}),
    });
    expect(await provider.push(connection(), scope(), push({ size: 100 }))).toMatchObject({
      success: false,
      error: { code: 'provider_error' },
    });
  });

  it('SYNO-PROVIDER-093: a move DSM answers without a task id is not waited on', async () => {
    route({
      'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
      'SYNO.FileStation.CopyMove:start': ok({}),
      'SYNO.FileStation.List:getinfo': fail(408),
    });
    const result = await provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);
    expect(result).toMatchObject({ success: true });
    expect(callsTo('SYNO.FileStation.CopyMove', 'status')).toHaveLength(0);
  });

  it('SYNO-PROVIDER-094: a task that never finishes gives up instead of polling forever', async () => {
    vi.useFakeTimers();
    try {
      route({
        'SYNO.FileStation.CreateFolder:create': ok({ folders: [entry(`${SCOPE}/.trek-trash`, { dir: true })] }),
        'SYNO.FileStation.CopyMove:start': ok({ taskid: 'T-stuck' }),
        'SYNO.FileStation.CopyMove:status': ok({ finished: false }),
      });
      const pending = provider.trash(connection(), scope(), `${SCOPE}/a.pdf`);
      await vi.advanceTimersByTimeAsync(30_000);
      expect(await pending).toMatchObject({ success: false, error: { code: 'timeout' } });
      expect(callsTo('SYNO.FileStation.CopyMove', 'status').length).toBeLessThanOrEqual(20);
    } finally {
      vi.useRealTimers();
    }
  });

  it('SYNO-PROVIDER-095: a session older than the cache window is renewed before it is used', async () => {
    vi.useFakeTimers();
    try {
      route({ 'SYNO.FileStation.List:getinfo': ok({ files: [entry(SCOPE, { dir: true })] }) });
      const conn = connection();
      await provider.resolveScope(conn, scope());
      vi.setSystemTime(Date.now() + 31 * 60 * 1000);
      await provider.resolveScope(conn, scope());
      expect(callsTo('SYNO.API.Auth', 'login')).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('SYNO-PROVIDER-096: the credential lockout lets go once its window has passed', async () => {
    vi.useFakeTimers();
    try {
      route({ 'SYNO.API.Auth:login': fail(400) });
      await provider.probe(connection());
      const afterFirst = calls.length;
      vi.setSystemTime(Date.now() + 61 * 1000);
      await provider.probe(connection());
      expect(calls.length).toBeGreaterThan(afterFirst);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── path handling ────────────────────────────────────────────────────────────

describe('synology-drive.client: paths and versions', () => {
  it('SYNO-CLIENT-090: normalises the spellings that mean the same folder', () => {
    expect(normalizeSynoPath('/trek//japan-2026/')).toBe('/trek/japan-2026');
    expect(normalizeSynoPath('  /trek/./japan-2026  ')).toBe('/trek/japan-2026');
    expect(normalizeSynoPath('/')).toBe('/');
  });

  it('SYNO-CLIENT-091: refuses what would leave the scope or confuse DSM', () => {
    // Resolving `..` rather than refusing it would produce a path that passes
    // the scope check for a folder the trip was never bound to.
    expect(normalizeSynoPath('/trek/../payroll')).toBeNull();
    expect(normalizeSynoPath('trek/japan')).toBeNull();
    expect(normalizeSynoPath('/trek/japan\\2026')).toBeNull();
    expect(normalizeSynoPath('/trek/japan\u0000.pdf')).toBeNull();
    expect(normalizeSynoPath(`/trek/${'a'.repeat(300)}`)).toBeNull();
    expect(normalizeSynoPath(`/trek/${'ab/'.repeat(200)}x`, 500)).toBeNull();
  });

  it('SYNO-CLIENT-092: a scope prefix is a path prefix, not a string prefix', () => {
    expect(isWithinScope('/trek/japan', '/trek/japan/a.pdf')).toBe(true);
    expect(isWithinScope('/trek/japan', '/trek/japan')).toBe(true);
    expect(isWithinScope('/trek/japan', '/trek/japan-2027/a.pdf')).toBe(false);
  });

  it('SYNO-CLIENT-093: the names DSM refuses are refused here', () => {
    expect(isValidSynoName('boarding.pdf')).toBe(true);
    for (const name of ['', '.', '..', 'a/b', 'a\\b', 'a:b', 'a*b', 'a?b', 'a"b', 'a<b', 'a>b', 'a|b', 'a'.repeat(256)]) {
      expect(isValidSynoName(name), name).toBe(false);
    }
  });

  it('SYNO-CLIENT-094: the version hashes a fixed field order, so it survives a new DSM field', () => {
    const version = snapshotVersion('/trek/a.pdf', 10, 1_700_000_000);
    expect(version).toBe(snapshotVersion('/trek/a.pdf', 10, 1_700_000_000));
    expect(version).not.toBe(snapshotVersion('/trek/a.pdf', 11, 1_700_000_000));
    expect(version).not.toBe(snapshotVersion('/trek/a.pdf', 10, 1_700_000_001));
    expect(version).not.toBe(snapshotVersion('/trek/b.pdf', 10, 1_700_000_000));
    // A missing field is not the same as a zero one.
    expect(snapshotVersion('/trek/a.pdf', null, null)).not.toBe(snapshotVersion('/trek/a.pdf', 0, 0));
  });

  it('SYNO-CLIENT-095: tolerates the URL spellings people paste out of a browser', () => {
    expect(normalizeBaseUrl('https://nas.example.org:5001/')).toBe('https://nas.example.org:5001');
    expect(normalizeBaseUrl('https://nas.example.org:5001/webapi')).toBe('https://nas.example.org:5001');
    expect(normalizeBaseUrl('https://nas.example.org:5001/webapi/entry.cgi')).toBe('https://nas.example.org:5001');
    expect(normalizeBaseUrl(' nas.example.org:5001 ')).toBe('https://nas.example.org:5001');
    expect(normalizeBaseUrl('http://192.168.1.9:5000/nas/')).toBe('http://192.168.1.9:5000/nas');
  });
});
