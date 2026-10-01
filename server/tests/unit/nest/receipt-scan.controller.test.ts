import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ReceiptScanController } from '../../../src/nest/receipt-scan/receipt-scan.controller';
import type { ImportJobsService } from '../../../src/nest/booking-import/import-jobs.service';
import type { LlmParseService } from '../../../src/nest/llm-parse/llm-parse.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { User } from '../../../src/types';

const user = { id: 3, role: 'user' } as User;
const photo = (name = 'r.jpg') => ({ originalname: name, buffer: Buffer.from('x') } as Express.Multer.File);

function make(over: { readsImages?: boolean; trip?: unknown; addon?: boolean; allowed?: boolean } = {}) {
  const startReceipt = vi.fn(() => 'job-1');
  const checkPermission = vi.fn(() => over.allowed ?? true);
  const c = new ReceiptScanController(
    { startReceipt } as unknown as ImportJobsService,
    { readsImages: vi.fn(async () => over.readsImages ?? true) } as unknown as LlmParseService,
    { canAccessTrip: vi.fn(() => ('trip' in over ? over.trip : { user_id: 5 })) } as unknown as DatabaseService,
    { checkPermission } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => over.addon ?? true) } as unknown as AddonsService,
  );
  return { c, startReceipt, checkPermission };
}

async function failure(fn: () => Promise<unknown>): Promise<[number, unknown]> {
  try { await fn(); } catch (e) { expect(e).toBeInstanceOf(HttpException); return [(e as HttpException).getStatus(), (e as HttpException).getResponse()]; }
  throw new Error('expected throw');
}

describe('ReceiptScanController', () => {
  it('queues a photo and answers the job id', async () => {
    const { c, startReceipt, checkPermission } = make();
    await expect(c.scan(user, '9', photo())).resolves.toEqual({ jobId: 'job-1' });
    expect(startReceipt).toHaveBeenCalledWith('9', expect.objectContaining({ originalname: 'r.jpg' }), 3);
    expect(checkPermission).toHaveBeenCalledWith('budget_edit', 'user', 5, 3, true);
  });

  it('answers what the guards would: 404 for a trip out of reach or Costs off, 403 without budget_edit', async () => {
    expect(await failure(() => make({ trip: undefined }).c.scan(user, '9', photo()))).toEqual([404, { error: 'Trip not found' }]);
    expect(await failure(() => make({ addon: false }).c.scan(user, '9', photo()))).toEqual([404, { error: 'Costs addon is not enabled' }]);
    const { c, startReceipt } = make({ allowed: false });
    expect(await failure(() => c.scan(user, '9', photo()))).toEqual([403, { error: 'No permission' }]);
    expect(startReceipt).not.toHaveBeenCalled();
  });

  it('refuses with 400 a missing file, a file that is not a photo, or a model that reads no images', async () => {
    expect((await failure(() => make().c.scan(user, '9', undefined)))[0]).toBe(400);
    expect((await failure(() => make().c.scan(user, '9', photo('r.pdf'))))[0]).toBe(400);
    const { c, startReceipt } = make({ readsImages: false });
    expect(await failure(() => c.scan(user, '9', photo()))).toEqual([400, { error: 'The configured AI model does not read photos' }]);
    expect(startReceipt).not.toHaveBeenCalled();
  });
});
