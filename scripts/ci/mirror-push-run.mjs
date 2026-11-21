#!/usr/bin/env node
// Mirrors the push run's ci-ok onto the release pull request.
//
// The release pull request (dev into main) always carries the head of dev, and
// every push to dev runs test.yml on exactly that commit. Running the whole
// workflow a second time for the pull request doubled the jobs past the
// organisation's slots, so on that pull request changes turns every area off
// (scripts/ci/changed-areas.mjs) and ci-ok runs this script instead: it waits
// for the ci-ok of the push run of test.yml on dev for the pull request's head
// commit and passes or fails with it.
//
// A green push ci-ok means every area the pull request brings in was tested:
// a push to dev lists its changes against the merge base with main (the
// "List the changed files" step in test.yml), not against the previous push,
// so a cancelled or red earlier push cannot hide under a later docs-only one.
//
// It never passes without a real test of that exact commit. No push run for
// it, a push run that ended without a ci-ok verdict, a ci-ok that is not
// success, an API that keeps failing, or a wait past the timeout all fail,
// each with what to do next.
//
// Usage (in ci-ok, with GITHUB_TOKEN, GITHUB_REPOSITORY and GITHUB_API_URL set):
//   HEAD_SHA=<sha> node scripts/ci/mirror-push-run.mjs

import { fileURLToPath } from 'node:url';

export const WORKFLOW_FILE = 'test.yml';
export const BRANCH = 'dev';
export const CHECK = 'ci-ok';

// The push run starts about 20 s before the pull request run, so it is there
// on the first look. A short grace covers GitHub creating them the other way
// round.
export const GRACE_MS = 3 * 60_000;
export const INTERVAL_MS = 20_000;
// Below ci-ok's timeout-minutes in test.yml (workflow-jobs.test.mjs holds the
// margin), so the script always ends with its own message, not a kill.
export const TIMEOUT_MS = 17 * 60_000;
export const MAX_API_ERRORS = 3;

const minutes = (ms) => `${Math.round(ms / 60_000)} min`;

class ApiError extends Error {}

