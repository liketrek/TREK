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
import { ADDON_IDS } from '../../../../src/addons';
import { DocumentConnections } from '../../../../src/db/entities/DocumentConnections.entity';
import { DocumentProviders } from '../../../../src/db/entities/DocumentProviders.entity';
import { TripDocumentLinks } from '../../../../src/db/entities/TripDocumentLinks.entity';
import type { AppSettingsRepository } from '../../../../src/db/repositories/AppSettings.repository';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { DocSyncConfigService, type LinkRow } from '../../../../src/nest/doc-sync/doc-sync-config.service';
import { SETTING_POLL_INTERVAL, SETTING_SYNC_ENABLED } from '../../../../src/nest/doc-sync/doc-sync.constants';
import { DocSyncJob } from '../../../../src/nest/doc-sync/doc-sync.job';
import { DocSyncService } from '../../../../src/nest/doc-sync/doc-sync.service';
import type { DocumentProvider } from '../../../../src/nest/doc-sync/document-provider';
import { DocumentProviderRegistry } from '../../../../src/nest/doc-sync/document-provider.registry';
import { AllowedFileTypesService } from '../../../../src/nest/files/allowed-file-types.service';
import type { FilesService } from '../../../../src/nest/files/files.service';
import type { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import type { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import type { StorageService } from '../../../../src/nest/storage/storage.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import {
  createTestDocumentConnectionsRepo,
  createTestDocumentProviderFieldsRepo,
  createTestDocumentProvidersRepo,
  createTestDocumentSyncItemsRepo,
  createTestFileLinksRepo,
  createTestTripDocumentLinksRepo,
  createTestTripFilesRepo,
} from '../../../helpers/doc-sync-repos';
import { createTrip, createUser } from '../../../helpers/factories';
import { findRow, insertRow, updateRows } from '../../../helpers/factories/rows';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestTripsRepo,
  sharedTestOrm,
} from '../../../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

const log = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => log);

const link = (id: number): LinkRow => ({ id, provider_id: 'paperless' }) as LinkRow;

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

  // Shaped like the real `AppSettingsRepository.getValue(key): Promise<string
  // | null>` so the stub cannot drift from the signature the job calls, and
  // so a case can tell the two keys apart.
  const appSettings = {
    getValue: vi.fn(async (key: string) => settings.get(key) ?? null),
  };

  let onTick: (() => void | Promise<void>) | undefined;
  const registrar = {
    isEnabled: vi.fn(() => setup.registrarEnabled),
    register: vi.fn((_name: string, _expression: string, cb: () => void | Promise<void>) => {
      onTick = cb;
      return setup.registrarEnabled;
    }),
    unregister: vi.fn(),
    // task-6-fix-brief.md item 7: the boot-time banner read now runs through
    // CronRegistrarService.runOnBoot instead of directly inline — this
    // double just runs fn immediately, reproducing the pre-fix behaviour
    // exactly, so every existing assertion below is unaffected.
    runOnBoot: vi.fn(async (_name: string, fn: () => void | Promise<void>) => {
      await fn();
    }),
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
    appSettings as unknown as AppSettingsRepository,
    sync as unknown as DocSyncService,
    config as unknown as DocSyncConfigService,
    addons as unknown as AddonsService,
    registrar as unknown as CronRegistrarService,
  );
  return { job, appSettings, registrar, sync, config, addons, takeTick: () => onTick };
}

beforeEach(() => vi.clearAllMocks());

