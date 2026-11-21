#!/usr/bin/env node
// Decides which parts of the test workflow a change needs.
//
// test.yml used to filter on `paths:` at the workflow level. A required check
// cannot live behind such a filter: when the filter skips the whole workflow,
// the check never reports and the pull request waits for it forever. So the
// workflow always runs, its first job lists the changed files and pipes them
// through this script, and every other job asks the answer whether to run.
// The aggregate `ci-ok` job then treats a skipped job as passed.
//
// It also decides whether the run mirrors the push run instead of testing.
// The release pull request (dev into main, from this repository) always
// carries the head of dev, and every push to dev already runs this workflow
// on exactly that commit, listing its changes against the merge base with
// main, so that run covers every area the pull request brings in. Running
// it twice for one commit doubled the jobs past the organisation's slots, so
// on that pull request every area is off and ci-ok mirrors the push run's
// verdict (scripts/ci/mirror-push-run.mjs).
// The run's context comes from the environment: CI_EVENT, CI_BASE_REF,
// CI_HEAD_REF, CI_HEAD_REPO and CI_REPO.
//
// Usage:
//   node scripts/ci/changed-areas.mjs --files <list>   one changed path per line
//   node scripts/ci/changed-areas.mjs --all            no usable list, run everything
//
// Prints `<area>=true|false` per area and `mirror=true|false`, and appends
// the same lines to $GITHUB_OUTPUT when it is set.
//
// It fails closed. A list it cannot read is an error, and anything it cannot
// classify with confidence (an empty list, a path git had to quote) turns every
// area on: running a job too often costs minutes, skipping one it needed lets a
// break through.

import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The workflow file, the local actions its jobs set up with and this script
// decide what runs and how, so a change to any of them runs everything.
const ALWAYS = ['.github/workflows/test.yml', '.github/actions/', 'scripts/ci/'];

// Files the test suites read straight from disk, outside the packages:
// config-templates.test.ts pins docker-compose.yml and the Helm chart to the
// code defaults, help.test.ts serves wiki pages and images, and the client's
// help registry test checks every help link against the wiki headings.
const READ_BY_TESTS = ['charts/', /^docker-compose[^/]*\.ya?ml$/, 'wiki/'];

export const AREAS = {
  // The type, lint, test, coverage, bundle and end-to-end jobs. npm workspaces
  // hoist every dependency into the root lockfile, so a dependency bump touches
  // none of the package directories. The Dockerfile and the entrypoint script
  // are pinned by server/tests/unit/docker-entrypoint.test.ts. scripts/lib/
  // holds the ratchet code the server and shared gates run.
  code: [
    'server/',
    'client/',
    'shared/',
    'plugin-sdk/',
    'scripts/lib/',
    'package.json',
    'package-lock.json',
    '.nvmrc',
    'sonar-project.properties',
    // lint:knip in server-lint reads it.
    'knip.jsonc',
    'Dockerfile',
    ...READ_BY_TESTS,
    ...ALWAYS,
  ],
  // The image build and its boot check: everything the Dockerfile copies or
  // installs from. The image serves the in-app help from wiki/.
  image: [
    'server/',
    'client/',
    'shared/',
    'wiki/',
    'package.json',
    'package-lock.json',
    '.nvmrc',
    'Dockerfile',
    '.dockerignore',
    ...ALWAYS,
  ],
  // The Helm chart and the compose files.
  deploy: ['charts/', /^docker-compose[^/]*\.ya?ml$/, ...ALWAYS],
};

// Markdown outside wiki/ (the root README, CLAUDE.md, the package READMEs,
// PATTERN.md) changes no test, no build and no scan. The wiki does: the image
// ships it as the in-app help and tests read its pages and headings, so a
// wiki page is classified like any other file. So does Markdown inside a test
// or fixture directory (server/tests/fixtures/wiki/ feeds wiki.test.ts): it is
// test input, and a change to it has to run the tests that read it.
const TEST_INPUT_DIR = /(^|\/)(tests?|fixtures)\//;
const isInertMarkdown = (path) => path.endsWith('.md') && !path.startsWith('wiki/') && !TEST_INPUT_DIR.test(path);

function matches(rule, path) {
  if (rule instanceof RegExp) return rule.test(path);
  return rule.endsWith('/') ? path.startsWith(rule) : path === rule;
}

/**
 * @param {string[] | null} files changed paths, or null when there is no usable list
 * @returns {Record<string, boolean>}
 */
export function classify(files) {
  const all = Object.fromEntries(Object.keys(AREAS).map((area) => [area, true]));
  if (files === null) return all;
  const paths = files.map((line) => line.replace(/\r$/, '').trim()).filter(Boolean);
  if (paths.length === 0) return all;
  // core.quotePath=false keeps ordinary non-ASCII names unquoted. A path that
  // still arrives quoted carries control characters, and matching on its
  // escaped form could miss it.
  if (paths.some((path) => path.startsWith('"'))) return all;

  const result = {};
  for (const [area, rules] of Object.entries(AREAS)) {
    result[area] = paths.some((path) => !isInertMarkdown(path) && rules.some((rule) => matches(rule, path)));
  }
  return result;
}

// The release pull request: base main, head dev, and the head branch in this
// repository. A fork's branch named dev is not it: its commits never ran here.
export const RELEASE_PR = { base: 'main', head: 'dev' };

/**
 * @param {{ event?: string, baseRef?: string, headRef?: string, headRepo?: string, repo?: string }} context
 * @returns {boolean} true when the run mirrors the push run on dev instead of testing
 */
export function mirrorsPushRun({ event, baseRef, headRef, headRepo, repo }) {
  return (
    event === 'pull_request' &&
    baseRef === RELEASE_PR.base &&
    headRef === RELEASE_PR.head &&
    Boolean(repo) &&
    headRepo === repo
  );
}

/**
 * What the run does: the areas to test, and whether ci-ok mirrors the push
 * run. In mirror mode every area is off, so every job skips by its area
 * condition and only changes and ci-ok run.
 *
 * @param {string[] | null} files changed paths, or null when there is no usable list
 * @param {Parameters<typeof mirrorsPushRun>[0]} context
 * @returns {Record<string, boolean>}
 */
export function decide(files, context) {
  if (mirrorsPushRun(context)) {
    return { ...Object.fromEntries(Object.keys(AREAS).map((area) => [area, false])), mirror: true };
  }
  return { ...classify(files), mirror: false };
}

function contextFromEnv(env) {
  return {
    event: env.CI_EVENT,
    baseRef: env.CI_BASE_REF,
    headRef: env.CI_HEAD_REF,
    headRepo: env.CI_HEAD_REPO,
    repo: env.CI_REPO,
  };
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === '--all') return { all: true };
  if (argv.length === 2 && argv[0] === '--files' && argv[1]) return { all: false, list: argv[1] };
  throw new Error('usage: changed-areas.mjs --files <list> | --all');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  // An unreadable list throws and fails the job instead of running on a guess.
  const files = args.all ? null : readFileSync(args.list, 'utf8').split('\n');
  const result = decide(files, contextFromEnv(process.env));
  const lines = Object.entries(result).map(([area, on]) => `${area}=${on}`);
  console.log(lines.join('\n'));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
