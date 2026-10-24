import { knownMigrationNames, unknownMigrations } from '../../../src/db/known-migrations';
import { refuseNewerDatabase } from '../../../src/db/legacy-baseline';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('known migrations', () => {
  it('KNOWNMIG-001: lists every migration this build ships, by its recorded name', () => {
    const known = knownMigrationNames();
    expect(known.has('Migration20200101000000_baseline_schema')).toBe(true);
    expect(known.has('Migration20200101042000_tours')).toBe(true);
    expect(known.has('Migration20200101042900_tour_planned_total_duration')).toBe(true);
    expect(known.has('Migration20200101043000_tour_break_additional_duration')).toBe(true);
    expect(known.has('Migration20200101043100_an_imported_tour_has_no_hiking_difficulty')).toBe(true);
    expect(known.has('Migration20200101043200_via_ferrata_tiles_outlive_a_restart')).toBe(true);
    expect(known.has('Migration20200101043300_a_tour_leg_can_follow_a_via_ferrata')).toBe(true);
    expect(known.has('Migration20200101043400_wanderer_connection_and_tour_sources')).toBe(true);
    expect(known.has('Migration20200101043500_wanderer_difficulty_on_the_sac_scale')).toBe(true);
    expect(known.has('Migration20200101043600_a_tour_remembers_the_import_it_was_derived_from')).toBe(true);
    expect(known.has('Migration20200101043700_an_import_planned_over_keeps_its_recorded_track')).toBe(true);
    expect(known.has('Migration20200101043800_a_tour_records_where_it_came_from')).toBe(true);
    expect(known.has('Migration20200101043900_a_tour_can_be_paddled')).toBe(true);
    expect(known.size).toBe(fs.readdirSync(path.join(__dirname, '../../../src/db/migrations')).length);
  });

  it('KNOWNMIG-002: reads compiled files too, and ignores maps, declarations and strangers', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-known-migrations-'));
    try {
      for (const file of [
        'Migration20200101000000_a.js',
        'Migration20200101000000_a.js.map',
        'Migration20200101000100_b.d.ts',
        'README.md',
      ]) {
        fs.writeFileSync(path.join(dir, file), '');
      }
      expect([...knownMigrationNames(dir)]).toEqual(['Migration20200101000000_a']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('KNOWNMIG-003: names only what this build does not ship, and refuses on it', () => {
    const known = new Set(['Migration1_a', 'Migration2_b']);
    expect(unknownMigrations(['Migration1_a', 'Migration3_c'], known)).toEqual(['Migration3_c']);
    expect(() => refuseNewerDatabase(['Migration1_a', 'Migration2_b'], known)).not.toThrow();
    expect(() => refuseNewerDatabase(['Migration1_a', 'Migration3_c'], known)).toThrow(/newer TREK/);
    expect(() => refuseNewerDatabase(['Migration1_a', 'Migration3_c'], known)).toThrow(/or by a development build/);
  });
});
