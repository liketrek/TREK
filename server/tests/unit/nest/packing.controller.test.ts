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
  const base = {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    broadcastItem: vi.fn(),
    broadcastToViewers: vi.fn(),
    // Content-free "the bag weights moved" ping fired after every item write (#2191).
    broadcastBagTotals: vi.fn(),
    // Real viewer logic so the emit-to-viewers routing is exercised faithfully.
    viewersOf: (item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] } | null | undefined) =>
      !item || !item.is_private ? null : [item.owner_id, ...(item.recipients || []).map(r => r.user_id)].filter((x): x is number => x != null),
    getItemPrivacy: vi.fn().mockReturnValue(undefined),
    notifyTagged: vi.fn(),
    ...overrides,
  } as unknown as PackingService;
  // emitToViewers and broadcastUpdate moved from the controller into the service, so
  // the mock reproduces their routing on top of whatever broadcast stubs a test
  // supplied. That keeps every #858 assertion below pointed at the same three
  // primitives it always was.
  const svc = base as unknown as PackingService & Record<string, (...a: never[]) => unknown>;
  svc.emitToViewers = ((tripId, event, payload, item, socketId) => {
    const viewers = svc.viewersOf(item);
    if (viewers === null) svc.broadcast(tripId, event, payload, socketId);
    else svc.broadcastToViewers(tripId, event, payload, viewers, socketId);
  }) as PackingService['emitToViewers'];
  svc.broadcastUpdate = ((tripId, id, item, wasPrivate, socketId) => {
    if (item.is_private) {
      if (wasPrivate) {
        svc.broadcastItem(tripId, 'packing:updated', { item }, item, socketId);
      } else {
        svc.broadcast(tripId, 'packing:deleted', { itemId: Number(id) }, socketId);
        svc.broadcastItem(tripId, 'packing:created', { item }, item, socketId);
      }
    } else {
      if (wasPrivate) svc.broadcast(tripId, 'packing:created', { item }, socketId);
      svc.broadcast(tripId, 'packing:updated', { item }, socketId);
    }
  }) as PackingService['broadcastUpdate'];
  return svc;
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

