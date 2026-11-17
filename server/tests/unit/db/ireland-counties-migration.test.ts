/**
 * `Migration20200101046380_ireland_gained_its_counties` (#2922): the Atlas ships
 * Ireland's 26 counties instead of its four provinces. Cached place regions are
 * cleared, hand-marked provinces stay, county names under stale codes take the county
 * code, and a hidden province hides its counties.
 */
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { afterEach, describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101046380_ireland_gained_its_counties';
const LEINSTER = [
  'IE-CW',
  'IE-D',
  'IE-KE',
  'IE-KK',
  'IE-LD',
  'IE-LH',
  'IE-LS',
  'IE-MH',
  'IE-OY',
  'IE-WH',
  'IE-WW',
  'IE-WX',
];

let orm: MikroORM;

async function ormBeforeTarget(): Promise<MikroORM> {
  const o = await createMigrationOrm();
  const names = await pendingNames(o);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(o, names[index - 1]);
  return o;
}

async function seedUsers(): Promise<void> {
  await rawExec(
    orm,
    `INSERT INTO users (id, username, email, password_hash) VALUES (1, 'one', 'one@test', 'x'), (2, 'two', 'two@test', 'x')`,
  );
}

const visited = (userId: number) =>
  rawQuery<{ region_code: string; region_name: string; country_code: string }>(
    orm,
    'SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY region_code',
    [userId],
  );

const hidden = async (userId: number) =>
  (
    await rawQuery<{ region_code: string }>(
      orm,
      'SELECT region_code FROM hidden_regions WHERE user_id = ? ORDER BY region_code',
      [userId],
    )
  ).map((r) => r.region_code);

afterEach(async () => {
  await orm?.close(true);
});

describe('Ireland gained its counties', () => {
  it('IE-COUNTIES-001: clears the cached Irish place regions and leaves other countries cached', async () => {
    orm = await ormBeforeTarget();
    await seedUsers();
    await rawExec(orm, `INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'Isles')`);
    await rawExec(
      orm,
      `INSERT INTO places (id, trip_id, name, lat, lng) VALUES (1, 1, 'Dublin', 53.34, -6.25), (2, 1, 'Belfast', 54.6, -5.93)`,
    );
    await rawExec(
      orm,
      `INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES
         (1, 'IE', 'IE-L', 'Leinster'), (2, 'GB', 'GB-BELFAST', 'Belfast')`,
    );

    await migrateTo(orm, TARGET);

    expect(await rawQuery(orm, 'SELECT place_id, region_code FROM place_regions ORDER BY place_id')).toEqual([
      { place_id: 2, region_code: 'GB-BELFAST' },
    ]);
  });

  it('IE-COUNTIES-002: keeps a marked province and a marked county, and moves a county name onto its code', async () => {
    orm = await ormBeforeTarget();
    await seedUsers();
    await rawExec(
      orm,
      `INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES
         (1, 'IE-L', 'Leinster', 'IE'),
         (1, 'IE-KY', 'Kerry', 'IE'),
         (1, 'IE-COR', 'County Cork', 'IE'),
         (1, 'IE-GALWAY', 'Co. Galway', 'ie'),
         (1, 'FR-IDF', 'Ile-de-France', 'FR')`,
    );

    await migrateTo(orm, TARGET);

    expect(await visited(1)).toEqual([
      { region_code: 'FR-IDF', region_name: 'Ile-de-France', country_code: 'FR' },
      { region_code: 'IE-CO', region_name: 'Cork', country_code: 'IE' },
      { region_code: 'IE-G', region_name: 'Galway', country_code: 'ie' },
      { region_code: 'IE-KY', region_name: 'Kerry', country_code: 'IE' },
      { region_code: 'IE-L', region_name: 'Leinster', country_code: 'IE' },
    ]);
  });

  it('IE-COUNTIES-003: drops a stale row whose county the user already holds, never touching another user', async () => {
    orm = await ormBeforeTarget();
    await seedUsers();
    await rawExec(
      orm,
      `INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES
         (1, 'IE-D', 'Dublin', 'IE'),
         (1, 'IE-DUB', 'County Dublin', 'IE'),
         (1, 'IE-DN', 'dublin', 'IE'),
         (2, 'IE-DUB', 'County Dublin', 'IE')`,
    );

    await migrateTo(orm, TARGET);

    expect(await visited(1)).toEqual([{ region_code: 'IE-D', region_name: 'Dublin', country_code: 'IE' }]);
    expect(await visited(2)).toEqual([{ region_code: 'IE-D', region_name: 'Dublin', country_code: 'IE' }]);
  });

  it('IE-COUNTIES-004: a hidden province hides each of its counties, once, and stays hidden itself', async () => {
    orm = await ormBeforeTarget();
    await seedUsers();
    await rawExec(
      orm,
      `INSERT INTO hidden_regions (user_id, region_code, country_code) VALUES
         (1, 'IE-L', 'IE'),
         (1, 'IE-D', 'IE'),
         (2, 'IE-U', 'IE'),
         (2, 'FR-IDF', 'FR')`,
    );

    await migrateTo(orm, TARGET);

    expect(await hidden(1)).toEqual([...LEINSTER, 'IE-L'].sort());
    expect(await hidden(2)).toEqual(['FR-IDF', 'IE-CN', 'IE-DL', 'IE-MN', 'IE-U']);
  });
});
