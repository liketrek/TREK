/**
 * RECLAIM-SRC: the full app registers exactly the reference sources the
 * reclaim ledger waits for, and each answers for every category that waits on
 * it. Registration cannot fail a boot (the partial e2e graphs lack most
 * owners), so this is the one place a domain that forgot to register, or a
 * source that stopped claiming a category its columns can point into, shows:
 * on a real install that category would be skipped as `sources_missing`
 * forever, or swept while a domain's rows were never asked.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { StorageReclaimRegistryService } from '../../src/nest/storage/storage-reclaim-registry.service';
import {
  RECLAIM_LEDGER,
  reclaimableCategories,
  requiredReclaimSources,
} from '../../src/nest/storage/storage-reclaim.ledger';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('RECLAIM-SRC: the app registers what the reclaim ledger waits for', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('RECLAIM-SRC-001: the registered source ids are exactly the ones the ledger requires', () => {
    const registry = app.get(StorageReclaimRegistryService);
    expect([...registry.ids()].sort()).toEqual([...requiredReclaimSources()].sort());
  });

  it('RECLAIM-SRC-002: every required source answers for the whole of each category waiting on it', () => {
    const sources = app.get(StorageReclaimRegistryService).sources();
    for (const category of reclaimableCategories()) {
      const rule = RECLAIM_LEDGER[category];
      if (!rule.reclaim) continue;
      for (const id of rule.requiredSources) {
        const answering = sources.filter(
          (source) =>
            source.id === id && source.claims.some((claim) => claim.category === category && claim.prefix === ''),
        );
        expect(answering.length, `${id} answers for ${category}`).toBeGreaterThan(0);
      }
    }
  });
});
