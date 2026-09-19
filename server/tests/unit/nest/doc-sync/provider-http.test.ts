/**
 * The transport the four document clients share.
 *
 * The clients' own suites pin what each product puts on the wire; this one
 * pins the pieces they all stand on, because a regression here breaks five
 * providers at once: which failures read as a timeout, a certificate or a dead
 * host, that the timeout and the self-signed switch reach the fetch, and that
 * a download can neither announce nor stream its way past its ceiling.
 *
 * Only `safeFetch` is mocked. `cappedFetch` runs for real, so releasing an
 * oversized body is the release that ships.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import {
  classifyTransportFailure,
  declaredLength,
  guardDownload,
  providerFetch,
  statusErrorCode,
  type TransportFailure,
} from '../../../../src/nest/doc-sync/providers/provider-http';

/** `TypeError: fetch failed` with the real reason underneath, the way undici reports it. */
function wrapped(cause: Error): Error {
  return new TypeError('fetch failed', { cause });
}

function coded(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

function named(message: string, name: string): Error {
  return Object.assign(new Error(message), { name });
}

class TransportError extends Error {
  constructor(readonly failure: TransportFailure) {
    super(`transport: ${failure.code}`);
  }
}

const OPTIONS = {
  timeoutMs: 5000,
  allowInsecureTls: false,
  onTransportFailure: (failure: TransportFailure) => new TransportError(failure),
};

/** A body that hands out `chunk`-sized pieces until `total` bytes, recording a cancel. */
function source(chunk: number, total: number): { stream: ReadableStream<Uint8Array>; cancelled: () => boolean } {
  let sent = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) {
        controller.close();
        return;
      }
      sent += chunk;
      controller.enqueue(new Uint8Array(chunk).fill(97));
    },
    cancel() {
      cancelled = true;
    },
  });
  return { stream, cancelled: () => cancelled };
}

function download(body: ReadableStream<Uint8Array> | null, headers: Record<string, string> = {}): Response {
  return { ok: true, status: 200, headers: new Headers(headers), body } as unknown as Response;
}

class TooLarge extends Error {
  constructor(readonly declared: number) {
    super('too large');
  }
}

const GUARD = {
  maxBytes: 4096,
  tooLarge: (declared: number) => new TooLarge(declared),
  noBody: () => new Error('no body'),
};

async function drain(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Uint8Array));
  return Buffer.concat(chunks);
}

beforeEach(() => {
  safeFetchMock.mockReset();
});

