import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { check, parseTscOutput } from '../../../scripts/lib/strict.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/strict-baseline.json';

const OUTPUT = [
  "src/a.ts(3,7): error TS18047: 'user' is possibly 'null'.",
  "src/a.ts(9,1): error TS7006: Parameter 'x' implicitly has an 'any' type.",
  "src\\b.tsx(1,2): error TS2322: Type 'string | null' is not assignable to type 'string'.",
  "  Type 'null' is not assignable to type 'string'.",
].join('\r\n');

function run(baseline: Record<string, number>, output: string, files: Record<string, string> = {}, update = false) {
  tree = ratchetTree({ [BASELINE]: JSON.stringify(baseline), ...files });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, tsc: () => output, ...tree.out });
}

describe('lint:strict', () => {
  it('STRICT-001: counts errors per file, joins continuation lines and reads Windows paths', () => {
    const { counts, listed, general } = parseTscOutput(OUTPUT);
    expect(counts).toEqual({ 'src/a.ts': 2, 'src/b.tsx': 1 });
    expect(listed['src/a.ts'][0]).toBe("3:7  TS18047 'user' is possibly 'null'.");
    expect(general).toEqual([]);
  });

  it('STRICT-002: passes counts within the baseline', () => {
    const files = { 'src/a.ts': '', 'src/b.tsx': '' };
    expect(run({ 'src/a.ts': 2, 'src/b.tsx': 1 }, OUTPUT, files)).toBe(0);
    expect(tree.log.join('\n')).toMatch(/strict: 3 error\(s\) in 2 file\(s\).*baseline allows 3/);
  });

  it('STRICT-003: a new file starts at zero, and a file that gains an error fails', () => {
    expect(run({ 'src/a.ts': 2 }, OUTPUT, { 'src/a.ts': '', 'src/b.tsx': '' })).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /src\/b\.tsx: 1 error\(s\) under strictNullChecks and noImplicitAny, baseline 0/
    );
  });

  it('STRICT-004: an error tied to no file fails the check', () => {
    expect(
      run({}, "tsconfig.strict.json(3,5): error TS5023: Unknown compiler option 'x'.\nerror TS6053: File not found.")
    ).toBe(1);
    expect(tree.error.join('\n')).toMatch(/FAIL {2}error TS6053: File not found\./);
  });

  it('STRICT-005: --update lowers the baseline and never raises it', () => {
    run({ 'src/a.ts': 5, 'src/b.tsx': 1, 'src/fixed.ts': 2 }, OUTPUT, { 'src/a.ts': '', 'src/b.tsx': '' }, true);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual({ 'src/a.ts': 2, 'src/b.tsx': 1 });
  });

  it('STRICT-006: fails an entry above its count, or for a file that is gone, until --update', () => {
    expect(run({ 'src/a.ts': 3, 'src/b.tsx': 1 }, OUTPUT, { 'src/a.ts': '', 'src/b.tsx': '' })).toBe(1);
    expect(tree.error.join('\n')).toMatch(
      /src\/a\.ts is held at 3 in scripts\/strict-baseline\.json, but there are 2 now/
    );
    tree.remove();
    expect(run({ 'src/a.ts': 2, 'src/b.tsx': 1, 'src/gone.ts': 1 }, OUTPUT, { 'src/a.ts': '', 'src/b.tsx': '' })).toBe(
      1
    );
    expect(tree.error.join('\n')).toMatch(
      /src\/gone\.ts is held at 1 in scripts\/strict-baseline\.json, but the file is gone/
    );
  });

  it('STRICT-007: a missing baseline stops the check instead of reading as empty', () => {
    tree = ratchetTree({});
    expect(() => check({ root: tree.root, baselinePath: tree.path(BASELINE), tsc: () => '', ...tree.out })).toThrow(
      RatchetError
    );
  });
});
