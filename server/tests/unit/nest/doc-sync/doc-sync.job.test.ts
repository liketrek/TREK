/**
 * The scheduling shell around document sync, built with `new` and plain mocks:
 * no container, no timer, no provider.
 *
 * What the job itself decides is small, and all of it is the kind that breaks
 * silently. The addon gate and the kill switch are re-read per tick, which is
 * the promise the docblock makes an admin ("toggle it and it takes effect")
 * and the only thing that makes the difference between this job and the
 * Dawarich one visible. The interval is typed by a human into app_settings, so
 * '5' and '999999' both have to land somewhere the cron parser accepts. And one
 * unreachable NAS must not take the other trips' bindings down with it.
 *
 * The last block is the exception: an admin's provider switch lives in the
 * service's query, so it runs the tick over the real service and a database.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import Database from 'better-sqlite3';

const log = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => log);

import { ADDON_IDS } from '../../../../src/addons';
import { DocSyncJob } from '../../../../src/nest/doc-sync/doc-sync.job';
import { SETTING_POLL_INTERVAL, SETTING_SYNC_ENABLED } from '../../../../src/nest/doc-sync/doc-sync.constants';
import { DocSyncConfigService, type LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
import type { DocumentProvider } from '../../../../src/nest/doc-sync/document-provider';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { AllowedFileTypesService } from '../../../../src/nest/files/allowed-file-types.service';
import type { FilesService } from '../../../../src/nest/files/files.service';
import type { StorageService } from '../../../../src/nest/storage/storage.service';
import type { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { createTrip, createUser } from '../../../helpers/factories';

const link = (id: number): LinkRow => ({ id, provider_id: 'paperless' } as LinkRow);

const RUN = { state: 'ok', pulled: 0, pushed: 0, conflicts: 0, missing: 0 };

interface Setup {
  /** Absent means no app_settings row at all, which is the shipped state. */
  interval?: string;
  killSwitch?: string;
  addonOn: boolean;
  registrarEnabled: boolean;
  links: LinkRow[];
  orphaned: number;
}

function makeJob(over: Partial<Setup> = {}) {
  const setup: Setup = { addonOn: true, registrarEnabled: true, links: [], orphaned: 0, ...over };

  const settings = new Map<string, string>();
  if (setup.interval !== undefined) settings.set(SETTING_POLL_INTERVAL, setup.interval);
  if (setup.killSwitch !== undefined) settings.set(SETTING_SYNC_ENABLED, setup.killSwitch);

  // Shaped like the real `get<T>(sql, ...params)` so the stub cannot drift from
  // the signature the job calls, and so a case can tell the two keys apart.
  const db = {
    get: vi.fn((_sql: string, key?: unknown) => {
      const value = settings.get(String(key));
      return value === undefined ? undefined : { value };
    }),
  };

  let onTick: (() => void | Promise<void>) | undefined;
  const registrar = {
    isEnabled: vi.fn(() => setup.registrarEnabled),
    register: vi.fn((_name: string, _expression: string, cb: () => void | Promise<void>) => {
      onTick = cb;
      return setup.registrarEnabled;
    }),
    unregister: vi.fn(),
  };

  // Both stubs carry the real signatures, so a case can read back which link a
  // run was asked for instead of only that some run happened.
  const sync = {
    dueLinks: vi.fn((_limit?: number) => setup.links),
    syncLink: vi.fn(async (_link: LinkRow, _opts?: { full?: boolean }) => RUN),
  };
  const config = { markOrphanedLinks: vi.fn(() => setup.orphaned) };
  const addons = { isAddonEnabled: vi.fn(() => setup.addonOn) };

  const job = new DocSyncJob(
    db as unknown as DatabaseService,
    sync as unknown as DocSyncService,
    config as unknown as DocSyncConfigService,
    addons as unknown as AddonsService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, db, registrar, sync, config, addons, takeTick: () => onTick };
}

beforeEach(() => vi.clearAllMocks());

