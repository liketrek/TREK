import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request } from 'express';
import type { StorageUsage } from '@trek/shared';
import type { User } from '../../../../src/types';
import { StorageAdminController } from '../../../../src/nest/storage/storage-admin.controller';
import type { StorageAdminService } from '../../../../src/nest/storage/storage-admin.service';
import type { AuditService } from '../../../../src/nest/audit/audit.service';
import type { StorageConfigDto, StorageTestRequestDto } from '../../../../src/nest/storage/storage-admin.dto';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import { StorageBackendError, StorageConflictError } from '../../../../src/nest/storage/storage.types';
import {
  BackfillBusyError,
  BackfillTargetError,
  MigrationRequestError,
  MigrationTargetError,
} from '../../../../src/nest/storage/storage-jobs.service';
import { StatsBusyError } from '../../../../src/nest/storage/storage-stats.service';
import { expectRegisteredController } from '../../../helpers/module-providers';

const user = { id: 1 } as User;
const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;
const FRESH_STATE = {
  backends: [],
  categories: {},
  health: { replicaFailures: [] },
  seedFilePresent: false,
  migrations: [],
};

function makeController(over: Partial<Record<keyof StorageAdminService, unknown>> = {}) {
  const writeAudit = vi.fn();
  const service = {
    state: vi.fn(() => FRESH_STATE),
    applyConfig: vi.fn(),
    ...over,
  } as unknown as StorageAdminService;
  const controller = new StorageAdminController(service, { writeAudit } as unknown as AuditService);
  return { controller, service, writeAudit };
}

const CONFIG = {
  backends: [
    {
      name: 'off-box',
      type: 's3' as const,
      options: {
        endpoint: 'http://127.0.0.1:9000',
        bucket: 'trek',
        accessKeyId: 'ak',
        secretAccessKey: 'sk-plain',
        region: 'us-east-1',
        keyPrefix: '',
        retries: 1,
        timeoutMs: 30000,
      },
    },
  ],
  categories: { backups: 'off-box' },
  version: 0,
} as StorageConfigDto;

