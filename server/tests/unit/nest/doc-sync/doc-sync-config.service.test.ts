/**
 * The configuration half of document sync: the connection a trip admin creates
 * and the binding that points it at a folder or a tag.
 *
 * The database here is real in-memory SQLite with the full schema, and the
 * at-rest crypto is real too. Both are deliberate. Almost everything this
 * service owns is either a credential or a decision about one, and a spy on
 * `db.run` would only prove that some strings were handed along. Reading the
 * row back is the assertion. A stubbed `maybe_encrypt_api_key` would let a
 * regression that stores a Paperless token in plaintext pass every case below.
 *
 * Only the SSRF guard is faked, because it resolves DNS: the guard is not what
 * is under test, and a suite that needs a working resolver is a suite that
 * fails on someone's train.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => undefined,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../../src/db/database', () => dbMock);

// The whole guard surface, not only `checkSsrf`: modules on the import graph
// pull other names off it, and a factory mock that omits one throws on access
// rather than falling back to the real export.
const { checkSsrf } = vi.hoisted(() => ({ checkSsrf: vi.fn() }));
vi.mock('../../../../src/utils/ssrfGuard', () => ({
  checkSsrf,
  safeFetch: vi.fn(),
  safeFetchFollow: vi.fn(),
  safeFetchAdminConfigured: vi.fn(),
  safeFetchLlm: vi.fn(),
  createPinnedDispatcher: vi.fn(() => ({})),
  SsrfBlockedError: class extends Error {},
}));

import { DOCSYNC_SECRET_MASK, type DocsyncConnectionInput, type DocsyncLinkInput } from '@trek/shared';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { resetTestDb } from '../../../helpers/test-db';
import { createTrip, createUser } from '../../../helpers/factories';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import {
  DocSyncConfigService,
  type ConnectionRow,
  type LinkRow,
} from '../../../../src/nest/doc-sync/doc-sync-config.service';
import type { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
// `if (!result.success)` does not narrow in this workspace: strictNullChecks is
// off, so the boolean discriminant stops discriminating. The domain's own
// predicate is what every call site uses instead.
import { docFailed } from '../../../../src/nest/doc-sync/document-provider';

const svc = new DocSyncConfigService(new DatabaseService(testDb), {} as DocumentProviderRegistry);

const TOKEN = 'paperless-token-1234';

let OWNER = 0;
let MEMBER = 0;
let TRIP = 0;

function connectionInput(over: Partial<DocsyncConnectionInput> = {}): DocsyncConnectionInput {
  return {
    providerId: 'paperless',
    baseUrl: 'https://paperless.example.com',
    credentials: { api_token: TOKEN },
    allowInsecureTls: false,
    ...over,
  };
}

async function connect(over: Partial<DocsyncConnectionInput> = {}, userId = OWNER): Promise<ConnectionRow> {
  const result = await svc.upsertConnection(TRIP, userId, connectionInput(over));
  if (docFailed(result)) throw new Error(`fixture connection refused: ${JSON.stringify(result.error)}`);
  return result.data;
}

function linkInput(connectionId: number, over: Partial<DocsyncLinkInput> = {}): DocsyncLinkInput {
  return {
    connectionId,
    scopeKey: 'tag:1',
    remoteLabel: 'Japan 2026',
    direction: 'both',
    deletePolicy: 'unlink',
    conflictPolicy: 'manual',
    syncEnabled: true,
    ...over,
  };
}

function link(connectionId: number, over: Partial<DocsyncLinkInput> = {}): LinkRow {
  const result = svc.createLink(TRIP, OWNER, linkInput(connectionId, over));
  if (docFailed(result)) throw new Error(`fixture link refused: ${JSON.stringify(result.error)}`);
  return result.data;
}

function storedSecret(connectionId: number): string | undefined {
  const row = svc.getConnection(connectionId) as ConnectionRow;
  return svc.toRef(row).secrets.api_token;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  // The document_* tables are not in resetTestDb's list, and they reference
  // trips and users, so they go first, before the rows they hang off vanish.
  testDb.exec('DELETE FROM document_sync_items; DELETE FROM trip_document_links; DELETE FROM document_connections;');
  resetTestDb(testDb);
  vi.clearAllMocks();
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false, resolvedIp: '203.0.113.10' });
  OWNER = createUser(testDb, { username: 'owner', email: 'owner@test.local' }).user.id;
  MEMBER = createUser(testDb, { username: 'member', email: 'member@test.local' }).user.id;
  TRIP = createTrip(testDb, OWNER, { title: 'Japan' }).id;
  testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(TRIP, MEMBER);
});

afterAll(() => {
  testDb.close();
});

describe('upsertConnection secrets', () => {
  it('keeps the stored credential when the form comes back with the field blank', async () => {
    const created = await connect();
    await connect({ credentials: { api_token: '' } });
    expect(storedSecret(created.id)).toBe(TOKEN);
  });

  it('keeps it when the form posts back the mask it was shown', async () => {
    // This is what makes a GET-then-PUT round trip safe: the client renders the
    // form from the masked view and never has to hold the real credential.
    const created = await connect();
    await connect({ credentials: { api_token: DOCSYNC_SECRET_MASK } });
    expect(storedSecret(created.id)).toBe(TOKEN);
  });

  it('keeps it when the field is missing from the payload altogether', async () => {
    const created = await connect();
    await connect({ credentials: {} });
    expect(storedSecret(created.id)).toBe(TOKEN);
  });

  it('replaces it when a new credential actually arrives', async () => {
    const created = await connect();
    await connect({ credentials: { api_token: 'rotated-token' } });
    expect(storedSecret(created.id)).toBe('rotated-token');
  });

  it('updates the trip\'s connection in place rather than adding a second one', async () => {
    const first = await connect();
    const second = await connect({ baseUrl: 'https://paperless.example.com/', credentials: {} });
    expect(second.id).toBe(first.id);
    const count = testDb
      .prepare('SELECT COUNT(*) AS n FROM document_connections WHERE trip_id = ?')
      .get(TRIP) as { n: number };
    expect(count.n).toBe(1);
  });

  it('carries a non-secret setting forward when a later save omits it', async () => {
    const created = await svc.upsertConnection(TRIP, OWNER, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: { login_name: 'anna', app_password: 'app-pw', base_path: '/TREK' },
      allowInsecureTls: false,
    });
    expect(created.success).toBe(true);

    await svc.upsertConnection(TRIP, OWNER, {
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: { login_name: 'anna' },
      allowInsecureTls: false,
    });
    const row = svc.listConnections(TRIP).find((c) => c.provider_id === 'nextcloud') as ConnectionRow;
    expect(svc.toRef(row).settings).toMatchObject({ login_name: 'anna', base_path: '/TREK' });
    expect(svc.toRef(row).secrets.app_password).toBe('app-pw');
  });
});

describe('publicConnection', () => {
  it('reports that a secret is set without ever carrying its value', async () => {
    const created = await connect();
    const view = svc.publicConnection(svc.getConnection(created.id) as ConnectionRow);
    expect(view.secrets).toEqual({ api_token: DOCSYNC_SECRET_MASK });
    expect(JSON.stringify(view)).not.toContain(TOKEN);
  });

  it('leaves a secret it has no value for out of the map entirely', async () => {
    // Masking an unset field would tell the client "already configured" and the
    // connection form would render an optional credential as one that is done.
    const created = await svc.upsertConnection(TRIP, OWNER, {
      providerId: 'synologydrive',
      baseUrl: 'https://nas.example.com:5001',
      credentials: { username: 'anna', password: 'nas-pw' },
      allowInsecureTls: false,
    });
    expect(created.success).toBe(true);
    const row = svc.listConnections(TRIP).find((c) => c.provider_id === 'synologydrive') as ConnectionRow;
    expect(svc.publicConnection(row).secrets).toEqual({ password: DOCSYNC_SECRET_MASK });
  });

  it('reads a capabilities blob left behind by another build as unknown, not as a crash', async () => {
    const created = await connect();
    testDb.prepare('UPDATE document_connections SET capabilities = ? WHERE id = ?').run('{not json', created.id);
    const view = svc.publicConnection(svc.getConnection(created.id) as ConnectionRow);
    expect(view.capabilities).toBeNull();
  });
});

describe('a secret the provider earned itself', () => {
  // The shape the Synology adapter stores: account digest, colon, DSM's token.
  const EARNED = 'a1b2c3:DEVICE-7';

  function nas(credentials: Record<string, string> = { username: 'anna', password: 'nas-pw', otp_code: '123456' }) {
    return connect({ providerId: 'synologydrive', baseUrl: 'https://nas.example.com:5001', credentials });
  }

  function secretsOf(connectionId: number): Readonly<Record<string, string>> {
    return svc.toRef(svc.getConnection(connectionId) as ConnectionRow).secrets;
  }

  it('is stored through the ref the adapter was handed, encrypted with the form\'s secrets', async () => {
    const conn = await nas();
    svc.toRef(conn).saveSecret!('device_token', EARNED);

    expect(secretsOf(conn.id)).toEqual({ password: 'nas-pw', otp_code: '123456', device_token: EARNED });
    expect((svc.getConnection(conn.id) as ConnectionRow).secrets).not.toContain('DEVICE-7');
  });

  it('never reaches a client, not even as a mask', async () => {
    const conn = await nas();
    svc.saveEarnedSecret(conn.id, 'device_token', EARNED);
    const view = svc.publicConnection(svc.getConnection(conn.id) as ConnectionRow);

    expect(view.secrets).toEqual({ password: DOCSYNC_SECRET_MASK, otp_code: DOCSYNC_SECRET_MASK });
    expect(JSON.stringify(view)).not.toContain('DEVICE-7');
    expect(JSON.stringify(view)).not.toContain('device_token');
  });

  it('survives a form edit, whatever the form sends for the secrets it does show', async () => {
    const conn = await nas();
    svc.saveEarnedSecret(conn.id, 'device_token', EARNED);
    await nas({ username: 'anna', password: 'rotated', otp_code: '' });
    await nas({ username: 'anna', password: DOCSYNC_SECRET_MASK });

    expect(secretsOf(conn.id)).toMatchObject({ password: 'rotated', device_token: EARNED });
  });

  it('cannot be planted or overwritten through the form', async () => {
    const conn = await nas();
    await nas({ username: 'anna', device_token: 'a1b2c3:PLANTED' });
    expect(secretsOf(conn.id).device_token).toBeUndefined();

    svc.saveEarnedSecret(conn.id, 'device_token', EARNED);
    await nas({ username: 'anna', device_token: 'a1b2c3:PLANTED' });
    expect(secretsOf(conn.id).device_token).toBe(EARNED);
    expect(svc.toRef(svc.getConnection(conn.id) as ConnectionRow).settings).not.toHaveProperty('device_token');
  });

  it('is written against the row as it is now, so a run holding an old ref cannot undo a password edit', async () => {
    const conn = await nas();
    const ref = svc.toRef(conn);
    await nas({ username: 'anna', password: 'rotated' });
    ref.saveSecret!('device_token', EARNED);

    expect(secretsOf(conn.id)).toMatchObject({ password: 'rotated', device_token: EARNED });
  });

  it('is dropped with null, and the form\'s secrets stay', async () => {
    const conn = await nas();
    svc.saveEarnedSecret(conn.id, 'device_token', EARNED);
    svc.saveEarnedSecret(conn.id, 'device_token', null);

    expect(secretsOf(conn.id)).toEqual({ password: 'nas-pw', otp_code: '123456' });
  });

  it('brings back no connection that was deleted while a run still held its ref', async () => {
    const conn = await nas();
    const ref = svc.toRef(conn);
    svc.deleteConnection(conn.id);

    ref.saveSecret!('device_token', EARNED);
    expect(svc.getConnection(conn.id)).toBeUndefined();
  });
});

describe('validateBaseUrl', () => {
  it('stores a private address, because a self-hosted instance is the point', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: true, error: 'private network' });
    const verdict = await svc.validateBaseUrl('https://paperless.fritz.box');
    expect(verdict).toEqual({ success: true, data: { url: 'https://paperless.fritz.box', isPrivate: true } });

    const created = await connect({ baseUrl: 'https://paperless.fritz.box' });
    expect(created.base_url).toBe('https://paperless.fritz.box');
  });

  it('refuses an address the guard rejects for any other reason, and writes nothing', async () => {
    checkSsrf.mockResolvedValue({ allowed: false, isPrivate: false, error: 'Could not resolve hostname (ENOTFOUND)' });
    const result = await svc.upsertConnection(TRIP, OWNER, connectionInput({ baseUrl: 'https://nope.invalid' }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('ssrf_blocked');
    expect(svc.listConnections(TRIP)).toHaveLength(0);
  });

  it('strips trailing slashes so the adapter can append its own path', async () => {
    const created = await connect({ baseUrl: 'https://paperless.example.com///' });
    expect(created.base_url).toBe('https://paperless.example.com');
  });

  it('refuses an empty address before it asks the guard anything', async () => {
    const result = await svc.validateBaseUrl('   ');
    expect(result.success).toBe(false);
    expect(checkSsrf).not.toHaveBeenCalled();
  });
});

describe('upsertConnection required fields', () => {
  it('names the missing credential instead of storing a connection that cannot authenticate', async () => {
    const result = await svc.upsertConnection(TRIP, OWNER, connectionInput({ credentials: {} }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.detail).toContain('api_token');
    expect(svc.listConnections(TRIP)).toHaveLength(0);
  });

  it('refuses a missing required field that is not a secret either', async () => {
    const result = await svc.upsertConnection(TRIP, OWNER, {
      providerId: 'papra',
      baseUrl: 'https://papra.example.com',
      credentials: { api_key: 'ppapi_x' },
      allowInsecureTls: false,
    });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.detail).toContain('organization_id');
  });

  it('accepts a provider whose optional credential is left blank', async () => {
    // Synology's OTP is a one-time code, not a stored credential; demanding it
    // would make every save after the first one impossible.
    const result = await svc.upsertConnection(TRIP, OWNER, {
      providerId: 'synologydrive',
      baseUrl: 'https://nas.example.com:5001',
      credentials: { username: 'anna', password: 'nas-pw', otp_code: '' },
      allowInsecureTls: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('enabledProviderIds', () => {
  it('names only the providers an admin switched on, in the order the shelf shows them', () => {
    // Every document provider ships OFF, so an empty answer on a fresh install
    // is the correct one and a non-empty one would be a policy change.
    expect(svc.enabledProviderIds()).toEqual([]);
    testDb.prepare("UPDATE document_providers SET enabled = 1 WHERE id IN ('nextcloud', 'paperless')").run();
    expect(svc.enabledProviderIds()).toEqual(['paperless', 'nextcloud']);
  });
});

describe('recordProbe', () => {
  it('keeps what the last good probe learned when a later one fails', async () => {
    // A token that expired overnight must not make TREK forget that this
    // instance can accept uploads; the capabilities describe the provider, not
    // the state of the credential.
    const conn = await connect();
    svc.recordProbe(conn.id, 'ok', null, { push: 'multipart' });
    svc.recordProbe(conn.id, 'failed', '401 Unauthorized', null);

    const view = svc.publicConnection(svc.getConnection(conn.id) as ConnectionRow);
    expect(view).toMatchObject({
      lastProbeState: 'failed',
      lastProbeError: '401 Unauthorized',
      capabilities: { push: 'multipart' },
    });
  });
});

describe('deleteConnection', () => {
  it('drops the bindings that hung off it and leaves the other connection alone', async () => {
    const doomed = await connect();
    const kept = await connect({
      providerId: 'nextcloud',
      baseUrl: 'https://cloud.example.com',
      credentials: { login_name: 'anna', app_password: 'app-pw' },
    });
    const doomedLink = link(doomed.id, { scopeKey: 'tag:1' });
    const keptLink = link(kept.id, { scopeKey: 'folder:1' });
    testDb
      .prepare('INSERT INTO document_sync_items (link_id, trip_id, trek_doc_uid) VALUES (?, ?, ?)')
      .run(doomedLink.id, TRIP, 'uid-a');

    svc.deleteConnection(doomed.id);

    expect(svc.getConnection(doomed.id)).toBeUndefined();
    expect(svc.listLinks(TRIP).map((l) => l.id)).toEqual([keptLink.id]);
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM document_sync_items').get()).toEqual({ n: 0 });
  });
});

describe('toRef', () => {
  it('names the row and not only its id, which a backup restored in place hands out again', async () => {
    const first = await connect();
    testDb.prepare("UPDATE document_connections SET created_at = '2026-09-01 08:00:00' WHERE id = ?").run(first.id);
    const before = svc.toRef(svc.getConnection(first.id) as ConnectionRow);

    // What the restore of an older backup does to this table: the row is gone
    // and the id sequence is back where it stood before the row was made.
    testDb.prepare('DELETE FROM document_connections WHERE id = ?').run(first.id);
    testDb.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'document_connections'").run(first.id - 1);
    const after = svc.toRef(await connect());

    expect(after.connectionId).toBe(before.connectionId);
    expect(before.createdAt).toBe('2026-09-01 08:00:00');
    expect(after.createdAt).not.toBe(before.createdAt);
  });
});

describe('updateLink', () => {
  it('changes only the fields the patch names', async () => {
    const conn = await connect();
    const created = link(conn.id, { direction: 'both', conflictPolicy: 'manual' });
    const patched = svc.updateLink(created.id, { direction: 'pull', syncEnabled: false });
    expect(patched).toMatchObject({
      direction: 'pull',
      sync_enabled: 0,
      conflict_policy: 'manual',
      remote_label: created.remote_label,
    });
  });

  it('hands back the binding untouched when the patch is empty', async () => {
    const conn = await connect();
    const created = link(conn.id);
    expect(svc.updateLink(created.id, {})).toEqual(created);
  });
});

describe('toScopeRef', () => {
  it('hands the adapter the anchor and the cursor of that binding, each in its own field', async () => {
    // The adapters take a ref object rather than positional arguments because
    // an id and a path swapped compile cleanly and then read the wrong folder.
    const conn = await connect();
    const created = svc.createLink(
      TRIP,
      OWNER,
      linkInput(conn.id, { scopeKey: 'fileid:437', remoteRootId: '437', remoteRootPath: '/TREK/japan' }),
    );
    expect(created.success).toBe(true);
    const row = created.success ? created.data : ({} as LinkRow);
    testDb.prepare('UPDATE trip_document_links SET remote_cursor = ? WHERE id = ?').run('etag-9', row.id);

    expect(svc.toScopeRef(svc.getLink(row.id) as LinkRow)).toEqual({
      linkId: row.id,
      tripId: TRIP,
      scopeKey: 'fileid:437',
      remoteRootId: '437',
      remoteRootPath: '/TREK/japan',
      cursor: 'etag-9',
    });
  });
});

describe('createLink', () => {
  it('returns the binding that already exists rather than making a second one', async () => {
    const conn = await connect();
    const first = link(conn.id);
    const again = svc.createLink(TRIP, MEMBER, linkInput(conn.id, { remoteLabel: 'renamed' }));
    expect(again.success && again.data.id).toBe(first.id);
    expect(svc.listLinks(TRIP)).toHaveLength(1);
  });

  it('binds a second scope of the same connection separately', async () => {
    const conn = await connect();
    const first = link(conn.id, { scopeKey: 'tag:1' });
    const second = link(conn.id, { scopeKey: 'tag:2' });
    expect(second.id).not.toBe(first.id);
    expect(svc.listLinks(TRIP)).toHaveLength(2);
  });

  it('refuses a connection that belongs to somebody else\'s trip', async () => {
    const otherTrip = createTrip(testDb, MEMBER, { title: 'Not yours' }).id;
    const conn = await connect();
    const result = svc.createLink(otherTrip, MEMBER, linkInput(conn.id));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.code).toBe('not_found');
    expect(svc.listLinks(otherTrip)).toHaveLength(0);
  });

  it('refuses a connection id that does not exist at all', async () => {
    const result = svc.createLink(TRIP, OWNER, linkInput(9999));
    expect(result.success).toBe(false);
  });

  it('stores the anchor the picker sent back with the scope key', async () => {
    const conn = await connect();
    const result = svc.createLink(
      TRIP,
      OWNER,
      linkInput(conn.id, { remoteRootId: '17', remoteRootPath: '/TREK/japan', remoteLabel: 'Japan 2026' }),
    );
    expect(result.success && result.data).toMatchObject({
      remote_scope_key: 'tag:1',
      remote_root_id: '17',
      remote_root_path: '/TREK/japan',
      remote_label: 'Japan 2026',
    });
  });

  it('stores NULL for an anchor field the client left out', async () => {
    // Synology binds by path alone, so its options carry no root id at all.
    const conn = await connect();
    const result = svc.createLink(TRIP, OWNER, linkInput(conn.id));
    expect(result.success && result.data).toMatchObject({ remote_root_id: null, remote_root_path: null });
  });

  it('gives every binding its own webhook token and keeps the secret out of the public view', async () => {
    // A leaked webhook URL has to identify exactly one binding, so revoking one
    // cannot be used to poke another.
    const conn = await connect();
    const first = link(conn.id, { scopeKey: 'tag:1' });
    const second = link(conn.id, { scopeKey: 'tag:2' });
    expect(first.webhook_token).toBeTruthy();
    expect(second.webhook_token).not.toBe(first.webhook_token);
    expect(svc.getLinkByToken(first.webhook_token as string)?.id).toBe(first.id);

    const secret = svc.webhookSecret(first);
    expect(secret).toBeTruthy();
    const view = svc.publicLink(first, 'https://trek.example.com');
    expect(view.webhookSecret).toBe(DOCSYNC_SECRET_MASK);
    expect(JSON.stringify(view)).not.toContain(secret);
  });
});

describe('publicLink', () => {
  it('names the store of a binding whose provider the admin has since switched off', async () => {
    // The client only learns names for the providers that are on, so this is
    // the one place a binding left behind can still get its name from.
    const conn = await connect();
    const bound = link(conn.id);
    testDb.prepare("UPDATE document_providers SET enabled = 0 WHERE id = 'paperless'").run();

    expect(svc.publicLink(bound, null)).toMatchObject({ providerId: 'paperless', providerName: 'Paperless-ngx' });
  });

  it('falls back to the provider id for a provider this build does not know', async () => {
    const conn = await connect();
    const bound = link(conn.id);
    expect(svc.publicLink({ ...bound, provider_id: 'dropbox' }, null).providerName).toBe('dropbox');
  });
});

describe('deleteLink', () => {
  it('takes the pairing rows with it and leaves the other binding\'s alone', async () => {
    const conn = await connect();
    const doomed = link(conn.id, { scopeKey: 'tag:1' });
    const kept = link(conn.id, { scopeKey: 'tag:2' });
    const insert = testDb.prepare(
      'INSERT INTO document_sync_items (link_id, trip_id, trek_doc_uid) VALUES (?, ?, ?)',
    );
    insert.run(doomed.id, TRIP, 'uid-a');
    insert.run(doomed.id, TRIP, 'uid-b');
    insert.run(kept.id, TRIP, 'uid-c');

    svc.deleteLink(doomed.id);

    expect(svc.getLink(doomed.id)).toBeUndefined();
    expect(svc.getLink(kept.id)).toBeDefined();
    const rows = testDb.prepare('SELECT link_id FROM document_sync_items').all() as { link_id: number }[];
    expect(rows.map((r) => r.link_id)).toEqual([kept.id]);
  });

  it('leaves the connection behind, so unbinding one scope does not log the trip out', async () => {
    const conn = await connect();
    svc.deleteLink(link(conn.id).id);
    expect(svc.getConnection(conn.id)).toBeDefined();
  });
});

describe('markOrphanedLinks', () => {
  async function bind(ownerUserId: number, providerId: 'paperless' | 'nextcloud'): Promise<LinkRow> {
    const credentials =
      providerId === 'paperless' ? { api_token: TOKEN } : { login_name: 'anna', app_password: 'app-pw' };
    const conn = await connect({ providerId, credentials, baseUrl: `https://${providerId}.example.com` }, ownerUserId);
    return link(conn.id, { scopeKey: `scope:${providerId}` });
  }

  it('disables the binding whose credential owner left the trip', async () => {
    const orphan = await bind(MEMBER, 'paperless');
    testDb.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(TRIP, MEMBER);

    expect(svc.markOrphanedLinks()).toBe(1);
    expect(svc.getLink(orphan.id)).toMatchObject({ last_sync_state: 'orphaned', sync_enabled: 0 });
  });

  it('counts the trip owner as being on the trip, although no membership row says so', async () => {
    // TREK's owner has no trip_members row; reading membership without the
    // owner would orphan every binding the trip admin created, which is most
    // of them.
    const mine = await bind(OWNER, 'paperless');
    expect(svc.markOrphanedLinks()).toBe(0);
    expect(svc.getLink(mine.id)).toMatchObject({ last_sync_state: 'never', sync_enabled: 1 });
  });

  it('leaves a still-valid binding alone while orphaning the one beside it', async () => {
    const orphan = await bind(MEMBER, 'paperless');
    const kept = await bind(OWNER, 'nextcloud');
    testDb.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(TRIP, MEMBER);

    expect(svc.markOrphanedLinks()).toBe(1);
    expect(svc.getLink(orphan.id)?.last_sync_state).toBe('orphaned');
    expect(svc.getLink(kept.id)).toMatchObject({ last_sync_state: 'never', sync_enabled: 1 });
  });

  it('counts nothing on a second sweep, so the job stays quiet after the first one', async () => {
    await bind(MEMBER, 'paperless');
    testDb.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(TRIP, MEMBER);
    expect(svc.markOrphanedLinks()).toBe(1);
    expect(svc.markOrphanedLinks()).toBe(0);
  });

  it('does not touch a binding the user had already switched off', async () => {
    const paused = await bind(MEMBER, 'paperless');
    svc.updateLink(paused.id, { syncEnabled: false });
    testDb.prepare('DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?').run(TRIP, MEMBER);

    expect(svc.markOrphanedLinks()).toBe(0);
    expect(svc.getLink(paused.id)?.last_sync_state).toBe('never');
  });
});
