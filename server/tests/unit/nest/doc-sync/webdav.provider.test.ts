/**
 * The WebDAV adapter for Nextcloud and OpenCloud: what it puts on the wire, and
 * what it makes of what comes back.
 *
 * The cases here are the ones that cost real debugging against the two
 * products, so they are pinned rather than described: Nextcloud's `OC-FileId`
 * header is not its `oc:fileid` and a naive adapter re-uploads every file
 * forever; `OC-Checksum: SHA256` is fine on Nextcloud and a hard 400 on
 * OpenCloud; a PROPFIND answers one propstat block per status and the 404 block
 * is not data; an OpenCloud drive describes its own WebDAV URL on a host the
 * admin never entered.
 *
 * `safeFetch` and the capped readers are mocked, for the reason
 * dawarich.client.test.ts gives: the SSRF guard does a real DNS lookup and the
 * readers want a real stream. The responses are genuine `Response` objects, so
 * headers, status and body behave as they do in production.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { safeFetchMock } = vi.hoisted(() => ({ safeFetchMock: vi.fn() }));

vi.mock('../../../../src/utils/ssrfGuard', () => ({
  safeFetch: safeFetchMock,
  SsrfBlockedError: class SsrfBlockedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SsrfBlockedError';
    }
  },
}));

vi.mock('../../../../src/utils/cappedFetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/utils/cappedFetch')>()),
  readCappedText: async (res: Response) => {
    const text = await res.text();
    return { text: text.slice(0, capBytes), truncated: text.length > capBytes };
  },
  readCappedJson: async (res: Response) => {
    try {
      return JSON.parse(await res.text()) as unknown;
    } catch {
      return undefined;
    }
  },
}));

import { Readable } from 'node:stream';
import { SsrfBlockedError } from '../../../../src/utils/ssrfGuard';
import {
  NextcloudDocumentProvider,
  OpencloudDocumentProvider,
  flavorOf,
} from '../../../../src/nest/doc-sync/providers/webdav.provider';
import { WebdavClient } from '../../../../src/nest/doc-sync/providers/webdav.client';
import type {
  DocumentConnectionRef,
  DocumentScopeRef,
  PushRequest,
} from '../../../../src/nest/doc-sync/document-provider';

/** Raised by the truncation test only; everything else stays under the cap. */
let capBytes = 1_000_000;

const NC_ORIGIN = 'https://cloud.example.org';
const OC_ORIGIN = 'https://opencloud.example.org';
const NC_ROOT = '/remote.php/dav/files/admin';
const OC_DRIVE = 'storage-1$space-9';
const OC_ROOT = `/dav/spaces/${OC_DRIVE}`;

const ncConn: DocumentConnectionRef = {
  connectionId: 7,
  createdAt: '2026-09-01 08:00:00',
  ownerId: 3,
  baseUrl: NC_ORIGIN,
  secrets: { app_password: 'app-pw' },
  settings: { login_name: 'admin', base_path: '/TREK' },
  allowInsecureTls: false,
};

const ocConn: DocumentConnectionRef = {
  connectionId: 8,
  createdAt: '2026-09-01 08:00:00',
  ownerId: 3,
  baseUrl: OC_ORIGIN,
  secrets: { app_token: 'app-token' },
  settings: { username: 'admin' },
  allowInsecureTls: true,
};

const ncScope: DocumentScopeRef = {
  linkId: 1,
  tripId: 42,
  scopeKey: 'fileid:60',
  remoteRootId: '60',
  remoteRootPath: '/TREK/trip 42',
  cursor: null,
};

const ocScope: DocumentScopeRef = {
  linkId: 2,
  tripId: 42,
  scopeKey: `drive:${OC_DRIVE}`,
  remoteRootId: OC_DRIVE,
  remoteRootPath: `${OC_ORIGIN}${OC_ROOT}`,
  cursor: null,
};

interface Recorded {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
  rejectUnauthorized: boolean | undefined;
}

let calls: Recorded[] = [];

/** `METHOD /path` → the answer, or a function of the request. */
type Answer = Response | ((req: Recorded) => Response);
let routes: Map<string, Answer[]>;

function route(key: string, ...answers: Answer[]): void {
  routes.set(key, answers);
}

function reply(body: string | null, init: ResponseInit = {}): Response {
  return new Response(body, init);
}

