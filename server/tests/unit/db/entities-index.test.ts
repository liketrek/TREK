import { EntitySchema, type EntityRepository } from '@mikro-orm/core';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ALL_ENTITIES } from '../../../src/db/entities';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { TrekRepository } from '../../../src/db/repositories/_shared/trek-repository';

const ENTITIES_DIR = path.join(__dirname, '../../../src/db/entities');
const REPOSITORIES_DIR = path.join(__dirname, '../../../src/db/repositories');

describe('ALL_ENTITIES', () => {
  it('ENT-001: lists exactly one schema per *.entity.ts file', () => {
    const files = fs.readdirSync(ENTITIES_DIR).filter((f) => f.endsWith('.entity.ts')).sort();
    const names = ALL_ENTITIES.map((s) => s.name).sort();
    const expected = files.map((f) => f.replace(/\.entity\.ts$/, '')).sort();
    expect(names).toEqual(expected);
  });

  it('ENT-002: every entry is an EntitySchema with a class', () => {
    for (const schema of ALL_ENTITIES) {
      expect(schema).toBeInstanceOf(EntitySchema);
      expect(typeof schema.meta.class).toBe('function');
    }
  });

  /**
   * Plan 2 Task 3: every one of the 127 entities the migrated schema
   * describes (120 rewritten + the 5 document-sync tables added this task,
   * + push_subscriptions and google_api_usage from legacy steps 245 and 254)
   * is registered, and no two share a class name (a silent duplicate would
   * shadow one of them in `orm.getMetadata()`, exactly the kind of drift
   * `entity-schema-parity.test.ts` can't see — it iterates the metadata map,
   * which de-duplicates by class name).
   */
  it('ENT-003: exactly 127 entities, every class name unique', () => {
    expect(ALL_ENTITIES.length).toBe(127);
    const names = ALL_ENTITIES.map((s) => s.meta.className);
    expect(new Set(names).size).toBe(names.length);
  });

  /**
   * Task 1's review flagged this binding as otherwise unpinned: dropping an
   * entity's `repository: () => XRepository` mutation stayed green in every
   * gate up to here (task-1-review.md, minor 1). `em.getRepository(X)` must
   * return an instance of the exact repository class
   * `src/db/repositories/<Name>.repository.ts` exports, for every entity —
   * the 120 the generator wrote a stub for this task plus the 5 pre-existing,
   * hand-written ones (`Days`, `DayNotes`, `Trips`, `BudgetCategoryOrder`,
   * `VacayUserSettings`) it left untouched.
   */
  describe('ENT-004: em.getRepository(X) is an instance of X.repository.ts', () => {
    let t: TestOrm;
    const testDb = createSnapshotTestDb();

    beforeAll(async () => {
      t = await createTestOrm(testDb);
    });

    afterAll(async () => {
      await t.close();
      testDb.close();
    });

    it('every entity resolves to its own repository class', async () => {
      const failures: string[] = [];
      for (const schema of ALL_ENTITIES) {
        const className = schema.meta.className;
        const repoFile = path.join(REPOSITORIES_DIR, `${className}.repository.ts`);
        if (!fs.existsSync(repoFile)) {
          failures.push(`${className}: no src/db/repositories/${className}.repository.ts file`);
          continue;
        }
        const mod: Record<string, unknown> = await import(/* @vite-ignore */ `../../../src/db/repositories/${className}.repository`);
        const RepoClass = mod[`${className}Repository`];
        if (typeof RepoClass !== 'function') {
          failures.push(`${className}: repository module has no exported ${className}Repository class`);
          continue;
        }
        const repo: EntityRepository<object> = t.em.getRepository(schema.class as new () => object);
        if (!(repo instanceof (RepoClass as abstract new (...args: never[]) => unknown))) {
          failures.push(`${className}: em.getRepository() did not return a ${className}Repository instance`);
        }
        // Task 7 review, H2 carry-list item 1: the `extends EntityRepository`
        // ratchet made self-enforcing — every bound repository must also be
        // a TrekRepository (validateRequestContext + the disableIdentityMap
        // read default), not just an instance of its own named class.
        if (!(repo instanceof TrekRepository)) {
          failures.push(`${className}: em.getRepository() did not return a TrekRepository instance`);
        }
      }
      expect(failures).toEqual([]);
    });

    // Task 7 review, H2: a source-scan companion to the instanceof check
    // above — belt and suspenders against a repository that extends
    // TrekRepository indirectly (or not through this loop's import path).
    it('SCAN-001: exactly one repository file extends EntityRepository directly — the base class itself', () => {
      const files = fs.readdirSync(REPOSITORIES_DIR).filter((f) => f.endsWith('.repository.ts'));
      const hits: string[] = [];
      for (const file of files) {
        const content = fs.readFileSync(path.join(REPOSITORIES_DIR, file), 'utf-8');
        if (/\bextends\s+EntityRepository\b/.test(content)) hits.push(file);
      }
      expect(hits).toEqual([]); // the base class lives in _shared/, not matched by *.repository.ts
    });
  });
});