describe('DocSyncJob bootstrap', () => {
  it('schedules nothing, reads nothing and logs nothing while the registrar is off', async () => {
    // The test gate. A job that registered past it would have every suite boot
    // start polling whatever document store sits in the fixture database.
    const { job, registrar, appSettings } = makeJob({ registrarEnabled: false });
    await job.onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
    expect(appSettings.getValue).not.toHaveBeenCalled();
    expect(log.logInfo).not.toHaveBeenCalled();
  });

  it('registers one cron under a name of its own, on the minute', async () => {
    // Every minute, with the tick deciding whether it is due. Baking the
    // interval into the expression at bootstrap meant a changed setting did
    // nothing until a restart, which is the opposite of what this job's own
    // comment promises, and nothing re-registers it (auto-backup has a start()
    // its settings save calls; this has no such path).
    const { job, registrar } = makeJob();
    await job.onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledWith('docsync', '* * * * *', expect.any(Function));
    expect(log.logInfo).toHaveBeenCalledWith('Document sync: polling every 300s');
  });

  it('reads the interval from its own app_settings key', async () => {
    const { job, appSettings } = makeJob({ interval: '600' });
    await job.onApplicationBootstrap();
    expect(appSettings.getValue).toHaveBeenCalledWith(SETTING_POLL_INTERVAL);
  });

  it('hands the registrar the tick itself, so a fired cron reaches the sync', async () => {
    const { job, sync, takeTick } = makeJob({ links: [link(1)] });
    await job.onApplicationBootstrap();
    const tick = takeTick();
    expect(tick).toBeTypeOf('function');
    await tick?.();
    expect(sync.syncLink).toHaveBeenCalledTimes(1);
  });

  it('does not decide at bootstrap whether the addon is on', async () => {
    // Asking here would freeze the answer for the life of the process, and the
    // bug would read as "the documents toggle needs a restart".
    const { job, addons } = makeJob();
    await job.onApplicationBootstrap();
    expect(addons.isAddonEnabled).not.toHaveBeenCalled();
  });

  it('the boot-time interval banner goes through CronRegistrarService.runOnBoot (task-6-review-parity.md C1 — the boot-sweep choke point)', async () => {
    const { job, registrar } = makeJob({ interval: '90' });
    await job.onApplicationBootstrap();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('docsync-boot', expect.any(Function));
  });
});

