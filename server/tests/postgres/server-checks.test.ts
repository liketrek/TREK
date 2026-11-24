/**
 * PGROLE-001..006: the check that refuses a restore (and warns at boot) for a
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

/**
 * Drops every role this suite created, whatever it was granted. DROP OWNED
 * revokes what a role holds in this database and on shared objects, its
 * function and parameter grants included, which DROP ROLE alone refuses to
 * leave behind.
 */
const DROP_ROLES =
  'do $drop$ declare name text; begin' +
  ` for name in select rolname from pg_roles where left(rolname, ${PREFIX.length}) = '${PREFIX}' loop` +
  " execute format('drop owned by %I', name); execute format('drop role %I', name);" +
  ' end loop; end $drop$';

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
  await asAdmin([DROP_ROLES]);
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
    // A login role that holds no CREATEROLE itself but belongs to a group that does.
    `create role ${role('admins')} nologin createrole`,
    `create role ${role('in_admins')} nologin in role ${role('admins')}`,
    // Server file functions, granted one by one as a DBA would for a maintenance tool.
    `create role ${role('lo_export')} nologin`,
    `grant execute on function lo_export(oid, text) to ${role('lo_export')}`,
    `create role ${role('lo_import')} nologin`,
    `grant execute on function lo_import(text) to ${role('lo_import')}`,
    `create role ${role('read_file')} nologin`,
    `grant execute on function pg_read_file(text) to ${role('read_file')}`,
    `create role ${role('ls_dir')} nologin`,
    `grant execute on function pg_ls_dir(text) to ${role('ls_dir')}`,
    // pg_monitor lists fixed directories only, and stays an ordinary role.
    `create role ${role('monitor')} nologin`,
    `grant pg_monitor to ${role('monitor')}`,
    `create role ${role('set_suset')} nologin`,
    `create role ${role('alter_system')} nologin`,
    `create role ${role('set_userset')} nologin`,
    `create role ${role('setters')} nologin`,
    `create role ${role('in_setters')} nologin in role ${role('setters')}`,
  ]);
  const [rows] = (await asAdmin(["select current_setting('server_version_num')::int / 10000 as major"])) as Array<
    Array<{ major: number }>
  >;
  major = rows[0].major;
  // Privileges on parameters exist from PostgreSQL 15 on; the statements do not parse before.
  if (major >= 15) {
    await asAdmin([
      `grant set on parameter lo_compat_privileges to ${role('set_suset')}`,
      `grant alter system on parameter archive_command to ${role('alter_system')}`,
      `grant set on parameter work_mem to ${role('set_userset')}`,
      `grant set on parameter log_statement to ${role('setters')}`,
    ]);
  }
});

afterAll(async () => {
  await asAdmin([DROP_ROLES]);
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

  it('PGROLE-004: refuses before PostgreSQL 16 a role that is only a member of a CREATEROLE role, and not from 16 on', async () => {
    const [states] = (await asAdmin([
      `select rolcreaterole from pg_roles where rolname = '${role('in_admins')}'`,
    ])) as Array<Array<{ rolcreaterole: boolean }>>;
    expect(states[0].rolcreaterole).toBe(false);
    expect(await privileged('in_admins')).toBe(major < 16);
    // The reason: the member sets its role to the group and grants itself what reaches the host.
    const grant = withAdmin(adminUrl, async (run) => {
      await run(`set role ${role('in_admins')}`);
      try {
        await run(`set role ${role('admins')}`);
        await run(`grant pg_execute_server_program to ${role('in_admins')}`);
      } finally {
        await run('reset role');
      }
    });
    if (major < 16) await expect(grant).resolves.toBeUndefined();
    else await expect(grant).rejects.toThrow(/permission denied|must have admin option/);
  });

  it('PGROLE-005: refuses a role granted a server file function, and passes pg_monitor', async () => {
    expect(await privileged('lo_export')).toBe(true);
    expect(await privileged('lo_import')).toBe(true);
    expect(await privileged('read_file')).toBe(true);
    expect(await privileged('ls_dir')).toBe(true);
    expect(await privileged('monitor')).toBe(false);
    // The reason, as this server answers it: the grant alone lets the role read the host's file system.
    const listed = await withAdmin(adminUrl, async (run) => {
      await run(`set role ${role('ls_dir')}`);
      try {
        return await run<{ name: string }>("select pg_ls_dir('.') as name");
      } finally {
        await run('reset role');
      }
    });
    expect(listed.map((row) => row.name)).toContain('PG_VERSION');
  });

  it('PGROLE-006: refuses from PostgreSQL 15 on a role granted ALTER SYSTEM or a superuser-only setting, directly or through a group', async () => {
    expect(await privileged('set_suset')).toBe(major >= 15);
    expect(await privileged('alter_system')).toBe(major >= 15);
    expect(await privileged('in_setters')).toBe(major >= 15);
    // SET on a setting every role may set anyway gives nothing.
    expect(await privileged('set_userset')).toBe(false);
  });
});
