/**
 * PapraDocumentProvider: what it puts on the wire, and what it makes of what
 * comes back.
 *
 * Papra is the provider whose answers lie the most: an upload that stores
 * nothing and restores a trashed twin instead still answers 200, a missing key
 * scope is a 401 rather than a 403, and no timestamp moves when a document
 * changes. So the cases pinned here are mostly the ones where believing the
 * obvious reading would corrupt the sync: the dedup paths, the version
 * marker, and the scope filter.
 *
 * `safeFetch` is mocked because the SSRF guard does a real DNS lookup and
 * refuses loopback outright. `cappedFetch` is NOT mocked: the responses below
 * expose `headers` and `text()`, which is what the real capped reader consumes,
 * so "the reverse proxy answered with an HTML login page" stays a genuine parse
 * failure rather than a stub returning undefined on command.
 */
import type {
  DocumentConnectionRef,
  DocumentProvider,
  DocumentScopeRef,
  PushRequest,
} from '../../../../src/nest/doc-sync/document-provider';
import {
  PAPRA_MAX_PAGES,
  PAPRA_PAGE_SIZE,
  snapshotVersion,
  tagSearchQuery,
} from '../../../../src/nest/doc-sync/providers/papra.client';
import { PapraDocumentProvider, buildScopeKey, parseScopeKey } from '../../../../src/nest/doc-sync/providers/papra.provider';
import { multipartHeader } from '../../../../src/nest/doc-sync/providers/papra.client';

import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { safeFetchMock, SsrfBlockedError } = vi.hoisted(() => ({
  safeFetchMock: vi.fn(),
  SsrfBlockedError: class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  },
}));
vi.mock('../../../../src/utils/ssrfGuard', () => ({ safeFetch: safeFetchMock, SsrfBlockedError }));

const API_KEY = 'ppapi_9f2c71aa';
const ORG = 'org_qsbvjgsjdiz5792ttr8ytmwy';
const TAG = 'tag_egz8zvs4gcesi99d00mma0f3';

const CONN: DocumentConnectionRef = {
  connectionId: 7,
  createdAt: '2026-09-01 08:00:00',
  ownerId: 3,
  baseUrl: 'https://papra.example.org',
  secrets: { api_key: API_KEY },
  settings: { organization_id: ORG },
  allowInsecureTls: false,
};

const SCOPE: DocumentScopeRef = {
  linkId: 11,
  tripId: 42,
  scopeKey: buildScopeKey(ORG, TAG),
  remoteRootId: TAG,
  remoteRootPath: '#japan-2026',
  cursor: null,
};

/** The bits of a Response the client and the capped reader touch. */
interface Reply {
  ok: boolean;
  status: number;
  headers: Headers;
  text?(): Promise<string>;
  body?: ReadableStream<Uint8Array>;
}

interface Recorded {
  url: string;
  init: RequestInit & { duplex?: string };
  options?: { rejectUnauthorized?: boolean };
}

let calls: Recorded[] = [];

function reply(opts: {
  status?: number;
  body?: unknown;
  raw?: string;
  headers?: Record<string, string>;
  stream?: Buffer;
}): Reply {
  const status = opts.status ?? 200;
  const base: Reply = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(opts.headers ?? {}),
  };
  if (opts.stream) {
    const bytes = opts.stream;
    base.body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(bytes));
        controller.close();
      },
    });
    return base;
  }
  base.text = async () => opts.raw ?? JSON.stringify(opts.body ?? {});
  return base;
}

function papraError(status: number, code: string, message = 'nope'): Reply {
  return reply({ status, body: { error: { message, code } } });
}

/** Queue answers in order; the last one repeats, which is what the paging cases want. */
function answerWith(...replies: Reply[]): void {
  const queue = [...replies];
  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      calls.push({ url, init, options });
      const next = queue.length > 1 ? queue.shift() : queue[0];
      if (!next) throw new Error('the test queued no answer');
      return next as unknown as Response;
    },
  );
}

/** Route-aware answers, for the flows that call several endpoints in one go. */
function answerByRoute(route: (method: string, url: URL, call: number) => Reply): void {
  let seen = 0;
  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      calls.push({ url, init, options });
      return route((init.method ?? 'GET').toUpperCase(), new URL(url), seen++) as unknown as Response;
    },
  );
}

function failTransport(err: unknown): void {
  safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    throw err;
  });
}

function requested(index = 0): URL {
  return new URL(calls[index].url);
}

function authHeader(index = 0): string | undefined {
  const headers = calls[index].init.headers as Record<string, string> | undefined;
  return headers?.Authorization;
}

const TAG_ROW = { id: TAG, name: 'japan-2026', color: '#4F46E5', description: null };

function doc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'doc_mm5jovmyfbe4podpho983esv',
    name: 'bordkarte.pdf',
    originalName: 'bordkarte.pdf',
    originalSize: 4096,
    originalSha256Hash: 'a'.repeat(64),
    mimeType: 'application/pdf',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    deletedAt: null,
    isDeleted: false,
    tags: [TAG_ROW],
    ...overrides,
  };
}

