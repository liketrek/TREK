/** Where the Postgres server listens, as TREK_DB_URL names it. */
interface PgServerAddress {
  /** A host name, an IP address, or the directory of a Unix socket (a path starting with `/`); empty when the URL names none. */
  host: string;
  port: number | undefined;
}

/**
 * The server address in `url`, read the way libpq reads a connection URL: a
 * `host` or `port` query parameter takes the place of the URL's own, so
 * `postgresql://trek@localhost/trek?host=/var/run/postgresql` connects through
 * the socket in that directory, and a host written into the URL itself is
 * percent-decoded (`%2Fvar%2Frun%2Fpostgresql`). The app's pool and the client
 * tools both connect to this one address, so a backup reaches the database
 * the app runs on.
 */
export function pgServerAddress(url: string): PgServerAddress {
  const parsed = new URL(url);
  const params = parsed.searchParams;
  const host = params.get('host') ?? decodeURIComponent(parsed.hostname.replace(/^\[(.*)\]$/, '$1'));
  const rawPort = params.get('port') ?? parsed.port;
  if (rawPort === '') return { host, port: undefined };
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
    throw new Error(`TREK_DB_URL names port "${rawPort}", which is not a port number.`);
  }
  return { host, port };
}
