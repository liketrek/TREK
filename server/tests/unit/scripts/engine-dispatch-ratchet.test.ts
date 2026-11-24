/**
 * scripts/engine-dispatch-ratchet.mjs (lint:engine-dispatch): an engine check
 * outside src/db/dialect/ and src/db/engine/ may only shrink. Runs as the real
 * script against throwaway server roots (--dir) and once on this repository,
 * so the committed baseline is checked by the unit suite.
 */
import { countEngineDispatch } from '../../../scripts/engine-dispatch-ratchet.mjs';

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/engine-dispatch-ratchet.mjs');
const SERVER_ROOT = path.join(__dirname, '../../..');
const BASELINE = 'scripts/engine-dispatch-baseline.json';

const roots: string[] = [];

function serverRoot(files: Record<string, string>, counts: Record<string, number> = {}): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-engine-dispatch-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  writeFileSync(path.join(dir, BASELINE), JSON.stringify({ counts }));
  return dir;
}

function run(dir: string, ...args: string[]): { status: number | null; out: string } {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, `--dir=${dir}`, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, out: stdout };
  } catch (err) {
    const { status, stdout, stderr } = err as { status: number | null; stdout: string; stderr: string };
    return { status, out: `${stdout}${stderr}` };
  }
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// Spelled in pieces so this file does not read as an engine check itself.
const IS_SQLITE = ['isSql', 'ite(platform)'].join('');
const IS_POSTGRES = ['isPost', 'gres(p)'].join('');
const INSTANCE = ['x instanceof ', 'SqlitePlatform'].join('');

describe('lint:engine-dispatch', () => {
  it('ENGDISP-001: counts the platform checks and instanceof tests, not the ones in comments', () => {
    expect(countEngineDispatch(`if (${IS_SQLITE}) a(); else if (${IS_POSTGRES}) b();`)).toBe(2);
    expect(countEngineDispatch(`const y = ${INSTANCE};`)).toBe(1);
    const BY_NAME = ["if (readEnv().db.engine === 'post", 'gres\') a(); if (engine.id !== "sql', 'ite") b();'].join('');
    expect(countEngineDispatch(BY_NAME)).toBe(2);
    expect(countEngineDispatch("if (user.id === 'admin') a();")).toBe(0);
    expect(countEngineDispatch(`// ${IS_SQLITE}\n/* ${INSTANCE} */\nconst ok = 1;`)).toBe(0);
  });

  it.each([
    ['a destructured name', ["const { engine } = readEnv().db; if (engine === 'post", "gres') a();"].join('')],
    ['the literal on the left', ["if ('sql", "ite' !== kind) a();"].join('')],
    ['a switch', ["switch (readEnv().db.engine) { case 'post", "gres': a(); }"].join('')],
    ['instanceof on a driver', ['if (em.getDriver() instanceof PostgreSql', 'Driver) a();'].join('')],
    ['instanceof on our own driver', ['if (d instanceof TrekPostgreSql', 'Driver) a();'].join('')],
    ['a comparison with a driver class', ['if (config.driver !== SharedSqlite', 'Driver) a();'].join('')],
  ])('ENGDISP-005: counts an engine check spelled as %s', (_what, code) => {
    expect(countEngineDispatch(code)).toBe(1);
    const domain = run(serverRoot({ 'src/nest/trips/trips.service.ts': `${code}\n` }));
    expect(domain.status).toBe(1);
    expect(domain.out).toContain('src/nest/trips/trips.service.ts');
    expect(domain.out).toContain('src/db/engine/');
  });

  it('ENGDISP-006: leaves names that only look like an engine alone', () => {
    expect(countEngineDispatch("if (format === 'sqlite3') a(); const label = 'postgres';")).toBe(0);
    expect(countEngineDispatch('if (driver === LocalDriver) a(); if (x instanceof S3Driver) b();')).toBe(0);
  });

  it('ENGDISP-002: the dialect layer and the engine port may dispatch, any other file may not', () => {
    const text = `export const x = ${IS_SQLITE};\n`;
    expect(run(serverRoot({ 'src/db/dialect/a.ts': text, 'src/db/engine/sqlite/b.ts': text })).status).toBe(0);
    const domain = run(serverRoot({ 'src/nest/trips/trips.service.ts': text }));
    expect(domain.status).toBe(1);
    expect(domain.out).toContain('src/nest/trips/trips.service.ts');
  });

  it('ENGDISP-003: a baselined file is held at its count, and --update only lowers it', () => {
    const text = `export const x = ${IS_SQLITE};\n`;
    const file = 'src/db/repositories/A.repository.ts';
    expect(run(serverRoot({ [file]: text }, { [file]: 1 })).status).toBe(0);
    expect(run(serverRoot({ [file]: `${text}${text}` }, { [file]: 1 })).status).toBe(1);
    const stale = serverRoot({ [file]: 'export const x = 1;\n' }, { [file]: 1 });
    expect(run(stale).status).toBe(1);
    expect(run(stale, '--update').status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(stale, BASELINE), 'utf8'))).toEqual({ counts: {} });
  });

  it('ENGDISP-004: the repository holds its committed baseline', () => {
    expect(run(SERVER_ROOT).status).toBe(0);
  });
});