/** The DocResult data, or a failure naming the error the provider reported. */
function ok<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  if (!result.success) throw new Error(`expected success, got ${JSON.stringify(result.error)}`);
  return result.data as T;
}

function err(result: { success: boolean; error?: { code: string; detail?: string; status?: number } }): {
  code: string;
  detail?: string;
  status?: number;
} {
  if (result.success) throw new Error('expected a failure result');
  return result.error!;
}

let provider: PapraDocumentProvider;

beforeEach(() => {
  calls = [];
  safeFetchMock.mockReset();
  provider = new PapraDocumentProvider();
});

describe('capabilities', () => {
  it('reports what an API key may actually do, not what Papra can do', () => {
    expect(provider.capabilities(CONN)).toEqual({
      push: 'webhook-manual',
      stableId: true,
      remoteTrash: true,
      replaceInPlace: false,
      contentHashInListing: true,
      maxUploadBytes: null,
      acceptedMimeTypes: null,
      canCreateScope: true,
    });
  });

  it('is the provider id the seed row uses', () => {
    expect(provider.id).toBe('papra');
  });
});

describe('probe', () => {
  it('authenticates against the tag route and labels the connection with the organisation name', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { organizations: [{ id: ORG, name: 'TREK Lab' }] } }),
    );

    const result = ok(await provider.probe(CONN));

    expect(result.account).toBe('TREK Lab');
    expect(result.capabilities.push).toBe('webhook-manual');
    expect(requested(0).pathname).toBe(`/api/organizations/${ORG}/tags`);
    expect(authHeader(0)).toBe(`Bearer ${API_KEY}`);
  });

  it('never puts the key in the query string, where every proxy log would keep it', async () => {
    answerWith(reply({ body: { tags: [] } }), reply({ body: { organizations: [] } }));
    await provider.probe(CONN);
    for (const call of calls) expect(call.url).not.toContain(API_KEY);
  });

  it('falls back to the organisation id when the key may not read organisations', async () => {
    answerWith(reply({ body: { tags: [] } }), papraError(401, 'auth.unauthorized', 'Unauthorized'));
    expect(ok(await provider.probe(CONN)).account).toBe(ORG);
  });

  it.each([
    ['a pasted trailing slash', 'https://papra.example.org/'],
    ['a pasted /api suffix', 'https://papra.example.org/api'],
    ['a sub-path install', 'https://host.example/papra'],
  ])('normalises %s into one /api prefix', async (_label, baseUrl) => {
    answerWith(reply({ body: { tags: [] } }), reply({ body: { organizations: [] } }));
    await provider.probe({ ...CONN, baseUrl });
    expect(requested(0).pathname).not.toContain('/api/api');
    expect(requested(0).pathname).toContain('/api/organizations');
  });

  it('forwards the self-signed switch to the fetch layer and nowhere else', async () => {
    answerWith(reply({ body: { tags: [] } }), reply({ body: { organizations: [] } }));
    await provider.probe({ ...CONN, allowInsecureTls: true });
    expect(calls[0].options).toEqual({ rejectUnauthorized: false });
  });

  it('reports a missing key without touching the network', async () => {
    const result = await provider.probe({ ...CONN, secrets: {} });
    expect(err(result).code).toBe('unauthorized');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it('reports a missing organisation without touching the network', async () => {
    const result = await provider.probe({ ...CONN, settings: {} });
    expect(err(result).code).toBe('provider_error');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it('refuses an organisation id Papra could not parse, rather than reading its 400 as a lost document', async () => {
    const result = await provider.probe({ ...CONN, settings: { organization_id: 'TREK Lab' } });
    expect(err(result).code).toBe('provider_error');
    expect(err(result).detail).toContain('org_');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'auth.unauthorized', 'unauthorized'],
    [403, 'user.not_in_organization', 'forbidden'],
    [429, 'rate_limit.exceeded', 'rate_limited'],
    [500, 'server.error', 'provider_error'],
  ])('maps HTTP %i onto %s', async (status, papraCode, expected) => {
    answerWith(papraError(status, papraCode));
    expect(err(await provider.probe(CONN)).code).toBe(expected);
  });

  it('keeps the upstream wording in the detail and out of the code', async () => {
    answerWith(papraError(403, 'user.not_in_organization', 'You are not part of this organization.'));
    const failure = err(await provider.probe(CONN));
    expect(failure.code).toBe('forbidden');
    expect(failure.detail).toContain('user.not_in_organization');
    expect(failure.detail).toContain('You are not part of this organization.');
    expect(failure.status).toBe(403);
  });

  it.each([
    ['a dead host', new Error('fetch failed'), 'unreachable'],
    ['the abort timeout', Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }), 'timeout'],
    ['a blocked URL', new SsrfBlockedError('Requests to loopback are not allowed'), 'ssrf_blocked'],
  ])('maps %s onto %s', async (_label, thrown, expected) => {
    failTransport(thrown);
    expect(err(await provider.probe(CONN)).code).toBe(expected);
  });

  it('recognises a self-signed certificate through undici’s cause chain', async () => {
    failTransport(
      Object.assign(new Error('fetch failed'), {
        cause: Object.assign(new Error('self-signed certificate'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }),
      }),
    );
    expect(err(await provider.probe(CONN)).code).toBe('tls_untrusted');
  });

  it('does not read a reverse proxy’s login page as a Papra answer', async () => {
    answerWith(reply({ raw: '<!doctype html><title>Sign in</title>' }));
    const failure = err(await provider.probe(CONN));
    expect(failure.code).toBe('provider_error');
    expect(failure.detail).toContain('login page');
  });
});

