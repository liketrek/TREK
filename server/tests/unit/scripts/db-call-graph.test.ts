/**
 * The Phase 1 async-sweep gate (`scripts/db-call-graph.mjs`) had no test of its
 * own — CI trusted the tool's own output without ever proving the detector still
 * works. This runs the real script as a child process (never through a shell or
 * PATH, so nothing but the pinned Node binary decides what runs) against the
 * small, hand-documented fixture tree in `scripts/__fixtures__/`, once for each
 * flag combination the CI step and the recipe's R5 gate use.
 *
 * The script's own contract (see its final `process.exit(found ? 1 : 0)`) is to
 * exit non-zero when it has findings, and the `--unawaited` run against this
 * fixture is SUPPOSED to find the five documented BAD shapes, so `execFileSync`
 * throws on it — Node still attaches the child's stdout/status to that error,
 * which `run()` below reads back out instead of treating the throw as a test
 * failure.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SERVER_ROOT = path.join(__dirname, '../../..');
const SCRIPT = path.join(SERVER_ROOT, 'scripts/db-call-graph.mjs');

interface UnawaitedFinding {
  file: string;
  class: string;
  method: string;
  reason: string;
}

interface UnawaitedReport {
  unawaitedCalls: UnawaitedFinding[];
  unawaitedCallCount: number;
}

interface SyncDbMethod {
  file: string;
  class: string;
  method: string;
  line: number;
  direct: boolean;
}

interface TransactionSite {
  file: string;
  class: string;
  method: string;
  line: number;
  receiver: string;
}

interface SyncTxReport {
  syncDbMethods: SyncDbMethod[];
  syncDbMethodCount: number;
  transactionSites: TransactionSite[];
  transactionSiteCount: number;
}

interface ExecError {
  status: number | null;
  stdout: string;
}

function run(args: string[]): { status: number | null; report: unknown } {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      cwd: SERVER_ROOT,
      encoding: 'utf8',
    });
    return { status: 0, report: JSON.parse(stdout) };
  } catch (err) {
    // A non-zero exit (the gate has findings) surfaces as a thrown error whose
    // stdout/status carry the same JSON report the caller would have seen on
    // a clean run.
    const { status, stdout } = err as ExecError;
    return { status, report: JSON.parse(stdout) };
  }
}

describe('db-call-graph.mjs', () => {
  it('CALLGRAPH-001: --unawaited finds exactly the five documented BAD shapes, one per reason tag, and exits 1', () => {
    const { status, report } = run(['--root', 'scripts/__fixtures__', '--unawaited', '--json']);
    const { unawaitedCalls, unawaitedCallCount } = report as UnawaitedReport;

    // A gate with findings must fail the CI step it runs in.
    expect(status).toBe(1);
    expect(unawaitedCallCount).toBe(5);
    expect(unawaitedCalls).toHaveLength(5);
    expect(unawaitedCalls.every((f) => f.file === 'scripts/__fixtures__/unawaited-sample.ts')).toBe(true);
    expect(unawaitedCalls.every((f) => f.class === 'Sample')).toBe(true);

    // The fixture's own doc comment: three GOOD shapes produce nothing, five BAD
    // ones each produce exactly one finding with a distinct reason.
    const byMethod = Object.fromEntries(unawaitedCalls.map((f) => [f.method, f.reason]));
    expect(byMethod).toEqual({
      bad1: 'stored-then-used',
      bad2: 'argument',
      bad3: 'property',
      bad4: 'condition',
      bad5: 'statement',
    });
    expect(byMethod.good1).toBeUndefined();
    expect(byMethod.good2).toBeUndefined();
    expect(byMethod.good3).toBeUndefined();
  });

  it('CALLGRAPH-002: --sync --tx reports exactly the sync-db fixture (two sync DB methods, one raw transaction) and exits 1', () => {
    const { status, report } = run(['--root', 'scripts/__fixtures__', '--sync', '--tx', '--json']);
    const { syncDbMethods, syncDbMethodCount, transactionSites, transactionSiteCount } = report as SyncTxReport;

    // Non-empty lists exit 1 — that is what makes the CI step fail on a regression.
    expect(status).toBe(1);
    expect(syncDbMethodCount).toBe(2);
    expect(syncDbMethods.map((m) => `${m.class}.${m.method}`).sort()).toEqual([
      'SyncSample.readSync',
      'SyncSample.writeInTx',
    ]);
    expect(syncDbMethods.every((m) => m.file.endsWith('sync-db-sample.ts') && m.direct)).toBe(true);
    expect(transactionSiteCount).toBe(1);
    expect(transactionSites).toEqual([
      expect.objectContaining({ class: 'SyncSample', method: 'writeInTx', receiver: 'this.db' }),
    ]);
    // The unawaited fixture beside it stays clean under both flags.
    expect(syncDbMethods.some((m) => m.class === 'Sample')).toBe(false);
  });
});
