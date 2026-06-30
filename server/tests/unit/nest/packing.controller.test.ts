import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { PackingController } from '../../../src/nest/packing/packing.controller';
import type { PackingService } from '../../../src/nest/packing/packing.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const admin = { id: 1, role: 'admin', email: 'a@example.test' } as User;
const trip = { id: 5, user_id: 1 };

/** Service mock with trip access granted + edit allowed by default. */
function makeService(overrides: Partial<PackingService> = {}): PackingService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    broadcastItem: vi.fn(),
    broadcastToViewers: vi.fn(),
    // Real viewer logic so the emit-to-viewers routing is exercised faithfully.
    viewersOf: (item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] } | null | undefined) =>
      !item || !item.is_private ? null : [item.owner_id, ...(item.recipients || []).map(r => r.user_id)].filter((x): x is number => x != null),
    getItemPrivacy: vi.fn().mockReturnValue(undefined),
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

    it('creates an item (owned by the creator) and broadcasts a Common item to the room', () => {
      // Common item (is_private falsy) → viewersOf null → whole-room broadcast.
      const createItem = vi.fn().mockReturnValue({ id: 9, name: 'Socks', is_private: 0 });
      const broadcast = vi.fn();
      const svc = makeService({ createItem, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).create(user, '5', { name: 'Socks' }, 'sock')).toEqual({ item: { id: 9, name: 'Socks', is_private: 0 } });
      // Stamps the creator as owner (#858) and routes the broadcast to viewers.
      expect(createItem).toHaveBeenCalledWith('5', expect.objectContaining({ name: 'Socks' }), user.id);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:created', { item: { id: 9, name: 'Socks', is_private: 0 } }, 'sock');
    });

    it('routes a Shared item create only to the owner + recipients (#858)', () => {
      const item = { id: 9, name: 'Power bank', is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };
      const createItem = vi.fn().mockReturnValue(item);
      const broadcastToViewers = vi.fn();
      const svc = makeService({ createItem, broadcastToViewers } as Partial<PackingService>);
      new PackingController(svc).create(user, '5', { name: 'Power bank', visibility: 'shared', recipient_ids: [2] }, 'sock');
      expect(broadcastToViewers).toHaveBeenCalledWith('5', 'packing:created', { item }, [1, 2], 'sock');
    });
  });

  it('GET / lists items for the trip, scoped to the viewer (#858)', () => {
    const listItems = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
    const svc = makeService({ listItems } as Partial<PackingService>);
    expect(new PackingController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }, { id: 2 }] });
    expect(listItems).toHaveBeenCalledWith('5', user.id);
  });

  describe('POST /import', () => {
    it('400 when items is not a non-empty array (empty array)', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).importItems(user, '5', []))).toEqual({
        status: 400, body: { error: 'items must be a non-empty array' },
      });
    });

    it('400 when items is not an array at all (non-array branch)', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).importItems(user, '5', 'nope'))).toEqual({
        status: 400, body: { error: 'items must be a non-empty array' },
      });
    });

    it('403 without packing_edit permission', () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new PackingController(svc).importItems(user, '5', [{ name: 'a' }]))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('imports (owned by the importer) and broadcasts per item', () => {
      const bulkImport = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
      const broadcastItem = vi.fn();
      const svc = makeService({ bulkImport, broadcastItem } as Partial<PackingService>);
      const res = new PackingController(svc).importItems(user, '5', [{ name: 'a' }, { name: 'b' }], 'sock');
      expect(res).toEqual({ items: [{ id: 1 }, { id: 2 }], count: 2 });
      expect(bulkImport).toHaveBeenCalledWith('5', [{ name: 'a' }, { name: 'b' }], user.id);
      expect(broadcastItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /:id (update)', () => {
    it('404 when the item is missing', () => {
      const svc = makeService({ updateItem: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).update(user, '5', '9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Item not found' },
      });
    });

    it('updates, forwards changed keys + acting user, and broadcasts (stays public)', () => {
      const updateItem = vi.fn().mockReturnValue({ id: 9, name: 'X' });
      const broadcast = vi.fn();
      const svc = makeService({ updateItem, broadcast } as Partial<PackingService>);
      new PackingController(svc).update(user, '5', '9', { name: 'X', checked: true }, 'sock');
      // acting user id is forwarded so privatizing an unowned item can stamp the owner (#858)
      expect(updateItem).toHaveBeenCalledWith('5', '9', expect.objectContaining({ name: 'X', checked: true }), ['name', 'checked'], undefined, user.id);
      // A public item (is_private undefined, was public) broadcasts to the whole room.
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:updated', { item: { id: 9, name: 'X' } }, 'sock');
    });

    it('keeps a private update scoped to the owner (#858)', () => {
      const updateItem = vi.fn().mockReturnValue({ id: 9, name: 'X', is_private: 1, owner_id: 1 });
      const broadcast = vi.fn();
      const broadcastItem = vi.fn();
      // Was already private before the change → owner-only update, no room broadcast.
      const getItemPrivacy = vi.fn().mockReturnValue({ is_private: 1, owner_id: 1 });
      const svc = makeService({ updateItem, broadcast, broadcastItem, getItemPrivacy } as Partial<PackingService>);
      new PackingController(svc).update(user, '5', '9', { name: 'X' }, 'sock');
      expect(broadcastItem).toHaveBeenCalledWith('5', 'packing:updated', { item: { id: 9, name: 'X', is_private: 1, owner_id: 1 } }, { id: 9, name: 'X', is_private: 1, owner_id: 1 }, 'sock');
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('drops a freshly-privatized item from the room and re-adds it for the owner (#858)', () => {
      const updateItem = vi.fn().mockReturnValue({ id: 9, name: 'X', is_private: 1, owner_id: 1 });
      const broadcast = vi.fn();
      const broadcastItem = vi.fn();
      // Was public before → public→private transition.
      const getItemPrivacy = vi.fn().mockReturnValue({ is_private: 0, owner_id: 1 });
      const svc = makeService({ updateItem, broadcast, broadcastItem, getItemPrivacy } as Partial<PackingService>);
      new PackingController(svc).update(user, '5', '9', { is_private: true }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:deleted', { itemId: 9 }, 'sock');
      expect(broadcastItem).toHaveBeenCalledWith('5', 'packing:created', expect.anything(), expect.anything(), 'sock');
    });

    it('re-shares a freshly-public item to the whole room (#858)', () => {
      const updated = { id: 9, name: 'X', is_private: 0, owner_id: 1 };
      const updateItem = vi.fn().mockReturnValue(updated);
      const broadcast = vi.fn();
      // Was private before → private→public transition: create for those missing it, then update for all.
      const getItemPrivacy = vi.fn().mockReturnValue({ is_private: 1, owner_id: 1 });
      const svc = makeService({ updateItem, broadcast, getItemPrivacy } as Partial<PackingService>);
      new PackingController(svc).update(user, '5', '9', { is_private: false }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:created', { item: updated }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:updated', { item: updated }, 'sock');
    });

    it('forwards the X-Base-Updated-At token and 409s on a conflict (#1135)', () => {
      const updateItem = vi.fn().mockReturnValue({ conflict: true, server: { id: 9, name: 'Theirs' } });
      const broadcast = vi.fn();
      const svc = makeService({ updateItem, broadcast } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).update(user, '5', '9', { name: 'Mine' }, 'sock', '2026-01-01 00:00:00'))).toEqual({
        status: 409, body: { error: 'conflict', server: { id: 9, name: 'Theirs' } },
      });
      expect(updateItem).toHaveBeenCalledWith('5', '9', expect.objectContaining({ name: 'Mine' }), ['name'], '2026-01-01 00:00:00', user.id);
      expect(broadcast).not.toHaveBeenCalled();
    });
  });

  describe('PUT /reorder', () => {
    it('reorders the items and reports success', () => {
      const reorderItems = vi.fn();
      const svc = makeService({ reorderItems } as Partial<PackingService>);
      expect(new PackingController(svc).reorder(user, '5', [3, 1, 2])).toEqual({ success: true });
      expect(reorderItems).toHaveBeenCalledWith('5', [3, 1, 2]);
    });

    it('403 without packing_edit permission', () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new PackingController(svc).reorder(user, '5', [1]))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });
  });

  describe('DELETE /:id (remove)', () => {
    it('404 when the item is missing', () => {
      const svc = makeService({ deleteItem: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).remove(user, '5', '9'))).toEqual({
        status: 404, body: { error: 'Item not found' },
      });
    });

    it('deletes a Common item and broadcasts to the room', () => {
      const deleted = { id: 9, is_private: 0, owner_id: 1 };
      const deleteItem = vi.fn().mockReturnValue(deleted);
      const broadcast = vi.fn();
      const svc = makeService({ deleteItem, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).remove(user, '5', '9', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:deleted', { itemId: 9 }, 'sock');
    });

    it('scopes the delete of a Shared item to the owner + recipients (#858)', () => {
      const deleted = { id: 9, is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };
      const deleteItem = vi.fn().mockReturnValue(deleted);
      const broadcastToViewers = vi.fn();
      const svc = makeService({ deleteItem, broadcastToViewers } as Partial<PackingService>);
      new PackingController(svc).remove(user, '5', '9', 'sock');
      expect(broadcastToViewers).toHaveBeenCalledWith('5', 'packing:deleted', { itemId: 9 }, [1, 2], 'sock');
    });
  });

  describe('sharing, contributors, clone (#858 three-tier)', () => {
    it('PUT /:id/sharing 400 invalid, 404 missing, 403 non-owner, else drops + re-emits', () => {
      expect(thrown(() => new PackingController(makeService()).setSharing(user, '5', '9', { visibility: 'nope' as never }))).toEqual({ status: 400, body: { error: 'Invalid visibility' } });
      expect(thrown(() => new PackingController(makeService({ setItemSharing: vi.fn().mockReturnValue(null) } as Partial<PackingService>)).setSharing(user, '5', '9', { visibility: 'personal' }))).toEqual({ status: 404, body: { error: 'Item not found' } });
      expect(thrown(() => new PackingController(makeService({ setItemSharing: vi.fn().mockReturnValue({ forbidden: true }) } as Partial<PackingService>)).setSharing(user, '5', '9', { visibility: 'personal' }))).toEqual({ status: 403, body: { error: 'Only the owner can change sharing' } });

      const updated = { id: 9, is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };
      const setItemSharing = vi.fn().mockReturnValue(updated);
      const broadcast = vi.fn();
      const broadcastToViewers = vi.fn();
      const svc = makeService({ setItemSharing, broadcast, broadcastToViewers } as Partial<PackingService>);
      new PackingController(svc).setSharing(user, '5', '9', { visibility: 'shared', recipient_ids: [2] }, 'sock');
      expect(setItemSharing).toHaveBeenCalledWith('5', '9', user.id, 'shared', [2]);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:deleted', { itemId: 9 }, 'sock');
      expect(broadcastToViewers).toHaveBeenCalledWith('5', 'packing:created', { item: updated }, [1, 2], 'sock');
    });

    it('POST /:id/clone 404 missing, else creates a personal copy for the caller', () => {
      expect(thrown(() => new PackingController(makeService({ cloneItem: vi.fn().mockReturnValue(null) } as Partial<PackingService>)).clone(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Item not found' } });
      const item = { id: 12, is_private: 1, owner_id: 1 };
      const cloneItem = vi.fn().mockReturnValue(item);
      const broadcastToViewers = vi.fn();
      const svc = makeService({ cloneItem, broadcastToViewers } as Partial<PackingService>);
      expect(new PackingController(svc).clone(user, '5', '9', 'sock')).toEqual({ item });
      expect(cloneItem).toHaveBeenCalledWith('5', '9', user.id);
      expect(broadcastToViewers).toHaveBeenCalledWith('5', 'packing:created', { item }, [1], 'sock');
    });

    it('POST /:id/contributors 404 missing, else adds the caller + broadcasts', () => {
      expect(thrown(() => new PackingController(makeService({ addContributor: vi.fn().mockReturnValue(null) } as Partial<PackingService>)).addContributor(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Item not found or not a shared list item' } });
      const item = { id: 9, is_private: 0, contributors: [{ user_id: 1 }] };
      const addContributor = vi.fn().mockReturnValue(item);
      const broadcast = vi.fn();
      const svc = makeService({ addContributor, broadcast } as Partial<PackingService>);
      new PackingController(svc).addContributor(user, '5', '9', 'sock');
      expect(addContributor).toHaveBeenCalledWith('5', '9', user.id);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:updated', { item }, 'sock');
    });

    it('DELETE /:id/contributors/:userId removes the contributor + broadcasts', () => {
      const item = { id: 9, is_private: 0, contributors: [] };
      const removeContributor = vi.fn().mockReturnValue(item);
      const broadcast = vi.fn();
      const svc = makeService({ removeContributor, broadcast } as Partial<PackingService>);
      new PackingController(svc).removeContributor(user, '5', '9', '2', 'sock');
      expect(removeContributor).toHaveBeenCalledWith('5', '9', 2);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:updated', { item }, 'sock');
    });
  });

  describe('bags', () => {
    it('GET /bags lists bags for the trip', () => {
      const listBags = vi.fn().mockReturnValue([{ id: 3, name: 'Carry-on' }]);
      const svc = makeService({ listBags } as Partial<PackingService>);
      expect(new PackingController(svc).listBags(user, '5')).toEqual({ bags: [{ id: 3, name: 'Carry-on' }] });
    });

    it('400 on bag create with blank name', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).createBag(user, '5', { name: '  ' }))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    it('400 on bag create with no name at all (optional-chain short-circuit)', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).createBag(user, '5', {}))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    it('creates a bag and broadcasts', () => {
      const createBag = vi.fn().mockReturnValue({ id: 3, name: 'Carry-on' });
      const broadcast = vi.fn();
      const svc = makeService({ createBag, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).createBag(user, '5', { name: 'Carry-on', color: '#fff' }, 'sock')).toEqual({
        bag: { id: 3, name: 'Carry-on' },
      });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-created', { bag: { id: 3, name: 'Carry-on' } }, 'sock');
    });

    it('404 on bag update when missing', () => {
      const svc = makeService({ updateBag: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).updateBag(user, '5', '3', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Bag not found' },
      });
    });

    it('updates a bag, forwards changed keys and broadcasts', () => {
      const updateBag = vi.fn().mockReturnValue({ id: 3, name: 'X' });
      const broadcast = vi.fn();
      const svc = makeService({ updateBag, broadcast } as Partial<PackingService>);
      new PackingController(svc).updateBag(user, '5', '3', { name: 'X', color: '#000' }, 'sock');
      expect(updateBag).toHaveBeenCalledWith('5', '3', expect.objectContaining({ name: 'X', color: '#000' }), ['name', 'color']);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-updated', { bag: { id: 3, name: 'X' } }, 'sock');
    });

    it('404 on bag delete when missing', () => {
      const svc = makeService({ deleteBag: vi.fn().mockReturnValue(false) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).deleteBag(user, '5', '3'))).toEqual({
        status: 404, body: { error: 'Bag not found' },
      });
    });

    it('deletes a bag and broadcasts', () => {
      const deleteBag = vi.fn().mockReturnValue(true);
      const broadcast = vi.fn();
      const svc = makeService({ deleteBag, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).deleteBag(user, '5', '3', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-deleted', { bagId: 3 }, 'sock');
    });

    it('404 on set-members when the bag is missing', () => {
      const svc = makeService({ setBagMembers: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).setBagMembers(user, '5', '3', [1, 2]))).toEqual({
        status: 404, body: { error: 'Bag not found' },
      });
    });

    it('sets bag members and broadcasts (array branch)', () => {
      const setBagMembers = vi.fn().mockReturnValue([{ user_id: 1 }, { user_id: 2 }]);
      const broadcast = vi.fn();
      const svc = makeService({ setBagMembers, broadcast } as Partial<PackingService>);
      const res = new PackingController(svc).setBagMembers(user, '5', '3', [1, 2], 'sock');
      expect(res).toEqual({ members: [{ user_id: 1 }, { user_id: 2 }] });
      expect(setBagMembers).toHaveBeenCalledWith('5', '3', [1, 2]);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-members-updated', { bagId: 3, members: [{ user_id: 1 }, { user_id: 2 }] }, 'sock');
    });

    it('coerces non-array members to an empty list (ternary else branch)', () => {
      const setBagMembers = vi.fn().mockReturnValue([]);
      const svc = makeService({ setBagMembers } as Partial<PackingService>);
      new PackingController(svc).setBagMembers(user, '5', '3', 'not-an-array');
      expect(setBagMembers).toHaveBeenCalledWith('5', '3', []);
    });
  });

  describe('templates', () => {
    it('GET /templates returns the template list for an accessible trip', () => {
      const listTemplates = vi.fn().mockReturnValue([{ id: 1, name: 'Beach', item_count: 4 }]);
      const svc = makeService({ listTemplates } as Partial<PackingService>);
      expect(new PackingController(svc).listTemplates(user, '5')).toEqual({
        templates: [{ id: 1, name: 'Beach', item_count: 4 }],
      });
    });

    it('404 when applying a missing/empty template (POST stays 200 otherwise)', () => {
      const svc = makeService({ applyTemplate: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).applyTemplate(user, '5', 't1'))).toEqual({
        status: 404, body: { error: 'Template not found or empty' },
      });
    });

    it('applies a template, broadcasts the added items and reports the count', () => {
      const applyTemplate = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const broadcast = vi.fn();
      const svc = makeService({ applyTemplate, broadcast } as Partial<PackingService>);
      const res = new PackingController(svc).applyTemplate(user, '5', 't1', 'sock');
      expect(res).toEqual({ items: [{ id: 1 }, { id: 2 }, { id: 3 }], count: 3 });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:template-applied', { items: [{ id: 1 }, { id: 2 }, { id: 3 }] }, 'sock');
    });

    it('400 when an admin saves a template with no name (whitespace)', () => {
      const saveAsTemplate = vi.fn();
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(admin, '5', '   '))).toEqual({
        status: 400, body: { error: 'Template name is required' },
      });
      expect(saveAsTemplate).not.toHaveBeenCalled();
    });

    it('400 when an admin saves a template with no name at all (optional-chain)', () => {
      const saveAsTemplate = vi.fn();
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(admin, '5'))).toEqual({
        status: 400, body: { error: 'Template name is required' },
      });
      expect(saveAsTemplate).not.toHaveBeenCalled();
    });

    it('403 when a non-admin tries to save a template', () => {
      const saveAsTemplate = vi.fn();
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(user, '5', 'My template'))).toEqual({
        status: 403, body: { error: 'Admin access required' },
      });
      expect(saveAsTemplate).not.toHaveBeenCalled();
    });

    it('400 when an admin saves a template with no items', () => {
      const svc = makeService({ saveAsTemplate: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(admin, '5', 'My template'))).toEqual({
        status: 400, body: { error: 'No items to save' },
      });
    });

    it('saves a template for an admin', () => {
      const saveAsTemplate = vi.fn().mockReturnValue({ id: 7, name: 'My template' });
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(new PackingController(svc).saveAsTemplate(admin, '5', 'My template')).toEqual({
        template: { id: 7, name: 'My template' },
      });
      expect(saveAsTemplate).toHaveBeenCalledWith('5', admin.id, 'My template');
    });
  });

  describe('category assignees', () => {
    it('GET /category-assignees returns the assignee list for an accessible trip', () => {
      const getCategoryAssignees = vi.fn().mockReturnValue([{ category: 'Clothes', user_id: 2 }]);
      const svc = makeService({ getCategoryAssignees } as Partial<PackingService>);
      expect(new PackingController(svc).categoryAssignees(user, '5')).toEqual({
        assignees: [{ category: 'Clothes', user_id: 2 }],
      });
      expect(getCategoryAssignees).toHaveBeenCalledWith('5');
    });

    it('decodes the URI-encoded category name before forwarding', () => {
      const updateCategoryAssignees = vi.fn().mockReturnValue([]);
      const broadcast = vi.fn();
      const notifyTagged = vi.fn();
      const svc = makeService({ updateCategoryAssignees, broadcast, notifyTagged } as Partial<PackingService>);
      new PackingController(svc).updateCategoryAssignees(user, '5', 'Toys%20%26%20Games', [2]);
      expect(updateCategoryAssignees).toHaveBeenCalledWith('5', 'Toys & Games', [2]);
    });

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
