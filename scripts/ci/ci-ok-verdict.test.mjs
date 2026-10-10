import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { latestPerSuite, verdict } from './ci-ok-verdict.mjs';

const script = fileURLToPath(new URL('./ci-ok-verdict.mjs', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'ci-ok-verdict-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

const SHA = 'abc123';

function run(id, suite, conclusion, completedAt, status = 'completed') {
  return {
    id,
    status,
    conclusion: status === 'completed' ? conclusion : null,
    completed_at: status === 'completed' ? completedAt : null,
    html_url: `https://github.com/liketrek/TREK/actions/runs/${suite}/job/${id}`,
    check_suite: { id: suite },
  };
}

function response(...runs) {
  return { total_count: runs.length, check_runs: runs };
}

function cli(content) {
  const file = join(scratch, `runs-${Math.random().toString(36).slice(2)}.json`);
  if (content !== undefined) writeFileSync(file, content);
  return spawnSync(process.execPath, [script, file, SHA], { encoding: 'utf8' });
}

describe('verdict', () => {
  it('passes a single green run', () => {
    assert.equal(verdict(response(run(1, 10, 'success', '2026-10-01T10:00:00Z')), SHA).ok, true);
  });

  it('fails when ci-ok never ran', () => {
    const result = verdict(response(), SHA);
    assert.equal(result.ok, false);
    assert.match(result.lines.join('\n'), /never ran/);
  });

  it('fails when the newest run is red and names it', () => {
    const result = verdict(
      response(run(1, 10, 'success', '2026-10-01T10:00:00Z'), run(2, 20, 'failure', '2026-10-01T11:00:00Z')),
      SHA,
    );
    assert.equal(result.ok, false);
    assert.match(result.lines.join('\n'), /not green: failure https:\/\/github\.com\/.*\/runs\/20\/job\/2/);
  });

  it('lets a later green suite supersede a flaky or cancelled one', () => {
    const result = verdict(
      response(
        run(1, 10, 'failure', '2026-10-01T10:00:00Z'),
        run(2, 20, 'cancelled', '2026-10-01T10:30:00Z'),
        run(3, 30, 'success', '2026-10-01T11:00:00Z'),
      ),
      SHA,
    );
    assert.equal(result.ok, true);
    assert.match(result.lines.join('\n'), /older ci-ok .* is failure/);
  });

  it('counts a re-run attempt in place of the attempt it replaced', () => {
    // Same suite: the re-run (higher id) replaces the red attempt, even though
    // the red one would otherwise be the newest suite result.
    const result = verdict(
      response(run(1, 10, 'success', '2026-10-01T09:00:00Z'), run(2, 20, 'failure', '2026-10-01T10:00:00Z'), run(5, 20, 'success', '2026-10-01T12:00:00Z')),
      SHA,
    );
    assert.equal(result.ok, true);
    assert.equal(latestPerSuite(response(run(2, 20, 'failure', '2026-10-01T10:00:00Z'), run(5, 20, 'success', '2026-10-01T12:00:00Z'))).length, 1);
  });

  it('fails when a re-run of the newest suite turned red', () => {
    const result = verdict(
      response(run(2, 20, 'success', '2026-10-01T10:00:00Z'), run(5, 20, 'failure', '2026-10-01T12:00:00Z')),
      SHA,
    );
    assert.equal(result.ok, false);
  });

  it('fails while any counted run is still going', () => {
    const result = verdict(
      response(run(1, 10, 'success', '2026-10-01T10:00:00Z'), run(2, 20, null, null, 'in_progress')),
      SHA,
    );
    assert.equal(result.ok, false);
    assert.match(result.lines.join('\n'), /still running: in_progress/);
  });

  it('treats skipped or neutral as not green', () => {
    assert.equal(verdict(response(run(1, 10, 'skipped', '2026-10-01T10:00:00Z')), SHA).ok, false);
    assert.equal(verdict(response(run(1, 10, 'neutral', '2026-10-01T10:00:00Z')), SHA).ok, false);
  });

  it('breaks a completion-time tie by the higher id', () => {
    const at = '2026-10-01T10:00:00Z';
    assert.equal(verdict(response(run(1, 10, 'success', at), run(2, 20, 'failure', at)), SHA).ok, false);
    assert.equal(verdict(response(run(1, 10, 'failure', at), run(2, 20, 'success', at)), SHA).ok, true);
  });
});

describe('fails closed', () => {
  it('rejects a response without check_runs', () => {
    assert.throws(() => verdict({ total_count: 0 }, SHA), /no check_runs/);
  });

  it('rejects a response cut off by pagination', () => {
    assert.throws(
      () => verdict({ total_count: 101, check_runs: [run(1, 10, 'success', '2026-10-01T10:00:00Z')] }, SHA),
      /1 of 101/,
    );
  });

  it('rejects a run without a check suite, conclusion or completion time', () => {
    const noSuite = { ...run(1, 10, 'success', '2026-10-01T10:00:00Z'), check_suite: null };
    assert.throws(() => verdict(response(noSuite), SHA), /check_suite\.id/);
    const noConclusion = { ...run(1, 10, 'success', '2026-10-01T10:00:00Z'), conclusion: null };
    assert.throws(() => verdict(response(noConclusion), SHA), /conclusion/);
    const badTime = run(1, 10, 'success', 'yesterday');
    assert.throws(() => verdict(response(badTime), SHA), /completed_at/);
  });
});

describe('cli', () => {
  it('exits 0 on a green commit', () => {
    const result = cli(JSON.stringify(response(run(1, 10, 'success', '2026-10-01T10:00:00Z'))));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /ci-ok on abc123: success/);
  });

  it('exits 1 on a red commit', () => {
    const result = cli(JSON.stringify(response(run(1, 10, 'failure', '2026-10-01T10:00:00Z'))));
    assert.equal(result.status, 1);
    assert.match(result.stdout, /::error::/);
  });

  it('exits 1 on a missing file, broken JSON or wrong arguments', () => {
    assert.equal(cli(undefined).status, 1);
    assert.equal(cli('{not json').status, 1);
    assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 1);
  });
});

describe('release workflows', () => {
  for (const name of ['docker.yml', 'docker-dev.yml']) {
    it(`${name} gates on this script`, () => {
      const workflow = readFileSync(fileURLToPath(new URL(`../../.github/workflows/${name}`, import.meta.url)), 'utf8');
      assert.match(workflow, /check-runs\?check_name=ci-ok&filter=all&per_page=100/);
      assert.match(workflow, /node scripts\/ci\/ci-ok-verdict\.mjs "\$runs" "\$sha"/);
    });
  }
});
