#!/usr/bin/env node
/*
 * lint:engine-dispatch: code outside the dialect layer and the engine port
 * never asks which database it runs on.
 *
 * What differs between SQLite and Postgres has two homes: the SQL helpers in
 * src/db/dialect/ and the engine implementations in src/db/engine/ (the
 * driver, the schema bootstrap, maintenance, backups). Anywhere else, an
 * `isSqlite(`/`isPostgres(` check, an `instanceof` on a driver or platform
 * class, a comparison with a driver class (`config.driver !==
 * SharedSqliteDriver`), and any comparison with or `case` on an engine's name
 * (`db.engine === 'postgres'`, `engine !== 'sqlite'`, `case 'postgres':`) is
 * a branch a third engine would have to find by searching, so each file is
 * held to its entry in scripts/engine-dispatch-baseline.json and a file
 * without one holds none (scripts/lib/count-ratchet.mjs has the rules).
 * Comments do not count.
 *
 *   npm run lint:engine-dispatch              check against the baseline (CI)
 *   npm run lint:engine-dispatch -- --update  lower the counts; never raises or adds an entry
 */
import { cliMain, stripComments } from './lib/count-ratchet.mjs';

/** An engine's name as a string literal. */
const ENGINE_NAME = String.raw`['"\x60](?:sqlite|postgres)['"\x60]`;

/** A driver or platform class of either engine: MikroORM's (PostgreSqlPlatform) and ours (SharedSqliteDriver). */
const ENGINE_CLASS = String.raw`\b\w*(?:Sqlite|PostgreSql)\w*(?:Driver|Platform)\b`;

const DISPATCH = new RegExp(
  [
    String.raw`\bis(?:Sqlite|Postgres)\s*\(`,
    String.raw`\binstanceof\s+` + ENGINE_CLASS,
    // A comparison with an engine's name, whatever stands on the other side
    // (`db.engine === 'postgres'`, `engine !== 'sqlite'`, `'postgres' == kind`),
    // and a switch over it.
    String.raw`[!=]==?\s*` + ENGINE_NAME,
    ENGINE_NAME + String.raw`\s*[!=]==?`,
    String.raw`\bcase\s+` + ENGINE_NAME + String.raw`\s*:`,
    // A comparison with a driver or platform class.
    String.raw`[!=]==?\s*` + ENGINE_CLASS,
    ENGINE_CLASS + String.raw`\s*[!=]==?`,
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
  advice:
    'Move the check into src/db/dialect/ (SQL that differs per engine) or the DatabaseEngine in src/db/engine/ ' +
    '(anything else, such as a guard that refuses an engine), and call that helper here instead.',
  include: (file) => file.endsWith('.ts') && !ENGINE_HOMES.some((home) => file.startsWith(home)),
  count: (text) => countEngineDispatch(text),
};

cliMain(check, import.meta.url);
