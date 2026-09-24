/**
 * The Paperless-ngx adapter: PAPERLESS-001..095.
 *
 * Two things are pinned here. What the client puts on the wire: the pinned API
 * version (an unpinned Accept header is how the `checksum` field silently moved
 * out of the document serializer between two `docker pull`s), the token header,
 * the `original=true` on every download, and the one JSON object the custom
 * fields have to arrive in. And what the adapter makes of the answers: the
 * error code for each way a self-hosted instance disappoints, the newest
 * revision's hash rather than the root one, and the document id surviving a
 * replace although the consume task names a different one.
 *
 * `safeFetch` and the capped readers are mocked: the SSRF guard does a real DNS
 * lookup and the reader wants a real stream. The readCappedJson stub still
 * parses the bytes it is handed, so "Paperless answered an HTML login page"
 * stays a genuine parse failure instead of a mock returning undefined on
 * command. The behaviour asserted here was measured against a live
 * Paperless-ngx 3.1.3 first; see BEFUND-paperless.md in the test lab.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';

const {
  safeFetchMock,
  readCappedJsonMock,
  readCappedTextMock,
  discardBodyMock,
  FakeSsrfBlockedError,
} = vi.hoisted(() => {
  // Declared inside the hoisted block: a class at module level is not hoisted
  // with the vi.mock factory and would be read before it exists.
  class FakeSsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  }
  return {
    safeFetchMock: vi.fn(),
    readCappedJsonMock: vi.fn(),
    readCappedTextMock: vi.fn(),
    discardBodyMock: vi.fn(),
    FakeSsrfBlockedError,
  };
});

vi.mock('../../../../src/utils/ssrfGuard', () => ({
  safeFetch: safeFetchMock,
  SsrfBlockedError: FakeSsrfBlockedError,
}));
vi.mock('../../../../src/utils/cappedFetch', () => ({
  readCappedJson: readCappedJsonMock,
  readCappedText: readCappedTextMock,
  discardBody: discardBodyMock,
}));

import {
  PaperlessClient,
  PaperlessError,
  apiBase,
  buildMultipart,
  currentVersion,
  sha256OrNull,
  DOCUMENT_PAGE_SIZE,
} from '../../../../src/nest/doc-sync/providers/paperless.client';
import {
  PaperlessDocumentProvider,
  PAPERLESS_TITLE_MAX_LENGTH,
  PAPERLESS_WEBHOOK_SECRET_HEADER,
  TRIP_UID_FIELD_NAME,
  documentFileName,
  normalizeMime,
  parseScopeKey,
  titleFromFileName,
} from '../../../../src/nest/doc-sync/providers/paperless.provider';
import { PROVIDER_MAX_PAGES } from '../../../../src/nest/doc-sync/doc-sync.constants';
import type {
  DocResult,
  DocumentConnectionRef,
  DocumentScopeRef,
  PushRequest,
} from '../../../../src/nest/doc-sync/document-provider';
import { docFailed } from '../../../../src/nest/doc-sync/document-provider';

const TOKEN = 'ba17f0c4d2e94f118a6c0d3b7e5a9c21f4d6b8e0';
const BASE = 'https://papers.example.org';

const CONN: DocumentConnectionRef = {
  connectionId: 4,
  createdAt: '2026-09-01 08:00:00',
  ownerId: 9,
  baseUrl: BASE,
  secrets: { api_token: TOKEN },
  settings: {},
  allowInsecureTls: false,
};

const SCOPE: DocumentScopeRef = {
  linkId: 7,
  tripId: 42,
  scopeKey: 'tag:3',
  remoteRootId: '3',
  remoteRootPath: '/documents?tags__id__all=3',
  cursor: null,
};

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

interface Reply {
  ok: boolean;
  status: number;
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
}

interface Recorded {
  url: URL;
  init: RequestInit;
  options?: { rejectUnauthorized?: boolean };
  body: string;
}

let calls: Recorded[] = [];
let routes: Map<string, Reply[]>;

function reply(body: unknown, status = 200, headers: Record<string, string> = {}): Reply {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    body: null,
    text: async () => raw,
  };
}

/** A streaming answer, for the download path. */
function streamReply(bytes: string, headers: Record<string, string> = {}): Reply {
  return {
    ok: true,
    status: 200,
    headers: new Headers(headers),
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(bytes));
        controller.close();
      },
    }),
    text: async () => bytes,
  };
}

/**
 * Stub one route. Several replies are consumed in order and the last one
 * repeats, which is what the pagination cases want.
 */
function on(route: string, ...replies: Reply[]): void {
  routes.set(route, replies);
}

function requests(route: string): Recorded[] {
  return calls.filter((call) => `${(call.init.method ?? 'GET').toUpperCase()} ${call.url.pathname}` === route);
}

function lastRequest(route: string): Recorded {
  const matching = requests(route);
  const last = matching[matching.length - 1];
  if (last === undefined) throw new Error(`no request was made to ${route}`);
  return last;
}

function headerOf(call: Recorded, name: string): string | undefined {
  const headers = call.init.headers as Record<string, string> | undefined;
  return headers?.[name];
}

function tagRow(id: number, name: string, documentCount = 0): unknown {
  return { id, name, slug: name, color: '#a6cee3', document_count: documentCount, owner: 2 };
}

