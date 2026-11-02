/**
 * PGSEM-001..002 — what SQLite gives for free and Postgres only through the
 * engine (plan §5.4), against the real app on the lane's Postgres database:
 * writes in a UnitOfWork run one at a time, as on SQLite's single writer, so
 * a read-then-insert never races; counts come back as numbers; and a search
 * ignores case as SQLite's LIKE does.
 */
import { buildApp } from '../../src/bootstrap';
import { ilike } from '../../src/db/dialect/sql-functions';
import { withRequestContext } from '../../src/nest/database/request-context';
import { UnitOfWork } from '../../src/nest/database/unit-of-work';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

/** Rows of `sql` read through the current (transactional) EntityManager. */
function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return orm.em.getConnection().execute<T[]>(sql, params, 'all', orm.em.getTransactionContext());
}

describe('Postgres keeps SQLite semantics', () => {
  it('PGSEM-001: concurrent read-then-insert units of work never see the same count, and counts are numbers', async () => {
    const uow = app.get(UnitOfWork, { strict: false });
    const claim = () =>
      withRequestContext(orm, () =>
        uow.transactional(async () => {
          const [{ n }] = await query<{ n: number }>(
            "select count(*) as n from categories where name like 'pg-lock-%'",
          );
          // Long enough for every other unit of work to have started and read too, were nothing holding them.
          await new Promise((resolve) => setTimeout(resolve, 50));
          await query('insert into categories (name, color, icon) values (?, ?, ?)', [`pg-lock-${n}`, '#000000', 'x']);
          return n;
        }),
      );

    const claimed = await Promise.all([claim(), claim(), claim(), claim()]);

    expect(claimed.every((n) => typeof n === 'number')).toBe(true);
    expect([...claimed].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it('PGSEM-002: a search ignores case, as LIKE does on SQLite', async () => {
    const rows = await withRequestContext(orm, () =>
      query<{ name: string }>(`select name from categories where ${ilike(orm.em.getPlatform(), ['name'])}`, [
        '%HOTEL%',
      ]),
    );
    const names = rows.map((row) => row.name);
    expect(names).toContain('Hotel');
    expect(names.every((name) => /hotel/i.test(name))).toBe(true);
  });
});
