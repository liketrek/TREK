/**
 * Turns what the Postgres probe saw into counts, a console log and the
 * Markdown the CI job writes to its step summary.
 */
import { countsTowardRatchet, type BaselineVerdict } from './baseline';
import type { HelperResult } from './helper-cases';
import type { StatementRecord } from './recorder';

export interface MethodResult {
  /** `Class.method`. */
  key: string;
  statements: readonly StatementRecord[];
  /** Why the method was not called at all. */
  unprobeable?: string;
  /** The method threw (in JS, after or before its SQL); the statements it sent still count. */
  threw?: string;
  timedOut?: boolean;
}

export interface FailedStatement {
  method: string;
  code: string;
  message: string;
  sql: string;
  /** A dialect refusal (SQLSTATE class 42 or 0A) the ratchet holds; anything else is reported only. */
  counted: boolean;
}

export interface ProbeSummary {
  methods: number;
  called: number;
  unprobeable: number;
  /** Called, but sent no SQL (a pure helper, or it threw before reaching the database). */
  withoutSql: number;
  timedOut: number;
  /** Distinct statements per method, summed. */
  statements: number;
  /** Every distinct statement Postgres refused, counted toward the ratchet or not. */
  failedStatements: FailedStatement[];
  /**
   * `Class.method` → distinct statements Postgres refused as SQL (SQLSTATE
   * class 42 or 0A); every called method appears, zeros included.
   */
  failingByMethod: Map<string, number>;
  /**
   * `Class.method` → why the probe saw none or not all of its SQL: it could
   * not call it, it sent no SQL (it threw first, or never reaches the
   * database), or it timed out. Held to the baseline's `uncovered` list.
   */
  uncovered: Map<string, string>;
  /** SQLSTATE → distinct failing statements. */
  failuresByCode: Map<string, number>;
}

export function summarize(results: readonly MethodResult[]): ProbeSummary {
  const summary: ProbeSummary = {
    methods: results.length,
    called: 0,
    unprobeable: 0,
    withoutSql: 0,
    timedOut: 0,
    statements: 0,
    failedStatements: [],
    failingByMethod: new Map(),
    uncovered: new Map(),
    failuresByCode: new Map(),
  };
  for (const result of results) {
    if (result.unprobeable !== undefined) {
      summary.unprobeable += 1;
      summary.uncovered.set(result.key, `could not be called: ${result.unprobeable}`);
      continue;
    }
    summary.called += 1;
    if (result.timedOut) {
      summary.timedOut += 1;
      summary.uncovered.set(result.key, 'timed out');
    } else if (result.statements.length === 0) {
      summary.uncovered.set(
        result.key,
        result.threw === undefined ? 'sent no SQL' : `threw before any statement: ${result.threw}`,
      );
    }
    if (result.statements.length === 0) summary.withoutSql += 1;
    const seen = new Set<string>();
    const failed = new Map<string, StatementRecord>();
    for (const statement of result.statements) {
      seen.add(statement.sql);
      if (!statement.outcome.ok && !failed.has(statement.sql)) failed.set(statement.sql, statement);
    }
    summary.statements += seen.size;
    let counted = 0;
    for (const statement of failed.values()) {
      const outcome = statement.outcome;
      if (!('code' in outcome)) continue;
      const dialect = countsTowardRatchet(outcome.code);
      if (dialect) counted += 1;
      summary.failedStatements.push({
        method: result.key,
        code: outcome.code,
        message: outcome.message,
        sql: statement.sql,
        counted: dialect,
      });
      summary.failuresByCode.set(outcome.code, (summary.failuresByCode.get(outcome.code) ?? 0) + 1);
    }
    summary.failingByMethod.set(result.key, counted);
  }
  return summary;
}

/** Refused statements the ratchet holds (dialect errors) and the ones it only reports. */
export function splitRefusals(summary: Pick<ProbeSummary, 'failedStatements'>): {
  counted: FailedStatement[];
  reported: FailedStatement[];
} {
  return {
    counted: summary.failedStatements.filter((failed) => failed.counted),
    reported: summary.failedStatements.filter((failed) => !failed.counted),
  };
}