describe('scopes', () => {
  it('offers every tag as a scope, keyed by organisation and tag', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW, { ...TAG_ROW, id: 'tag_other', name: 'steuer' }] } }));

    const options = ok(await provider.listScopes(CONN));

    expect(options).toEqual([
      { scopeKey: `org:${ORG}/tag:${TAG}`, label: 'japan-2026', remoteRootId: TAG, remoteRootPath: '#japan-2026' },
      { scopeKey: `org:${ORG}/tag:tag_other`, label: 'steuer', remoteRootId: 'tag_other', remoteRootPath: '#steuer' },
    ]);
  });

  it('filters the picker case-insensitively', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW, { ...TAG_ROW, id: 'tag_other', name: 'Steuer 2026' }] } }));
    const options = ok(await provider.listScopes(CONN, '  STEUER '));
    expect(options.map((option) => option.label)).toEqual(['Steuer 2026']);
  });

  it('creates a tag with the colour Papra insists on', async () => {
    answerWith(reply({ body: { tag: { ...TAG_ROW, id: 'tag_new', name: 'japan-2027' } } }));

    const option = ok(await provider.createScope(CONN, 'japan-2027'));

    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ name: 'japan-2027', color: '#4F46E5' });
    expect(option.scopeKey).toBe(`org:${ORG}/tag:tag_new`);
  });

  it('reports a name collision instead of silently binding to someone else’s tag', async () => {
    answerWith(papraError(409, 'tags.already_exists', 'Tag already exists'));
    expect(err(await provider.createScope(CONN, 'japan-2026')).code).toBe('conflict');
  });

  it('resolves the bound tag', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }));
    expect(ok(await provider.resolveScope(CONN, SCOPE)).label).toBe('japan-2026');
  });

  it('reports scope_missing once the tag is gone upstream', async () => {
    answerWith(reply({ body: { tags: [{ ...TAG_ROW, id: 'tag_someone_else' }] } }));
    expect(err(await provider.resolveScope(CONN, SCOPE)).code).toBe('scope_missing');
  });

  it('refuses a scope key from another organisation before it can read that organisation', async () => {
    const foreign = { ...SCOPE, scopeKey: buildScopeKey('org_aaaaaaaaaaaaaaaaaaaaaaaa', TAG) };
    expect(err(await provider.resolveScope(CONN, foreign)).code).toBe('scope_missing');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it.each(['fileid:437', 'tag:12', '', 'org:only'])('refuses the foreign scope key %o', async (scopeKey) => {
    expect(err(await provider.resolveScope(CONN, { ...SCOPE, scopeKey })).code).toBe('scope_missing');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });

  it('round-trips a scope key', () => {
    expect(parseScopeKey(buildScopeKey(ORG, TAG))).toEqual({ organizationId: ORG, tagId: TAG });
  });
});