/** A PROPFIND answer built from the props each entry declares. */
function multistatus(
  entries: Array<{
    href: string;
    collection?: boolean;
    etag?: string;
    fileid?: string;
    size?: number;
    type?: string;
    modified?: string;
    checksums?: string;
  }>,
): Response {
  const body = entries
    .map((entry) => {
      const found: string[] = [];
      const missing: string[] = [];
      found.push(`<d:getetag>${entry.etag ?? '"etag"'}</d:getetag>`);
      found.push(`<d:getlastmodified>${entry.modified ?? 'Fri, 18 Sep 2026 15:15:54 GMT'}</d:getlastmodified>`);
      found.push(entry.collection ? '<d:resourcetype><d:collection/></d:resourcetype>' : '<d:resourcetype/>');
      if (entry.fileid) found.push(`<oc:fileid>${entry.fileid}</oc:fileid>`);
      if (entry.size === undefined) missing.push('<d:getcontentlength/>');
      else found.push(`<d:getcontentlength>${entry.size}</d:getcontentlength>`);
      if (entry.type === undefined) missing.push('<d:getcontenttype/>');
      else found.push(`<d:getcontenttype>${entry.type}</d:getcontenttype>`);
      if (entry.checksums === undefined) missing.push('<oc:checksums/>');
      else found.push(`<oc:checksums><oc:checksum>${entry.checksums}</oc:checksum></oc:checksums>`);

      const blocks = [`<d:propstat><d:prop>${found.join('')}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>`];
      if (missing.length > 0) {
        blocks.push(
          `<d:propstat><d:prop>${missing.join('')}</d:prop><d:status>HTTP/1.1 404 Not Found</d:status></d:propstat>`,
        );
      }
      return `<d:response><d:href>${entry.href}</d:href>${blocks.join('')}</d:response>`;
    })
    .join('');

  return reply(
    `<?xml version="1.0"?><d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">${body}</d:multistatus>`,
    { status: 207, headers: { 'content-type': 'application/xml' } },
  );
}

function drive(id: string, name: string, driveType: string, webDavUrl: string): unknown {
  return { id, name, driveType, root: { id, webDavUrl } };
}

function requests(method?: string): Recorded[] {
  return method ? calls.filter((call) => call.method === method) : calls;
}

function pathOf(call: Recorded): string {
  return new URL(call.url).pathname;
}

function pushRequest(overrides: Partial<PushRequest> = {}): PushRequest {
  return {
    body: Readable.from([Buffer.from('bytes')]),
    fileName: 'reiseplan.pdf',
    mimeType: 'application/pdf',
    size: 5,
    sha256: 'a'.repeat(64),
    mtimeSeconds: 1_700_000_000,
    trekDocUid: 'doc-1',
    trekTripUid: 'trip-1',
    ...overrides,
  };
}

let nextcloud: NextcloudDocumentProvider;
let opencloud: OpencloudDocumentProvider;

beforeEach(() => {
  capBytes = 1_000_000;
  calls = [];
  routes = new Map();
  const client = new WebdavClient();
  nextcloud = new NextcloudDocumentProvider(client);
  opencloud = new OpencloudDocumentProvider(client);

  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      const headers: Record<string, string> = {};
      new Headers(init.headers).forEach((value, key) => {
        headers[key] = value;
      });
      const record: Recorded = {
        url,
        method: init.method ?? 'GET',
        headers,
        body: typeof init.body === 'string' ? init.body : undefined,
        rejectUnauthorized: options?.rejectUnauthorized,
      };
      calls.push(record);

      const key = `${record.method} ${new URL(url).pathname}`;
      const queued = routes.get(key);
      if (!queued || queued.length === 0) {
        return reply('<d:error/>', { status: 404 });
      }
      const answer = queued.length > 1 ? queued.shift() : queued[0];
      if (!answer) return reply(null, { status: 404 });
      return typeof answer === 'function' ? answer(record) : answer.clone();
    },
  );
});

describe('flavour detection', () => {
  it('reads the product off the connection rather than off the registered id', () => {
    expect(flavorOf(ncConn)).toBe('nextcloud');
    expect(flavorOf(ocConn)).toBe('opencloud');
    expect(flavorOf({ ...ncConn, settings: {}, secrets: {} })).toBeNull();
  });

  it('answers the same capabilities whichever class asks, because the connection decides', () => {
    expect(nextcloud.capabilities(ocConn).push).toBe('none');
    expect(opencloud.capabilities(ncConn).push).toBe('webhook-manual');
  });

  it('never claims a content hash it cannot stand behind', () => {
    const caps = nextcloud.capabilities(ncConn);
    expect(caps.contentHashInListing).toBe(false);
    expect(caps.stableId).toBe(true);
    expect(caps.remoteTrash).toBe(true);
    expect(caps.replaceInPlace).toBe(true);
  });
});