// The 404 "Trip not found" and 403 "No permission" cases moved to
// trip-access.guard.test.ts with the check itself.
describe('PackingController (parity with the legacy /api/trips/:tripId/packing route)', () => {

  it('GET / returns items for an accessible trip', () => {
    const svc = makeService({ listItems: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<PackingService>);
    expect(new PackingController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }] });
  });

  describe('POST / (create)', () => {

    // The missing-name 400 moved from a bespoke controller check into the
    // ZodValidationPipe (packingCreateItemRequestSchema) — direct method calls
    // bypass parameter pipes, so that path is covered by the e2e suite and
    // the schema spec in @trek/shared.

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

    it('pings the room that bag weights moved after a create (#2191)', () => {
      // The totals are summed server-side, so nothing else tells the other
      // members' screens to re-read them.
      const createItem = vi.fn().mockReturnValue({ id: 9, name: 'Socks', is_private: 0 });
      const broadcastBagTotals = vi.fn();
      const svc = makeService({ createItem, broadcastBagTotals } as Partial<PackingService>);
      new PackingController(svc).create(user, '5', { name: 'Socks', weight_grams: 250 }, 'sock');
      expect(broadcastBagTotals).toHaveBeenCalledWith('5');
    });

    it('pings after a delete, and after a bag delete that orphans its items (#2191)', () => {
      const deleteItem = vi.fn().mockReturnValue({ id: 9, is_private: 0 });
      const broadcastBagTotals = vi.fn();
      const svc = makeService({ deleteItem, broadcastBagTotals } as Partial<PackingService>);
      new PackingController(svc).remove(user, '5', '9', 'sock');
      expect(broadcastBagTotals).toHaveBeenCalledWith('5');

      // bag_id is ON DELETE SET NULL: the bag's items land in the unassigned pile.
      const deleteBag = vi.fn().mockReturnValue(true);
      const bagPing = vi.fn();
      const bagSvc = makeService({ deleteBag, broadcastBagTotals: bagPing } as Partial<PackingService>);
      new PackingController(bagSvc).deleteBag(user, '5', '7', 'sock');
      expect(bagPing).toHaveBeenCalledWith('5');
    });

    it('does NOT ping when the update cannot move a weight (#2191)', () => {
      // Checking an item off is the most frequent packing write there is, and
      // every ping costs each connected client a listBags round trip.
      const updateItem = vi.fn().mockReturnValue({ id: 9, is_private: 0 });
      const broadcastBagTotals = vi.fn();
      const svc = makeService({ updateItem, broadcastBagTotals } as Partial<PackingService>);

      new PackingController(svc).update(user, '5', '9', { checked: true }, 'sock');
      expect(broadcastBagTotals).not.toHaveBeenCalled();

      new PackingController(svc).update(user, '5', '9', { quantity: 3 }, 'sock');
      expect(broadcastBagTotals).toHaveBeenCalledWith('5');
    });

    it('routes a Shared item create only to the owner + recipients (#858)', () => {
      const item = { id: 9, name: 'Power bank', is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };
      const createItem = vi.fn().mockReturnValue(item);
      const broadcastToViewers = vi.fn();
      const svc = makeService({ createItem, broadcastToViewers } as Partial<PackingService>);
      new PackingController(svc).create(user, '5', { name: 'Power bank', visibility: 'shared', recipient_ids: [2] }, 'sock');
      expect(broadcastToViewers).toHaveBeenCalledWith('5', 'packing:created', { item }, [1, 2], 'sock');
    });

    it('forwards weight_grams, bag_id and quantity to the service (#2154)', () => {
      // The create route used to hand only the six legacy fields through, so
      // the values a caller sent vanished into a 201.
      const createItem = vi.fn().mockReturnValue({ id: 9, name: 'Tent', is_private: 0 });
      const svc = makeService({ createItem, broadcast: vi.fn() } as Partial<PackingService>);
      new PackingController(svc).create(user, '5', { name: 'Tent', weight_grams: 250, bag_id: 3, quantity: 3 }, 'sock');
      expect(createItem).toHaveBeenCalledWith('5', expect.objectContaining({ weight_grams: 250, bag_id: 3, quantity: 3 }), user.id);
    });

    it('400 "Bag not found" for a bag off the trip (#2154), broadcasting nothing', () => {
      // Body validation error, so 400 — the 404 'Bag not found' stays with the
      // /bags/:bagId path routes.
      const broadcast = vi.fn();
      const svc = makeService({ createItem: vi.fn().mockReturnValue({ invalidBag: true }), broadcast } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).create(user, '5', { name: 'Tent', bag_id: 999 }))).toEqual({
        status: 400, body: { error: 'Bag not found' },
      });
      expect(broadcast).not.toHaveBeenCalled();
    });
  });

  it('GET / lists items for the trip, scoped to the viewer (#858)', () => {
    const listItems = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
    const svc = makeService({ listItems } as Partial<PackingService>);
    expect(new PackingController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }, { id: 2 }] });
    expect(listItems).toHaveBeenCalledWith('5', user.id);
  });

  describe('POST /import', () => {
    it('400 when items is an empty array (bespoke check, schema permits [])', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).importItems(user, '5', { items: [] }))).toEqual({
        status: 400, body: { error: 'items must be a non-empty array' },
      });
    });

    // The non-array 400 moved into the ZodValidationPipe (packingImportRequestSchema
    // requires an array) — direct method calls bypass parameter pipes, so that
    // path is covered by the e2e suite and the schema spec in @trek/shared.


    it('imports (owned by the importer) and broadcasts per item', () => {
      const bulkImport = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
      const broadcastItem = vi.fn();
      const svc = makeService({ bulkImport, broadcastItem } as Partial<PackingService>);
      const res = new PackingController(svc).importItems(user, '5', { items: [{ name: 'a' }, { name: 'b' }] }, 'sock');
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
      // acting user id is forwarded so privatizing an unowned item can stamp the
      // owner (#858); checked is normalized to the 0/1 the SQL binds.
      expect(updateItem).toHaveBeenCalledWith('5', '9', expect.objectContaining({ name: 'X', checked: 1 }), ['name', 'checked'], undefined, user.id);
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

    it('400 "Bag not found" for a bag off the trip (#2154), broadcasting nothing', () => {
      const broadcast = vi.fn();
      const svc = makeService({ updateItem: vi.fn().mockReturnValue({ invalidBag: true }), broadcast } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).update(user, '5', '9', { bag_id: 999 }))).toEqual({
        status: 400, body: { error: 'Bag not found' },
      });
      expect(broadcast).not.toHaveBeenCalled();
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
      expect(new PackingController(svc).reorder(user, '5', { orderedIds: [3, 1, 2] })).toEqual({ success: true });
      expect(reorderItems).toHaveBeenCalledWith('5', [3, 1, 2]);
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
    // The invalid-visibility 400 moved into the ZodValidationPipe
    // (packingSetSharingRequestSchema requires the enum) — direct method calls
    // bypass parameter pipes, so that path is covered by the e2e suite and the
    // schema spec in @trek/shared.
    it('PUT /:id/sharing 404 missing, 403 non-owner, else drops + re-emits', () => {
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
    it('GET /bags lists bags for the trip, with the unassigned weight alongside (#2191)', () => {
      // One service call, so the SUM…GROUP BY runs once per request — this route
      // now fires on every item write for every connected client.
      const listBagsWithWeights = vi.fn().mockReturnValue({
        bags: [{ id: 3, name: 'Carry-on', total_weight_grams: 800 }],
        unassigned_weight_grams: 150,
      });
      const svc = makeService({ listBagsWithWeights } as Partial<PackingService>);
      expect(new PackingController(svc).listBags(user, '5')).toEqual({
        bags: [{ id: 3, name: 'Carry-on', total_weight_grams: 800 }],
        unassigned_weight_grams: 150,
      });
      expect(listBagsWithWeights).toHaveBeenCalledTimes(1);
    });

    it('400 on bag create with blank name (bespoke check — the schema cannot see whitespace)', () => {
      const svc = makeService();
      expect(thrown(() => new PackingController(svc).createBag(user, '5', { name: '  ' }))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    // The missing-name 400 moved into the ZodValidationPipe
    // (packingCreateBagRequestSchema requires a non-empty name) — direct method
    // calls bypass parameter pipes, so that path is covered by the e2e suite.

    it('creates a bag and broadcasts', () => {
      const createBag = vi.fn().mockReturnValue({ id: 3, name: 'Carry-on' });
      const broadcast = vi.fn();
      const svc = makeService({ createBag, broadcast } as Partial<PackingService>);
      expect(new PackingController(svc).createBag(user, '5', { name: 'Carry-on', color: '#fff' }, 'sock')).toEqual({
        bag: { id: 3, name: 'Carry-on' },
      });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-created', { bag: { id: 3, name: 'Carry-on' } }, 'sock');
    });

    it('forwards weight_limit_grams on bag create (#2154)', () => {
      const createBag = vi.fn().mockReturnValue({ id: 3, name: 'Backpack', weight_limit_grams: 8000 });
      const svc = makeService({ createBag, broadcast: vi.fn() } as Partial<PackingService>);
      new PackingController(svc).createBag(user, '5', { name: 'Backpack', weight_limit_grams: 8000 });
      expect(createBag).toHaveBeenCalledWith('5', { name: 'Backpack', color: undefined, weight_limit_grams: 8000 });
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
      expect(thrown(() => new PackingController(svc).setBagMembers(user, '5', '3', { user_ids: [1, 2] }))).toEqual({
        status: 404, body: { error: 'Bag not found' },
      });
    });

    it('sets bag members and broadcasts', () => {
      const setBagMembers = vi.fn().mockReturnValue([{ user_id: 1 }, { user_id: 2 }]);
      const broadcast = vi.fn();
      const svc = makeService({ setBagMembers, broadcast } as Partial<PackingService>);
      const res = new PackingController(svc).setBagMembers(user, '5', '3', { user_ids: [1, 2] }, 'sock');
      expect(res).toEqual({ members: [{ user_id: 1 }, { user_id: 2 }] });
      expect(setBagMembers).toHaveBeenCalledWith('5', '3', [1, 2]);
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:bag-members-updated', { bagId: 3, members: [{ user_id: 1 }, { user_id: 2 }] }, 'sock');
    });

    // The non-array coercion is gone: packingBagMembersRequestSchema requires
    // user_ids to be an array, so the pipe 400s a malformed body before the
    // handler runs (covered by the schema spec in @trek/shared).
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
      expect(thrown(() => new PackingController(svc).applyTemplate(user, '5', 't1', {}))).toEqual({
        status: 404, body: { error: 'Template not found or empty' },
      });
    });

    it('applies a template, broadcasts the added items and reports the count', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const applyTemplate = vi.fn().mockReturnValue(items);
      const broadcastItem = vi.fn();
      const svc = makeService({ applyTemplate, broadcastItem } as Partial<PackingService>);
      const res = new PackingController(svc).applyTemplate(user, '5', 't1', {}, 'sock');
      expect(res).toEqual({ items, count: 3 });
      expect(applyTemplate).toHaveBeenCalledWith('5', 't1', 'common', user.id);
      expect(broadcastItem).toHaveBeenCalledWith('5', 'packing:template-applied', { items }, items[0], 'sock');
    });

    // #1565: the template must follow the tab the user is on, and a personal apply
    // must not be broadcast to the rest of the trip.
    it('applies a template into the personal list and keeps the broadcast to its owner', () => {
      const items = [{ id: 1, is_private: 1, owner_id: user.id }];
      const applyTemplate = vi.fn().mockReturnValue(items);
      const broadcastItem = vi.fn();
      const svc = makeService({ applyTemplate, broadcastItem } as Partial<PackingService>);
      new PackingController(svc).applyTemplate(user, '5', 't1', { visibility: 'personal' }, 'sock');
      expect(applyTemplate).toHaveBeenCalledWith('5', 't1', 'personal', user.id);
      expect(broadcastItem).toHaveBeenCalledWith('5', 'packing:template-applied', { items }, items[0], 'sock');
    });

    it('falls back to the common pool for an unknown visibility', () => {
      const applyTemplate = vi.fn().mockReturnValue([{ id: 1 }]);
      const svc = makeService({ applyTemplate } as Partial<PackingService>);
      new PackingController(svc).applyTemplate(user, '5', 't1', { visibility: 'bogus' } as never);
      expect(applyTemplate).toHaveBeenCalledWith('5', 't1', 'common', user.id);
    });

    it('400 when an admin saves a template with no name (whitespace — the schema cannot see it)', () => {
      const saveAsTemplate = vi.fn();
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(admin, '5', { name: '   ' }))).toEqual({
        status: 400, body: { error: 'Template name is required' },
      });
      expect(saveAsTemplate).not.toHaveBeenCalled();
    });

    // The missing-name 400 moved into the ZodValidationPipe
    // (packingSaveTemplateRequestSchema requires a non-empty name) — direct
    // method calls bypass parameter pipes, so that path is covered by the e2e
    // suite and the schema spec in @trek/shared.

    it('403 when a non-admin tries to save a template', () => {
      const saveAsTemplate = vi.fn();
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(user, '5', { name: 'My template' }))).toEqual({
        status: 403, body: { error: 'Admin access required' },
      });
      expect(saveAsTemplate).not.toHaveBeenCalled();
    });

    it('400 when an admin saves a template with no items', () => {
      const svc = makeService({ saveAsTemplate: vi.fn().mockReturnValue(null) } as Partial<PackingService>);
      expect(thrown(() => new PackingController(svc).saveAsTemplate(admin, '5', { name: 'My template' }))).toEqual({
        status: 400, body: { error: 'No items to save' },
      });
    });

    it('saves a template for an admin', () => {
      const saveAsTemplate = vi.fn().mockReturnValue({ id: 7, name: 'My template' });
      const svc = makeService({ saveAsTemplate } as Partial<PackingService>);
      expect(new PackingController(svc).saveAsTemplate(admin, '5', { name: 'My template' })).toEqual({
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
      new PackingController(svc).updateCategoryAssignees(user, '5', 'Toys%20%26%20Games', { user_ids: [2] });
      expect(updateCategoryAssignees).toHaveBeenCalledWith('5', 'Toys & Games', [2]);
    });

    it('updates assignees, broadcasts and fires the tag notification', () => {
      const updateCategoryAssignees = vi.fn().mockReturnValue([{ user_id: 2 }]);
      const broadcast = vi.fn();
      const notifyTagged = vi.fn();
      const svc = makeService({ updateCategoryAssignees, broadcast, notifyTagged } as Partial<PackingService>);
      const res = new PackingController(svc).updateCategoryAssignees(user, '5', 'Clothes', { user_ids: [2] }, 'sock');
      expect(res).toEqual({ assignees: [{ user_id: 2 }] });
      expect(broadcast).toHaveBeenCalledWith('5', 'packing:assignees', { category: 'Clothes', assignees: [{ user_id: 2 }] }, 'sock');
      expect(notifyTagged).toHaveBeenCalledWith('5', user, 'Clothes', [2]);
    });
  });
});
