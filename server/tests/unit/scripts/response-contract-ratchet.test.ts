/**
 * scripts/response-contract-ratchet.mjs holds the route handlers without a
 * @ResponseContract to their baseline. It runs the real script against
 * throwaway server roots (--dir) and once on this repository, so the committed
 * baseline is checked by the unit suite too.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.join(__dirname, '../../../scripts/response-contract-ratchet.mjs');
const SERVER_ROOT = path.join(__dirname, '../../..');
const NEST = 'src/nest';

const controller = (...handlers: string[]) =>
  `@Controller('x')\nexport class XController {\n${handlers.join('\n')}\n}\n`;
const bare = (name: string) => `  @Get('${name}')\n  ${name}() {\n    return {};\n  }\n`;
const contracted = (name: string) =>
  `  @Get('${name}')\n  @ResponseContract(schema)\n  async ${name}() {\n    return {};\n  }\n`;
const exempt = (name: string) =>
  `  // response-contract-exempt: streams through @Res()\n  @Get('${name}')\n  ${name}(@Res() res: Response) {\n    res.end();\n  }\n`;

const roots: string[] = [];

function serverRoot(files: Record<string, string>, baseline: unknown = { counts: {} }): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'trek-response-contracts-'));
  roots.push(dir);
  mkdirSync(path.join(dir, NEST), { recursive: true });
  mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  }
  if (baseline !== null) {
    writeFileSync(
      path.join(dir, 'scripts/response-contract-baseline.json'),
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
    const { status, stdout, stderr } = err as { status: number | null; stdout: string; stderr: string };
    return { status, out: `${stdout}${stderr}` };
  }
}

afterEach(() => {
  for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('response-contract-ratchet.mjs', () => {
  it('RC-001: passes when every handler declares its contract or is exempt', () => {
    const { status, out } = run(
      serverRoot({ [`${NEST}/x/x.controller.ts`]: controller(contracted('a'), exempt('b')) }),
    );
    expect(status).toBe(0);
    expect(out).toContain('response-contracts: 2 of 2 route handler(s) covered (100.0 %)');
  });

  it('RC-002: fails a new file holding a handler without one, and ignores plain methods', () => {
    const helper = '  private helper() {\n    return 1;\n  }\n';
    const { status, out } = run(serverRoot({ [`${NEST}/x/x.controller.ts`]: controller(bare('a'), helper) }));
    expect(status).toBe(1);
    expect(out).toContain(
      `FAIL  ${NEST}/x/x.controller.ts: 1 route handler(s) without @ResponseContract, a file without a baseline entry may hold none.`,
    );
  });

  it('RC-003: holds a baselined file to its entry', () => {
    const file = `${NEST}/x/x.controller.ts`;
    const baseline = { counts: { [file]: 2 } };
    const grown = run(serverRoot({ [file]: controller(bare('a'), bare('b'), bare('c')) }, baseline));
    expect(grown.status).toBe(1);
    expect(grown.out).toContain('its baseline is 2.');
    expect(run(serverRoot({ [file]: controller(bare('a'), bare('b'), contracted('c')) }, baseline)).status).toBe(0);
  });

  it('RC-004: counts every route decorator, whatever the verb', () => {
    const verbs = ['Post', 'Put', 'Patch', 'Delete', 'All'].map(
      (verb, i) => `  @${verb}('v${i}')\n  v${i}() {\n    return {};\n  }\n`,
    );
    const { out } = run(serverRoot({ [`${NEST}/x/x.controller.ts`]: controller(...verbs) }));
    expect(out).toContain('0 of 5 route handler(s) covered');
  });

  it('RC-005: an entry above its file fails until --update lowers it, and --update never raises or adds one', () => {
    const a = `${NEST}/a/a.controller.ts`;
    const b = `${NEST}/b/b.controller.ts`;
    const dir = serverRoot(
      { [a]: controller(bare('x')), [b]: controller(bare('x'), bare('y'), bare('z')) },
      { counts: { [a]: 3, [`${NEST}/gone/gone.controller.ts`]: 1, [b]: 2 } },
    );
    const stale = run(dir);
    expect(stale.status).toBe(1);
    expect(stale.out).toContain(`FAIL  ${a} is held at 3`);
    expect(stale.out).toContain(`FAIL  ${NEST}/gone/gone.controller.ts is held at 1`);

    run(dir, '--update');
    const lowered = JSON.parse(readFileSync(path.join(dir, 'scripts/response-contract-baseline.json'), 'utf8')) as {
      counts: Record<string, number>;
    };
    expect(lowered.counts).toEqual({ [a]: 1, [b]: 2 });
  });

  it('RC-006: a missing or malformed baseline, a missing tree or a tree without handlers stops the run', () => {
    const file = { [`${NEST}/x/x.controller.ts`]: controller(contracted('a')) };
    expect(run(serverRoot(file, null)).out).toContain('cannot be read');
    expect(run(serverRoot(file, '{"counts":{"x":0}}')).out).toContain('expected a whole number above 0');
    expect(run(serverRoot(file, '[]')).out).toContain('must be an object with a "counts" object');
    expect(run(serverRoot({ [`${NEST}/x/x.service.ts`]: 'export class X {}\n' })).out).toContain(
      'no route handler found',
    );
    const empty = mkdtempSync(path.join(tmpdir(), 'trek-response-contracts-'));
    roots.push(empty);
    expect(run(empty).out).toContain('does not exist');
  });

  it('RC-007: this repository holds its committed baseline', () => {
    const { status, out } = run(SERVER_ROOT);
    expect(out).toContain('response-contracts:');
    expect(status).toBe(0);
  });
});
