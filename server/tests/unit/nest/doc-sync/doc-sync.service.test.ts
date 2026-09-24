/**
 * DocSyncService against a real in-memory database.
 *
 * The planner is tested as plain data next door. This file is about the half
 * that cannot be: what the reconciler writes, what it refuses to do, and what
 * it never asks a provider for. Those are statements about SQL and about call
 * order, so the schema comes from the real migration array and every row is
 * read back with plain SQL rather than through the service that wrote it.
 *
 * The provider is a fake because a unit test must not open a socket. Storage
 * and the files domain are fakes because the bytes are not what is under test,
 * but the fake files service writes real `trip_files` rows, so "nothing was
 * downloaded" is asserted against the table the file manager reads, not against
 * a spy alone.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

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
      canAccessTrip: () => null,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../../src/db/database', () => dbMock);

import type { DocsyncErrorCode } from '@trek/shared';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { createTrip, createUser } from '../../../helpers/factories';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { AllowedFileTypesService } from '../../../../src/nest/files/allowed-file-types.service';
import { MAX_FILE_SIZE } from '../../../../src/nest/files/files.constants';
import { DocSyncConfigService, type LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
import { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import { LINK_CIRCUIT_OPEN_AFTER, MAX_TRANSFERS_PER_RUN } from '../../../../src/nest/doc-sync/doc-sync.constants';
import type {
  DocFailure,
  DocResult,
  DocumentConnectionRef,
  DocumentProvider,
  DocumentProviderCapabilities,
  DocumentScopeOption,
  DocumentScopeRef,
  FetchResult,
  PushRequest,
  PushResult,
  RemoteDocument,
} from '../../../../src/nest/doc-sync/document-provider';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import type { FilesService } from '../../../../src/nest/files/files.service';
import type { StorageService } from '../../../../src/nest/storage/storage.service';
import type { RealtimeService } from '../../../../src/nest/realtime/realtime.service';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FILE_BYTES = Buffer.from('trek-document-bytes');
const FILE_SHA = crypto.createHash('sha256').update(FILE_BYTES).digest('hex');

type Listing = { documents: RemoteDocument[]; cursor: string | null; cursorUnchanged: boolean; truncated: boolean };

const ok = <T>(data: T): DocResult<T> => ({ success: true, data });
const fail = (code: DocsyncErrorCode, status?: number): DocFailure => ({ success: false, error: { code, status } });

const SCOPE: DocumentScopeOption = {
  scopeKey: 'tag:1',
  label: 'Japan 2026',
  remoteRootId: '1',
  remoteRootPath: '/TREK/japan',
};

const BASE_CAPABILITIES: DocumentProviderCapabilities = {
  push: 'none',
  stableId: true,
  remoteTrash: true,
  replaceInPlace: true,
  contentHashInListing: true,
  maxUploadBytes: null,
  acceptedMimeTypes: null,
  canCreateScope: true,
};

let capabilities: DocumentProviderCapabilities = { ...BASE_CAPABILITIES };

const remoteDoc = (over: Partial<RemoteDocument> = {}): RemoteDocument => ({
  remoteId: 'r1',
  name: 'boarding.pdf',
  size: 1024,
  mimeType: 'application/pdf',
  remoteVersion: 'v1',
  contentHash: null,
  remoteModifiedAt: '2026-09-18T10:00:00Z',
  isDeleted: false,
  ...over,
});

const listing = (documents: RemoteDocument[] = [], over: Partial<Listing> = {}): Listing => ({
  documents,
  cursor: 'cursor-1',
  cursorUnchanged: false,
  truncated: false,
  ...over,
});

const provider = {
  id: 'paperless',
  capabilities: vi.fn((): DocumentProviderCapabilities => capabilities),
  probe: vi.fn(async (): Promise<DocResult<{ account: string; capabilities: DocumentProviderCapabilities }>> =>
    ok({ account: 'test', capabilities })),
  listScopes: vi.fn(async (): Promise<DocResult<DocumentScopeOption[]>> => ok([SCOPE])),
  createScope: vi.fn(async (): Promise<DocResult<DocumentScopeOption>> => ok(SCOPE)),
  resolveScope: vi.fn(async (): Promise<DocResult<DocumentScopeOption>> => ok(SCOPE)),
  list: vi.fn(async (_conn: DocumentConnectionRef, _scope: DocumentScopeRef): Promise<DocResult<Listing>> => ok(listing())),
  fetch: vi.fn(async (): Promise<DocResult<FetchResult>> =>
    ok({ body: Readable.from([FILE_BYTES]), size: FILE_BYTES.length, mimeType: 'application/pdf', remoteVersion: 'v9' })),
  push: vi.fn(async (
    _conn: DocumentConnectionRef,
    _scope: DocumentScopeRef,
    _req: PushRequest,
  ): Promise<DocResult<PushResult>> =>
    ok({ remoteId: 'r-pushed', remoteVersion: 'v1', remoteModifiedAt: null, deduplicated: false })),
  rename: vi.fn(async (
    _conn: DocumentConnectionRef,
    _scope: DocumentScopeRef,
    _remoteId: string,
    _name: string,
  ): Promise<DocResult<{ remoteVersion: string }>> => ok({ remoteVersion: 'v2' })),
  trash: vi.fn(async (_conn: DocumentConnectionRef, _scope: DocumentScopeRef, _remoteId: string): Promise<DocResult<void>> =>
    ok(undefined)),
};

const storage = {
  spoolDirFor: vi.fn((): string => spoolDir),
  put: vi.fn(async (): Promise<void> => undefined),
  // A fresh stream per call: the push path reads the object twice, once to hash
  // and once to send, and a shared Readable would arrive already consumed.
  getStream: vi.fn(async () => ({ stream: Readable.from([FILE_BYTES]), stat: { size: FILE_BYTES.length } })),
} as unknown as StorageService;

const files = {
  getFileById: vi.fn((id: string | number, tripId: string | number) =>
    testDb.prepare('SELECT * FROM trip_files WHERE id = ? AND trip_id = ?').get(id, tripId)),
  createFile: vi.fn((
    tripId: string | number,
    file: { filename: string; originalname: string; size: number; mimetype: string },
    uploadedBy: number,
    opts: { place_id?: string | number | null; reservation_id?: string | number | null; description?: string | null } = {},
  ) => {
    const info = testDb
      .prepare(
        `INSERT INTO trip_files (trip_id, place_id, reservation_id, filename, original_name, file_size, mime_type, description, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        tripId, opts.place_id || null, opts.reservation_id || null,
        file.filename, file.originalname, file.size, file.mimetype, opts.description || null, uploadedBy || null,
      );
    return testDb.prepare('SELECT * FROM trip_files WHERE id = ?').get(info.lastInsertRowid);
  }),
  // Writes for real, like the two above: a double that answers but changes
  // nothing lets a missing call pass as a passing test.
  softDeleteFile: vi.fn((id: string | number) => {
    testDb.prepare('UPDATE trip_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }),
} as unknown as FilesService;

const realtime = { broadcast: vi.fn() } as unknown as RealtimeService;

let spoolDir: string;
let ownerId: number;
let tripId: number;
let connectionId: number;
let service: DocSyncService;
let config: DocSyncConfigService;

// ── Row builders ─────────────────────────────────────────────────────────────

let scopeSeq = 0;
function makeLink(over: {
  direction?: string;
  deletePolicy?: string;
  conflictPolicy?: string;
  syncEnabled?: number;
  failureCount?: number;
  nextAttemptAt?: string | null;
  lastSyncAt?: string | null;
  providerId?: string;
} = {}): LinkRow {
  scopeSeq += 1;
  const info = testDb
    .prepare(
      `INSERT INTO trip_document_links
         (trip_id, connection_id, provider_id, remote_scope_key, remote_root_id, remote_root_path, remote_label,
          direction, delete_policy, conflict_policy, sync_enabled, failure_count, next_attempt_at, created_by)
       VALUES (?, ?, ?, ?, '1', '/TREK/japan', 'Japan 2026', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      tripId, connectionId, over.providerId ?? 'paperless', `tag:${scopeSeq}`,
      over.direction ?? 'both', over.deletePolicy ?? 'unlink', over.conflictPolicy ?? 'manual',
      over.syncEnabled ?? 1, over.failureCount ?? 0, over.nextAttemptAt ?? null, ownerId,
    );
  if (over.lastSyncAt !== undefined) {
    testDb.prepare('UPDATE trip_document_links SET last_sync_at = ? WHERE id = ?')
      .run(over.lastSyncAt, Number(info.lastInsertRowid));
  }
  return config.getLink(Number(info.lastInsertRowid));
}

let uidSeq = 0;
function seedItem(link: LinkRow, over: {
  remoteId?: string;
  remoteName?: string;
  remoteVersion?: string;
  fileId?: number;
  state?: string;
  contentSha256?: string;
  pushedSha256?: string;
  remoteSize?: number;
  remoteModifiedAt?: string;
  remoteMissingAt?: string;
} = {}): number {
  uidSeq += 1;
  const info = testDb
    .prepare(
      `INSERT INTO document_sync_items
         (link_id, trip_id, file_id, trek_doc_uid, remote_id, remote_name, remote_version,
          remote_size, remote_modified_at, content_sha256, pushed_sha256, state, remote_missing_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      link.id, link.trip_id, over.fileId ?? null, `uid-${uidSeq}`,
      over.remoteId ?? null, over.remoteName ?? null, over.remoteVersion ?? null,
      over.remoteSize ?? null, over.remoteModifiedAt ?? null,
      over.contentSha256 ?? null, over.pushedSha256 ?? null, over.state ?? 'synced',
      over.remoteMissingAt ?? null,
    );
  return Number(info.lastInsertRowid);
}

function makeFile(over: {
  name?: string;
  storageKey?: string;
  mime?: string;
  messageId?: number;
  noteId?: number;
  deletedAt?: string;
} = {}): number {
  const info = testDb
    .prepare(
      `INSERT INTO trip_files (trip_id, filename, original_name, file_size, mime_type, uploaded_by, message_id, note_id, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      tripId, over.storageKey ?? `key-${over.name ?? 'boarding.pdf'}`, over.name ?? 'boarding.pdf',
      FILE_BYTES.length, over.mime ?? 'application/pdf', ownerId,
      over.messageId ?? null, over.noteId ?? null, over.deletedAt ?? null,
    );
  return Number(info.lastInsertRowid);
}

const itemRow = (id: number) =>
  testDb.prepare('SELECT * FROM document_sync_items WHERE id = ?').get(id) as Record<string, unknown>;
const itemRows = () =>
  testDb.prepare('SELECT * FROM document_sync_items ORDER BY id').all() as Array<Record<string, unknown>>;
const linkRow = (id: number) =>
  testDb.prepare('SELECT * FROM trip_document_links WHERE id = ?').get(id) as Record<string, unknown>;
const fileRows = () =>
  testDb.prepare('SELECT * FROM trip_files ORDER BY id').all() as Array<Record<string, unknown>>;

/** SQLite's own clock and format, so a comparison against CURRENT_TIMESTAMP means something. */
const sqlTime = (modifier: string): string =>
  (testDb.prepare("SELECT datetime('now', ?) AS t").get(modifier) as { t: string }).t;

/**
 * The Documents addon. Every binding asks it before it runs, so a double that
 * always says yes would hide the one case worth a test.
 */
const addons = { isAddonEnabled: vi.fn(() => true) };

/** The admin's per-provider switch, which is a real row rather than a double. */
const switchProvider = (id: string, on: boolean) =>
  testDb.prepare('UPDATE document_providers SET enabled = ? WHERE id = ?').run(on ? 1 : 0, id);

// ── Suite ────────────────────────────────────────────────────────────────────