function docRow(over: Record<string, unknown> = {}): unknown {
  return {
    id: 11,
    title: 'Hotelrechnung Kyoto',
    tags: [3],
    mime_type: 'application/pdf',
    original_file_name: 'rechnung.pdf',
    modified: '2026-09-18T17:30:00.000000+02:00',
    added: '2026-09-18T17:29:00.000000+02:00',
    deleted_at: null,
    custom_fields: [{ field: 1, value: 'trip-uid-42' }],
    versions: [{ id: 11, checksum: HASH_A, added: '2026-09-18T15:29:00.000000Z', is_root: true }],
    ...over,
  };
}

function page(results: unknown[], next: string | null = null, count?: number): unknown {
  return { count: count ?? results.length, next, previous: null, results };
}

function taskRow(over: Record<string, unknown> = {}): unknown {
  return {
    id: 3,
    task_id: 'task-uuid-1',
    status: 'success',
    result_data: { document_id: 11 },
    related_document_ids: [11],
    ...over,
  };
}

function pushRequest(over: Partial<PushRequest> = {}): PushRequest {
  const bytes = Buffer.from('%PDF-1.4 hotel\n');
  return {
    body: Readable.from(bytes),
    fileName: 'rechnung.pdf',
    mimeType: 'application/pdf',
    size: bytes.length,
    sha256: HASH_A,
    mtimeSeconds: 1_789_000_000,
    trekDocUid: 'doc-uid-1',
    trekTripUid: 'trip-uid-42',
    ...over,
  };
}

// `!result.success` does not narrow: the server workspace compiles with
// `strict: false`, so a boolean discriminant stops discriminating. docFailed is
// the predicate the production code uses for the same reason.
function expectFail(result: DocResult<unknown>): { code: string; detail?: string; status?: number } {
  if (!docFailed(result)) throw new Error('expected a failure, got success');
  return result.error;
}

function expectOk<T>(result: DocResult<T>): T {
  if (docFailed(result)) {
    throw new Error(`expected success, got ${result.error.code}: ${result.error.detail ?? ''}`);
  }
  return result.data;
}

let client: PaperlessClient;
let provider: PaperlessDocumentProvider;

beforeEach(() => {
  calls = [];
  routes = new Map();
  client = new PaperlessClient();
  provider = new PaperlessDocumentProvider(client);

  safeFetchMock.mockReset();
  readCappedJsonMock.mockReset();
  readCappedTextMock.mockReset();
  discardBodyMock.mockReset();

  readCappedJsonMock.mockImplementation(async (res: { text(): Promise<string> }) => {
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  });
  readCappedTextMock.mockImplementation(async (res: { text(): Promise<string> }) => ({
    text: await res.text(),
    truncated: false,
  }));

  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      const parsed = new URL(url);
      const method = (init.method ?? 'GET').toUpperCase();
      const body = typeof init.body === 'string'
        ? init.body
        : Buffer.isBuffer(init.body)
          ? init.body.toString('latin1')
          : '';
      calls.push({ url: parsed, init, options, body });
      const queue = routes.get(`${method} ${parsed.pathname}`);
      if (queue === undefined || queue.length === 0) {
        throw new Error(`no stubbed reply for ${method} ${parsed.pathname}`);
      }
      return (queue.length > 1 ? queue.shift() : queue[0]) as unknown as Response;
    },
  );
});

describe('PaperlessClient: the request it builds', () => {
  it('PAPERLESS-001: appends /api to whatever the operator pasted', () => {
    expect(apiBase(BASE)).toBe(`${BASE}/api`);
    expect(apiBase(`${BASE}/`)).toBe(`${BASE}/api`);
    expect(apiBase(`${BASE}/api`)).toBe(`${BASE}/api`);
    expect(apiBase(`${BASE}/api/`)).toBe(`${BASE}/api`);
    expect(apiBase('  https://home.example.org/paperless/  ')).toBe('https://home.example.org/paperless/api');
    expect(apiBase('http://192.168.178.9:8000')).toBe('http://192.168.178.9:8000/api');
  });

  it('PAPERLESS-002: sends the token as a Token header and pins the API version', async () => {
    on('GET /api/ui_settings/', reply({ user: { username: 'admin' }, settings: {}, permissions: [] }));
    await provider.probe(CONN);
    const call = lastRequest('GET /api/ui_settings/');
    expect(headerOf(call, 'Authorization')).toBe(`Token ${TOKEN}`);
    expect(headerOf(call, 'Accept')).toBe('application/json; version=10');
  });

  it('PAPERLESS-003: never puts the token in the query string', async () => {
    on('GET /api/ui_settings/', reply({ user: { username: 'admin' }, settings: {}, permissions: [] }));
    on('GET /api/tags/', reply(page([tagRow(3, 'japan')])));
    on('GET /api/documents/', reply(page([docRow()])));
    await provider.probe(CONN);
    await provider.listScopes(CONN);
    await provider.list(CONN, SCOPE);
    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const call of calls) {
      expect(call.url.search).not.toContain(TOKEN);
      expect(call.url.search).not.toMatch(/token|api_key/i);
    }
  });

  it('PAPERLESS-004: maps allowInsecureTls onto rejectUnauthorized and bounds the call', async () => {
    on('GET /api/ui_settings/', reply({ user: { username: 'admin' }, settings: {}, permissions: [] }));
    await provider.probe(CONN);
    await provider.probe({ ...CONN, allowInsecureTls: true });
    expect(calls[0]?.options).toEqual({ rejectUnauthorized: true });
    expect(calls[1]?.options).toEqual({ rejectUnauthorized: false });
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
  });

  it('PAPERLESS-005: reads the profile that does not echo the token back', async () => {
    on('GET /api/ui_settings/', reply({
      user: { username: 'admin' },
      settings: { version: '3.1.3' },
      permissions: ['add_workflow', 'add_document'],
    }));
    const probed = expectOk(await provider.probe(CONN));
    expect(probed.account).toBe('admin');
    expect(requests('GET /api/profile/')).toHaveLength(0);
  });
});

