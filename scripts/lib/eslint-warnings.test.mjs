import { ESLint } from 'eslint';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { areaCounts, check, inlineConfigsOf, lintWith, tally } from './eslint-warnings.mjs';
import { RatchetError } from './ratchet.mjs';
import { ratchetTree } from './tree-fixture.mjs';

let tree;
afterEach(() => tree?.remove());

const BASELINE = 'scripts/eslint-baseline.json';
const empty = { src: {}, tests: {}, suppressed: {} };
const warn = (ruleId, message = 'm') => ({ ruleId, severity: 1, message });

function result(root, key, messages, suppressed = []) {
  return {
    filePath: join(root, key),
    messages: messages.map((m) => ({ message: 'm', ...m })),
    suppressedMessages: suppressed.map((m) => ({ message: 'm', ...m })),
  };
}

async function run(baseline, results, update = false) {
  tree = ratchetTree({ [BASELINE]: JSON.stringify(baseline) });
  return check({
    root: tree.root,
    baselinePath: tree.path(BASELINE),
    update,
    lint: async (root) => results(root),
    ...tree.out,
  });
}

describe('scripts/lib/eslint-warnings', () => {
  it('counts warnings per rule for app code, tests and suppressed messages', () => {
    const root = join('/r');
    const { counts, files, errors } = tally(
      [
        result(
          root,
          'src/a.ts',
          [warn('no-empty'), warn('no-empty'), warn(null, 'Unused eslint-disable directive')],
          [warn('no-console')],
        ),
        result(root, 'src/a.test.ts', [warn('@typescript-eslint/no-explicit-any')]),
        result(root, 'tests/unit/b.ts', [warn('@typescript-eslint/no-explicit-any')]),
        result(root, 'src/c.ts', [warn(null, 'odd')]),
      ],
      root,
    );
    assert.deepEqual(counts, {
      src: { 'no-empty': 2, 'unused-disable-directive': 1, '(no rule)': 1 },
      tests: { '@typescript-eslint/no-explicit-any': 2 },
      suppressed: { 'no-console': 1 },
    });
    assert.deepEqual(files.src['no-empty'], { 'src/a.ts': 2 });
    assert.deepEqual(errors, []);
  });

  it('passes when every count sits at its entry', async () => {
    assert.equal(await run({ ...empty, src: { 'no-empty': 1 } }, (root) => [result(root, 'src/a.ts', [warn('no-empty')])]), 0);
    assert.match(tree.log.join('\n'), /eslint: 0 error\(s\); warnings src 1\/1, tests 0\/0, suppressed 0\/0/);
  });

  it('fails a count that fell below its entry until --update lowers it', async () => {
    const baseline = { ...empty, src: { 'no-empty': 2 }, suppressed: { 'no-console': 1 } };
    const results = (root) => [result(root, 'src/a.ts', [warn('no-empty')])];
    assert.equal(await run(baseline, results), 1);
    const out = tree.error.join('\n');
    assert.match(out, /src: no-empty is held at 2 in scripts\/eslint-baseline\.json, but there are 1 now/);
    assert.match(out, /suppressed: no-console is held at 1 .*but there are 0 now/);
    assert.match(out, /npm run lint:warnings -- --update/);
    tree.remove();
    assert.equal(await run(baseline, results, true), 0);
    assert.deepEqual(JSON.parse(readFileSync(tree.path(BASELINE), 'utf8')), {
      src: { 'no-empty': 1 },
      suppressed: {},
      tests: {},
    });
  });

  it('fails a new warning, names the files behind it, and keeps app code off the test headroom', async () => {
    const code = await run({ ...empty, src: { 'no-empty': 1 }, tests: { 'no-empty': 5 } }, (root) => [
      result(root, 'src/a.ts', [warn('no-empty')]),
      result(root, 'src/b.ts', [warn('no-empty')]),
    ]);
    assert.equal(code, 1);
    const out = tree.error.join('\n');
    assert.match(out, /src: 2 no-empty warning\(s\), baseline 1\. Most in: src\/a\.ts \(1\), src\/b\.ts \(1\)/);
    assert.match(out, /Fix the new warning rather than silencing it/);
  });

  it('counts a message an eslint-disable comment silenced', async () => {
    assert.equal(await run(empty, (root) => [result(root, 'src/a.ts', [], [warn('no-console')])]), 1);
    assert.match(tree.error.join('\n'), /suppressed: 1 no-console warning/);
  });

  it('fails on any error, a parse failure and an inline rule config included', async () => {
    const code = await run(empty, (root) => [
      result(root, 'src/a.ts', [{ ruleId: null, severity: 2, fatal: true, message: 'Parsing error', line: 3, column: 1 }]),
      result(root, 'src/b.ts', [{ ruleId: 'no-undef', severity: 2, message: 'x is not defined' }]),
      { ...result(root, 'src/c.ts', []), inlineConfigs: ['1:1  /* eslint no-empty: off */'] },
    ]);
    assert.equal(code, 1);
    const out = tree.error.join('\n');
    assert.match(out, /src\/a\.ts:3:1 {2}Parsing error/);
    assert.match(out, /src\/b\.ts:0:0 {2}x is not defined \(no-undef\)/);
    assert.match(out, /src\/c\.ts:1:1 {2}\/\* eslint no-empty: off \*\/ {2}configures a rule inline/);
  });

  it('stops on a baseline without all three areas, with a stray one, or without a lint function', async () => {
    assert.match(areaCounts({ src: {}, tests: {} }), /"suppressed" area is missing/);
    assert.match(areaCounts({ ...empty, other: {} }), /"other" is not one of/);
    assert.match(areaCounts({ ...empty, src: { a: -1 } }), /in "src"/);
    assert.match(areaCounts([]), /not an object/);
    await assert.rejects(run({ src: {} }, () => []), RatchetError);
    tree.remove();
    tree = ratchetTree({ [BASELINE]: JSON.stringify(empty) });
    await assert.rejects(check({ root: tree.root, ...tree.out }), /without a lint function/);
  });

  it('finds the block comments that configure a rule, and nothing in strings, templates or regexes', () => {
    const source = [
      '/* eslint @typescript-eslint/no-explicit-any: off */',
      'const a = "/* eslint no-empty: off */";',
      'const b = `${a} /* eslint no-empty: off */`;',
      '/* eslint-disable no-empty */',
      '/*eslint no-empty:0*/ const c = 1;',
      'const r = /\\/\\* eslint no-empty/;',
      '// eslint no-empty: off',
      '/** eslint is the linter */',
    ].join('\n');
    assert.deepEqual(inlineConfigsOf(source, 'src/a.ts'), [
      '1:1  /* eslint @typescript-eslint/no-explicit-any: off */',
      '5:1  /*eslint no-empty:0*/',
    ]);
    assert.equal(inlineConfigsOf('export const a = 1 /* eslint no-empty: off */\n', 'src/a.mts').length, 1);
    assert.deepEqual(inlineConfigsOf('const a = <div>{/* eslint no-empty: 1 */}</div>;\n', 'src/a.tsx').length, 1);
    assert.deepEqual(inlineConfigsOf('const a = 1;\n', 'src/a.jsx'), []);
    assert.deepEqual(inlineConfigsOf('export const a = 1\n', 'src/a.js'), []);
  });

  it('lints with the ESLint class it is handed and reads the inline rule configs of every file', async () => {
    tree = ratchetTree({
      'eslint.config.mjs': "export default [{ files: ['**/*.js'], rules: { 'no-empty': 'warn' } }];\n",
      'src/a.js': '/* eslint no-empty: off */\nif (globalThis.x) {}\n',
      'src/b.js': 'if (globalThis.x) {}\n',
    });
    const results = await lintWith(ESLint)(tree.root);
    const byKey = Object.fromEntries(results.map((r) => [r.filePath.split('\\').join('/').split('/src/')[1], r]));
    assert.deepEqual(byKey['a.js'].messages, []);
    assert.deepEqual(byKey['a.js'].inlineConfigs, ['1:1  /* eslint no-empty: off */']);
    assert.deepEqual(
      byKey['b.js'].messages.map((m) => m.ruleId),
      ['no-empty'],
    );
    assert.deepEqual(byKey['b.js'].inlineConfigs, []);
  });
});
