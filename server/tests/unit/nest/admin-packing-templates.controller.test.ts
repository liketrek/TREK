/**
 * The admin packing-template CRUD, after it moved off AdminController into the packing
 * domain that owns the three template tables. Same paths, same {error,status}
 * envelope, same create-201 split, same audit actions — these cases came over from
 * admin.controller.test.ts with the routes.
 */
import { DomainError } from '../../../src/nest/common/domain-error';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { AdminPackingTemplatesController } from '../../../src/nest/packing/admin-packing-templates.controller';
import { PackingModule } from '../../../src/nest/packing/packing.module';
import type { PackingService } from '../../../src/nest/packing/packing.service';
import type { AuditService } from '../../../src/nest/audit/audit.service';
import type { User } from '../../../src/types';
import { expectRegisteredController } from '../../helpers/module-providers';

const user = { id: 1, role: 'admin' } as User;
const req = { headers: {}, socket: {} } as never;
const writeAudit = vi.fn();

function controller(over: Partial<PackingService> = {}) {
  const packing = {
    listPackingTemplates: vi.fn(async () => [{ id: 1 }]),
    getPackingTemplate: vi.fn(async () => ({ template: { id: 1 } })),
    createPackingTemplate: vi.fn(async () => ({ template: { id: 9 } })),
    updatePackingTemplate: vi.fn(async () => ({ template: { id: 1 } })),
    deletePackingTemplate: vi.fn(async () => ({ name: 'Beach' })),
    createTemplateCategory: vi.fn(async () => ({ category: { id: 2 } })),
    updateTemplateCategory: vi.fn(async () => ({ category: { id: 2 } })),
    deleteTemplateCategory: vi.fn(async () => ({ ok: true })),
    createTemplateItem: vi.fn(async () => ({ item: { id: 3 } })),
    updateTemplateItem: vi.fn(async () => ({ item: { id: 3 } })),
    deleteTemplateItem: vi.fn(async () => ({ ok: true })),
    ...over,
  } as unknown as PackingService;
  return { c: new AdminPackingTemplatesController(packing, { writeAudit } as unknown as AuditService), packing };
}

const thrown = async (run: () => unknown) => {
  try {
    await run();
    return null;
  } catch (e) {
    return e instanceof HttpException ? { status: e.getStatus(), body: e.getResponse() } : e;
  }
};

describe('AdminPackingTemplatesController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PACKTPL-001 list wraps the service result in the { templates } envelope', async () => {
    expect(await controller().c.list()).toEqual({ templates: [{ id: 1 }] });
  });

  it('PACKTPL-002 a service refusal becomes that HTTP status, not a 200 body', async () => {
    const { c } = controller({ getPackingTemplate: vi.fn(async () => { throw new DomainError(404, 'not found'); }) });
    expect(await thrown(() => c.get('9'))).toEqual({ status: 404, body: { error: 'not found' } });
  });

  it('PACKTPL-003 a 400 refusal keeps its status and text', async () => {
    const { c } = controller({ createTemplateCategory: vi.fn(async () => { throw new DomainError(400, 'Category name is required'); }) });
    expect(await thrown(() => c.createCategory('1', { name: '' }))).toEqual({ status: 400, body: { error: 'Category name is required' } });
  });

  it('PACKTPL-004 create audits with the new template id', async () => {
    const { c, packing } = controller();
    expect(await c.create(user, { name: 'Beach' }, req)).toEqual({ template: { id: 9 } });
    expect(packing.createPackingTemplate).toHaveBeenCalledWith('Beach', 1);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.packing_template_create', resource: '9', details: { name: 'Beach' } }),
    );
  });

  it('PACKTPL-005 delete audits the removed name and answers { success: true }', async () => {
    const { c } = controller();
    expect(await c.remove(user, '1', req)).toEqual({ success: true });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.packing_template_delete', resource: '1', details: { name: 'Beach' } }),
    );
  });

  it('PACKTPL-006 the nested category and item routes forward their ids in order', async () => {
    const { c, packing } = controller();
    await c.createCategory('1', { name: 'Clothes' });
    expect(packing.createTemplateCategory).toHaveBeenCalledWith('1', 'Clothes');
    await c.updateCategory('1', '2', { name: 'Warm' });
    expect(packing.updateTemplateCategory).toHaveBeenCalledWith('1', '2', { name: 'Warm' });
    expect(await c.deleteCategory('1', '2')).toEqual({ success: true });
    await c.createItem('1', '2', { name: 'Socks' });
    expect(packing.createTemplateItem).toHaveBeenCalledWith('1', '2', 'Socks');
    await c.updateItem('1', '3', { name: 'Wool socks' });
    expect(packing.updateTemplateItem).toHaveBeenCalledWith('1', '3', { name: 'Wool socks' });
    expect(await c.deleteItem('1', '3')).toEqual({ success: true });
  });

  it('PACKTPL-007 the delete routes answer { success: true } rather than the service payload', async () => {
    // The client branches on `success`; leaking the raw service result here would be a
    // silent shape change for every caller.
    const { c } = controller();
    expect(await c.deleteCategory('1', '2')).toEqual({ success: true });
    expect(await c.deleteItem('1', '3')).toEqual({ success: true });
  });

  it('PACKTPL-008 the class is listed in its module controllers', () => {
    expectRegisteredController(PackingModule, AdminPackingTemplatesController);
  });
});
