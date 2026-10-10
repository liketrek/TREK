import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, it } from 'node:test';
import {
  countMap,
  fileList,
  listFiles,
  lowerCounts,
  lowerList,
  RatchetError,
  readBaseline,
  readText,
  reportStale,
  staleCounts,
  writeBaseline,
} from './ratchet.mjs';
import { ratchetTree } from './tree-fixture.mjs';

let tree;
afterEach(() => tree?.remove());

const rel = (root, files) => files.map((f) => f.slice(root.length + 1).split('\\').join('/'));

describe('scripts/lib/ratchet', () => {
  it('lists the accepted files under each directory, sorted, and skips node_modules', () => {
    tree = ratchetTree({
      'src/b.ts': '',
      'src/a/c.tsx': '',
      'src/d.css': '',
      'tests/e.ts': '',
      'src/node_modules/x.ts': '',
    });
    const files = listFiles(tree.root, ['src', 'tests'], (key) => /\.tsx?$/.test(key));
    assert.deepEqual(rel(tree.root, files), ['src/a/c.tsx', 'src/b.ts', 'tests/e.ts']);
  });

  it('stops the scan on a directory that is not there, and on a scan that finds nothing', () => {
    tree = ratchetTree({ 'src/a.md': '' });
    assert.throws(() => listFiles(tree.root, ['src', 'tests'], () => true), RatchetError);
    assert.throws(() => listFiles(tree.root, ['src', 'tests'], () => true), /tests\/ does not exist/);
    assert.throws(() => listFiles(tree.root, ['src'], (key) => key.endsWith('.ts')), /no file to check/);
  });

  it('reads CRLF and a byte order mark as the LF text git holds', () => {
    tree = ratchetTree({ 'a.ts': '\uFEFFone\r\ntwo\r\n' });
    assert.equal(readText(tree.path('a.ts')), 'one\ntwo\n');
  });

  it('treats a missing, broken or misshapen baseline as an error, never as an empty one', () => {
    tree = ratchetTree({
      'broken.json': '{ "a": ',
      'array.json': '["a"]',
      'zero.json': '{ "a": 0 }',
      'twice.json': '["a", "a"]',
      'blank.json': '[""]',
    });
    assert.throws(() => readBaseline(tree.path('missing.json'), countMap), /cannot be read/);
    assert.throws(() => readBaseline(tree.path('broken.json'), countMap), /not valid JSON/);
    assert.throws(() => readBaseline(tree.path('array.json'), countMap), /wrong shape/);
    assert.throws(() => readBaseline(tree.path('zero.json'), countMap), /positive whole number/);
    assert.throws(() => readBaseline(tree.path('twice.json'), fileList), /listed twice/);
    assert.throws(() => readBaseline(tree.path('blank.json'), fileList), /not a file path/);
    assert.match(fileList({}), /not an array/);
  });

  it('writes a baseline sorted, with a final newline, and reads it back', () => {
    tree = ratchetTree();
    writeBaseline(tree.path('b.json'), { 'src/z.ts': 2, 'src/a.ts': 1 });
    assert.equal(readText(tree.path('b.json')), '{\n  "src/a.ts": 1,\n  "src/z.ts": 2\n}\n');
    assert.deepEqual(readBaseline(tree.path('b.json'), countMap), { 'src/a.ts': 1, 'src/z.ts': 2 });
    writeBaseline(tree.path('l.json'), ['b', 'a']);
    assert.equal(readText(tree.path('l.json')), '[\n  "a",\n  "b"\n]\n');
  });

  it('lowers without ever raising or adding an entry, and drops what fell to the floor', () => {
    const lowered = lowerCounts(
      { grew: 5, shrank: 5, gone: 5, floor: 5 },
      { grew: 9, shrank: 3, floor: 2, fresh: 7 },
      2,
    );
    assert.deepEqual(lowered, { grew: 5, shrank: 3 });
    assert.deepEqual(
      lowerCounts({ a: 9 }, { a: 4 }, (key) => (key === 'a' ? 4 : 0)),
      {},
    );
  });

  it('calls an entry above the count, at the floor or for a gone file stale, one at the count not', () => {
    assert.deepEqual(
      staleCounts({ held: 5, shrank: 5, gone: 5, floor: 5 }, { held: 5, shrank: 3, floor: 2, fresh: 9 }, 2),
      [
        { key: 'shrank', entry: 5, now: 3 },
        { key: 'gone', entry: 5, now: 0 },
        { key: 'floor', entry: 5, now: 2 },
      ],
    );
    assert.deepEqual(staleCounts({ a: 3 }, { a: 4 }), []);
  });

  it('reports a stale entry with its count, or as gone, and how to lower it', () => {
    tree = ratchetTree({ 'src/here.ts': 'x\n' });
    const lines = [];
    const error = (line) => lines.push(line);
    reportStale(
      [
        { key: 'src/here.ts', entry: 4, now: 2 },
        { key: 'src/gone.ts', entry: 3, now: 0 },
      ],
      { file: 'b.json', command: 'lint:x', root: tree.root, error },
    );
    assert.equal(lines[0], 'FAIL  src/here.ts is held at 4 in scripts/b.json, but there are 2 now.');
    assert.equal(lines[1], 'FAIL  src/gone.ts is held at 3 in scripts/b.json, but the file is gone.');
    assert.match(lines[2], /^Run npm run lint:x -- --update to lower the baseline/);
    lines.length = 0;
    reportStale([], { file: 'b.json', command: 'lint:x', error });
    assert.deepEqual(lines, []);
  });

  it('lets a file list only lose the files that stopped offending', () => {
    assert.deepEqual(lowerList(['a', 'b', 'c'], ['c', 'a', 'new']), ['a', 'c']);
  });

  it('exits a command with what its check returns, and 1 when the check itself fails', () => {
    const lib = new URL('./ratchet.mjs', import.meta.url).href;
    const command = (body) =>
      spawnSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `import { runCli, RatchetError } from '${lib}'; await runCli('lint:x', ${body})`,
        ],
        { encoding: 'utf8' },
      );
    assert.equal(command('() => 0').status, 0);
    assert.equal(command('async () => 1').status, 1);
    const broken = command("() => { throw new RatchetError('baseline gone') }");
    assert.equal(broken.status, 1);
    assert.match(broken.stderr, /FAIL {2}lint:x: baseline gone/);
    assert.notEqual(command("() => { throw new Error('bug') }").status, 0);
  });
});
