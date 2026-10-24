import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, describe, it } from 'node:test';
import * as prettier from 'prettier';
import { check, isFormatted } from './format.mjs';
import { RatchetError } from './ratchet.mjs';
import { ratchetTree } from './tree-fixture.mjs';

let tree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/format-baseline.json';
const CONFIG = { '.prettierrc': JSON.stringify({ semi: true, singleQuote: true, endOfLine: 'lf' }) };
const FORMATTED = "const a = 'x';\n";
const UNFORMATTED = 'const a = "x"\n';
const DIRS = ['src', 'tests'];
const accepts = (key) => key.endsWith('.ts');

function run(baseline, files, update = false, list = false) {
  tree = ratchetTree({
    ...CONFIG,
    [BASELINE]: JSON.stringify(baseline),
    'src/keep.ts': FORMATTED,
    'tests/keep.ts': FORMATTED,
    ...files,
  });
  return check({ prettier, root: tree.root, dirs: DIRS, accepts, baselinePath: tree.path(BASELINE), update, list, ...tree.out });
}

describe('scripts/lib/format', () => {
  it('tells formatted from unformatted files, and reads CRLF as LF', async () => {
    tree = ratchetTree({
      ...CONFIG,
      'a.ts': FORMATTED,
      'b.ts': UNFORMATTED,
      'c.ts': "const a = 'x';\r\n",
      'd.ts': 'const (',
    });
    assert.equal(await isFormatted(prettier, tree.path('a.ts')), true);
    assert.equal(await isFormatted(prettier, tree.path('b.ts')), false);
    assert.equal(await isFormatted(prettier, tree.path('c.ts')), true);
    assert.equal(await isFormatted(prettier, tree.path('d.ts')), false);
  });

  it('passes when every unformatted file is listed, and --list names each one', async () => {
    assert.equal(await run(['src/old.ts'], { 'src/old.ts': UNFORMATTED, 'src/new.ts': FORMATTED }, false, true), 0);
    assert.deepEqual(tree.error, []);
    assert.ok(tree.log.includes('listed  src/old.ts'));
  });

  it('fails a new file that is not formatted, and leaves files it does not accept alone', async () => {
    assert.equal(await run([], { 'tests/new.ts': UNFORMATTED, 'src/data.json': '{"a":1}' }), 1);
    const out = tree.error.join('\n');
    assert.match(out, /tests\/new\.ts is not formatted\. Run: npx prettier --write tests\/new\.ts/);
    assert.doesNotMatch(out, /data\.json/);
  });

  it('fails a listed file that is formatted now or gone, until --update takes it off', async () => {
    assert.equal(await run(['src/done.ts', 'src/gone.ts'], { 'src/done.ts': FORMATTED }), 1);
    const out = tree.error.join('\n');
    assert.match(out, /src\/done\.ts is listed .* formatted now or gone/);
    assert.match(out, /src\/gone\.ts is listed/);
    assert.match(out, /npm run lint:format -- --update/);
    tree.remove();
    assert.equal(await run(['src/done.ts', 'src/old.ts'], { 'src/done.ts': FORMATTED, 'src/old.ts': UNFORMATTED }, true), 0);
    assert.deepEqual(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8')), ['src/old.ts']);
  });

  it('never puts a file on the list with --update', async () => {
    assert.equal(await run([], { 'src/new.ts': UNFORMATTED }, true), 1);
    assert.deepEqual(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8')), []);
  });

  it('stops on a missing baseline or a missing Prettier config', async () => {
    tree = ratchetTree({ ...CONFIG, 'src/a.ts': FORMATTED, 'tests/a.ts': FORMATTED });
    await assert.rejects(
      check({ prettier, root: tree.root, dirs: DIRS, accepts, baselinePath: tree.path(BASELINE), ...tree.out }),
      RatchetError,
    );
    tree.remove();
    tree = ratchetTree({ [BASELINE]: '[]', 'src/a.ts': FORMATTED, 'tests/a.ts': FORMATTED });
    const stub = { resolveConfig: async () => null, check: async () => true };
    await assert.rejects(
      check({ prettier: stub, root: tree.root, dirs: DIRS, accepts, baselinePath: tree.path(BASELINE), ...tree.out }),
      /no Prettier config/,
    );
  });
});
