import { REFUSAL } from '../../legacy-baseline';

/**
 * What TREK checks about the Postgres server and its own role: the server
 * versions it supports, and whether the role could reach the database host.
 * Read at boot (`schema-bootstrap.ts`) and before a dump or a restore
 * (`pg-tools.ts`).
 */

/** The PostgreSQL majors TREK supports and CI runs: the oldest and the newest. */
const SUPPORTED_SERVER_MAJORS = { oldest: 14, newest: 18 } as const;

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
 * - CREATEROLE before PostgreSQL 16, where it may grant itself any role that
 *   is not a superuser, those predefined roles included. From 16 on it needs
 *   ADMIN OPTION on a role to grant it, which the checks above already see.
 *
 * `MEMBER` is membership whatever its INHERIT and SET options, since a member
 * that can neither may still be one that can grant itself the rest.
 */
export const PRIVILEGED_ROLE_SQL =
  "exists (select 1 from pg_roles r where r.rolsuper and pg_has_role(current_user, r.oid, 'MEMBER'))" +
  " or pg_has_role(current_user, 'pg_execute_server_program', 'MEMBER')" +
  " or pg_has_role(current_user, 'pg_write_server_files', 'MEMBER')" +
  " or pg_has_role(current_user, 'pg_read_server_files', 'MEMBER')" +
  " or (current_setting('server_version_num')::int < 160000" +
  ' and coalesce((select r.rolcreaterole from pg_roles r where r.rolname = current_user), false))';

/** What {@link PRIVILEGED_ROLE_SQL} refuses, as the boot warning and the restore refusal say it. */
export const PRIVILEGED_ROLE_DESCRIPTION =
  'a superuser or a member of a superuser role, a role that may run programs or read or write files on the ' +
  'database server, or (before PostgreSQL 16) a role with CREATEROLE, which may grant itself those';

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
