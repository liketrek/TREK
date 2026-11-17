import { readEnv, type AppEnv } from '../../../../app-config';
import { resolveDataPaths } from '../../../../app-config/data-paths';
import { knownMigrationNames } from '../../../known-migrations';
import type { AnyOrm } from '../../../orm';
import { buildOrmConfig, resolveEngine } from '../../index';
import { redactUrl } from '../../redact-url';
import { readPostgresBaseline } from '../baseline';
import { MoveRefusal, moveSqliteToPostgres, renderSummary, type MoveOptions } from './move';
import { MikroORM } from '@mikro-orm/core';

import path from 'node:path';

/**
 * The command around the move (`src/move-to-postgres.ts` runs it): reads
 * TREK_DB_URL as the server does, takes the SQLite file from the data
 * directory or `--from=<file>`, the plugin data from the plugins' data
 * directory, runs the move and prints its summary. `--drop-nul` lets the move
 * drop NUL characters from TREK's own text instead of refusing them. Answers
 * the exit code.
 */

export const USAGE =
  'Usage: move-to-postgres [--from=<SQLite file>] [--drop-nul]\n' +
  'Copies a TREK SQLite database (data/travel.db by default) into the empty Postgres database TREK_DB_URL names.\n' +
  '  --from=<file>  the SQLite file to copy\n' +
  "  --drop-nul     drop NUL characters (U+0000) from TREK's own text, which Postgres cannot hold and TREK drops on\n" +
  '                 its next write anyway, instead of refusing the move; the summary lists every value changed.\n' +
  "                 A plugin's own data is never changed: a NUL there refuses the move either way.";

export interface MoveCommandIo {
  env: () => AppEnv;
  out: (line: string) => void;
  err: (line: string) => void;
  /** An ORM on the target database, from the Postgres engine's own config. */
  openOrm: (env: AppEnv) => Promise<AnyOrm>;
  move: (options: MoveOptions) => ReturnType<typeof moveSqliteToPostgres>;
}

/** The ORM the move runs on: the engine's config, without entity discovery (the move runs SQL only). */
async function openTargetOrm(env: AppEnv): Promise<AnyOrm> {
  const config = buildOrmConfig(resolveEngine(env.db));
  return MikroORM.init({
    ...config,
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true },
  });
}

const defaultIo: MoveCommandIo = {
  env: readEnv,
  out: (line) => process.stdout.write(`${line}\n`),
  err: (line) => process.stderr.write(`${line}\n`),
  openOrm: openTargetOrm,
  move: moveSqliteToPostgres,
};

const FROM = '--from=';
const DROP_NUL = '--drop-nul';

async function run(argv: readonly string[], io: MoveCommandIo): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    io.out(USAGE);
    return 0;
  }
  const unknown = argv.find((arg) => !arg.startsWith(FROM) && arg !== DROP_NUL);
  if (unknown !== undefined) throw new MoveRefusal(`Unknown argument ${unknown}.\n${USAGE}`);
  const env = io.env();
  if (env.db.engine !== 'postgres')
    throw new MoveRefusal('Set TREK_DB_URL to the empty Postgres database to move into.');

  const paths = resolveDataPaths(env);
  const from = argv.find((arg) => arg.startsWith(FROM))?.slice(FROM.length);
  const sqliteFile = path.resolve(from || paths.dbFile);
  const target = redactUrl(env.db.url);
  io.out(`Moving ${sqliteFile} into ${target}`);
  const orm = await io.openOrm(env);
  try {
    const summary = await io.move({
      sqliteFile,
      pluginsDataDir: env.plugins.dataDir || path.join(paths.dataDir, 'plugins-data'),
      orm,
      known: knownMigrationNames(),
      baseline: readPostgresBaseline,
      log: (line) => io.out(`  ${line}`),
      dropNul: argv.includes(DROP_NUL),
    });
    io.out('');
    io.out(renderSummary(summary, target));
    return 0;
  } finally {
    await orm.close(true);
  }
}

/** Runs the command and answers its exit code: 0 once the move committed, 1 for a refusal or a failure. */
export async function runMoveCommand(argv: readonly string[], io: Partial<MoveCommandIo> = {}): Promise<number> {
  const resolved = { ...defaultIo, ...io };
  try {
    return await run(argv, resolved);
  } catch (err) {
    if (err instanceof MoveRefusal) resolved.err(`\nThe move was refused: ${err.message}`);
    else {
      const text = err instanceof Error ? (err.stack ?? err.message) : String(err);
      resolved.err(
        `\nThe move failed; the Postgres database is left as the move found it unless this says otherwise: ${text}`,
      );
    }
    return 1;
  }
}
