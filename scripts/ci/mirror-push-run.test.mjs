import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assess, GRACE_MS, INTERVAL_MS, mirror, TIMEOUT_MS } from './mirror-push-run.mjs';

const SHA = 'a'.repeat(40);
const REPO = 'liketrek/TREK';
const RUN_URL = 'https://github.com/liketrek/TREK/actions/runs/7';

const pushRun = (fields = {}) => ({
  id: 7,
  head_sha: SHA,
  event: 'push',
  head_branch: 'dev',
  status: 'in_progress',
  conclusion: null,
  html_url: RUN_URL,
  ...fields,
});
const ciOk = (status, conclusion = null) => ({ id: 70, name: 'ci-ok', status, conclusion, html_url: `${RUN_URL}/job/70` });
const otherJob = { id: 71, name: 'Server tests 1/10', status: 'completed', conclusion: 'success' };

/**
 * A fake GitHub API. `looks` holds one answer per look: { runs, jobs } or
 * { error } (a status code, or 'network'). The last look repeats.
 */
function fakeApi(looks) {
  const calls = [];
  let look = -1;
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const path = url.replace('https://api.github.test', '');
    if (path.includes('/actions/workflows/')) look += 1;
    const answer = looks[Math.min(look, looks.length - 1)];
    if (answer.error === 'network') throw new Error('socket hang up');
    if (answer.error) return { ok: false, status: answer.error, json: async () => ({}) };
    if (path.includes('/actions/workflows/')) {
      return { ok: true, status: 200, json: async () => ({ workflow_runs: answer.runs ?? [] }) };
    }
    const jobs = answer.jobs ?? [];
    return { ok: true, status: 200, json: async () => ({ total_count: jobs.length, jobs }) };
  };
  return { fetch, calls };
}

function fakeClock() {
  let now = 0;
  return { now: () => now, sleep: async (ms) => void (now += ms), elapsed: () => now };
}

async function mirrorWith(looks, options = {}) {
  const { fetch, calls } = fakeApi(looks);
  const clock = fakeClock();
  const lines = [];
  const result = await mirror({
    sha: SHA,
    repo: REPO,
    token: 'secret',
    apiUrl: 'https://api.github.test',
    fetch,
    clock,
    log: (line) => lines.push(line),
    ...options,
  });
  return { ...result, calls, lines, elapsed: clock.elapsed() };
}

