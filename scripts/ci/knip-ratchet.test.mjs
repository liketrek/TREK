import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { RatchetError } from '../../client/scripts/lib/ratchet.mjs';
import { categoryCounts, check, tally } from './lib/knip.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'knip-ratchet-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const REPORT = {
  issues: [
    {
      file: 'client/src/a.ts',
      exports: [{ name: 'unusedA' }, { name: 'unusedB' }],
      types: [{ name: 'OldType' }],
      files: [],
    },
    { file: 'server/package.json', devDependencies: [{ name: 'nodemon' }] },
    { file: 'client/src/dead.ts', files: [{ name: 'client/src/dead.ts' }] },
    { file: 'client/src/toast.tsx', duplicates: [[{ name: 'useToast' }, { name: 'default' }]] },
  ],
};

let n = 0;
function run(baseline, report = REPORT, update = false) {
  const path = join(scratch, `baseline-${n++}.json`);
  writeFileSync(path, JSON.stringify(baseline));
  const out = { log: [], error: [] };
  const code = check({
    root: scratch,
    baselinePath: path,
    update,
    knip: () => report,
    log: (l) => out.log.push(l),
    error: (l) => out.error.push(l),
  });
  return { code, out, path };
}

const FULL = {
  exports: { 'client/src/a.ts': 2 },
  types: { 'client/src/a.ts': 1 },
  devDependencies: { 'server/package.json': 1 },
  files: { 'client/src/dead.ts': 1 },
  duplicates: { 'client/src/toast.tsx': 1 },
};

describe('lint:knip', () => {
  it('KNIP-001: counts each category per file with the names behind it', () => {
    const { counts, names } = tally(REPORT);
    assert.deepEqual(counts.exports, { 'client/src/a.ts': 2 });
    assert.deepEqual(counts.files, { 'client/src/dead.ts': 1 });
    assert.deepEqual(names.duplicates['client/src/toast.tsx'], ['useToast = default']);
    assert.deepEqual(counts.dependencies, {});
  });

  it('KNIP-002: passes findings within the baseline', () => {
    const { code, out } = run(FULL);
    assert.equal(code, 0, out.error.join('\n'));
    assert.match(out.log.join('\n'), /knip: 6 finding\(s\), baseline allows 6/);
  });

  it('KNIP-003: fails a new finding, by category, and names it', () => {
    const { code, out } = run({ ...FULL, exports: { 'client/src/a.ts': 1 } });
    assert.equal(code, 1);
    assert.match(out.error.join('\n'), /FAIL {2}exports: client\/src\/a\.ts has 2, baseline 1: unusedA, unusedB/);
  });

  it('KNIP-004: fails an entry above its count until --update lowers it, and never raises one', () => {
    const { code, out } = run({ ...FULL, types: { 'client/src/a.ts': 3, 'client/src/gone.ts': 1 } });
    assert.equal(code, 1);
    assert.match(out.error.join('\n'), /types: client\/src\/a\.ts is held at 3 in scripts\/ci\/knip-baseline\.json/);
    const updated = run({ ...FULL, types: { 'client/src/a.ts': 3, 'client/src/gone.ts': 1 }, exports: {} }, REPORT, true);
    const written = JSON.parse(readFileSync(updated.path, 'utf8'));
    assert.deepEqual(written.types, { 'client/src/a.ts': 1 });
    assert.equal(written.exports, undefined);
  });

  it('KNIP-005: a broken baseline or a report without issues stops the check', () => {
    assert.match(categoryCounts({ nonsense: {} }), /not one of/);
    assert.throws(() => run({ exports: { a: 0 } }), RatchetError);
    assert.throws(() => run(FULL, { files: [] }), /no issues array/);
  });
});
