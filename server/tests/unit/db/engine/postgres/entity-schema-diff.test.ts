/**
 * Which of the comparator's statements change nothing
 * (src/db/engine/postgres/entity-schema-diff.ts), the definition PARITY-PG
 * and `npm run gen:pg-migration` share. The live database half runs in the
 * Postgres lane; this pins the sorting and the rolled-back spelling check.
 */
import {
  classifySchemaDiff,
  missingPortedTriggers,
  remainingStatements,
  spellingChangesNothing,
  splitSchemaDiff,
  type EntitySchemaDiff,
  type LiveSchemaFacts,
} from '../../../../../src/db/engine/postgres/entity-schema-diff';
import type { Transaction } from '@mikro-orm/core';
import type { AbstractSqlConnection } from '@mikro-orm/sql';

import { describe, expect, it, vi } from 'vitest';

const live: LiveSchemaFacts = {
  primaryKeys: new Set(['trips.id']),
  triggers: new Set(['places.trg_place_regions_follow_place']),
};
const PORTED = ['trg_place_regions_follow_place', 'trg_release_stop_on_stay_delete'];

describe('entity schema diff', () => {
  it('SCHEMA-DIFF-001: splits the comparator output into statements without semicolons or blanks', () => {
    expect(splitSchemaDiff('alter table "a" add column "b" text null;\n\ncreate index "x" on "a" ("b");\n')).toEqual([
      'alter table "a" add column "b" text null',
      'create index "x" on "a" ("b")',
    ]);
  });

  it('SCHEMA-DIFF-002: a drop not null counts as nothing only on a live primary key', () => {
    const diff = classifySchemaDiff(
      ['alter table "trips" alter column "id" drop not null', 'alter table "trips" alter column "title" drop not null'],
      live,
      PORTED,
    );
    expect(diff.keyNotNull).toEqual(['alter table "trips" alter column "id" drop not null']);
    expect(diff.changes).toEqual(['alter table "trips" alter column "title" drop not null']);
  });

  it('SCHEMA-DIFF-003: dropping a trigger counts as nothing only for a ported one that is in the database', () => {
    const diff = classifySchemaDiff(
      [
        'drop trigger if exists "trg_place_regions_follow_place" on "places"',
        'drop function if exists "places_trg_place_regions_follow_place_fn"()',
        // Ported, but not in the database on that table.
        'drop trigger if exists "trg_release_stop_on_stay_delete" on "day_accommodations"',
        'drop trigger if exists "trg_unknown" on "places"',
        'drop function if exists "places_trg_unknown_fn"()',
      ],
      live,
      PORTED,
    );
    expect(diff.portedTriggers).toHaveLength(2);
    expect(diff.changes).toEqual([
      'drop trigger if exists "trg_release_stop_on_stay_delete" on "day_accommodations"',
      'drop trigger if exists "trg_unknown" on "places"',
      'drop function if exists "places_trg_unknown_fn"()',
    ]);
    expect(missingPortedTriggers(live, PORTED)).toEqual(['trg_release_stop_on_stay_delete']);
  });

  it('SCHEMA-DIFF-004: defaults and checks wait for the spelling proof, everything else is a change', () => {
    const diff = classifySchemaDiff(
      [
        'alter table "trips" alter column "created_at" set default to_char(now())',
        'alter table "trips" drop constraint "trips_status_check"',
        'alter table "trips" add constraint "trips_status_check" check ("status" in (\'a\'))',
        'alter table "trips" add column "note" text null',
      ],
      live,
      PORTED,
    );
    expect(diff.spelling).toHaveLength(3);
    expect(diff.changes).toEqual(['alter table "trips" add column "note" text null']);
  });

  it('SCHEMA-DIFF-005: the spelling statements run in order inside a transaction that is always rolled back', async () => {
    const fingerprints = ['default a = 1', 'default a = 1'];
    const executed: string[] = [];
    const trx = {} as Transaction;
    const connection = {
      execute: vi.fn(async (sql: string, _params?: unknown[], _method?: string, ctx?: Transaction) => {
        if (sql.includes('string_agg')) return [{ fingerprint: fingerprints.shift() }];
        expect(ctx).toBe(trx);
        executed.push(sql);
        return [];
      }),
      transactional: vi.fn(async (cb: (t: Transaction) => Promise<unknown>) => cb(trx)),
    } as unknown as AbstractSqlConnection;
    const result = await spellingChangesNothing(connection, ['first', 'second']);
    expect(executed).toEqual(['first', 'second']);
    expect(result).toEqual({ before: 'default a = 1', after: 'default a = 1' });
  });

  it('SCHEMA-DIFF-006: a statement that fails inside the proof is not swallowed', async () => {
    const connection = {
      execute: vi.fn(async (sql: string) => {
        if (sql.includes('string_agg')) return [{ fingerprint: 'x' }];
        throw new Error('syntax error');
      }),
      transactional: vi.fn(async (cb: (t: Transaction) => Promise<unknown>) => cb({} as Transaction)),
    } as unknown as AbstractSqlConnection;
    await expect(spellingChangesNothing(connection, ['broken'])).rejects.toThrow('syntax error');
  });

  it('SCHEMA-DIFF-007: what a migration still owes includes the spelling statements only when they change something', () => {
    const base: EntitySchemaDiff = {
      changes: ['alter table "a" add column "b" text null'],
      spelling: ['alter table "a" alter column "c" set default 1'],
      keyNotNull: [],
      portedTriggers: [],
      spellingHolds: true,
      fingerprint: { before: '', after: '' },
      missingTriggers: [],
    };
    expect(remainingStatements(base)).toEqual(base.changes);
    expect(remainingStatements({ ...base, spellingHolds: false })).toEqual([...base.changes, ...base.spelling]);
  });
});
