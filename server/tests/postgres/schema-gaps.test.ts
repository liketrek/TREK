/**
 * PGGAP-001..002: the boot's check for tables and columns the entities map
 * (src/db/schema-gaps.ts) on the lane's real Postgres database. Every
 * Postgres start runs it, so a catalog that reads differently from the
 * entities would warn about a healthy install on every start; the SQLite
 * suite (tests/unit/db/schema-gaps.test.ts) cannot see that.
 */
import { buildApp } from '../../src/bootstrap';
import { schemaGaps } from '../../src/db/schema-gaps';
import { withRequestContext } from '../../src/nest/database/request-context';
import { MikroORM } from '@mikro-orm/core';
import { Logger, type INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let app: INestApplication;
let orm: MikroORM;
let bootWarnings: string[];

beforeAll(async () => {
  const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  try {
    app = await buildApp();
  } finally {
    bootWarnings = warn.mock.calls.map(([line]) => String(line));
    warn.mockRestore();
  }
  orm = app.get(MikroORM);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('the schema gap check on Postgres', () => {
  it('PGGAP-001: a bootstrapped database lacks nothing, and the start says nothing about it', async () => {
    expect(await withRequestContext(orm, () => schemaGaps(orm))).toEqual([]);
    expect(bootWarnings.filter((line) => line.includes('this TREK version uses'))).toEqual([]);
  });

  it('PGGAP-002: a column the database lacks is named by table and column', async () => {
    await withRequestContext(orm, () =>
      orm.em.getConnection().execute('alter table users drop column mfa_backup_codes'),
    );
    expect(await withRequestContext(orm, () => schemaGaps(orm))).toEqual(['users.mfa_backup_codes']);
  });
});
