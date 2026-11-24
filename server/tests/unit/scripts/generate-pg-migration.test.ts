/**
 * scripts/generate-pg-migration.ts prints the Postgres side of a new
 * migration. Its database half runs against a real server (the author's, or
 * the Postgres lane's); this pins the parts that decide what it builds and
 * how it prints: which migration it is for, which migrations the scratch
 * database runs, and a paste-ready array.
 */
import {
  databaseUrl,
  pickTarget,
  postCutBefore,
  quote,
  renderPostgresArray,
} from '../../../scripts/generate-pg-migration';

import { describe, expect, it } from 'vitest';

const A = 'Migration20200101000100_a';
const B = 'Migration20200101000200_b';
const C = 'Migration20200101000300_c';
const D = 'Migration20200101000400_d';

describe('generate-pg-migration', () => {
  it('GENPGMIG-001: the target is the newest migration unless one is named, and an unknown name is refused', () => {
    expect(pickTarget([C, A, B], undefined)).toBe(C);
    expect(pickTarget([A, B, C], B)).toBe(B);
    expect(() => pickTarget([A, B, C], 'Migration20200101000300')).toThrow(/names no migration/);
    expect(() => pickTarget([], undefined)).toThrow(/no migrations/);
  });

  it('GENPGMIG-002: the scratch database runs the migrations after the cut and before the target, in order', () => {
    expect(postCutBefore([D, A, C, B], A, D)).toEqual([B, C]);
    expect(postCutBefore([A, B, C, D], A, B)).toEqual([]);
    // A target at or before the cut: the baseline alone.
    expect(postCutBefore([A, B, C, D], C, B)).toEqual([]);
  });

  it('GENPGMIG-003: statements print as literals in the quote that needs fewer escapes', () => {
    expect(quote('create index "x" on "t" ("a")')).toBe('\'create index "x" on "t" ("a")\'');
    expect(quote("alter table t add c text default 'a'")).toBe('"alter table t add c text default \'a\'"');
    expect(quote('alter table "t" add "c" text default \'a\'')).toBe(
      '\'alter table "t" add "c" text default \\\'a\\\'\'',
    );
    expect(quote('a\\b\nc')).toBe("'a\\\\b\\nc'");
  });

  it('GENPGMIG-004: the array is ready to paste, and empty when there is nothing to do', () => {
    expect(renderPostgresArray([])).toBe('postgres: [],');
    expect(renderPostgresArray(['create table "t" ("id" bigserial primary key)'])).toBe(
      'postgres: [\n  \'create table "t" ("id" bigserial primary key)\',\n],',
    );
  });

  it('GENPGMIG-005: the scratch database keeps the credentials and options of the server URL', () => {
    expect(databaseUrl('postgres://u:p@h:5432/postgres?sslmode=require', 'scratch')).toBe(
      'postgres://u:p@h:5432/scratch?sslmode=require',
    );
  });
});