describe('PaperlessProvider: probing a connection', () => {
  it('PAPERLESS-010: reports the self-registering webhook when the token may create workflows', async () => {
    on('GET /api/ui_settings/', reply({
      user: { username: 'admin' },
      settings: { version: '3.1.3' },
      permissions: ['add_workflow'],
    }));
    const probed = expectOk(await provider.probe(CONN));
    expect(probed.capabilities.push).toBe('webhook-self-registered');
    expect(probed.capabilities.stableId).toBe(true);
    expect(probed.capabilities.contentHashInListing).toBe(true);
    expect(probed.capabilities.replaceInPlace).toBe(true);
    expect(probed.capabilities.remoteTrash).toBe(true);
  });

  it('PAPERLESS-011: downgrades to a manual webhook when the token may not create one', async () => {
    on('GET /api/ui_settings/', reply({
      user: { username: 'reisender' },
      settings: { version: '3.1.3' },
      permissions: ['view_document', 'add_document'],
    }));
    const probed = expectOk(await provider.probe(CONN));
    expect(probed.capabilities.push).toBe('webhook-manual');
    // The capability the CORE reads stays the provider's own answer; only the
    // probe reflects this token's narrower rights.
    expect(provider.capabilities(CONN).push).toBe('webhook-self-registered');
  });

  it('PAPERLESS-012: a wrong token is unauthorized, a forbidden one is forbidden', async () => {
    on('GET /api/ui_settings/', reply({ detail: 'Invalid token.' }, 401));
    expect(expectFail(await provider.probe(CONN)).code).toBe('unauthorized');
    on('GET /api/ui_settings/', reply({ detail: 'no' }, 403));
    expect(expectFail(await provider.probe(CONN)).code).toBe('forbidden');
  });

  it('PAPERLESS-013: an HTML login page is a provider error, not a crash', async () => {
    on('GET /api/ui_settings/', reply('<!doctype html><title>Sign in</title>'));
    const error = expectFail(await provider.probe(CONN));
    expect(error.code).toBe('provider_error');
    expect(error.detail).toContain('Paperless itself');
  });

  it('PAPERLESS-014: a connection without a token never reaches the network', async () => {
    const error = expectFail(await provider.probe({ ...CONN, secrets: {} }));
    expect(error.code).toBe('unauthorized');
    expect(calls).toHaveLength(0);
  });

  it('PAPERLESS-015: the SSRF guard, a timeout and a self-signed certificate each get their own code', async () => {
    safeFetchMock.mockImplementationOnce(async () => {
      throw new FakeSsrfBlockedError('Requests to loopback and link-local addresses are not allowed');
    });
    expect(expectFail(await provider.probe(CONN)).code).toBe('ssrf_blocked');

    safeFetchMock.mockImplementationOnce(async () => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    });
    expect(expectFail(await provider.probe(CONN)).code).toBe('timeout');

    safeFetchMock.mockImplementationOnce(async () => {
      const cause = Object.assign(new Error('self-signed certificate'), {
        code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
      });
      throw Object.assign(new TypeError('fetch failed'), { cause });
    });
    expect(expectFail(await provider.probe(CONN)).code).toBe('tls_untrusted');

    safeFetchMock.mockImplementationOnce(async () => {
      throw Object.assign(new TypeError('fetch failed'), {
        cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      });
    });
    expect(expectFail(await provider.probe(CONN)).code).toBe('unreachable');
  });
});

describe('PaperlessProvider: scopes are tags', () => {
  it('PAPERLESS-020: a tag becomes a scope key, a label and the instance filter URL', async () => {
    on('GET /api/tags/', reply(page([tagRow(3, 'japan-2026', 4), tagRow(9, 'privat')])));
    const options = expectOk(await provider.listScopes(CONN));
    expect(options).toEqual([
      { scopeKey: 'tag:3', label: 'japan-2026', remoteRootId: '3', remoteRootPath: '/documents?tags__id__all=3' },
      { scopeKey: 'tag:9', label: 'privat', remoteRootId: '9', remoteRootPath: '/documents?tags__id__all=9' },
    ]);
  });

  it('PAPERLESS-021: follows the pages of a long tag list', async () => {
    on(
      'GET /api/tags/',
      reply(page([tagRow(1, 'a')], 'https://papers.example.org/api/tags/?page=2', 2)),
      reply(page([tagRow(2, 'b')], null, 2)),
    );
    const options = expectOk(await provider.listScopes(CONN));
    expect(options.map((option) => option.scopeKey)).toEqual(['tag:1', 'tag:2']);
    expect(requests('GET /api/tags/')).toHaveLength(2);
    expect(requests('GET /api/tags/')[1]?.url.searchParams.get('page')).toBe('2');
  });

  it('PAPERLESS-022: a search narrows server-side, an empty one is not sent at all', async () => {
    on('GET /api/tags/', reply(page([tagRow(3, 'japan-2026')])));
    await provider.listScopes(CONN, ' japan ');
    await provider.listScopes(CONN, '   ');
    expect(requests('GET /api/tags/')[0]?.url.searchParams.get('name__icontains')).toBe('japan');
    expect(requests('GET /api/tags/')[1]?.url.searchParams.has('name__icontains')).toBe(false);
  });

  it('PAPERLESS-023: creating a tag that exists is a conflict, never a silent adoption', async () => {
    on('POST /api/tags/', reply({ error: 'Object violates owner / name unique constraint' }, 400));
    expect(expectFail(await provider.createScope(CONN, 'japan-2026')).code).toBe('conflict');
  });

  it('PAPERLESS-024: a tag that is gone is scope_missing, not a bare 404', async () => {
    on('GET /api/tags/3/', reply({ detail: 'No Tag matches the given query.' }, 404));
    const error = expectFail(await provider.resolveScope(CONN, SCOPE));
    expect(error.code).toBe('scope_missing');
    expect(error.status).toBe(404);
  });

  it('PAPERLESS-025: another provider’s scope key is refused before any request', async () => {
    for (const scopeKey of ['path:/trek', 'tag:', 'tag:abc', 'tag:-1', 'fileid:437']) {
      const error = expectFail(await provider.resolveScope(CONN, { ...SCOPE, scopeKey }));
      expect(error.code).toBe('scope_missing');
    }
    expect(calls).toHaveLength(0);
    expect(parseScopeKey('tag:12')).toBe(12);
  });
});