describe('classifyTransportFailure', () => {
  it('PROVIDER-HTTP-001: the SSRF guard is its own verdict and keeps its reason', () => {
    expect(classifyTransportFailure(new SsrfBlockedErrorMock('Requests to loopback are not allowed'))).toEqual({
      code: 'ssrf_blocked',
      detail: 'Requests to loopback are not allowed',
    });
  });

  it.each([
    ['TimeoutError, as AbortSignal.timeout rejects', named('The operation was aborted due to timeout', 'TimeoutError')],
    ['AbortError', named('This operation was aborted', 'AbortError')],
    ['TimeoutError under undici\'s wrapper', wrapped(named('aborted', 'TimeoutError'))],
    ['UND_ERR_HEADERS_TIMEOUT', wrapped(coded('Headers Timeout Error', 'UND_ERR_HEADERS_TIMEOUT'))],
    ['UND_ERR_BODY_TIMEOUT', wrapped(coded('Body Timeout Error', 'UND_ERR_BODY_TIMEOUT'))],
    ['ABORT_ERR', wrapped(coded('The operation was aborted', 'ABORT_ERR'))],
  ])('PROVIDER-HTTP-002: a timeout, spelled as %s', (_label, error) => {
    expect(classifyTransportFailure(error).code).toBe('timeout');
  });

  it.each([
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
    // The private-CA case: the chain is fine, the issuer is simply unknown here.
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'CERT_HAS_EXPIRED',
    'CERT_SIGNATURE_FAILURE',
    'ERR_TLS_CERT_ALTNAME_INVALID',
    'HOSTNAME_MISMATCH',
    // A leaf without serverAuth, signed by a CA this host does trust.
    'INVALID_PURPOSE',
    'INVALID_CA',
    'PATH_LENGTH_EXCEEDED',
  ])('PROVIDER-HTTP-003: %s is an untrusted certificate', (code) => {
    expect(classifyTransportFailure(wrapped(coded('certificate verdict', code))).code).toBe('tls_untrusted');
  });

  it('PROVIDER-HTTP-004: a protocol failure in the handshake is not offered as a certificate problem', () => {
    // https against a plain http port. The self-signed switch cannot fix it.
    const error = wrapped(coded('wrong version number', 'ERR_SSL_WRONG_VERSION_NUMBER'));
    expect(classifyTransportFailure(error).code).toBe('unreachable');
  });

  it('PROVIDER-HTTP-005: everything else is a host that cannot be reached, with the whole chain as detail', () => {
    const error = wrapped(coded('connect ECONNREFUSED 192.168.1.9:5001', 'ECONNREFUSED'));
    expect(classifyTransportFailure(error)).toEqual({
      code: 'unreachable',
      detail: 'fetch failed: connect ECONNREFUSED 192.168.1.9:5001',
    });
    expect(classifyTransportFailure('socket hang up')).toEqual({ code: 'unreachable', detail: 'socket hang up' });
  });

  it('PROVIDER-HTTP-006: the cause chain is followed five levels and no further', () => {
    let error: Error = coded('self-signed certificate', 'DEPTH_ZERO_SELF_SIGNED_CERT');
    for (let level = 0; level < 4; level++) error = wrapped(error);
    expect(classifyTransportFailure(error).code).toBe('tls_untrusted');
    expect(classifyTransportFailure(wrapped(error)).code).toBe('unreachable');
  });

  it('PROVIDER-HTTP-007: a host that never takes the connection is unreachable, not slow', () => {
    // undici gives up on the handshake after ten seconds, before the request's
    // own timeout does: a NAS that is switched off, or a firewall that drops the SYN.
    const error = wrapped(
      Object.assign(new Error('Connect Timeout Error'), { name: 'ConnectTimeoutError', code: 'UND_ERR_CONNECT_TIMEOUT' }),
    );
    expect(classifyTransportFailure(error).code).toBe('unreachable');
  });
});

