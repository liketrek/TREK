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
 * True when the current role is a superuser or may run programs or write
 * files on the database server (the predefined roles
 * `pg_execute_server_program` and `pg_write_server_files`, which a superuser
 * holds implicitly). Such a role turns a restored archive, which is a SQL
 * script, into a way onto the database host.
 */
export const PRIVILEGED_ROLE_SQL =
  'coalesce((select r.rolsuper from pg_roles r where r.rolname = current_user), false)' +
  " or pg_has_role(current_user, 'pg_execute_server_program', 'MEMBER')" +
  " or pg_has_role(current_user, 'pg_write_server_files', 'MEMBER')";

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
  'TREK_DB_URL connects as a superuser, or as a role that may run programs or write files on the database server. ' +
  'Restores are refused for such a role. Connect TREK as a role that owns its database and is not a superuser ' +
  '(see the wiki page "Database: Postgres").';
