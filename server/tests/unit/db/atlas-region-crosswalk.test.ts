/**
 * Unit test for the Atlas region-code reconciliation migration (#1119).
 *
 * After Atlas swapped Natural Earth for geoBoundaries, manually-marked regions
 * (`visited_regions`) held the old Natural Earth ISO-3166-2 codes. The
 * migration reconciles each row against the shipped admin-1 bundle: valid
 * codes are kept, codes whose region NAME still matches are re-coded,
 * renamed-merge cases use a curated crosswalk, and anything else is left
 * untouched. Ported off the legacy runner (Task 0 triage: PORT — the numbered
 * MikroORM migration below has its own class but no dedicated test) onto the
 * real `Migration20200101021500_atlas_dropped_natural_earth_for_geoboundaries`:
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one migration, assert.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, it, expect, afterEach } from 'vitest';

const TARGET = 'Migration20200101021500_atlas_dropped_natural_earth_for_geoboundaries';

let seq = 0;
let orm: MikroORM;

/** A fresh ORM migrated to the step immediately before the reconciliation. */
async function ormBeforeTarget(): Promise<MikroORM> {
  const o = await createMigrationOrm();
  const names = await pendingNames(o);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0); // sanity: the migration must exist in the chain
  await migrateTo(o, names[idx - 1]);
  return o;
}

async function createUser(): Promise<number> {
  const username = `u${++seq}`;
  await rawExec(orm, 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    username,
    `${username}@example.test`,
    'x',
    'user',
  ]);
  const rows = await rawQuery<{ id: number }>(orm, 'SELECT last_insert_rowid() as id');
  return rows[0].id;
}

async function mark(userId: number, code: string, name: string, country = 'NO'): Promise<void> {
  await rawExec(
    orm,
    'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)',
    [userId, code, name, country],
  );
}

async function runReconciliation(): Promise<void> {
  await migrateTo(orm, TARGET);
}

afterEach(async () => {
  await orm?.close(true);
});

describe('Atlas region-code reconciliation migration', () => {
  it('CROSSWALK-001: remaps a renamed-merge county via the curated crosswalk', async () => {
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await mark(userId, 'NO-05', 'Oppland'); // merged into Innlandet, name changed

    await runReconciliation();

    const rows = await rawQuery(orm, 'SELECT region_code, region_name FROM visited_regions WHERE user_id = ?', [
      userId,
    ]);
    expect(rows).toEqual([{ region_code: 'NO-34', region_name: 'Innlandet' }]);
  });

  it('CROSSWALK-002: merges two old counties that map to the same new region (no UNIQUE clash)', async () => {
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await mark(userId, 'NO-04', 'Hedmark'); // → Innlandet
    await mark(userId, 'NO-05', 'Oppland'); // → Innlandet

    await runReconciliation();

    const rows = await rawQuery(orm, 'SELECT region_code FROM visited_regions WHERE user_id = ?', [userId]);
    expect(rows).toEqual([{ region_code: 'NO-34' }]);
  });

  it('CROSSWALK-003: leaves a still-valid code untouched', async () => {
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await mark(userId, 'NO-03', 'Oslo'); // present in the new bundle

    await runReconciliation();

    const rows = await rawQuery(orm, 'SELECT region_code, region_name FROM visited_regions WHERE user_id = ?', [
      userId,
    ]);
    expect(rows).toEqual([{ region_code: 'NO-03', region_name: 'Oslo' }]);
  });

  it('CROSSWALK-004: re-codes a stale code whose region NAME still matches the bundle', async () => {
    // Not in any crosswalk: a bogus code but a name ("Oslo") that the bundle still carries
    // for NO → reconciled to the bundle's code for that name (NO-03) by the name-match path.
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await mark(userId, 'NO-99', 'Oslo');

    await runReconciliation();

    const rows = await rawQuery(orm, 'SELECT region_code, region_name FROM visited_regions WHERE user_id = ?', [
      userId,
    ]);
    expect(rows).toEqual([{ region_code: 'NO-03', region_name: 'Oslo' }]);
  });

  it('CROSSWALK-005: leaves an unresolvable row as-is (no code, no name, no crosswalk match)', async () => {
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await mark(userId, 'ZZ-99', 'Nowhere', 'ZZ');

    await runReconciliation();

    const rows = await rawQuery(orm, 'SELECT region_code, region_name FROM visited_regions WHERE user_id = ?', [
      userId,
    ]);
    expect(rows).toEqual([{ region_code: 'ZZ-99', region_name: 'Nowhere' }]);
  });

  it('CROSSWALK-006: does not touch bucket_list or visited_countries (no region identifier there)', async () => {
    orm = await ormBeforeTarget();
    const userId = await createUser();
    await rawExec(orm, 'INSERT INTO bucket_list (user_id, name, country_code) VALUES (?, ?, ?)', [
      userId,
      'Oppland',
      'NO',
    ]);
    await rawExec(orm, 'INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)', [userId, 'NO']);
    await mark(userId, 'NO-05', 'Oppland'); // ensure the migration actually runs its body

    await runReconciliation();

    const bucket = await rawQuery(orm, 'SELECT name, country_code FROM bucket_list WHERE user_id = ?', [userId]);
    expect(bucket).toEqual([{ name: 'Oppland', country_code: 'NO' }]); // free-text name untouched
    const countries = await rawQuery(orm, 'SELECT country_code FROM visited_countries WHERE user_id = ?', [userId]);
    expect(countries).toEqual([{ country_code: 'NO' }]);
  });
});
