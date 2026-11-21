import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AREAS, classify, decide, mirrorsPushRun } from './changed-areas.mjs';

const script = fileURLToPath(new URL('./changed-areas.mjs', import.meta.url));
const workflow = fileURLToPath(new URL('../../.github/workflows/test.yml', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'changed-areas-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const none = Object.fromEntries(Object.keys(AREAS).map((area) => [area, false]));
const every = Object.fromEntries(Object.keys(AREAS).map((area) => [area, true]));

// The run's context, cleared so a variable set around the test run cannot
// switch the script into mirror mode.
const NO_CONTEXT = { CI_EVENT: '', CI_BASE_REF: '', CI_HEAD_REF: '', CI_HEAD_REPO: '', CI_REPO: '' };
const RELEASE_PR_ENV = {
  CI_EVENT: 'pull_request',
  CI_BASE_REF: 'main',
  CI_HEAD_REF: 'dev',
  CI_HEAD_REPO: 'liketrek/TREK',
  CI_REPO: 'liketrek/TREK',
};

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_OUTPUT: '', ...NO_CONTEXT, ...env },
  });
}

describe('classify', () => {
  it('runs nothing for a docs-only change outside the wiki', () => {
    assert.deepEqual(classify(['README.md', 'server/CLAUDE.md', 'charts/README.md', 'docs/logo-trek-dark.svg']), none);
  });

  it('runs the tests and the image for a wiki change, markdown or not', () => {
    // The image ships wiki/ as the in-app help, help.test.ts serves its pages
    // and images, and the client's help registry test reads its headings.
    assert.deepEqual(classify(['wiki/Updating.md']), { code: true, image: true, deploy: false });
    assert.deepEqual(classify(['wiki/assets/TripPlanner.png']), { code: true, image: true, deploy: false });
  });

  it('runs the tests for markdown that a test reads as input', () => {
    // wiki.test.ts parses server/tests/fixtures/wiki/, so those pages are not docs.
    assert.deepEqual(classify(['server/tests/fixtures/wiki/Sample.md']), { code: true, image: true, deploy: false });
    assert.equal(classify(['client/tests/fixtures/notes.md']).code, true);
  });

  it('runs the tests and the image for a server change', () => {
    assert.deepEqual(classify(['server/src/nest/weather/weather.service.ts']), { code: true, image: true, deploy: false });
  });

  it('runs the Postgres probe and lane for every file they read', () => {
    // server-postgres is gated on `code`; a migration, a repository, the
    // engine, the baseline or the lane's own config must never skip it.
    for (const file of [
      'server/src/db/migrations/Migration20200101046440_x.ts',
      'server/src/db/repositories/Trips.repository.ts',
      'server/src/db/dialect/sql-functions.ts',
      'server/src/db/engine/postgres/schema-bootstrap.ts',
      'server/assets/postgres/baseline.sql',
      'server/scripts/pg-probe-baseline.json',
      'server/vitest.pg.config.ts',
      'server/tests/postgres/lane.ts',
      'server/tests/postgres/snapshot-suites-baseline.json',
    ]) {
      assert.equal(classify([file]).code, true, file);
    }
  });

  it('runs the tests but not the image for a plugin-sdk change', () => {
    assert.deepEqual(classify(['plugin-sdk/src/index.ts']), { code: true, image: false, deploy: false });
  });

  it('runs the tests but not the image for a change to the shared ratchet code', () => {
    assert.deepEqual(classify(['scripts/lib/ratchet.mjs']), { code: true, image: false, deploy: false });
  });

  it('runs the tests but not the image for a knip config change', () => {
    assert.deepEqual(classify(['knip.jsonc']), { code: true, image: false, deploy: false });
  });

  it('runs the image but not the tests for a .dockerignore change', () => {
    assert.deepEqual(classify(['.dockerignore']), { code: false, image: true, deploy: false });
  });

  it('runs the chart checks and the tests for a chart template or a compose file', () => {
    // config-templates.test.ts reads docker-compose.yml and the chart to pin
    // them to the code defaults, so a change to either runs the tests too.
    assert.deepEqual(classify(['charts/trek/templates/deployment.yaml']), { code: true, image: false, deploy: true });
    assert.deepEqual(classify(['charts/trek/values.yaml']), { code: true, image: false, deploy: true });
    assert.deepEqual(classify(['docker-compose.yml']), { code: true, image: false, deploy: true });
    assert.deepEqual(classify(['docker-compose.minio-test.yml']), { code: true, image: false, deploy: true });
    assert.equal(classify(['charts/README.md']).deploy, false);
    assert.equal(classify(['server/docker-compose.yml']).deploy, false);
    assert.equal(classify(['docs/docker-compose.yml']).code, false);
  });

  it('runs everything when the workflow or the classifier itself changes', () => {
    assert.deepEqual(classify(['.github/workflows/test.yml']), every);
    assert.deepEqual(classify(['scripts/ci/changed-areas.mjs']), every);
  });

  it('runs everything when a local action the jobs set up with changes', () => {
    assert.deepEqual(classify(['.github/actions/setup/action.yml']), every);
    assert.deepEqual(classify(['.github/actions/other/action.yaml']), every);
    // Another workflow is not one of them.
    assert.deepEqual(classify(['.github/workflows/security.yml']), none);
  });

  it('matches whole file names, not prefixes of them', () => {
    assert.deepEqual(classify(['package.json.bak', 'Dockerfile.old', 'serverless/x.ts', 'wikis/x.png']), none);
  });

  it('runs everything when there is no list, an empty one or a quoted path', () => {
    assert.deepEqual(classify(null), every);
    assert.deepEqual(classify(['', '  ']), every);
    assert.deepEqual(classify(['"wiki/\\303\\244.md"']), every);
  });

  it('reads CRLF lists the same as LF ones', () => {
    assert.deepEqual(classify(['README.md\r', 'server/src/index.ts\r']), { code: true, image: true, deploy: false });
    assert.deepEqual(classify(['README.md\r', 'charts/trek/values.yaml\r']), { code: true, image: false, deploy: true });
  });
});

