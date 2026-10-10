import { DocumentProviders } from '../../../../src/db/entities/DocumentProviders.entity';
import type { DocumentProvidersRepository } from '../../../../src/db/repositories/DocumentProviders.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let documentProviders: DocumentProvidersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  documentProviders = t.repo(DocumentProviders);
});
beforeEach(() => {
  resetTestDb(testDb);
  // document_provider_fields FK-references document_providers, so clear the
  // child first — resetTestDb keeps both tables (test-db.ts's KEEP_TABLES).
  testDb.exec('DELETE FROM document_provider_fields');
  testDb.exec('DELETE FROM document_providers');
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertProvider(row: {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  enabled: 0 | 1;
  sort_order?: number;
}): Promise<void> {
  await insertRow(t, DocumentProviders, {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    icon: row.icon ?? null,
    enabled: row.enabled,
    sort_order: row.sort_order ?? 0,
  });
}

// Plan 3i Task 4 fix wave (should-land 5): AD29 (listAllOrdered) and AD32
// (findById) shipped in Task 1 with no repository-level test at all — this
// shared table (owned by 3h's doc-sync task; these two methods are 3i's
// additive admin-reuse per R6) had zero coverage of its own. One seeded
// world, full-key parity against the exact legacy SQL each method's own
// docstring names.
describe('DocumentProvidersRepository — admin (AD29/AD32) read methods, full-key parity', () => {
  it('DOCPROVREPO-001 (AD29): listAllOrdered matches SELECT * FROM document_providers ORDER BY sort_order, id — unfiltered, including a disabled provider', async () => {
    await insertProvider({
      id: 'paperless',
      name: 'Paperless',
      description: 'Self-hosted document management',
      icon: 'FileText',
      enabled: 0,
      sort_order: 1,
    });
    await insertProvider({ id: 'papra', name: 'Papra', enabled: 1, sort_order: 0 });

    // test-sql-allow: the legacy AD29 statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare('SELECT * FROM document_providers ORDER BY sort_order, id').all();
    const rows = await documentProviders.listAllOrdered();
    expect(rows.map((r) => r.id)).toEqual(['papra', 'paperless']); // includes the disabled one, unlike listEnabledCatalog
    // `enabled` stays the raw stored integer on this entity (no boolean
    // coercion, unlike Addons.enabled), so the row shape is identical to the
    // legacy `SELECT *` — no per-column remap needed.
    expect(rows).toEqual(legacy);
  });

  it('DOCPROVREPO-002: listAllOrdered on an empty table returns an empty array', async () => {
    expect(await documentProviders.listAllOrdered()).toEqual([]);
  });

  it('DOCPROVREPO-003 (AD32): findById matches SELECT * FROM document_providers WHERE id = ?, on both a pre-write read and a post-write re-select', async () => {
    await insertProvider({
      id: 'paperless',
      name: 'Paperless',
      description: 'Self-hosted document management',
      icon: 'FileText',
      enabled: 0,
      sort_order: 3,
    });
    const preWrite = await documentProviders.findById('paperless');
    expect(preWrite).toEqual({
      id: 'paperless',
      name: 'Paperless',
      description: 'Self-hosted document management',
      icon: 'FileText',
      enabled: 0,
      sort_order: 3,
    });

    // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
    testDb.prepare('UPDATE document_providers SET enabled = 1 WHERE id = ?').run('paperless');
    const postWrite = await documentProviders.findById('paperless');
    expect(postWrite?.enabled).toBe(1);
  });

  it('DOCPROVREPO-004: findById on a missing id returns null', async () => {
    expect(await documentProviders.findById('does-not-exist')).toBeNull();
  });
});
