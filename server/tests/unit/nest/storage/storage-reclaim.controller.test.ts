/**
 * StorageReclaimController over a stub service: what it forwards, what it
 * audits, and that a refusal of the service reaches the client unchanged.
 * RCLC-001 to RCLC-007.
 */
import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import type {
  StorageReclaimConfirmDto,
  StorageReclaimSettingsDto,
} from '../../../../src/nest/storage/storage-admin.dto';
import { StorageReclaimController } from '../../../../src/nest/storage/storage-reclaim.controller';
import type { StorageReclaimService } from '../../../../src/nest/storage/storage-reclaim.service';
import { StorageModule } from '../../../../src/nest/storage/storage.module';
import type { User } from '../../../../src/types';
import { expectRegisteredController } from '../../../helpers/module-providers';
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimReport, type StorageReclaimState } from '@trek/shared';

import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

const user = { id: 7 } as User;
const req = { headers: {}, socket: { remoteAddress: '127.0.0.1' } } as unknown as Request;

function report(): StorageReclaimReport {
  const none = { objects: 0, bytes: 0 };
  const row = {
    objects: 0,
    unreferenced: none,
    eligible: none,
    deleted: none,
    confirmationRequired: false,
    skipped: null,
  };
  return {
    startedAt: 1,
    finishedAt: 2,
    mode: 'report',
    stopped: null,
    categories: {
      ...(Object.fromEntries(STORAGE_RECLAIM_CATEGORIES.map((c) => [c, row])) as StorageReclaimReport['categories']),
      covers: { ...row, objects: 9, unreferenced: { objects: 4, bytes: 40 }, confirmationRequired: true },
    },
  };
}

function state(over: Partial<StorageReclaimState> = {}): StorageReclaimState {
  return { deleteEnabled: false, running: false, lastRun: null, lastDeleteRun: null, ...over };
}

function makeController(over: Partial<Record<keyof StorageReclaimService, unknown>> = {}) {
  const writeAudit = vi.fn();
  const service = {
    setDeleteEnabled: vi.fn(async (enabled: boolean) => state({ deleteEnabled: enabled })),
    start: vi.fn(async () => undefined),
    confirm: vi.fn(async () => state({ lastRun: report() })),
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
    expect(await controller.update(user, body, req)).toEqual(state({ deleteEnabled: true }));
    expect(service.setDeleteEnabled).toHaveBeenCalledWith(true);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, action: 'admin.storage_reclaim_update', details: { deleteEnabled: true } }),
    );
  });

  it('RCLC-003: POST run starts the check in the background, answers at once and audits the start', async () => {
    const { controller, service, writeAudit } = makeController();
    expect(await controller.run(user, req)).toEqual({ started: true });
    expect(service.start).toHaveBeenCalledTimes(1);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, action: 'admin.storage_reclaim_run', details: { mode: 'report' } }),
    );
  });

  it('RCLC-004: a refused start propagates as the DomainError and writes no audit row', async () => {
    const refusal = new DomainError(409, 'another storage job is running, one storage job at a time', {
      code: 'reclaim_busy',
    });
    const { controller, writeAudit } = makeController({
      start: vi.fn().mockRejectedValue(refusal),
    });
    await expect(controller.run(user, req)).rejects.toBe(refusal);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('RCLC-005: POST confirm forwards the category and the count shown, answers the state and audits that count', async () => {
    const { controller, service, writeAudit } = makeController();
    const body = { category: 'covers', unreferenced: 4 } as StorageReclaimConfirmDto;
    const answer = await controller.confirm(user, body, req);
    expect(answer.lastRun?.categories.covers.confirmationRequired).toBe(true);
    expect(service.confirm).toHaveBeenCalledWith('covers', 4);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.storage_reclaim_confirm',
        details: { category: 'covers', unreferenced: 4 },
      }),
    );
  });

  it('RCLC-006: a confirmation with nothing waiting propagates its 409 and writes no audit row', async () => {
    const refusal = new DomainError(409, 'nothing in this category waits for a confirmation', {
      code: 'reclaim_nothing_to_confirm',
    });
    const { controller, writeAudit } = makeController({ confirm: vi.fn().mockRejectedValue(refusal) });
    const body = { category: 'files', unreferenced: 3 } as StorageReclaimConfirmDto;
    await expect(controller.confirm(user, body, req)).rejects.toBe(refusal);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('RCLC-007: a count the last report no longer holds propagates its stale 409 and writes no audit row', async () => {
    const refusal = new DomainError(409, 'the last check found another count since, reload and confirm again', {
      code: 'reclaim_confirm_stale',
    });
    const { controller, writeAudit } = makeController({ confirm: vi.fn().mockRejectedValue(refusal) });
    const body = { category: 'covers', unreferenced: 400 } as StorageReclaimConfirmDto;
    await expect(controller.confirm(user, body, req)).rejects.toBe(refusal);
    expect(writeAudit).not.toHaveBeenCalled();
  });
});