describe('StorageAdminController', () => {
  it('STORCTL-001 GET returns the service state untouched', () => {
    const { controller, service } = makeController();
    expect(controller.get()).toBe(FRESH_STATE);
    expect(service.state).toHaveBeenCalledTimes(1);
  });

  it('STORCTL-002 PUT applies, audits with secrets redacted, and answers the fresh state', () => {
    const { controller, service, writeAudit } = makeController();
    const result = controller.update(user, CONFIG, req);
    expect(service.applyConfig).toHaveBeenCalledWith(CONFIG);
    expect(result).toBe(FRESH_STATE); // never echoes the request
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.storage_update' }),
    );
    const details = (writeAudit.mock.calls[0]![0] as { details: { backends: Array<{ options: Record<string, unknown> }> } }).details;
    expect(details.backends[0]!.options.secretAccessKey).toBe('***');
    expect(details.backends[0]!.options.accessKeyId).toBe('ak'); // names/shape survive redaction
  });

  it('STORCTL-003 PUT maps pipeline refusals to a 400 with the message verbatim, no audit', () => {
    const { controller, writeAudit } = makeController({
      applyConfig: vi.fn(() => {
        throw new StorageBackendError("category 'backups' maps to unknown backend 'nope'");
      }),
    });
    try {
      controller.update(user, CONFIG, req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(400);
      expect((err as HttpException).getResponse()).toEqual({
        error: "category 'backups' maps to unknown backend 'nope'",
      });
    }
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-023 PUT maps StorageConflictError to a 409, ahead of the blanket 400, no audit', () => {
    const { controller, writeAudit } = makeController({
      applyConfig: vi.fn(() => {
        // StorageConflictError IS an Error — this pins that the instanceof
        // branch is checked BEFORE the generic catch-all 400 (audit #7).
        throw new StorageConflictError(3, 1);
      }),
    });
    try {
      controller.update(user, CONFIG, req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(409);
      expect((err as HttpException).getResponse()).toEqual({
        error: "storage settings changed since this form was loaded (current version 3, submitted 1) — reload and reapply your edits",
      });
    }
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-004 the controller is registered in StorageModule', () => {
    expectRegisteredController(StorageModule, StorageAdminController);
  });

  it('STORCTL-005 POST /test probes, audits names only, answers 200-shaped result', async () => {
    const testResult = { ok: true, targets: [{ name: 'cand', ok: true }] };
    const { controller, writeAudit } = makeController({ testBackend: vi.fn(async () => testResult) });
    const result = await controller.test(user, { backend: CONFIG.backends[0]! } as StorageTestRequestDto, req);
    expect(result).toBe(testResult);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.storage_test',
        details: { backend: 'off-box', type: 's3', ok: true, targets: [{ name: 'cand', ok: true }] },
      }),
    );
  });

  it('STORCTL-006 POST /test maps thrown refusals to 400 verbatim', async () => {
    const { controller } = makeController({
      testBackend: vi.fn(async () => {
        throw new StorageBackendError("mirror 'm' references unknown backend 'nope'");
      }),
    });
    await expect(
      controller.test(user, { backend: CONFIG.backends[0]! } as StorageTestRequestDto, req),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('STORCTL-007 POST backfill starts the sync, audits the backend name, and answers { started: true }', () => {
    const { controller, service, writeAudit } = makeController({ startBackfill: vi.fn() });
    const result = controller.backfillStart(user, 'm', req);
    expect(service.startBackfill).toHaveBeenCalledWith('m');
    expect(result).toEqual({ started: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.storage_backfill', details: { backend: 'm' } }),
    );
  });

  it('STORCTL-008 POST backfill maps BackfillTargetError to 404, no audit', () => {
    const { controller, writeAudit } = makeController({
      startBackfill: vi.fn(() => {
        throw new BackfillTargetError("'ghost' is not a mirror routed by any category");
      }),
    });
    try {
      controller.backfillStart(user, 'ghost', req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(404);
      expect((err as HttpException).getResponse()).toEqual({ error: "'ghost' is not a mirror routed by any category" });
    }
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-009 POST backfill maps BackfillBusyError to 409, no audit', () => {
    const { controller, writeAudit } = makeController({
      startBackfill: vi.fn(() => {
        throw new BackfillBusyError('a sync is already running — one backfill at a time');
      }),
    });
    try {
      controller.backfillStart(user, 'm', req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(409);
    }
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-010 POST backfill rethrows an unrecognized error untouched', () => {
    const boom = new Error('unexpected registry failure');
    const { controller, writeAudit } = makeController({
      startBackfill: vi.fn(() => {
        throw boom;
      }),
    });
    expect(() => controller.backfillStart(user, 'm', req)).toThrow(boom);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-011 DELETE backfill cancels, audits, and answers { cancelled: true } when a sync is active', () => {
    const { controller, service, writeAudit } = makeController({ cancelBackfill: vi.fn(() => true) });
    const result = controller.backfillCancel(user, 'm', req);
    expect(service.cancelBackfill).toHaveBeenCalledWith('m');
    expect(result).toEqual({ cancelled: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.storage_backfill_cancel', details: { backend: 'm' } }),
    );
  });

  it('STORCTL-012 DELETE backfill answers 404 with no audit when there is no active sync', () => {
    const { controller, writeAudit } = makeController({ cancelBackfill: vi.fn(() => false) });
    try {
      controller.backfillCancel(user, 'ghost', req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(404);
      expect((err as HttpException).getResponse()).toEqual({ error: "no active sync for 'ghost'" });
    }
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-013 POST stats/refresh runs the scan, audits (no details payload), and answers the usage', async () => {
    const usage = { computedAt: 1, categories: {}, legacyPhotos: { objects: 0, bytes: 0 } } as unknown as StorageUsage;
    const { controller, service, writeAudit } = makeController({ refreshStats: vi.fn(async () => usage) });
    const result = await controller.statsRefresh(user, req);
    expect(service.refreshStats).toHaveBeenCalledTimes(1);
    expect(result).toBe(usage);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.storage_stats_refresh' }),
    );
  });

  it('STORCTL-014 POST stats/refresh maps StatsBusyError to 409, no audit', async () => {
    const { controller, writeAudit } = makeController({
      refreshStats: vi.fn(async () => {
        throw new StatsBusyError('a usage scan is already running');
      }),
    });
    await expect(controller.statsRefresh(user, req)).rejects.toMatchObject({ status: 409 });
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-015 POST stats/refresh rethrows an unrecognized error untouched', async () => {
    const boom = new Error('disk full');
    const { controller, writeAudit } = makeController({
      refreshStats: vi.fn(async () => {
        throw boom;
      }),
    });
    await expect(controller.statsRefresh(user, req)).rejects.toBe(boom);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-020 POST migrations starts and audits', () => {
    const { controller, service, writeAudit } = makeController({ startMigration: vi.fn() });
    const result = controller.migrationStart(user, { category: 'files', to: 'dest' }, req);
    expect(service.startMigration).toHaveBeenCalledWith('files', 'dest');
    expect(result).toEqual({ started: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        action: 'admin.storage_migration',
        details: { category: 'files', to: 'dest' },
      }),
    );
  });

  it('STORCTL-021 POST maps MigrationRequestError→400, MigrationTargetError→404, BackfillBusyError→409, others rethrow', () => {
    const { controller: reqController, writeAudit: reqAudit } = makeController({
      startMigration: vi.fn(() => {
        throw new MigrationRequestError("'files' is already on 'dest'");
      }),
    });
    try {
      reqController.migrationStart(user, { category: 'files', to: 'dest' }, req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(400);
      expect((err as HttpException).getResponse()).toEqual({ error: "'files' is already on 'dest'" });
    }
    expect(reqAudit).not.toHaveBeenCalled();

    const { controller: targetController, writeAudit: targetAudit } = makeController({
      startMigration: vi.fn(() => {
        throw new MigrationTargetError("no backend named 'ghost'");
      }),
    });
    try {
      targetController.migrationStart(user, { category: 'files', to: 'ghost' }, req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(404);
      expect((err as HttpException).getResponse()).toEqual({ error: "no backend named 'ghost'" });
    }
    expect(targetAudit).not.toHaveBeenCalled();

    const { controller: busyController, writeAudit: busyAudit } = makeController({
      startMigration: vi.fn(() => {
        throw new BackfillBusyError('a sync is already running — one storage job at a time');
      }),
    });
    try {
      busyController.migrationStart(user, { category: 'files', to: 'dest' }, req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(409);
    }
    expect(busyAudit).not.toHaveBeenCalled();

    const boom = new Error('unexpected registry failure');
    const { controller: boomController, writeAudit: boomAudit } = makeController({
      startMigration: vi.fn(() => {
        throw boom;
      }),
    });
    expect(() => boomController.migrationStart(user, { category: 'files', to: 'dest' }, req)).toThrow(boom);
    expect(boomAudit).not.toHaveBeenCalled();
  });

  it('STORCTL-022 DELETE migrations/:category cancels + audits; 404 when none running', () => {
    const { controller, service, writeAudit } = makeController({ cancelMigration: vi.fn(() => true) });
    const result = controller.migrationCancel(user, 'files', req);
    expect(service.cancelMigration).toHaveBeenCalledWith('files');
    expect(result).toEqual({ cancelled: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, action: 'admin.storage_migration_cancel', details: { category: 'files' } }),
    );

    const { controller: noneController, writeAudit: noneAudit } = makeController({
      cancelMigration: vi.fn(() => false),
    });
    try {
      noneController.migrationCancel(user, 'ghost', req);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpException);
      expect((err as HttpException).getStatus()).toBe(404);
      expect((err as HttpException).getResponse()).toEqual({ error: "no running migration for 'ghost'" });
    }
    expect(noneAudit).not.toHaveBeenCalled();
  });
});
