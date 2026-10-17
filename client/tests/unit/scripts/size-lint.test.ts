import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { check, groupOf, sizeOf, WIDTH } from '../../../scripts/lib/size.mjs';
import { lines, ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/size-baseline.json';

function run(baseline: Record<string, number>, files: Record<string, string>, update = false) {
  tree = ratchetTree({
    [BASELINE]: JSON.stringify(baseline),
    'tests/keep.test.ts': lines(1),
    'e2e/keep.spec.ts': lines(1),
    ...files,
  });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, ...tree.out });
}

describe('lint:size', () => {
  it('SIZE-001: counts lines as an editor wraps them, so joining lines does not shrink a file', () => {
    expect(sizeOf('')).toBe(0);
    expect(sizeOf('a\nb\n')).toBe(2);
    expect(sizeOf('a\nb')).toBe(2);
    expect(sizeOf('a\r\nb\r\n')).toBe(2);
    expect(sizeOf('x'.repeat(WIDTH))).toBe(1);
    expect(sizeOf('x'.repeat(WIDTH + 1))).toBe(2);
    expect(sizeOf(`${'x'.repeat(3760)}\n`)).toBe(Math.ceil(3760 / WIDTH));
    expect(sizeOf('\n\n')).toBe(2);
  });

  it('SIZE-002: sorts files into source, stylesheet and test, each with its own limit', () => {
    expect(groupOf('src/a/B.tsx')).toMatchObject({ name: 'source', limit: 1000 });
    expect(groupOf('src/index.css')).toMatchObject({ name: 'stylesheet', limit: 1000 });
    expect(groupOf('src/a/B.test.tsx')).toMatchObject({ name: 'test', limit: 2000 });
    expect(groupOf('tests/unit/x.ts')).toMatchObject({ name: 'test', limit: 2000 });
    expect(groupOf('e2e/help/fixtures.ts')).toMatchObject({ name: 'test', limit: 2000 });
    expect(groupOf('e2e/server-launch.mjs')).toBeNull();
    expect(groupOf('src/a/notes.md')).toBeNull();
  });

  it('SIZE-003: passes files within their limits', () => {
    const code = run({}, { 'src/a.ts': lines(1000), 'src/a.css': lines(1000), 'tests/a.test.ts': lines(2000) });
    expect(code).toBe(0);
    expect(tree.error).toEqual([]);
  });

  it('SIZE-004: fails a new source file past 1000 lines', () => {
    expect(run({}, { 'src/big.tsx': lines(1001) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/big\.tsx: 1001 lines .*limit for a source file is 1000/);
  });

  it('SIZE-005: fails a file that packs its code into long lines', () => {
    expect(run({}, { 'src/packed.tsx': `${'x'.repeat(WIDTH * 2)}\n`.repeat(600) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/packed\.tsx: 1200 lines/);
  });

  it('SIZE-006: covers stylesheets and tests', () => {
    expect(run({}, { 'src/styles/a.css': lines(1001), 'src/A.test.tsx': lines(2001) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/styles\/a\.css/);
    expect(tree.error.join('\n')).toMatch(/src\/A\.test\.tsx: 2001 lines .*test file is 2000/);
  });

  it('SIZE-010: covers the Playwright specs and fixtures under e2e/', () => {
    const files = { 'src/a.ts': lines(1), 'e2e/help/fixtures.ts': lines(2001), 'e2e/a.spec.ts': lines(2000) };
    expect(run({}, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/e2e\/help\/fixtures\.ts: 2001 lines .*test file is 2000/);
    expect(tree.error.join('\n')).not.toMatch(/e2e\/a\.spec\.ts/);
  });

  it('SIZE-007: holds a baselined file at its entry and fails it once it grows', () => {
    expect(run({ 'src/big.ts': 1200 }, { 'src/big.ts': lines(1200) })).toBe(0);
    tree.remove();
    expect(run({ 'src/big.ts': 1200 }, { 'src/big.ts': lines(1201) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/its baseline is 1200/);
  });

  it('SIZE-008: --update lowers an entry, drops one back under the limit and never raises', () => {
    run(
      { 'src/shrank.ts': 1500, 'src/back.ts': 1200, 'src/grew.ts': 1100 },
      {
        'src/shrank.ts': lines(1300),
        'src/back.ts': lines(900),
        'src/grew.ts': lines(1150),
      },
      true
    );
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual({
      'src/shrank.ts': 1300,
      'src/grew.ts': 1100,
    });
    expect(tree.error.join('\n')).toMatch(/src\/grew\.ts: 1150 lines/);
  });

  it('SIZE-011: fails an entry above the file it holds, or for a file that is gone, until --update', () => {
    expect(run({ 'src/big.ts': 1200 }, { 'src/big.ts': lines(1100) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /src\/big\.ts is held at 1200 in scripts\/size-baseline\.json, but there are 1100 now/
    );
    expect(tree.error.join('\n')).toMatch(/npm run lint:size -- --update/);
    tree.remove();
    // A deleted file would hand its allowance to the next file at its path.
    expect(run({ 'src/gone.ts': 1200 }, { 'src/a.ts': lines(1) })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/gone\.ts is held at 1200 .*but the file is gone/);
    tree.remove();
    // Back under the limit is stale too: the entry would let it grow past the limit again.
    expect(run({ 'src/big.ts': 1200 }, { 'src/big.ts': lines(900) })).toBe(1);
    tree.remove();
    expect(run({ 'src/big.ts': 1200, 'src/gone.ts': 1200 }, { 'src/big.ts': lines(1100) }, true)).toBe(0);
  });

  it('SIZE-009: a broken baseline stops the check', () => {
    tree = ratchetTree({ [BASELINE]: '{', 'src/a.ts': lines(1), 'tests/a.ts': lines(1), 'e2e/a.ts': lines(1) });
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).toThrow(RatchetError);
  });
});