describe('list', () => {
  it('asks for the tag with the quoted grammar and maps what comes back', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [doc()], documentsCount: 1 } }));

    const result = ok(await provider.list(CONN, SCOPE));

    const query = requested(1).searchParams;
    expect(query.get('searchQuery')).toBe('tag:"japan-2026"');
    expect(query.get('pageIndex')).toBe('0');
    expect(query.get('pageSize')).toBe(String(PAPRA_PAGE_SIZE));
    expect(query.get('sortField')).toBe('createdAt');
    expect(query.get('sortOrder')).toBe('asc');

    expect(result.documents).toEqual([
      {
        remoteId: 'doc_mm5jovmyfbe4podpho983esv',
        name: 'bordkarte.pdf',
        size: 4096,
        mimeType: 'application/pdf',
        remoteVersion: expect.stringMatching(/^[0-9a-f]{64}$/),
        contentHash: 'a'.repeat(64),
        remoteModifiedAt: '2026-09-01T10:00:00.000Z',
        isDeleted: false,
      },
    ]);
    expect(result.truncated).toBe(false);
  });

  it('enumerates the whole organisation when the tag name cannot be expressed in the grammar', async () => {
    const quoted = { ...TAG_ROW, name: 'say "hi" trip' };
    answerWith(
      reply({ body: { tags: [quoted] } }),
      reply({ body: { documents: [doc(), doc({ id: 'doc_other', tags: [] })], documentsCount: 2 } }),
    );

    const result = ok(await provider.list(CONN, SCOPE));

    expect(tagSearchQuery('say "hi" trip')).toBeNull();
    expect(requested(1).searchParams.get('searchQuery')).toBeNull();
    expect(result.documents.map((document) => document.remoteId)).toEqual(['doc_mm5jovmyfbe4podpho983esv']);
  });

  it('drops a document the search returned that does not carry the bound tag', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({
        body: {
          documents: [doc(), doc({ id: 'doc_stale', tags: [{ ...TAG_ROW, id: 'tag_other' }] })],
          documentsCount: 2,
        },
      }),
    );
    const result = ok(await provider.list(CONN, SCOPE));
    expect(result.documents).toHaveLength(1);
  });

  it('keeps a document that states no tags at all when the server did the filtering', async () => {
    const { tags: _tags, ...withoutTags } = doc();
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [withoutTags], documentsCount: 1 } }));
    expect(ok(await provider.list(CONN, SCOPE)).documents).toHaveLength(1);
  });

  it('walks every page, in order, and stops on the short one', async () => {
    const page0 = Array.from({ length: PAPRA_PAGE_SIZE }, (_unused, index) => doc({ id: `doc_a${index}` }));
    const page1 = [doc({ id: 'doc_b0' })];
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { documents: page0, documentsCount: PAPRA_PAGE_SIZE + 1 } }),
      reply({ body: { documents: page1, documentsCount: PAPRA_PAGE_SIZE + 1 } }),
    );

    const result = ok(await provider.list(CONN, SCOPE));

    expect(result.documents).toHaveLength(PAPRA_PAGE_SIZE + 1);
    expect(requested(1).searchParams.get('pageIndex')).toBe('0');
    expect(requested(2).searchParams.get('pageIndex')).toBe('1');
    expect(calls).toHaveLength(3);
  });

  it('stops once the reported total is in, even when the last page is full', async () => {
    const full = Array.from({ length: PAPRA_PAGE_SIZE }, (_unused, index) => doc({ id: `doc_a${index}` }));
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { documents: full, documentsCount: PAPRA_PAGE_SIZE } }),
    );
    expect(ok(await provider.list(CONN, SCOPE)).documents).toHaveLength(PAPRA_PAGE_SIZE);
    expect(calls).toHaveLength(2);
  });

  it('says so rather than letting a capped walk pose as the whole tag', async () => {
    const full = Array.from({ length: PAPRA_PAGE_SIZE }, (_unused, index) => doc({ id: `doc_a${index}` }));
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: full, documentsCount: 999999 } }));

    const result = ok(await provider.list(CONN, SCOPE));

    expect(result.truncated).toBe(true);
    expect(result.cursor).toBeNull();
    expect(result.cursorUnchanged).toBe(false);
    expect(calls).toHaveLength(1 + PAPRA_MAX_PAGES);
  });

  it('answers cursorUnchanged when the tag holds exactly what it held last time', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [doc()], documentsCount: 1 } }));
    const first = ok(await provider.list(CONN, SCOPE));

    calls = [];
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [doc()], documentsCount: 1 } }));
    const second = ok(await provider.list(CONN, { ...SCOPE, cursor: first.cursor }));

    expect(second.cursor).toBe(first.cursor);
    expect(second.cursorUnchanged).toBe(true);
  });

  it('moves the cursor on a rename, which is the change no Papra timestamp records', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [doc()], documentsCount: 1 } }));
    const first = ok(await provider.list(CONN, SCOPE));

    calls = [];
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { documents: [doc({ name: 'bordkarte-neu.pdf' })], documentsCount: 1 } }),
    );
    const second = ok(await provider.list(CONN, { ...SCOPE, cursor: first.cursor }));

    expect(second.cursorUnchanged).toBe(false);
    expect(second.cursor).not.toBe(first.cursor);
  });

  it('moves the cursor on a deletion, which a changed-since query could never see', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { documents: [doc(), doc({ id: 'doc_two' })], documentsCount: 2 } }),
    );
    const first = ok(await provider.list(CONN, SCOPE));

    calls = [];
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [doc()], documentsCount: 1 } }));
    const second = ok(await provider.list(CONN, { ...SCOPE, cursor: first.cursor }));

    expect(second.cursorUnchanged).toBe(false);
  });

  it('reports scope_missing rather than an empty tag when the tag itself is gone', async () => {
    answerWith(reply({ body: { tags: [] } }));
    expect(err(await provider.list(CONN, SCOPE)).code).toBe('scope_missing');
  });
});

