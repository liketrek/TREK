/**
 * StorageReclaimController over a stub service: what it forwards, what it
 * audits, and that a refusal of the service reaches the client unchanged.
 * RCLC-001 to RCLC-004.
 */
import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type { StorageReclaimRunDto, StorageReclaimSettingsDto } from '../../../../src/nest/storage/storage-admin.dto';
import { StorageReclaimController } from '../../../../src/nest/storage/storage-reclaim.controller';
import type { StorageReclaimService } from '../../../../src/nest/storage/storage-reclaim.service';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import type { User } from '../../../../src/types';
import { expectRegisteredController } from '../../../helpers/module-providers';
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimReport } from '@trek/shared';

import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7 } as User;
const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;

function report(): StorageReclaimReport {
  const none = { objects: 0, bytes: 0 };
  const row = { objects: 0, unreferenced: none, eligible: none, deleted: none, skipped: null };
  return {
    startedAt: 1,
    finishedAt: 2,
    mode: 'delete',
    stopped: null,
    categories: {
      ...(Object.fromEntries(STORAGE_RECLAIM_CATEGORIES.map((c) => [c, row])) as StorageReclaimReport['categories']),
      covers: { ...row, objects: 9, deleted: { objects: 2, bytes: 40 } },
      places: { ...row, objects: 3, deleted: { objects: 1, bytes: 2 } },
    },
  };
}

function makeController(over: Partial<Record<keyof StorageReclaimService, unknown>> = {}) {
  const writeAudit = vi.fn();
  const service = {
    setDeleteEnabled: vi.fn(async (enabled: boolean) => ({ deleteEnabled: enabled, lastRun: null })),
    run: vi.fn(async () => report()),
    ...over,
  } as unknown as StorageReclaimService;
  const controller = new StorageReclaimController(service, { writeAudit } as unknown as AuditService);
  return { controller, service, writeAudit };
}

describe('StorageReclaimController', () => {
  it('RCLC-001: is registered in StorageModule', () => {
    expectRegisteredController(StorageModule, StorageReclaimController);
  });

  it('RCLC-002: PUT stores the switch, answers the fresh state and audits the value', async () => {
    const { controller, service, writeAudit } = makeController();
    const body = { deleteEnabled: true } as StorageReclaimSettingsDto;
    expect(await controller.update(user, body, req)).toEqual({ deleteEnabled: true, lastRun: null });
    expect(service.setDeleteEnabled).toHaveBeenCalledWith(true);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, action: 'admin.storage_reclaim_update', details: { deleteEnabled: true } }),
    );
  });

  it('RCLC-003: POST run forwards reportOnly, answers the report and audits the totals', async () => {
    const { controller, service, writeAudit } = makeController();
    const answer = await controller.run(user, { reportOnly: true } as StorageReclaimRunDto, req);
    expect(answer.categories.covers.deleted.objects).toBe(2);
    expect(service.run).toHaveBeenCalledWith({ reportOnly: true });
    await controller.run(user, {} as StorageReclaimRunDto, req);
    expect(service.run).toHaveBeenLastCalledWith({ reportOnly: false });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.storage_reclaim_run',
        details: { mode: 'delete', deleted: 3, bytes: 42 },
      }),
    );
  });

  it('RCLC-004: a refused pass propagates as the DomainError and writes no audit row', async () => {
    const refusal = new DomainError(409, 'another storage job is running, one storage job at a time');
    const { controller, writeAudit } = makeController({ run: vi.fn().mockRejectedValue(refusal) });
    await expect(controller.run(user, {} as StorageReclaimRunDto, req)).rejects.toBe(refusal);
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