describe('providerFetch', () => {
  it('PROVIDER-HTTP-010: hands the request to the SSRF guard with a timeout and the certificate check on', async () => {
    const answer = { ok: true, status: 200 };
    safeFetchMock.mockResolvedValue(answer);
    const body = new URLSearchParams({ a: '1' });

    const response = await providerFetch(
      'https://nas.example.org:5001/webapi/entry.cgi',
      { method: 'POST', headers: { Accept: 'application/json' }, body, duplex: 'half' } as RequestInit,
      OPTIONS,
    );

    expect(response).toBe(answer);
    const [url, init, options] = safeFetchMock.mock.calls[0] as [string, RequestInit & { duplex?: string }, unknown];
    expect(url).toBe('https://nas.example.org:5001/webapi/entry.cgi');
    expect(init).toMatchObject({ method: 'POST', headers: { Accept: 'application/json' }, body, duplex: 'half' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(options).toEqual({ rejectUnauthorized: true });
  });

  it('PROVIDER-HTTP-011: relaxes the certificate check only when the connection says so', async () => {
    safeFetchMock.mockResolvedValue({ ok: true, status: 200 });
    await providerFetch('https://nas.example.org', {}, { ...OPTIONS, allowInsecureTls: true });
    expect(safeFetchMock.mock.calls[0][2]).toEqual({ rejectUnauthorized: false });
  });

  it('PROVIDER-HTTP-012: an instance that never answers is cut off at the timeout', async () => {
    safeFetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );

    const pending = providerFetch('https://nas.example.org', {}, { ...OPTIONS, timeoutMs: 20 });

    await expect(pending).rejects.toBeInstanceOf(TransportError);
    await expect(pending).rejects.toMatchObject({ failure: { code: 'timeout' } });
  });

  it('PROVIDER-HTTP-013: a refusal becomes the client\'s own error, built from the classified failure', async () => {
    safeFetchMock.mockRejectedValue(new SsrfBlockedErrorMock('Requests to link-local addresses are not allowed'));
    const onTransportFailure = vi.fn((failure: TransportFailure) => new TransportError(failure));

    const pending = providerFetch('http://169.254.169.254/', {}, { ...OPTIONS, onTransportFailure });

    await expect(pending).rejects.toMatchObject({
      failure: { code: 'ssrf_blocked', detail: 'Requests to link-local addresses are not allowed' },
    });
    expect(onTransportFailure).toHaveBeenCalledTimes(1);
  });
});

describe('statusErrorCode', () => {
  it('PROVIDER-HTTP-020: maps the statuses every product answers alike', () => {
    const expected: Array<[number, string]> = [
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [404, 'not_found'],
      [409, 'conflict'],
      [413, 'too_large'],
      [415, 'unsupported_type'],
      [429, 'rate_limited'],
      [507, 'quota_exceeded'],
      [500, 'provider_error'],
      [418, 'provider_error'],
    ];
    for (const [status, code] of expected) expect(statusErrorCode(status), `http ${status}`).toBe(code);
  });

  it('PROVIDER-HTTP-021: a client\'s own reading of a status wins, and its fallback answers the rest', () => {
    expect(statusErrorCode(412, { 412: 'conflict' })).toBe('conflict');
    expect(statusErrorCode(404, { 404: 'scope_missing' })).toBe('scope_missing');
    expect(statusErrorCode(418, {}, 'unknown')).toBe('unknown');
    expect(statusErrorCode(401, {}, 'unknown')).toBe('unauthorized');
  });
});

describe('declaredLength', () => {
  it('PROVIDER-HTTP-030: an absent or unreadable header is an unknown size, never zero', () => {
    expect(declaredLength(null)).toBeNull();
    expect(declaredLength('')).toBeNull();
    expect(declaredLength('   ')).toBeNull();
    expect(declaredLength('many')).toBeNull();
    expect(declaredLength('-1')).toBeNull();
    expect(declaredLength('0')).toBe(0);
    expect(declaredLength('4096')).toBe(4096);
  });
});

describe('guardDownload', () => {
  it('PROVIDER-HTTP-040: streams a body within the limit and reports what it announced', async () => {
    const { stream } = source(1024, 3072);
    const guarded = guardDownload(download(stream, { 'content-length': '3072' }), GUARD);

    expect(guarded.size).toBe(3072);
    expect((await drain(guarded.body)).length).toBe(3072);
  });

  it('PROVIDER-HTTP-041: refuses an announced length over the limit before reading, and lets the socket go', () => {
    const { stream, cancelled } = source(1024, 8192);
    let thrown: unknown;
    try {
      guardDownload(download(stream, { 'content-length': '8192' }), GUARD);
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(TooLarge);
    expect((thrown as TooLarge).declared).toBe(8192);
    expect(cancelled()).toBe(true);
  });

  it('PROVIDER-HTTP-042: a body that announces nothing and runs past the limit fails mid-stream', async () => {
    const { stream, cancelled } = source(1024, 64 * 1024);
    const guarded = guardDownload(download(stream), GUARD);

    expect(guarded.size).toBeNull();
    await expect(drain(guarded.body)).rejects.toThrow(/exceeded 4096 bytes/);
    await vi.waitFor(() => expect(cancelled()).toBe(true));
  });

  it('PROVIDER-HTTP-043: a body that lies about its length is held to the limit all the same', async () => {
    const { stream } = source(1024, 64 * 1024);
    const guarded = guardDownload(download(stream, { 'content-length': '100' }), GUARD);
    await expect(drain(guarded.body)).rejects.toThrow(/exceeded/);
  });

  it('PROVIDER-HTTP-044: a consumer that stops reading releases the source', async () => {
    const { stream, cancelled } = source(1024, 64 * 1024);
    const guarded = guardDownload(download(stream), { ...GUARD, maxBytes: 1024 * 1024 });

    guarded.body.destroy();
    await vi.waitFor(() => expect(cancelled()).toBe(true));
  });

  it('PROVIDER-HTTP-045: an answer without a body is the client\'s own error', () => {
    expect(() => guardDownload(download(null, { 'content-length': '10' }), GUARD)).toThrow('no body');
  });
});