describe('DocSyncService', () => {
  beforeAll(() => {
    createTables(testDb);
    runMigrations(testDb);
    spoolDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-docsync-'));

    ownerId = createUser(testDb, { username: 'owner', email: 'owner@docsync.test' }).user.id;
    tripId = createTrip(testDb, ownerId, { title: 'Japan' }).id;
    const info = testDb
      .prepare(
        `INSERT INTO document_connections (trip_id, provider_id, owner_user_id, base_url, secrets, settings)
         VALUES (?, 'paperless', ?, 'https://paperless.example.com', NULL, '{}')`,
      )
      .run(tripId, ownerId);
    connectionId = Number(info.lastInsertRowid);

    const dbs = new DatabaseService(testDb);
    const registry = new DocumentProviderRegistry([provider as unknown as DocumentProvider]);
    config = new DocSyncConfigService(dbs, registry);
    service = new DocSyncService(
      dbs,
      config,
      registry,
      storage,
      files,
      new AllowedFileTypesService(dbs),
      realtime,
      addons as unknown as AddonsService,
    );
  });

  afterAll(() => {
    testDb.close();
    fs.rmSync(spoolDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    capabilities = { ...BASE_CAPABILITIES };
    testDb.prepare('DELETE FROM document_sync_items').run();
    testDb.prepare('DELETE FROM trip_document_links').run();
    testDb.prepare('DELETE FROM trip_files').run();
    testDb.prepare('DELETE FROM collab_messages').run();
    testDb.prepare('DELETE FROM collab_notes').run();
    // Providers ship switched off; the fake one stands in for Paperless.
    testDb.prepare('UPDATE document_providers SET enabled = 0').run();
    switchProvider('paperless', true);
    for (const entry of fs.readdirSync(spoolDir)) fs.rmSync(path.join(spoolDir, entry), { force: true });
  });

  describe('dueLinks', () => {
    it('offers only bindings that are switched on, uncircuited and actually due', () => {
      const dueNow = makeLink();
      const overdue = makeLink({ nextAttemptAt: sqlTime('-1 hour') });
      makeLink({ nextAttemptAt: sqlTime('+1 hour') });
      makeLink({ syncEnabled: 0 });
      makeLink({ failureCount: LINK_CIRCUIT_OPEN_AFTER });

      const ids = service.dueLinks().map((l) => l.id).sort((a, b) => a - b);
      expect(ids).toEqual([dueNow.id, overdue.id].sort((a, b) => a - b));
    });

    it('puts the longest-waiting binding first, so the limit cannot starve the newer ones', () => {
      // A successful run clears next_attempt_at, so on a healthy instance every
      // binding ties on the first sort key. Without a second key SQLite answers
      // in insertion order and the same oldest bindings win every tick: found on
      // a dev database with 170 of them, where a binding created minutes earlier
      // had never been synced while the first twenty ran over and over.
      const recent = makeLink({ lastSyncAt: sqlTime('-1 minute') });
      const stale = makeLink({ lastSyncAt: sqlTime('-2 hours') });
      const never = makeLink({ lastSyncAt: null });

      expect(service.dueLinks().map((l) => l.id)).toEqual([never.id, stale.id, recent.id]);
    });

    it('serves ordinary bindings before one that is only due again after a backoff', () => {
      // COALESCE(next_attempt_at, '1970-01-01') is what orders these: a binding
      // with no backoff counts as due since the epoch and therefore goes first,
      // while one whose backoff has merely expired sorts by when it expired.
      // Normal work ahead of a retry, which is the right way round.
      const backedOff = makeLink({ nextAttemptAt: sqlTime('-1 hour'), lastSyncAt: sqlTime('-1 minute') });
      const never = makeLink({ lastSyncAt: null });

      expect(service.dueLinks().map((l) => l.id)).toEqual([never.id, backedOff.id]);
    });

    it('honours the limit', () => {
      for (let i = 0; i < 25; i += 1) makeLink({ lastSyncAt: null });
      expect(service.dueLinks().length).toBe(20);
      expect(service.dueLinks(5).length).toBe(5);
    });

    it('lets a binding back in one failure before the circuit opens', () => {
      const nearly = makeLink({ failureCount: LINK_CIRCUIT_OPEN_AFTER - 1 });
      expect(service.dueLinks().map((l) => l.id)).toEqual([nearly.id]);
    });

    it('leaves out an orphaned binding even when Sync automatically was switched back on', () => {
      // It would never run, so it would never get a last_sync_at and would take
      // one of the slots on every tick.
      const orphaned = makeLink({ lastSyncAt: null });
      testDb.prepare("UPDATE trip_document_links SET last_sync_state = 'orphaned' WHERE id = ?").run(orphaned.id);
      const live = makeLink({ lastSyncAt: sqlTime('-1 minute') });

      expect(service.dueLinks().map((l) => l.id)).toEqual([live.id]);
    });
  });

  describe('syncLink', () => {
    it('answers busy instead of running the same binding twice at once', async () => {
      const link = makeLink();
      let release: () => void;
      provider.resolveScope.mockImplementationOnce(
        () => new Promise((resolve) => { release = () => resolve(ok(SCOPE)); }),
      );

      const first = service.syncLink(link);
      const second = await service.syncLink(link);
      expect(second.state).toBe('busy');

      release();
      await first;
      expect(provider.list).toHaveBeenCalledTimes(1);
    });

    it('parks a binding whose scope is gone as scope_lost rather than as a failure', async () => {
      const link = makeLink();
      provider.resolveScope.mockResolvedValueOnce(fail('scope_missing'));

      const res = await service.syncLink(link);

      expect(res.state).toBe('scope_lost');
      expect(res.errorCode).toBe('scope_missing');
      expect(linkRow(link.id).last_sync_state).toBe('scope_lost');
      // Nothing is enumerated once the container is known to be gone, so a
      // deleted folder cannot be re-created and refilled.
      expect(provider.list).not.toHaveBeenCalled();
    });

    it('treats a not-found scope the same as a missing one', async () => {
      const link = makeLink();
      provider.resolveScope.mockResolvedValueOnce(fail('not_found'));

      const res = await service.syncLink(link);

      expect(res.state).toBe('scope_lost');
      expect(res.errorCode).toBe('scope_missing');
    });

    it('asks for fresh credentials when the listing comes back unauthorized', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(fail('unauthorized', 401));

      const res = await service.syncLink(link);

      expect(res.state).toBe('needs_reauth');
      const row = linkRow(link.id);
      expect(row.last_sync_state).toBe('needs_reauth');
      expect(row.last_sync_error).toBe('unauthorized');
    });

    it('does not mistake an unreachable instance for a credential problem', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(fail('unreachable'));

      const res = await service.syncLink(link);

      expect(res.state).toBe('failed');
      expect(linkRow(link.id).last_sync_state).toBe('failed');
    });

    /**
     * The most expensive mistake this domain could make. An unmounted share, a
     * revoked token and a moved folder all answer with a short listing, and
     * acting on it would empty a trip. The run is abandoned whole: not the
     * vanished documents only, but the parts of the listing that look fine too,
     * because a listing that cannot be trusted cannot be trusted in pieces.
     */
    it('abandons the entire run when most known documents vanish from one listing', async () => {
      const link = makeLink();
      const itemIds = Array.from({ length: 10 }, (_, i) =>
        seedItem(link, { remoteId: `r${i}`, remoteName: `doc-${i}.pdf`, state: 'synced' }));
      makeFile({ name: 'local-only.pdf' });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r0', name: 'doc-0.pdf' })])));

      const res = await service.syncLink(link);

      expect(res.state).toBe('partial');
      expect(res.errorCode).toBe('mass_delete_guard');
      expect(res.missing).toBe(9);

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).not.toHaveBeenCalled();
      expect(provider.trash).not.toHaveBeenCalled();
      expect(provider.rename).not.toHaveBeenCalled();
      expect(files.createFile).not.toHaveBeenCalled();

      for (const id of itemIds) {
        const row = itemRow(id);
        expect(row.state).toBe('synced');
        expect(row.remote_missing_at).toBeNull();
      }
      expect(fileRows()).toHaveLength(1);
      expect(linkRow(link.id).last_sync_error).toBe('mass_delete_guard');
    });

    /**
     * TREK serves a download inline with a Content-Type derived from its
     * extension, so an .svg or .html out of somebody's Nextcloud folder would
     * be stored XSS. It becomes a visible row rather than a silent skip, and
     * the bytes are never asked for.
     */
    it('refuses a document whose extension TREK would serve inline', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-svg', name: 'floorplan.svg' }),
        remoteDoc({ remoteId: 'r-html', name: 'itinerary.html' }),
      ])));

      const res = await service.syncLink(link);

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(0);
      expect(itemRows().map((r) => [r.remote_id, r.state, r.error_code])).toEqual([
        ['r-svg', 'rejected_type', 'unsupported_type'],
        ['r-html', 'rejected_type', 'unsupported_type'],
      ]);
      expect(res.state).toBe('partial');
    });

    it('refuses a document larger than an upload would be allowed to be', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-big', name: 'scan.pdf', size: MAX_FILE_SIZE + 1 }),
      ])));

      await service.syncLink(link);

      expect(provider.fetch).not.toHaveBeenCalled();
      const row = itemRows()[0];
      expect(row.state).toBe('too_large');
      expect(row.error_code).toBe('too_large');
    });

    /**
     * Paperless answers 400 for anything outside its parser list. Asking the
     * capabilities first turns a failure that repeats every run into one row
     * that says why.
     */
    it('never uploads a document whose type the provider has said it will not take', async () => {
      const link = makeLink();
      capabilities = { ...BASE_CAPABILITIES, acceptedMimeTypes: ['application/pdf'] };
      const fileId = makeFile({ name: 'sunset.png', mime: 'image/png' });

      await service.syncLink(link);

      expect(provider.push).not.toHaveBeenCalled();
      const row = itemRows()[0];
      expect(row.file_id).toBe(fileId);
      expect(row.state).toBe('rejected_type');
      expect(row.error_code).toBe('unsupported_type');
    });

    /**
     * The echo guard, end to end through the service rather than through the
     * planner. A provider reports TREK's own upload as a change on the next
     * run; without the hash it pushed, the file would be pulled back down,
     * re-uploaded, and bounce forever.
     */
    it('does not pull back the bytes it uploaded itself', async () => {
      const link = makeLink();
      makeFile({ name: 'boarding.pdf' });
      provider.list.mockResolvedValueOnce(ok(listing([])));

      const firstRun = await service.syncLink(link);
      expect(firstRun.pushed).toBe(1);
      const afterPush = itemRows()[0];
      expect(afterPush.pushed_sha256).toBe(FILE_SHA);
      expect(afterPush.content_sha256).toBe(FILE_SHA);
      expect(afterPush.remote_id).toBe('r-pushed');

      // Same bytes back, under a new version marker, which is what a provider
      // reports for TREK's own write.
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-pushed', name: 'boarding.pdf', remoteVersion: 'v2', contentHash: FILE_SHA }),
      ])));

      const secondRun = await service.syncLink(link);

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).toHaveBeenCalledTimes(1);
      expect(secondRun.pulled).toBe(0);
      expect(fileRows()).toHaveLength(1);
      expect(itemRows()[0].state).toBe('synced');
    });

    it('refuses to move a pairing onto a document another file already owns', async () => {
      // Papra answers a push of bytes it already holds with the document that
      // has them. Two trip files with the same content therefore push to ONE
      // document, and the unique index on (link_id, remote_id) turned that
      // into a constraint error that aborted this run and every run after it.
      const link = makeLink();
      makeFile({ name: 'boarding.pdf' });
      makeFile({ name: 'boarding-copy.pdf', storageKey: 'key-copy' });
      provider.list.mockResolvedValue(ok(listing([])));

      const run = await service.syncLink(link);

      // Counted as a conflict, which is what it is (a document two files
      // want), and reported the same way as any other conflict rather than as a
      // failed run.
      expect(run.pushed).toBe(1);
      expect(run.conflicts).toBe(1);

      const rows = itemRows();
      expect(rows).toHaveLength(2);
      // The first file keeps the document. The second is on record as the one
      // that could not have it, with its bytes still in TREK.
      expect(rows.filter((r) => r.remote_id === 'r-pushed')).toHaveLength(1);
      const blocked = rows.find((r) => r.state === 'error');
      expect(blocked?.error_code).toBe('conflict');
      expect(blocked?.remote_id).toBeNull();
    });

    it('counts a failure and puts the binding off until later', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(fail('unreachable'));

      await service.syncLink(link);

      const after = testDb
        .prepare('SELECT failure_count, next_attempt_at > CURRENT_TIMESTAMP AS in_future FROM trip_document_links WHERE id = ?')
        .get(link.id) as { failure_count: number; in_future: number };
      expect(after.failure_count).toBe(1);
      expect(after.in_future).toBe(1);

      provider.list.mockResolvedValueOnce(fail('unreachable'));
      await service.syncLink(config.getLink(link.id));
      expect(linkRow(link.id).failure_count).toBe(2);
    });

    it('clears the failure count and the wait as soon as a run succeeds', async () => {
      const link = makeLink({ failureCount: 3, nextAttemptAt: sqlTime('+1 hour') });

      const res = await service.syncLink(link);

      expect(res.state).toBe('ok');
      const row = linkRow(link.id);
      expect(row.failure_count).toBe(0);
      expect(row.next_attempt_at).toBeNull();
      expect(row.remote_cursor).toBe('cursor-1');
    });

    /**
     * A chat screenshot and a note attachment live in `trip_files` like every
     * other document, but they belong to a conversation rather than to the
     * trip's paperwork: pushing them would put someone's chat into a shared
     * Paperless.
     */
    it('leaves chat and note attachments out of the upload entirely', async () => {
      const link = makeLink();
      const messageId = Number(testDb
        .prepare("INSERT INTO collab_messages (trip_id, user_id, text) VALUES (?, ?, 'hi')")
        .run(tripId, ownerId).lastInsertRowid);
      const noteId = Number(testDb
        .prepare("INSERT INTO collab_notes (trip_id, user_id, title) VALUES (?, ?, 'note')")
        .run(tripId, ownerId).lastInsertRowid);

      makeFile({ name: 'boarding.pdf' });
      makeFile({ name: 'chat-screenshot.pdf', storageKey: 'key-chat', messageId });
      makeFile({ name: 'note-attachment.pdf', storageKey: 'key-note', noteId });

      await service.syncLink(link);

      expect(provider.push).toHaveBeenCalledTimes(1);
      expect(provider.push.mock.calls[0][2].fileName).toBe('boarding.pdf');
      expect(itemRows()).toHaveLength(1);
    });

    /**
     * The other half of the mass-delete rule, below the threshold: a document
     * that is gone upstream is written down and left to a person. An unmounted
     * share answers with an empty listing, and a trip is not a cache.
     */
    it('records a document that vanished upstream without removing anything locally', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'boarding.pdf' });
      const itemId = seedItem(link, { remoteId: 'r1', remoteName: 'boarding.pdf', fileId, state: 'synced' });

      const res = await service.syncLink(link);

      expect(res.missing).toBe(1);
      const row = itemRow(itemId);
      expect(row.state).toBe('remote_missing');
      expect(row.remote_missing_at).not.toBeNull();
      expect(fileRows().map((f) => f.id)).toEqual([fileId]);
      expect(provider.trash).not.toHaveBeenCalled();
    });

    it('moves a deleted document to the provider recycle bin only when the binding says trash', async () => {
      const trashing = makeLink({ deletePolicy: 'trash' });
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(trashing, { remoteId: 'r1', remoteName: 'boarding.pdf', fileId, state: 'synced' });
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1' })])));

      await service.syncLink(trashing);
      expect(provider.trash).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'r1');
      expect(itemRow(itemId).state).toBe('local_deleted');

      const unlinking = makeLink({ deletePolicy: 'unlink' });
      const otherFileId = makeFile({ name: 'other.pdf', storageKey: 'key-other', deletedAt: '2026-09-18 08:00:00' });
      seedItem(unlinking, { remoteId: 'r1', remoteName: 'boarding.pdf', fileId: otherFileId, state: 'synced' });
      provider.trash.mockClear();

      await service.syncLink(unlinking);
      expect(provider.trash).not.toHaveBeenCalled();
    });

    it('carries a rename made in TREK over to the provider', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'new.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'synced',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'old.pdf' })])));

      await service.syncLink(link);

      expect(provider.rename).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'r1', 'new.pdf');
      const row = itemRow(itemId);
      expect(row.remote_name).toBe('new.pdf');
      expect(row.remote_version).toBe('v2');
    });

    it('carries a rename made at the provider over to the trip file', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'old.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'synced',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'new-upstream.pdf' })])));

      await service.syncLink(link);

      expect(provider.rename).not.toHaveBeenCalled();
      expect(fileRows()[0].original_name).toBe('new-upstream.pdf');
      expect(itemRow(itemId).remote_name).toBe('new-upstream.pdf');
      expect(realtime.broadcast).toHaveBeenCalledWith(tripId, 'file:updated', expect.anything());
    });

    it('hands a document both sides renamed to a person instead of picking one', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'mine.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'synced',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'theirs.pdf' })])));

      const res = await service.syncLink(link);

      expect(res.conflicts).toBe(1);
      expect(provider.rename).not.toHaveBeenCalled();
      expect(itemRow(itemId).state).toBe('conflict');
      expect(service.issues(tripId).map((r) => r.id)).toContain(itemId);
    });

    it('settles a double rename TREK wins with a rename, not a second upload', async () => {
      const link = makeLink({ conflictPolicy: 'trek_wins' });
      const fileId = makeFile({ name: 'mine.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'synced',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'theirs.pdf' })])));

      const res = await service.syncLink(link);

      expect(res.conflicts).toBe(0);
      expect(provider.push).not.toHaveBeenCalled();
      expect(provider.rename).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'r1', 'mine.pdf');
      expect(itemRow(itemId)).toMatchObject({ state: 'synced', remote_name: 'mine.pdf' });

      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'mine.pdf', remoteVersion: 'v2' })])));
      await service.syncLink(config.getLink(link.id));

      expect(provider.rename).toHaveBeenCalledTimes(1);
      expect(fileRows().map((f) => f.original_name)).toEqual(['mine.pdf']);
    });

    /**
     * Only `touch` used to lift the missing flag, and a copy that came back
     * under another name gets a rename instead, so it stayed on the issues list
     * for another run.
     */
    it('takes a copy on record as missing off the list when it is back under a new name', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'old.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'remote_missing',
        remoteMissingAt: '2026-09-18 09:00:00',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'new-upstream.pdf' })])));

      await service.syncLink(link);

      expect(fileRows()[0].original_name).toBe('new-upstream.pdf');
      expect(itemRow(itemId)).toMatchObject({ state: 'synced', remote_missing_at: null, remote_name: 'new-upstream.pdf' });
      expect(service.issues(tripId)).toEqual([]);
    });

    it('does the same when the name TREK gave it meanwhile is carried upstream', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'new.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'remote_missing',
        remoteMissingAt: '2026-09-18 09:00:00',
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', name: 'old.pdf' })])));

      await service.syncLink(link);

      expect(provider.rename).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'r1', 'new.pdf');
      expect(itemRow(itemId)).toMatchObject({ state: 'synced', remote_missing_at: null, remote_name: 'new.pdf' });
    });

    /**
     * The size a listing claims is not a promise. The transfer is cut off at
     * the cap while it is still being written, so an oversized body can never
     * become a `trip_files` row, and the half-written spool file goes with it.
     */
    it('cuts off a download that outgrows the cap the listing promised to stay under', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r-lying', name: 'scan.pdf', size: null })])));
      provider.fetch.mockResolvedValueOnce(ok({
        body: Readable.from([Buffer.allocUnsafe(MAX_FILE_SIZE + 1)]),
        size: null,
        mimeType: 'application/pdf',
        remoteVersion: 'v1',
      }));

      await service.syncLink(link);

      expect(storage.put).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(0);
      expect(itemRows()[0].state).toBe('too_large');
      expect(fs.readdirSync(spoolDir)).toHaveLength(0);
    });

    it('turns a failed download into a visible error row rather than losing it', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc()])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));

      const res = await service.syncLink(link);

      expect(res.state).toBe('partial');
      const row = itemRows()[0];
      expect(row.state).toBe('error');
      expect(row.error_code).toBe('timeout');
      expect(row.attempts).toBe(1);
      expect(row.file_id).toBeNull();
      expect(fileRows()).toHaveLength(0);
      expect(service.issues(tripId)).toHaveLength(1);
    });

    it('keeps a failed download visible as an error instead of booking it as synced', async () => {
      // The failure path used to write the provider's version marker, so the
      // next run saw no change, produced a `touch`, and touch lifted `error` to
      // `synced`. The document then had no bytes in TREK, was gone from the
      // issues list, and nothing ever fetched it again.
      const link = makeLink();
      provider.list.mockResolvedValue(ok(listing([remoteDoc()])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));

      await service.syncLink(link);
      await service.syncLink(link);

      const row = itemRows()[0];
      expect(row.state).toBe('error');
      expect(row.file_id).toBeNull();
      expect(service.issues(tripId)).toHaveLength(1);
    });

    it('creates no trip file when storage refuses the finished download', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc()])));
      (storage.put as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('disk full'));

      await service.syncLink(link);

      expect(files.createFile).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(0);
      expect(itemRows()[0].state).toBe('error');
    });

    it('keeps the document anchor when an upload fails, so the retry is not a second document', async () => {
      const link = makeLink();
      makeFile({ name: 'boarding.pdf' });
      provider.push.mockResolvedValueOnce(fail('quota_exceeded'));

      const res = await service.syncLink(link);

      expect(res.errorCode).toBe('quota_exceeded');
      const row = itemRows()[0];
      expect(row.state).toBe('error');
      expect(row.error_code).toBe('quota_exceeded');
      expect(row.trek_doc_uid).toBeTruthy();
    });

    it('refuses an upload the provider has told TREK is over its size limit', async () => {
      const link = makeLink();
      capabilities = { ...BASE_CAPABILITIES, maxUploadBytes: 10 };
      makeFile({ name: 'boarding.pdf' });

      await service.syncLink(link);

      expect(provider.push).not.toHaveBeenCalled();
      expect(itemRows()[0].state).toBe('too_large');
    });

    it('records an upload whose bytes are missing from storage instead of throwing', async () => {
      const link = makeLink();
      makeFile({ name: 'boarding.pdf' });
      (storage.getStream as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('gone'));

      const res = await service.syncLink(link);

      expect(res.errorCode).toBe('provider_error');
      expect(provider.push).not.toHaveBeenCalled();
      expect(itemRows()[0].state).toBe('error');
    });

    /**
     * One enormous trip must not hold the worker while every other binding on
     * the instance waits. The rest is simply left for the next run.
     */
    it('stops after the per-run transfer budget and leaves the rest for next time', async () => {
      const link = makeLink();
      const many = Array.from({ length: MAX_TRANSFERS_PER_RUN + 5 }, (_, i) =>
        remoteDoc({ remoteId: `r${i}`, name: `doc-${i}.pdf` }));
      provider.list.mockResolvedValueOnce(ok(listing(many)));

      const res = await service.syncLink(link);

      expect(res.pulled).toBe(MAX_TRANSFERS_PER_RUN);
      expect(provider.fetch).toHaveBeenCalledTimes(MAX_TRANSFERS_PER_RUN);
      expect(fileRows()).toHaveLength(MAX_TRANSFERS_PER_RUN);
    });

    it('records an unexpected crash as a failed run instead of letting it escape', async () => {
      const link = makeLink();
      provider.list.mockImplementationOnce(() => { throw new Error('adapter blew up'); });

      const res = await service.syncLink(link);

      expect(res.state).toBe('failed');
      expect(res.errorCode).toBe('unknown');
      expect(linkRow(link.id).failure_count).toBe(1);
    });

    it('fails a binding for a provider this build does not have', async () => {
      const link = makeLink();
      testDb.prepare("UPDATE trip_document_links SET provider_id = 'papra' WHERE id = ?").run(link.id);
      switchProvider('papra', true);

      const res = await service.syncLink(config.getLink(link.id));

      expect(res.state).toBe('failed');
      expect(res.errorCode).toBe('provider_error');
      expect(provider.resolveScope).not.toHaveBeenCalled();
    });
  });

  /**
   * An administrator switching a provider off, or the Documents addon.
   *
   * The check that was meant to do this asked the addon table about a provider
   * id. Providers are not addons, so it answered "off" for every binding on
   * every run, and the one test of it could not tell: it stubbed the answer.
   * The switch is a kill switch, not a failure: nothing about the binding is
   * written while it is off, so it resumes exactly where it stopped.
   */
  describe('an administrator switch', () => {
    it('lets a binding run while its provider and the addon are on', async () => {
      const link = makeLink();

      const res = await service.syncLink(link);

      expect(res.state).toBe('ok');
      expect(provider.list).toHaveBeenCalledTimes(1);
      expect(addons.isAddonEnabled).toHaveBeenCalledWith('documents');
    });

    it('leaves a binding whose provider is off out of the due list', () => {
      makeLink();
      const on = makeLink({ providerId: 'nextcloud' });
      switchProvider('paperless', false);
      switchProvider('nextcloud', true);

      expect(service.dueLinks().map((l) => l.id)).toEqual([on.id]);
    });

    it('does not let switched-off bindings take the slots of the ones that may run', () => {
      // They never run, so they never get a last_sync_at and would sort first
      // on every tick for good.
      for (let i = 0; i < 25; i += 1) makeLink({ lastSyncAt: null });
      const on = makeLink({ providerId: 'nextcloud', lastSyncAt: sqlTime('-1 minute') });
      switchProvider('paperless', false);
      switchProvider('nextcloud', true);

      expect(service.dueLinks().map((l) => l.id)).toEqual([on.id]);
    });

    it('stands down without touching the binding or its documents while the provider is off', async () => {
      const link = makeLink({ failureCount: 2 });
      testDb.prepare("UPDATE trip_document_links SET last_sync_state = 'partial', last_sync_error = 'timeout' WHERE id = ?")
        .run(link.id);
      const itemId = seedItem(link, { remoteId: 'r1', remoteVersion: 'v1', state: 'error' });
      testDb.prepare('UPDATE document_sync_items SET attempts = 6 WHERE id = ?').run(itemId);
      const linkBefore = linkRow(link.id);
      const itemBefore = itemRow(itemId);
      switchProvider('paperless', false);

      const res = await service.syncLink(config.getLink(link.id));

      expect(res.state).toBe('disabled');
      expect(provider.resolveScope).not.toHaveBeenCalled();
      expect(provider.list).not.toHaveBeenCalled();
      expect(linkRow(link.id)).toEqual(linkBefore);
      expect(itemRow(itemId)).toEqual(itemBefore);
    });

    it('stands down the same way while the Documents addon is off', async () => {
      const link = makeLink();
      const before = linkRow(link.id);
      addons.isAddonEnabled.mockReturnValue(false);

      const res = await service.syncLink(link);

      expect(res.state).toBe('disabled');
      expect(provider.list).not.toHaveBeenCalled();
      expect(linkRow(link.id)).toEqual(before);
    });

    it('stands down before it looks for the connection, so a gone one is not a failure either', async () => {
      const link = { ...makeLink(), connection_id: 999999 };
      switchProvider('paperless', false);

      expect((await service.syncLink(link)).state).toBe('disabled');
      expect(linkRow(link.id).failure_count).toBe(0);
    });

    it('picks up where it stopped once the provider is back on', async () => {
      const link = makeLink();
      provider.list.mockResolvedValue(ok(listing([remoteDoc()])));
      switchProvider('paperless', false);
      await service.syncLink(link);
      expect(fileRows()).toHaveLength(0);

      switchProvider('paperless', true);
      expect(service.dueLinks().map((l) => l.id)).toEqual([link.id]);
      const res = await service.syncLink(config.getLink(link.id));

      expect(res).toMatchObject({ state: 'ok', pulled: 1 });
      expect(fileRows()).toHaveLength(1);
    });

    it('never runs an orphaned binding, whoever asks', async () => {
      // Sync automatically switched back on puts sync_enabled to 1 again, and a
      // webhook or a resolved conflict calls syncLink without asking first.
      const link = makeLink();
      testDb.prepare("UPDATE trip_document_links SET last_sync_state = 'orphaned' WHERE id = ?").run(link.id);
      const before = linkRow(link.id);

      const res = await service.syncLink(config.getLink(link.id));

      expect(res.state).toBe('orphaned');
      expect(provider.resolveScope).not.toHaveBeenCalled();
      expect(provider.list).not.toHaveBeenCalled();
      expect(linkRow(link.id)).toEqual(before);
    });

    it('answers the same question for any caller that has to refuse up front', () => {
      const link = makeLink();
      expect(service.isSwitchedOff(link)).toBe(false);

      switchProvider('paperless', false);
      expect(service.isSwitchedOff(link)).toBe(true);

      switchProvider('paperless', true);
      addons.isAddonEnabled.mockReturnValue(false);
      expect(service.isSwitchedOff(link)).toBe(true);
    });
  });

  describe('status', () => {
    it('reports the trip bindings together with a count per item state', () => {
      const link = makeLink();
      seedItem(link, { remoteId: 'r1', state: 'synced' });
      seedItem(link, { remoteId: 'r2', state: 'synced' });
      seedItem(link, { remoteId: 'r3', state: 'conflict' });

      const status = service.status(tripId);

      expect(status.links).toHaveLength(1);
      expect(status.items).toEqual({ synced: 2, conflict: 1 });
    });

    it('says which bindings are paused because their provider is switched off', () => {
      const off = makeLink();
      const on = makeLink({ providerId: 'nextcloud' });
      switchProvider('paperless', false);
      switchProvider('nextcloud', true);

      const links = service.status(tripId).links as Array<{ id: number; providerOff: boolean }>;

      expect(links.find((l) => l.id === off.id)?.providerOff).toBe(true);
      expect(links.find((l) => l.id === on.id)?.providerOff).toBe(false);
    });
  });

  describe('resolveConflict', () => {
    /** A conflicted pairing: the provider moved on, and TREK holds its own copy. */
    function seedConflict(link: LinkRow): { itemId: number; fileId: number } {
      const fileId = makeFile({ name: 'boarding.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1',
        remoteName: 'boarding.pdf',
        remoteVersion: 'v1',
        fileId,
        state: 'conflict',
        contentSha256: 'agreed-hash',
      });
      return { itemId, fileId };
    }

    it('keeps both copies and gives each its own pairing when the user asks for both', async () => {
      const link = makeLink();
      const { itemId, fileId } = seedConflict(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'boarding.pdf', remoteVersion: 'v2' }),
      ])));

      expect(await service.resolveConflict(itemId, 'both')).toBe(true);

      // The provider's copy arrives as a second TREK document, and TREK's copy
      // goes up as a second provider document. Neither side loses anything.
      expect(provider.fetch).toHaveBeenCalledTimes(1);
      expect(provider.push).toHaveBeenCalledTimes(1);
      const filesAfter = fileRows();
      expect(filesAfter).toHaveLength(2);
      expect(filesAfter.map((f) => f.id)).toContain(fileId);
      expect(itemRows()).toHaveLength(2);
    });

    /**
     * `keep` names the side that becomes the agreed state, and the run that
     * resolveConflict triggers is where that takes effect. The two tests below
     * pin what the code does TODAY, and it is the wrong way round: 'trek'
     * clears `content_sha256`, which is the only record that TREK's copy ever
     * moved, so the run pulls the provider's version instead of sending TREK's.
     * Reported rather than fixed here; these are the tests that turn red when
     * the two branches are put back.
     */
    it('does not pull the provider copy when the conflict was resolved in TREK favour', async () => {
      // Keeping TREK's copy means forgetting the provider's version marker, not
      // forgetting the agreed bytes: clearing the latter reads as "TREK never
      // agreed to this", and the provider's copy comes down over the one the
      // user just chose to keep.
      const link = makeLink();
      const { itemId } = seedConflict(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'boarding.pdf', remoteVersion: 'v2' }),
      ])));

      await service.resolveConflict(itemId, 'trek');

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(1);
    });

    it('pulls the provider copy when the conflict was resolved in its favour', async () => {
      const link = makeLink();
      const { itemId } = seedConflict(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'boarding.pdf', remoteVersion: 'v2' }),
      ])));

      await service.resolveConflict(itemId, 'provider');

      expect(provider.fetch).toHaveBeenCalledTimes(1);
      expect(itemRow(itemId).state).toBe('synced');
    });

    /**
     * The double rename is the only conflict a person can actually produce, and
     * it is arbitrated by `remote_name` alone. Clearing a version marker left
     * all three names untouched, so the next run raised the same conflict again:
     * whatever the owner chose, the issue came back within minutes, forever.
     */
    describe('a double rename', () => {
      function seedRenameConflict(link: LinkRow) {
        const fileId = makeFile({ name: 'Invoice.pdf' });   // renamed in TREK
        const itemId = seedItem(link, {
          remoteId: 'r1',
          remoteName: 'Bill.pdf',                            // what both agreed on
          remoteVersion: 'v1',
          fileId,
          state: 'conflict',
          contentSha256: 'agreed-hash',
        });
        return { itemId, fileId };
      }

      it('renames the provider copy to TREK name when TREK wins', async () => {
        const link = makeLink();
        const { itemId } = seedRenameConflict(link);
        provider.list.mockResolvedValue(ok(listing([
          remoteDoc({ remoteId: 'r1', name: 'Invoice.pdf', remoteVersion: 'v2' }),
        ])));

        await service.resolveConflict(itemId, 'trek');

        expect(provider.rename).toHaveBeenCalledWith(
          expect.anything(), expect.anything(), 'r1', 'Invoice.pdf',
        );
        expect(itemRow(itemId).remote_name).toBe('Invoice.pdf');
      });

      it('takes the local rename back when the provider wins, so TREK follows next run', async () => {
        const link = makeLink();
        const { itemId, fileId } = seedRenameConflict(link);
        provider.list.mockResolvedValue(ok(listing([
          remoteDoc({ remoteId: 'r1', name: 'Rechnung.pdf', remoteVersion: 'v1' }),
        ])));

        await service.resolveConflict(itemId, 'provider');

        const file = testDb.prepare('SELECT original_name FROM trip_files WHERE id = ?').get(fileId) as { original_name: string };
        expect(file.original_name).toBe('Rechnung.pdf');
      });

      it('takes the provider name back the way a download would have written it', async () => {
        // Written raw, the colon made the next run read TREK's name as a second
        // rename of its own, and the conflict the owner had just settled came
        // straight back.
        const link = makeLink();
        const fileId = makeFile({ name: 'Invoice.pdf' });
        const itemId = seedItem(link, {
          remoteId: 'r1', remoteName: 'Hotel: Kyoto.pdf', remoteVersion: 'v1', fileId, state: 'conflict', contentSha256: 'agreed-hash',
        });
        provider.list.mockResolvedValue(ok(listing([
          remoteDoc({ remoteId: 'r1', name: 'Hotel: Kyoto 2026.pdf', remoteVersion: 'v1' }),
        ])));

        await service.resolveConflict(itemId, 'provider');

        expect(itemRow(itemId).state).not.toBe('conflict');
        expect(provider.rename).not.toHaveBeenCalled();
        const file = testDb.prepare('SELECT original_name FROM trip_files WHERE id = ?').get(fileId) as { original_name: string };
        expect(file.original_name).toBe('Hotel_ Kyoto 2026.pdf');
      });

      it('does not leave the row in conflict either way', async () => {
        for (const keep of ['trek', 'provider'] as const) {
          const link = makeLink();
          const { itemId } = seedRenameConflict(link);
          provider.list.mockResolvedValue(ok(listing([
            remoteDoc({ remoteId: 'r1', name: 'Rechnung.pdf', remoteVersion: 'v1' }),
          ])));

          await service.resolveConflict(itemId, keep);

          expect(itemRow(itemId).state, `keep=${keep} left the row in conflict`).not.toBe('conflict');
        }
      });
    });

    it('refuses to resolve a pairing that is not in conflict', async () => {
      const link = makeLink();
      const itemId = seedItem(link, { remoteId: 'r1', state: 'synced' });

      expect(await service.resolveConflict(itemId, 'both')).toBe(false);
      expect(provider.list).not.toHaveBeenCalled();
    });
  });

  describe('issues', () => {
    it('lists only the rows a person has to decide about, never the ones still waiting', () => {
      const link = makeLink();
      const decidable = ['conflict', 'rejected_type', 'too_large', 'remote_missing', 'error'];
      const waiting = ['pending', 'synced', 'local_deleted'];
      for (const state of [...decidable, ...waiting]) {
        seedItem(link, { remoteId: `r-${state}`, state });
      }

      const states = service.issues(tripId).map((r) => r.state as string).sort();
      expect(states).toEqual([...decidable].sort());
    });
  });

  /**
   * A conflict may only be decided from the trip it belongs to.
   *
   * The route authorises the caller against the trip in its URL and then took the
   * item id on trust, so the owner of any trip could resolve a conflict in
   * somebody else's: both are plain integers and nothing compared them. Found by
   * an audit rather than by a failing test, which is why the check lives here,
   * next to the row it is about.
   */
  /**
   * An upstream edit replaces TREK's copy instead of joining it.
   *
   * `pull_update` routes into the same `pull()` as a first download, and
   * `FilesService.createFile` only inserts, so the edit arrived as a SECOND
   * document while the first stayed in the file manager holding the old bytes.
   * Worse, the pairing moves to the new row, which leaves the old one with no
   * sync item: the next run reads it as a document TREK gained and pushes the
   * superseded version back up. One edit, two documents on each side, growing
   * with every further edit.
   */
  describe('pull_update replaces rather than accumulates', () => {
    function seedSynced(link: LinkRow): { itemId: number; fileId: number } {
      const fileId = makeFile({ name: 'invoice.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1',
        remoteName: 'invoice.pdf',
        remoteVersion: 'v1',
        fileId,
        state: 'synced',
        contentSha256: 'agreed-hash',
      });
      return { itemId, fileId };
    }

    it('puts the superseded copy in the trash instead of leaving it beside the new one', async () => {
      const link = makeLink();
      const { fileId } = seedSynced(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2' }),
      ])));

      await service.syncLink(link);

      const rows = fileRows();
      const old = rows.find(r => Number(r.id) === fileId) as Record<string, unknown>;
      const fresh = rows.find(r => Number(r.id) !== fileId) as Record<string, unknown>;
      expect(old.deleted_at).not.toBeNull();
      expect(fresh).toBeDefined();
      expect(fresh.deleted_at).toBeNull();
    });

    it('leaves exactly one live document, so the file manager does not show two', async () => {
      const link = makeLink();
      seedSynced(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2' }),
      ])));

      await service.syncLink(link);

      expect(fileRows().filter(r => r.deleted_at === null)).toHaveLength(1);
    });

    it('does not push the superseded copy back on the next run', async () => {
      const link = makeLink();
      seedSynced(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2' }),
      ])));
      await service.syncLink(link);

      provider.push.mockClear();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2' }),
      ])));
      await service.syncLink(link);

      expect(provider.push).not.toHaveBeenCalled();
    });

    it('leaves a first download alone: there is nothing to supersede', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-new', name: 'fresh.pdf', remoteVersion: 'v1' }),
      ])));

      await service.syncLink(link);

      expect(fileRows().filter(r => r.deleted_at === null)).toHaveLength(1);
    });

    /**
     * The booking a document hangs on has to survive a new revision.
     *
     * The fresh row was created bare, and the old one went to the trash with
     * the reservation, the description, the star and the extra links still on
     * it: an edit in the store took the attachment off its booking, and the
     * reservation showed no document until somebody dug the old copy out.
     */
    it('carries the attachments of the superseded copy over to the new revision', async () => {
      const link = makeLink();
      const { itemId, fileId } = seedSynced(link);
      const reservationId = Number(
        testDb.prepare("INSERT INTO reservations (trip_id, title) VALUES (?, 'Hotel Kyoto')").run(tripId).lastInsertRowid,
      );
      const otherReservationId = Number(
        testDb.prepare("INSERT INTO reservations (trip_id, title) VALUES (?, 'Ryokan Hakone')").run(tripId).lastInsertRowid,
      );
      testDb.prepare('UPDATE trip_files SET reservation_id = ?, description = ?, starred = 1 WHERE id = ?')
        .run(reservationId, 'Booking confirmation', fileId);
      testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(fileId, otherReservationId);
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2' }),
      ])));

      await service.syncLink(link);

      const fresh = fileRows().find(r => Number(r.id) !== fileId) as Record<string, unknown>;
      expect(fresh).toMatchObject({ reservation_id: reservationId, description: 'Booking confirmation', starred: 1, deleted_at: null });
      expect(itemRow(itemId).file_id).toBe(Number(fresh.id));
      const links = testDb.prepare('SELECT reservation_id FROM file_links WHERE file_id = ? ORDER BY id').all(fresh.id) as Array<{ reservation_id: number }>;
      expect(links.map(l => l.reservation_id)).toEqual([otherReservationId]);
      // The old copy keeps what it had: the trash shows it as it was.
      expect(fileRows().find(r => Number(r.id) === fileId)).toMatchObject({ reservation_id: reservationId, starred: 1 });
      expect(realtime.broadcast).toHaveBeenCalledWith(tripId, 'file:created', { file: expect.objectContaining({ id: fresh.id, starred: 1 }) });
    });

    /**
     * A version marker that moved over the same bytes.
     *
     * Paperless bumps `modified` for a tag or a correspondent, and its listing
     * only carries a hash the planner can read where the checksum is sha256.
     * Without one the bytes were fetched again and a fresh row replaced the
     * file, booking link and all, on every edit of metadata. The download
     * cannot be avoided without a hash, but what it brings back can be
     * compared before anything is written.
     */
    it('keeps the file when the download turns out to be the bytes TREK already holds', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'invoice.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'invoice.pdf', remoteVersion: 'v1', fileId, state: 'synced', contentSha256: FILE_SHA,
      });
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2', contentHash: null }),
      ])));

      const res = await service.syncLink(link);

      expect(fileRows()).toHaveLength(1);
      expect(fileRows()[0]).toMatchObject({ id: fileId, deleted_at: null });
      expect(itemRow(itemId)).toMatchObject({ file_id: fileId, remote_version: 'v2', state: 'synced', content_sha256: FILE_SHA });
      expect(storage.put).not.toHaveBeenCalled();
      expect(fs.readdirSync(spoolDir)).toHaveLength(0);
      expect(res.pulled).toBe(0);
      expect(realtime.broadcast).not.toHaveBeenCalledWith(tripId, 'file:created', expect.anything());
    });

    it('leaves a rename that came with such an edit for the planner to follow', async () => {
      // Moving the agreed name here would read the store's rename as TREK's
      // own on the next run and send the old name back up.
      const link = makeLink();
      const fileId = makeFile({ name: 'invoice.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'invoice.pdf', remoteVersion: 'v1', fileId, state: 'synced', contentSha256: FILE_SHA,
      });
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'hotel-invoice.pdf', remoteVersion: 'v2', contentHash: null }),
      ])));

      await service.syncLink(link);

      expect(itemRow(itemId)).toMatchObject({ remote_name: 'invoice.pdf', remote_version: 'v2' });
      expect(fileRows()[0].original_name).toBe('invoice.pdf');

      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r1', name: 'hotel-invoice.pdf', remoteVersion: 'v2', contentHash: null }),
      ])));
      await service.syncLink(link);

      expect(provider.rename).not.toHaveBeenCalled();
      expect(fileRows()[0].original_name).toBe('hotel-invoice.pdf');
      expect(itemRow(itemId).remote_name).toBe('hotel-invoice.pdf');
    });
  });

  /**
   * Video comes in the way the file manager takes it: regardless of the
   * operator's allowed types, which do not list a video extension by default.
   * A clip in a bound Nextcloud folder was refused as *Type not allowed* while
   * the same clip uploaded by hand went through.
   */
  describe('video from the store', () => {
    it('is pulled, not refused for its type', async () => {
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r-clip', name: 'flug.mp4', mimeType: 'video/mp4' })])));

      const res = await service.syncLink(link);

      expect(provider.fetch).toHaveBeenCalledTimes(1);
      expect(fileRows().map(r => r.original_name)).toEqual(['flug.mp4']);
      expect(itemRows()[0].state).toBe('synced');
      expect(res.state).toBe('ok');
    });
  });

  /**
   * A download that fails leaves the pairing where it was.
   *
   * The failed update used to write the provider's new version marker next to
   * the old bytes. The run after that saw no upstream change, planned `touch`,
   * which leaves `error` alone, and the row sat in error on stale bytes for
   * good. "Sync now" did not help: it only clears the backoff, and the plan was
   * the same.
   */
  describe('a download that fails', () => {
    const settleBackoff = () => testDb.prepare('UPDATE document_sync_items SET next_attempt_at = NULL').run();

    function seedHeld(link: LinkRow): { itemId: number; fileId: number } {
      const fileId = makeFile({ name: 'invoice.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'invoice.pdf', remoteVersion: 'v1', fileId, state: 'synced',
        contentSha256: 'held-hash', remoteSize: 512, remoteModifiedAt: '2026-09-01T08:00:00Z',
      });
      return { itemId, fileId };
    }

    const edited = () => remoteDoc({
      remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v2', size: 2048, remoteModifiedAt: '2026-09-18T10:00:00Z',
    });

    it('keeps the version TREK holds on record, not the one it failed to get', async () => {
      const link = makeLink();
      const { itemId, fileId } = seedHeld(link);
      provider.list.mockResolvedValue(ok(listing([edited()])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));

      await service.syncLink(link);

      expect(itemRow(itemId)).toMatchObject({
        state: 'error', error_code: 'timeout', file_id: fileId, content_sha256: 'held-hash',
        remote_version: 'v1', remote_size: 512, remote_modified_at: '2026-09-01T08:00:00Z',
      });
    });

    it('fetches the update again once the backoff is over and ends synced with the new bytes', async () => {
      const link = makeLink();
      const { itemId, fileId } = seedHeld(link);
      provider.list.mockResolvedValue(ok(listing([edited()])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));
      await service.syncLink(link);

      settleBackoff();
      const res = await service.syncLink(config.getLink(link.id));

      expect(res).toMatchObject({ state: 'ok', pulled: 1 });
      expect(provider.fetch).toHaveBeenCalledTimes(2);
      const row = itemRow(itemId);
      expect(row).toMatchObject({
        state: 'synced', error_code: null, attempts: 0, remote_version: 'v2', content_sha256: FILE_SHA,
        remote_size: 2048, remote_modified_at: '2026-09-18T10:00:00Z',
      });
      const live = fileRows().filter(r => r.deleted_at === null);
      expect(live).toHaveLength(1);
      expect(Number(live[0].id)).toBe(Number(row.file_id));
      expect(Number(row.file_id)).not.toBe(fileId);
      expect(service.issues(tripId)).toHaveLength(0);
    });

    it('is fetched again by "Sync now" without waiting out the backoff', async () => {
      const link = makeLink();
      const { itemId } = seedHeld(link);
      provider.list.mockResolvedValue(ok(listing([edited()])));
      provider.fetch.mockResolvedValueOnce(fail('provider_error'));
      await service.syncLink(link);

      service.retryShelvedItems(link.id);
      await service.syncLink(config.getLink(link.id));

      expect(provider.fetch).toHaveBeenCalledTimes(2);
      expect(itemRow(itemId)).toMatchObject({ state: 'synced', remote_version: 'v2', content_sha256: FILE_SHA });
    });

    it('still retries a first download, which has no version to keep', async () => {
      const link = makeLink();
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r-new', name: 'fresh.pdf', remoteVersion: 'v1' })])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));
      await service.syncLink(link);
      expect(itemRows()[0]).toMatchObject({ state: 'error', file_id: null, remote_id: 'r-new', remote_version: null });

      settleBackoff();
      await service.syncLink(config.getLink(link.id));

      expect(provider.fetch).toHaveBeenCalledTimes(2);
      expect(itemRows()).toHaveLength(1);
      expect(itemRows()[0]).toMatchObject({ state: 'synced', remote_version: 'v1', content_sha256: FILE_SHA });
      expect(fileRows()).toHaveLength(1);
    });
  });

  /**
   * The attempt counter and the backoff curve, which were both stuck.
   *
   * The backoff was always computed at step 1, so three of the curve's four
   * steps were unreachable and a provider that was down got asked again at the
   * same short interval. And the counter only ever grew: a row that failed once
   * a month reached the limit after six months of otherwise healthy syncing and
   * was shelved permanently. Driven here through real runs, since the write is
   * private and a test hatch would only prove the hatch works.
   */
  describe('retry bookkeeping', () => {
    /**
     * One run in which the download fails, with the backoff window skipped.
     *
     * The window is real and the planner honours it, so without clearing it the
     * second run would correctly skip the row and this would be measuring the
     * backoff rather than the counter.
     */
    async function failingRun(link: LinkRow) {
      testDb.prepare("UPDATE document_sync_items SET next_attempt_at = NULL WHERE remote_id = 'r-flaky'").run();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-flaky', name: 'flaky.pdf', remoteVersion: 'v1' }),
      ])));
      provider.fetch.mockResolvedValueOnce(fail('provider_error'));
      await service.syncLink(link);
    }

    /** One run in which it works. */
    async function goodRun(link: LinkRow) {
      testDb.prepare("UPDATE document_sync_items SET next_attempt_at = NULL WHERE remote_id = 'r-flaky'").run();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-flaky', name: 'flaky.pdf', remoteVersion: 'v1' }),
      ])));
      await service.syncLink(link);
    }

    const flakyRow = () => testDb
      .prepare("SELECT * FROM document_sync_items WHERE remote_id = 'r-flaky'")
      .get() as Record<string, unknown>;

    it('counts consecutive failures', async () => {
      const link = makeLink();
      await failingRun(link);
      expect(flakyRow().attempts).toBe(1);
      await failingRun(link);
      expect(flakyRow().attempts).toBe(2);
    });

    it('clears the counter once a pass succeeds, so the limit means six in a row', async () => {
      const link = makeLink();
      await failingRun(link);
      await failingRun(link);
      expect(flakyRow().attempts).toBe(2);

      await goodRun(link);

      expect(flakyRow().attempts).toBe(0);
    });

    it('schedules each failure further out than the last', async () => {
      const link = makeLink();
      const waits: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        await failingRun(link);
        const row = flakyRow();
        const secs = (testDb
          .prepare("SELECT CAST((julianday(?) - julianday('now')) * 86400 AS INTEGER) AS s")
          .get(row.next_attempt_at) as { s: number }).s;
        waits.push(secs);
      }
      // Rising rather than flat: the curve used to be indexed at 1 every time.
      expect(waits[1]).toBeGreaterThan(waits[0]);
      expect(waits[2]).toBeGreaterThan(waits[1]);
    });
  });

  /**
   * A deletion in TREK is acted on once, under the policy of that moment.
   *
   * Both planner branches used to emit `local_deleted` for as long as the file
   * sat in TREK's trash. Under `unlink` that was invisible, until somebody
   * switched the binding to `trash`: the next run then binned every document
   * ever deleted in TREK, months back included.
   */
  describe('a deletion in TREK', () => {
    function deletedPairing(link: LinkRow): { itemId: number; fileId: number } {
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced',
        contentSha256: FILE_SHA, pushedSha256: FILE_SHA,
      });
      return { itemId, fileId };
    }

    it('does not reach back when the binding is switched from unlink to trash later', async () => {
      const link = makeLink({ deletePolicy: 'unlink' });
      const { itemId } = deletedPairing(link);
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1' })])));

      await service.syncLink(link);
      expect(itemRow(itemId).state).toBe('local_deleted');
      expect(itemRow(itemId).remote_trashed_at).toBeNull();

      testDb.prepare("UPDATE trip_document_links SET delete_policy = 'trash' WHERE id = ?").run(link.id);
      await service.syncLink(config.getLink(link.id));

      expect(provider.trash).not.toHaveBeenCalled();
      expect(itemRow(itemId).state).toBe('local_deleted');
    });

    it('bins the provider copy exactly once, even while the provider keeps listing it', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const { itemId } = deletedPairing(link);
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1' })])));

      await service.syncLink(link);
      expect(itemRow(itemId).remote_trashed_at).not.toBeNull();
      await service.syncLink(config.getLink(link.id));
      await service.syncLink(config.getLink(link.id));

      expect(provider.trash).toHaveBeenCalledTimes(1);
    });

    it('does not ask again under an unchanged upstream either', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      deletedPairing(link);
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1' })])));
      await service.syncLink(link);

      provider.list.mockResolvedValue(ok(listing([], { cursorUnchanged: true })));
      await service.syncLink(config.getLink(link.id));

      expect(provider.trash).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Taking a file back out of TREK's trash.
   *
   * `FilesService.restoreFile` only clears `deleted_at`; nothing in the files
   * domain knows about sync, so the next run is what finds out. Three cases,
   * told apart by what happened to the provider copy while TREK's sat in the
   * bin: still there, binned by TREK itself, or gone by somebody else's hand.
   */
  describe('a file taken back out of TREK trash', () => {
    const restore = (fileId: number) =>
      testDb.prepare('UPDATE trip_files SET deleted_at = NULL WHERE id = ?').run(fileId);

    /**
     * A provider answering the way the WebDAV adapters do: asked with the
     * cursor it handed out, "nothing changed" and no documents at all; asked
     * without one, the whole folder.
     */
    const quietUnlessAsked = (documents: RemoteDocument[]) =>
      async (_conn: DocumentConnectionRef, scope: DocumentScopeRef) =>
        ok(scope.cursor === null ? listing(documents) : listing([], { cursorUnchanged: true }));

    /** A synced pairing whose file was deleted in TREK and whose deletion one run has seen. */
    async function deletedAndSeen(link: LinkRow): Promise<{ itemId: number; fileId: number }> {
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced',
        contentSha256: FILE_SHA, pushedSha256: FILE_SHA,
      });
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1' })])));
      await service.syncLink(link);
      expect(itemRow(itemId).state).toBe('local_deleted');
      return { itemId, fileId };
    }

    it('resumes the pairing without a transfer when the provider copy is still there', async () => {
      const link = makeLink({ deletePolicy: 'unlink' });
      const { itemId, fileId } = await deletedAndSeen(link);

      restore(fileId);
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1' })])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(run.state).toBe('ok');
      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).not.toHaveBeenCalled();
      expect(itemRow(itemId).state).toBe('synced');
      expect(fileRows().map((f) => [f.id, f.deleted_at])).toEqual([[fileId, null]]);
    });

    it('lets the ordinary rules bring down an edit made upstream in the meantime', async () => {
      const link = makeLink({ deletePolicy: 'unlink' });
      const { itemId, fileId } = await deletedAndSeen(link);

      restore(fileId);
      // An edit is new bytes, not only a new version marker: the same bytes under
      // a moved marker are kept as they are.
      const edited = Buffer.from('trek-document-bytes, revised upstream');
      provider.fetch.mockResolvedValueOnce(ok({ body: Readable.from([edited]), size: edited.length, mimeType: 'application/pdf', remoteVersion: 'v2' }));
      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1', remoteVersion: 'v2' })])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(run.pulled).toBe(1);
      const row = itemRow(itemId);
      expect(row.state).toBe('synced');
      expect(row.file_id).not.toBe(fileId);
      expect(fileRows().filter((f) => f.deleted_at === null)).toHaveLength(1);
    });

    it('puts the file back at the provider when TREK was the one that binned it', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const { itemId, fileId } = await deletedAndSeen(link);
      expect(provider.trash).toHaveBeenCalledTimes(1);
      const uid = itemRow(itemId).trek_doc_uid;

      restore(fileId);
      provider.list.mockResolvedValueOnce(ok(listing([])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(run.pushed).toBe(1);
      expect(provider.push.mock.calls[0][2]).toMatchObject({ fileName: 'boarding.pdf', remoteId: undefined, trekDocUid: uid });
      const row = itemRow(itemId);
      expect(row.state).toBe('synced');
      expect(row.remote_id).toBe('r-pushed');
      expect(row.file_id).toBe(fileId);
      expect(row.remote_trashed_at).toBeNull();
      expect(itemRows()).toHaveLength(1);
    });

    it('does not mistake the re-upload for a foreign change on the run after', async () => {
      // The echo guard must still recognise TREK's own write once the provider
      // reports it back under a new version marker.
      const link = makeLink({ deletePolicy: 'trash' });
      const { itemId, fileId } = await deletedAndSeen(link);
      restore(fileId);
      provider.list.mockResolvedValueOnce(ok(listing([])));
      await service.syncLink(config.getLink(link.id));

      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: 'r-pushed', name: 'boarding.pdf', remoteVersion: 'v2', contentHash: FILE_SHA }),
      ])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(run.pulled).toBe(0);
      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).toHaveBeenCalledTimes(1);
      expect(itemRow(itemId).state).toBe('synced');
    });

    it('retries a re-upload that failed like any other unpaired file', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const { itemId, fileId } = await deletedAndSeen(link);
      restore(fileId);
      provider.list.mockResolvedValue(ok(listing([])));
      provider.push.mockResolvedValueOnce(fail('unreachable'));

      await service.syncLink(config.getLink(link.id));
      const failed = itemRow(itemId);
      expect(failed.state).toBe('error');
      expect(failed.remote_id).toBeNull();

      testDb.prepare('UPDATE document_sync_items SET next_attempt_at = NULL WHERE id = ?').run(itemId);
      await service.syncLink(config.getLink(link.id));

      expect(provider.push).toHaveBeenCalledTimes(2);
      expect(itemRow(itemId).state).toBe('synced');
      expect(itemRow(itemId).remote_id).toBe('r-pushed');
    });

    it('uploads many files TREK had binned instead of reading them as a mass deletion', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const fileIds = Array.from({ length: 10 }, (_, i) =>
        makeFile({ name: `doc-${i}.pdf`, storageKey: `key-${i}`, deletedAt: '2026-09-18 08:00:00' }));
      fileIds.forEach((fileId, i) =>
        seedItem(link, { remoteId: `r${i}`, remoteName: `doc-${i}.pdf`, remoteVersion: 'v1', fileId, state: 'synced' }));
      provider.list.mockResolvedValueOnce(ok(listing(fileIds.map((_, i) => remoteDoc({ remoteId: `r${i}`, name: `doc-${i}.pdf` })))));
      await service.syncLink(link);
      expect(provider.trash).toHaveBeenCalledTimes(10);

      for (const fileId of fileIds) restore(fileId);
      let seq = 0;
      provider.push.mockImplementation(async () => {
        seq += 1;
        return ok({ remoteId: `r-new-${seq}`, remoteVersion: 'v1', remoteModifiedAt: null, deduplicated: false });
      });
      provider.list.mockResolvedValueOnce(ok(listing([])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(run.errorCode).toBeUndefined();
      expect(run.state).toBe('ok');
      expect(run.pushed).toBe(10);
      expect(itemRows().every((r) => r.state === 'synced')).toBe(true);
    });

    it('does not upload a copy TREK binned that was restored at the provider meanwhile', async () => {
      // Seen while TREK's file was still in the trash, so the note that TREK
      // binned it is dropped. Without that, a later restore on a quiet binding
      // would upload a second copy.
      const link = makeLink({ deletePolicy: 'trash' });
      const { itemId, fileId } = await deletedAndSeen(link);

      provider.list.mockResolvedValueOnce(ok(listing([remoteDoc({ remoteId: 'r1' })])));
      await service.syncLink(config.getLink(link.id));
      expect(itemRow(itemId).remote_trashed_at).toBeNull();
      expect(provider.fetch).not.toHaveBeenCalled();

      restore(fileId);
      provider.list.mockImplementationOnce(quietUnlessAsked([remoteDoc({ remoteId: 'r1' })]));
      await service.syncLink(config.getLink(link.id));

      expect(provider.push).not.toHaveBeenCalled();
      expect(itemRow(itemId).state).toBe('synced');
      expect(itemRow(itemId).remote_id).toBe('r1');
    });

    it('asks a quiet binding for the whole listing and flags a copy that is gone', async () => {
      // An unchanged cursor shows nothing of the copy, and on a quiet binding
      // it stays unchanged until somebody touches the folder. Resumed blind,
      // the row was booked as synced and counted as vanished later on.
      const link = makeLink({ deletePolicy: 'unlink' });
      const { itemId, fileId } = await deletedAndSeen(link);
      const visa = remoteDoc({ remoteId: 'r-visa', name: 'visa.pdf' });

      restore(fileId);
      provider.list.mockImplementation(quietUnlessAsked([visa]));
      const run = await service.syncLink(config.getLink(link.id));

      expect(provider.list.mock.calls[1][1].cursor).toBeNull();
      expect(run).toMatchObject({ state: 'ok', pulled: 1, pushed: 0, missing: 1 });
      expect(itemRow(itemId)).toMatchObject({ state: 'remote_missing', remote_trashed_at: null });
      expect(itemRow(itemId).remote_missing_at).not.toBeNull();

      // Once the restore is settled the binding goes back to its cursor.
      await service.syncLink(config.getLink(link.id));
      expect(provider.list.mock.calls[2][1].cursor).toBe('cursor-1');
    });

    it('keeps the binding running when several restored files lost their copies meanwhile', async () => {
      // Counted as vanished, five of them next to six in step tripped the
      // mass-delete guard. The run was dropped before the restores were
      // written, the next run planned the same, and the binding synced nothing
      // at all, new documents included, until its circuit opened.
      const link = makeLink({ deletePolicy: 'unlink' });
      const inStep = Array.from({ length: 6 }, (_, i) => {
        const fileId = makeFile({ name: `doc-${i}.pdf`, storageKey: `key-doc-${i}` });
        seedItem(link, { remoteId: `s${i}`, remoteName: `doc-${i}.pdf`, remoteVersion: 'v1', fileId, contentSha256: FILE_SHA });
        return remoteDoc({ remoteId: `s${i}`, name: `doc-${i}.pdf` });
      });
      const restored = Array.from({ length: 5 }, (_, i) => seedItem(link, {
        remoteId: `g${i}`, remoteName: `gone-${i}.pdf`, remoteVersion: 'v1', state: 'local_deleted', contentSha256: FILE_SHA,
        fileId: makeFile({ name: `gone-${i}.pdf`, storageKey: `key-gone-${i}` }),
      }));
      makeFile({ name: 'new-here.pdf', storageKey: 'key-new-here' });
      const newThere = remoteDoc({ remoteId: 'r-new', name: 'new-there.pdf' });

      provider.list.mockResolvedValueOnce(ok(listing([...inStep, newThere])));
      const first = await service.syncLink(link);
      provider.list.mockResolvedValueOnce(ok(listing([
        ...inStep, newThere, remoteDoc({ remoteId: 'r-pushed', name: 'new-here.pdf' }),
      ])));
      const second = await service.syncLink(config.getLink(link.id));

      expect(first).toMatchObject({ state: 'ok', pulled: 1, pushed: 1, missing: 5 });
      expect(first.errorCode).toBeUndefined();
      expect(second).toMatchObject({ state: 'ok', pulled: 0, pushed: 0, missing: 0 });
      expect(linkRow(link.id)).toMatchObject({ failure_count: 0, last_sync_state: 'ok' });
      for (const id of restored) expect(itemRow(id).state).toBe('remote_missing');
    });

    it('flags the copy as missing when it vanished upstream by somebody else', async () => {
      const link = makeLink({ deletePolicy: 'unlink' });
      const { itemId, fileId } = await deletedAndSeen(link);

      restore(fileId);
      provider.list.mockResolvedValueOnce(ok(listing([])));
      const run = await service.syncLink(config.getLink(link.id));

      expect(provider.push).not.toHaveBeenCalled();
      expect(run.missing).toBe(1);
      expect(itemRow(itemId).state).toBe('remote_missing');
      expect(service.issues(tripId).map((r) => r.id)).toContain(itemId);
    });
  });

  /**
   * Purging leaves the row behind with `file_id` NULL (ON DELETE SET NULL), and
   * that row read as a download that never landed: under `unlink` the document
   * came back on the next run, and a purge no run had seen yet skipped the
   * delete policy entirely.
   */
  describe('a file purged from TREK trash', () => {
    const purge = (fileId: number) => testDb.prepare('DELETE FROM trip_files WHERE id = ?').run(fileId);

    it('does not download a document again once its deletion was seen', async () => {
      const link = makeLink({ deletePolicy: 'unlink' });
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, { remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced' });
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1' })])));
      await service.syncLink(link);

      purge(fileId);
      await service.syncLink(config.getLink(link.id));

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(0);
      expect(itemRow(itemId).state).toBe('local_deleted');
    });

    it('applies the delete policy when the purge came before any run saw the deletion', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, { remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced' });
      purge(fileId);
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1' })])));

      await service.syncLink(link);
      await service.syncLink(config.getLink(link.id));

      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.trash).toHaveBeenCalledTimes(1);
      expect(fileRows()).toHaveLength(0);
      expect(itemRow(itemId).state).toBe('local_deleted');
    });

    it('does not bring back a document purged while its failed update was held back', async () => {
      // A failed update keeps the file and leaves the row in `error`, where the
      // backoff drops the deletion. Purged in that window, the row read as a
      // first download that never landed, and "Sync now" fetched it again.
      const link = makeLink({ deletePolicy: 'trash' });
      const fileId = makeFile({ name: 'boarding.pdf' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced', contentSha256: FILE_SHA,
      });
      provider.list.mockResolvedValue(ok(listing([remoteDoc({ remoteId: 'r1', remoteVersion: 'v2' })])));
      provider.fetch.mockResolvedValueOnce(fail('timeout'));
      await service.syncLink(link);
      expect(itemRow(itemId)).toMatchObject({ state: 'error', file_id: fileId });

      purge(fileId);
      service.retryShelvedItems(link.id);
      await service.syncLink(config.getLink(link.id));

      expect(provider.fetch).toHaveBeenCalledTimes(1);
      expect(fileRows()).toHaveLength(0);
      expect(provider.trash).toHaveBeenCalledTimes(1);
      expect(itemRow(itemId).state).toBe('local_deleted');
    });

    /**
     * A copy on record as gone from the store, whose TREK copy is then purged.
     *
     * The row had no way out: nothing planned anything for a `remote_missing`
     * row without a listing entry, so it kept counting under "Needs a look"
     * with a sentence about a TREK copy that no longer existed. With both
     * copies gone the row closes, and the store is not asked to bin a copy
     * that is not there, whatever the delete policy says.
     */
    it('closes a row on record as gone from the store once the TREK copy is purged too', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'remote_missing',
        remoteMissingAt: '2026-09-17 08:00:00',
      });
      purge(fileId);
      provider.list.mockResolvedValue(ok(listing([])));

      const res = await service.syncLink(link);

      expect(provider.trash).not.toHaveBeenCalled();
      expect(itemRow(itemId)).toMatchObject({ state: 'local_deleted', remote_trashed_at: null, file_id: null });
      expect(itemRow(itemId).remote_missing_at).not.toBeNull();
      expect(service.issues(tripId).map((r) => r.id)).not.toContain(itemId);
      // Closed is not "back at the store": the holdings must not count it there.
      const [status] = (service.status(tripId) as { links: Array<{ holdings: { atProvider: number; missing: number } }> }).links;
      expect(status.holdings).toMatchObject({ atProvider: 0, missing: 0 });
      expect(res.state).toBe('ok');
    });
  });

  /**
   * A rename where the id is the path, walked through real runs.
   *
   * On Synology a rename upstream lists the same copy under a new id. The
   * pairing used to be re-attached with a `touch` that wrote the new name into
   * the arbiter while the trip file kept the old one, and was flagged missing
   * in the same run; the run after that renamed the provider's copy back.
   */
  describe('a rename where the id is the path', () => {
    const AT = '2026-09-18T10:00:00Z';

    beforeEach(() => {
      capabilities = { ...BASE_CAPABILITIES, stableId: false, contentHashInListing: false };
    });

    it('takes a rename made at the provider into TREK and does not rename it back', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'a.pdf' });
      const itemId = seedItem(link, {
        remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteVersion: 'va', fileId, state: 'synced',
        contentSha256: FILE_SHA, remoteSize: 1024, remoteModifiedAt: AT,
      });
      provider.list.mockResolvedValue(ok(listing([
        remoteDoc({ remoteId: '/trek/b.pdf', name: 'b.pdf', remoteVersion: 'vb', contentHash: FILE_SHA }),
      ])));

      const first = await service.syncLink(link);

      expect(first).toMatchObject({ state: 'ok', missing: 0, pulled: 0 });
      expect(fileRows().map((f) => [f.id, f.original_name, f.deleted_at])).toEqual([[fileId, 'b.pdf', null]]);
      expect(itemRow(itemId)).toMatchObject({
        remote_id: '/trek/b.pdf', remote_name: 'b.pdf', remote_version: 'vb', state: 'synced', remote_missing_at: null,
      });

      const second = await service.syncLink(config.getLink(link.id));

      expect(second).toMatchObject({ state: 'ok', missing: 0 });
      expect(provider.rename).not.toHaveBeenCalled();
      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).not.toHaveBeenCalled();
      expect(fileRows().map((f) => f.original_name)).toEqual(['b.pdf']);
      expect(itemRows()).toHaveLength(1);
    });

    it('takes a copy on record as missing off the list in the run that finds it renamed', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'a.pdf' });
      const itemId = seedItem(link, {
        remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteVersion: 'va', fileId, state: 'remote_missing',
        contentSha256: FILE_SHA, remoteSize: 1024, remoteModifiedAt: AT, remoteMissingAt: '2026-09-18 09:00:00',
      });
      provider.list.mockResolvedValue(ok(listing([
        remoteDoc({ remoteId: '/trek/b.pdf', name: 'b.pdf', remoteVersion: 'vb' }),
      ])));

      await service.syncLink(link);

      expect(itemRow(itemId)).toMatchObject({ remote_id: '/trek/b.pdf', state: 'synced', remote_missing_at: null });
      expect(fileRows().map((f) => f.original_name)).toEqual(['b.pdf']);
      expect(service.issues(tripId)).toEqual([]);

      await service.syncLink(config.getLink(link.id));

      expect(itemRow(itemId).state).toBe('synced');
      expect(provider.rename).not.toHaveBeenCalled();
    });

    it('recognises the copy by size and time where the listing has no hash', async () => {
      // What Synology actually sends. The pull records size and time, which is
      // all there is to go on once the path has changed.
      const link = makeLink();
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: '/trek/a.pdf', name: 'a.pdf', remoteVersion: 'va' }),
      ])));
      await service.syncLink(link);
      expect(provider.fetch).toHaveBeenCalledTimes(1);
      const fileId = Number(fileRows()[0].id);

      provider.list.mockResolvedValue(ok(listing([
        remoteDoc({ remoteId: '/trek/2026/b.pdf', name: 'b.pdf', remoteVersion: 'vb' }),
      ])));
      const renamed = await service.syncLink(config.getLink(link.id));
      await service.syncLink(config.getLink(link.id));

      expect(renamed.missing).toBe(0);
      expect(provider.fetch).toHaveBeenCalledTimes(1);
      expect(provider.rename).not.toHaveBeenCalled();
      expect(fileRows().map((f) => [f.id, f.original_name, f.deleted_at])).toEqual([[fileId, 'b.pdf', null]]);
      expect(itemRows().map((r) => [r.remote_id, r.remote_name, r.state])).toEqual([['/trek/2026/b.pdf', 'b.pdf', 'synced']]);
    });

    it('recognises a copy it uploaded itself when it is renamed before the next run', async () => {
      const link = makeLink();
      makeFile({ name: 'boarding.pdf' });
      provider.list.mockResolvedValueOnce(ok(listing([])));
      provider.push.mockResolvedValueOnce(ok({
        remoteId: '/trek/boarding.pdf', remoteVersion: 'v1', remoteModifiedAt: AT, deduplicated: false,
      }));
      await service.syncLink(link);

      provider.list.mockResolvedValue(ok(listing([
        remoteDoc({ remoteId: '/trek/flight.pdf', name: 'flight.pdf', remoteVersion: 'v2', size: FILE_BYTES.length }),
      ])));
      await service.syncLink(config.getLink(link.id));
      await service.syncLink(config.getLink(link.id));

      expect(provider.push).toHaveBeenCalledTimes(1);
      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.rename).not.toHaveBeenCalled();
      expect(fileRows().map((f) => f.original_name)).toEqual(['flight.pdf']);
      expect(itemRows().map((r) => [r.remote_id, r.state])).toEqual([['/trek/flight.pdf', 'synced']]);
    });

    it('finds the copy again after sending a rename made in TREK upstream', async () => {
      // The adapter cannot report the path its rename produced, so the row
      // keeps the old one until the next listing shows where the copy went.
      const link = makeLink();
      const fileId = makeFile({ name: 'b.pdf' });
      const itemId = seedItem(link, {
        remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteVersion: 'va', fileId, state: 'synced',
        contentSha256: FILE_SHA, remoteSize: 1024, remoteModifiedAt: AT,
      });
      provider.list.mockResolvedValueOnce(ok(listing([
        remoteDoc({ remoteId: '/trek/a.pdf', name: 'a.pdf', remoteVersion: 'va' }),
      ])));
      provider.rename.mockResolvedValueOnce(ok({ remoteVersion: 'vb' }));
      await service.syncLink(link);
      expect(provider.rename).toHaveBeenCalledWith(expect.anything(), expect.anything(), '/trek/a.pdf', 'b.pdf');

      provider.list.mockResolvedValue(ok(listing([
        remoteDoc({ remoteId: '/trek/b.pdf', name: 'b.pdf', remoteVersion: 'vb' }),
      ])));
      const next = await service.syncLink(config.getLink(link.id));
      await service.syncLink(config.getLink(link.id));

      expect(next.missing).toBe(0);
      expect(provider.rename).toHaveBeenCalledTimes(1);
      expect(provider.fetch).not.toHaveBeenCalled();
      expect(provider.push).not.toHaveBeenCalled();
      expect(fileRows()).toHaveLength(1);
      expect(itemRow(itemId)).toMatchObject({ remote_id: '/trek/b.pdf', remote_name: 'b.pdf', state: 'synced' });
    });
  });

  /**
   * The cursor a run hands the next one.
   *
   * Paperless, Papra and Synology build theirs from what they list, so a scope
   * that ends up the way it was before a run answers "unchanged", and the run
   * after it plans nothing upstream. A run used to store the cursor of the
   * listing it started from whatever it then did, and an upload deleted at the
   * provider before the next run left the scope exactly as that listing had it.
   */
  describe('the cursor a run leaves behind', () => {
    /**
     * A scope whose cursor is a digest of what it holds, the way those three
     * build theirs, and which the run's own writes change.
     */
    function digestScope(documents: RemoteDocument[] = []): Map<string, RemoteDocument> {
      const held = new Map(documents.map((d) => [d.remoteId, d]));
      let seq = 0;
      provider.list.mockImplementation(async (_conn, scope) => {
        const cursor = `digest:${[...held.values()].map((d) => `${d.remoteId}@${d.remoteVersion}`).sort().join(',')}`;
        return ok(listing([...held.values()], { cursor, cursorUnchanged: scope.cursor === cursor }));
      });
      provider.push.mockImplementation(async (_conn, _scope, req) => {
        seq += 1;
        const remoteId = `r-pushed-${seq}`;
        held.set(remoteId, remoteDoc({ remoteId, name: req.fileName, contentHash: FILE_SHA }));
        return ok({ remoteId, remoteVersion: 'v1', remoteModifiedAt: null, deduplicated: false });
      });
      provider.rename.mockImplementation(async (_conn, _scope, remoteId, name) => {
        held.set(remoteId, { ...(held.get(remoteId) as RemoteDocument), name, remoteVersion: 'v2' });
        return ok({ remoteVersion: 'v2' });
      });
      provider.trash.mockImplementation(async (_conn, _scope, remoteId) => {
        held.delete(remoteId);
        return ok(undefined);
      });
      return held;
    }

    it('flags a copy deleted at the provider right after TREK uploaded it', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'boarding.pdf' });
      const held = digestScope();
      expect(await service.syncLink(link)).toMatchObject({ state: 'ok', pushed: 1 });
      const itemId = Number(itemRows()[0].id);

      held.clear();
      const run = await service.syncLink(config.getLink(link.id));

      expect(run).toMatchObject({ state: 'ok', missing: 1 });
      expect(itemRow(itemId)).toMatchObject({ state: 'remote_missing', file_id: fileId });
      expect(itemRow(itemId).remote_missing_at).not.toBeNull();
      expect(service.issues(tripId).map((r) => r.id)).toEqual([itemId]);
    });

    it('lets the mass-delete guard see a scope emptied right after an upload', async () => {
      const link = makeLink();
      for (let i = 0; i < 6; i += 1) makeFile({ name: `doc-${i}.pdf`, storageKey: `key-doc-${i}` });
      const held = digestScope();
      expect(await service.syncLink(link)).toMatchObject({ state: 'ok', pushed: 6 });

      held.clear();
      const run = await service.syncLink(config.getLink(link.id));

      expect(run).toMatchObject({ state: 'partial', errorCode: 'mass_delete_guard', missing: 6 });
      expect(itemRows().every((r) => r.state === 'synced')).toBe(true);
    });

    it('notices a copy TREK binned coming back, so a restore in TREK does not upload it twice', async () => {
      const link = makeLink({ deletePolicy: 'trash' });
      const fileId = makeFile({ name: 'boarding.pdf', deletedAt: '2026-09-18 08:00:00' });
      const itemId = seedItem(link, {
        remoteId: 'r1', remoteName: 'boarding.pdf', remoteVersion: 'v1', fileId, state: 'synced', contentSha256: FILE_SHA,
      });
      const copy = remoteDoc({ remoteId: 'r1' });
      const held = digestScope([copy]);
      await service.syncLink(link);
      expect(held.size).toBe(0);
      expect(itemRow(itemId).remote_trashed_at).not.toBeNull();

      // Out of the provider's recycle bin as it went in, which is the scope the
      // binning run listed.
      held.set('r1', copy);
      await service.syncLink(config.getLink(link.id));
      expect(itemRow(itemId).remote_trashed_at).toBeNull();

      testDb.prepare('UPDATE trip_files SET deleted_at = NULL WHERE id = ?').run(fileId);
      await service.syncLink(config.getLink(link.id));

      expect(provider.push).not.toHaveBeenCalled();
      expect(itemRow(itemId)).toMatchObject({ state: 'synced', remote_id: 'r1' });
    });

    it('lists in full after a rename it sent, then goes back to its cursor', async () => {
      const link = makeLink();
      const fileId = makeFile({ name: 'new.pdf' });
      seedItem(link, { remoteId: 'r1', remoteName: 'old.pdf', remoteVersion: 'v1', fileId, state: 'synced' });
      digestScope([remoteDoc({ remoteId: 'r1', name: 'old.pdf' })]);

      await service.syncLink(link);
      expect(provider.rename).toHaveBeenCalledTimes(1);
      expect(linkRow(link.id).remote_cursor).toBeNull();

      await service.syncLink(config.getLink(link.id));
      expect(linkRow(link.id).remote_cursor).toBe('digest:r1@v2');
      const quiet = await service.syncLink(config.getLink(link.id));

      expect(provider.list.mock.calls[2][1].cursor).toBe('digest:r1@v2');
      expect(quiet).toMatchObject({ state: 'ok', pulled: 0, pushed: 0 });
      expect(provider.rename).toHaveBeenCalledTimes(1);
    });

    it('pulls what the transfer budget left over on the next ordinary run', async () => {
      const link = makeLink();
      digestScope(Array.from({ length: MAX_TRANSFERS_PER_RUN + 5 }, (_, i) =>
        remoteDoc({ remoteId: `r${i}`, name: `doc-${i}.pdf` })));

      expect(await service.syncLink(link)).toMatchObject({ state: 'partial', pulled: MAX_TRANSFERS_PER_RUN });
      const rest = await service.syncLink(config.getLink(link.id));

      expect(rest).toMatchObject({ state: 'ok', pulled: 5 });
      expect(fileRows()).toHaveLength(MAX_TRANSFERS_PER_RUN + 5);
    });

    it('fetches a failed download again while nothing moves upstream', async () => {
      const link = makeLink();
      digestScope([remoteDoc({ remoteId: 'r-new', name: 'fresh.pdf' })]);
      provider.fetch.mockResolvedValueOnce(fail('timeout'));
      expect(await service.syncLink(link)).toMatchObject({ state: 'partial', errorCode: 'timeout' });

      testDb.prepare('UPDATE document_sync_items SET next_attempt_at = NULL').run();
      const retry = await service.syncLink(config.getLink(link.id));

      expect(retry).toMatchObject({ state: 'ok', pulled: 1 });
      expect(provider.fetch).toHaveBeenCalledTimes(2);
      expect(itemRows()[0]).toMatchObject({ state: 'synced', remote_id: 'r-new' });
    });
  });

  describe('resolveConflict across trips', () => {
    function conflictedItem(linkId: number, tripOfItem: number): number {
      return Number(testDb.prepare(
        `INSERT INTO document_sync_items (link_id, trip_id, trek_doc_uid, remote_id, state)
         VALUES (?, ?, 'uid-conflict', 'r-conflict', 'conflict')`,
      ).run(linkId, tripOfItem).lastInsertRowid);
    }
    it('refuses when the row belongs to another trip', async () => {
      const link = makeLink();
      const itemId = conflictedItem(link.id, link.trip_id);
      expect(await service.resolveConflict(itemId, 'trek', link.trip_id + 999)).toBe(false);
      const after = testDb.prepare('SELECT state FROM document_sync_items WHERE id = ?').get(itemId) as { state: string };
      expect(after.state).toBe('conflict');
    });
    it('resolves when the row belongs to the trip', async () => {
      const link = makeLink();
      const itemId = conflictedItem(link.id, link.trip_id);
      expect(await service.resolveConflict(itemId, 'trek', link.trip_id)).toBe(true);
      const after = testDb.prepare('SELECT state FROM document_sync_items WHERE id = ?').get(itemId) as { state: string };
      expect(after.state).not.toBe('conflict');
    });
    it('still works for a caller that names no trip, so nothing else breaks', async () => {
      const link = makeLink();
      const itemId = conflictedItem(link.id, link.trip_id);
      expect(await service.resolveConflict(itemId, 'trek')).toBe(true);
    });
  });
});