describe('PaperlessProvider: listing a scope', () => {
  it('PAPERLESS-030: maps a document onto the core’s shape', async () => {
    on('GET /api/documents/', reply(page([docRow()])));
    const listed = expectOk(await provider.list(CONN, SCOPE));
    expect(listed.documents).toEqual([
      {
        remoteId: '11',
        name: 'Hotelrechnung Kyoto.pdf',
        size: null,
        mimeType: 'application/pdf',
        remoteVersion: '2026-09-18T17:30:00.000000+02:00',
        contentHash: HASH_A,
        remoteModifiedAt: '2026-09-18T17:30:00.000000+02:00',
        isDeleted: false,
      },
    ]);
    const call = lastRequest('GET /api/documents/');
    expect(call.url.searchParams.get('tags__id__all')).toBe('3');
    expect(call.url.searchParams.get('ordering')).toBe('id');
    expect(call.url.searchParams.get('page_size')).toBe(String(DOCUMENT_PAGE_SIZE));
  });

  it('PAPERLESS-031: a checksum that is not sha256 is reported as no hash at all', async () => {
    on('GET /api/documents/', reply(page([
      docRow({ versions: [{ id: 1, checksum: 'a91fe3f8e2cf4b2b5560b2222d65d60c', added: null, is_root: true }] }),
    ])));
    const listed = expectOk(await provider.list(CONN, SCOPE));
    expect(listed.documents[0]?.contentHash).toBeNull();
    expect(sha256OrNull('A'.repeat(64))).toBe('a'.repeat(64));
    expect(sha256OrNull('zz')).toBeNull();
  });

  it('PAPERLESS-032: after a replace the hash is the newest revision, not the root one', async () => {
    on('GET /api/documents/', reply(page([
      docRow({
        versions: [
          { id: 12, checksum: HASH_B, added: '2026-09-18T15:40:00.000000Z', is_root: false },
          { id: 11, checksum: HASH_A, added: '2026-09-18T15:29:00.000000Z', is_root: true },
        ],
      }),
    ])));
    const listed = expectOk(await provider.list(CONN, SCOPE));
    expect(listed.documents[0]?.contentHash).toBe(HASH_B);
    // Independent of the order the instance happens to send them in.
    expect(currentVersion({
      id: 1,
      title: '',
      originalFileName: null,
      mimeType: null,
      modified: null,
      added: null,
      deletedAt: null,
      tagIds: [],
      versions: [
        { id: 11, checksum: HASH_A, added: '2026-09-18T15:29:00.000000Z', isRoot: true },
        { id: 12, checksum: HASH_B, added: '2026-09-18T15:40:00.000000Z', isRoot: false },
      ],
    })?.checksum).toBe(HASH_B);
  });

  it('PAPERLESS-033: a listing that hits the page cap says so and claims nothing about the cursor', async () => {
    const endless = reply(page([docRow()], 'https://papers.example.org/api/documents/?page=2', 9999));
    on('GET /api/documents/', endless);
    const listed = expectOk(await provider.list(CONN, { ...SCOPE, cursor: 'v1:9999:x' }));
    expect(listed.truncated).toBe(true);
    expect(listed.cursorUnchanged).toBe(false);
    expect(requests('GET /api/documents/')).toHaveLength(PROVIDER_MAX_PAGES);
  });

  it('PAPERLESS-034: an unchanged scope is recognised, a changed one is not', async () => {
    on('GET /api/documents/', reply(page([docRow()])));
    const first = expectOk(await provider.list(CONN, SCOPE));
    expect(first.cursorUnchanged).toBe(false);
    const second = expectOk(await provider.list(CONN, { ...SCOPE, cursor: first.cursor }));
    expect(second.cursorUnchanged).toBe(true);

    // A document leaving the tag moves no timestamp: only the count notices.
    on('GET /api/documents/', reply(page([], null, 0)));
    const third = expectOk(await provider.list(CONN, { ...SCOPE, cursor: first.cursor }));
    expect(third.cursorUnchanged).toBe(false);
    expect(third.documents).toHaveLength(0);
  });

  it('PAPERLESS-035: a document without a title still gets a usable name', async () => {
    on('GET /api/documents/', reply(page([
      docRow({ id: 5, title: '', original_file_name: 'scan_2026.PDF' }),
      docRow({ id: 6, title: '', original_file_name: null, mime_type: 'image/png' }),
      docRow({ id: 7, title: 'Bordkarte.pdf', original_file_name: 'bordkarte.pdf' }),
    ])));
    const listed = expectOk(await provider.list(CONN, SCOPE));
    expect(listed.documents.map((doc) => doc.name)).toEqual([
      'scan_2026.PDF',
      'document-6.png',
      // An extension the title already carries is not doubled.
      'Bordkarte.pdf',
    ]);
    expect(documentFileName({
      id: 8,
      title: 'Notiz',
      originalFileName: null,
      mimeType: 'text/plain',
      modified: null,
      added: null,
      deletedAt: null,
      tagIds: [],
      versions: [],
    })).toBe('Notiz.txt');
  });

  it('PAPERLESS-036: an answer that is not a listing is a provider error', async () => {
    on('GET /api/documents/', reply({ unexpected: true }));
    expect(expectFail(await provider.list(CONN, SCOPE)).code).toBe('provider_error');
  });
});