describe('fetch', () => {
  it('streams the bytes and takes the MIME type from the record, not from the transfer', async () => {
    answerWith(
      reply({ body: { document: doc() } }),
      reply({
        stream: Buffer.from('bordkarte bytes'),
        headers: { 'content-length': '15', 'content-type': 'application/octet-stream' },
      }),
    );

    const result = ok(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv'));
    const chunks: Buffer[] = [];
    for await (const chunk of result.body) chunks.push(Buffer.from(chunk));

    expect(Buffer.concat(chunks).toString()).toBe('bordkarte bytes');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.size).toBe(15);
    expect(result.remoteVersion).toBe(
      snapshotVersion({
        id: 'doc_mm5jovmyfbe4podpho983esv',
        name: 'bordkarte.pdf',
        originalName: 'bordkarte.pdf',
        originalSize: 4096,
        originalSha256Hash: 'a'.repeat(64),
        mimeType: 'application/pdf',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z',
        deletedAt: null,
        isDeleted: false,
        tags: null,
      }),
    );
    expect(requested(1).pathname.endsWith('/file')).toBe(true);
  });

  it('reads a download without a length as the size the record lists, not as an empty file', async () => {
    answerWith(reply({ body: { document: doc() } }), reply({ stream: Buffer.from('bordkarte bytes') }));
    expect(ok(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv')).size).toBe(4096);
  });

  it('refuses a body the instance declares as larger than TREK will transfer', async () => {
    answerWith(
      reply({ body: { document: doc() } }),
      reply({ stream: Buffer.from('x'), headers: { 'content-length': String(1024 ** 4) } }),
    );
    expect(err(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv')).code).toBe('too_large');
  });

  it('maps a deleted document onto not_found', async () => {
    answerWith(papraError(404, 'document.not_found', 'Document not found.'));
    expect(err(await provider.fetch(CONN, SCOPE, 'doc_gone')).code).toBe('not_found');
  });

  it('maps an id Papra refuses to parse onto not_found rather than a provider fault', async () => {
    answerWith(papraError(400, 'server.invalid_request.params', 'Invalid URL parameters'));
    expect(err(await provider.fetch(CONN, SCOPE, 'not-a-doc-id')).code).toBe('not_found');
  });
});

describe('push', () => {
  const BYTES = Buffer.from('a boarding pass');

  function pushRequest(overrides: Partial<PushRequest> = {}): PushRequest {
    return {
      body: Readable.from([BYTES]),
      fileName: 'Reisepass Übersicht.pdf',
      mimeType: 'application/pdf',
      size: BYTES.length,
      sha256: crypto.createHash('sha256').update(BYTES).digest('hex'),
      mtimeSeconds: 1789000000,
      trekDocUid: 'trek-doc-1',
      trekTripUid: 'trek-trip-42',
      ...overrides,
    };
  }

  /** The multipart body the client streamed, as bytes. */
  async function sentBody(index: number): Promise<Buffer> {
    const body = calls[index].init.body as unknown as ReadableStream<Uint8Array>;
    const chunks: Buffer[] = [];
    for await (const chunk of Readable.fromWeb(body)) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  /**
   * What a real instance sends when it creates the document during the request:
   * a `Date` in the same second, which an HTTP-date truncates down to.
   */
  function freshHeaders(createdAt: string): Record<string, string> {
    return { date: new Date(Date.parse(createdAt)).toUTCString() };
  }

  it('uploads one file field, then tags it, and reports a fresh document', async () => {
    const created = '2026-09-18T15:27:04.049Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { document: doc({ createdAt: created, updatedAt: created }) }, headers: freshHeaders(created) }),
      reply({ status: 204 }),
    );

    const result = ok(await provider.push(CONN, SCOPE, pushRequest()));

    expect(result.deduplicated).toBe(false);
    expect(result.remoteId).toBe('doc_mm5jovmyfbe4podpho983esv');
    expect(requested(2).pathname).toBe(`/api/organizations/${ORG}/documents/doc_mm5jovmyfbe4podpho983esv/tags`);
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ tagId: TAG });
  });

  it('frames the multipart body itself, with the filename as UTF-8 bytes', async () => {
    const created = '2026-09-18T15:27:04.049Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { document: doc({ createdAt: created }) }, headers: freshHeaders(created) }),
      reply({ status: 204 }),
    );

    await provider.push(CONN, SCOPE, pushRequest());

    const headers = calls[1].init.headers as Record<string, string>;
    const boundary = /boundary=(.+)$/.exec(headers['Content-Type'])?.[1];
    expect(boundary).toBeTruthy();
    expect(calls[1].init.duplex).toBe('half');

    const body = await sentBody(1);
    expect(body.toString('utf8')).toContain(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Reisepass Übersicht.pdf"`,
    );
    expect(body.toString('utf8')).toContain('Content-Type: application/pdf\r\n\r\n');
    expect(body.includes(BYTES)).toBe(true);
    expect(body.toString('utf8').endsWith(`\r\n--${boundary}--\r\n`)).toBe(true);
  });

  it('escapes the three characters a multipart filename cannot carry', async () => {
    const created = '2026-09-18T15:27:04.049Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { document: doc({ createdAt: created }) }, headers: freshHeaders(created) }),
      reply({ status: 204 }),
    );

    await provider.push(CONN, SCOPE, pushRequest({ fileName: 'a"b\r\nc.pdf' }));

    expect((await sentBody(1)).toString('utf8')).toContain('filename="a%22b%0D%0Ac.pdf"');
  });

  it('resolves a 409 duplicate onto the document Papra already holds', async () => {
    const twin = doc({
      id: 'doc_twin',
      name: 'anderer-name.pdf',
      originalSha256Hash: crypto.createHash('sha256').update(BYTES).digest('hex'),
    });
    answerByRoute((method, url, index) => {
      if (index === 0) return reply({ body: { tags: [TAG_ROW] } });
      if (method === 'POST' && url.pathname.endsWith('/documents')) {
        return papraError(409, 'document.already_exists', 'Document already exists.');
      }
      if (method === 'GET') return reply({ body: { documents: [twin], documentsCount: 1 } });
      return reply({ status: 204 });
    });

    const result = ok(await provider.push(CONN, SCOPE, pushRequest()));

    expect(result.remoteId).toBe('doc_twin');
    expect(result.deduplicated).toBe(true);
    // The name is the cheap first guess, and it is only a guess: the hash decides.
    expect(requested(2).searchParams.get('searchQuery')).toBe('Reisepass Übersicht.pdf');
  });

  it('widens to the whole organisation when the twin was stored under another name', async () => {
    const twin = doc({ id: 'doc_twin', originalSha256Hash: crypto.createHash('sha256').update(BYTES).digest('hex') });
    let getCount = 0;
    answerByRoute((method, url, index) => {
      if (index === 0) return reply({ body: { tags: [TAG_ROW] } });
      if (method === 'POST' && url.pathname.endsWith('/documents')) {
        return papraError(409, 'document.already_exists', 'Document already exists.');
      }
      if (method === 'GET') {
        getCount++;
        return getCount === 1
          ? reply({ body: { documents: [], documentsCount: 0 } })
          : reply({ body: { documents: [twin], documentsCount: 1 } });
      }
      return reply({ status: 204 });
    });

    const result = ok(await provider.push(CONN, SCOPE, pushRequest()));

    expect(result.remoteId).toBe('doc_twin');
    expect(result.deduplicated).toBe(true);
    expect(requested(3).searchParams.get('searchQuery')).toBeNull();
  });

  it('looks in the trash last, and does not pair a document whose hash is merely similar', async () => {
    const trashed = doc({
      id: 'doc_trashed',
      isDeleted: true,
      originalSha256Hash: crypto.createHash('sha256').update(BYTES).digest('hex'),
    });
    let getCount = 0;
    answerByRoute((method, url, index) => {
      if (index === 0) return reply({ body: { tags: [TAG_ROW] } });
      if (method === 'POST' && url.pathname.endsWith('/documents')) {
        return papraError(409, 'document.already_exists', 'Document already exists.');
      }
      if (method === 'GET') {
        getCount++;
        if (getCount <= 2)
          return reply({ body: { documents: [doc({ originalSha256Hash: 'b'.repeat(64) })], documentsCount: 1 } });
        return reply({ body: { documents: [trashed], documentsCount: 1 } });
      }
      return reply({ status: 204 });
    });

    const result = ok(await provider.push(CONN, SCOPE, pushRequest()));

    expect(result.remoteId).toBe('doc_trashed');
    // The trash route rejects a sort or a search with a 400, so neither is sent.
    const trashCall = calls.find((call) => call.url.includes('/documents/deleted'));
    expect(trashCall).toBeTruthy();
    expect(new URL(trashCall!.url).searchParams.get('sortField')).toBeNull();
    expect(new URL(trashCall!.url).searchParams.get('searchQuery')).toBeNull();
  });

  it('reports a conflict rather than guessing when the duplicate cannot be found', async () => {
    answerByRoute((method, url, index) => {
      if (index === 0) return reply({ body: { tags: [TAG_ROW] } });
      if (method === 'POST' && url.pathname.endsWith('/documents')) {
        return papraError(409, 'document.already_exists', 'Document already exists.');
      }
      return reply({ body: { documents: [], documentsCount: 0 } });
    });

    expect(err(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('conflict');
  });

  it('recognises a restored twin: a 200 whose createdAt predates the request', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({
        body: { document: doc({ createdAt: '2026-09-01T10:00:00.000Z' }) },
        headers: { date: new Date('2026-09-18T15:27:04.000Z').toUTCString() },
      }),
      reply({ status: 204 }),
    );

    expect(ok(await provider.push(CONN, SCOPE, pushRequest())).deduplicated).toBe(true);
  });

  it('is not fooled into a false dedup by an instance whose clock runs hours behind', async () => {
    // The document was created during this request; only the instance's idea of
    // "now" is wrong, and the test compares a duration rather than two clocks.
    const created = '2026-09-18T09:00:00.000Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({
        body: { document: doc({ createdAt: created }) },
        headers: { date: new Date(Date.parse(created) + 200).toUTCString() },
      }),
      reply({ status: 204 }),
    );

    expect(ok(await provider.push(CONN, SCOPE, pushRequest())).deduplicated).toBe(false);
  });

  it('falls back to the local clock when the instance sends no Date header', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { document: doc({ createdAt: '2026-09-01T10:00:00.000Z' }) } }),
      reply({ status: 204 }),
    );
    expect(ok(await provider.push(CONN, SCOPE, pushRequest())).deduplicated).toBe(true);
  });

  it('treats a tag that is already on the document as the state it wanted', async () => {
    const created = '2026-09-18T15:27:04.049Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { document: doc({ createdAt: created }) }, headers: freshHeaders(created) }),
      papraError(409, 'documents.already_has_tag', 'Document already has tag'),
    );

    expect(ok(await provider.push(CONN, SCOPE, pushRequest())).deduplicated).toBe(false);
  });

  it('reports scope_missing when the tag vanished between binding and push', async () => {
    answerWith(reply({ body: { tags: [] } }));
    expect(err(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('scope_missing');
  });

  it('maps a 413 onto too_large, so the file list can say why', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      papraError(413, 'document.size_too_large', 'Document size too large.'),
    );
    expect(err(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('too_large');
  });

  it('refuses a replace instead of quietly storing a second copy', async () => {
    const result = await provider.push(CONN, SCOPE, pushRequest({ remoteId: 'doc_existing' }));
    expect(err(result).code).toBe('provider_error');
    expect(err(result).detail).toContain('replaceInPlace');
    expect(safeFetchMock).not.toHaveBeenCalled();
  });
});

