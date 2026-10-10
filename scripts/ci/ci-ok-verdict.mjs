#!/usr/bin/env node
// Decides whether a commit has a green ci-ok, for the release workflows.
//
// docker.yml and docker-dev.yml refuse to build a commit unless ci-ok passed
// on it. They fetch every ci-ok check run on the commit, earlier attempts
// included (GET /repos/{repo}/commits/{sha}/check-runs?check_name=ci-ok&filter=all),
// and hand the response to this script.
//
// A commit can carry several ci-ok runs: the dev push, the main push and any
// manual dispatch each start their own workflow run, and each workflow run is
// its own check suite. A red suite stays on the commit after a later one passed
// (a flaky job, a push run cancelled by a dispatch on the same ref), so
// requiring every run to be green would block the release until someone found
// and re-ran that exact old run. Instead:
//
//   1. Per check suite only the newest check run counts. Re-running a workflow
//      run adds a check run to the same suite, and that one replaces the old.
//   2. A run still going fails the gate: wait for it and dispatch again.
//   3. Of the rest, the one that completed last decides. It has to be green.
//
// Usage:
//   node scripts/ci/ci-ok-verdict.mjs <check-runs.json> <sha>
//
// Prints one line per counted run and exits 0 only when the gate passes. It
// fails closed: a file it cannot read or parse, a response cut off by
// pagination, or a run without the fields it needs is an error, never a pass.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function requireField(run, value, name) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`check run ${run?.id ?? '?'} has no ${name}`);
  }
  return value;
}

// Parses the API response into the runs that count, newest per check suite.
export function latestPerSuite(response) {
  if (!response || !Array.isArray(response.check_runs)) {
    throw new Error('response has no check_runs array');
  }
  if (typeof response.total_count === 'number' && response.total_count > response.check_runs.length) {
    throw new Error(`response lists ${response.check_runs.length} of ${response.total_count} check runs`);
  }
  const bySuite = new Map();
  for (const run of response.check_runs) {
    const id = requireField(run, run?.id, 'id');
    const suite = requireField(run, run.check_suite?.id, 'check_suite.id');
    const status = requireField(run, run.status, 'status');
    if (status === 'completed') {
      requireField(run, run.conclusion, 'conclusion');
      if (Number.isNaN(Date.parse(requireField(run, run.completed_at, 'completed_at')))) {
        throw new Error(`check run ${id} has an unreadable completed_at`);
      }
    }
    const kept = bySuite.get(suite);
    if (!kept || id > kept.id) bySuite.set(suite, run);
  }
  return [...bySuite.values()];
}

// Returns { ok, lines } for the API response of one commit.
export function verdict(response, sha) {
  const runs = latestPerSuite(response);
  const describe = (run) =>
    `${run.status === 'completed' ? run.conclusion : run.status} ${run.html_url ?? `check run ${run.id}`}`;

  if (runs.length === 0) {
    return { ok: false, lines: [`::error::ci-ok never ran on ${sha}. Run Tests & SonarQube on it and dispatch again.`] };
  }

  const lines = runs.map((run) => `ci-ok on ${sha}: ${describe(run)}`);
  const pending = runs.filter((run) => run.status !== 'completed');
  if (pending.length > 0) {
    for (const run of pending) lines.push(`::error::ci-ok on ${sha} is still running: ${describe(run)}. Wait for it and dispatch again.`);
    return { ok: false, lines };
  }

  const newest = runs.reduce((a, b) => {
    const diff = Date.parse(b.completed_at) - Date.parse(a.completed_at);
    return diff > 0 || (diff === 0 && b.id > a.id) ? b : a;
  });
  if (newest.conclusion !== 'success') {
    lines.push(`::error::The newest ci-ok on ${sha} is not green: ${describe(newest)}. Re-run that run, or run Tests & SonarQube on it again, then dispatch again.`);
    return { ok: false, lines };
  }
  for (const run of runs) {
    if (run !== newest && run.conclusion !== 'success') {
      lines.push(`::notice::An older ci-ok on ${sha} is ${run.conclusion} (${run.html_url ?? run.id}); the newer green run supersedes it.`);
    }
  }
  return { ok: true, lines };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || !args[0] || !args[1]) throw new Error('usage: ci-ok-verdict.mjs <check-runs.json> <sha>');
  // An unreadable or malformed file throws and fails the job.
  const response = JSON.parse(readFileSync(args[0], 'utf8'));
  const result = verdict(response, args[1]);
  console.log(result.lines.join('\n'));
  if (!result.ok) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (err) {
    console.error(`::error::${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