describe('the mirror decision', () => {
  const releasePr = {
    event: 'pull_request',
    baseRef: 'main',
    headRef: 'dev',
    headRepo: 'liketrek/TREK',
    repo: 'liketrek/TREK',
  };

  it('mirrors the push run on the release pull request from dev into main', () => {
    assert.equal(mirrorsPushRun(releasePr), true);
  });

  it('tests every other run itself', () => {
    for (const [what, context] of [
      ['a push to dev', { ...releasePr, event: 'push', baseRef: '', headRef: '' }],
      ['a push to main', { event: 'push', repo: 'liketrek/TREK' }],
      ['a manual dispatch', { ...releasePr, event: 'workflow_dispatch' }],
      ['a feature PR into dev', { ...releasePr, baseRef: 'dev', headRef: 'feat/x' }],
      ['a hotfix PR into main', { ...releasePr, headRef: 'hotfix/x' }],
      ['a PR from main into dev', { ...releasePr, baseRef: 'dev', headRef: 'main' }],
      ['a fork whose branch is named dev', { ...releasePr, headRepo: 'someone/TREK' }],
      ['a PR without a head repository', { ...releasePr, headRepo: '' }],
      ['a run without a repository', { ...releasePr, headRepo: '', repo: '' }],
      ['no context at all', {}],
    ]) {
      assert.equal(mirrorsPushRun(context), false, what);
    }
  });

  it('turns every area off in mirror mode, whatever changed', () => {
    for (const files of [null, [], ['server/src/index.ts'], ['.github/workflows/test.yml']]) {
      assert.deepEqual(decide(files, releasePr), { ...none, mirror: true }, JSON.stringify(files));
    }
  });

  it('classifies the files as before outside mirror mode', () => {
    const feature = { ...releasePr, baseRef: 'dev', headRef: 'feat/x' };
    assert.deepEqual(decide(['README.md'], feature), { ...none, mirror: false });
    assert.deepEqual(decide(null, { event: 'push' }), { ...every, mirror: false });
    assert.deepEqual(decide(['charts/trek/values.yaml'], feature), {
      code: true,
      image: false,
      deploy: true,
      mirror: false,
    });
  });
});

