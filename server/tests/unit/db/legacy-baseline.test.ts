/**
 * The legacy step → migration map and the baseline that uses it
 * (`src/db/legacy-baseline.ts`, Plan 4 final review B1).
 *
 * The map is derived from the migrations' own `Legacy migration step N`
 * docstrings; LEGACYMAP-001/002 pin that derivation against the files on disk
 * so a new migration that mis-numbers, duplicates or drops a step fails here
 * rather than on somebody's upgrade. The rest pin the fail-closed paths.
 * The end-to-end upgrade of real legacy databases is
 * `tests/integration/legacy-upgrade-v*.test.ts`.
 */
import { buildLegacyStepMap, migrateToHead, planLegacyBaseline } from '../../../src/db/legacy-baseline';
import {
  createMigrationOrm,
  migrateTo,
  migratorOf,
  pendingNames,
  rawExec,
  rawQuery,
} from '../../helpers/migration-step';
import type { MigrationInfo } from '@mikro-orm/core';
import type { MikroORM } from '@mikro-orm/sqlite';

import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const MIGRATIONS = path.join(__dirname, '../../../src/db/migrations');
const BASELINE = 'Migration20200101000000_baseline_schema';
/** The migrations that carry no legacy step: the baseline, and the post-legacy ones every upgrade runs. */
const UNNUMBERED = [
  BASELINE,
  'Migration20200101040200_trek_photo_cache_meta_cache_key_not_null',
  'Migration20200101042000_tours',
  'Migration20200101042100_a_trip_reminder_remembers_it_was_sent',
  'Migration20200101042200_an_index_on_every_foreign_key',
  'Migration20200101042300_every_tour_type_the_contract_names',
  'Migration20200101042400_one_account_per_email_whatever_its_case',
  'Migration20200101042500_a_cron_tick_runs_in_one_process',
  'Migration20200101042600_a_session_row_per_sign_in',
  'Migration20200101042700_tour_planned_total_duration',
  'Migration20200101042800_tour_break_additional_duration',
];
// The last step the positional runner ever had; planLegacyBaseline refuses a
// schema_version past it.
const LEGACY_FINAL_STEP = 258;

/** Synthetic migrations whose "source" is the text given, for the fail-closed cases. */
function fake(sources: Array<[string, string]>): { list: MigrationInfo[]; read: (p: string) => string } {
  const byPath = new Map(sources.map(([name, text]) => [`/fake/${name}.ts`, text]));
  return {
    list: sources.map(([name]) => ({ name, path: `/fake/${name}.ts` })),
    read: (p) => byPath.get(p) ?? '',
  };
}