function api({ fetch, apiUrl, token }) {
  return async (path) => {
    let response;
    try {
      response = await fetch(`${apiUrl}${path}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    } catch (err) {
      throw new ApiError(`GET ${path} failed: ${err instanceof Error ? err.message : err}`);
    }
    if (!response.ok) throw new ApiError(`GET ${path} answered ${response.status}`);
    return response.json();
  };
}

/** The newest push run of test.yml on dev for the commit, or null. */
async function findPushRun(get, repo, sha) {
  const query = new URLSearchParams({ head_sha: sha, event: 'push', branch: BRANCH, per_page: '100' });
  const body = await get(`/repos/${repo}/actions/workflows/${WORKFLOW_FILE}/runs?${query}`);
  if (!Array.isArray(body?.workflow_runs)) throw new ApiError('the runs answer has no workflow_runs array');
  const runs = body.workflow_runs.filter(
    (run) => run.head_sha === sha && run.event === 'push' && run.head_branch === BRANCH,
  );
  return runs.reduce((newest, run) => (newest === null || run.id > newest.id ? run : newest), null);
}

/** The ci-ok job of the run's latest attempt, or null while it has none. */
async function findCheck(get, repo, runId) {
  const jobs = [];
  for (let page = 1; ; page += 1) {
    const body = await get(`/repos/${repo}/actions/runs/${runId}/jobs?filter=latest&per_page=100&page=${page}`);
    if (!Array.isArray(body?.jobs)) throw new ApiError('the jobs answer has no jobs array');
    jobs.push(...body.jobs);
    if (body.jobs.length === 0 || jobs.length >= (body.total_count ?? 0)) break;
  }
  const named = jobs.filter((job) => job.name === CHECK);
  return named.reduce((newest, job) => (newest === null || job.id > newest.id ? job : newest), null);
}

/**
 * One look at the push run. Returns { done: false, note } to keep waiting, or
 * { done: true, ok, message } once the verdict is known.
 */
export function assess({ run, check, sha, elapsed, grace = GRACE_MS }) {
  if (!run) {
    if (elapsed < grace) return { done: false, note: `No push run of ${WORKFLOW_FILE} on ${BRANCH} for ${sha} yet.` };
    return {
      done: true,
      ok: false,
      message: `No push run of ${WORKFLOW_FILE} on ${BRANCH} exists for ${sha}, so nothing tested this commit. Push it to ${BRANCH} (or run CI on ${BRANCH} again), then re-run this job.`,
    };
  }
  const where = run.html_url ?? `run ${run.id}`;
  if (check?.status === 'completed') {
    if (check.conclusion === 'success') {
      return { done: true, ok: true, message: `${CHECK} of the push run passed on ${sha}: ${check.html_url ?? where}` };
    }
    return {
      done: true,
      ok: false,
      message: `${CHECK} of the push run is ${check.conclusion} on ${sha}: ${check.html_url ?? where}. Fix it on ${BRANCH}, or re-run that push run, then re-run this job.`,
    };
  }
  if (run.status === 'completed') {
    return {
      done: true,
      ok: false,
      message: `The push run ${where} ended ${run.conclusion} without a ${CHECK} verdict on ${sha}. Re-run it, then re-run this job.`,
    };
  }
  return {
    done: false,
    note: `Waiting for the push run ${where}: run ${run.status}, ${CHECK} ${check ? check.status : 'not started'}.`,
  };
}

/**
 * Waits for the push run's ci-ok and returns { ok, message }.
 *
 * @param {object} options
 * @param {string} options.sha the pull request's head commit
 * @param {string} options.repo owner/name
 * @param {string} options.token a token with actions: read
 * @param {string} [options.apiUrl]
 * @param {typeof fetch} options.fetch
 * @param {{ now(): number, sleep(ms: number): Promise<void> }} options.clock
 * @param {(line: string) => void} [options.log]
 */
export async function mirror({
  sha,
  repo,
  token,
  apiUrl = 'https://api.github.com',
  fetch,
  clock,
  log = () => {},
  interval = INTERVAL_MS,
  timeout = TIMEOUT_MS,
  grace = GRACE_MS,
  maxApiErrors = MAX_API_ERRORS,
}) {
  const get = api({ fetch, apiUrl, token });
  const start = clock.now();
  let errors = 0;
  let lastNote = '';
  let lastRun = null;
  for (;;) {
    try {
      const run = await findPushRun(get, repo, sha);
      const check = run ? await findCheck(get, repo, run.id) : null;
      errors = 0;
      lastRun = run;
      const result = assess({ run, check, sha, elapsed: clock.now() - start, grace });
      if (result.done) return { ok: result.ok, message: result.message };
      if (result.note !== lastNote) log(result.note);
      lastNote = result.note;
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      errors += 1;
      log(`The API failed (${errors} of ${maxApiErrors}): ${err.message}`);
      if (errors >= maxApiErrors) {
        return {
          ok: false,
          message: `The GitHub API failed ${maxApiErrors} times in a row (${err.message}), so the push run's ${CHECK} is unknown. Re-run this job.`,
        };
      }
    }
    if (clock.now() - start + interval > timeout) break;
    await clock.sleep(interval);
  }
  const where = lastRun?.html_url ?? `the push run of ${WORKFLOW_FILE} on ${BRANCH}`;
  return {
    ok: false,
    message: `Gave up after ${minutes(timeout)}: ${CHECK} of ${where} has not finished on ${sha}. Once it has, re-run this job; it then reads the verdict at once.`,
  };
}

async function main() {
  const sha = process.env.HEAD_SHA ?? '';
  const repo = process.env.GITHUB_REPOSITORY ?? '';
  const token = process.env.GITHUB_TOKEN ?? '';
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`HEAD_SHA is not a commit: "${sha}"`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`GITHUB_REPOSITORY is not owner/name: "${repo}"`);
  if (!token) throw new Error('GITHUB_TOKEN is empty');
  const result = await mirror({
    sha,
    repo,
    token,
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    fetch: globalThis.fetch,
    clock: { now: () => Date.now(), sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) },
    log: (line) => console.log(line),
  });
  if (!result.ok) {
    console.log(`::error::${result.message}`);
    process.exit(1);
  }
  console.log(result.message);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.log(`::error::${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
