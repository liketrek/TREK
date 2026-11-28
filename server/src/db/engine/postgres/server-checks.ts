import { REFUSAL } from '../../legacy-baseline';

/**
 * What TREK checks about the Postgres server and its own role: the server
 * versions it supports, and whether the role could reach the database host.
 * Read at boot (`schema-bootstrap.ts`) and before a dump or a restore
 * (`pg-tools.ts`).
 */

/** The PostgreSQL majors TREK supports and CI runs: the oldest and the newest. */
const SUPPORTED_SERVER_MAJORS = { oldest: 14, newest: 19 } as const;

/**
 * The `pg_catalog` functions that read, list or write files on the database
 * server, or move a large object to or from one. PostgreSQL revokes EXECUTE on
 * them from PUBLIC (since 11) instead of checking for a superuser, so a grant
 * of one hands that reach to an ordinary role. The `pg_file_*` ones are
 * adminpack's, which installs into `pg_catalog` where it exists at all. The
 * `pg_ls_*dir` functions `pg_monitor` holds only list fixed directories and
 * are not counted.
 */
const SERVER_FILE_FUNCTIONS = [
  'lo_import',
  'lo_export',
  'pg_read_file',
  'pg_read_binary_file',
  'pg_ls_dir',
  'pg_stat_file',
  'pg_file_write',
  'pg_file_rename',
  'pg_file_unlink',
  'pg_file_sync',
];

/**
 * A privilege on a server setting that an ordinary role does not have:
 * `ALTER SYSTEM` on any parameter (it rewrites `postgresql.auto.conf`, where
 * `archive_command` or a preload library runs on the host), or `SET` on one
 * that only a superuser may set (`lo_compat_privileges` turns off the large
 * object checks). A grant to PUBLIC counts, and so does one on a parameter
 * this server does not know yet. `pg_parameter_acl` exists from PostgreSQL 15
 * on, and a statement naming it does not even parse on 14, so the query runs
 * through `query_to_xml` and only on 15 or later; it answers an empty string
 * when no row matches.
 */
const PARAMETER_GRANT_SQL =
  'select 1 from pg_catalog.pg_parameter_acl a, aclexplode(a.paracl) e' +
  " where (e.privilege_type = 'ALTER SYSTEM'" +
  " or coalesce((select s.context from pg_catalog.pg_settings s where s.name = a.parname), 'superuser') <> 'user')" +
  " and case when e.grantee = 0 then true else pg_has_role(current_user, e.grantee, 'MEMBER') end limit 1";

/** `text` as a SQL string literal. */
const literal = (text: string) => `'${text.replaceAll("'", "''")}'`;

/**
 * True when the current role could reach the database host, or make itself
 * able to, from SQL. A restored archive is a SQL script run as that role, so
 * such a role turns a crafted archive into a way onto the host. It counts:
 *
 * - membership in any superuser role, its own included: `SET ROLE` to one is a
 *   superuser session, whatever the role's own `rolsuper` says;
 * - membership in `pg_execute_server_program` (`COPY ... PROGRAM`),
 *   `pg_write_server_files` or `pg_read_server_files` (`COPY` to or from a
 *   server file), which a superuser holds implicitly;
 * - EXECUTE on one of {@link SERVER_FILE_FUNCTIONS} (`lo_export` writes a
 *   server file and keeps it after its transaction rolled back);
 * - from PostgreSQL 15 on, a privilege on a server setting an ordinary role
 *   lacks ({@link PARAMETER_GRANT_SQL});
 * - before PostgreSQL 16, membership in a role with CREATEROLE, its own
 *   included: such a role may grant itself any role that is not a superuser,
 *   those predefined roles included, and a member may `SET ROLE` to it first,
 *   since role attributes are not inherited but the grant checks the role in
 *   effect. From 16 on it needs ADMIN OPTION on a role to grant it, which the
 *   checks above already see.
 *
 * `MEMBER` is membership whatever its INHERIT and SET options, since a member
 * that can neither may still be one that can grant itself the rest. The
 * version-gated parts sit in CASE, whose branches PostgreSQL evaluates only
 * when taken.
 */
export const PRIVILEGED_ROLE_SQL =
  "exists (select 1 from pg_roles r where r.rolsuper and pg_has_role(current_user, r.oid, 'MEMBER'))" +
  " or pg_has_role(current_user, 'pg_execute_server_program', 'MEMBER')" +
  " or pg_has_role(current_user, 'pg_write_server_files', 'MEMBER')" +
  " or pg_has_role(current_user, 'pg_read_server_files', 'MEMBER')" +
  " or exists (select 1 from pg_proc p where p.pronamespace = 'pg_catalog'::regnamespace" +
  ` and p.proname in (${SERVER_FILE_FUNCTIONS.map(literal).join(', ')})` +
  " and has_function_privilege(current_user, p.oid, 'EXECUTE'))" +
  " or (case when current_setting('server_version_num')::int >= 150000" +
  ` then query_to_xml(${literal(PARAMETER_GRANT_SQL)}, false, true, '')::text <> '' else false end)` +
  " or (case when current_setting('server_version_num')::int < 160000" +
  " then exists (select 1 from pg_roles r where r.rolcreaterole and pg_has_role(current_user, r.oid, 'MEMBER'))" +
  ' else false end)';

/** What {@link PRIVILEGED_ROLE_SQL} refuses, as the boot warning and the restore refusal say it. */
export const PRIVILEGED_ROLE_DESCRIPTION =
  'a superuser or a member of a superuser role, a role that may run programs or read or write files on the ' +
  'database server (through a predefined role or a granted server file function such as lo_export), a role ' +
  'granted ALTER SYSTEM or a superuser-only setting (PostgreSQL 15 and later), or (before PostgreSQL 16) a ' +
  'member of a role with CREATEROLE, which may grant itself those';

/** The major version in `server_version_num` (`170011` is 17, `180001` is 18). Throws on anything else. */
export function serverMajor(versionNum: string | number | undefined): number {
  const value = Number(versionNum);
  if (!Number.isInteger(value) || value < 10000) {
    throw new Error(`The Postgres server reported the version number "${String(versionNum)}", which TREK cannot read.`);
  }
  return Math.floor(value / 10000);
}

/**
 * Refuses a server outside {@link SUPPORTED_SERVER_MAJORS} before TREK writes
 * anything to it: an older one lacks what the schema uses, and a newer one is
 * untested and may be newer than the client tools that back it up.
 */
export function refuseUnsupportedServer(major: number): void {
  const { oldest, newest } = SUPPORTED_SERVER_MAJORS;
  if (major >= oldest && major <= newest) return;
  throw new Error(
    `${REFUSAL} the Postgres server is version ${major}; TREK supports PostgreSQL ${oldest} to ${newest}. ` +
      'Point TREK_DB_URL at a server of a supported version.',
  );
}

/** The boot warning for a privileged role (see {@link PRIVILEGED_ROLE_SQL}); a restore refuses such a role outright. */
export const PRIVILEGED_ROLE_WARNING =
  `TREK_DB_URL connects as ${PRIVILEGED_ROLE_DESCRIPTION}. ` +
  'Restores are refused for such a role. Connect TREK as a role that owns its database and is not a superuser ' +
  '(see the wiki page "Database: Postgres").';