describe('rename and trash', () => {
  it('renames through PATCH and hands back a version that moved', async () => {
    const before = snapshotVersion({
      id: 'doc_mm5jovmyfbe4podpho983esv',
      name: 'bordkarte.pdf',
      originalName: 'bordkarte.pdf',
      originalSize: 4096,
      originalSha256Hash: 'a'.repeat(64),
      mimeType: 'application/pdf',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
      deletedAt: null,
      isDeleted: false,
      tags: null,
    });
    answerWith(reply({ body: { document: doc({ name: 'bordkarte-neu.pdf' }) } }));

    const result = ok(await provider.rename(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv', 'bordkarte-neu.pdf'));

    expect(calls[0].init.method).toBe('PATCH');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ name: 'bordkarte-neu.pdf' });
    expect(result.remoteVersion).not.toBe(before);
  });

  it('trashes rather than deleting, because permanent deletion is closed to a key', async () => {
    answerWith(reply({ body: { success: true } }));

    const result = await provider.trash(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv');

    expect(result.success).toBe(true);
    expect(calls[0].init.method).toBe('DELETE');
    expect(requested(0).search).toBe('');
  });

  it('reports an unknown document as not_found instead of a silent success', async () => {
    answerWith(papraError(404, 'document.not_found', 'Document not found.'));
    expect(err(await provider.trash(CONN, SCOPE, 'doc_gone')).code).toBe('not_found');
  });
});

describe('the webhook seam', () => {
  it('offers no self-registration, because Papra closes that API to keys', () => {
    const asInterface: DocumentProvider = provider;
    expect(asInterface.registerWebhook).toBeUndefined();
    expect(asInterface.unregisterWebhook).toBeUndefined();
    expect(asInterface.capabilities(CONN).push).toBe('webhook-manual');
  });
});

/** A push request with the bytes and anchors the core would hand over. */
function anyPush(overrides: Partial<PushRequest> = {}): PushRequest {
  return {
    body: Readable.from([Buffer.from('x')]),
    fileName: 'x.txt',
    mimeType: 'text/plain',
    size: 1,
    sha256: 'b'.repeat(64),
    mtimeSeconds: 1789000000,
    trekDocUid: 'trek-doc-1',
    trekTripUid: 'trek-trip-42',
    ...overrides,
  };
}

describe('answers that are not shaped like Papra answers', () => {
  it('skips a listing entry that is not a document rather than failing the whole walk', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW, 'not-a-tag', { id: 'tag_nameless' }] } }),
      reply({ body: { documents: [doc(), null, 'nonsense', { name: 'no id' }], documentsCount: 4 } }),
    );

    expect(ok(await provider.list(CONN, SCOPE)).documents).toHaveLength(1);
  });

  it('keeps a document whose tag entries are unreadable out of the scope', async () => {
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({ body: { documents: [doc({ tags: ['nope'] })], documentsCount: 1 } }),
    );
    expect(ok(await provider.list(CONN, SCOPE)).documents).toHaveLength(0);
  });

  it('falls back to the original name when a document arrives without one', async () => {
    const { name: _name, ...nameless } = doc();
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documents: [nameless], documentsCount: 1 } }));
    expect(ok(await provider.list(CONN, SCOPE)).documents[0].name).toBe('bordkarte.pdf');
  });

  it('treats a missing documents array as an empty page rather than a crash', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { documentsCount: 0 } }));
    expect(ok(await provider.list(CONN, SCOPE)).documents).toEqual([]);
  });

  it('reports a created tag Papra did not describe', async () => {
    answerWith(reply({ body: { created: true } }));
    expect(err(await provider.createScope(CONN, 'japan-2027')).code).toBe('provider_error');
  });

  it('reports a document read that came back without a document', async () => {
    answerWith(reply({ body: {} }));
    expect(err(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv')).code).toBe('provider_error');
  });

  it('reports an upload Papra accepted without saying what it stored', async () => {
    answerWith(reply({ body: { tags: [TAG_ROW] } }), reply({ body: { ok: true } }));
    expect(err(await provider.push(CONN, SCOPE, anyPush())).code).toBe('provider_error');
  });

  it('reports a rename Papra acknowledged without describing', async () => {
    answerWith(reply({ body: {} }));
    expect(err(await provider.rename(CONN, SCOPE, 'doc_x', 'neu.pdf')).code).toBe('provider_error');
  });

  it('turns an error nobody modelled into `unknown` instead of leaking a stack', async () => {
    // A fault past the transport, where the client has no branch for it: the
    // body itself blows up while being read.
    answerWith({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => {
        throw new TypeError('Cannot read properties of undefined');
      },
    });
    const failure = err(await provider.probe(CONN));
    expect(failure.code).toBe('unknown');
    expect(failure.detail).toContain('Cannot read properties of undefined');
  });
});

