/**
 * PGROLE-001..003 — the check that refuses a restore (and warns at boot) for a
 * role that could reach the database host from SQL
 * (src/db/engine/postgres/server-checks.ts), evaluated by the real server as
 * each kind of role. Roles belong to the whole server, so this suite creates
 * its own under one prefix and drops them again. TREK_TEST_DB_URL connects as
 * a superuser, which `SET ROLE` lets act as each of them.
 */
import { PRIVILEGED_ROLE_SQL } from '../../src/db/engine/postgres/server-checks';
import { oneByOne } from '../helpers/one-by-one';
import { withAdmin } from './databases';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const adminUrl = process.env.TREK_TEST_DB_URL as string;
const PREFIX = `trek_test_role_${process.pid}_`;
const role = (name: string) => `${PREFIX}${name}`;
const ROLES = ['plain', 'super', 'member', 'program', 'reader', 'writer', 'creator', 'granter'];

/** The statements run as the admin, one after the other on its one connection. */
function asAdmin(statements: string[]): Promise<unknown[]> {
  return withAdmin(adminUrl, (run) => oneByOne(statements, (sql) => run(sql)));
}

/** Whether PRIVILEGED_ROLE_SQL holds for `name`, as the server evaluates it in a session acting as that role. */
async function privileged(name: string): Promise<boolean> {
  return withAdmin(adminUrl, async (run) => {
    await run(`set role ${role(name)}`);
    try {
      const [row] = await run<{ privileged: boolean }>(`select (${PRIVILEGED_ROLE_SQL}) as privileged`);
      return row.privileged;
    } finally {
      await run('reset role');
    }
  });
}

let major = 0;

beforeAll(async () => {
  await asAdmin(ROLES.map((name) => `drop role if exists ${role(name)}`));
  await asAdmin([
    `create role ${role('plain')} nologin`,
    `create role ${role('super')} nologin superuser`,
    `create role ${role('member')} nologin nosuperuser`,
    `grant ${role('super')} to ${role('member')}`,
    `create role ${role('program')} nologin`,
    `grant pg_execute_server_program to ${role('program')}`,
    `create role ${role('reader')} nologin`,
    `grant pg_read_server_files to ${role('reader')}`,
    `create role ${role('writer')} nologin`,
    `grant pg_write_server_files to ${role('writer')}`,
    `create role ${role('creator')} nologin createrole`,
    `create role ${role('granter')} nologin createrole`,
  ]);
  const [rows] = (await asAdmin(["select current_setting('server_version_num')::int / 10000 as major"])) as Array<
    Array<{ major: number }>
  >;
  major = rows[0].major;
});

afterAll(async () => {
  await asAdmin(ROLES.map((name) => `drop role if exists ${role(name)}`));
});

describe('the privileged-role check', () => {
  it('PGROLE-001: passes a plain role, refuses a superuser and every role that reaches server programs or files', async () => {
    expect(await privileged('plain')).toBe(false);
    expect(await privileged('super')).toBe(true);
    expect(await privileged('program')).toBe(true);
    expect(await privileged('writer')).toBe(true);
    expect(await privileged('reader')).toBe(true);
  });

  it('PGROLE-002: refuses a role that is no superuser itself but may SET ROLE to one', async () => {
    const [states] = (await asAdmin([`select rolsuper from pg_roles where rolname = '${role('member')}'`])) as Array<
      Array<{ rolsuper: boolean }>
    >;
    expect(states[0].rolsuper).toBe(false);
    expect(await privileged('member')).toBe(true);
    // What the check is for: from that role, SET ROLE gives a superuser session.
    const superuser = await withAdmin(adminUrl, async (run) => {
      await run(`set role ${role('member')}`);
      try {
        await run(`set role ${role('super')}`);
        const [row] = await run<{ setting: string }>("select current_setting('is_superuser') as setting");
        return row.setting;
      } finally {
        await run('reset role');
      }
    });
    expect(superuser).toBe('on');
  });

  it('PGROLE-003: refuses CREATEROLE before PostgreSQL 16, where it may grant itself a predefined role, and not from 16 on', async () => {
    expect(await privileged('creator')).toBe(major < 16);
    // The reason, as this server answers it: such a role granting itself pg_execute_server_program.
    const grant = withAdmin(adminUrl, async (run) => {
      await run(`set role ${role('granter')}`);
      try {
        await run(`grant pg_execute_server_program to ${role('granter')}`);
      } finally {
        await run('reset role');
      }
    });
    if (major < 16) await expect(grant).resolves.toBeUndefined();
    else await expect(grant).rejects.toThrow(/permission denied|must have admin option/);
  });
});