describe('probe', () => {
  it('checks the WebDAV home and upgrades push when the account may manage webhooks', async () => {
    route(`PROPFIND ${NC_ROOT}`, multistatus([{ href: NC_ROOT, collection: true, fileid: '1' }]));
    route('GET /ocs/v2.php/apps/webhook_listeners/api/v1/webhooks', reply('{"ocs":{"data":[]}}'));

    const result = await nextcloud.probe(ncConn);

    expect(result).toMatchObject({ success: true, data: { account: 'admin' } });
    expect(result.success && result.data.capabilities.push).toBe('webhook-self-registered');
    expect(calls[0].headers.authorization).toBe(`Basic ${Buffer.from('admin:app-pw').toString('base64')}`);
  });

  it('keeps push at webhook-manual when the webhook endpoint is closed to this account', async () => {
    route(`PROPFIND ${NC_ROOT}`, multistatus([{ href: NC_ROOT, collection: true, fileid: '1' }]));
    route('GET /ocs/v2.php/apps/webhook_listeners/api/v1/webhooks', reply('{}', { status: 403 }));

    const result = await nextcloud.probe(ncConn);

    expect(result.success && result.data.capabilities.push).toBe('webhook-manual');
  });

  it('separates a wrong login name from a wrong password', async () => {
    route(`PROPFIND ${NC_ROOT}`, reply('<d:error/>', { status: 404 }));
    const missing = await nextcloud.probe(ncConn);
    expect(missing).toMatchObject({ success: false, error: { code: 'not_found' } });
    expect(missing.success === false && missing.error.detail).toContain('admin');

    calls = [];
    route(`PROPFIND ${NC_ROOT}`, reply('<d:error/>', { status: 401 }));
    expect(await nextcloud.probe(ncConn)).toMatchObject({ success: false, error: { code: 'unauthorized' } });
  });

  it('names the OpenCloud account from Graph and passes the TLS opt-in through', async () => {
    route('GET /graph/v1.0/me', reply('{"onPremisesSamAccountName":"admin","displayName":"Admin"}'));

    const result = await opencloud.probe(ocConn);

    expect(result).toMatchObject({ success: true, data: { account: 'admin' } });
    expect(result.success && result.data.capabilities.push).toBe('none');
    expect(calls[0].rejectUnauthorized).toBe(false);
  });

  it('refuses a half-filled connection without going near the network', async () => {
    const result = await nextcloud.probe({ ...ncConn, secrets: {}, settings: { login_name: 'admin' } });

    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(calls).toHaveLength(0);
  });
});

