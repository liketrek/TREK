import { Trips } from '../../../src/db/entities/Trips.entity';
import { NulSafeSqlitePlatform } from '../../../src/db/nul-safe-sqlite-platform';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTrip, createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Plan 3c Task 4 review M1 / program rule 22: MikroORM 7 inlines every bound
 * value into the SQL text via `platform.quoteValue`/`escape` (see
 * `NulSafeSqlitePlatform`'s own docstring for the full mechanism). TREK stores
 * no NUL on either engine (`src/db/nul-free.ts`), so the platform drops it from
 * every string it inlines. These hand the platform's own SQL literal to a REAL
 * `better-sqlite3` connection and read the value back.
 */
describe('NulSafeSqlitePlatform', () => {
  const platform = new NulSafeSqlitePlatform();
  const db = new Database(':memory:');
  const withoutNul = (value: string) => value.replaceAll('\u0000', '');

  function roundTrip(value: string): string {
    const literal = platform.escape(value);
    const row = db.prepare(`SELECT ${literal} as v`).get() as { v: string };
    return row.v;
  }

  it('round-trips a string with no NUL unchanged', () => {
    expect(roundTrip('plain string')).toBe('plain string');
  });

  it('drops a NUL wherever it stands, and a string of NULs becomes empty', () => {
    expect(roundTrip('nul\u0000name')).toBe('nulname');
    expect(roundTrip('\u0000leading')).toBe('leading');
    expect(roundTrip('trailing\u0000')).toBe('trailing');
    expect(roundTrip('\u0000\u0000\u0000')).toBe('');
  });

  it('keeps the quote and backslash handling of every other string next to a dropped NUL', () => {
    for (const value of ["o'brien\u0000's café", 'back\\slash\u0000end\\', "a'\u0000b\\\u0000c''\u0000\\\\d"]) {
      expect(roundTrip(value)).toBe(withoutNul(value));
    }
  });

  it('fuzzes every 0x00-0x1F control character: only NUL is dropped and none throw', () => {
    for (let code = 0x00; code <= 0x1f; code++) {
      const ch = String.fromCharCode(code);
      const value = `before${ch}after`;
      expect(() => roundTrip(value)).not.toThrow();
      expect(roundTrip(value)).toBe(code === 0 ? 'beforeafter' : value);
    }
  });

  it('leaves non-string values to the base platform (numbers, null, dates, buffers untouched)', () => {
    expect(platform.escape(42)).toBe('42');
    expect(platform.escape(null)).toBe('null');
    expect(platform.escape(true)).toBe('true');
  });

  it('formatQuery (the real call path AbstractSqlConnection.execute uses: formatQuery -> quoteValue -> escape) stores a value without its NUL and finds it by the same value', () => {
    db.exec('CREATE TABLE probe (name TEXT)');
    const value = 'search\u0000term';
    db.exec(platform.formatQuery('insert into probe (name) values (?)', [value]));
    const row = db.prepare(platform.formatQuery('select name from probe where name = ?', [value])).get() as
      { name: string } | undefined;
    expect(row?.name).toBe('searchterm');
  });

  it('serializes a JSON value with every string in it, keys included, without NUL', () => {
    expect(platform.convertJsonToDatabaseValue({ 'k\u0000': ['a\u0000b', 1, { n: 'x\u0000' }] })).toBe(
      '{"k":["ab",1,{"n":"x"}]}',
    );
  });

  /**
   * Program rule 22's extension (Plan 3c Task 9 close-out, review A H1): a
   * non-finite `number` used to render as an unquoted bareword (`NaN`/
   * `Infinity`/`-Infinity`), which SQLite parses as a column reference and
   * throws `no such column: …` — a 500 where the raw better-sqlite3 bind
   * (`NaN` -> `NULL`, `±Infinity` -> the `REAL` value, verified empirically
   * against the installed driver above the class docstring) never had the
   * problem. These pin the rendered SQL literal AND the real round-trip.
   */
  describe('non-finite numbers (rule 22 extension)', () => {
    it('NaN renders as the literal `NULL`, not the bareword `NaN`', () => {
      expect(platform.escape(NaN)).toBe('NULL');
    });

    it('+Infinity renders as the literal `9e999`, which SQLite parses back to the REAL value Infinity', () => {
      expect(platform.escape(Infinity)).toBe('9e999');
      const row = db.prepare('select typeof(9e999) as t, 9e999 as v').get() as { t: string; v: number };
      expect(row).toEqual({ t: 'real', v: Infinity });
    });

    it('-Infinity renders as the literal `-9e999`, which SQLite parses back to the REAL value -Infinity', () => {
      expect(platform.escape(-Infinity)).toBe('-9e999');
      const row = db.prepare('select typeof(-9e999) as t, -9e999 as v').get() as { t: string; v: number };
      expect(row).toEqual({ t: 'real', v: -Infinity });
    });

    it('a finite number is untouched (only the three non-finite values take the new branch)', () => {
      expect(platform.escape(0)).toBe('0');
      expect(platform.escape(-1)).toBe('-1');
      expect(platform.escape(3.14)).toBe('3.14');
    });

    it("formatQuery renders `NULL` for a bound NaN, matching better-sqlite3's own binding of NaN as NULL", () => {
      db.exec('CREATE TABLE nanprobe (n REAL)');
      db.exec(platform.formatQuery('insert into nanprobe (n) values (?)', [NaN]));
      const viaLiteral = db.prepare('select n from nanprobe').get() as { n: unknown };
      const viaBind = db.prepare('select ? as n').get(NaN) as { n: unknown };
      expect(viaLiteral.n).toBeNull();
      expect(viaBind.n).toBeNull();
    });

    it("formatQuery renders `9e999`/`-9e999` for bound ±Infinity, matching better-sqlite3's own REAL binding", () => {
      db.exec('CREATE TABLE infprobe (n REAL)');
      db.exec(platform.formatQuery('insert into infprobe (n) values (?), (?)', [Infinity, -Infinity]));
      const rows = db.prepare('select n from infprobe order by rowid').all() as { n: number }[];
      expect(rows.map((r) => r.n)).toEqual([Infinity, -Infinity]);
    });
  });

  /**
   * The mechanism above through the REAL ORM call path (`findOne`,
   * `nativeUpdate`, a QB `where`, and an `$in` list), against a real trip
   * row — the shape `PlacesService.verifyTripAccess`/`RealtimeGateway
   * .handleJoin` reach when a non-finite id slips past their own guard.
   * Before this override, every one of these threw `SqliteError: no such
   * column: NaN`; after, each answers a clean miss.
   */
  describe('non-finite numbers through the real ORM call path', () => {
    const orm = createSnapshotTestDb();
    let t: TestOrm;

    beforeAll(async () => {
      t = await createTestOrm(orm);
    });
    beforeEach(() => {
      resetTestDb(orm);
      t.clear();
    });
    afterAll(async () => {
      await t.close();
      orm.close();
    });

    it('em.findOne(Trips, { id: NaN }) misses cleanly, never throws', async () => {
      const { user } = createUser(orm);
      createTrip(orm, user.id);
      await expect(t.em.findOne(Trips, { id: NaN })).resolves.toBeNull();
    });

    it('em.nativeUpdate(Trips, { id: NaN }, …) updates 0 rows, never throws', async () => {
      const { user } = createUser(orm);
      const trip = createTrip(orm, user.id);
      const affected = await t.em.nativeUpdate(Trips, { id: NaN }, { title: 'renamed' });
      expect(affected).toBe(0);
      const untouched = orm.prepare('SELECT title FROM trips WHERE id = ?').get(trip.id) as { title: string };
      expect(untouched.title).not.toBe('renamed');
    });

    it('a QB `where` on a non-finite id misses cleanly, never throws (the exact `findAccessible` shape)', async () => {
      const { user } = createUser(orm);
      createTrip(orm, user.id);
      const row = await t.em
        .getRepository(Trips)
        .qb('t')
        .select(['t.id'])
        .where('t.id = ?', [NaN])
        .execute<{ id: number } | undefined>('get', false);
      expect(row).toBeUndefined();
    });

    it('an `$in` list containing NaN/Infinity still matches the finite members, never throws', async () => {
      const { user } = createUser(orm);
      const trip = createTrip(orm, user.id);
      const rows = await t.em.find(Trips, { id: { $in: [trip.id, NaN, Infinity, -Infinity] } });
      expect(rows.map((r) => r.id)).toEqual([trip.id]);
    });
  });
});