describe('the download stream', () => {
  it('destroys a body that keeps growing past the transfer ceiling', async () => {
    let sent = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 4 * 1024 * 1024;
        controller.enqueue(new Uint8Array(4 * 1024 * 1024));
        if (sent > 600 * 1024 * 1024) controller.close();
      },
    });
    answerWith(reply({ body: { document: doc() } }), {
      ok: true,
      status: 200,
      headers: new Headers(),
      body: endless,
    });

    const result = ok(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv'));

    await expect(
      (async () => {
        for await (const _chunk of result.body) {
          /* drain until the cap trips */
        }
      })(),
    ).rejects.toThrow(/exceeded/);
  });

  it('reports a file route that answered with no body at all', async () => {
    answerWith(reply({ body: { document: doc() } }), { ok: true, status: 200, headers: new Headers() });
    expect(err(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv')).code).toBe('provider_error');
  });

  it('reports an instance that dies mid-download as unreachable', async () => {
    let call = 0;
    safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (call++ === 0) return reply({ body: { document: doc() } }) as unknown as Response;
      throw new Error('socket hang up');
    });
    expect(err(await provider.fetch(CONN, SCOPE, 'doc_mm5jovmyfbe4podpho983esv')).code).toBe('unreachable');
  });

  it('reports an upload that never reached the instance as unreachable', async () => {
    let call = 0;
    safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (call++ === 0) return reply({ body: { tags: [TAG_ROW] } }) as unknown as Response;
      throw new Error('socket hang up');
    });
    expect(err(await provider.push(CONN, SCOPE, anyPush())).code).toBe('unreachable');
  });

  it('lets a tagging failure that is not a duplicate through', async () => {
    const created = '2026-09-18T15:27:04.049Z';
    answerWith(
      reply({ body: { tags: [TAG_ROW] } }),
      reply({
        body: { document: doc({ createdAt: created }) },
        headers: { date: new Date(Date.parse(created)).toUTCString() },
      }),
      papraError(404, 'tags.not_found', 'Tag not found'),
    );
    expect(err(await provider.push(CONN, SCOPE, anyPush())).code).toBe('scope_missing');
  });
});

