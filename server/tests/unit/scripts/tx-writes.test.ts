/**
 * scripts/tx-writes.mjs is the CI gate that keeps a method from issuing two
 * writes outside one transaction. A gate nobody tests passes forever once it
 * breaks, so this runs the real script as a child process against throwaway
 * server roots (--dir): small source trees whose counts are known, plus the
 * baseline cases the ratchet has to get right.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/tx-writes.mjs');

interface ExecError {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** A repository with two writes and a read, the way the real ones spell them. */
const REPOSITORY = `
export class FooRepository {
  kysely(): any { return null; }
  async insertFoo() { return await this.kysely().insertInto('foo').values({}).execute(); }
  async deleteFoo() { return await this.nativeDelete({ id: 1 }); }
  async findFoo() { return await this.kysely().selectFrom('foo').selectAll().execute(); }
}
`;

const SERVICE_FILE = 'src/nest/foo/foo.service.ts';
const KEY = (method: string) => `${SERVICE_FILE}#FooService.${method}`;

function service(body: string): string {
  return `
export class FooService {
  constructor(private readonly foos: FooRepository, private readonly uow: UnitOfWork) {}
${body}
}
`;
}

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baseline: unknown = {}): string {
  // null writes no baseline file at all.
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-tx-writes-'));
  roots.push(dir);
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries({ 'src/db/repositories/Foo.repository.ts': REPOSITORY, ...files })) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/tx-writes-baseline.json'),
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

/** What --list reports for a tree, as { key: units }. */
function listed(dir: string): Record<string, number> {
  const { status, out } = run(dir, '--list');
  expect(status).toBe(0);
  return Object.fromEntries(
    out
      .split('\n')
      .filter((line) => /^\d+\t/.test(line))
      .map((line) => {
        const [n, key] = line.split('\t');
        return [key, Number(n)];
      }),
  );
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('tx-writes.mjs: what counts', () => {
  it('TXW-001: two writes in a row are reported, one transaction around them is not', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  async twoWrites() { await this.foos.insertFoo(); await this.foos.deleteFoo(); }
  async wrapped() { await this.uow.transactional(async () => { await this.foos.insertFoo(); await this.foos.deleteFoo(); }); }
  async oneWriteAndReads() { await this.foos.findFoo(); await this.foos.insertFoo(); await this.foos.findFoo(); }`),
    });
    expect(listed(dir)).toEqual({ [KEY('twoWrites')]: 2 });
  });

  it('TXW-002: a write in a loop or a forEach callback counts twice', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  async loop(ids: number[]) { for (const id of ids) await this.foos.insertFoo(); }
  async each(ids: number[]) { ids.forEach(async () => { await this.foos.deleteFoo(); }); }`),
    });
    expect(listed(dir)).toEqual({ [KEY('loop')]: 2, [KEY('each')]: 2 });
  });

  it('TXW-003: of two branches only the larger counts, and an early return competes with the rest', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  async either(flag: boolean) { if (flag) await this.foos.insertFoo(); else await this.foos.deleteFoo(); }
  async ternary(flag: boolean) { return flag ? await this.foos.insertFoo() : await this.foos.deleteFoo(); }
  async early(flag: boolean) { if (flag) { await this.foos.insertFoo(); return; } await this.foos.deleteFoo(); }
  async both(flag: boolean) { if (flag) await this.foos.insertFoo(); await this.foos.deleteFoo(); }`),
    });
    expect(listed(dir)).toEqual({ [KEY('both')]: 2 });
  });

  it('TXW-004: a helper whose every call sits in a transaction is not reported, one called bare is', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  private async pair() { await this.foos.insertFoo(); await this.foos.deleteFoo(); }
  private async pairToo() { await this.foos.insertFoo(); await this.foos.deleteFoo(); }
  async caller() { await this.uow.transactional(() => this.pair()); }
  async inner() { await this.pairToo(); }
  async outer() { await this.uow.transactional(() => this.inner()); }
  async bare() { await this.pairToo(); }`),
    });
    // pairToo has one bare call path (bare), so it is reported; bare itself
    // counts it as a single unit, the fault being reported where it lives.
    expect(listed(dir)).toEqual({ [KEY('pairToo')]: 2 });
  });

  it('TXW-005: two calls to methods that are each one transaction are reported at the caller', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  async a() { await this.uow.transactional(async () => { await this.foos.insertFoo(); await this.foos.deleteFoo(); }); }
  async b() { await this.foos.insertFoo(); }`),
      'src/nest/foo/foo.controller.ts': `
export class FooController {
  constructor(private readonly foo: FooService) {}
  async create() { await this.foo.a(); await this.foo.b(); }
  async one() { await this.foo.a(); }
}
`,
    });
    expect(listed(dir)).toEqual({ 'src/nest/foo/foo.controller.ts#FooController.create': 2 });
  });

  it('TXW-006: @txStandalone adds nothing to its callers, @txIndependent is not reported itself', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  /** @txStandalone an audit row. */
  async audit() { await this.foos.insertFoo(); }
  async withAudit() { await this.foos.deleteFoo(); await this.audit(); }
  /**
   * @txIndependent one pass at a time.
   */
  async sweep(ids: number[]) { for (const id of ids) await this.foos.deleteFoo(); }`),
    });
    expect(listed(dir)).toEqual({});
  });

  it('TXW-007: a local helper counts where it is called, inside or outside the transaction', () => {
    const dir = serverRoot({
      [SERVICE_FILE]: service(`
  async inside() {
    const both = async () => { await this.foos.insertFoo(); await this.foos.deleteFoo(); };
    await this.uow.transactional(async () => { await both(); });
  }
  async outside() {
    const both = async () => { await this.foos.insertFoo(); await this.foos.deleteFoo(); };
    await both();
  }`),
    });
    expect(listed(dir)).toEqual({ [KEY('outside')]: 2 });
  });

  it('TXW-008: a repository method with two writes of its own is reported, raw SQL included', () => {
    const dir = serverRoot({
      'src/db/repositories/Bar.repository.ts': `
export class BarRepository {
  async reset() { await this.run('DELETE FROM bar'); await this.run('INSERT INTO bar (id) VALUES (1)'); }
  async peek() { await this.run('SELECT * FROM bar'); await this.run('SELECT 1'); }
  async run(sql: string) { return sql; }
}
`,
    });
    expect(listed(dir)).toEqual({ 'src/db/repositories/Bar.repository.ts#BarRepository.reset': 2 });
  });
});

