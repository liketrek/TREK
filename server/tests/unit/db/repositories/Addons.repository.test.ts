import { Addons } from '../../../../src/db/entities/Addons.entity';
import type { AddonsRepository } from '../../../../src/db/repositories/Addons.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let addons: AddonsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  addons = t.repo(Addons);
});
beforeEach(() => {
  resetTestDb(testDb);
  // resetTestDb deliberately keeps the seeded addons catalogue (test-db.ts's
  // KEEP_TABLES) — these tests want a known, empty table so every case
  // controls its own rows.
  testDb.exec('DELETE FROM addons');
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawRow(id: string): unknown {
  return testDb.prepare('SELECT * FROM addons WHERE id = ?').get(id);
}

function insertAddon(row: {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  icon?: string | null;
  enabled: 0 | 1;
  sort_order?: number;
}): void {
  testDb
    .prepare('INSERT INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(
      row.id,
      row.name,
      row.description ?? null,
      row.type ?? 'global',
      row.icon ?? null,
      row.enabled,
      row.sort_order ?? 0,
    );
}

describe('AddonsRepository', () => {
  describe('isEnabled', () => {
    it('ADDONSREPO-001: reads a stored 1 as true', async () => {
      insertAddon({ id: 'budget', name: 'Budget', enabled: 1 });
      expect(await addons.isEnabled('budget')).toBe(true);
    });

    it('ADDONSREPO-002: reads a stored 0 as false', async () => {
      insertAddon({ id: 'budget', name: 'Budget', enabled: 0 });
      expect(await addons.isEnabled('budget')).toBe(false);
    });

    it('ADDONSREPO-003: a missing row reads false', async () => {
      expect(await addons.isEnabled('does-not-exist')).toBe(false);
    });

    // I1 (Task 0 review, carried forward): a primary-key findOne answers a
    // repeat call from the identity map unless refresh: true is set —
    // invisible to a write on the same id in the same request.
    describe('sees a write on the same id in the same request (I1, identity-map regression)', () => {
      it('ADDONSREPO-005: a raw UPDATE on the same id then isEnabled reads the new value', async () => {
        insertAddon({ id: 'budget', name: 'Budget', enabled: 0 });
        expect(await addons.isEnabled('budget')).toBe(false); // populate the identity map
        testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run('budget');
        expect(await addons.isEnabled('budget')).toBe(true);
      });
    });
  });

  describe('listEnabled', () => {
    it('ADDONSREPO-006: returns only enabled addons, ordered by sort_order', async () => {
      insertAddon({ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: 1, sort_order: 2 });
      insertAddon({ id: 'budget', name: 'Costs', type: 'trip', icon: 'wallet', enabled: 1, sort_order: 1 });
      insertAddon({ id: 'vacay', name: 'Vacay', type: 'page', icon: 'sun', enabled: 0, sort_order: 0 });

      const rows = await addons.listEnabled();
      expect(rows.map((r) => r.id)).toEqual(['budget', 'atlas']);
    });

    it('ADDONSREPO-007: the enabled column comes back as a JS boolean, not the stored int', async () => {
      insertAddon({ id: 'atlas', name: 'Atlas', enabled: 1 });
      const [row] = await addons.listEnabled();
      expect(row.enabled).toBe(true);
      expect(rawRow('atlas')).toMatchObject({ enabled: 1 });
    });

    it('ADDONSREPO-008: an empty table returns an empty array', async () => {
      expect(await addons.listEnabled()).toEqual([]);
    });

    it('ADDONSREPO-009: carries the full row shape (id, name, description, type, icon, enabled, config, sort_order)', async () => {
      insertAddon({
        id: 'atlas',
        name: 'Atlas',
        description: 'Visited countries map',
        type: 'page',
        icon: 'globe',
        enabled: 1,
        sort_order: 3,
      });
      const [row] = await addons.listEnabled();
      expect(row).toEqual({
        id: 'atlas',
        name: 'Atlas',
        description: 'Visited countries map',
        type: 'page',
        icon: 'globe',
        enabled: true,
        config: {},
        sort_order: 3,
      });
    });
  });

  // Plan 3i Task 4 fix wave (should-land 5): AD26 (listAllOrdered) and
  // AD30/AD39 (findById) shipped in Task 1 with no repository-level test —
  // full-key parity against the exact legacy SQL each method's own docstring
  // names.
  describe('listAllOrdered (AD26)', () => {
    it('ADDONSREPO-010: matches SELECT * FROM addons ORDER BY sort_order, id — unfiltered, including a disabled addon', async () => {
      insertAddon({ id: 'vacay', name: 'Vacay', type: 'page', icon: 'sun', enabled: 0, sort_order: 1 });
      insertAddon({ id: 'budget', name: 'Costs', type: 'trip', icon: 'wallet', enabled: 1, sort_order: 0 });
      const legacy = testDb.prepare('SELECT * FROM addons ORDER BY sort_order, id').all();
      const rows = await addons.listAllOrdered();
      expect(rows.map((r) => r.id)).toEqual(['budget', 'vacay']); // includes the disabled one, unlike listEnabled
      expect(rows).toEqual(
        (legacy as Array<{ enabled: number; config: string | null }>).map((r) => ({
          ...r,
          enabled: !!r.enabled,
          config: JSON.parse(r.config ?? '{}'),
        })),
      );
    });

    it('ADDONSREPO-011: an empty table returns an empty array', async () => {
      expect(await addons.listAllOrdered()).toEqual([]);
    });
  });

  describe('findById (AD30/AD39)', () => {
    it('ADDONSREPO-012: matches SELECT * FROM addons WHERE id = ?, on both a pre-write read and a post-write re-select (byte-identical text at both call sites)', async () => {
      insertAddon({
        id: 'budget',
        name: 'Costs',
        description: 'Track spend',
        type: 'trip',
        icon: 'wallet',
        enabled: 0,
        sort_order: 4,
      });
      const preWrite = await addons.findById('budget');
      expect(preWrite).toEqual({
        id: 'budget',
        name: 'Costs',
        description: 'Track spend',
        type: 'trip',
        icon: 'wallet',
        enabled: false,
        config: {},
        sort_order: 4,
      });

      testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run('budget');
      const postWrite = await addons.findById('budget');
      expect(postWrite?.enabled).toBe(true);
    });

    it('ADDONSREPO-013: a missing id returns null', async () => {
      expect(await addons.findById('does-not-exist')).toBeNull();
    });
  });
});