describe('the version marker', () => {
  const base = {
    id: 'doc_a',
    name: 'a.pdf',
    originalName: 'a.pdf',
    originalSize: 1,
    originalSha256Hash: 'a'.repeat(64),
    mimeType: 'application/pdf',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    deletedAt: null,
    isDeleted: false,
    tags: null,
  };

  it('is stable for the same document and moves for every field it covers', () => {
    expect(snapshotVersion(base)).toBe(snapshotVersion({ ...base }));
    expect(snapshotVersion({ ...base, name: 'b.pdf' })).not.toBe(snapshotVersion(base));
    expect(snapshotVersion({ ...base, originalSha256Hash: 'b'.repeat(64) })).not.toBe(snapshotVersion(base));
    expect(snapshotVersion({ ...base, updatedAt: '2026-09-02T10:00:00.000Z' })).not.toBe(snapshotVersion(base));
  });

  it('ignores the fields that drift on their own', () => {
    // A re-sniffed MIME type or a size Papra reports differently must not read
    // as a changed document, or every sync would re-pull the whole tag.
    expect(snapshotVersion({ ...base, mimeType: 'text/plain', originalSize: 999 })).toBe(snapshotVersion(base));
  });

  it('survives a missing hash and a missing timestamp', () => {
    const sparse = { ...base, originalSha256Hash: null, updatedAt: null, createdAt: null, originalName: null };
    expect(snapshotVersion(sparse)).toMatch(/^[0-9a-f]{64}$/);
  });
});

/**
 * The media type goes into a header, so it has to survive being one.
 *
 * It comes from `trip_files.mime_type` (influenced by an upload) and went in
 * untouched while the filename beside it was escaped. A CR or LF ends the
 * header early and lets what follows be read as headers of its own.
 */
describe('multipart part header', () => {
  it('keeps an ordinary media type', () => {
    expect(multipartHeader('B', 'a.pdf', 'application/pdf').toString())
      .toContain('Content-Type: application/pdf');
  });

  it('refuses one carrying a newline instead of writing it into the header', () => {
    const header = multipartHeader('B', 'a.pdf', 'application/pdf\r\nX-Evil: 1').toString();
    expect(header).not.toContain('X-Evil');
    expect(header).toContain('Content-Type: application/octet-stream');
  });

  it('falls back for anything that is not a media type at all', () => {
    for (const bad of ['', 'nonsense', 'a/b/c', 'a b/c']) {
      expect(multipartHeader('B', 'a.pdf', bad).toString())
        .toContain('Content-Type: application/octet-stream');
    }
  });
});