describe('mirror', () => {
  it('passes when the push run ci-ok passed', async () => {
    const result = await mirrorWith([{ runs: [pushRun()], jobs: [otherJob, ciOk('completed', 'success')] }]);
    assert.equal(result.ok, true, result.message);
    assert.match(result.message, /passed/);
    assert.equal(result.elapsed, 0);
  });

  it('asks for exactly the push runs of test.yml on dev for the commit, with the token', async () => {
    const { calls } = await mirrorWith([{ runs: [pushRun()], jobs: [ciOk('completed', 'success')] }]);
    const runs = new URL(calls[0].url);
    assert.equal(runs.pathname, `/repos/${REPO}/actions/workflows/test.yml/runs`);
    assert.equal(runs.searchParams.get('head_sha'), SHA);
    assert.equal(runs.searchParams.get('event'), 'push');
    assert.equal(runs.searchParams.get('branch'), 'dev');
    assert.equal(calls[0].init.headers.Authorization, 'Bearer secret');
    const jobs = new URL(calls[1].url);
    assert.equal(jobs.pathname, `/repos/${REPO}/actions/runs/7/jobs`);
    assert.equal(jobs.searchParams.get('filter'), 'latest');
  });

  it('fails when the push run ci-ok failed', async () => {
    const result = await mirrorWith([
      { runs: [pushRun({ status: 'completed', conclusion: 'failure' })], jobs: [ciOk('completed', 'failure')] },
    ]);
    assert.equal(result.ok, false);
    assert.match(result.message, /ci-ok of the push run is failure/);
  });

  it('fails when the push run ci-ok was cancelled', async () => {
    const result = await mirrorWith([
      { runs: [pushRun({ status: 'completed', conclusion: 'cancelled' })], jobs: [ciOk('completed', 'cancelled')] },
    ]);
    assert.equal(result.ok, false);
    assert.match(result.message, /is cancelled/);
  });

  it('fails when the push run ended before ci-ok ran', async () => {
    const result = await mirrorWith([{ runs: [pushRun({ status: 'completed', conclusion: 'cancelled' })], jobs: [] }]);
    assert.equal(result.ok, false);
    assert.match(result.message, /ended cancelled without a ci-ok verdict/);
  });

  it('fails closed after the grace when no push run exists', async () => {
    const result = await mirrorWith([{ runs: [] }]);
    assert.equal(result.ok, false);
    assert.match(result.message, /No push run of test\.yml on dev exists/);
    assert.match(result.message, /re-run this job/);
    assert.ok(result.elapsed >= GRACE_MS && result.elapsed < GRACE_MS + 2 * INTERVAL_MS, String(result.elapsed));
  });

  it('counts no run of another event, branch or commit', async () => {
    const result = await mirrorWith([
      {
        runs: [
          pushRun({ event: 'workflow_dispatch' }),
          pushRun({ event: 'pull_request' }),
          pushRun({ head_branch: 'main' }),
          pushRun({ head_sha: 'b'.repeat(40) }),
        ],
        jobs: [ciOk('completed', 'success')],
      },
    ]);
    assert.equal(result.ok, false);
    assert.match(result.message, /No push run/);
  });

  it('reads the newest push run when there are several', async () => {
    const { fetch, calls } = fakeApi([{ runs: [pushRun({ id: 7 }), pushRun({ id: 9 })], jobs: [ciOk('completed', 'success')] }]);
    const result = await mirror({ sha: SHA, repo: REPO, token: 't', apiUrl: 'https://api.github.test', fetch, clock: fakeClock() });
    assert.equal(result.ok, true);
    assert.match(calls[1].url, /\/actions\/runs\/9\/jobs/);
  });

  it('waits while the push run is still going, then passes', async () => {
    const result = await mirrorWith([
      { runs: [] },
      { runs: [pushRun({ status: 'queued' })], jobs: [] },
      { runs: [pushRun()], jobs: [ciOk('queued')] },
      { runs: [pushRun()], jobs: [ciOk('in_progress')] },
      { runs: [pushRun({ status: 'completed', conclusion: 'success' })], jobs: [ciOk('completed', 'success')] },
    ]);
    assert.equal(result.ok, true, result.message);
    assert.equal(result.elapsed, 4 * INTERVAL_MS);
    assert.equal(result.lines.length, 4, result.lines.join('\n'));
  });

  it('logs a waiting state once, not on every look', async () => {
    const looks = Array.from({ length: 5 }, () => ({ runs: [pushRun()], jobs: [ciOk('queued')] }));
    looks.push({ runs: [pushRun()], jobs: [ciOk('completed', 'success')] });
    const result = await mirrorWith(looks);
    assert.equal(result.ok, true);
    assert.equal(result.lines.length, 1);
  });

  it('gives up with a re-run hint at the timeout, before ci-ok would be killed', async () => {
    const result = await mirrorWith([{ runs: [pushRun()], jobs: [ciOk('in_progress')] }]);
    assert.equal(result.ok, false);
    assert.match(result.message, /Gave up after 17 min/);
    assert.match(result.message, /re-run this job/);
    assert.ok(result.message.includes(RUN_URL));
    assert.ok(result.elapsed <= TIMEOUT_MS, String(result.elapsed));
    assert.ok(result.elapsed > TIMEOUT_MS - 2 * INTERVAL_MS, String(result.elapsed));
  });

  it('rides out a passing API error', async () => {
    const result = await mirrorWith([
      { error: 502 },
      { error: 'network' },
      { runs: [pushRun()], jobs: [ciOk('completed', 'success')] },
    ]);
    assert.equal(result.ok, true, result.message);
  });

  it('fails after the API failed three times in a row', async () => {
    const result = await mirrorWith([{ error: 403 }]);
    assert.equal(result.ok, false);
    assert.match(result.message, /failed 3 times in a row/);
  });

  it('reads every page of jobs', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `job ${i}`, status: 'completed', conclusion: 'success' }));
    let jobCalls = 0;
    const fetch = async (url) => {
      if (url.includes('/actions/workflows/')) return { ok: true, json: async () => ({ workflow_runs: [pushRun()] }) };
      jobCalls += 1;
      const jobs = new URL(url).searchParams.get('page') === '1' ? page1 : [ciOk('completed', 'success')];
      return { ok: true, json: async () => ({ total_count: 101, jobs }) };
    };
    const result = await mirror({ sha: SHA, repo: REPO, token: 't', fetch, clock: fakeClock() });
    assert.equal(result.ok, true, result.message);
    assert.equal(jobCalls, 2);
  });
});

describe('assess', () => {
  it('waits for a missing run only within the grace', () => {
    assert.equal(assess({ run: null, check: null, sha: SHA, elapsed: 0 }).done, false);
    assert.equal(assess({ run: null, check: null, sha: SHA, elapsed: GRACE_MS }).done, true);
  });

  it('passes only a completed ci-ok whose conclusion is success', () => {
    for (const conclusion of ['failure', 'cancelled', 'skipped', 'timed_out', 'neutral', 'action_required']) {
      const result = assess({ run: pushRun(), check: ciOk('completed', conclusion), sha: SHA, elapsed: 0 });
      assert.deepEqual([result.done, result.ok], [true, false], conclusion);
    }
    const green = assess({ run: pushRun(), check: ciOk('completed', 'success'), sha: SHA, elapsed: 0 });
    assert.deepEqual([green.done, green.ok], [true, true]);
  });
});
