import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ci-ok is the one required check, and a job counts for a merge only once it
// is in ci-ok's needs. A new or renamed job that is left out runs, can fail,
// and merges anyway. The scan is the one job kept out on purpose (see the
// layout notes at the top of test.yml).
const workflow = readFileSync(fileURLToPath(new URL('../../.github/workflows/test.yml', import.meta.url)), 'utf8');
const NOT_REQUIRED = new Set(['ci-ok', 'scan']);
const SHARD = '${{ matrix.shard }}';

function jobs(source = workflow) {
  const body = source.slice(source.indexOf('\njobs:\n'));
  const starts = [...body.matchAll(/^ {2}([a-z0-9-]+):\s*$/gm)];
  return starts.map((match, i) => ({ id: match[1], text: body.slice(match.index, starts[i + 1]?.index) }));
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
    for (const id of ['server-postgres', 'server-tests', 'client-tests']) {
      assert.ok(
        ids.includes(id),
        `${id} no longer names matrix.shard or --shard; when it stopped being sliced, drop it from this list in scripts/ci/workflow-jobs.test.mjs`,
      );
    }
  });

  for (const job of slicedJobs()) {
    it(`slices ${job.id} alike in its matrix, its name and its --shard`, () => {
      assert.deepEqual(sliceProblems(job), []);
    });
  }
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