/** SQL on one line, cut to `max` characters, for a log or a table cell. */
export function oneLine(sql: string, max = 160): string {
  const flat = sql.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/`/g, "'");
}

export interface ReportInput {
  summary: ProbeSummary;
  verdict: BaselineVerdict;
  helpers: readonly HelperResult[];
  schemaFailures: readonly { statement: string; message: string }[];
  results: readonly MethodResult[];
}

export function helperFailures(helpers: readonly HelperResult[]): HelperResult[] {
  return helpers.filter((result) => result.failure !== null);
}

/**
 * True when the probe called no repository method at all. A broken plan (an
 * unreadable tsconfig, a moved repositories directory) would otherwise pass
 * with nothing failing, and its empty measurement could seed the baseline.
 */
export function probedNothing(summary: Pick<ProbeSummary, 'called'>): boolean {
  return summary.called === 0;
}

/**
 * True when the run passes: every helper case on both engines, at least one
 * repository method called, a measured baseline, and the ratchet held (no
 * method failing more statements than allowed, no new unmeasured method, no
 * entry left above what the run saw). An unmeasured baseline fails, so the
 * gate cannot merge before it holds anything.
 */
export function passed(input: Pick<ReportInput, 'verdict' | 'helpers' | 'summary'>): boolean {
  return (
    helperFailures(input.helpers).length === 0 &&
    !probedNothing(input.summary) &&
    !input.verdict.unseeded &&
    input.verdict.grown.length === 0 &&
    input.verdict.stale.length === 0 &&
    input.verdict.newlyUncovered.length === 0 &&
    input.verdict.nowCovered.length === 0
  );
}

export function formatConsole(input: ReportInput): string {
  const { summary, verdict } = input;
  const lines: string[] = [];
  const failures = helperFailures(input.helpers);
  lines.push(
    `Dialect helpers: ${input.helpers.length - failures.length}/${input.helpers.length} cases pass on SQLite and Postgres.`,
  );
  for (const failure of failures) lines.push(`  FAIL  [${failure.engine}] ${failure.name}: ${failure.failure}`);
  if (input.schemaFailures.length > 0) {
    lines.push(
      `Schema: ${input.schemaFailures.length} DDL statement(s) Postgres refused (their tables are missing below):`,
    );
    for (const failure of input.schemaFailures)
      lines.push(`  ${failure.message}  <-  ${oneLine(failure.statement, 120)}`);
  }
  lines.push(
    `Repositories: ${summary.methods} methods, ${summary.called} called, ${summary.unprobeable} unprobeable, ` +
      `${summary.withoutSql} sent no SQL, ${summary.timedOut} timed out.`,
  );
  const refusals = splitRefusals(summary);
  lines.push(
    `Statements: ${summary.statements} distinct, ${summary.failedStatements.length} refused by Postgres ` +
      `(${refusals.counted.length} as SQL, held to the baseline; ${refusals.reported.length} over a sample value or the empty tables, reported only).`,
  );
  for (const [code, count] of [...summary.failuresByCode.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${code}: ${count}${countsTowardRatchet(code) ? '' : ' (not held)'}`);
  }
  for (const failed of summary.failedStatements) {
    lines.push(`  ${failed.method}  ${failed.code}  ${failed.message}${failed.counted ? '' : '  (not held)'}`);
    lines.push(`      ${oneLine(failed.sql)}`);
  }
  if (summary.uncovered.size > 0) {
    lines.push(`Unmeasured: ${summary.uncovered.size} method(s) whose SQL the probe did not see:`);
    for (const [method, why] of [...summary.uncovered.entries()].sort(([a], [b]) => a.localeCompare(b)))
      lines.push(`  ${method}: ${why}`);
  }
  if (probedNothing(summary)) {
    lines.push(
      `FAIL  No repository method was called (${summary.methods} planned); there is nothing to hold to the baseline.`,
    );
  }
  if (verdict.unseeded) {
    lines.push(
      'FAIL  Baseline: not measured yet (failing is null). Commit the next baseline this run wrote ' +
        '(the pg-probe-baseline artifact in CI) as scripts/pg-probe-baseline.json.',
    );
  }
  for (const entry of verdict.grown) {
    lines.push(`FAIL  ${entry.method} sends ${entry.now} statement(s) Postgres refuses, ${entry.allowed} allowed.`);
  }
  for (const entry of verdict.stale) {
    lines.push(
      `FAIL  ${entry.method} is held at ${entry.allowed} failing statement(s) but fails ${entry.now} now; lower the baseline.`,
    );
  }
  for (const method of verdict.newlyUncovered) {
    lines.push(
      `FAIL  ${method} ${summary.uncovered.get(method) ?? 'went unmeasured'}, and the baseline does not list it as uncovered. ` +
        'Give it arguments the probe can sample, or make it reach its SQL with them.',
    );
  }
  for (const method of verdict.nowCovered) {
    lines.push(`FAIL  ${method} is listed as uncovered but is measured now (or gone); drop it from the baseline.`);
  }
  lines.push(passed(input) ? 'Postgres probe passed.' : 'Postgres probe failed.');
  return lines.join('\n');
}

