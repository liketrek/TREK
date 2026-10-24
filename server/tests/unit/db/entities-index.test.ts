import { ALL_ENTITIES } from '../../../src/db/entities';
import { TrekRepository } from '../../../src/db/repositories/_shared/trek-repository';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { EntitySchema, type EntityRepository } from '@mikro-orm/core';

import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ENTITIES_DIR = path.join(__dirname, '../../../src/db/entities');
const REPOSITORIES_DIR = path.join(__dirname, '../../../src/db/repositories');

describe('ALL_ENTITIES', () => {
  it('ENT-001: lists exactly one schema per *.entity.ts file', () => {
    const files = fs
      .readdirSync(ENTITIES_DIR)
      .filter((f) => f.endsWith('.entity.ts'))
      .sort();
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
   * Plan 2 Task 3: every one of the 135 entities the migrated schema
   * describes (120 rewritten + the 5 document-sync tables added this task,
   * + push_subscriptions and google_api_usage from legacy steps 245 and 254,
   * + tour_types, tours and tour_waypoints from the Tours migration,
   * + scheduler_leases from the cron lease migration
   * + user_sessions, the session rows behind revocable session tokens
   * + ferrata_tiles, the stored via ferrata grid cells
   * + paddle_regions, paddle_features and tour_obstacle_reviews, the paddle obstacle data and decisions
   * + trip_journal_links and trip_journal_link_members, the journal a trip shows and who it is open to
   * + paddle_water_graphs and paddle_region_requests, a region's water network and the regions that wait for an admin
   * + tour_station_visits, how far a city walk got on one of its days
   * + tour_change_steps, the changes to a tour saved from a confirmed proposal
   * + tour_activities, the recorded tracks assigned to a tour
   * + tour_activity_exclusions, the tours a user left out of their own activity sums
   * + collection_tours, the whole tours a collection keeps
   * + tour_packing_links, the packing list or category a tour points at
   * + tour_source_hints, what the wanderer watch found about a snapshot's source
   * + journey_recorded_days, the recorded route a journey keeps per day
   * + journey_entry_stays, the recorded stays a journey entry was taken over from
   * + journey_recording_prep, how far preparing a journey's recorded days got for each person
   * + tour_drafts, the Tours planner's unsaved draft per user and trip
   * + ai_connections, the AI assistant's connections to a language model
   * + assistant_threads, assistant_messages, assistant_tool_calls and assistant_usage,
   *   the trip assistant's conversations, the changes it proposed and what it used
   * + trek_photo_signals, what a photo's pixels say, for picking photos for a book
   * + journey_book_revisions, the books a whole-book design replaced, for its undo
   * + trip_member_removals, who another member took off a trip, so its invite link refuses them)
   * is registered, and no two share a class name (a silent duplicate would
   * shadow one of them in `orm.getMetadata()`, exactly the kind of drift
   * `entity-schema-parity.test.ts` can't see — it iterates the metadata map,
   * which de-duplicates by class name).
   */
  it('ENT-003: exactly 161 entities, every class name unique', () => {
    expect(ALL_ENTITIES.length).toBe(161);
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
        const mod: Record<string, unknown> = await import(
          /* @vite-ignore */ `../../../src/db/repositories/${className}.repository`
        );
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