describe('the legacy step map', () => {
  it('LEGACYMAP-001: every numbered migration maps to exactly one step, steps 1..258 are all present, in order, behind the baseline', async () => {
    const orm = await createMigrationOrm();
    try {
      const all = await migratorOf(orm).getPending();
      const map = buildLegacyStepMap(all);
      expect(map.finalStep).toBe(LEGACY_FINAL_STEP);
      expect([...map.steps.keys()]).toEqual(Array.from({ length: LEGACY_FINAL_STEP }, (_, i) => i + 1));
      expect(new Set(map.steps.values()).size).toBe(LEGACY_FINAL_STEP);
      expect(map.baseline).toEqual([BASELINE]);

      // The unnumbered ones: the baseline, and the post-legacy migrations that
      // must always run on an upgraded install.
      const numbered = new Set(map.steps.values());
      expect(all.map((m) => m.name).filter((name) => !numbered.has(name))).toEqual(UNNUMBERED);
      expect(map.steps.get(242)).toBe('Migration20200101040300_a_booked_night_finally_took_the_seat_a_new');
      expect(map.steps.get(243)).toBe('Migration20200101040400_immich_learns_the_switch_synology_airtrail_and');
      expect(map.steps.get(258)).toBe('Migration20200101041900_a_journey_that_puts_an_entry_on');
      expect(map.steps.get(26)).toBe('Migration20200101002600_day_assignments_add_assignment_time');
    } finally {
      await orm.close(true);
    }
  });

  it('LEGACYMAP-002: the map agrees with an independent read of the files on disk', async () => {
    const onDisk = new Map<string, number>();
    for (const file of fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.ts'))) {
      const steps = [
        ...fs.readFileSync(path.join(MIGRATIONS, file), 'utf8').matchAll(/Legacy migration step (\d+)\b/g),
      ];
      expect(steps.length, file).toBeLessThanOrEqual(1);
      if (steps.length === 1) onDisk.set(file.replace(/\.ts$/, ''), Number(steps[0]![1]));
    }
    const orm = await createMigrationOrm();
    try {
      const map = buildLegacyStepMap(await migratorOf(orm).getPending());
      expect(new Map([...map.steps].map(([step, name]) => [name, step]))).toEqual(onDisk);
    } finally {
      await orm.close(true);
    }
  });

  it('LEGACYMAP-003: refuses a step claimed twice', () => {
    const { list, read } = fake([
      ['M0_base', ''],
      ['M1', 'Legacy migration step 1'],
      ['M2', 'Legacy migration step 1'],
    ]);
    expect(() => buildLegacyStepMap(list, read)).toThrow(/legacy step 1 is claimed by both M1 and M2/);
  });

  it('LEGACYMAP-004: refuses a gap in the steps', () => {
    const { list, read } = fake([
      ['M0_base', ''],
      ['M1', 'Legacy migration step 1'],
      ['M3', 'Legacy migration step 3'],
    ]);
    expect(() => buildLegacyStepMap(list, read)).toThrow(/no migration carries legacy step 2/);
  });

  it('LEGACYMAP-005: refuses a migration naming two steps, and steps applied out of order', () => {
    const two = fake([
      ['M0_base', ''],
      ['M1', 'Legacy migration step 1, formerly Legacy migration step 2'],
    ]);
    expect(() => buildLegacyStepMap(two.list, two.read)).toThrow(/M1 names more than one legacy step \(1, 2\)/);

    const swapped = fake([
      ['M0_base', ''],
      ['M1', 'Legacy migration step 2'],
      ['M2', 'Legacy migration step 1'],
    ]);
    expect(() => buildLegacyStepMap(swapped.list, swapped.read)).toThrow(
      /M2 \(legacy step 1\) sorts after legacy step 2/,
    );
  });

  it('LEGACYMAP-006: refuses no baseline, no numbered step at all, and a migration without a source file', () => {
    const noBase = fake([['M1', 'Legacy migration step 1']]);
    expect(() => buildLegacyStepMap(noBase.list, noBase.read)).toThrow(
      /no baseline migration sorts ahead of legacy step 1/,
    );

    const none = fake([['M0_base', '']]);
    expect(() => buildLegacyStepMap(none.list, none.read)).toThrow(/no migration names a legacy step/);

    expect(() => buildLegacyStepMap([{ name: 'M0_classOnly' }])).toThrow(/M0_classOnly has no source file/);
  });
});