describe('PaperlessProvider: fetching bytes', () => {
  it('PAPERLESS-040: asks for the original file and hands back the stream with its version', async () => {
    on('GET /api/documents/11/', reply(docRow()));
    on('GET /api/documents/11/download/', streamReply('%PDF-1.4 hotel', {
      'content-length': '14',
      'content-type': 'application/pdf',
    }));
    const fetched = expectOk(await provider.fetch(CONN, SCOPE, '11'));
    expect(lastRequest('GET /api/documents/11/download/').url.searchParams.get('original')).toBe('true');
    expect(fetched.size).toBe(14);
    expect(fetched.mimeType).toBe('application/pdf');
    expect(fetched.remoteVersion).toBe('2026-09-18T17:30:00.000000+02:00');
    const chunks: Buffer[] = [];
    for await (const chunk of fetched.body) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toBe('%PDF-1.4 hotel');
  });

  it('PAPERLESS-041: a missing content-length is an unknown size, never zero', async () => {
    on('GET /api/documents/11/', reply(docRow()));
    on('GET /api/documents/11/download/', streamReply('%PDF-1.4 hotel'));
    const fetched = expectOk(await provider.fetch(CONN, SCOPE, '11'));
    expect(fetched.size).toBeNull();
  });

  it('PAPERLESS-042: a deleted document is not_found, and a nonsense id never leaves the process', async () => {
    on('GET /api/documents/11/', reply({ detail: 'No Document matches the given query.' }, 404));
    expect(expectFail(await provider.fetch(CONN, SCOPE, '11')).code).toBe('not_found');
    const before = calls.length;
    expect(expectFail(await provider.fetch(CONN, SCOPE, '../../etc/passwd')).code).toBe('not_found');
    expect(calls).toHaveLength(before);
  });

  it('PAPERLESS-043: a download without a body is a provider error, not an empty file', async () => {
    on('GET /api/documents/11/', reply(docRow()));
    on('GET /api/documents/11/download/', reply(''));
    expect(expectFail(await provider.fetch(CONN, SCOPE, '11'))).toMatchObject({
      code: 'provider_error',
      detail: 'Paperless sent no body for the document',
    });
  });

  it('PAPERLESS-044: a download announcing more than TREK transfers is refused before it is read', async () => {
    on('GET /api/documents/11/', reply(docRow()));
    on('GET /api/documents/11/download/', streamReply('%PDF', { 'content-length': String(3 * 1024 ** 3) }));
    expect(expectFail(await provider.fetch(CONN, SCOPE, '11'))).toMatchObject({
      code: 'too_large',
      detail: `content_length=${3 * 1024 ** 3}`,
    });
    expect(discardBodyMock).toHaveBeenCalledTimes(1);
  });
});

