import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { check, isFormatted } from '../../../scripts/lib/format.mjs';
import { RatchetError } from '../../../scripts/lib/ratchet.mjs';
import { ratchetTree, type RatchetTree } from '../../helpers/ratchetFixture';

let tree: RatchetTree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/format-baseline.json';
const CONFIG = { '.prettierrc': JSON.stringify({ semi: true, singleQuote: true, endOfLine: 'lf' }) };
const FORMATTED = "const a = 'x';\n";
const UNFORMATTED = 'const a = "x"\n';

function run(baseline: string[], files: Record<string, string>, update = false) {
  tree = ratchetTree({
    ...CONFIG,
    [BASELINE]: JSON.stringify(baseline),
    'src/keep.ts': FORMATTED,
    'tests/keep.ts': FORMATTED,
    'e2e/keep.spec.ts': FORMATTED,
    ...files,
  });
  return check({ root: tree.root, baselinePath: tree.path(BASELINE), update, ...tree.out });
}

describe('lint:format', () => {
  it('FORMAT-001: tells formatted from unformatted files, and reads CRLF as LF', async () => {
    tree = ratchetTree({
      ...CONFIG,
      'a.ts': FORMATTED,
      'b.ts': UNFORMATTED,
      'c.ts': "const a = 'x';\r\n",
      'd.ts': 'const (',
    });
    expect(await isFormatted(tree.path('a.ts'))).toBe(true);
    expect(await isFormatted(tree.path('b.ts'))).toBe(false);
    expect(await isFormatted(tree.path('c.ts'))).toBe(true);
    expect(await isFormatted(tree.path('d.ts'))).toBe(false);
  });

  it('FORMAT-002: passes when every unformatted file is listed', async () => {
    expect(await run(['src/old.ts'], { 'src/old.ts': UNFORMATTED, 'src/new.ts': FORMATTED })).toBe(0);
    expect(tree.error).toEqual([]);
  });

  it('FORMAT-003: fails a new file that is not formatted', async () => {
    expect(await run([], { 'src/new.tsx': UNFORMATTED })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/new\.tsx is not formatted\. Run: npx prettier --write src\/new\.tsx/);
  });

  it('FORMAT-004: fails a listed file that is formatted now, until --update takes it off', async () => {
    expect(await run(['src/done.ts', 'src/gone.ts'], { 'src/done.ts': FORMATTED })).toBe(1);
    expect(tree.error.join('\n')).toMatch(/src\/done\.ts is listed .* formatted now or gone/);
    expect(tree.error.join('\n')).toMatch(/src\/gone\.ts is listed/);
    tree.remove();
    expect(
      await run(['src/done.ts', 'src/old.ts'], { 'src/done.ts': FORMATTED, 'src/old.ts': UNFORMATTED }, true)
    ).toBe(0);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual(['src/old.ts']);
  });

  it('FORMAT-005: --update never puts a file on the list', async () => {
    expect(await run([], { 'src/new.ts': UNFORMATTED }, true)).toBe(1);
    expect(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8'))).toEqual([]);
  });

  it('FORMAT-007: holds the Playwright specs and the client scripts to the same rule', async () => {
    const files = {
      'e2e/new.spec.ts': UNFORMATTED,
      'scripts/new-lint.mjs': UNFORMATTED,
      'scripts/data.json': '{"a":1}',
    };
    expect(await run([], files)).toBe(1);
    const errors = tree.error.join('\n');
    expect(errors).toMatch(/e2e\/new\.spec\.ts is not formatted/);
    expect(errors).toMatch(/scripts\/new-lint\.mjs is not formatted/);
    expect(errors).not.toMatch(/data\.json/);
    tree.remove();
    expect(await run(['e2e/new.spec.ts', 'scripts/new-lint.mjs'], files)).toBe(0);
  });

  it('FORMAT-006: a missing baseline or Prettier config stops the check', async () => {
    tree = ratchetTree({
      ...CONFIG,
      'src/a.ts': FORMATTED,
      'tests/a.ts': FORMATTED,
      'e2e/a.ts': FORMATTED,
      'scripts/a.mjs': FORMATTED,
    });
    await expect(check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out })).rejects.toThrow(
      RatchetError
    );
    tree.remove();
    tree = ratchetTree({ [BASELINE]: '[]', 'src/a.ts': FORMATTED, 'tests/a.ts': FORMATTED, 'e2e/a.ts': FORMATTED });
    // No config in the tree; the lookup climbs no further than the temp directory's parents,
    // which hold none either.
    const result = check({ root: tree.root, baselinePath: tree.path(BASELINE), ...tree.out });
    await expect(result).rejects.toThrow(/no Prettier config/);
  });
});
