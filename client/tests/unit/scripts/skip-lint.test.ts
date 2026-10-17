import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { check, modifiers } from '../../../scripts/lib/skips.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/skip-baseline.json';
const PASSING = "it('works', () => {})\n";

function run(baseline: Record<string, number>, files: Record<string, string>, update = false) {
  tree = ratchetTree({
    [BASELINE]: JSON.stringify(baseline),
    'src/a.test.ts': PASSING,
    'tests/b.test.ts': PASSING,
    'e2e/c.spec.ts': PASSING,
    ...files,
  });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, ...tree.out });
}

describe('lint:skips', () => {
  it('SKIPS-001: finds declared skips, todos and the x-shorthands', () => {
    const source = [
      "it.skip('a', () => {})",
      "describe.skip('b', () => {})",
      "test.todo('c')",
      "it.skip.each([1])('d %s', () => {})",
      "test.describe.skip('e', () => {})",
      "xit('f', () => {})",
      "it.concurrent.skip('g', () => {})",
    ].join('\n');
    expect(modifiers(source, 'x.test.ts').skipped.map((s: string) => s.split(':')[0])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('SKIPS-002: leaves run-time skips, skipIf/runIf, comments and strings alone', () => {
    const source = [
      "it.skipIf(process.platform === 'win32')('y', () => {})",
      "describe.runIf(hasS3)('z', () => {})",
      "// it.skip('commented out', () => {})",
      'const doc = "describe.only(\'in a string\')"',
      'ctx.skip()',
    ].join('\n');
    expect(modifiers(source, 'x.test.ts')).toEqual({ skipped: [], only: [] });
    const playwright = [
      "test.skip(!seed.collectionId, 'collections addon unavailable')",
      "test('x', async ({ page }) => { test.fixme(await page.isClosed(), 'flaky') })",
      "test.skip(({ browserName }) => browserName === 'webkit', 'no webkit')",
      "test.skip(false, 'never')",
    ].join('\n');
    expect(modifiers(playwright, 'e2e/x.spec.ts')).toEqual({ skipped: [], only: [] });
  });

  it('SKIPS-003: finds .only on any runner', () => {
    const source = "it.only('a', () => {})\ndescribe.only('b', () => {})\ntest.describe.only('c', () => {})\n";
    expect(modifiers(source, 'x.spec.ts').only).toHaveLength(3);
  });

  it('SKIPS-004: fails any .only, even in a file with a baseline entry', () => {
    expect(run({ 'tests/b.test.ts': 5 }, { 'tests/b.test.ts': "it.only('a', () => {})\n" })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/tests\/b\.test\.ts: \.only runs this test alone/);
    tree.remove();
    expect(run({}, { 'e2e/c.spec.ts': "test.only('a', async () => {})\n" })).toBe(1);
  });

  it('SKIPS-005: fails a new skip and holds a baselined file at its entry', () => {
    expect(run({}, { 'src/a.test.ts': "it.skip('a', () => {})\n" })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/a\.test\.ts: 1 skipped or todo test\(s\), baseline 0/);
    tree.remove();
    expect(run({ 'src/a.test.ts': 1 }, { 'src/a.test.ts': "it.skip('a', () => {})\n" })).toBe(0);
  });

  it('SKIPS-006: only scans test files under src/', () => {
    expect(run({}, { 'src/helper.ts': "it.skip('not a test file', () => {})\n" })).toBe(0);
  });

  it('SKIPS-007: --update lowers the baseline and never raises it', () => {
    run(
      { 'src/a.test.ts': 3, 'tests/b.test.ts': 1 },
      { 'src/a.test.ts': "it.skip('a', () => {})\nit.skip('b', () => {})\n" },
      true
    );
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual({ 'src/a.test.ts': 2 });
  });

  it('SKIPS-010: fails an entry above the skips a file holds, or for a file that is gone, until --update', () => {
    const files = { 'src/a.test.ts': "it.skip('a', () => {})\n" };
    expect(run({ 'src/a.test.ts': 2, 'tests/gone.test.ts': 1 }, files)).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(/src\/a\.test\.ts is held at 2 in scripts\/skip-baseline\.json, but there are 1 now/);
    expect(out).toMatch(/tests\/gone\.test\.ts is held at 1 .*but the file is gone/);
    expect(out).toMatch(/npm run lint:skips -- --update/);
    tree.remove();
    expect(run({ 'src/a.test.ts': 2, 'tests/gone.test.ts': 1 }, files, true)).toBe(0);
  });

  it('SKIPS-009: counts every vitest skip, whatever its title is', () => {
    const source = [
      "const T = 'a'",
      'describe.skip(T, () => {})',
      'it.skip(name, () => {})',
      "it.skip(t('x'), () => {})",
      'test.skip(!ready, () => {})',
    ].join('\n');
    expect(modifiers(source, 'tests/x.test.ts').skipped.map((s: string) => s.split(':')[0])).toEqual([
      '2',
      '3',
      '4',
      '5',
    ]);
  });

  it('SKIPS-010: counts the Playwright skips that do not depend on a condition', () => {
    const source = [
      "test.skip(true, 'switched off')",
      "test('x', async () => { test.skip() })",
      "test.fixme('t', async () => {})",
      'test.fixme(title, async () => {})',
      'test.skip(title, async ({ page }) => {})',
      "test.describe.fixme('group', () => {})",
      "test.describe('group', () => { test.fixme() })",
    ].join('\n');
    expect(modifiers(source, 'e2e/a.spec.ts').skipped.map((s: string) => s.split(':')[0])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  it('SKIPS-011: fails a variable-title skip and an unconditional Playwright skip', () => {
    expect(run({}, { 'tests/b.test.ts': "const name = 'x';\nit.skip(name, () => {});\n" })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/tests\/b\.test\.ts: 1 skipped or todo test\(s\), baseline 0/);
    tree.remove();
    const e2e = "test('a', async () => { test.skip() });\ntest.fixme('b', async () => {});\n";
    expect(run({}, { 'e2e/c.spec.ts': e2e })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/e2e\/c\.spec\.ts: 2 skipped or todo test\(s\), baseline 0/);
    tree.remove();
    const conditional = "test('a', async () => { test.skip(!process.env.S3, 'needs S3') });\n";
    expect(run({}, { 'e2e/c.spec.ts': conditional })).toBe(0);
  });

  it('SKIPS-012: counts skipIf(true) and runIf(false), whose condition can never change', () => {
    const source = [
      "it.skipIf(true)('a', () => {})",
      "describe.runIf(false)('b', () => {})",
      "test.skipIf(true).each([1])('c %s', () => {})",
      "it.skipIf(false)('d', () => {})",
      "describe.runIf(true)('e', () => {})",
      "it.skipIf(isCI)('f', () => {})",
    ].join('\n');
    expect(modifiers(source, 'tests/a.test.ts').skipped.map((s: string) => s.split(':')[0])).toEqual(['1', '2', '3']);
    expect(
      run({}, { 'tests/b.test.ts': "it.skipIf(true)('a', () => {});\ndescribe.runIf(false)('b', () => {});\n" })
    ).toBe(1);
    expect(tree.error.join('\n')).toMatch(/tests\/b\.test\.ts: 2 skipped or todo test\(s\), baseline 0/);
  });

  it('SKIPS-008: a missing baseline or test directory stops the check', () => {
    tree = ratchetTree({ 'src/a.test.ts': PASSING, 'tests/b.test.ts': PASSING, 'e2e/c.spec.ts': PASSING });
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).toThrow(RatchetError);
    tree.remove();
    tree = ratchetTree({ [BASELINE]: '{}', 'src/a.test.ts': PASSING, 'tests/b.test.ts': PASSING });
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).toThrow(
      /e2e\/ does not exist/
    );
  });
});
