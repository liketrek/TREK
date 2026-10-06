import { PhotoProviders } from '../../../../src/db/entities/PhotoProviders.entity';
import type { PhotoProvidersRepository } from '../../../../src/db/repositories/PhotoProviders.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let photoProviders: PhotoProvidersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  photoProviders = t.repo(PhotoProviders);
});
beforeEach(() => {
  resetTestDb(testDb);
  // photo_provider_fields FK-references photo_providers, so clear the child
  // first — resetTestDb keeps both tables (test-db.ts's KEEP_TABLES).
  testDb.exec('DELETE FROM photo_provider_fields');
  testDb.exec('DELETE FROM photo_providers');
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawRow(id: string): unknown {
  return testDb.prepare('SELECT * FROM photo_providers WHERE id = ?').get(id);
}

function insertProvider(row: {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  enabled: 0 | 1;
  sort_order?: number;
}): void {
  testDb
    .prepare('INSERT INTO photo_providers (id, name, description, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(row.id, row.name, row.description ?? null, row.icon ?? null, row.enabled, row.sort_order ?? 0);
}

describe('PhotoProvidersRepository.listEnabled', () => {
  it('ADDONSPPREPO-001: returns only enabled providers, ordered by sort_order then id', async () => {
    insertProvider({ id: 'synology', name: 'Synology', enabled: 1, sort_order: 0 });
    insertProvider({ id: 'immich', name: 'Immich', enabled: 1, sort_order: 0 });
    insertProvider({ id: 'off', name: 'Off', enabled: 0, sort_order: -1 });

    const rows = await photoProviders.listEnabled();
    // Same sort_order (0) for both enabled rows — id breaks the tie.
    expect(rows.map((r) => r.id)).toEqual(['immich', 'synology']);
  });

  it('ADDONSPPREPO-002: the enabled column comes back as the raw stored integer, not a coerced boolean', async () => {
    insertProvider({ id: 'immich', name: 'Immich', enabled: 1 });
    const [row] = await photoProviders.listEnabled();
    expect(row.enabled).toBe(1);
    expect(typeof row.enabled).toBe('number');
  });

  it('ADDONSPPREPO-003: an empty table returns an empty array', async () => {
    expect(await photoProviders.listEnabled()).toEqual([]);
  });

  it('ADDONSPPREPO-004: carries the full row shape (id, name, description, icon, enabled, sort_order)', async () => {
    insertProvider({
      id: 'immich',
      name: 'Immich',
      description: 'Self-hosted photos',
      icon: 'image',
      enabled: 1,
      sort_order: 4,
    });
    const [row] = await photoProviders.listEnabled();
    expect(row).toEqual({
      id: 'immich',
      name: 'Immich',
      description: 'Self-hosted photos',
      icon: 'image',
      enabled: 1,
      sort_order: 4,
    });
    expect(rawRow('immich')).toMatchObject({ enabled: 1 });
  });
});

describe('PhotoProvidersRepository.listAll / findEnabled', () => {
  it('M1: listAll (the admin listing) returns every row regardless of enabled, unordered by that flag', async () => {
    insertProvider({ id: 'immich', name: 'Immich', enabled: 1 });
    insertProvider({ id: 'off', name: 'Off', enabled: 0 });

    const rows = await photoProviders.listAll();
    expect(rows.map((r) => r.id).sort()).toEqual(['immich', 'off']);
    expect(rows.find((r) => r.id === 'off')?.enabled).toBe(0);
  });

  it('M1: findEnabled reads the enabled flag for a known provider and null for an unknown one', async () => {
    insertProvider({ id: 'synology', name: 'Synology', enabled: 1 });
    expect(await photoProviders.findEnabled('synology')).toEqual({ enabled: 1 });
    expect(await photoProviders.findEnabled('does-not-exist')).toBeNull();
  });
});

// Plan 3i Task 4 fix wave (should-land 5): AD27 (listAllOrdered) and
// AD31/AD40 (findById) shipped in Task 1 with no repository-level test —
// full-key parity against the exact legacy SQL each method's own docstring
// names.
describe('PhotoProvidersRepository.listAllOrdered (AD27) / findById (AD31/AD40)', () => {
  it('ADDONSPPREPO-005: listAllOrdered matches SELECT id, name, description, icon, enabled, sort_order FROM photo_providers ORDER BY sort_order, id — unfiltered, including a disabled provider', async () => {
    insertProvider({ id: 'off', name: 'Off', enabled: 0, sort_order: 1 });
    insertProvider({ id: 'immich', name: 'Immich', enabled: 1, sort_order: 0 });

    const legacy = testDb
      .prepare('SELECT id, name, description, icon, enabled, sort_order FROM photo_providers ORDER BY sort_order, id')
      .all();
    const rows = await photoProviders.listAllOrdered();
    expect(rows.map((r) => r.id)).toEqual(['immich', 'off']); // includes the disabled one, unlike listEnabled
    expect(rows).toEqual(legacy);
  });

  it('ADDONSPPREPO-006: listAllOrdered on an empty table returns an empty array', async () => {
    expect(await photoProviders.listAllOrdered()).toEqual([]);
  });

  it('ADDONSPPREPO-007: findById matches SELECT * FROM photo_providers WHERE id = ?, on both a pre-write read and a post-write re-select (byte-identical text at both call sites)', async () => {
    insertProvider({
      id: 'immich',
      name: 'Immich',
      description: 'Self-hosted photos',
      icon: 'image',
      enabled: 0,
      sort_order: 2,
    });
    const preWrite = await photoProviders.findById('immich');
    expect(preWrite).toEqual({
      id: 'immich',
      name: 'Immich',
      description: 'Self-hosted photos',
      icon: 'image',
      enabled: 0,
      sort_order: 2,
    });

    testDb.prepare('UPDATE photo_providers SET enabled = 1 WHERE id = ?').run('immich');
    const postWrite = await photoProviders.findById('immich');
    expect(postWrite?.enabled).toBe(1);
  });

  it('ADDONSPPREPO-008: findById on a missing id returns null', async () => {
    expect(await photoProviders.findById('does-not-exist')).toBeNull();
  });
});