describe('the command line', () => {
  it('writes the areas to stdout and to GITHUB_OUTPUT', () => {
    const list = join(scratch, 'list.txt');
    const output = join(scratch, 'output.txt');
    writeFileSync(list, 'charts/trek/values.yaml\n');
    writeFileSync(output, '');
    const result = run(['--files', list], { GITHUB_OUTPUT: output });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'code=true\nimage=false\ndeploy=true\nmirror=false\n');
    assert.equal(readFileSync(output, 'utf8'), 'code=true\nimage=false\ndeploy=true\nmirror=false\n');
  });

  it('turns everything on with --all', () => {
    const result = run(['--all']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'code=true\nimage=true\ndeploy=true\nmirror=false\n');
  });

  it('turns every area off and mirror on for the release pull request', () => {
    const list = join(scratch, 'release-list.txt');
    writeFileSync(list, 'server/src/index.ts\n');
    for (const args of [['--files', list], ['--all']]) {
      const result = run(args, RELEASE_PR_ENV);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, 'code=false\nimage=false\ndeploy=false\nmirror=true\n', JSON.stringify(args));
    }
  });

  it('still fails on an unreadable list in mirror mode', () => {
    const result = run(['--files', join(scratch, 'missing.txt')], RELEASE_PR_ENV);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
  });

  it('fails on a list it cannot read', () => {
    const result = run(['--files', join(scratch, 'missing.txt')]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ENOENT/);
    assert.equal(result.stdout, '');
  });

  it('fails on arguments it does not know', () => {
    for (const args of [[], ['--files'], ['--all', '--files', 'x'], ['list.txt']]) {
      const result = run(args);
      assert.equal(result.status, 1, `args ${JSON.stringify(args)}`);
      assert.match(result.stderr, /usage/);
    }
  });
});

describe('the file list test.yml builds', () => {
  // The git command of the changed_between helper, read out of test.yml so the
  // test runs what CI runs rather than a copy of it.
  function diffArgs(from, to) {
    const found = [...readFileSync(workflow, 'utf8').matchAll(/changed_between\(\) \{ git (.+?) > "\$list"; \}/g)];
    assert.equal(found.length, 1, 'test.yml must define changed_between exactly once');
    const args = found[0][1].split(/\s+/).map((arg) => arg.replace(/^"(.*)"$/, '$1'));
    assert.ok(args.includes('$1') && args.includes('$2'), `changed_between does not diff "$1" "$2": ${args.join(' ')}`);
    return args.map((arg) => (arg === '$1' ? from : arg === '$2' ? to : arg));
  }

  // A repository of its own, cut off from the user's and the system's git
  // config so neither commit signing nor a rename setting leaks into it.
  function scratchRepo() {
    const dir = mkdtempSync(join(scratch, 'repo-'));
    const globalConfig = join(scratch, `${basename(dir)}.gitconfig`);
    writeFileSync(globalConfig, '');
    const env = { ...process.env, GIT_CONFIG_GLOBAL: globalConfig, GIT_CONFIG_NOSYSTEM: '1' };
    const git = (...args) => execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' });
    git('init', '-q');
    git('config', 'user.name', 'test');
    git('config', 'user.email', 'test@example.invalid');
    return { dir, git };
  }

  function changedAfterMove(from, to) {
    const { dir, git } = scratchRepo();
    mkdirSync(dirname(join(dir, from)), { recursive: true });
    writeFileSync(join(dir, from), 'export const value = 1;\n'.repeat(20));
    git('add', '-A');
    git('commit', '-q', '-m', 'add');
    mkdirSync(dirname(join(dir, to)), { recursive: true });
    git('mv', from, to);
    git('commit', '-q', '-m', 'move');
    return git(...diffArgs('HEAD^1', 'HEAD')).split('\n');
  }

  it('lists a moved file under its old path, so a move out of an area still runs it', () => {
    const files = changedAfterMove('server/src/a.ts', 'docs/a.ts');
    assert.ok(files.includes('server/src/a.ts'), `old path missing from ${JSON.stringify(files)}`);
    assert.deepEqual(classify(files), { code: true, image: true, deploy: false });
  });

  it('runs the chart checks when a chart template moves out of charts/', () => {
    const files = changedAfterMove('charts/trek/templates/secret.yaml', 'docs/secret.yaml');
    assert.equal(classify(files).deploy, true);
  });
});
