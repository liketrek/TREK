/**
 * scripts/import-boundaries.mjs is the CI gate that keeps the server's import
 * graph from getting worse: no new load-time cycle, no new dependency between
 * two domains that already depend on each other, no shared-kernel file
 * importing a domain, no new reach into another domain's internals, and no
 * src/db file importing src/nest. This runs the real script as a child process
 * against throwaway server roots (--dir), proving each rule fails on a
 * violation, that what the rules deliberately ignore stays ignored, and that a
 * broken setup stops the run instead of passing it.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/import-boundaries.mjs');

const EMPTY = { fileCycles: [], domainCycles: [], sharedImportsDomain: [], domainInternals: [], dbImportsNest: [], foreignRepositories: [] };

interface ExecError {
  status: number | null;
  stdout: string;
  stderr: string;
}

const roots: string[] = [];

/** A server root with the given src/ files; `baseline: null` writes no baseline file. */
function serverRoot(files: Record<string, string>, baseline: unknown = EMPTY): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-boundaries-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'src'), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, 'src', file)), { recursive: true });
    writeFileSync(path.join(dir, 'src', file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/import-boundaries-baseline.json'),
      typeof baseline === 'string' ? baseline : JSON.stringify(baseline),
    );
  }
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
    const { status, stdout, stderr } = err as ExecError;
    return { status, out: `${stdout}${stderr}` };
  }
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('import-boundaries.mjs', () => {
  it('BOUND-001: a clean graph passes', () => {
    const dir = serverRoot({
      'nest/a/a.service.ts': "import { B } from '../b/b.service';\nexport class A { b = B; }\n",
      'nest/b/b.service.ts': "import { helper } from './b.helpers';\nexport class B { h = helper; }\n",
      'nest/b/b.helpers.ts': 'export const helper = 1;\n',
    });
    const { status, out } = run(dir);
    expect(status).toBe(0);
    expect(out).toContain('fileCycles 0');
  });

  it('BOUND-002: fails on a new load-time file cycle (the "imports[1] is undefined" shape)', () => {
    const dir = serverRoot({
      'nest/a/a.module.ts': "import { BModule } from '../b/b.module';\nexport class AModule { i = [BModule]; }\n",
      'nest/b/b.module.ts': "import { AModule } from '../a/a.module';\nexport class BModule { i = [AModule]; }\n",
    });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('FAIL  fileCycles: nest/a/a.module.ts -> nest/b/b.module.ts');
    expect(out).toContain('FAIL  fileCycles: nest/b/b.module.ts -> nest/a/a.module.ts');
    expect(out).toContain('FAIL  domainCycles: a -> b');
  });

  it('BOUND-003: type-only and lazy imports cannot close a cycle', () => {
    const dir = serverRoot({
      'x/one.ts': "import { Two } from './two';\nexport class One { t = Two; }\n",
      'x/two.ts': [
        "import type { One } from './one';",
        "import { type One as O2 } from './one';",
        "export type { One as Re } from './one';",
        'export class Two {',
        "  load() { return require('./one'); }",
        "  later() { return import('./one'); }",
        '}',
        'export type T = One | O2;',
        '',
      ].join('\n'),
    });
    expect(run(dir).status).toBe(0);
    // A top-level require is eager and does close it.
    const eager = serverRoot({
      'x/one.ts': "import { Two } from './two';\nexport class One { t = Two; }\n",
      'x/two.ts': "const one = require('./one');\nexport class Two { o = one; }\n",
    });
    expect(run(eager).status).toBe(1);
  });

  it('BOUND-004: MikroORM entity relations that point both ways are not cycles', () => {
    const dir = serverRoot({
      'db/entities/Trips.entity.ts': "import { Days } from './Days.entity';\nexport class Trips { d = () => Days; }\n",
      'db/entities/Days.entity.ts': "import { Trips } from './Trips.entity';\nexport class Days { t = () => Trips; }\n",
    });
    expect(run(dir).status).toBe(0);
  });

  it('BOUND-005: fails on a reach into another domain internals, allows its public surface', () => {
    const files = {
      'nest/b/b.service.ts': 'export class B {}\n',
      'nest/b/b.helpers.ts': 'export const h = 1;\n',
      'nest/b/b.types.ts': 'export interface T { x: number }\n',
      'nest/common/row-id.ts': 'export const id = 1;\n',
      'nest/audit/client-ip.ts': 'export const Rpc = 1;\n',
    };
    const ok = serverRoot({
      ...files,
      'nest/a/a.service.ts': [
        "import { B } from '../b/b.service';",
        "import type { T } from '../b/b.types';",
        "import { id } from '../common/row-id';",
        "import { Rpc } from '../audit/client-ip';",
        'export const a: [unknown, T | null, number, number] = [B, null, id, Rpc];',
        '',
      ].join('\n'),
    });
    expect(run(ok).status).toBe(0);

    // Type-only still counts: it couples A to B's private shapes all the same.
    const bad = serverRoot({
      ...files,
      'nest/a/sub/a.thing.ts': "import type { h } from '../../b/b.helpers';\nexport type X = typeof h;\n",
    });
    const { status, out } = run(bad);
    expect(status).toBe(1);
    expect(out).toContain('FAIL  domainInternals: a -> b/b.helpers.ts');
  });

  it('BOUND-006: fails when a shared-kernel file imports a domain', () => {
    const dir = serverRoot({
      'nest/auth/jwt-auth.guard.ts': 'export class JwtAuthGuard {}\n',
      'nest/common/validate.ts':
        "import { JwtAuthGuard } from '../auth/jwt-auth.guard';\nexport const g = JwtAuthGuard;\n",
    });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('FAIL  sharedImportsDomain: nest/common/validate.ts -> nest/auth/jwt-auth.guard.ts');
  });

  it('BOUND-007: fails when src/db imports from src/nest', () => {
    const dir = serverRoot({
      'nest/database/request-context.ts': 'export const ctx = 1;\n',
      'db/orm.ts': "import { ctx } from '../nest/database/request-context';\nexport const o = ctx;\n",
    });
    const { status, out } = run(dir);
    expect(status).toBe(1);
    expect(out).toContain('FAIL  dbImportsNest: db/orm.ts -> nest/database/request-context.ts');
  });

  it('BOUND-008: a baselined violation passes; a gone one fails and --update drops it without adding', () => {
    const files = {
      'nest/b/b.helpers.ts': 'export const h = 1;\n',
      'nest/a/a.service.ts': "import { h } from '../b/b.helpers';\nexport const a = h;\n",
      'nest/c/c.service.ts': "import { h } from '../b/b.helpers';\nexport const c = h;\n",
    };
    const baseline = { ...EMPTY, domainInternals: ['a -> b/b.helpers.ts', 'z -> b/gone.ts'] };
    const dir = serverRoot(files, baseline);
    const check = run(dir);
    expect(check.status).toBe(1);
    expect(check.out).toContain('FAIL  domainInternals: c -> b/b.helpers.ts');
    expect(check.out).not.toContain('FAIL  domainInternals: a -> b/b.helpers.ts');
    expect(check.out).toContain(
      'FAIL  domainInternals: z -> b/gone.ts is in scripts/import-boundaries-baseline.json but no longer occurs.',
    );
    expect(check.out).toContain('npm run lint:boundaries -- --update');

    expect(run(dir, '--update').status).toBe(1);
    const written: unknown = JSON.parse(
      readFileSync(path.join(dir, 'scripts/import-boundaries-baseline.json'), 'utf8'),
    );
    expect(written).toEqual({ ...EMPTY, domainInternals: ['a -> b/b.helpers.ts'] });
  });

  it('BOUND-011: a stale entry alone fails, and passes once --update dropped it', () => {
    const files = { 'nest/a/a.service.ts': 'export const a = 1;\n' };
    const dir = serverRoot(files, { ...EMPTY, domainCycles: ['a -> b', 'b -> a'] });
    const check = run(dir);
    expect(check.status).toBe(1);
    expect(check.out).toContain(
      'FAIL  domainCycles: a -> b is in scripts/import-boundaries-baseline.json but no longer occurs.',
    );
    expect(run(dir, '--update').status).toBe(0);
    expect(run(dir).status).toBe(0);
  });

  it('BOUND-009: fails closed on a missing or malformed baseline, a missing src/ and an unresolvable import', () => {
    const file = { 'x/a.ts': 'export const a = 1;\n' };
    expect(run(serverRoot(file, null)).out).toContain('cannot be read');
    expect(run(serverRoot(file, null)).status).toBe(1);
    expect(run(serverRoot(file, '{')).status).toBe(1);
    expect(run(serverRoot(file, { ...EMPTY, fileCycles: 'none' })).status).toBe(1);
    const { domainCycles: _dropped, ...missingRule } = EMPTY;
    expect(run(serverRoot(file, missingRule)).status).toBe(1);
    expect(run(serverRoot(file, { ...EMPTY, newRule: [] })).status).toBe(1);

    const noSrc = serverRoot(file);
    rmSync(path.join(noSrc, 'src'), { recursive: true });
    expect(run(noSrc).out).toContain('src/ does not exist');

    const broken = serverRoot({ 'x/a.ts': "import { b } from './missing';\nexport const a = b;\n" });
    const res = run(broken);
    expect(res.status).toBe(1);
    expect(res.out).toContain('unresolved import x/a.ts -> ./missing');
  });

  it('BOUND-012: fails on a repository another domain owns, passes the owner and a baselined entry', () => {
    const owners = JSON.stringify({ Trips: 'trips', Todos: 'todo' });
    const files = {
      'nest/trips/trips.service.ts': '@InjectRepository(Trips) class S {}\nexport { S };\n',
      'nest/todo/todo.service.ts': '@InjectRepository(Todos) class T {}\n@InjectRepository(Trips) class U {}\nexport { T, U };\n',
    };
    const withOwners = (baseline: unknown) => {
      const dir = serverRoot(files, baseline);
      writeFileSync(path.join(dir, 'scripts/repository-owners.json'), owners);
      return dir;
    };
    const bad = run(withOwners(EMPTY));
    expect(bad.status).toBe(1);
    expect(bad.out).toContain('FAIL  foreignRepositories: todo -> Trips (owned by trips)');
    expect(bad.out).not.toContain('trips -> Trips');
    expect(bad.out).not.toContain('todo -> Todos');
    expect(run(withOwners({ ...EMPTY, foreignRepositories: ['todo -> Trips (owned by trips)'] })).status).toBe(0);
  });

  it('BOUND-013: fails closed on an injected entity without an owner', () => {
    const dir = serverRoot({ 'nest/a/a.service.ts': '@InjectRepository(Mystery) class A {}\nexport { A };\n' });
    const res = run(dir);
    expect(res.status).toBe(1);
    expect(res.out).toContain('no owner for injected entity Mystery (nest/a/a.service.ts)');
  });

  it('BOUND-010: resolves .js specifiers and index files', () => {
    const dir = serverRoot({
      'x/a.ts': "import { b } from './b.js';\nimport { c } from './c';\nexport const a = [b, c];\n",
      'x/b.ts': 'export const b = 1;\n',
      'x/c/index.ts': 'export const c = 1;\n',
    });
    expect(run(dir).status).toBe(0);
  });
});
