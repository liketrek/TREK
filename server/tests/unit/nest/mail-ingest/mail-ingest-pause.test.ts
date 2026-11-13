/**
 * The pause notice over stubs: when the import stops, every holder of a live
 * address with their own import on hears it once; the pause is noted before
 * anyone is told, a second run stays quiet, another process holding the
 * notice is left alone, and the import coming back forgets the pause so the
 * next one is announced again.
 */
import { MailIngestAddresses } from '../../../../src/db/entities/MailIngestAddresses.entity';
import { MailIngestCursor } from '../../../../src/db/entities/MailIngestCursor.entity';
import { MailIngestNotifyService } from '../../../../src/nest/mail-ingest/mail-ingest-notify.service';
import { MailIngestPauseJob } from '../../../../src/nest/mail-ingest/mail-ingest-pause.job';
import { MailIngestSettingsService } from '../../../../src/nest/mail-ingest/mail-ingest-settings.service';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const NOW = new Date('2030-01-15T10:00:00Z');
const settings = {
  isAvailable: vi.fn(async () => false),
  prefsOf: vi.fn(async (userId: number) => ({ enabled: userId !== 3, ai_enabled: true, auto_add: true })),
};
const cursor = {
  find: vi.fn(),
  acquireLease: vi.fn(async () => true),
  releaseLease: vi.fn(async () => undefined),
  recordOk: vi.fn(async () => undefined),
  forgetOk: vi.fn(async () => undefined),
};
const addresses = { listHolders: vi.fn(async () => [1, 2, 3]) };
const notify = { importPaused: vi.fn(async () => undefined) };
const registrar = { isEnabled: () => false, register: vi.fn() };

let job: MailIngestPauseJob;
beforeEach(async () => {
  vi.clearAllMocks();
  settings.isAvailable.mockResolvedValue(false);
  cursor.find.mockResolvedValue(null);
  cursor.acquireLease.mockResolvedValue(true);
  const moduleRef = await Test.createTestingModule({
    providers: [
      MailIngestPauseJob,
      { provide: MailIngestSettingsService, useValue: settings },
      { provide: MailIngestNotifyService, useValue: notify },
      { provide: CronRegistrarService, useValue: registrar },
      { provide: getRepositoryToken(MailIngestCursor), useValue: cursor },
      { provide: getRepositoryToken(MailIngestAddresses), useValue: addresses },
    ],
  }).compile();
  job = moduleRef.get(MailIngestPauseJob);
});

describe('the pause notice', () => {
  it('tells each holder of a live address with their import on, once, after noting the pause', async () => {
    expect(await job.tick(NOW)).toBe(2);
    expect(notify.importPaused.mock.calls).toEqual([[1], [2]]);
    expect(cursor.recordOk).toHaveBeenCalledWith('notice', 'paused', '2030-01-15 10:00:00');
    expect(cursor.recordOk.mock.invocationCallOrder[0]).toBeLessThan(notify.importPaused.mock.invocationCallOrder[0]);
    expect(cursor.releaseLease).toHaveBeenCalled();

    cursor.find.mockResolvedValue({ last_ok_at: '2030-01-15 10:00:00' });
    expect(await job.tick(NOW)).toBe(0);
    expect(notify.importPaused).toHaveBeenCalledTimes(2);
  });

  it('leaves the notice to the process that holds it', async () => {
    cursor.acquireLease.mockResolvedValue(false);
    expect(await job.tick(NOW)).toBe(0);
    expect(addresses.listHolders).not.toHaveBeenCalled();
  });

  it('forgets the pause once the import is back, and tells nobody while it runs', async () => {
    settings.isAvailable.mockResolvedValue(true);
    expect(await job.tick(NOW)).toBe(0);
    expect(cursor.forgetOk).not.toHaveBeenCalled();
    cursor.find.mockResolvedValue({ last_ok_at: '2030-01-15 10:00:00' });
    expect(await job.tick(NOW)).toBe(0);
    expect(cursor.forgetOk).toHaveBeenCalledWith('notice', 'paused');
    expect(notify.importPaused).not.toHaveBeenCalled();
    expect(cursor.acquireLease).not.toHaveBeenCalled();
  });

  it('logs a failed run and gives the lease back', async () => {
    addresses.listHolders.mockRejectedValueOnce(new Error('db gone'));
    expect(await job.tick(NOW)).toBe(0);
    expect(cursor.recordOk).not.toHaveBeenCalled();
    expect(cursor.releaseLease).toHaveBeenCalledWith('notice', 'paused', expect.any(String));
  });
});
