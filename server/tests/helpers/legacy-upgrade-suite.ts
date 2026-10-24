/**
 * The body shared by the `legacy-upgrade-v*.test.ts` integration suites.
 *
 * Each suite mocks `src/db/database` onto one legacy fixture
 * (`legacy-fixture.ts`) and calls this: `buildApp()` then boots on a database
 * the retired positional runner built, exactly as an existing install's first
 * boot on this release would. Lives in a helper because `vi.mock` is per test
 * file and each fixture needs its own module graph; the assertions are the same.
 */
import { buildApp } from '../../src/bootstrap';
import { runSchemaBootstrap } from '../../src/db/orm';
import { readSchemaSnapshot } from '../../src/db/schema-snapshot';
import { removeLegacyFixtureFiles, schemaShape, type LegacyFixture } from './legacy-fixture';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

export interface LegacyUpgradeCase {
  fixture: LegacyFixture;
  /** The fixture's `schema_version`. */
  version: number;
  /** How many booked nights the reseat migration (legacy step 242) moves on this boot. */
  reseated: number;
  /** Where the fixture's booked night (accommodation 1) sits on day 2 after the boot. */
  nightOrderIndex: number | null;
  /** Test-id prefix. */
  id: string;
  /**
   * Schema lines (see `schemaShape`) that differ from a fresh install because the
   * legacy chain itself never converged there — carried, not caused by the
   * upgrade. Empty for an install that ends identical to a fresh one.
   */
  carriedSchemaDiffs?: { onlyUpgraded: string[]; onlyFresh: string[] };
}

const MIGRATIONS = path.join(__dirname, '../../src/db/migrations');
const STEP_MARKER = /Legacy migration step (\d+)\b/;

/** Every migration class name in application order, and the legacy step it carries, if any. */
function migrationFiles(): Array<{ name: string; step: number | null }> {
  return fs
    .readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith('.ts'))
    .sort()
    .map((file) => {
      const match = STEP_MARKER.exec(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
      return { name: file.replace(/\.ts$/, ''), step: match ? Number(match[1]) : null };
    });
}

/** What a fixture's own extra cases can read: the boot's log lines. */
export interface LegacyUpgradeContext {
  logged: string[];
}

/**
 * `extra` declares a fixture's own cases inside the same describe, so they run
 * against the booted app before the fixture file is closed and deleted.
 */
export function describeLegacyUpgrade(
  c: LegacyUpgradeCase,
  legacyDb: Database.Database,
  extra?: (ctx: LegacyUpgradeContext) => void,
): void {
  describe(`an install the legacy runner left at schema_version ${c.version} boots on this release`, () => {
    let app: INestApplication;
    const logged: string[] = [];

    beforeAll(async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        logged.push(args.map(String).join(' '));
      });
      try {
        app = await buildApp();
      } finally {
        logSpy.mockRestore();
      }
    }, 60_000);

    afterAll(async () => {
      await app?.close();
      legacyDb.close();
      removeLegacyFixtureFiles();
    });

    const files = migrationFiles();
    // Steps 1..N only: the baseline (createTables()) is never marked — it runs
    // first, as the legacy runner's own boot did (review N1).
    const baselined = files.filter((file) => file.step !== null && file.step <= c.version);
    const applied = files.filter((file) => !baselined.includes(file));

    it(`${c.id}-001: records steps 1..${c.version} as executed, then applies the baseline and the rest, in order`, () => {
      expect(logged).toContain(
        `[DB] Legacy install at schema_version ${c.version} — baselining ${baselined.length} migration(s)`,
      );
      expect(logged).toContain(`[DB] Applying ${applied.length} pending migration(s)`);
      const rows = legacyDb.prepare('SELECT name FROM mikro_orm_migrations ORDER BY id').all() as Array<{
        name: string;
      }>;
      expect(rows.map((row) => row.name)).toEqual([...baselined, ...applied].map((file) => file.name));
      expect(rows).toHaveLength(files.length);
    });

    it(`${c.id}-002: the user-set assignment times survive (legacy step 26 is never replayed)`, () => {
      const times = legacyDb
        .prepare('SELECT id, assignment_time FROM day_assignments WHERE id IN (1, 2, 3) ORDER BY id')
        .all();
      expect(times).toEqual([
        { id: 1, assignment_time: '09:00' },
        { id: 2, assignment_time: '18:00' },
        { id: 3, assignment_time: '20:00' },
      ]);
    });

    it(`${c.id}-003: the booked-night reseat (legacy step 242) runs only when the install is behind it`, () => {
      const reseatLines = logged.filter((line) => line.startsWith('[DB] Reseated'));
      expect(reseatLines).toEqual(
        c.reseated > 0 ? [`[DB] Reseated ${c.reseated} booked night(s) to their check-in day`] : [],
      );
      const night = legacyDb
        .prepare('SELECT order_index FROM day_assignments WHERE accommodation_id = 1 AND day_id = 2')
        .all() as Array<{ order_index: number }>;
      expect(night.map((row) => row.order_index)).toEqual(c.nightOrderIndex === null ? [] : [c.nightOrderIndex]);
    });

    it(`${c.id}-004: the legacy marker stays, no half-built table is left, and the schema matches a fresh install`, () => {
      expect(legacyDb.prepare('SELECT version FROM schema_version').all()).toEqual([{ version: c.version }]);
      const leftovers = legacyDb
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%\\_new' ESCAPE '\\'`)
        .all();
      expect(leftovers).toEqual([]);

      const snapshot = readSchemaSnapshot();
      if (!snapshot) throw new Error('No schema snapshot: run under vitest (tests/global-setup.ts writes it).');
      const fresh = new Database(snapshot);
      try {
        const upgraded = schemaShape(legacyDb);
        const freshShape = schemaShape(fresh);
        expect({
          onlyUpgraded: upgraded.filter((line) => !freshShape.includes(line)),
          onlyFresh: freshShape.filter((line) => !upgraded.includes(line)),
        }).toEqual(c.carriedSchemaDiffs ?? { onlyUpgraded: [], onlyFresh: [] });
      } finally {
        fresh.close();
      }
    });

    it(`${c.id}-005: a second bootstrap (a restart, or a restore of this file) baselines nothing and applies nothing`, async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runSchemaBootstrap(app.get(MikroORM));
        const lines = logSpy.mock.calls.map((args) => args.map(String).join(' '));
        expect(
          lines.filter((line) => line.startsWith('[DB] Legacy install') || line.startsWith('[DB] Applying')),
        ).toEqual([]);
      } finally {
        logSpy.mockRestore();
      }
      const count = legacyDb.prepare('SELECT COUNT(*) AS c FROM mikro_orm_migrations').get() as { c: number };
      expect(count.c).toBe(files.length);
    });

    extra?.({ logged });
  });
}