describe('planLegacyBaseline / migrateToHead', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await createMigrationOrm();
  });

  afterEach(async () => {
    await orm.close(true);
  });

  const baseline = () => planLegacyBaseline(orm.em.getConnection(), migratorOf(orm));
  const migrate = () => migrateToHead(orm.em.getConnection(), migratorOf(orm));
  const recorded = async () =>
    (await rawQuery<{ name: string }>(orm, 'SELECT name FROM mikro_orm_migrations ORDER BY id')).map((r) => r.name);

  it('LEGACYBASE-001: a fresh database (no schema_version) is left alone', async () => {
    await expect(baseline()).resolves.toEqual([]);
    expect(await recorded()).toEqual([]);
  });

  it('LEGACYBASE-002: a database the migrator already knows is left alone, even though it carries schema_version', async () => {
    await migrateTo(orm, 'Migration20200101020900_create_schema_version_new');
    await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (241)');
    const before = await recorded();
    await expect(baseline()).resolves.toEqual([]);
    expect(await recorded()).toEqual(before);
  });

  it('LEGACYBASE-003: a legacy database at step N plans steps 1..N in application order — never the baseline — and writes nothing', async () => {
    const all = await pendingNames(orm);
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (10)');
    // Review N1: the legacy runner ran createTables() before its steps on every
    // boot, and ~30 tables exist only in the baseline, so it must run, not be marked.
    await expect(baseline()).resolves.toEqual(all.slice(1, 11));
    expect(all[0]).toBe(BASELINE);
    expect(await recorded()).toEqual([]);
  });

  it('LEGACYBASE-004: refuses a schema_version newer than the last legacy step, and records nothing', async () => {
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, `INSERT INTO schema_version (version) VALUES (${LEGACY_FINAL_STEP + 1})`);
    await expect(baseline()).rejects.toThrow(
      `[DB] Refusing to boot: schema_version 259 is newer than the last legacy step this release knows (258)`,
    );
    expect(await recorded()).toEqual([]);
  });

  it.each([
    ['0', '(0)', /schema_version 0 is not a legacy step/],
    ['a text value', "('205')", /schema_version 205 is not a legacy step/],
    ['a fraction', '(20.5)', /schema_version 20.5 is not a legacy step/],
    ['two rows', '(205), (206)', /schema_version holds 2 rows/],
    ['no row', null, /schema_version holds 0 rows/],
  ])(
    'LEGACYBASE-005: refuses an unmappable schema_version (%s), and records nothing',
    async (_label, values, error) => {
      await rawExec(orm, 'CREATE TABLE schema_version (version)');
      if (values) await rawExec(orm, `INSERT INTO schema_version (version) VALUES ${values}`);
      await expect(baseline()).rejects.toThrow(error);
      expect(await recorded()).toEqual([]);
    },
  );

  it('LEGACYBASE-006: the baseline rows commit with the run — a failed first run leaves nothing recorded, so the next boot baselines again', async () => {
    const all = await pendingNames(orm);
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (241)');
    // An obstacle for Migration20200101040200's rebuild, which runs after the baseline.
    await rawExec(orm, 'CREATE TABLE trek_photo_cache_meta_new (x INTEGER)');
    await expect(migrate()).rejects.toThrow();
    expect(await recorded()).toEqual([]);

    // Nothing half-done: the next boot still sees a legacy install and plans the same steps.
    await expect(baseline()).resolves.toEqual(all.filter((name) => name !== BASELINE).slice(0, 241));
    expect(await recorded()).toEqual([]);
  });

  it('LEGACYBASE-007: an install the positional runner left past step 242 is baselined to its step, never refused or replayed', async () => {
    const all = await pendingNames(orm);
    const numbered = all.filter((name) => !UNNUMBERED.includes(name));
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (250)');
    const planned = await baseline();
    expect(planned).toEqual(numbered.slice(0, 250));
    expect(planned.at(-1)).toBe('Migration20200101041100_half_company_holidays_0_5_covers_the');
    expect(await recorded()).toEqual([]);
  });

  it('LEGACYBASE-008: refuses a database a newer TREK migrated, before applying anything', async () => {
    await migrate();
    await rawExec(orm, "INSERT INTO mikro_orm_migrations (name, executed_at) VALUES ('Migration20990101000000_from_a_newer_release', CURRENT_TIMESTAMP)");
    const before = await recorded();
    await expect(migrate()).rejects.toThrow(/Refusing to boot: the database was migrated by a newer TREK \(1 unknown migration\(s\), latest Migration20990101000000_from_a_newer_release\)/);
    expect(await recorded()).toEqual(before);
  });

  it('LEGACYBASE-009: a database at head of this build boots again without complaint', async () => {
    await migrate();
    await expect(migrate()).resolves.toBeUndefined();
  });

  it.each([
    [246, 242],
    [243, 242],
    [217, 215],
  ])('LEGACYBASE-010: a pre-ORM Tours branch database at schema_version %i is baselined to upstream step %i', async (version, upstream) => {
    const all = await pendingNames(orm);
    const numbered = all.filter((name) => !UNNUMBERED.includes(name));
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, `INSERT INTO schema_version (version) VALUES (${version})`);
    await rawExec(orm, 'CREATE TABLE tour_types (key TEXT PRIMARY KEY)');
    expect(await baseline()).toEqual(numbered.slice(0, upstream));
  });

  it('LEGACYBASE-011: the same schema_version without the Tours tables is an upstream database and keeps its step', async () => {
    const all = await pendingNames(orm);
    const numbered = all.filter((name) => !UNNUMBERED.includes(name));
    await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (244)');
    expect(await baseline()).toEqual(numbered.slice(0, 244));
  });
});