describe('tx-writes.mjs: the baseline', () => {
  const TWO = service('  async twoWrites() { await this.foos.insertFoo(); await this.foos.deleteFoo(); }');
  const LOOP = service(
    '  async twoWrites(ids: number[]) { for (const id of ids) { await this.foos.insertFoo(); await this.foos.deleteFoo(); } }',
  );

  it('TXW-010: a method not in the baseline fails, naming the fix', () => {
    const { status, out } = run(serverRoot({ [SERVICE_FILE]: TWO }));
    expect(status).toBe(1);
    expect(out).toContain(`FAIL  ${KEY('twoWrites')}: 2 writes outside one transaction.`);
    expect(out).toContain('await this.uow.transactional');
  });

  it('TXW-011: a method held at its count passes, one past it fails', () => {
    expect(run(serverRoot({ [SERVICE_FILE]: TWO }, { [KEY('twoWrites')]: 2 })).status).toBe(0);
    const { status, out } = run(serverRoot({ [SERVICE_FILE]: LOOP }, { [KEY('twoWrites')]: 2 }));
    expect(status).toBe(1);
    expect(out).toContain('4 writes outside one transaction, its baseline is 2.');
  });

  it('TXW-012: an entry for a fixed method, or one above its count, fails until --update lowers it', () => {
    const fixed = serverRoot(
      {
        [SERVICE_FILE]: service(
          '  async twoWrites() { await this.uow.transactional(async () => { await this.foos.insertFoo(); await this.foos.deleteFoo(); }); }',
        ),
      },
      { [KEY('twoWrites')]: 2 },
    );
    const stale = run(fixed);
    expect(stale.status).toBe(1);
    expect(stale.out).toContain('but it is no longer reported.');

    const lower = serverRoot({ [SERVICE_FILE]: TWO }, { [KEY('twoWrites')]: 4 });
    expect(run(lower).out).toContain('but it has 2 now.');

    expect(run(fixed, '--update').status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(fixed, 'scripts/tx-writes-baseline.json'), 'utf8'))).toEqual({});
    expect(run(lower, '--update').status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(lower, 'scripts/tx-writes-baseline.json'), 'utf8'))).toEqual({
      [KEY('twoWrites')]: 2,
    });
  });

  it('TXW-013: --update never adds an entry', () => {
    const dir = serverRoot({ [SERVICE_FILE]: TWO });
    expect(run(dir, '--update').status).toBe(1);
    expect(JSON.parse(readFileSync(path.join(dir, 'scripts/tx-writes-baseline.json'), 'utf8'))).toEqual({});
  });

  it('TXW-014: a missing or malformed baseline, or a tree without src/, refuses to run', () => {
    expect(run(serverRoot({ [SERVICE_FILE]: TWO }, null)).out).toContain(
      'scripts/tx-writes-baseline.json cannot be read',
    );
    expect(run(serverRoot({}, '[]')).out).toContain('must be an object of methods to write counts');
    expect(run(serverRoot({}, { [KEY('x')]: 1 })).out).toContain('expected an integer of at least 2');
    const empty = mkdtempSync(path.join(tmpdir(), 'trek-tx-writes-'));
    roots.push(empty);
    const { status, out } = run(empty);
    expect(status).toBe(1);
    expect(out).toContain('src/ does not exist');
  });

  it('TXW-015: --explain names the line of every call that counted', () => {
    const { out } = run(serverRoot({ [SERVICE_FILE]: TWO }), '--explain');
    expect(out).toContain(`2\t${KEY('twoWrites')}`);
    expect(out).toMatch(/\t\t\d+: this\.foos\.insertFoo/);
    expect(out).toMatch(/\t\t\d+: this\.foos\.deleteFoo/);
  });
});
