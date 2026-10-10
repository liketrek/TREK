import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { check, MIN_LINES } from '../../../scripts/lib/dup.mjs';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/dup-baseline.json';

/**
 * n lines of about twenty tokens each, every line different, so a block of
 * MIN_LINES + 4 of them is long enough to count as a copy and repeats nothing
 * inside itself. Two blocks with the same name are the same code.
 */
function block(name = 'shared', n = MIN_LINES + 4): string {
  return Array.from({ length: n }, (_, i) => `export const ${name}${i} = compute(${i}, 'x', [1, 2, 3]);\n`).join('');
}

function run(
  baseline: Record<string, number> | string,
  files: Record<string, string>,
  options: { update?: boolean; list?: boolean } = {}
) {
  tree = ratchetTree({
    [BASELINE]: typeof baseline === 'string' ? baseline : JSON.stringify(baseline),
    ...files,
  });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), ...options, ...tree.out });
}

describe('lint:dup', () => {
  it('DUP-001: fails both sides of a block two files share, naming the other side', async () => {
    expect(await run({}, { 'src/a/View.tsx': block(), 'src/b/MView.tsx': block() })).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(
      /FAIL {2}src\/a\/View\.tsx: 14 line\(s\) in copied blocks, baseline 0:\n {8}1-14 = src\/b\/MView\.tsx:1-14/
    );
    expect(out).toMatch(
      /FAIL {2}src\/b\/MView\.tsx: 14 line\(s\) in copied blocks, baseline 0:\n {8}1-14 = src\/a\/View\.tsx:1-14/
    );
    expect(out).toMatch(/one shared hook or module/);
    expect(tree.log.join('\n')).toMatch(/dup: 28 line\(s\) in copied blocks in 2 file\(s\), baseline allows 0/);
  });

  it('DUP-002: passes different code, and a repeat too short in lines or tokens to count', async () => {
    const shortLines = block('k', MIN_LINES - 1);
    const fewTokens = Array.from({ length: MIN_LINES + 4 }, (_, i) => `s${i}()\n`).join('');
    const files = {
      'src/a.ts': block('a') + fewTokens,
      'src/b.ts': block('b') + fewTokens,
      'src/c.ts': shortLines,
      'src/d.ts': shortLines,
    };
    expect(await run({}, files)).toBe(0);
    expect(tree.error).toEqual([]);
  });

  it('DUP-003: reads .ts and .tsx as one language, so a hook and a view that repeat it are a copy', async () => {
    expect(await run({}, { 'src/components/X/useThing.ts': block(), 'src/mobile/MThing.tsx': block() })).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(/FAIL {2}src\/components\/X\/useThing\.ts: 14 line/);
    expect(out).toMatch(/FAIL {2}src\/mobile\/MThing\.tsx: 14 line/);
  });

  it('DUP-004: leaves tests and declaration files out, as SonarCloud does', async () => {
    const files = {
      'src/a.test.tsx': block(),
      'src/b.test.ts': block(),
      'src/c.d.ts': block(),
      'src/real.ts': block('real'),
    };
    expect(await run({}, files)).toBe(0);
    expect(tree.error).toEqual([]);
  });

  it('DUP-005: counts a block one file repeats inside itself', async () => {
    expect(await run({}, { 'src/a.ts': block() + block('mid') + block() })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/FAIL {2}src\/a\.ts: 28 line\(s\)[^\n]*\n {8}1-14 = src\/a\.ts:29-42/);
  });

  it('DUP-006: holds a baselined file at its entry and fails a new copy or a grown one', async () => {
    const held = { 'src/a.ts': 14, 'src/b.ts': 14 };
    expect(await run(held, { 'src/a.ts': block(), 'src/b.ts': block() })).toBe(0);
    tree.remove();
    // A third copy of code that is already copied is still a new copy.
    expect(await run(held, { 'src/a.ts': block(), 'src/b.ts': block(), 'src/c.ts': block() })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/FAIL {2}src\/c\.ts: 14 line\(s\) in copied blocks, baseline 0/);
    expect(tree.error.join('\n')).not.toMatch(/FAIL {2}src\/[ab]\.ts/);
    tree.remove();
    const grown = block('x') + block('y');
    expect(await run(held, { 'src/a.ts': grown, 'src/b.ts': grown })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/FAIL {2}src\/a\.ts: 28 line\(s\) in copied blocks, baseline 14/);
  });

  it('DUP-007: --update lowers an entry, drops one without copies and never raises', async () => {
    const baseline = { 'src/a.ts': 30, 'src/b.ts': 10, 'src/gone.ts': 5, 'src/clean.ts': 10 };
    const files = { 'src/a.ts': block(), 'src/b.ts': block(), 'src/clean.ts': block('clean') };
    expect(await run(baseline, files, { update: true })).toBe(1);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual({ 'src/a.ts': 14, 'src/b.ts': 10 });
    expect(tree.error.join('\n')).toMatch(/FAIL {2}src\/b\.ts: 14 line\(s\) in copied blocks, baseline 10/);
  });

  it('DUP-008: fails an entry above what its file holds, or for a file that is gone, until --update', async () => {
    expect(await run({ 'src/a.ts': 20, 'src/b.ts': 14 }, { 'src/a.ts': block(), 'src/b.ts': block() })).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /src\/a\.ts is held at 20 in scripts\/dup-baseline\.json, but there are 14 now/
    );
    expect(tree.error.join('\n')).toMatch(/npm run lint:dup -- --update/);
    tree.remove();
    expect(await run({ 'src/gone.ts': 14 }, { 'src/a.ts': block('a') })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/gone\.ts is held at 14 .*but the file is gone/);
    tree.remove();
    // A file whose copies are all gone keeps no allowance either.
    expect(await run({ 'src/a.ts': 14 }, { 'src/a.ts': block('a') })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/a\.ts is held at 14 .*but there are 0 now/);
    tree.remove();
    expect(await run({ 'src/a.ts': 14, 'src/gone.ts': 14 }, { 'src/a.ts': block('a') }, { update: true })).toBe(0);
  });

  it('DUP-009: counts a file with CRLF line ends the same as one with LF', async () => {
    expect(await run({}, { 'src/a.ts': block().replace(/\n/g, '\r\n'), 'src/b.ts': block() })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/FAIL {2}src\/a\.ts: 14 line\(s\)[^\n]*\n {8}1-14 = src\/b\.ts:1-14/);
  });

  it('DUP-010: --list prints every copied block with its other side', async () => {
    expect(
      await run({ 'src/a.ts': 14, 'src/b.ts': 14 }, { 'src/a.ts': block(), 'src/b.ts': block() }, { list: true })
    ).toBe(0);
    expect(tree.log).toEqual([
      'src/a.ts (14, baseline 14)',
      '  1-14 = src/b.ts:1-14',
      'src/b.ts (14, baseline 14)',
      '  1-14 = src/a.ts:1-14',
      'dup: 28 line(s) in copied blocks in 2 file(s), baseline allows 28',
    ]);
  });

  it('DUP-011: a broken baseline or a missing src/ stops the check', async () => {
    await expect(run('{', { 'src/a.ts': block('a') })).rejects.toThrow(RatchetError);
    tree.remove();
    await expect(run({}, { 'tests/a.ts': block('a') })).rejects.toThrow(/src\/ does not exist/);
  });
});