export function formatMarkdown(input: ReportInput): string {
  const { summary, verdict } = input;
  const failures = helperFailures(input.helpers);
  const out: string[] = ['## Postgres probe', ''];
  out.push(passed(input) ? 'Result: **passed**' : 'Result: **failed**', '');
  out.push('| | |', '|---|---|');
  out.push(
    `| Dialect helper cases (SQLite and Postgres) | ${input.helpers.length - failures.length} of ${input.helpers.length} pass |`,
  );
  out.push(`| Schema statements refused | ${input.schemaFailures.length} |`);
  const refusals = splitRefusals(summary);
  out.push(
    `| Repository methods | ${summary.methods} (${summary.called} called, ${summary.unprobeable} unprobeable) |`,
  );
  out.push(`| Methods whose SQL the probe did not see | ${summary.uncovered.size} |`);
  out.push(`| Distinct statements | ${summary.statements} |`);
  out.push(`| Refused by Postgres as SQL (held) | ${refusals.counted.length} |`);
  out.push(`| Refused over a sample value or the empty tables (reported only) | ${refusals.reported.length} |`);
  out.push('');
  if (probedNothing(summary))
    out.push('No repository method was called, so there is nothing to hold to the baseline.', '');
  if (verdict.unseeded) {
    out.push(
      'The baseline has not been measured yet, which fails the run. Commit `pg-probe-baseline.json` from the `pg-probe-baseline` artifact as `server/scripts/pg-probe-baseline.json`.',
      '',
    );
  }
  if (verdict.grown.length > 0 || verdict.stale.length > 0) {
    out.push('### Ratchet', '', '| Method | Allowed | Now |', '|---|---|---|');
    for (const entry of [...verdict.grown, ...verdict.stale])
      out.push(`| ${cell(entry.method)} | ${entry.allowed} | ${entry.now} |`);
    out.push('');
  }
  if (verdict.newlyUncovered.length > 0 || verdict.nowCovered.length > 0) {
    out.push('### Coverage ratchet', '', '| Method | Baseline | Now |', '|---|---|---|');
    for (const method of verdict.newlyUncovered)
      out.push(`| ${cell(method)} | measured | ${cell(summary.uncovered.get(method) ?? 'unmeasured')} |`);
    for (const method of verdict.nowCovered) out.push(`| ${cell(method)} | uncovered | measured or gone |`);
    out.push('');
  }
  if (failures.length > 0) {
    out.push('### Helper cases that failed', '', '| Engine | Case | Why |', '|---|---|---|');
    for (const failure of failures)
      out.push(`| ${failure.engine} | ${cell(failure.name)} | ${cell(failure.failure ?? '')} |`);
    out.push('');
  }
  if (summary.failuresByCode.size > 0) {
    out.push('### Refused statements by SQLSTATE', '', '| SQLSTATE | Statements |', '|---|---|');
    for (const [code, count] of [...summary.failuresByCode.entries()].sort((a, b) => b[1] - a[1]))
      out.push(`| ${code} | ${count} |`);
    out.push('');
    out.push(
      '<details><summary>Every refused statement</summary>',
      '',
      '| Method | SQLSTATE | Held | Message |',
      '|---|---|---|---|',
    );
    for (const failed of summary.failedStatements) {
      out.push(
        `| ${cell(failed.method)} | ${failed.code} | ${failed.counted ? 'yes' : 'no'} | ${cell(failed.message)} |`,
      );
    }
    out.push('', '</details>', '');
  }
  if (summary.uncovered.size > 0) {
    out.push(
      '<details><summary>Methods whose SQL the probe did not see</summary>',
      '',
      '| Method | Why |',
      '|---|---|',
    );
    for (const [method, why] of [...summary.uncovered.entries()].sort(([a], [b]) => a.localeCompare(b)))
      out.push(`| ${cell(method)} | ${cell(why)} |`);
    out.push('', '</details>', '');
  }
  return `${out.join('\n')}\n`;
}
