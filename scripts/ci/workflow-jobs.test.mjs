import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ci-ok is the one required check, and a job counts for a merge only once it
// is in ci-ok's needs. A new or renamed job that is left out runs, can fail,
// and merges anyway. The scan is the one job kept out on purpose (see the
// layout notes at the top of test.yml).
const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const workflow = read('../../.github/workflows/test.yml');
const setupAction = read('../../.github/actions/setup/action.yml');
const lockfile = JSON.parse(read('../../package-lock.json'));
const NOT_REQUIRED = new Set(['ci-ok', 'scan']);
const SHARD = '${{ matrix.shard }}';

function jobs(source = workflow) {
  const body = source.slice(source.indexOf('\njobs:\n'));
  const starts = [...body.matchAll(/^ {2}([a-z0-9-]+):\s*$/gm)];
  return starts.map((match, i) => ({ id: match[1], text: body.slice(match.index, starts[i + 1]?.index) }));
}

/** A job's text without its comment lines, so prose about a step never counts as the step. */
const withoutComments = (text) => text.replace(/^\s*#.*\n/gm, '');

/** The steps of a job, each from its "- " line to the next. */
const stepsOf = (text) =>
  withoutComments(text)
    .split(/\n(?= {6}- )/)
    .slice(1);

/** The check name a job reports, without the quotes around it; null when it sets none. */
function nameOf(text) {
  const raw = /^ {4}name: (.+)$/m.exec(text)?.[1];
  return raw === undefined ? null : raw.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');
}

/** The job ids under a job's needs:, one per line. */
function needsOf(text) {
  const block = /^ {4}needs:\n((?: {6}- [a-z0-9-]+\n)+)/m.exec(withoutComments(text));
  return block
    ? block[1]
        .trim()
        .split('\n')
        .map((line) => line.replace(/^\s*- /, ''))
    : [];
}

// Every check name reads "<Area> <what>[ <variant>][ i/n]": the area first,
// from a fixed set, so the checks list sorts by area; no colon, no
// parentheses and no middle dot, and a slice only at the end.
const NAME_FORM = /^(Changes|Shared|Server|Client|Docker|Sonar)( [^:·()]+)?$/;
const SLICE_AT_END = /\$\{\{ matrix\.shard \}\}\/\d+$/;

/** What is wrong with one job's check name, each said as the fix to make. */
function nameProblems(id, name) {
  if (name === null) return [`${id}: give it a name: of the form "<Area> <what>[ i/n]"`];
  const problems = [];
  if (!NAME_FORM.test(name)) {
    problems.push(
      `${id}: "${name}" must start with Changes, Shared, Server, Client, Docker or Sonar and hold no colon, parentheses or middle dot`,
    );
  }
  if (name.includes(SHARD) && !SLICE_AT_END.test(name)) {
    problems.push(`${id}: put the slice "${SHARD}/n" at the end of "${name}"`);
  }
  return problems;
}

function jobIds() {
  return jobs().map((job) => job.id);
}

function ciOkNeeds() {
  const block = /^ {2}ci-ok:\n {4}needs:\n((?: {6}- [a-z0-9-]+\n)+)/m.exec(workflow);
  assert.ok(block, 'test.yml must declare ci-ok with a needs: list, one job per line');
  return block[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*- /, ''));
}