describe('scopes', () => {
  it('offers the folders under the base path and keys them by oc:fileid', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK`,
      multistatus([
        { href: `${NC_ROOT}/TREK/`, collection: true, fileid: '59' },
        { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60' },
        { href: `${NC_ROOT}/TREK/notes.txt`, fileid: '61', size: 3, type: 'text/plain' },
      ]),
    );

    const result = await nextcloud.listScopes(ncConn);

    expect(result).toEqual({
      success: true,
      data: [{ scopeKey: 'fileid:60', label: 'trip 42', remoteRootId: '60', remoteRootPath: '/TREK/trip 42' }],
    });
  });

  it('answers an empty picker rather than an error when the base folder does not exist yet', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK`, reply('<d:error/>', { status: 404 }));

    expect(await nextcloud.listScopes(ncConn)).toEqual({ success: true, data: [] });
  });

  it('filters the picker by the query', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK`,
      multistatus([
        { href: `${NC_ROOT}/TREK/`, collection: true, fileid: '59' },
        { href: `${NC_ROOT}/TREK/Japan/`, collection: true, fileid: '60' },
        { href: `${NC_ROOT}/TREK/Peru/`, collection: true, fileid: '61' },
      ]),
    );

    const result = await nextcloud.listScopes(ncConn, 'jap');

    expect(result.success && result.data.map((option) => option.label)).toEqual(['Japan']);
  });

  it('re-bases an OpenCloud space on the entered origin and drops the virtual share drive', async () => {
    route(
      'GET /graph/v1.0/me/drives',
      reply(
        JSON.stringify({
          value: [
            drive('shares$1', 'Shares', 'virtual', 'https://internal.lan:9200/dav/spaces/shares$1'),
            drive(OC_DRIVE, 'TREK Trip 42', 'project', `https://internal.lan:9200${OC_ROOT}`),
          ],
        }),
      ),
    );

    const result = await opencloud.listScopes(ocConn);

    expect(result).toEqual({
      success: true,
      data: [
        {
          scopeKey: `drive:${OC_DRIVE}`,
          label: 'TREK Trip 42',
          remoteRootId: OC_DRIVE,
          remoteRootPath: `${OC_ORIGIN}${OC_ROOT}`,
        },
      ],
    });
  });

  it('creates the base folder when it is missing and reads the new id back', async () => {
    route(
      `MKCOL ${NC_ROOT}/TREK/Japan%202026`,
      reply(null, { status: 409 }),
      reply(null, { status: 201 }),
    );
    route(`MKCOL ${NC_ROOT}/TREK`, reply(null, { status: 201 }));
    route(
      `PROPFIND ${NC_ROOT}/TREK/Japan%202026`,
      multistatus([{ href: `${NC_ROOT}/TREK/Japan%202026/`, collection: true, fileid: '73' }]),
    );

    const result = await nextcloud.createScope(ncConn, 'Japan 2026');

    expect(result).toMatchObject({ success: true, data: { scopeKey: 'fileid:73', remoteRootPath: '/TREK/Japan 2026' } });
    expect(requests('MKCOL').map(pathOf)).toEqual([
      `${NC_ROOT}/TREK/Japan%202026`,
      `${NC_ROOT}/TREK`,
      `${NC_ROOT}/TREK/Japan%202026`,
    ]);
  });

  it('refuses to hand back a folder somebody else already made', async () => {
    route(`MKCOL ${NC_ROOT}/TREK/Japan`, reply(null, { status: 405 }));

    expect(await nextcloud.createScope(ncConn, 'Japan')).toMatchObject({
      success: false,
      error: { code: 'conflict' },
    });
  });

  it('replaces the characters Nextcloud refuses instead of failing the whole folder', async () => {
    route(`MKCOL ${NC_ROOT}/TREK/Japan-%202026`, reply(null, { status: 201 }));
    route(
      `PROPFIND ${NC_ROOT}/TREK/Japan-%202026`,
      multistatus([{ href: `${NC_ROOT}/TREK/Japan-%202026/`, collection: true, fileid: '74' }]),
    );

    const result = await nextcloud.createScope(ncConn, 'Japan: 2026');

    expect(result.success && result.data.label).toBe('Japan- 2026');
  });

  it('creates an OpenCloud space as a project drive', async () => {
    route(
      'POST /graph/v1.0/drives',
      reply(JSON.stringify(drive('storage-1$new', 'Japan', 'project', `https://internal.lan:9200/dav/spaces/storage-1$new`)), {
        status: 201,
      }),
    );

    const result = await opencloud.createScope(ocConn, 'Japan');

    expect(result).toMatchObject({ success: true, data: { scopeKey: 'drive:storage-1$new' } });
    expect(JSON.parse(calls[0].body ?? '{}')).toEqual({ name: 'Japan', driveType: 'project' });
  });

  it('calls a folder with the same path but a different id scope_missing', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042`,
      multistatus([{ href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '99' }]),
    );

    const result = await nextcloud.resolveScope(ncConn, ncScope);

    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
    expect(result.success === false && result.error.detail).toContain('99');
  });

  it('reports a deleted space as scope_missing rather than as a broken connection', async () => {
    route(`GET /graph/v1.0/drives/${encodeURIComponent(OC_DRIVE)}`, reply('{"error":{}}', { status: 404 }));

    expect(await opencloud.resolveScope(ocConn, ocScope)).toMatchObject({
      success: false,
      error: { code: 'scope_missing' },
    });
  });

  it('rejects a scope key that belongs to another provider', async () => {
    const result = await nextcloud.list(ncConn, { ...ncScope, scopeKey: 'drive:storage$x' });

    expect(result).toMatchObject({ success: false, error: { code: 'scope_missing' } });
    expect(calls).toHaveLength(0);
  });
});

describe('list', () => {
  const listing = () =>
    multistatus([
      { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root-1"' },
      {
        href: `${NC_ROOT}/TREK/trip%2042/sub/`,
        collection: true,
        fileid: '62',
        etag: '"sub-1"',
      },
      {
        href: `${NC_ROOT}/TREK/trip%2042/pass.pdf`,
        fileid: '61',
        etag: '"doc-1"',
        size: 1234,
        type: 'application/pdf',
        modified: 'Tue, 14 Nov 2023 22:13:20 GMT',
        checksums: `SHA256:${'b'.repeat(64)}`,
      },
    ]);

  it('enumerates documents only, never the root and never a sub-folder', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, listing());

    const result = await nextcloud.list(ncConn, ncScope);

    expect(result.success && result.data.documents).toEqual([
      {
        remoteId: '61',
        name: 'pass.pdf',
        size: 1234,
        mimeType: 'application/pdf',
        remoteVersion: '"doc-1"',
        contentHash: 'b'.repeat(64),
        remoteModifiedAt: '2023-11-14T22:13:20.000Z',
        isDeleted: false,
      },
    ]);
    expect(result.success && result.data.cursor).toBe('"root-1"');
    expect(result.success && result.data.truncated).toBe(false);
  });

  it('skips the walk entirely when the root ETag has not moved', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, multistatus([
      { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root-1"' },
    ]));

    const result = await nextcloud.list(ncConn, { ...ncScope, cursor: '"root-1"' });

    expect(result).toEqual({
      success: true,
      data: { documents: [], cursor: '"root-1"', cursorUnchanged: true, truncated: false },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].headers.depth).toBe('0');
  });

  it('walks after the cursor probe shows a different root ETag', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042`,
      multistatus([{ href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root-2"' }]),
      listing(),
    );

    const result = await nextcloud.list(ncConn, { ...ncScope, cursor: '"root-1"' });

    expect(result.success && result.data.cursorUnchanged).toBe(false);
    expect(calls.map((call) => call.headers.depth)).toEqual(['0', '1']);
  });

  it('reads a checksum only when it really is a SHA256, so OpenCloud reports none', async () => {
    route(
      `PROPFIND ${OC_ROOT}`,
      multistatus([
        { href: `${OC_ROOT}/`, collection: true, fileid: `${OC_DRIVE}!root`, etag: '"root"' },
        {
          href: `${OC_ROOT}/pass.pdf`,
          fileid: `${OC_DRIVE}!doc`,
          etag: '"doc"',
          size: 10,
          type: 'application/pdf',
          checksums: 'SHA1:2117 MD5:eebe ADLER32:5f9f',
        },
      ]),
    );

    const result = await opencloud.list(ocConn, ocScope);

    expect(result.success && result.data.documents[0]).toMatchObject({
      remoteId: `${OC_DRIVE}!doc`,
      contentHash: null,
    });
  });

  it('reports a listing cut off at the size cap instead of failing the run', async () => {
    capBytes = 620;
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, listing());

    const result = await nextcloud.list(ncConn, ncScope);

    expect(result.success && result.data.truncated).toBe(true);
    expect(result.success && result.data.documents.length).toBeLessThanOrEqual(1);
  });

  it('turns a vanished folder into scope_missing rather than an empty trip', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, reply('<d:error/>', { status: 404 }));

    expect(await nextcloud.list(ncConn, ncScope)).toMatchObject({
      success: false,
      error: { code: 'scope_missing' },
    });
  });

  it('keeps a document without an oc:fileid addressable instead of dropping it', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042`,
      multistatus([
        { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root"' },
        { href: `${NC_ROOT}/TREK/trip%2042/pass.pdf`, etag: '"doc"', size: 1, type: 'application/pdf' },
      ]),
    );

    const result = await nextcloud.list(ncConn, ncScope);

    expect(result.success && result.data.documents[0].remoteId).toBe('path:pass.pdf');
  });
});

describe('push', () => {
  const uploaded = (req: Recorded) =>
    reply(null, {
      status: 201,
      headers: { 'oc-fileid': '00000062oc9fy1g5e2cj', 'oc-etag': `"${req.headers['x-oc-mtime']}"` },
    });

  it('pins the modification time and the checksum, and normalises the id Nextcloud answers with', async () => {
    route(`PUT ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, uploaded);
    route(`PROPPATCH ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, multistatus([
      { href: `${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, etag: '"x"' },
    ]));

    const result = await nextcloud.push(ncConn, ncScope, pushRequest());

    const put = requests('PUT')[0];
    expect(put.headers['x-oc-mtime']).toBe('1700000000');
    expect(put.headers['oc-checksum']).toBe(`SHA256:${'a'.repeat(64)}`);
    expect(put.headers['content-length']).toBe('5');
    // The header spells the id 00000062oc9fy1g5e2cj; the listing spells it 62,
    // and a mismatch here is a duplicate document on every run.
    expect(result).toMatchObject({
      success: true,
      data: { remoteId: '62', remoteModifiedAt: '2023-11-14T22:13:20.000Z', deduplicated: false },
    });
  });

  it('never sends a SHA256 checksum to OpenCloud, which answers 400 to one', async () => {
    route(`PUT ${OC_ROOT}/reiseplan.pdf`, reply(null, { status: 201, headers: { 'oc-fileid': 'd1', 'oc-etag': '"e1"' } }));
    route(`PROPPATCH ${OC_ROOT}/reiseplan.pdf`, multistatus([{ href: `${OC_ROOT}/reiseplan.pdf`, etag: '"e1"' }]));

    await opencloud.push(ocConn, ocScope, pushRequest());

    expect(requests('PUT')[0].headers['oc-checksum']).toBeUndefined();
    expect(requests('PUT')[0].headers['x-oc-mtime']).toBe('1700000000');
  });

  it('writes the TREK anchors as dead properties without letting a refusal undo the upload', async () => {
    route(`PUT ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, uploaded);
    route(`PROPPATCH ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, reply('<d:error/>', { status: 403 }));

    const result = await nextcloud.push(ncConn, ncScope, pushRequest());

    expect(result.success).toBe(true);
    expect(requests('PROPPATCH')[0].body).toContain('doc-1');
    expect(requests('PROPPATCH')[0].body).toContain('trip-1');
  });

  it('asks for the id and version a proxy stripped from the response', async () => {
    route(`PUT ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, reply(null, { status: 201 }));
    route(`PROPPATCH ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, multistatus([
      { href: `${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, etag: '"x"' },
    ]));
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`,
      multistatus([{ href: `${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, fileid: '62', etag: '"stored"', size: 5 }]),
    );

    const result = await nextcloud.push(ncConn, ncScope, pushRequest());

    expect(result).toMatchObject({ success: true, data: { remoteId: '62', remoteVersion: '"stored"' } });
  });

  it('sends If-Match when the core knows which version it is replacing, and reports 412 as a conflict', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042`,
      multistatus([
        { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root"' },
        { href: `${NC_ROOT}/TREK/trip%2042/pass.pdf`, fileid: '61', etag: '"doc-1"', size: 1, type: 'application/pdf' },
      ]),
    );
    route(`PUT ${NC_ROOT}/TREK/trip%2042/pass.pdf`, reply('<d:error/>', { status: 412 }));

    const result = await nextcloud.push(
      ncConn,
      ncScope,
      pushRequest({ remoteId: '61', expectedRemoteVersion: '"doc-1"', fileName: 'pass.pdf' }),
    );

    expect(requests('PUT')[0].headers['if-match']).toBe('"doc-1"');
    expect(result).toMatchObject({ success: false, error: { code: 'conflict', status: 412 } });
  });

  it('refuses to recreate a document that disappeared upstream', async () => {
    route(
      `PROPFIND ${NC_ROOT}/TREK/trip%2042`,
      multistatus([{ href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root"' }]),
    );

    const result = await nextcloud.push(ncConn, ncScope, pushRequest({ remoteId: '61' }));

    expect(result).toMatchObject({ success: false, error: { code: 'not_found' } });
    expect(requests('PUT')).toHaveLength(0);
  });

  it('maps a full quota to quota_exceeded rather than a generic failure', async () => {
    route(`PUT ${NC_ROOT}/TREK/trip%2042/reiseplan.pdf`, reply('<d:error/>', { status: 507 }));

    expect(await nextcloud.push(ncConn, ncScope, pushRequest())).toMatchObject({
      success: false,
      error: { code: 'quota_exceeded' },
    });
  });
});

describe('fetch, rename and trash', () => {
  const folder = () =>
    multistatus([
      { href: `${NC_ROOT}/TREK/trip%2042/`, collection: true, fileid: '60', etag: '"root"' },
      {
        href: `${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`,
        fileid: '61',
        etag: '"doc-1"',
        size: 5,
        type: 'application/pdf',
      },
    ]);

  it('streams a document back and reports the version it came with', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(
      `GET ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`,
      reply('the bytes', { headers: { 'content-length': '9', 'content-type': 'application/pdf', etag: '"doc-1"' } }),
    );

    const result = await nextcloud.fetch(ncConn, ncScope, '61');

    expect(result.success).toBe(true);
    if (!result.success) return;
    const chunks: Buffer[] = [];
    for await (const chunk of result.data.body) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toBe('the bytes');
    expect(result.data).toMatchObject({ size: 9, mimeType: 'application/pdf', remoteVersion: '"doc-1"' });
  });

  it('re-uses the listing it already walked instead of re-walking per document', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(`GET ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`, reply('x', { headers: { etag: '"doc-1"' } }));

    await nextcloud.list(ncConn, ncScope);
    await nextcloud.fetch(ncConn, ncScope, '61');

    expect(requests('PROPFIND')).toHaveLength(1);
  });

  it('refuses a download announcing more than TREK transfers, and one that arrives without a body', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(
      `GET ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`,
      reply('x', { headers: { 'content-length': String(3 * 1024 ** 3) } }),
      reply(null, { status: 200 }),
    );

    expect(await nextcloud.fetch(ncConn, ncScope, '61')).toMatchObject({
      success: false,
      error: { code: 'too_large', status: 200 },
    });
    expect(await nextcloud.fetch(ncConn, ncScope, '61')).toMatchObject({
      success: false,
      error: { code: 'provider_error', status: 200 },
    });
  });

  it('says not_found for an id the folder no longer holds', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());

    expect(await nextcloud.fetch(ncConn, ncScope, '999')).toMatchObject({
      success: false,
      error: { code: 'not_found' },
    });
  });

  it('renames inside the same folder and refuses to overwrite a namesake', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(`MOVE ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`, reply(null, { status: 201, headers: { 'oc-etag': '"doc-2"' } }));

    const result = await nextcloud.rename(ncConn, ncScope, '61', 'Reisepass 2026.pdf');

    const move = requests('MOVE')[0];
    expect(move.headers.destination).toBe(`${NC_ORIGIN}${NC_ROOT}/TREK/trip%2042/Reisepass%202026.pdf`);
    expect(move.headers.overwrite).toBe('F');
    expect(result).toEqual({ success: true, data: { remoteVersion: '"doc-2"' } });
  });

  it('reports a rename onto an existing name as a conflict', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(`MOVE ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`, reply('<d:error/>', { status: 412 }));

    expect(await nextcloud.rename(ncConn, ncScope, '61', 'anders.pdf')).toMatchObject({
      success: false,
      error: { code: 'conflict' },
    });
  });

  it('deletes into the recycle bin and treats an already-deleted document as done', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, folder());
    route(`DELETE ${NC_ROOT}/TREK/trip%2042/pass%20scan.pdf`, reply(null, { status: 204 }), reply('<d:error/>', { status: 404 }));

    expect(await nextcloud.trash(ncConn, ncScope, '61')).toEqual({ success: true, data: undefined });
    expect(await nextcloud.trash(ncConn, ncScope, '61')).toEqual({ success: true, data: undefined });
  });
});

