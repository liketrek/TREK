#!/usr/bin/env node
// Every repository path a guide names in backticks has to exist.
//
// The CLAUDE.md files, the root README, the Nest module blueprint and the wiki
// are what a contributor (or an agent) reads before touching the code, and a
// path in them is an instruction: open this file, copy that module. When the
// file has moved or died, the guide sends the reader to nothing, or worse, to
// a recipe for a layer that no longer exists. So this reads each guide,
// takes every inline code span that looks like a path into the repository and
// checks it against the files git tracks.
//
// A span counts as a repository path when it has no spaces, globs,
// placeholders or URL parts, holds a slash, does not start with `/`, `~` or
// `@` (a route, a home path, a package name), and either ends in a file
// extension or starts with a directory that exists from one of the bases it
// is read against. A trailing `:line` or `:line-line` is ignored. The bases
// are the repository root, the guide's own directory, its workspace
// (`server/` for anything under server/) and that workspace's `src/`, so
// `src/nest/README.md` in server/CLAUDE.md and `nest/database/unit-of-work.ts`
// both resolve. Fenced code blocks are not read: they hold commands and
// examples, not references.
//
// The paths that were already missing when the check came in are listed in
// scripts/ci/doc-paths-baseline.json as "<guide> :: <path>". The list only
// shrinks: a missing path outside it fails, and so does a listed one that
// resolves now or whose guide is gone, until --update takes it off.
//
//   node scripts/ci/doc-paths.mjs              check against the baseline (CI)
//   node scripts/ci/doc-paths.mjs --update     take resolved entries off the list;
//                                              it never adds one
//   node scripts/ci/doc-paths.mjs --list       print every missing path
//
// It needs nothing but Node and git, so it runs in the changes job before
// anything is installed.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileList, lowerList, readBaseline, runCli, writeBaseline } from '../lib/ratchet.mjs';

export const WORKSPACES = ['client', 'server', 'shared', 'plugin-sdk'];

/** The guides the check reads, out of the tracked files. */
export function guidesOf(tracked) {
  return [...tracked]
    .filter(
      (path) =>
        path === 'README.md' ||
        path === 'server/src/nest/README.md' ||
        posix.basename(path) === 'CLAUDE.md' ||
        /^wiki\/[^/]+\.md$/.test(path),
    )
    .sort();
}

/** The inline code spans of a Markdown text, outside fenced code blocks. */
export function inlineSpans(markdown) {
  const spans = [];
  let fence = null;
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    for (const match of line.matchAll(/(?<!`)`([^`\n]+)`(?!`)/g)) spans.push(match[1].trim());
  }
  return spans;
}

const EXTENSION = /\.(?:md|ts|tsx|mts|cts|js|mjs|cjs|jsx|json|ya?ml|sh|css|sql|html|txt|toml|svg|png|webp)$/;

/** The directories a guide's relative paths are read against. */
export function basesOf(guide) {
  const dir = posix.dirname(guide);
  const bases = new Set(['', dir === '.' ? '' : dir]);
  const workspace = guide.split('/')[0];
  if (WORKSPACES.includes(workspace)) {
    bases.add(workspace);
    bases.add(`${workspace}/src`);
  }
  return [...bases];
}

const join2 = (base, path) => posix.normalize(base ? `${base}/${path}` : path).replace(/\/$/, '');

/**
 * The span as a repository path to check, or null when it is not one. exists
 * tells whether a path (file or directory, no trailing slash) is tracked.
 */
export function pathOf(span, bases, exists) {
  const path = span.replace(/:\d+(?:-\d+)?$/, '').replace(/[.,;]$/, '');
  if (!path.includes('/') || /[\s*?<>{}[\]$|=()'"\\,]/.test(path)) return null;
  if (/^[/~@]/.test(path) || path.includes('://') || /^[a-z]+:/i.test(path)) return null;
  const first = path.replace(/^(?:\.\.?\/)+/, '').split('/')[0];
  const fromKnownDir = bases.some((base) => exists(join2(base, first)));
  if (!EXTENSION.test(path) && !fromKnownDir) return null;
  return path;
}

/** Module specifiers are often written without their extension (`api/client`). */
const IMPLIED = ['', '.ts', '.tsx', '.js', '.mjs'];

/** Whether the path resolves from one of the bases, as written or as a module specifier. */
export function resolves(path, bases, exists) {
  return bases.some((base) => IMPLIED.some((ext) => exists(join2(base, path) + ext)));
}

/** The missing paths of every guide, as "<guide> :: <path>" entries. */
export function missingPaths({ tracked, read }) {
  const files = new Set(tracked);
  const dirs = new Set();
  for (const file of files) {
    for (let at = file.indexOf('/'); at !== -1; at = file.indexOf('/', at + 1)) dirs.add(file.slice(0, at));
  }
  const exists = (path) => files.has(path) || dirs.has(path);
  const missing = new Set();
  for (const guide of guidesOf(files)) {
    const bases = basesOf(guide);
    for (const span of inlineSpans(read(guide))) {
      const path = pathOf(span, bases, exists);
      if (path && !resolves(path, bases, exists)) missing.add(`${guide} :: ${path}`);
    }
  }
  return [...missing].sort();
}

/** Runs the check against the list at baselinePath and returns the exit code. */
export function check({
  root,
  tracked,
  baselinePath = join(root, 'scripts/ci/doc-paths-baseline.json'),
  update = false,
  list = false,
  log = console.log,
  error = console.error,
}) {
  const found = missingPaths({ tracked, read: (path) => readFileSync(join(root, path), 'utf8') });
  let baseline = readBaseline(baselinePath, fileList);
  if (update) {
    baseline = lowerList(baseline, found);
    writeBaseline(baselinePath, baseline);
  }
  const allowed = new Set(baseline);
  const now = new Set(found);
  const fresh = found.filter((entry) => !allowed.has(entry));
  const stale = baseline.filter((entry) => !now.has(entry));

  if (list) for (const entry of found) log(`${allowed.has(entry) ? 'listed' : 'new   '}  ${entry}`);
  for (const entry of fresh) {
    const [guide, path] = entry.split(' :: ');
    error(`FAIL  ${guide} names \`${path}\`, which does not exist. Point it at the file that does, or drop it.`);
  }
  for (const entry of stale) {
    error(`FAIL  "${entry}" is listed in scripts/ci/doc-paths-baseline.json but resolves now or its guide is gone.`);
  }
  if (stale.length) error('Run node scripts/ci/doc-paths.mjs --update to take it off the list.');
  log(`doc-paths: ${found.length} missing path(s) in the guides, ${baseline.length} listed in the baseline`);
  return fresh.length || stale.length ? 1 : 0;
}

function trackedFiles(root) {
  const out = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  await runCli('doc-paths', (args) =>
    check({ root, tracked: trackedFiles(root), update: args.includes('--update'), list: args.includes('--list') }),
  );
}