describe('PaperlessProvider: pushing bytes', () => {
  function stubSuccessfulCreate(): void {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow()])));
    on('GET /api/documents/11/', reply(docRow()));
  }

  it('PAPERLESS-050: an unaccepted type is refused before a single byte is uploaded', async () => {
    const error = expectFail(await provider.push(CONN, SCOPE, pushRequest({
      fileName: 'tour.gpx',
      mimeType: 'application/gpx+xml',
    })));
    expect(error.code).toBe('unsupported_type');
    expect(calls).toHaveLength(0);
  });

  it('PAPERLESS-050b: a stored Content-Type with parameters is still the type it names', async () => {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow()])));
    on('GET /api/documents/11/', reply(docRow({ mime_type: 'text/plain' })));
    expectOk(await provider.push(CONN, SCOPE, pushRequest({
      fileName: 'notiz.txt',
      mimeType: 'Text/Plain; charset=utf-8',
    })));
    expect(lastRequest('POST /api/documents/post_document/').body).toContain('Content-Type: text/plain\r\n');
    expect(normalizeMime('application/pdf')).toBe('application/pdf');
  });

  it('PAPERLESS-051: an upload carries the tag, the title and the custom field in one request', async () => {
    stubSuccessfulCreate();
    const pushed = expectOk(await provider.push(CONN, SCOPE, pushRequest()));
    expect(pushed).toEqual({
      remoteId: '11',
      remoteVersion: '2026-09-18T17:30:00.000000+02:00',
      remoteModifiedAt: '2026-09-18T17:30:00.000000+02:00',
      // Paperless stores duplicate bytes twice, so nothing here may claim a
      // deduplication happened.
      deduplicated: false,
    });
    const upload = lastRequest('POST /api/documents/post_document/');
    expect(headerOf(upload, 'Content-Type')).toMatch(/^multipart\/form-data; boundary=/);
    // Content-Length is undici's business; setting it makes it refuse the call.
    expect(headerOf(upload, 'Content-Length')).toBeUndefined();
    expect(upload.body).toContain('name="tags"\r\n\r\n3');
    expect(upload.body).toContain('name="title"\r\n\r\nrechnung');
    expect(upload.body).toContain('name="custom_fields"\r\n\r\n{"1":"trip-uid-42"}');
    expect(upload.body).toContain('filename="rechnung.pdf"');
    expect(upload.body).toContain('%PDF-1.4 hotel');
  });

  it('PAPERLESS-052: the trip anchor field is created when the instance has none', async () => {
    on('GET /api/custom_fields/', reply(page([])));
    on('POST /api/custom_fields/', reply({ id: 4, name: TRIP_UID_FIELD_NAME, data_type: 'string' }));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow()])));
    on('GET /api/documents/11/', reply(docRow()));
    expectOk(await provider.push(CONN, SCOPE, pushRequest()));
    expect(lastRequest('POST /api/custom_fields/').body).toContain(TRIP_UID_FIELD_NAME);
    expect(lastRequest('POST /api/documents/post_document/').body).toContain('{"4":"trip-uid-42"}');
  });

  it('PAPERLESS-053: a custom field list from a build that ignores the filter is not trusted', async () => {
    on('GET /api/custom_fields/', reply(page([
      { id: 8, name: 'rechnungsnummer', data_type: 'string' },
      { id: 9, name: 'TREK_TRIP_ID', data_type: 'string' },
    ])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow()])));
    on('GET /api/documents/11/', reply(docRow()));
    expectOk(await provider.push(CONN, SCOPE, pushRequest()));
    expect(lastRequest('POST /api/documents/post_document/').body).toContain('{"9":"trip-uid-42"}');
    expect(requests('POST /api/custom_fields/')).toHaveLength(0);
  });

  it('PAPERLESS-054: a consume that fails is a provider error, a duplicate one a conflict', async () => {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow({
      status: 'failure',
      related_document_ids: [],
      result_data: { error_type: 'ConsumerError', error_message: 'kaputt.pdf: InputFileError' },
    })])));
    const failed = expectFail(await provider.push(CONN, SCOPE, pushRequest()));
    expect(failed.code).toBe('provider_error');
    expect(failed.detail).toContain('InputFileError');

    on('GET /api/tasks/', reply(page([taskRow({
      status: 'FAILURE',
      related_document_ids: [],
      result_data: { error_message: 'It is a duplicate of Rechnung (#4)' },
    })])));
    expect(expectFail(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('conflict');
  });

  it('PAPERLESS-055: the task filter is not trusted either, so a foreign task is ignored', async () => {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow({ task_id: 'someone-elses-task', status: 'success' })])));
    vi.spyOn(client, 'awaitConsume');
    // The only way out is the poll budget, so the client is asked directly with
    // a short one rather than holding the test for two minutes.
    const creds = { baseUrl: BASE, token: TOKEN, allowInsecureTls: false };
    await expect(
      client.awaitConsume(creds, 'task-uuid-1', { intervalMs: 1, timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: 'timeout' });
  });

  it('PAPERLESS-056: an upload whose task outlives the budget is found again by its checksum', async () => {
    vi.spyOn(client, 'awaitConsume').mockRejectedValue(
      new PaperlessError('timeout', 'Paperless is still processing the uploaded file'),
    );
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    // One document with the same bytes in another tag, one in ours: the tagged
    // one is the upload we just made.
    on('GET /api/documents/', reply(page([
      docRow({ id: 21, tags: [99] }),
      docRow({ id: 11, tags: [3] }),
    ])));
    on('GET /api/documents/11/', reply(docRow()));
    const pushed = expectOk(await provider.push(CONN, SCOPE, pushRequest()));
    expect(pushed.remoteId).toBe('11');
    expect(lastRequest('GET /api/documents/').url.searchParams.get('checksum__iexact')).toBe(HASH_A);
  });

  it('PAPERLESS-057a: a document with the same bytes but another tag is not adopted', async () => {
    // The tag goes on at upload, so only a tagged document can be the one this
    // push made. Taking the untagged twin instead put a stranger's document in
    // the trip, and delete-through would have trashed it on a later run.
    vi.spyOn(client, 'awaitConsume').mockRejectedValue(
      new PaperlessError('timeout', 'Paperless is still processing the uploaded file'),
    );
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/documents/', reply(page([docRow({ id: 21, tags: [99] })])));
    expect(expectFail(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('timeout');
    expect(requests('GET /api/documents/21/')).toHaveLength(0);
  });

  it('PAPERLESS-057: when the checksum finds nothing either, the timeout is reported', async () => {
    vi.spyOn(client, 'awaitConsume').mockRejectedValue(
      new PaperlessError('timeout', 'Paperless is still processing the uploaded file'),
    );
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/documents/', reply(page([])));
    expect(expectFail(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('timeout');
  });

  it('PAPERLESS-058: a replace keeps the id it was given, not the one the task names', async () => {
    on('POST /api/documents/11/update_version/', reply('"task-uuid-2"'));
    // update_version files the new revision under a fresh internal id that
    // answers 404 on its own. Adopting it would break the mapping.
    on('GET /api/tasks/', reply(page([taskRow({ task_id: 'task-uuid-2', related_document_ids: [77] })])));
    on('GET /api/documents/11/', reply(docRow({
      modified: '2026-09-18T18:00:00.000000+02:00',
      versions: [
        { id: 12, checksum: HASH_A, added: '2026-09-18T16:00:00.000000Z', is_root: false },
        { id: 11, checksum: HASH_B, added: '2026-09-18T15:29:00.000000Z', is_root: true },
      ],
    })));
    const pushed = expectOk(await provider.push(CONN, SCOPE, pushRequest({ remoteId: '11' })));
    expect(pushed.remoteId).toBe('11');
    expect(pushed.remoteVersion).toBe('2026-09-18T18:00:00.000000+02:00');
    expect(requests('POST /api/documents/post_document/')).toHaveLength(0);
    expect(requests('GET /api/documents/77/')).toHaveLength(0);
  });

  it('PAPERLESS-059: a file larger than it claimed is refused without being uploaded', async () => {
    const error = expectFail(await provider.push(CONN, SCOPE, pushRequest({ size: 4 })));
    expect(error.code).toBe('too_large');
    expect(requests('POST /api/documents/post_document/')).toHaveLength(0);
  });

  it('PAPERLESS-060: a type the instance refuses comes back as the same code as the local check', async () => {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply({ document: ['File type text/xml not supported'] }, 400));
    expect(expectFail(await provider.push(CONN, SCOPE, pushRequest())).code).toBe('unsupported_type');
  });

  it('PAPERLESS-061: bytes that arrived differently are reported and the new document is trashed', async () => {
    on('GET /api/custom_fields/', reply(page([{ id: 1, name: TRIP_UID_FIELD_NAME, data_type: 'string' }])));
    on('POST /api/documents/post_document/', reply('"task-uuid-1"'));
    on('GET /api/tasks/', reply(page([taskRow()])));
    on('GET /api/documents/11/', reply(docRow({
      versions: [{ id: 11, checksum: HASH_B, added: '2026-09-18T15:29:00.000000Z', is_root: true }],
    })));
    on('DELETE /api/documents/11/', reply('', 204));
    const error = expectFail(await provider.push(CONN, SCOPE, pushRequest({ sha256: HASH_A })));
    expect(error.code).toBe('checksum_mismatch');
    expect(requests('DELETE /api/documents/11/')).toHaveLength(1);
  });

  it('PAPERLESS-062: a mismatch after a replace leaves the existing document alone', async () => {
    on('POST /api/documents/11/update_version/', reply('"task-uuid-2"'));
    on('GET /api/tasks/', reply(page([taskRow({ task_id: 'task-uuid-2' })])));
    on('GET /api/documents/11/', reply(docRow({
      versions: [{ id: 12, checksum: HASH_B, added: '2026-09-18T16:00:00.000000Z', is_root: false }],
    })));
    const error = expectFail(await provider.push(CONN, SCOPE, pushRequest({ remoteId: '11', sha256: HASH_A })));
    expect(error.code).toBe('checksum_mismatch');
    expect(requests('DELETE /api/documents/11/')).toHaveLength(0);
  });
});

describe('PaperlessProvider: renaming and trashing', () => {
  it('PAPERLESS-070: renaming sets the title without the extension it would add back', async () => {
    on('PATCH /api/documents/11/', reply(docRow({ modified: '2026-09-18T19:00:00.000000+02:00' })));
    const renamed = expectOk(await provider.rename(CONN, SCOPE, '11', ' Hotelrechnung Kyoto.pdf '));
    expect(lastRequest('PATCH /api/documents/11/').body).toBe('{"title":"Hotelrechnung Kyoto"}');
    expect(renamed.remoteVersion).toBe('2026-09-18T19:00:00.000000+02:00');
    // An extension this adapter would never have added stays part of the name.
    expect(titleFromFileName('Vertrag 2026.2')).toBe('Vertrag 2026.2');
    expect(titleFromFileName('bordkarte.PDF')).toBe('bordkarte');
  });

  it('PAPERLESS-071: renaming a document that is gone is not_found', async () => {
    on('PATCH /api/documents/11/', reply({ detail: 'No Document matches the given query.' }, 404));
    expect(expectFail(await provider.rename(CONN, SCOPE, '11', 'neu.pdf')).code).toBe('not_found');
  });

  it('PAPERLESS-072: a name longer than the title column is cut to fit instead of refused on every run', async () => {
    // Paperless keeps 128 characters of a title. Sending more is a 400 that
    // repeats on each poll, with nothing in the message that names the file.
    const long = `${'Reservierungsbestätigung Hotel Alpenblick Zermatt '.repeat(4)}Familie Mustermann final`;
    expect(long.length).toBeGreaterThan(PAPERLESS_TITLE_MAX_LENGTH);
    expect(titleFromFileName(`${long}.pdf`)).toBe(long.slice(0, PAPERLESS_TITLE_MAX_LENGTH).trim());
    expect(titleFromFileName(`${long}.pdf`).length).toBeLessThanOrEqual(PAPERLESS_TITLE_MAX_LENGTH);
    // Exactly the limit is still sent whole.
    const exact = 'x'.repeat(PAPERLESS_TITLE_MAX_LENGTH);
    expect(titleFromFileName(`${exact}.pdf`)).toBe(exact);
    // The limit counts characters as Paperless does, so a cut never lands inside
    // one: U+1D538 is two UTF-16 units, and a cut by units would end on half of it.
    const wide = '\u{1D538}';
    const glyphs = [...titleFromFileName(`${wide.repeat(PAPERLESS_TITLE_MAX_LENGTH + 2)}.pdf`)];
    expect(glyphs).toHaveLength(PAPERLESS_TITLE_MAX_LENGTH);
    expect(glyphs.every((glyph) => glyph === wide)).toBe(true);

    on('PATCH /api/documents/11/', reply(docRow({ modified: '2026-09-18T19:00:00.000000+02:00' })));
    expectOk(await provider.rename(CONN, SCOPE, '11', `${long}.pdf`));
    const sent = JSON.parse(lastRequest('PATCH /api/documents/11/').body) as { title: string };
    expect(sent.title.length).toBeLessThanOrEqual(PAPERLESS_TITLE_MAX_LENGTH);
  });

  it('PAPERLESS-080: trashing is a soft delete, and doing it twice is still success', async () => {
    on('DELETE /api/documents/11/', reply('', 204), reply({ detail: 'No Document matches the given query.' }, 404));
    expectOk(await provider.trash(CONN, SCOPE, '11'));
    expectOk(await provider.trash(CONN, SCOPE, '11'));
    expect(requests('DELETE /api/documents/11/')).toHaveLength(2);
  });
});

describe('PaperlessProvider: the self-registered webhook', () => {
  it('PAPERLESS-090: subscribes both triggers, filtered on the tag, with the secret in a header', async () => {
    on('POST /api/workflows/', reply({ id: 6 }, 201));
    const registered = expectOk(
      await provider.registerWebhook(CONN, SCOPE, 'https://trek.example.org/api/docsync/hook/7', 'sh4red'),
    );
    expect(registered.subscriptionId).toBe('6');

    const sent = JSON.parse(lastRequest('POST /api/workflows/').body) as {
      triggers: Array<{ type: number; filter_has_tags: number[]; sources: number[] }>;
      actions: Array<{ type: number; webhook: Record<string, unknown> }>;
    };
    expect(sent.triggers.map((trigger) => trigger.type)).toEqual([2, 3]);
    for (const trigger of sent.triggers) {
      expect(trigger.filter_has_tags).toEqual([3]);
      // Including the web UI, or a document dropped in by hand fires nothing.
      expect(trigger.sources).toEqual([1, 2, 3, 4]);
    }
    expect(sent.actions[0]?.type).toBe(4);
    expect(sent.actions[0]?.webhook).toMatchObject({
      url: 'https://trek.example.org/api/docsync/hook/7',
      use_params: true,
      as_json: true,
      include_document: false,
      params: { linkId: '7', tripId: '42' },
      headers: { [PAPERLESS_WEBHOOK_SECRET_HEADER]: 'sh4red' },
    });
    // The secret travels in a header, never in the URL or the body.
    expect(lastRequest('POST /api/workflows/').url.search).not.toContain('sh4red');
    expect(JSON.stringify(sent.actions[0]?.webhook.params)).not.toContain('sh4red');
  });

  it('PAPERLESS-091: a callback URL Paperless cannot store is refused here, not upstream', async () => {
    const long = `https://trek.example.org/api/docsync/hook/${'x'.repeat(240)}`;
    const error = expectFail(await provider.registerWebhook(CONN, SCOPE, long, 's'));
    expect(error.code).toBe('provider_error');
    expect(error.detail).toContain('limit 256');
    expect(calls).toHaveLength(0);
  });

  it('PAPERLESS-092: unsubscribing twice is success, and a nonsense id never leaves the process', async () => {
    on('DELETE /api/workflows/6/', reply('', 204), reply({ detail: 'Not found.' }, 404));
    expectOk(await provider.unregisterWebhook(CONN, '6'));
    expectOk(await provider.unregisterWebhook(CONN, '6'));
    const before = calls.length;
    expect(expectFail(await provider.unregisterWebhook(CONN, 'workflow-6')).code).toBe('not_found');
    expect(calls).toHaveLength(before);
  });
});

describe('the multipart body', () => {
  it('PAPERLESS-095: a file name cannot break out of the Content-Disposition header', () => {
    const { body, contentType } = buildMultipart(
      [{ name: 'tags', value: '3' }],
      {
        fileName: 'a";\r\nX-Injected: 1\r\n\r\nevil.pdf',
        mimeType: 'application/pdf',
        bytes: Buffer.from('bytes'),
      },
    );
    const text = body.toString('latin1');
    expect(text).not.toContain('X-Injected: 1\r\n');
    // Quote, CR and LF each become an underscore; everything else survives, so
    // the name stays recognisable in the archive.
    expect(text).toContain('filename="a_;__X-Injected: 1____evil.pdf"');
    const boundary = /boundary=(.+)$/.exec(contentType)?.[1] ?? '';
    expect(boundary.length).toBeGreaterThan(16);
    expect(text.endsWith(`--${boundary}--\r\n`)).toBe(true);
  });
});
