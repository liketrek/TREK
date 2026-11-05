/**
 * Stand-in PostgreSQL client tools (pg_dump, pg_restore and psql) for the unit
 * tests of the Postgres backup and restore. Each is an executable shell script
 * in a bin directory, which the test hands TREK as its client-tool directory.
 *
 * A stand-in writes its argv and its PG* environment to `<bin>/<name>.log`
 * before anything else it does, so readToolCall() says what the tool was given.
 * The log holds the last call. What a call does is a list of shell snippets,
 * run in order: the builders below name what a test sets up (answersSchema,
 * writesFile, failsWith, ...), so a test reads as the scenario it describes.
 * Output files are found by their `--file=` argument, not by position.
 */
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type PgToolName = 'pg_dump' | 'pg_restore' | 'psql';

export interface FakeToolOptions {
  /** What `--version` answers after "PostgreSQL". Defaults to 17.11. */
  version?: string;
  /** Shell fragments run after the call is logged, in order. */
  snippets?: readonly string[];
}

/** What a stand-in was called with: its arguments, and its PG* environment. */
export interface ToolCall {
  args: string[];
  env: Record<string, string>;
}

/** A value as one single-quoted shell word. */
function shellWord(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** Answers a call whose arguments contain `pattern` with `text`, and ends the call. */
export function printsWhen(pattern: string, text: string): string {
  return `case "$*" in *${pattern}*) printf '%s' ${shellWord(text)}; exit 0;; esac`;
}

/** psql's current-schema answer: the schema's name, and its quote_ident spelling, as pgCurrentSchema reads them. */
export function answersSchema(name = 'public', quoted = name): string {
  return printsWhen('quote_ident', `${name}\t${quoted}\n`);
}

/** psql's table listing, one name per line, as pgTableNames reads it. */
export function answersTables(names: readonly string[]): string {
  return printsWhen('table_name', names.map((name) => `${name}\n`).join(''));
}

/** Writes `content` to the output file the call names with `--file=`. */
export function writesFile(content: string): string {
  return `printf '%s' ${shellWord(content)} > "$(fake_file_target "$@")"`;
}

/** Writes the start of a restore script that restricts psql (CVE-2025-8714) and creates TREK's migration table. */
export function writesRestrictedScript(table = 'public.mikro_orm_migrations'): string {
  return writesFile(`\\restrict k1\nCREATE TABLE ${table} (\n);\n`);
}

/** Answers a `--data-only` call with the COPY block of `mikro_orm_migrations`, one row per name. */
export function listsMigrations(names: readonly string[]): string {
  const rows = names.map((name, i) => `${i + 1}\t${name}\tx\n`).join('');
  const copy = `COPY public.mikro_orm_migrations (id, name, executed_at) FROM stdin;\n${rows}\\.\n`;
  return `case "$*" in *--data-only*) printf '%s' ${shellWord(copy)}; exit 0;; esac`;
}

/** Fails the way a tool that cannot connect does: the message on stderr, then a non-zero exit. */
export function failsWith(message: string, exitCode = 1): string {
  return `printf '%s\\n' ${shellWord(message)} >&2; exit ${exitCode}`;
}

/** Creates `file`: a marker that the tool ran. */
export function touches(file: string): string {
  return `touch ${shellWord(file)}`;
}

/** Copies the `--file=` output whose path ends with `suffix` to `destination`, so a test can read a work file the tool has since removed. */
export function copiesFileEndingWith(suffix: string, destination: string): string {
  return `for a in "$@"; do case "$a" in --file=*${suffix}) cp "\${a#--file=}" ${shellWord(destination)};; esac; done`;
}

/** The function every stand-in uses to find its `--file=` argument, wherever it sits. */
const FILE_TARGET_FUNCTION =
  'fake_file_target() { for a in "$@"; do case "$a" in --file=*) printf \'%s\' "${a#--file=}";; esac; done; }';

/**
 * Installs the stand-in `name` in `bin` and returns the path of its call log.
 * The script is executable and runs by its absolute path, as TREK runs it.
 */
export function installFakeTool(bin: string, name: PgToolName, options: FakeToolOptions = {}): string {
  const { version = '17.11', snippets = [] } = options;
  const log = path.join(bin, `${name}.log`);
  const script = [
    '#!/bin/sh',
    FILE_TARGET_FUNCTION,
    `[ "$1" = --version ] && { echo '${name} (PostgreSQL) ${version} (Debian)'; exit 0; }`,
    `printf '%s\\n' "$@" > ${shellWord(log)}`,
    `env | grep '^PG' | sort >> ${shellWord(log)}`,
    ...snippets,
    '',
  ].join('\n');
  writeFileSync(path.join(bin, name), script);
  chmodSync(path.join(bin, name), 0o755);
  return log;
}

/** What the stand-in logged last: its arguments, and the PG* variables it was run with. */
export function readToolCall(log: string): ToolCall {
  const lines = readFileSync(log, 'utf8')
    .split('\n')
    .filter((line) => line !== '');
  const env: Record<string, string> = {};
  for (const line of lines.filter((line) => line.startsWith('PG'))) {
    const eq = line.indexOf('=');
    env[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return { args: lines.filter((line) => !line.startsWith('PG')), env };
}

/** Every argument that starts with `flag`, with the flag removed (`--file=` gives the file paths). */
export function flagValues(args: readonly string[], flag: string): string[] {
  return args.filter((arg) => arg.startsWith(flag)).map((arg) => arg.slice(flag.length));
}
