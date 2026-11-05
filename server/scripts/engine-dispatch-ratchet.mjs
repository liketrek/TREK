#!/usr/bin/env node
/*
 * lint:engine-dispatch: code outside the dialect layer and the engine port
 * never asks which database it runs on.
 *
 * What differs between SQLite and Postgres has two homes: the SQL helpers in
 * src/db/dialect/ and the engine implementations in src/db/engine/ (the
 * driver, the schema bootstrap, maintenance, backups). Anywhere else, an
 * `isSqlite(`/`isPostgres(` check, an `instanceof` on a platform class or a
 * comparison on the engine's name (`readEnv().db.engine === 'postgres'`) is a
 * branch a third engine would have to find by searching, so each file is held
 * to its entry in scripts/engine-dispatch-baseline.json and a file without one
 * holds none (scripts/lib/count-ratchet.mjs has the rules). Comments do not
 * count.
 *
 *   npm run lint:engine-dispatch              check against the baseline (CI)
 *   npm run lint:engine-dispatch -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain, stripComments } from './lib/count-ratchet.mjs';

const DISPATCH = new RegExp(
  [
    /\bis(?:Sqlite|Postgres)\s*\(/.source,
    /\binstanceof\s+(?:Sqlite|BasePostgreSql|PostgreSql)Platform\b/.source,
    // A comparison on the engine's name: `db.engine === 'postgres'`, `engine.id !== 'sqlite'`.
    /\.(?:engine|id)\s*[!=]==?\s*['"](?:sqlite|postgres)['"]/.source,
  ].join('|'),
  'g',
);

/** Where an engine may be named: the dialect helpers and the engine port. */
const ENGINE_HOMES = ['src/db/dialect/', 'src/db/engine/'];

/** The engine checks in one file's text, comments left out. */
export function countEngineDispatch(text) {
  return stripComments(text).match(DISPATCH)?.length ?? 0;
}

export const check = {
  name: 'engine-dispatch',
  script: 'lint:engine-dispatch',
  root: 'src',
  baseline: 'scripts/engine-dispatch-baseline.json',
  unit: 'engine check(s)',
  advice: 'Dispatch through a helper in src/db/dialect/ or the DatabaseEngine in src/db/engine/ instead.',
  include: (file) => file.endsWith('.ts') && !ENGINE_HOMES.some((home) => file.startsWith(home)),
  count: (text) => countEngineDispatch(text),
};

cliMain(check, import.meta.url);