describe('webhooks', () => {
  const OCS = '/ocs/v2.php/apps/webhook_listeners/api/v1/webhooks';

  it('registers one unfiltered subscription per event, form-encoded, with the secret as a header', async () => {
    route(`GET ${OCS}`, reply('{"ocs":{"data":[]}}'));
    let next = 10;
    route(`POST ${OCS}`, () => reply(JSON.stringify({ ocs: { data: { id: next++ } } })));

    const result = await nextcloud.registerWebhook(ncConn, ncScope, 'https://trek.example/hook', 's3cret');

    expect(result).toEqual({ success: true, data: { subscriptionId: '10,11,12,13' } });
    const bodies = requests('POST').map((call) => new URLSearchParams(call.body ?? ''));
    expect(requests('POST')[0].headers['content-type']).toBe('application/x-www-form-urlencoded');
    expect(bodies[0].get('httpMethod')).toBe('POST');
    expect(bodies[0].get('uri')).toBe('https://trek.example/hook');
    expect(bodies[0].get('authMethod')).toBe('header');
    // The header the endpoint actually reads. It used to be registered as
    // `X-TREK-Docsync-Signature` while doc-sync-webhook.controller looks for
    // `x-trek-docsync-secret`, so every webhook Nextcloud sent was dropped
    // without a trace: the subscription existed and the calls arrived.
    expect(bodies[0].get('authData[x-trek-docsync-secret]')).toBe('s3cret');
    // A $regex filter is not merely ignored upstream: it throws inside the
    // listener and stops delivery for every other webhook on that event.
    expect(bodies.every((body) => [...body.keys()].every((key) => !key.startsWith('eventFilter')))).toBe(true);
    expect(bodies.map((body) => body.get('event'))).toEqual([
      'OCP\\Files\\Events\\Node\\NodeCreatedEvent',
      'OCP\\Files\\Events\\Node\\NodeWrittenEvent',
      'OCP\\Files\\Events\\Node\\NodeDeletedEvent',
      'OCP\\Files\\Events\\Node\\NodeRenamedEvent',
    ]);
  });

  it('answers a non-admin account with forbidden and leaves the link polling', async () => {
    route(`GET ${OCS}`, reply('{}', { status: 403 }));

    const result = await nextcloud.registerWebhook(ncConn, ncScope, 'https://trek.example/hook', 's');

    expect(result).toMatchObject({ success: false, error: { code: 'forbidden' } });
    expect(requests('POST')).toHaveLength(0);
  });

  it('rolls back the subscriptions it already made when a later one fails', async () => {
    route(`GET ${OCS}`, reply('{"ocs":{"data":[]}}'));
    route(
      `POST ${OCS}`,
      reply(JSON.stringify({ ocs: { data: { id: 10 } } })),
      reply(JSON.stringify({ ocs: { data: { id: 11 } } })),
      reply('<ocs/>', { status: 500 }),
    );
    route(`DELETE ${OCS}/10`, reply(null, { status: 200 }));
    route(`DELETE ${OCS}/11`, reply(null, { status: 200 }));

    const result = await nextcloud.registerWebhook(ncConn, ncScope, 'https://trek.example/hook', 's');

    expect(result).toMatchObject({ success: false, error: { code: 'provider_error' } });
    expect(requests('DELETE').map(pathOf)).toEqual([`${OCS}/10`, `${OCS}/11`]);
  });

  it('tells an OpenCloud admin there is nothing to subscribe to instead of failing the connection', async () => {
    const result = await opencloud.registerWebhook(ocConn, ocScope, 'https://trek.example/hook', 's');

    expect(result).toMatchObject({ success: false, error: { code: 'forbidden' } });
    expect(calls).toHaveLength(0);
  });

  it('removes every subscription the id list names, tolerating one that is already gone', async () => {
    route(`DELETE ${OCS}/10`, reply(null, { status: 200 }));
    route(`DELETE ${OCS}/11`, reply('<ocs/>', { status: 404 }));

    expect(await nextcloud.unregisterWebhook(ncConn, '10,11')).toEqual({ success: true, data: undefined });
    expect(requests('DELETE')).toHaveLength(2);
  });
});

