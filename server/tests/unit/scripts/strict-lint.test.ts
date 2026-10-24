/**
 * scripts/strict-lint.mjs holds the strict type errors (strictNullChecks +
 * noImplicitAny) per file to scripts/strict-baseline.json. The counting
 * (scripts/lib/tsc-errors.mjs) is tested on tsc output directly; the
 * comparison runs the real script as a child process against throwaway
 * server roots (--dir) fed a saved tsc output (--tsc-output), so no test pays
 * for a type check.
 */
import { countErrors } from '../../../scripts/lib/tsc-errors.mjs';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/strict-lint.mjs');

interface ExecError {
  status: number | null;
  stdout: string;
  stderr: string;
}

const roots: string[] = [];

const err = (file: string, line = 1, code = 'TS2322') =>
  `${file}(${line},5): error ${code}: Type 'x' is not assignable.`;

function serverRoot(files: Record<string, string>, baseline: unknown, tscOutput: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-strict-lint-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/strict-baseline.json'),
      typeof baseline === 'string' ? baseline : JSON.stringify(baseline),
    );
  }
  writeFileSync(path.join(dir, 'tsc.out'), tscOutput);
  return dir;
}

function run(dir: string, ...args: string[]): { status: number | null; out: string } {
  try {
    const stdout = execFileSync(
      process.execPath,
      [SCRIPT, `--dir=${dir}`, `--tsc-output=${path.join(dir, 'tsc.out')}`, ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { status: 0, out: stdout };
  } catch (e) {
    const { status, stdout, stderr } = e as ExecError;
    return { status, out: `${stdout}${stderr}` };
  }
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('strict-lint countErrors', () => {
  it('STRICT-001: counts one error per error line and file, not its continuation lines', () => {
    const output = [
      err('src/a.ts', 1),
      "  Type 'string | undefined' is not assignable to type 'string'.",
      "    Type 'undefined' is not assignable to type 'string'.",
      err('src/a.ts', 9, 'TS7006'),
      err('src/nest/b/b.service.ts', 3),
      '',
    ].join('\n');
    expect(countErrors(output)).toEqual({ counts: { 'src/a.ts': 2, 'src/nest/b/b.service.ts': 1 }, global: [] });
  });

  it('STRICT-002: reads CRLF output and Windows paths the same as LF and POSIX ones', () => {
    const output = `${err('src\\nest\\a.ts')}\r\n${err('./src/b.ts')}\r\n`;
    expect(countErrors(output).counts).toEqual({ 'src/nest/a.ts': 1, 'src/b.ts': 1 });
  });

  it('STRICT-003: keeps an error that names no file apart, and ignores anything else', () => {
    const output = [
      "error TS5023: Unknown compiler option 'x'.",
      'Found 3 errors in 2 files.',
      'src/a.ts is fine',
    ].join('\n');
    expect(countErrors(output)).toEqual({ counts: {}, global: ["error TS5023: Unknown compiler option 'x'."] });
  });
});

describe('strict-lint.mjs', () => {
  it('STRICT-010: passes when every file sits at or under its entry', () => {
    const dir = serverRoot({ 'src/a.ts': '' }, { 'src/a.ts': 2 }, `${err('src/a.ts')}\n${err('src/a.ts', 2)}\n`);
    const { status, out } = run(dir);
    expect(status).toBe(0);
    expect(out).toContain('strict: 2 error(s) in 1 file(s), baseline 2 in 1');
  });

  it('STRICT-011: fails a new file with any strict error, and a baselined file past its entry', () => {
    const fresh = run(serverRoot({}, {}, `${err('src/new.ts')}\n`));
    expect(fresh.status).toBe(1);
    expect(fresh.out).toContain('FAIL  src/new.ts: 1 strict error(s), a file without a baseline entry may have none.');
    const grown = run(serverRoot({ 'src/a.ts': '' }, { 'src/a.ts': 1 }, `${err('src/a.ts')}\n${err('src/a.ts', 2)}\n`));
    expect(grown.status).toBe(1);
    expect(grown.out).toContain('FAIL  src/a.ts: 2 strict error(s), its baseline is 1.');
  });

  it('STRICT-012: fails an entry above its count or for a gone file until --update lowers it, and never adds one', () => {
    const dir = serverRoot(
      { 'src/a.ts': '', 'src/b.ts': '' },
      { 'src/a.ts': 3, 'src/b.ts': 1, 'src/gone.ts': 2 },
      `${err('src/a.ts')}\n${err('src/new.ts')}\n`,
    );
    const before = run(dir);
    expect(before.status).toBe(1);
    expect(before.out).toContain('FAIL  src/a.ts is held at 3 in scripts/strict-baseline.json, but there are 1 now.');
    expect(before.out).toContain(
      'FAIL  src/gone.ts is held at 2 in scripts/strict-baseline.json, but the file is gone.',
    );
    expect(before.out).toContain('npm run lint:strict -- --update');
    // The new file still fails after the update; the baseline only lost entries.
    expect(run(dir, '--update').status).toBe(1);
    expect(JSON.parse(readFileSync(path.join(dir, 'scripts/strict-baseline.json'), 'utf8'))).toEqual({ 'src/a.ts': 1 });
  });

  it('STRICT-013: fails closed on a missing or broken baseline and on an error outside any file', () => {
    expect(run(serverRoot({}, null, '')).out).toContain('strict-baseline.json cannot be read');
    expect(run(serverRoot({}, '{ broken', '')).status).toBe(1);
    expect(run(serverRoot({}, { 'src/a.ts': 0 }, '')).status).toBe(1);
    const config = run(serverRoot({}, {}, "error TS5023: Unknown compiler option 'x'.\n"));
    expect(config.status).toBe(1);
    expect(config.out).toContain('tsc reported errors outside any file');
  });
});
