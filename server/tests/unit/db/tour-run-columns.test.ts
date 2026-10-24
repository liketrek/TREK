/**
 * RUN-01: `Migration20200101045510_a_tour_can_be_a_run` switches the run type
 * on and gives a tour its run profile and pace. The profile column holds a
 * CHECK list the entity carries as its enum, the pace a range the contract
 * holds too: a value one side takes and the other refuses would be a run the
 * planner can save and the database cannot store.
 */
import { ToursRunProfile } from '../../../src/db/entities/Tours.entity';
import { createMigrationOrm, migrateTo, pendingNames, rawExec, rawQuery } from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';
import { MAX_RUN_PACE_SECONDS_PER_KM, MIN_RUN_PACE_SECONDS_PER_KM, RUN_PROFILES } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const TARGET = 'Migration20200101045510_a_tour_can_be_a_run';

async function ormBeforeTarget(): Promise<MikroORM> {
  const orm = await createMigrationOrm();
  const names = await pendingNames(orm);
  const idx = names.indexOf(TARGET);
  expect(idx).toBeGreaterThan(0);
  await migrateTo(orm, names[idx - 1]);
  return orm;
}

describe('run columns match the contract', () => {
  it('TOURRUNMIG-001: stores exactly the profiles the contract knows, trail running (RUN-02) included', () => {
    expect([...Object.values(ToursRunProfile)].sort()).toEqual([...RUN_PROFILES].sort());
  });

  it('TOURRUNMIG-002: switches the run type on, leaves every tour as it was and refuses a pace out of bounds', async () => {
    const orm = await ormBeforeTarget();
    try {
      await rawExec(
        orm,
        "INSERT INTO users (id, username, email, password_hash) VALUES (1, 'owner', 'owner@test', 'x')",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) VALUES (10, 1, 'Alps')");
      await rawExec(
        orm,
        "INSERT INTO places (id, trip_id, name) VALUES (100, 10, 'Ridge walk'), (101, 10, 'River loop')",
      );
      await rawExec(orm, "INSERT INTO tours (place_id, tour_type, distance) VALUES (100, 'hike', 12.5)");

      await migrateTo(orm, TARGET);

      expect(await rawQuery(orm, "SELECT enabled FROM tour_types WHERE key = 'run'")).toEqual([{ enabled: 1 }]);
      expect(await rawQuery(orm, 'SELECT run_profile, run_pace_seconds_per_km FROM tours')).toEqual([
        { run_profile: null, run_pace_seconds_per_km: null },
      ]);
      await rawExec(
        orm,
        "INSERT INTO tours (place_id, tour_type, run_profile, run_pace_seconds_per_km) VALUES (101, 'run', 'running', 360)",
      );
      const pace = (value: number) =>
        rawExec(orm, 'UPDATE tours SET run_pace_seconds_per_km = ? WHERE place_id = 101', [value]);
      await pace(MIN_RUN_PACE_SECONDS_PER_KM);
      await pace(MAX_RUN_PACE_SECONDS_PER_KM);
      await expect(pace(MIN_RUN_PACE_SECONDS_PER_KM - 1)).rejects.toThrow(/CHECK/);
      await expect(pace(MAX_RUN_PACE_SECONDS_PER_KM + 1)).rejects.toThrow(/CHECK/);
      await expect(rawExec(orm, "UPDATE tours SET run_profile = 'sprint' WHERE place_id = 101")).rejects.toThrow(
        /CHECK/,
      );
    } finally {
      await orm.close(true);
    }
  }, 30000);
});