describe('DocSyncJob bootstrap', () => {
  it('schedules nothing, reads nothing and logs nothing while the registrar is off', () => {
    // The test gate. A job that registered past it would have every suite boot
    // start polling whatever document store sits in the fixture database.
    const { job, registrar, db } = makeJob({ registrarEnabled: false });
    job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
    expect(log.logInfo).not.toHaveBeenCalled();
  });

  it('registers one cron under a name of its own, on the minute', () => {
    // Every minute, with the tick deciding whether it is due. Baking the
    // interval into the expression at bootstrap meant a changed setting did
    // nothing until a restart, which is the opposite of what this job's own
    // comment promises, and nothing re-registers it (auto-backup has a start()
    // its settings save calls; this has no such path).
    const { job, registrar } = makeJob();
    job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('docsync', '* * * * *', expect.any(Function));
    expect(log.logInfo).toHaveBeenCalledWith('Document sync: polling every 300s');
  });

  it('reads the interval from its own app_settings key', () => {
    const { job, db } = makeJob({ interval: '600' });
    job.onApplicationBootstrap();
    expect(db.get).toHaveBeenCalledWith('SELECT value FROM app_settings WHERE key = ?', SETTING_POLL_INTERVAL);
  });

  it('hands the registrar the tick itself, so a fired cron reaches the sync', async () => {
    const { job, sync, takeTick } = makeJob({ links: [link(1)] });
    job.onApplicationBootstrap();
    const tick = takeTick();
    expect(tick).toBeTypeOf('function');
    await tick?.();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('does not decide at bootstrap whether the addon is on', () => {
    // Asking here would freeze the answer for the life of the process, and the
    // bug would read as "the documents toggle needs a restart".
    const { job, addons } = makeJob();
    job.onApplicationBootstrap();
    expect(addons.isAddonEnabled).not.toHaveBeenCalled();
  });
});

describe('DocSyncJob tick', () => {
  it('does nothing at all while the documents addon is off', async () => {
    const { job, sync, config, db } = makeJob({ addonOn: false, links: [link(1)] });
    await job.tick();
    expect(sync.dueLinks).not.toHaveBeenCalled();
    expect(sync.syncLink).not.toHaveBeenCalled();
    expect(config.markOrphanedLinks).not.toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
  });

  it('asks the addon gate again on every tick, so switching it on needs no restart', async () => {
    const { job, addons, sync } = makeJob({ addonOn: false, links: [link(1)] });
    await job.tick();
    expect(sync.syncLink).not.toHaveBeenCalled();

    addons.isAddonEnabled.mockReturnValue(true);
    await job.tick();
    expect(addons.isAddonEnabled).toHaveBeenCalledTimes(2);
    expect(addons.isAddonEnabled).toHaveBeenLastCalledWith(ADDON_IDS.DOCUMENTS);
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('stops the run on the kill switch, without touching the bindings', async () => {
    const { job, sync, config, db } = makeJob({ killSwitch: 'false', links: [link(1)] });
    await job.tick();
    expect(db.get).toHaveBeenCalledWith('SELECT value FROM app_settings WHERE key = ?', SETTING_SYNC_ENABLED);
    expect(config.markOrphanedLinks).not.toHaveBeenCalled();
    expect(sync.dueLinks).not.toHaveBeenCalled();
  });

  it('keeps syncing on anything that is not exactly the string false', async () => {
    // The setting is absent by default, so an unrecognised value has to mean ON.
    // Treating '0' or 'off' as a stop would silently disable sync for anyone who
    // typed the switch by hand into app_settings.
    for (const value of [undefined, '', '0', 'off', 'no', 'FALSE', 'true']) {
      vi.clearAllMocks();
      const { job, sync } = makeJob({ killSwitch: value, links: [link(1)] });
      await job.tick();
      expect(sync.syncLink).toHaveBeenCalledTimes(1);
    }
  });

  it('re-reads the kill switch per tick instead of remembering the first answer', async () => {
    const { job, db } = makeJob({ links: [link(1)] });
    await job.tick();
    await job.tick();
    const killSwitchReads = db.get.mock.calls.filter((c) => c[1] === SETTING_SYNC_ENABLED).length;
    expect(killSwitchReads).toBe(2);
  });

  it('sweeps bindings whose credential owner left the trip before it syncs anything', async () => {
    const { job, config, sync } = makeJob({ orphaned: 2, links: [link(1)] });
    await job.tick();
    expect(config.markOrphanedLinks).toHaveBeenCalledTimes(1);
    expect(config.markOrphanedLinks.mock.invocationCallOrder[0]).toBeLessThan(
      sync.dueLinks.mock.invocationCallOrder[0],
    );
    expect(log.logInfo).toHaveBeenCalledWith('Document sync: 2 link(s) orphaned, owner no longer on the trip');
  });

  it('stays quiet when the sweep found nothing', async () => {
    const { job, config } = makeJob({ orphaned: 0 });
    await job.tick();
    expect(config.markOrphanedLinks).toHaveBeenCalledTimes(1);
    expect(log.logInfo).not.toHaveBeenCalled();
  });

  it('runs the remaining bindings after one of them throws', async () => {
    // An unreachable NAS on one trip is not a reason to skip a Paperless
    // binding on another, and the two are ordinary neighbours in one list.
    const { job, sync } = makeJob({ links: [link(1), link(2), link(3)] });
    sync.syncLink.mockRejectedValueOnce(new Error('EHOSTUNREACH'));
    await expect(job.tick()).resolves.toBeUndefined();
    expect(sync.syncLink).toHaveBeenCalledTimes(3);
    expect(log.logError).toHaveBeenCalledWith('Document sync: link 1 failed: EHOSTUNREACH');
  });

  it('logs a non-Error rejection by value rather than as an empty message', async () => {
    const { job, sync } = makeJob({ links: [link(7)] });
    sync.syncLink.mockRejectedValueOnce('ECONNREFUSED');
    await job.tick();
    expect(log.logError).toHaveBeenCalledWith('Document sync: link 7 failed: ECONNREFUSED');
  });

  it('never rejects, so a failure inside it cannot escape into the scheduler', async () => {
    const { job, sync } = makeJob();
    sync.dueLinks.mockImplementation(() => {
      throw new Error('database is locked');
    });
    await expect(job.tick()).resolves.toBeUndefined();
    expect(log.logError).toHaveBeenCalledWith('Document sync tick failed: database is locked');
  });

  it('logs a failure thrown as a bare value by what it printed, not as an empty message', async () => {
    const { job, addons } = makeJob();
    addons.isAddonEnabled.mockImplementation(() => {
      throw 'SQLITE_BUSY';
    });
    await expect(job.tick()).resolves.toBeUndefined();
    expect(log.logError).toHaveBeenCalledWith('Document sync tick failed: SQLITE_BUSY');
  });

  it('recovers on the next due tick after a failed one', async () => {
    // A failed pass still spends its interval, on purpose: a tick that throws
    // every time would otherwise run on every minute the cron fires. It does not
    // block anything permanently: the next due tick works normally.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(10_000_000));
      const { job, sync } = makeJob({ links: [link(1)], interval: '300' });
      sync.dueLinks.mockImplementationOnce(() => {
        throw new Error('down');
      });
      await job.tick();
      expect(sync.syncLink).not.toHaveBeenCalled();
      expect(log.logError).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date(10_300_000));
      await job.tick();
      expect(sync.syncLink).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves the choice of what is due to the sync service', async () => {
    // The job passes the rows through untouched: the backoff, the circuit
    // breaker and the ordering all live in dueLinks, and a filter copied up
    // here would be a second place to keep them in step with.
    const links = [link(4), link(5)];
    const { job, sync } = makeJob({ links });
    await job.tick();
    expect(sync.syncLink.mock.calls.map((c) => c[0])).toEqual(links);
  });
});

/**
 * The interval, now that the cron fires every minute.
 *
 * It used to be baked into the cron expression at bootstrap, so the setting did
 * nothing until a restart while this file's own header said otherwise. The tick
 * now decides, which also means the clamp has to hold here instead of in the
 * expression: an interval of 0 must not turn the minute cron into a run every
 * minute, and a huge one must not park the job for a day.
 */
describe('DocSyncJob due-ness', () => {
  // Fake system time rather than a Date.now spy: the spy has to be re-applied
  // after the suite-wide clearAllMocks, and a cleared spy answers undefined,
  // which reads as "no time has passed" and fails the case for the wrong reason.
  const at = (ms: number) => vi.setSystemTime(new Date(ms));

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs the first tick it is given', async () => {
    const { job, sync } = makeJob({ links: [link(1)] });
    at(1_000_000);
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('does nothing on a tick inside the interval', async () => {
    const { job, sync } = makeJob({ links: [link(1)], interval: '300' });
    at(1_000_000);
    await job.tick();
    at(1_000_000 + 299_000);
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('runs again once the interval has passed', async () => {
    const { job, sync } = makeJob({ links: [link(1)], interval: '300' });
    at(1_000_000);
    await job.tick();
    at(1_000_000 + 300_000);
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('keeps the floor: a zero or negative setting still waits a minute', async () => {
    for (const setting of ['0', '-300', '10']) {
      const { job, sync } = makeJob({ links: [link(1)], interval: setting });
      at(2_000_000);
      await job.tick();
      at(2_000_000 + 59_000);
      await job.tick();
      expect(sync.syncLink, `interval=${setting} ran again inside the floor`).toHaveBeenCalledTimes(1);
      at(2_000_000 + 60_000);
      await job.tick();
      expect(sync.syncLink, `interval=${setting} did not run at the floor`).toHaveBeenCalledTimes(2);
    }
  });

  it('keeps the ceiling: an absurd setting waits an hour, not a day', async () => {
    const { job, sync } = makeJob({ links: [link(1)], interval: '86400' });
    at(3_000_000);
    await job.tick();
    at(3_000_000 + 3_600_000);
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('takes a changed setting without a restart, which is the whole point', async () => {
    const settings = new Map<string, string>([[SETTING_POLL_INTERVAL, '3600']]);
    const db = {
      get: vi.fn((_sql: string, key?: unknown) => {
        const value = settings.get(String(key));
        return value === undefined ? undefined : { value };
      }),
    };
    const sync = {
      dueLinks: vi.fn(() => [link(1)]),
      syncLink: vi.fn(async () => RUN),
    };
    const job = new DocSyncJob(
      db as unknown as DatabaseService,
      sync as unknown as DocSyncService,
      { markOrphanedLinks: vi.fn(() => 0) } as unknown as DocSyncConfigService,
      { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
      { isEnabled: vi.fn(() => true), register: vi.fn(), unregister: vi.fn() } as unknown as CronRegistrarService,
    );

    at(4_000_000);
    await job.tick();
    at(4_000_000 + 120_000);
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(1); // still inside the hour

    settings.set(SETTING_POLL_INTERVAL, '60');
    await job.tick();
    expect(sync.syncLink).toHaveBeenCalledTimes(2);
  });

  it('does not count a tick the kill switch stopped, so switching back on runs at once', async () => {
    const { job, sync } = makeJob({ links: [link(1)], interval: '3600', killSwitch: 'false' });
    at(5_000_000);
    await job.tick();
    expect(sync.syncLink).not.toHaveBeenCalled();
  });
});

/**
 * A provider an admin switched off, over the real service and a real database.
 *
 * The job leaves what is due to `dueLinks` (see "leaves the choice of what is
 * due to the sync service" above), so the switch is a property of that query
 * and only shows with the query running. A stubbed `dueLinks` would restate
 * whatever this file told it.
 */
describe('DocSyncJob and a provider switched off in the admin panel', () => {
  const testDb = new Database(':memory:');
  const dbs = new DatabaseService(testDb);
  let paperlessLink: number;
  let nextcloudLink: number;

  const fakeProvider = (id: string) => ({
    id,
    capabilities: () => ({
      push: 'none', stableId: true, remoteTrash: true, replaceInPlace: true, contentHashInListing: true,
      maxUploadBytes: null, acceptedMimeTypes: null, canCreateScope: true,
    }),
    resolveScope: vi.fn(async () => ({ success: true, data: { scopeKey: 'tag:1', label: 'Japan', remoteRootId: '1', remoteRootPath: null } })),
    list: vi.fn(async () => ({ success: true, data: { documents: [], cursor: null, cursorUnchanged: false, truncated: false } })),
  });
  const paperless = fakeProvider('paperless');
  const nextcloud = fakeProvider('nextcloud');

  const addons = { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService;
  const registry = new DocumentProviderRegistry([paperless, nextcloud] as unknown as DocumentProvider[]);
  const config = new DocSyncConfigService(dbs, registry);
  const service = new DocSyncService(
    dbs, config, registry,
    {} as StorageService, {} as FilesService, new AllowedFileTypesService(dbs),
    { broadcast: vi.fn() } as unknown as RealtimeService,
    addons,
  );
  const registrar = { isEnabled: () => false } as unknown as CronRegistrarService;
  /** A job of its own per pass, so the interval never decides whether a tick runs. */
  const tick = () => new DocSyncJob(dbs, service, config, addons, registrar).tick();

  const switchProvider = (id: string, on: boolean) =>
    testDb.prepare('UPDATE document_providers SET enabled = ? WHERE id = ?').run(on ? 1 : 0, id);
  const linkRow = (id: number) => testDb.prepare('SELECT * FROM trip_document_links WHERE id = ?').get(id);

  beforeAll(() => {
    createTables(testDb);
    runMigrations(testDb);
    const ownerId = createUser(testDb, { username: 'owner', email: 'owner@docsync-job.test' }).user.id;
    const tripId = createTrip(testDb, ownerId, { title: 'Japan' }).id;
    const bind = (providerId: string) => {
      const conn = testDb
        .prepare(
          `INSERT INTO document_connections (trip_id, provider_id, owner_user_id, base_url, secrets, settings)
           VALUES (?, ?, ?, 'https://docs.example.com', NULL, '{}')`,
        )
        .run(tripId, providerId, ownerId);
      return Number(testDb
        .prepare(
          `INSERT INTO trip_document_links
             (trip_id, connection_id, provider_id, remote_scope_key, remote_label, direction, delete_policy,
              conflict_policy, sync_enabled, created_by)
           VALUES (?, ?, ?, 'tag:1', 'Japan', 'both', 'unlink', 'manual', 1, ?)`,
        )
        .run(tripId, conn.lastInsertRowid, providerId, ownerId).lastInsertRowid);
    };
    paperlessLink = bind('paperless');
    nextcloudLink = bind('nextcloud');
  });

  afterAll(() => testDb.close());

  beforeEach(() => {
    switchProvider('paperless', false);
    switchProvider('nextcloud', true);
  });

  it('runs the bindings that may run and leaves the switched-off one exactly as it was', async () => {
    const before = linkRow(paperlessLink);

    await tick();

    expect(nextcloud.list).toHaveBeenCalledTimes(1);
    expect(paperless.resolveScope).not.toHaveBeenCalled();
    expect(paperless.list).not.toHaveBeenCalled();
    expect(linkRow(paperlessLink)).toEqual(before);
    expect(linkRow(nextcloudLink)).toMatchObject({ last_sync_state: 'ok' });
  });

  it('picks the binding up again on the next tick once the provider is back on', async () => {
    await tick();
    expect(paperless.list).not.toHaveBeenCalled();

    switchProvider('paperless', true);
    await tick();

    expect(paperless.list).toHaveBeenCalledTimes(1);
    expect(linkRow(paperlessLink)).toMatchObject({ last_sync_state: 'ok', failure_count: 0 });
  });
});
