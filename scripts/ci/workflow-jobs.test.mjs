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

function jobIds() {
  const body = workflow.slice(workflow.indexOf('\njobs:\n'));
  return [...body.matchAll(/^ {2}([a-z0-9-]+):\s*$/gm)].map((match) => match[1]);
}

function ciOkNeeds() {
  const block = /^ {2}ci-ok:\n {4}needs:\n((?: {6}- [a-z0-9-]+\n)+)/m.exec(workflow);
  assert.ok(block, 'test.yml must declare ci-ok with a needs: list, one job per line');
  return block[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*- /, ''));
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
});
