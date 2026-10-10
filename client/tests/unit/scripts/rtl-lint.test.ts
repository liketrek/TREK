import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { check, inspect, physicalUses } from '../../../scripts/lib/rtl.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const USES = 'scripts/rtl-baseline.json';
const MARKERS = 'scripts/rtl-disable-baseline.json';

function run(
  uses: Record<string, number>,
  markers: Record<string, number>,
  files: Record<string, string>,
  update = false
) {
  tree = ratchetTree({ [USES]: JSON.stringify(uses), [MARKERS]: JSON.stringify(markers), ...files });
  return check({
    root: tree.root,
    baselinePath: tree.path(USES),
    disableBaselinePath: tree.path(MARKERS),
    update,
    ...tree.out,
  });
}

describe('lint:rtl', () => {
  it('RTL-001: counts physical classes and styles, not the logical ones or prose in comments', () => {
    const source = [
      '// the top right corner',
      'const a = <div className="ml-2 ps-2 text-left" style={{ marginInlineStart: 4, paddingRight: 2 }} />',
    ].join('\n');
    expect(physicalUses(source, 'a.tsx')).toEqual(['2: ml-2', '2: text-left', '2: paddingRight:']);
    expect(physicalUses('.a { margin-left: 2px; margin-inline-end: 1px }', 'a.css')).toEqual(['1: margin-left:']);
  });

  it('RTL-002: honours the marker in a comment and counts the line', () => {
    const source =
      "const s = { left: '50%', /* rtl-lint-disable: centred */ top: 0 }\nconst t = { right: 1 } // rtl-lint-disable\n";
    expect(inspect(source, 'a.tsx')).toEqual({ uses: [], markers: 2 });
  });

  it('RTL-003: a marker inside a string is no marker', () => {
    const source = "const s = { left: 0, note: 'rtl-lint-disable' }\n";
    expect(inspect(source, 'a.tsx')).toEqual({ uses: ['1: left:'], markers: 0 });
  });

  it('RTL-004: fails a file that gains a physical side', () => {
    expect(run({ 'a.tsx': 1 }, {}, { 'src/a.tsx': 'const a = <div className="ml-2 pr-1" />\n' })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/a\.tsx: 2 physical side\(s\), baseline 1/);
  });

  it('RTL-005: fails a file that gains a disable marker, and passes one within its entry', () => {
    const marked = 'const s = { left: 0 } // rtl-lint-disable\n';
    expect(run({}, {}, { 'src/a.tsx': marked })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/a\.tsx: 1 line\(s\) marked rtl-lint-disable/);
    tree.remove();
    expect(run({}, { 'a.tsx': 1 }, { 'src/a.tsx': marked })).toBe(0);
  });

  it('RTL-006: --update lowers both baselines and never raises them', () => {
    run(
      { 'a.tsx': 3, 'b.tsx': 1 },
      { 'a.tsx': 2 },
      {
        'src/a.tsx': 'const a = <div className="ml-2" />\nconst s = { left: 0 } // rtl-lint-disable\n',
        'src/b.tsx': 'const b = <div className="ml-2 mr-2" />\n',
      },
      true
    );
    expect(JSON.parse(readFileSync(tree.path(USES), 'utf8'))).toEqual({ 'a.tsx': 1, 'b.tsx': 1 });
    expect(JSON.parse(readFileSync(tree.path(MARKERS), 'utf8'))).toEqual({ 'a.tsx': 1 });
  });

  it('RTL-009: fails an entry of either baseline above the file, or for a file that is gone, until --update', () => {
    const files = { 'src/a.tsx': 'const a = <div className="ml-2" />\nconst s = { left: 0 } // rtl-lint-disable\n' };
    expect(run({ 'a.tsx': 2 }, { 'a.tsx': 1 }, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(/a\.tsx is held at 2 in scripts\/rtl-baseline\.json, but there are 1 now/);
    tree.remove();
    expect(run({ 'a.tsx': 1 }, { 'a.tsx': 2 }, files)).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /a\.tsx is held at 2 in scripts\/rtl-disable-baseline\.json, but there are 1 now/
    );
    tree.remove();
    expect(run({ 'a.tsx': 1, 'gone.tsx': 3 }, { 'a.tsx': 1, 'gone.tsx': 1 }, files)).toBe(1);
    const out = tree.error.join('\n');
    expect(out).toMatch(/gone\.tsx is held at 3 in scripts\/rtl-baseline\.json, but the file is gone/);
    expect(out).toMatch(/gone\.tsx is held at 1 in scripts\/rtl-disable-baseline\.json, but the file is gone/);
    tree.remove();
    expect(run({ 'a.tsx': 2, 'gone.tsx': 3 }, { 'a.tsx': 2, 'gone.tsx': 1 }, files, true)).toBe(0);
  });

  it('RTL-007: a missing or broken baseline stops the check instead of reading as empty', () => {
    tree = ratchetTree({ [USES]: '{}', 'src/a.tsx': 'const a = 1\n' });
    expect(() =>
      check({ root: tree.root, baselinePath: tree.path(USES), disableBaselinePath: tree.path(MARKERS), ...tree.out })
    ).toThrow(RatchetError);
    tree.write({ [USES]: '{ "a.tsx": ', [MARKERS]: '{}' });
    expect(() =>
      check({ root: tree.root, baselinePath: tree.path(USES), disableBaselinePath: tree.path(MARKERS), ...tree.out })
    ).toThrow(/not valid JSON/);
  });

  it('RTL-008: the command runs its check whichever way it is started', { timeout: 60_000 }, () => {
    // It used to compare its own path with argv[1] and do nothing, exit 0, when they differed.
    const scripts = resolve('scripts');
    for (const [cwd, arg] of [
      [process.cwd(), join(scripts, 'rtl-lint.mjs')],
      [scripts, 'rtl-lint.mjs'],
    ]) {
      const result = spawnSync(process.execPath, [arg], { cwd, encoding: 'utf8' });
      expect(result.stdout).toMatch(/^rtl: \d+ physical side\(s\)/m);
      expect(result.status).toBe(0);
    }
  });
});
