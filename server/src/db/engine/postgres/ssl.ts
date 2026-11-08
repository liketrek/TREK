import { readFileSync } from 'node:fs';

/** The sslmode values that verify the server, read the way the `pg` driver reads them. */
const VERIFYING_MODES = new Set(['require', 'verify-ca', 'verify-full']);

/** The `ssl` option of a `pg` pool, as `sslOptionFor` builds it. */
type PgSslOption = false | { rejectUnauthorized: true; ca?: string };

/**
 * The `ssl` option for the pool, from the URL's `sslmode` and `sslrootcert`.
 *
 * MikroORM builds the pool from the URL's host, port, user, password and
 * database alone and drops the rest of the query, so an `sslmode` in
 * `TREK_DB_URL` would be ignored without this. `require`, `verify-ca` and
 * `verify-full` all verify the server's certificate, as the `pg` driver itself
 * treats them; `disable` turns SSL off, and no `sslmode` leaves the driver's
 * default (no SSL). A mode that would connect without verifying (`prefer`,
 * `allow`, `no-verify`) or that is misspelt refuses, rather than quietly
 * connecting with less than was asked. `sslrootcert` names the CA file a host
 * that signs its own certificates needs (Supabase's, say).
 */
export function sslOptionFor(url: string): PgSslOption | undefined {
  const params = new URL(url).searchParams;
  const mode = params.get('sslmode');
  const rootCert = params.get('sslrootcert');
  if (mode === null) {
    if (rootCert !== null) throw new Error('TREK_DB_URL names an sslrootcert without sslmode=verify-full.');
    return undefined;
  }
  if (mode === 'disable') return false;
  if (!VERIFYING_MODES.has(mode)) {
    throw new Error(
      `TREK_DB_URL has sslmode "${mode}"; use disable, require, verify-ca or verify-full (all but disable verify the server).`,
    );
  }
  if (rootCert === null) return { rejectUnauthorized: true };
  try {
    return { rejectUnauthorized: true, ca: readFileSync(rootCert, 'utf8') };
  } catch (error) {
    throw new Error(`TREK_DB_URL names sslrootcert ${rootCert}, which cannot be read.`, { cause: error });
  }
}
