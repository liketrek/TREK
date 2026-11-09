import { db } from '../../../src/db/database';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import type { TrekPhotosRepository } from '../../../src/db/repositories/TrekPhotos.repository';
import type { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import {
  SYNOLOGY_CAPTURE_REPAIR_DONE_KEY,
  SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY,
  SynologyCaptureRepairJob,
} from '../../../src/nest/memories/synology-capture-repair.job';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import { findRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestAppSettingsRepo, sharedTestOrm } from '../../helpers/test-uow';

import { beforeEach, describe, expect, it, vi } from 'vitest';

/** #3019: one pass over every Synology photo, asking its library again. */
describe('SynologyCaptureRepairJob', () => {
  const PHOTOS = [
    { id: 1, owner_id: 10 },
    { id: 2, owner_id: 10 },
    { id: 3, owner_id: 11 },
  ];
  // runOnBoot is where the real registrar opens the request context; here it just runs the pass.
  const registrar = (enabled: boolean) =>
    ({
      isEnabled: () => enabled,
      runOnBoot: async (_name: string, fn: () => Promise<void>) => fn(),
    }) as unknown as CronRegistrarService;
  // Pages of two, the way listByProviderAfter answers past an id.
  const trekPhotos = {
    listByProviderAfter: vi.fn(async (_provider: string, after: number) =>
      PHOTOS.filter((p) => p.id > after).slice(0, 2),
    ),
  } as unknown as TrekPhotosRepository;
  const reconfirm = vi.fn();
  const backfill = { reconfirm } as unknown as PhotoCaptureBackfillService;
  const setting = async (key: string) => (await findRow(await sharedTestOrm(db), AppSettings, { key }))?.value;
  const job = async (enabled = true) =>
    new SynologyCaptureRepairJob(backfill, registrar(enabled), await createTestAppSettingsRepo(db), trekPhotos);

  beforeEach(() => {
    resetTestDb(db);
    reconfirm.mockReset();
    vi.mocked(trekPhotos.listByProviderAfter).mockClear();
  });

  it('SYNOREPAIR-001: asks again for every Synology photo, page by page, through its owner, then never again', async () => {
    reconfirm.mockResolvedValue('changed');
    const repair = await job();

    await repair.runOnce();

    expect(reconfirm.mock.calls).toEqual([
      [1, 10],
      [2, 10],
      [3, 11],
    ]);
    expect(vi.mocked(trekPhotos.listByProviderAfter).mock.calls.map((c) => c[0])).toEqual([
      'synologyphotos',
      'synologyphotos',
      'synologyphotos',
    ]);
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_DONE_KEY)).toBeTruthy();

    reconfirm.mockClear();
    await repair.runOnce();
    expect(reconfirm).not.toHaveBeenCalled();
  });

  it('SYNOREPAIR-002: tries again on the next start while a library could not confirm, at most three starts', async () => {
    reconfirm.mockImplementation(async (id: number) => (id === 3 ? 'failed' : 'same'));
    const repair = await job();

    await repair.runOnce();
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_DONE_KEY)).toBeUndefined();
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY)).toBe('1');

    await repair.runOnce();
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY)).toBe('2');

    await repair.runOnce();
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_DONE_KEY)).toBeTruthy();
    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_TRIES_KEY)).toBeUndefined();
  });

  it('SYNOREPAIR-003: an error stops the pass without marking it done, so the next start runs it', async () => {
    reconfirm.mockRejectedValue(new Error('boom'));
    const repair = await job();

    await repair.runOnce();

    expect(await setting(SYNOLOGY_CAPTURE_REPAIR_DONE_KEY)).toBeUndefined();
  });

  it('SYNOREPAIR-004: starts from the boot hook, but not where the scheduler is off', async () => {
    const off = await job(false);
    const on = await job(true);
    const offRun = vi.spyOn(off, 'runOnce').mockResolvedValue();
    const onRun = vi.spyOn(on, 'runOnce').mockResolvedValue();

    off.onApplicationBootstrap();
    on.onApplicationBootstrap();

    expect(offRun).not.toHaveBeenCalled();
    expect(onRun).toHaveBeenCalledTimes(1);
  });
});
