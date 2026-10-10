import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { check, inspect } from '../../../scripts/lib/theme.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const HITS = 'scripts/theme-baseline.json';
const MARKERS = 'scripts/theme-disable-baseline.json';

function run(
  hits: Record<string, number>,
  markers: Record<string, number>,
  files: Record<string, string>,
  update = false
) {
  tree = ratchetTree({ [HITS]: JSON.stringify(hits), [MARKERS]: JSON.stringify(markers), ...files });
  return check({
    root: tree.root,
    baselinePath: tree.path(HITS),
    disableBaselinePath: tree.path(MARKERS),
    update,
    ...tree.out,
  });
}

const rulesOf = (source: string) => inspect(source, 'a.tsx').hits.map((hit: string) => hit.split(': ')[1]);

describe('theme:lint', () => {
  it('THEME-001: counts literals, arbitrary colour classes and numeric font sizes', () => {
    const source = [
      `const a = <div className="bg-[#fff] text-[rgba(0,0,0,.5)]" />`,
      `const s = { color: '#111', background: 'rgba(0,0,0,.1)', fontSize: 13 }`,
    ].join('\n');
    expect(rulesOf(source)).toEqual([
      'arbitrary-color',
      'arbitrary-color',
      'inline-color',
      'inline-color',
      'inline-font-size',
    ]);
  });

  it('THEME-002: counts palette classes with variants, not the token utilities', () => {
    const source = `const a = <div className="bg-gray-100 dark:text-indigo-400 hover:bg-white/80 bg-surface text-content-muted border-edge bg-accent" />`;
    expect(inspect(source, 'a.tsx').hits).toEqual([
      '1: palette-class: bg-gray-100',
      '1: palette-class: dark:text-indigo-400',
      '1: palette-class: hover:bg-white/80',
    ]);
  });

  it('THEME-003: counts raw text sizes, not the type tiers or text colours', () => {
    const source = `const a = <p className="text-sm md:text-2xl text-caption text-body text-content" />`;
    expect(inspect(source, 'a.tsx').hits).toEqual(['1: raw-text-size: text-sm', '1: raw-text-size: md:text-2xl']);
  });

  it('THEME-003b: counts arbitrary text sizes, not arbitrary colours or variables', () => {
    const source = `const a = <p className="text-[13px] sm:text-[0.8rem] text-[1.5em] text-[var(--x)] text-[#fff]" />`;
    expect(inspect(source, 'a.tsx').hits).toEqual([
      '1: arbitrary-color: text-[#fff]',
      '1: raw-text-size: text-[13px]',
      '1: raw-text-size: sm:text-[0.8rem]',
      '1: raw-text-size: text-[1.5em]',
    ]);
  });

  it('THEME-004: counts a z-index literal above z-50, not local stacking or a scale step', () => {
    const source = [
      `const a = <div className="z-10 z-50 z-[9999] z-[var(--z-modal)]" style={{ zIndex: 2 }} />`,
      `const b = { zIndex: 10000 }`,
      'const html = `<div style="z-index: 1000">`',
    ].join('\n');
    expect(inspect(source, 'a.tsx').hits).toEqual([
      '1: z-index-literal: z-[9999]',
      '2: z-index-literal: zIndex: 10000',
      '3: z-index-literal: z-index: 1000',
    ]);
  });

  it('THEME-005: counts a read of the dark_mode setting, not a write of it', () => {
    const source = [
      'const dark = useSettingsStore((s) => s.settings.dark_mode)',
      "save({ dark_mode: 'dark' })",
      "updateSetting('dark_mode', 'auto')",
    ].join('\n');
    expect(inspect(source, 'a.tsx').hits).toEqual(['1: dark-mode-read: .dark_mode']);
  });

  it('THEME-006: ignores comments and honours the marker in a comment only', () => {
    const source = [
      '// never bg-white or text-sm here',
      "const paint = { color: '#ff0000' } // theme-lint-disable: map paint",
      "const label = { color: '#00ff00', note: 'theme-lint-disable' }",
    ].join('\n');
    expect(inspect(source, 'a.tsx')).toEqual({ hits: ["3: inline-color: color: '#00ff00"], markers: 1 });
  });

  it('THEME-007: fails a file that gains a hit and names the fix', () => {
    expect(run({ 'a.tsx': 1 }, {}, { 'src/a.tsx': 'const a = <div className="bg-gray-100 text-sm" />\n' })).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(/a\.tsx: 2 styling bypass\(es\) of the theme tokens, baseline 1/);
    expect(out).toMatch(/raw-text-size: use a type tier/);
  });

  it('THEME-008: fails a file that gains a marker, and passes one within its entry', () => {
    const marked = "const s = { color: '#fff' } // theme-lint-disable\n";
    expect(run({}, {}, { 'src/a.tsx': marked })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/a\.tsx: 1 line\(s\) marked theme-lint-disable/);
    tree.remove();
    expect(run({}, { 'a.tsx': 1 }, { 'src/a.tsx': marked })).toBe(0);
  });

  it('THEME-009: leaves tests out of the count', () => {
    expect(run({}, {}, { 'src/a.tsx': 'const a = 1\n', 'src/a.test.tsx': 'const a = "bg-gray-100"\n' })).toBe(0);
  });

  it('THEME-010: --update lowers both baselines and never raises them', () => {
    run(
      { 'a.tsx': 3, 'b.tsx': 1 },
      { 'a.tsx': 2 },
      {
        'src/a.tsx': "const a = 'bg-gray-100'\nconst s = { color: '#fff' } // theme-lint-disable\n",
        'src/b.tsx': "const b = 'bg-gray-100 text-xs'\n",
      },
      true
    );
    expect(JSON.parse(readFileSync(tree.path(HITS), 'utf8'))).toEqual({ 'a.tsx': 1, 'b.tsx': 1 });
    expect(JSON.parse(readFileSync(tree.path(MARKERS), 'utf8'))).toEqual({ 'a.tsx': 1 });
  });

  it('THEME-011: fails an entry above its file, or for a file that is gone, until --update', () => {
    const files = { 'src/a.tsx': "const a = 'bg-gray-100'\n" };
    expect(run({ 'a.tsx': 2 }, {}, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/a\.tsx is held at 2 in scripts\/theme-baseline\.json, but there are 1 now/);
    tree.remove();
    expect(run({ 'a.tsx': 1, 'gone.tsx': 3 }, {}, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /gone\.tsx is held at 3 in scripts\/theme-baseline\.json, but the file is gone/
    );
  });

  it('THEME-012: a missing or broken baseline stops the check instead of reading as empty', () => {
    tree = ratchetTree({ [HITS]: '{}', 'src/a.tsx': 'const a = 1\n' });
    expect(() =>
      check({ root: tree.root, baselinePath: tree.path(HITS), disableBaselinePath: tree.path(MARKERS), ...tree.out })
    ).toThrow(RatchetError);
  });

  it('THEME-013: the command runs its check whichever way it is started', { timeout: 60_000 }, () => {
    const scripts = resolve('scripts');
    for (const [cwd, arg] of [
      [process.cwd(), join(scripts, 'theme-lint.mjs')],
      [scripts, 'theme-lint.mjs'],
    ]) {
      const result = spawnSync(process.execPath, [arg], { cwd, encoding: 'utf8' });
      expect(result.stdout).toMatch(/^theme: \d+ styling bypass\(es\)/m);
      expect(result.status).toBe(0);
    }
  });
});
