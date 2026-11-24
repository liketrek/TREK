/**
 * The Postgres driver reads `bigint` as a number, on its own pool only
 * (src/db/engine/postgres/postgres-driver.ts). Nothing here connects.
 */
import { parseInt8, parseNumeric, TrekPostgreSqlDriver } from '../../../../../src/db/engine/postgres/postgres-driver';
import { Configuration, defineEntity, p } from '@mikro-orm/core';
import { MikroORM, type PostgreSqlConnection } from '@mikro-orm/postgresql';

import { describe, expect, it, vi } from 'vitest';

type Parsers = { getTypeParser(oid: number): (text: string) => unknown };

describe('postgres driver', () => {
  it('PGDRIVER-001: a bigint is a number up to 2^53 and refused past it, never rounded', () => {
    expect(parseInt8('0')).toBe(0);
    expect(parseInt8('1793636850006')).toBe(1793636850006);
    expect(parseInt8('-42')).toBe(-42);
    expect(() => parseInt8('9007199254740993')).toThrow(/beyond what TREK reads exactly/);
  });

  it('PGDRIVER-003: a numeric (sum of a bigint, avg) is a number like SQLite answers, an integral one past 2^53 refused', () => {
    expect(parseNumeric('4200')).toBe(4200);
    expect(parseNumeric('2.5000000000000000')).toBe(2.5);
    expect(parseNumeric('-7')).toBe(-7);
    expect(() => parseNumeric('9007199254740993')).toThrow(/beyond what TREK reads exactly/);
    expect(() => parseNumeric('NaN')).toThrow(/not a finite number/);
    expect(() => parseNumeric('Infinity')).toThrow(/not a finite number/);
  });

  it("PGDRIVER-002: the pool parses int8 as a number and keeps MikroORM's text dates", () => {
    const config = new Configuration(
      {
        driver: TrekPostgreSqlDriver,
        clientUrl: 'postgresql://u@localhost/trek',
        entities: [],
        discovery: { warnWhenNoEntities: false },
      },
      false,
    );
    const driver = new TrekPostgreSqlDriver(config);
    const options = (driver.getConnection() as PostgreSqlConnection).mapOptions({});
    const types = options.types as unknown as Parsers;
    expect(types.getTypeParser(20)('12')).toBe(12);
    expect(types.getTypeParser(1700)('12.5')).toBe(12.5);
    expect(types.getTypeParser(1114)('2026-01-01 00:00:00')).toBe('2026-01-01 00:00:00');
  });

  it("PGDRIVER-004: find orders the entity's own key the way its index holds it, every other column as SQLite does", async () => {
    const Probe = defineEntity({
      name: 'Probe',
      tableName: 'probe',
      properties: { id: p.integer().primary(), plugin_id: p.text(), ts: p.text().nullable() },
    });
    const orm = new MikroORM({
      driver: TrekPostgreSqlDriver,
      clientUrl: 'postgresql://u@localhost/trek',
      entities: [Probe],
    });
    const execute = vi.spyOn(orm.em.getConnection(), 'execute').mockResolvedValue([]);
    const em = orm.em.fork();
    await em.findOne(Probe, { plugin_id: 'x' }, { orderBy: { id: 'desc' } });
    await em.find(Probe, {}, { orderBy: [{ ts: 'desc' }, { id: 1 }], limit: 5 });
    await em.find(Probe, {}, { orderBy: { id: 'desc nulls last' } });
    const orders = execute.mock.calls.map(([query]) => String(query).replace(/^.* order by /, ''));
    expect(orders).toEqual([
      '"p0"."id" desc nulls first limit ?',
      '"p0"."ts" desc nulls last, "p0"."id" asc nulls last limit ?',
      '"p0"."id" desc nulls last',
    ]);
  });
});