describe('failure classification', () => {
  it('separates a timeout, an untrusted certificate and a blocked host', async () => {
    const timeout = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }),
    });
    safeFetchMock.mockRejectedValueOnce(timeout);
    expect(await nextcloud.probe(ncConn)).toMatchObject({ success: false, error: { code: 'timeout' } });

    const tls = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('self-signed certificate'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }),
    });
    safeFetchMock.mockRejectedValueOnce(tls);
    expect(await nextcloud.probe(ncConn)).toMatchObject({ success: false, error: { code: 'tls_untrusted' } });

    safeFetchMock.mockRejectedValueOnce(new SsrfBlockedError('Requests to loopback are not allowed'));
    expect(await nextcloud.probe(ncConn)).toMatchObject({ success: false, error: { code: 'ssrf_blocked' } });

    safeFetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await nextcloud.probe(ncConn)).toMatchObject({ success: false, error: { code: 'unreachable' } });
  });

  it('keeps the upstream text in detail and out of the code', async () => {
    route(`PROPFIND ${NC_ROOT}`, reply('<s:message>Username or password was incorrect</s:message>', { status: 401 }));

    const result = await nextcloud.probe(ncConn);

    expect(result).toMatchObject({ success: false, error: { code: 'unauthorized' } });
    expect(result.success === false && result.error.detail).toContain('incorrect');
  });

  it('refuses a body that is not a multistatus instead of reading it as an empty folder', async () => {
    route(`PROPFIND ${NC_ROOT}/TREK/trip%2042`, reply('<html><body>Please log in</body></html>', { status: 207 }));

    expect(await nextcloud.list(ncConn, ncScope)).toMatchObject({
      success: false,
      error: { code: 'provider_error' },
    });
  });
});
