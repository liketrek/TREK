#!/usr/bin/env node
/*
 * lint:strict: the strict type errors per file may only go down.
 *
 * The server compiles with strict: false, so a value that can be null or
 * undefined reads as always present, and an untyped parameter is a silent
 * `any` that no lint rule counts. Switching strict on at once is not a change
 * anyone can review, so this runs tsc over tsconfig.strict.json (the build
 * config plus strictNullChecks and noImplicitAny) and counts its errors per
 * file. A file may hold at most its entry in scripts/strict-baseline.json and
 * a file without an entry, a new one in particular, none. An entry above what
 * its file holds now, or for a file that is gone, fails as well until
 * --update lowers it, so a fixed error cannot come back unseen. An error tsc
 * reports outside any file (a broken config) fails the run, and so does a
 * tsc that exits non-zero without one error it can name: the check never
 * passes on output it could not read.
 *
 *   npm run lint:strict              check against the baseline (CI)
 *   npm run lint:strict -- --update  lower the baseline to today's counts;
 *                                    it never raises or adds an entry
 *
 * --dir=<path> points it at another server root and --tsc-output=<file> reads
 * a saved `tsc --pretty false` output instead of running tsc (the unit tests
 * use both). The counting lives in scripts/lib/tsc-errors.mjs, the baseline
 * handling in scripts/lib/ratchet.mjs at the repository root.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countMap,
  lowerCounts,
  RatchetError,
  readBaseline,
  reportStale,
  staleCounts,
  writeBaseline,
} from '../../scripts/lib/ratchet.mjs';
import { countErrors } from './lib/tsc-errors.mjs';

/** tsc over tsconfig.strict.json, as its output and exit status. */
function runTsc(serverDir) {
  const tsc = createRequire(join(serverDir, 'package.json')).resolve('typescript/bin/tsc');
  try {
    const output = execFileSync(process.execPath, [tsc, '-p', 'tsconfig.strict.json', '--noEmit', '--pretty', 'false'], {
      cwd: serverDir,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    return { output, status: 0 };
  } catch (err) {
    if (typeof err.status !== 'number') throw err;
    return { output: `${err.stdout ?? ''}${err.stderr ?? ''}`, status: err.status };
  }
}

const sum = (map) => Object.values(map).reduce((a, b) => a + b, 0);

function check(argv) {
  const dirArg = argv.find((a) => a.startsWith('--dir='));
  const outputArg = argv.find((a) => a.startsWith('--tsc-output='));
  const serverDir = dirArg ? resolve(dirArg.slice('--dir='.length)) : fileURLToPath(new URL('..', import.meta.url));
  const baselinePath = join(serverDir, 'scripts', 'strict-baseline.json');

  let baseline = readBaseline(baselinePath, countMap);
  const { output, status } = outputArg
    ? { output: readFileSync(resolve(outputArg.slice('--tsc-output='.length)), 'utf8'), status: null }
    : runTsc(serverDir);
  const { counts, global } = countErrors(output);
  if (global.length) {
    throw new RatchetError(`tsc reported errors outside any file:\n  ${global.join('\n  ')}`);
  }
  if (status !== null && status !== 0 && !Object.keys(counts).length) {
    throw new RatchetError(`tsc exited with ${status} without an error it could name:\n${output.slice(0, 2000)}`);
  }

  if (argv.includes('--update')) {
    baseline = lowerCounts(baseline, counts);
    writeBaseline(baselinePath, baseline);
  }

  const grown = Object.entries(counts).filter(([file, n]) => n > (baseline[file] ?? 0));
  for (const [file, n] of grown) {
    const entry = baseline[file];
    console.error(
      `FAIL  ${file}: ${n} strict error(s), ` +
        (entry ? `its baseline is ${entry}. ` : 'a file without a baseline entry may have none. ') +
        'Run npx tsc -p tsconfig.strict.json --noEmit to see them; narrow the null case or type the parameter.',
    );
  }
  const stale = staleCounts(baseline, counts);
  reportStale(stale, { file: 'strict-baseline.json', command: 'lint:strict', root: serverDir, error: console.error });
  console.log(
    `strict: ${sum(counts)} error(s) in ${Object.keys(counts).length} file(s), baseline ${sum(baseline)} in ${Object.keys(baseline).length}`,
  );
  return grown.length || stale.length ? 1 : 0;
}

const isCli = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    process.exitCode = check(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof RatchetError)) throw err;
    console.error(`FAIL  lint:strict: ${err.message}`);
    process.exitCode = 1;
  }
}