// A sliced job states its slice count three times: the shard axis of its
// matrix, the "<i>/<n>" in its name and the --shard=<i>/<n> it hands vitest.
// Changing one and not the others passes and still goes wrong: a divisor
// above the axis leaves part of the suite in no slice, one below it runs a
// slice vitest refuses, and a stale name reports the wrong count. Every job
// that names matrix.shard or runs --shard counts as sliced, so a job whose
// axis is written in a form this reader does not know fails instead of
// going unchecked.
function slicedJobs(source = workflow) {
  return jobs(source)
    .map(({ id, text }) => ({ id, text: text.replace(/^\s*#.*\n/gm, '') }))
    .filter(({ text }) => /matrix\.shard|--shard/.test(text))
    .map(({ id, text }) => {
      const axis = /^ {8}shard: \[([^\]]*)\]\s*$/m.exec(text);
      return {
        id,
        shards: axis ? axis[1].split(',').map((value) => Number(value.trim())) : null,
        name: /^ {4}name: (.+)$/m.exec(text)?.[1] ?? '',
        shardArgs: [...text.matchAll(/--shard(?:=|\s+)(\$\{\{ matrix\.shard \}\}\/\d+|\S+)/g)].map((match) => match[1]),
      };
    });
}

/** What is wrong with one sliced job, each said as the fix to make; empty when the three counts agree. */
function sliceProblems(job) {
  if (!job.shards) {
    return [
      `${job.id}: it uses matrix.shard or --shard, but its matrix has no one-line axis "shard: [1, ..., n]". Write the axis in that form, or teach slicedJobs() in scripts/ci/workflow-jobs.test.mjs the new form (a matrix include with a count per entry, say) in the same change`,
    ];
  }
  const n = job.shards.length;
  const oneToN = Array.from({ length: n }, (_, i) => i + 1);
  const expected = `${SHARD}/${n}`;
  const problems = [];
  if (job.shards.join() !== oneToN.join()) problems.push(`${job.id}: write the shard axis as [${oneToN.join(', ')}]`);
  if (
    !job.name
      .split(expected)
      .slice(1)
      .some((rest) => !/^\d/.test(rest))
  ) {
    problems.push(
      `${job.id}: the shard axis has ${n} slices, so the job name must say "${expected}" (it reads ${job.name})`,
    );
  }
  if (job.shardArgs.length === 0) problems.push(`${job.id}: no step runs vitest with --shard=${expected}`);
  for (const arg of job.shardArgs) {
    if (arg !== expected) {
      problems.push(
        `${job.id}: the shard axis has ${n} slices but a step runs --shard=${arg}; write --shard=${expected}, and change the axis, the name and every --shard together`,
      );
    }
  }
  return problems;
}

describe('test.yml', () => {
  it('lists every job but the scan in ci-ok needs', () => {
    const needs = new Set(ciOkNeeds());
    const missing = jobIds().filter((id) => !NOT_REQUIRED.has(id) && !needs.has(id));
    assert.deepEqual(missing, [], `add these jobs to ci-ok's needs: in test.yml: ${missing.join(', ')}`);
  });

  it('names only jobs that exist in ci-ok needs', () => {
    const ids = new Set(jobIds());
    const unknown = ciOkNeeds().filter((id) => !ids.has(id));
    assert.deepEqual(unknown, [], `ci-ok needs jobs test.yml does not define: ${unknown.join(', ')}`);
  });

  it('finds the sliced jobs', () => {
    const ids = slicedJobs().map((job) => job.id);
    for (const id of ['client-e2e', 'client-tests', 'server-postgres', 'server-tests']) {
      assert.ok(
        ids.includes(id),
        `${id} no longer names matrix.shard or --shard; when it stopped being sliced, drop it from this list in scripts/ci/workflow-jobs.test.mjs`,
      );
    }
  });

  it('names every check "<Area> <what>[ i/n]"', () => {
    const problems = jobs()
      .filter(({ id }) => id !== 'ci-ok')
      .flatMap(({ id, text }) => nameProblems(id, nameOf(text)));
    assert.deepEqual(problems, []);
  });

  it('keeps ci-ok under its own name, the one the ruleset requires', () => {
    const ciOk = jobs().find(({ id }) => id === 'ci-ok');
    assert.ok(ciOk, 'test.yml must define ci-ok');
    assert.equal(nameOf(ciOk.text), null, 'ci-ok reports under its job id; a name: would rename the required check');
  });

  // A coverage artifact the scan does not wait for may be missing when it
  // runs, and Sonar then reports every line of that package as uncovered.
  it('lets the scan wait for every job that uploads Sonar coverage', () => {
    const scan = jobs().find(({ id }) => id === 'scan');
    assert.ok(scan, 'test.yml must define scan');
    const needs = new Set(needsOf(scan.text));
    const uploaders = jobs()
      .filter(({ text }) =>
        stepsOf(text).some(
          (step) => /uses: actions\/upload-artifact@/.test(step) && /name: sonar-[\w-]+-coverage/.test(step),
        ),
      )
      .map(({ id }) => id);
    assert.ok(uploaders.length >= 3, `expected the coverage uploads, found them in: ${uploaders.join(', ')}`);
    const missing = uploaders.filter((id) => !needs.has(id));
    assert.deepEqual(missing, [], `add these jobs to scan's needs: in test.yml: ${missing.join(', ')}`);
  });

  // A hung job holds its slot until the timeout, and the default is six hours.
  it('bounds every job with a timeout of at most 20 minutes', () => {
    const problems = jobs().flatMap(({ id, text }) => {
      const minutes = /^ {4}timeout-minutes: (\d+)\s*$/m.exec(text)?.[1];
      if (minutes === undefined) return [`${id}: set timeout-minutes (at most 20)`];
      return Number(minutes) > 20 ? [`${id}: timeout-minutes is ${minutes}, at most 20`] : [];
    });
    assert.deepEqual(problems, []);
  });

  // The setup action restores node_modules from an exact cache and runs npm
  // ci only on a miss; a job that installs on its own pays the install on
  // every run. plugin-sdk has its own lockfile and installs in its own
  // directory, outside the workspaces the action covers.
  it('installs the workspaces only through ./.github/actions/setup', () => {
    const problems = jobs().flatMap(({ id, text }) =>
      stepsOf(text)
        .filter((step) => /\bnpm (ci|install|i)\b/.test(step) && !/^ {8}working-directory: plugin-sdk\s*$/m.test(step))
        .map((step) => `${id}: "${step.split('\n')[0].trim()}" installs with npm; use ./.github/actions/setup`),
    );
    assert.deepEqual(problems, []);
    assert.ok(
      jobs().some(({ text }) => /uses: \.\/\.github\/actions\/setup\s*$/m.test(text)),
      'no job uses ./.github/actions/setup',
    );
  });

  // Dependabot bumps @playwright/test in the lockfile only. The browsers the
  // flows run in come from the container, so its tag has to follow by hand,
  // and the digest pins exactly that image.
  it('runs e2e in the Playwright image of the version the lockfile pins', () => {
    const e2e = jobs().find(({ id }) => id === 'client-e2e');
    assert.ok(e2e, 'test.yml must define client-e2e');
    const image = /^ {6}image: (\S+)\s*$/m.exec(withoutComments(e2e.text))?.[1] ?? '';
    const pinned = /^mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)-noble@sha256:[0-9a-f]{64}$/.exec(image);
    assert.ok(
      pinned,
      `client-e2e's container must be mcr.microsoft.com/playwright:v<version>-noble@sha256:<digest>, not "${image}"`,
    );
    const locked = lockfile.packages['node_modules/@playwright/test']?.version;
    assert.ok(locked, 'package-lock.json has no node_modules/@playwright/test');
    assert.equal(
      pinned[1],
      locked,
      `the lockfile pins @playwright/test ${locked}: set client-e2e's image to v${locked}-noble with that tag's digest (docker buildx imagetools inspect mcr.microsoft.com/playwright:v${locked}-noble)`,
    );
  });

  for (const job of slicedJobs()) {
    it(`slices ${job.id} alike in its matrix, its name and its --shard`, () => {
      assert.deepEqual(sliceProblems(job), []);
    });
  }
});

describe('the setup action', () => {
  const steps = setupAction.split(/\n(?= {4}- )/).slice(1);

  // A restore-keys fallback would hand a job a tree built from another
  // lockfile or on another image. Only the npm download cache may fall back:
  // npm ci checks each tarball against the lockfile.
  it('restores node_modules and shared/dist only on an exact key', () => {
    const restores = steps.filter(
      (step) => /actions\/cache\/restore@/.test(step) && !/^ {8}path: ~\/\.npm\s*$/m.test(step),
    );
    assert.ok(restores.length >= 2, 'expected a restore for node_modules and one for shared/dist');
    for (const step of restores) assert.doesNotMatch(step, /restore-keys/, step);
  });

  // The full actions/cache action saves in its post step on every event, pull
  // requests included, so every cache is restored and saved in two steps.
  it('uses only the split restore and save actions', () => {
    for (const step of steps) assert.doesNotMatch(step, /uses: actions\/cache@/, step);
  });

  // npm ci refuses a package.json that disagrees with the lockfile; a cache hit
  // skips it, so a changed package.json has to miss.
  it('keys node_modules on the lockfile and every workspace package.json', () => {
    const deps = setupAction.match(/^ +DEPS: \$\{\{ hashFiles\((.*)\) \}\}$/m);
    assert.ok(deps, 'expected a DEPS hash in the key step');
    const files = deps[1].split(',').map((file) => file.trim().replace(/^'|'$/g, ''));
    const wanted = ['package-lock.json', 'package.json', 'client/package.json', 'server/package.json', 'shared/package.json'];
    for (const file of wanted) {
      assert.ok(files.includes(file), `the node_modules key does not hash ${file}`);
    }
  });

  // Pull requests read what their base left; a PR that saved could evict the
  // base's caches and fill the quota with trees of its own.
  it('saves only on a push to dev or main', () => {
    assert.match(
      setupAction,
      /save=\$\{\{ github\.event_name == 'push' && \(github\.ref == 'refs\/heads\/dev' \|\| github\.ref == 'refs\/heads\/main'\) \}\}/,
    );
    const saves = steps.filter((step) => /actions\/cache\/save@/.test(step));
    assert.ok(saves.length >= 3, 'expected a save for node_modules, the npm download cache and shared/dist');
    for (const step of saves) assert.match(step, /steps\.keys\.outputs\.save == 'true'/, step);
  });
});

describe('the name reader', () => {
  it('passes names of the form', () => {
    const names = [
      'Changes',
      'Shared tests',
      `Server tests ${SHARD}/10`,
      `Server Postgres \${{ matrix.postgres }} ${SHARD}/3`,
      'Docker and Helm',
      'Sonar',
    ];
    for (const name of names) assert.deepEqual(nameProblems('job', name), [], name);
  });

  it('fails a colon, parentheses, a dot separator, an unknown area, a slice before the end and no name', () => {
    for (const name of [
      'Server: Types',
      `Server Postgres 14 (${SHARD}/2)`,
      'Client · Lint',
      'Repo Sonar scan',
      `Server tests ${SHARD}/10 extra`,
      null,
    ]) {
      assert.notDeepEqual(nameProblems('job', name), [], String(name));
    }
  });

  it('reads a quoted name without its quotes', () => {
    assert.equal(nameOf("    name: 'Server types'\n"), 'Server types');
    assert.equal(nameOf('    name: Server types\n'), 'Server types');
    assert.equal(nameOf('    runs-on: ubuntu-24.04\n'), null);
  });
});

describe('the slice reader', () => {
  const run = (arg) => `    steps:\n      - run: npx vitest run --shard=${arg}\n`;
  const workflowWith = (job) => `name: t\njobs:\n  sliced:\n${job}`;
  const matrixJob = (axis, name, arg) =>
    workflowWith(`    name: '${name}'\n    strategy:\n      matrix:\n${axis}${run(arg)}`);
  const problems = (source) => {
    const found = slicedJobs(source);
    assert.equal(found.length, 1, 'the reader must see the one sliced job');
    return sliceProblems(found[0]).join('\n');
  };

  it('passes a job whose axis, name and --shard agree', () => {
    assert.equal(problems(matrixJob('        shard: [1, 2]\n', `T ${SHARD}/2`, `${SHARD}/2`)), '');
  });

  it('fails a job whose axis is a block list it cannot read', () => {
    const blockList = '        shard:\n          - 1\n          - 2\n';
    assert.match(problems(matrixJob(blockList, `T ${SHARD}/2`, `${SHARD}/2`)), /has no one-line axis/);
  });

  it('fails a job that runs --shard without a matrix', () => {
    assert.match(problems(workflowWith(`    name: 'T'\n${run('1/2')}`)), /has no one-line axis/);
  });

  it('fails a fixed --shard and a stale divisor', () => {
    assert.match(problems(matrixJob('        shard: [1, 2]\n', `T ${SHARD}/2`, '1/2')), /runs --shard=1\/2; write/);
    assert.match(problems(matrixJob('        shard: [1, 2]\n', `T ${SHARD}/2`, `${SHARD}/3`)), /\}\}\/3; write/);
  });

  it('reads a comment about --shard above the next job as no one job', () => {
    const source = `${workflowWith(`    name: 'Plain'\n`)}  # runs in two slices (--shard=<i>/2)\n  other:\n    name: 'Other'\n`;
    assert.deepEqual(slicedJobs(source), []);
  });

  it('fails a name whose count only starts like the axis', () => {
    assert.match(problems(matrixJob('        shard: [1, 2]\n', `T ${SHARD}/20`, `${SHARD}/2`)), /job name must say/);
  });
});
