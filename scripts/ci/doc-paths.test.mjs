import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { basesOf, check, guidesOf, inlineSpans, missingPaths, pathOf, resolves } from './doc-paths.mjs';

const TRACKED = [
  'CLAUDE.md',
  'README.md',
  'server/CLAUDE.md',
  'server/src/nest/README.md',
  'server/src/nest/weather/weather.service.ts',
  'server/src/nest/database/unit-of-work.ts',
  'server/src/config.ts',
  'server/tests/e2e/harness.ts',
  'client/src/api/client.ts',
  '.github/workflows/test.yml',
  'wiki/Home.md',
  'wiki/assets/a.png',
  'docs/other.md',
];

const exists = (path) => {
  const files = new Set(TRACKED);
  return files.has(path) || TRACKED.some((file) => file.startsWith(`${path}/`));
};

describe('doc-paths', () => {
  it('reads the CLAUDE.md files, the root README, the Nest blueprint and the top-level wiki pages', () => {
    assert.deepEqual(guidesOf([...TRACKED, 'wiki/sub/Deep.md', 'server/README.md']), [
      'CLAUDE.md',
      'README.md',
      'server/CLAUDE.md',
      'server/src/nest/README.md',
      'wiki/Home.md',
    ]);
  });

  it('takes inline code spans and skips fenced blocks of either kind', () => {
    const md = [
      'Open `server/src/config.ts` and `a b`.',
      '```bash',
      'cat `server/nope.ts`',
      '```',
      '~~~',
      '`server/also-nope.ts`',
      '~~~',
      'Then ``double`` and `client/src/api/client.ts`.',
    ].join('\r\n');
    assert.deepEqual(inlineSpans(md), ['server/src/config.ts', 'a b', 'client/src/api/client.ts']);
  });

  it('reads a relative path against the guide directory, its workspace and the workspace src', () => {
    assert.deepEqual(basesOf('server/src/nest/README.md'), ['', 'server/src/nest', 'server', 'server/src']);
    assert.deepEqual(basesOf('CLAUDE.md'), ['']);
    assert.deepEqual(basesOf('wiki/Home.md'), ['', 'wiki']);
  });

  it('only treats a span as a path when it looks like one', () => {
    const bases = basesOf('server/CLAUDE.md');
    assert.equal(pathOf('src/nest/README.md', bases, exists), 'src/nest/README.md');
    assert.equal(pathOf('.github/workflows/test.yml:250-251', [''], exists), '.github/workflows/test.yml');
    assert.equal(pathOf('nest/database/unit-of-work.ts,', bases, exists), 'nest/database/unit-of-work.ts');
    assert.equal(pathOf('src/gone/', bases, exists), 'src/gone/');
    for (const span of [
      'weather.service.ts',
      '/api/health/ready',
      '~/.ssh/key',
      '@trek/shared',
      'https://example.com/a.md',
      'text/plain',
      'src/**/*.ts',
      '<domain>/<domain>.rpc.ts',
      'npm run lint',
      'a/{b,c}.ts',
      'C:/tmp/x.ts',
    ]) {
      assert.equal(pathOf(span, bases, exists), null, span);
    }
  });

  it('resolves a path as written or as a module specifier without its extension', () => {
    assert.equal(resolves('src/config', basesOf('server/CLAUDE.md'), exists), true);
    assert.equal(resolves('api/client', ['', 'client/src'], exists), true);
    assert.equal(resolves('weather/weather.service.ts', basesOf('server/src/nest/README.md'), exists), true);
    assert.equal(resolves('src/nope.ts', basesOf('server/CLAUDE.md'), exists), false);
  });

  it('lists every missing path once per guide', () => {
    const texts = {
      'CLAUDE.md': 'See `server/src/config.ts`, `server/src/gone.ts` and again `server/src/gone.ts`.',
      'README.md': 'Nothing here.',
      'server/CLAUDE.md': 'Use `nest/database/unit-of-work.ts` and `tests/e2e/harness.ts`, not `db/migrations.ts`.',
      'server/src/nest/README.md': '`weather/weather.service.ts` and `src/services/`.',
      'wiki/Home.md': 'Pictures live in `assets/a.png`; plugins ship `server/index.js`.',
    };
    assert.deepEqual(missingPaths({ tracked: TRACKED, read: (path) => texts[path] }), [
      'CLAUDE.md :: server/src/gone.ts',
      'server/CLAUDE.md :: db/migrations.ts',
      'server/src/nest/README.md :: src/services/',
      'wiki/Home.md :: server/index.js',
    ]);
  });

  describe('check', () => {
    let root;
    afterEach(() => root && rmSync(root, { recursive: true, force: true }));

    function tree(files, baseline) {
      root = mkdtempSync(join(tmpdir(), 'doc-paths-'));
      for (const [path, text] of Object.entries({ ...files, 'scripts/ci/doc-paths-baseline.json': JSON.stringify(baseline) })) {
        mkdirSync(dirname(join(root, path)), { recursive: true });
        writeFileSync(join(root, path), text);
      }
      const out = { log: [], error: [] };
      const run = (opts = {}) =>
        check({
          root,
          tracked: Object.keys(files),
          log: (l) => out.log.push(l),
          error: (l) => out.error.push(l),
          ...opts,
        });
      return { out, run };
    }

    it('passes when every missing path is listed, and fails a new one', () => {
      const listed = tree({ 'CLAUDE.md': '`server/a.ts`', 'server/b.ts': '' }, ['CLAUDE.md :: server/a.ts']);
      assert.equal(listed.run(), 0);
      rmSync(root, { recursive: true, force: true });
      const fresh = tree({ 'CLAUDE.md': '`server/a.ts` `server/c.ts`', 'server/b.ts': '' }, ['CLAUDE.md :: server/a.ts']);
      assert.equal(fresh.run(), 1);
      assert.match(fresh.out.error.join('\n'), /CLAUDE\.md names `server\/c\.ts`, which does not exist/);
    });

    it('fails a listed entry that resolves now until --update takes it off, and never adds one', () => {
      const t = tree({ 'CLAUDE.md': '`server/b.ts` `server/new.ts`', 'server/b.ts': '' }, ['CLAUDE.md :: server/b.ts']);
      assert.equal(t.run(), 1);
      assert.match(t.out.error.join('\n'), /"CLAUDE\.md :: server\/b\.ts" is listed .* resolves now/);
      assert.match(t.out.error.join('\n'), /--update/);
      assert.equal(t.run({ update: true }), 1);
      assert.deepEqual(JSON.parse(readFileSync(join(root, 'scripts/ci/doc-paths-baseline.json'), 'utf8')), []);
    });

    it('prints every missing path with --list, and stops on a broken baseline', () => {
      const t = tree({ 'CLAUDE.md': '`server/a.ts`', 'server/b.ts': '' }, ['CLAUDE.md :: server/a.ts']);
      assert.equal(t.run({ list: true }), 0);
      assert.ok(t.out.log.includes('listed  CLAUDE.md :: server/a.ts'));
      writeFileSync(join(root, 'scripts/ci/doc-paths-baseline.json'), '{');
      assert.throws(() => t.run(), /not valid JSON/);
    });
  });
});
