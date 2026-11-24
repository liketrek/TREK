import { MikroORM } from '@mikro-orm/postgresql';

/**
 * The databases the Postgres lane creates on the server TREK_TEST_DB_URL names:
 * one migrated template per run, and one copy of it per test file.
 */
export const TEMPLATE_DATABASE = 'trek_test_template';
export const WORKER_DATABASE_PREFIX = 'trek_test_w';

/** `adminUrl` pointed at `database`, everything else (credentials, host, sslmode) kept. */
export function databaseUrl(adminUrl: string, database: string): string {
  const url = new URL(adminUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

type Run = <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>;

/**
 * Runs `fn` on a connection to the admin database, outside any transaction
 * (CREATE and DROP DATABASE refuse to run in one), through the same Postgres
 * driver the app uses.
 */
export async function withAdmin<T>(adminUrl: string, fn: (run: Run) => Promise<T>): Promise<T> {
  const orm = await MikroORM.init({
    clientUrl: adminUrl,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 0, max: 1 },
  });
  try {
    const connection = orm.em.getConnection();
    return await fn((sql, params = []) => connection.execute(sql, params, 'all'));
  } finally {
    await orm.close(true);
  }
}