describe('DocSyncJob tick', () => {
  it('does nothing at all while the documents addon is off', async () => {
    const { job, sync, config, appSettings } = makeJob({ addonOn: false, links: [link(1)] });
    await job.tick();
    expect(sync.dueLinks).not.toHaveBeenCalled();
    expect(sync.syncLink).not.toHaveBeenCalled();
    expect(config.markOrphanedLinks).not.toHaveBeenCalled();
    expect(appSettings.getValue).not.toHaveBeenCalled();
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
    const { job, sync, config, appSettings } = makeJob({ killSwitch: 'false', links: [link(1)] });
    await job.tick();
    expect(appSettings.getValue).toHaveBeenCalledWith(SETTING_SYNC_ENABLED);
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
    const { job, appSettings } = makeJob({ links: [link(1)] });
    await job.tick();
    await job.tick();
    const killSwitchReads = appSettings.getValue.mock.calls.filter((c) => c[0] === SETTING_SYNC_ENABLED).length;
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
    const appSettings = {
      getValue: vi.fn(async (key: string) => settings.get(key) ?? null),
    };
    const sync = {
      dueLinks: vi.fn(() => [link(1)]),
      syncLink: vi.fn(async () => RUN),
    };
    const job = new DocSyncJob(
      appSettings as unknown as AppSettingsRepository,
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
  const testDb = createSnapshotTestDb();
  let paperlessLink: number;
  let nextcloudLink: number;

  const fakeProvider = (id: string) => ({
    id,
    capabilities: () => ({
      push: 'none',
      stableId: true,
      remoteTrash: true,
      replaceInPlace: true,
      contentHashInListing: true,
      maxUploadBytes: null,
      acceptedMimeTypes: null,
      canCreateScope: true,
    }),
    resolveScope: vi.fn(async () => ({
      success: true,
      data: { scopeKey: 'tag:1', label: 'Japan', remoteRootId: '1', remoteRootPath: null },
    })),
    list: vi.fn(async () => ({
      success: true,
      data: { documents: [], cursor: null, cursorUnchanged: false, truncated: false },
    })),
  });
  const paperless = fakeProvider('paperless');
  const nextcloud = fakeProvider('nextcloud');

  const addons = { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService;
  const registry = new DocumentProviderRegistry([paperless, nextcloud] as unknown as DocumentProvider[]);
  // Built in beforeAll: DocSyncConfigService and DocSyncService now take a
  // UnitOfWork, and createTestUnitOfWork is async — module-scope construction
  // cannot await it.
  let config: DocSyncConfigService;
  let service: DocSyncService;
  let appSettingsRepo: AppSettingsRepository;
  const registrar = { isEnabled: () => false } as unknown as CronRegistrarService;
  /** A job of its own per pass, so the interval never decides whether a tick runs. */
  const tick = () => new DocSyncJob(appSettingsRepo, service, config, addons, registrar).tick();

  const switchProvider = async (id: string, on: boolean) =>
    updateRows(await sharedTestOrm(testDb), DocumentProviders, { id }, { enabled: on ? 1 : 0 });
  const linkRow = async (id: number) => findRow(await sharedTestOrm(testDb), TripDocumentLinks, { id });

  beforeAll(async () => {
    appSettingsRepo = await createTestAppSettingsRepo(testDb);
    config = new DocSyncConfigService(
      await createTestTripsRepo(testDb),
      await createTestDocumentProvidersRepo(testDb),
      await createTestDocumentProviderFieldsRepo(testDb),
      await createTestDocumentConnectionsRepo(testDb),
      await createTestTripDocumentLinksRepo(testDb),
      await createTestDocumentSyncItemsRepo(testDb),
      registry,
      await createTestUnitOfWork(testDb),
    );
    service = new DocSyncService(
      await createTestTripDocumentLinksRepo(testDb),
      await createTestDocumentSyncItemsRepo(testDb),
      await createTestTripFilesRepo(testDb),
      await createTestFileLinksRepo(testDb),
      appSettingsRepo,
      config,
      registry,
      {} as StorageService,
      {} as FilesService,
      new AllowedFileTypesService(appSettingsRepo),
      { broadcast: vi.fn() } as unknown as RealtimeService,
      addons,
      await createTestUnitOfWork(testDb),
    );
    const ownerId = createUser(testDb, { username: 'owner', email: 'owner@docsync-job.test' }).user.id;
    const tripId = createTrip(testDb, ownerId, { title: 'Japan' }).id;
    const orm = await sharedTestOrm(testDb);
    const bind = async (providerId: string) => {
      const connectionId = await insertRow(orm, DocumentConnections, {
        trip: tripId,
        provider: providerId,
        ownerUser: ownerId,
        base_url: 'https://docs.example.com',
        secrets: null,
        settings: '{}',
      });
      return insertRow(orm, TripDocumentLinks, {
        trip: tripId,
        connection: connectionId,
        provider_id: providerId,
        remote_scope_key: 'tag:1',
        remote_label: 'Japan',
        direction: 'both',
        delete_policy: 'unlink',
        conflict_policy: 'manual',
        sync_enabled: 1,
        createdByRef: ownerId,
      });
    };
    paperlessLink = await bind('paperless');
    nextcloudLink = await bind('nextcloud');
  });

  afterAll(() => testDb.close());

  beforeEach(async () => {
    await switchProvider('paperless', false);
    await switchProvider('nextcloud', true);
  });

  it('runs the bindings that may run and leaves the switched-off one exactly as it was', async () => {
    const before = await linkRow(paperlessLink);

    await tick();

    expect(nextcloud.list).toHaveBeenCalledTimes(1);
    expect(paperless.resolveScope).not.toHaveBeenCalled();
    expect(paperless.list).not.toHaveBeenCalled();
    expect(await linkRow(paperlessLink)).toEqual(before);
    expect(await linkRow(nextcloudLink)).toMatchObject({ last_sync_state: 'ok' });
  });

  it('picks the binding up again on the next tick once the provider is back on', async () => {
    await tick();
    expect(paperless.list).not.toHaveBeenCalled();

    await switchProvider('paperless', true);
    await tick();

    expect(paperless.list).toHaveBeenCalledTimes(1);
    expect(await linkRow(paperlessLink)).toMatchObject({ last_sync_state: 'ok', failure_count: 0 });
  });
});
