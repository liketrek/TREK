import { readFileSync } from 'node:fs';

/** The sslmode values that verify the server, read the way the `pg` driver reads them. */
const VERIFYING_MODES = new Set(['require', 'verify-ca', 'verify-full']);

/** The `ssl` option of a `pg` pool, as `sslOptionFor` builds it. */
type PgSslOption = false | VerifiedSsl;

/** SSL that verifies the server, with the CA and the client certificate the URL names. */
type VerifiedSsl = { rejectUnauthorized: true; ca?: string; cert?: string; key?: string };

/** The contents of the file a URL parameter names, or the refusal that names the parameter. */
function readNamedFile(param: string, file: string): string {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`TREK_DB_URL names ${param} ${file}, which cannot be read.`, { cause: error });
  }
}

/**
 * The `ssl` option for the pool, from the URL's `sslmode`, `sslrootcert`,
 * `sslcert` and `sslkey`.
 *
 * MikroORM builds the pool from the URL's host, port, user, password and
 * database alone and drops the rest of the query, so an `sslmode` in
 * `TREK_DB_URL` would be ignored without this. `require`, `verify-ca` and
 * `verify-full` all verify the server's certificate, as the `pg` driver itself
 * treats them; `disable` turns SSL off, and no `sslmode` leaves the driver's
 * default (no SSL). A mode that would connect without verifying (`prefer`,
 * `allow`, `no-verify`) or that is misspelt refuses, rather than quietly
 * connecting with less than was asked. `sslrootcert` names the CA file a host
 * that signs its own certificates needs (Supabase's, say). `sslcert` and
 * `sslkey` name the client certificate and its key for a server that wants
 * one (mutual TLS); they come together or not at all, and only with a
 * verifying mode.
 */
export function sslOptionFor(url: string): PgSslOption | undefined {
  const params = new URL(url).searchParams;
  const mode = params.get('sslmode');
  const rootCert = params.get('sslrootcert');
  const clientCert = params.get('sslcert');
  const clientKey = params.get('sslkey');
  if ((clientCert === null) !== (clientKey === null)) {
    throw new Error('TREK_DB_URL names only one of sslcert and sslkey; a client certificate needs both.');
  }
  const hasClientCert = clientCert !== null && clientKey !== null;
  if (mode === null) {
    if (rootCert !== null) throw new Error('TREK_DB_URL names an sslrootcert without sslmode=verify-full.');
    if (hasClientCert) throw new Error('TREK_DB_URL names an sslcert and sslkey without sslmode=verify-full.');
    return undefined;
  }
  if (mode === 'disable') {
    if (hasClientCert) throw new Error('TREK_DB_URL names an sslcert and sslkey with sslmode=disable.');
    return false;
  }
  if (!VERIFYING_MODES.has(mode)) {
    throw new Error(
      `TREK_DB_URL has sslmode "${mode}"; use disable, require, verify-ca or verify-full (all but disable verify the server).`,
    );
  }
  const option: VerifiedSsl = { rejectUnauthorized: true };
  if (rootCert !== null) option.ca = readNamedFile('sslrootcert', rootCert);
  if (hasClientCert) {
    option.cert = readNamedFile('sslcert', clientCert);
    option.key = readNamedFile('sslkey', clientKey);
  }
  return option;
}
