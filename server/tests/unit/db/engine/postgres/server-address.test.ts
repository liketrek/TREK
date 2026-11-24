/**
 * Where TREK_DB_URL says the Postgres server listens, read as libpq reads a
 * connection URL, so the pool and the client tools reach the same server.
 */
import { pgServerAddress } from '../../../../../src/db/engine/postgres/server-address';

import { describe, expect, it } from 'vitest';

describe('pgServerAddress', () => {
  it('PGADDR-001: a TCP host and port come from the URL itself', () => {
    expect(pgServerAddress('postgresql://trek:pw@db.example:6543/trek')).toEqual({ host: 'db.example', port: 6543 });
    expect(pgServerAddress('postgres://trek@[::1]/trek')).toEqual({ host: '::1', port: undefined });
  });

  it('PGADDR-002: a host or port parameter takes the place of the URL’s own, as in libpq', () => {
    expect(pgServerAddress('postgresql://trek@localhost/trek?host=/var/run/postgresql')).toEqual({
      host: '/var/run/postgresql',
      port: undefined,
    });
    expect(pgServerAddress('postgresql:///trek?host=/run/postgresql&port=5433')).toEqual({
      host: '/run/postgresql',
      port: 5433,
    });
  });

  it('PGADDR-003: a socket directory written into the URL is percent-decoded', () => {
    expect(pgServerAddress('postgresql://trek@%2Fvar%2Frun%2Fpostgresql/trek')).toEqual({
      host: '/var/run/postgresql',
      port: undefined,
    });
  });

  it('PGADDR-004: a port that is no port number is refused', () => {
    for (const port of ['0', '65536', 'abc', '54x']) {
      expect(() => pgServerAddress(`postgresql://trek@localhost/trek?port=${port}`), port).toThrow(/not a port number/);
    }
  });
});
