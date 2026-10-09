import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101042800_tour_break_additional_duration';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const index = names.indexOf(TARGET);
  expect(index).toBeGreaterThan(0);
  await migrateTo(orm, names[index - 1]);
  return orm;
}

describe('Tour breaks/additional-duration migration', () => {
  it('adds nullable breaks without changing calculated or overridden Tour values', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Ridge walk')");
      await rawExec(
        orm,
        "INSERT INTO tours (place_id, tour_type, duration, planned_duration_minutes) VALUES (100, 'hike', 83, 125)",
      );

      await migrateTo(orm, TARGET);

      expect(
        await rawQuery(
          orm,
          'SELECT duration, planned_duration_minutes, break_additional_minutes FROM tours WHERE place_id = 100',
        ),
      ).toEqual([{ duration: 83, planned_duration_minutes: 125, break_additional_minutes: null }]);
      await rawExec(orm, 'UPDATE tours SET break_additional_minutes = 35 WHERE place_id = 100');
      expect(
        await rawQuery(
          orm,
          'SELECT duration, planned_duration_minutes, break_additional_minutes FROM tours WHERE place_id = 100',
        ),
      ).toEqual([{ duration: 83, planned_duration_minutes: 125, break_additional_minutes: 35 }]);
      await expect(
        rawExec(orm, 'UPDATE tours SET break_additional_minutes = 1441 WHERE place_id = 100'),
      ).rejects.toThrow(/CHECK/);
      await expect(rawExec(orm, 'UPDATE tours SET break_additional_minutes = -1 WHERE place_id = 100')).rejects.toThrow(
        /CHECK/,
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
