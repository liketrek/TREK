import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
vi.mock('../../../src/db/database', () => ({ db: dbMock, closeDb: () => {}, reinitialize: () => {} }));

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn(() => true) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { pk } = vi.hoisted(() => ({
  pk: {
    verifyTripAccess: vi.fn(), listItems: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn(),
    bulkImport: vi.fn(), listBags: vi.fn(), createBag: vi.fn(), updateBag: vi.fn(), deleteBag: vi.fn(),
    listTemplates: vi.fn(), applyTemplate: vi.fn(), saveAsTemplate: vi.fn(), setBagMembers: vi.fn(), getCategoryAssignees: vi.fn(),
    updateCategoryAssignees: vi.fn(), reorderItems: vi.fn(),
  },
}));
vi.mock('../../../src/services/packingService', () => pk);

const { send } = vi.hoisted(() => ({ send: vi.fn(() => Promise.resolve()) }));
vi.mock('../../../src/services/notificationService', () => ({ send }));

import { PackingService } from '../../../src/nest/packing/packing.service';

function svc() {
  return new PackingService();
}

beforeEach(() => vi.clearAllMocks());

describe('PackingService (wrapper delegation + helpers)', () => {
  it('canEdit delegates to checkPermission with packing_edit', () => {
    svc().canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never);
    expect(checkPermission).toHaveBeenCalledWith('packing_edit', 'user', 2, 1, true);
  });

  it('broadcast forwards to the websocket helper', () => {
    svc().broadcast('5', 'packing:created', { item: 1 }, 'sock');
    expect(broadcast).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock');
  });

  it('forwards every item/bag/template/assignee call to the legacy service', () => {
    const s = svc();
    s.verifyTripAccess('5', 1); expect(pk.verifyTripAccess).toHaveBeenCalledWith('5', 1);
    s.listItems('5'); expect(pk.listItems).toHaveBeenCalledWith('5');
    s.createItem('5', { name: 'a' }); expect(pk.createItem).toHaveBeenCalledWith('5', { name: 'a' });
    s.updateItem('5', '2', { name: 'b' } as never, ['name']); expect(pk.updateItem).toHaveBeenCalledWith('5', '2', { name: 'b' }, ['name']);
    s.deleteItem('5', '2'); expect(pk.deleteItem).toHaveBeenCalledWith('5', '2');
    s.bulkImport('5', [{ name: 'x' }] as never); expect(pk.bulkImport).toHaveBeenCalledWith('5', [{ name: 'x' }]);
    s.reorderItems('5', [3, 1] as never); expect(pk.reorderItems).toHaveBeenCalledWith('5', [3, 1]);
    s.listBags('5'); expect(pk.listBags).toHaveBeenCalledWith('5');
    s.createBag('5', { name: 'Bag' }); expect(pk.createBag).toHaveBeenCalledWith('5', { name: 'Bag' });
    s.updateBag('5', '2', { name: 'B' } as never, ['name']); expect(pk.updateBag).toHaveBeenCalledWith('5', '2', { name: 'B' }, ['name']);
    s.deleteBag('5', '2'); expect(pk.deleteBag).toHaveBeenCalledWith('5', '2');
    s.setBagMembers('5', '2', [1, 2]); expect(pk.setBagMembers).toHaveBeenCalledWith('5', '2', [1, 2]);
    s.listTemplates(); expect(pk.listTemplates).toHaveBeenCalled();
    s.applyTemplate('5', 't1'); expect(pk.applyTemplate).toHaveBeenCalledWith('5', 't1');
    s.saveAsTemplate('5', 1, 'Tpl'); expect(pk.saveAsTemplate).toHaveBeenCalledWith('5', 1, 'Tpl');
    s.getCategoryAssignees('5'); expect(pk.getCategoryAssignees).toHaveBeenCalledWith('5');
    s.updateCategoryAssignees('5', 'Clothes', [2]); expect(pk.updateCategoryAssignees).toHaveBeenCalledWith('5', 'Clothes', [2]);
  });

  describe('notifyTagged', () => {
    it('does nothing when no users are tagged', () => {
      svc().notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', []);
      svc().notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', 'nope');
      expect(dbMock.prepare).not.toHaveBeenCalled();
    });

    it('fires the notification when users are tagged (fire-and-forget, no throw)', () => {
      expect(() => svc().notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', [2, 3])).not.toThrow();
    });

    it('queries the trip title and dispatches the notification with the resolved title', async () => {
      dbMock._stmt.get.mockReturnValue({ title: 'Iceland 2026' });
      svc().notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', [2, 3]);
      // Flush the dynamic import().then microtask chain.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(dbMock.prepare).toHaveBeenCalledWith('SELECT title FROM trips WHERE id = ?');
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'packing_tagged',
          actorId: 1,
          scope: 'trip',
          targetId: 5,
          params: expect.objectContaining({ trip: 'Iceland 2026', actor: 'a@b.c', category: 'Clothes', tripId: '5' }),
        }),
      );
    });

    it('falls back to "Untitled" when the trip row is missing (?? / default branch)', async () => {
      dbMock._stmt.get.mockReturnValue(undefined);
      svc().notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', [2]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ params: expect.objectContaining({ trip: 'Untitled' }) }),
      );
    });
  });
});
