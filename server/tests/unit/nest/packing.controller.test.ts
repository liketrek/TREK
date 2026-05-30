import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { PackingController } from '../../../src/nest/packing/packing.controller';
import type { PackingService } from '../../../src/nest/packing/packing.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { id: 5, user_id: 1 };

/** Service mock with trip access granted + edit allowed by default. */
function makeService(overrides: Partial<PackingService> = {}): PackingService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    notifyTagged: vi.fn(),
    ...overrides,
  } as unknown as PackingService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('PackingController (parity with the legacy /api/trips/:tripId/packing route)', () => {
  it('404 when the trip is not accessible', () => {
    const svc = makeService({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => new PackingController(svc).list(user, '5'))).toEqual({
      status: 404, body: { error: 'Trip not found' },
    });
  });

  it('GET / returns items for an accessible trip', () => {
    const svc = makeService({ listItems: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<PackingService>);
    expect(new PackingController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }] });
  });

  describe('POST / (create)', () => {
    it('403 without packing_edit permission', () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new PackingController(svc).create(user, '5', { name: 'Socks' }))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('400 when name missing', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).create(user, '5', {}))).toEqual({
        status: 400, body: { error: 'Item name is required' },
      });
    });

    it('creates an item and broadcasts', () => {
      const createItem = vi.fn().mockReturnValue({ id: 9, name: 'Socks' });
      const broadcast = vi.fn();
      const svc = makeService({ createItem, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).create(user, '5', { name: 'Socks' }, 'sock')).toEqual({ item: { id: 9, name: 'Socks' } });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:created', { item: { id: 9, name: 'Socks' } }, 'sock');
    });
  });

  describe('POST /import', () => {
    it('400 when items is not a non-empty array', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).importItems(user, '5', []))).toEqual({
        status: 400, body: { error: 'items must be a non-empty array' },
      });
    });

    it('imports and broadcasts per item', () => {
      const bulkImport = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
      const broadcast = vi.fn();
      const svc = makeService({ bulkImport, broadcast } as Partial<PackingService>);
      const res = new PackingController(svc).importItems(user, '5', [{ name: 'a' }, { name: 'b' }], 'sock');
      expect(res).toEqual({ items: [{ id: 1 }, { id: 2 }], count: 2 });
      expect(broadcast).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /:id (update)', () => {
    it('404 when the item is missing', () => {
      const svc = makeService({ updateItem: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).update(user, '5', '9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Item not found' },
      });
    });

    it('updates, forwards changed keys, and broadcasts', () => {
      const updateItem = vi.fn().mockReturnValue({ id: 9, name: 'X' });
      const broadcast = vi.fn();
      const svc = makeService({ updateItem, broadcast } as Partial<PackingService>);
      new PackingController(svc).update(user, '5', '9', { name: 'X', checked: true }, 'sock');
      expect(updateItem).toHaveBeenCalledWith('5', '9', expect.objectContaining({ name: 'X', checked: true }), ['name', 'checked']);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:updated', { item: { id: 9, name: 'X' } }, 'sock');
    });
  });

  describe('bags', () => {
    it('400 on bag create with blank name', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).createBag(user, '5', { name: '  ' }))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    it('404 on bag update when missing', () => {
      const svc = makeService({ updateBag: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).updateBag(user, '5', '3', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Bag not found' },
      });
    });
  });

  describe('templates', () => {
    it('404 when applying a missing/empty template (POST stays 200 otherwise)', () => {
      const svc = makeService({ applyTemplate: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).applyTemplate(user, '5', 't1'))).toEqual({
        status: 404, body: { error: 'Template not found or empty' },
      });
    });

    it('400 saving a template with no items', () => {
      const svc = makeService({ saveAsTemplate: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(user, '5', 'My template'))).toEqual({
        status: 400, body: { error: 'No items to save' },
      });
    });
  });

  describe('category assignees', () => {
    it('updates assignees, broadcasts and fires the tag notification', () => {
      const updateCategoryAssignees = vi.fn().mockReturnValue([{ user_id: 2 }]);
      const broadcast = vi.fn();
      const notifyTagged = vi.fn();
      const svc = makeService({ updateCategoryAssignees, broadcast, notifyTagged } as Partial<PackingService>);
      const res = new PackingController(svc).updateCategoryAssignees(user, '5', 'Clothes', [2], 'sock');
      expect(res).toEqual({ assignees: [{ user_id: 2 }] });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:assignees', { category: 'Clothes', assignees: [{ user_id: 2 }] }, 'sock');
      expect(notifyTagged).toHaveBeenCalledWith('5', user, 'Clothes', [2]);
    });
  });
});
