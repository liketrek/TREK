/**
 * The Postgres probe: what of the server's SQL runs on Postgres today.
 *
 * TREK runs on SQLite, and the dialect layer (src/db/dialect/) is written so
 * a second engine is a branch there rather than a sweep through the
 * repositories. Nothing tested that claim until this probe. Given an empty
 * Postgres database it
 *
 *   1. derives a Postgres schema from the entities (pg-probe/schema.ts);
 *   2. runs every dialect helper on SQLite and on Postgres and checks both
 *      return what the helper promises (pg-probe/helper-cases.ts); every
 *      case must pass;
 *   3. calls every public repository method once with sample arguments the
 *      TypeScript checker builds from its parameter types
 *      (pg-probe/arg-samples.ts), through a MikroORM Postgres driver that
 *      runs each statement in its own rolled-back transaction and records
 *      whether Postgres accepted it (pg-probe/recorder.ts);
 *   4. holds the statements Postgres refuses as SQL (SQLSTATE class 42 or
 *      0A), per method, to scripts/pg-probe-baseline.json, which may only
 *      shrink (pg-probe/baseline.ts); a refusal over a sample value
 *      (class 22) or the empty tables is reported, not held;
 *   5. holds the methods whose SQL it did not see (it could not call them,
 *      they sent no SQL, or they timed out) to the same file's `uncovered`
 *      list, which may only shrink too, so a new method the probe cannot
 *      reach fails the run instead of landing unmeasured.
 *
 * What it measures is the statements each method reaches with sample
 * arguments against empty tables, not every statement the code can send: a
 * branch that only runs on data the empty tables do not hold stays unseen.
 *
 * It needs a Postgres server, so CI runs it in the `postgres-probe` job
 * against a service container. Locally:
 *
 *   docker run --rm -d -p 5432:5432 -e POSTGRES_PASSWORD=probe postgres:17
 *   TREK_PG_PROBE_URL=postgres://postgres:probe@127.0.0.1:5432/postgres npm run probe:pg
 *
 * Options:
 *   --url=<postgres url>       instead of TREK_PG_PROBE_URL
 *   --update                   lower scripts/pg-probe-baseline.json to this run (never raises or adds an entry;
 *                              an unmeasured baseline gets its first measurement)
 *
 * A baseline whose `failing` or `uncovered` is `null` has never been measured and fails the
 * run (outside `--update`); the baseline the run writes with
 * `--next-baseline` (the CI artifact) is the first measurement to commit. A
 * run that called no repository method fails as well.
 *   --next-baseline=<path>     write the baseline this run would leave (the CI artifact)
 *   --report=<path>            write everything the run saw as JSON
 *   --summary=<path>           append the Markdown summary (defaults to $GITHUB_STEP_SUMMARY)
 *
 * Exit codes: 0 passed, 1 a helper case or the ratchet failed, 2 the probe
 * could not run (no database, a database that is not empty, a crash).
 */
import { planRepositories, readCompilerOptions, type MethodPlan } from './pg-probe/arg-samples';
import { compareWithBaseline, formatBaseline, lowerBaseline, readBaseline } from './pg-probe/baseline';
import {
  connectProbeOrm,
  connectSetupOrm,
  postgresHelperEngine,
  prepareDatabase,
  probeRepositories,
  sqliteHelperEngine,
} from './pg-probe/engines';
import { runHelperCases, type HelperResult } from './pg-probe/helper-cases';
import { StatementRecorder } from './pg-probe/recorder';
import {
  formatConsole,
  formatMarkdown,
  passed,
  probedNothing,
  summarize,
  type MethodResult,
  type ReportInput,
} from './pg-probe/report';

import { appendFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SERVER_ROOT = path.join(__dirname, '..');
export const BASELINE_PATH = path.join(SERVER_ROOT, 'scripts', 'pg-probe-baseline.json');
const REPOSITORIES_DIR = path.join(SERVER_ROOT, 'src', 'db', 'repositories');

/** A statement that runs longer than this on empty tables is stuck. */
const STATEMENT_TIMEOUT_MS = 5_000;
/** A method still running after this has hung (a pool wait, a loop over a result it never gets). */
const METHOD_TIMEOUT_MS = 20_000;

export interface ProbeArgs {
  url: string;
  update: boolean;
  nextBaseline: string | null;
  report: string | null;
  summary: string | null;
}

export function parseArgs(argv: readonly string[], env: Readonly<Record<string, string | undefined>>): ProbeArgs {
  const args: ProbeArgs = {
    url: env.TREK_PG_PROBE_URL ?? '',
    update: false,
    nextBaseline: null,
    report: null,
    summary: env.GITHUB_STEP_SUMMARY || null,
  };
  for (const arg of argv) {
    const [flag, value] = arg.includes('=')
      ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)]
      : [arg, ''];
    if (flag === '--update' && value === '') args.update = true;
    else if (flag === '--url' && value) args.url = value;
    else if (flag === '--next-baseline' && value) args.nextBaseline = value;
    else if (flag === '--report' && value) args.report = value;
    else if (flag === '--summary' && value) args.summary = value;
    else throw new Error(`pg-probe: unknown argument ${arg}`);
  }
  if (!/^postgres(ql)?:\/\//.test(args.url)) {
    throw new Error(
      'pg-probe: no Postgres URL. Set TREK_PG_PROBE_URL or pass --url=postgres://user:password@host:port/database.',
    );
  }
  return args;
}

/** The repository files the probe calls into: every `src/db/repositories/*.ts`, the `_shared/` helpers excepted. */
export function repositoryFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
    .sort()
    .map((name) => path.join(dir, name));
}

/**
 * 0 when every helper case passed, the probe called at least one repository
 * method, the baseline is measured, no method fails more statements than
 * its entry allows and every method the probe did not measure is listed as
 * uncovered. An entry above what the run saw (a count above what its method
 * fails, an uncovered method that is measured now) fails the run too, and so
 * does an unmeasured baseline, unless this run is the `--update` that lowers
 * or seeds it.
 */
export function exitCode(input: Pick<ReportInput, 'verdict' | 'helpers' | 'summary'>, update: boolean): number {
  if (passed(input)) return 0;
  const helpersOk = input.helpers.every((result) => result.failure === null);
  const held = input.verdict.grown.length === 0 && input.verdict.newlyUncovered.length === 0;
  return helpersOk && !probedNothing(input.summary) && held && update ? 0 : 1;
}

/** GitHub annotations when running in Actions, plain lines otherwise. */
function annotate(level: 'error' | 'warning' | 'notice', message: string): void {
  console.log(process.env.GITHUB_ACTIONS === 'true' ? `::${level}::${message}` : `${level.toUpperCase()}: ${message}`);
}

function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  console.log(`-- ${label}`);
  return fn().finally(() => console.log(`   ${label}: ${((Date.now() - start) / 1000).toFixed(1)}s`));
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2), process.env);
  const baseline = readBaseline(BASELINE_PATH);

  const setup = await timed('connect', () => connectSetupOrm(args.url));
  let helpers: HelperResult[] = [];
  let schemaFailures: { statement: string; message: string }[] = [];
  let results: MethodResult[] = [];
  try {
    const schema = await timed('derive the schema from the entities', () => prepareDatabase(setup));
    schemaFailures = schema.failures;
    console.log(
      `   ${schema.statements} DDL statements, ${schema.adjusted} columns adjusted, ${schema.failures.length} refused`,
    );

    helpers = await timed('dialect helpers on SQLite and Postgres', async () => {
      const sqlite = sqliteHelperEngine();
      try {
        return [...(await runHelperCases(sqlite)), ...(await runHelperCases(postgresHelperEngine(setup)))];
      } finally {
        sqlite.close();
      }
    });

    const plans: MethodPlan[] = await timed('plan the repository calls', async () =>
      planRepositories(
        repositoryFiles(REPOSITORIES_DIR),
        readCompilerOptions(path.join(SERVER_ROOT, 'tsconfig.json')),
        SERVER_ROOT,
      ),
    );
    console.log(`   ${plans.length} public repository methods`);

    const recorder = new StatementRecorder();
    const probe = await connectProbeOrm(args.url, recorder, STATEMENT_TIMEOUT_MS);
    try {
      results = await timed('call every repository method', () =>
        probeRepositories(probe, recorder, plans, SERVER_ROOT, METHOD_TIMEOUT_MS),
      );
    } finally {
      await probe.close(true);
    }
  } finally {
    await setup.close(true);
  }

  const summary = summarize(results);
  const uncoveredNow = new Set(summary.uncovered.keys());
  const verdict = compareWithBaseline(baseline, summary.failingByMethod, uncoveredNow);
  const input: ReportInput = { summary, verdict, helpers, schemaFailures, results };
  console.log(formatConsole(input));

  const next = lowerBaseline(baseline, summary.failingByMethod, uncoveredNow);
  if (args.nextBaseline) writeFileSync(args.nextBaseline, formatBaseline(next));
  if (args.update) {
    writeFileSync(BASELINE_PATH, formatBaseline(next));
    console.log(`Wrote ${path.relative(SERVER_ROOT, BASELINE_PATH)}.`);
  }
  if (args.report) {
    const counts = {
      failingByMethod: Object.fromEntries(summary.failingByMethod),
      uncovered: Object.fromEntries(summary.uncovered),
      failuresByCode: Object.fromEntries(summary.failuresByCode),
    };
    const report = { summary: { ...summary, ...counts }, verdict, helpers, schemaFailures, results };
    writeFileSync(args.report, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (args.summary) appendFileSync(args.summary, formatMarkdown(input));

  for (const failure of helpers.filter((result) => result.failure !== null)) {
    annotate('error', `pg-probe helper case [${failure.engine}] ${failure.name}: ${failure.failure}`);
  }
  for (const entry of verdict.grown) {
    annotate(
      'error',
      `pg-probe: ${entry.method} sends ${entry.now} statement(s) Postgres refuses, ${entry.allowed} allowed.`,
    );
  }
  for (const entry of verdict.stale) {
    annotate(
      'error',
      `pg-probe: ${entry.method} fails ${entry.now} statement(s), the baseline allows ${entry.allowed}. ` +
        'Lower it (--update, or the pg-probe-baseline artifact).',
    );
  }
  for (const method of verdict.newlyUncovered) {
    annotate(
      'error',
      `pg-probe: ${method} ${summary.uncovered.get(method) ?? 'went unmeasured'}, so its SQL was not checked. ` +
        'Give it arguments the probe can sample, or make it reach its SQL with them.',
    );
  }
  for (const method of verdict.nowCovered) {
    annotate(
      'error',
      `pg-probe: ${method} is listed as uncovered but is measured now (or gone). Drop it (--update, or the pg-probe-baseline artifact).`,
    );
  }
  if (probedNothing(summary))
    annotate('error', `pg-probe: no repository method was called (${summary.methods} planned).`);
  if (verdict.unseeded) {
    annotate(
      'error',
      'pg-probe: the baseline has not been measured yet. Commit pg-probe-baseline.json from the pg-probe-baseline artifact ' +
        'as server/scripts/pg-probe-baseline.json.',
    );
  }
  for (const failure of schemaFailures) annotate('warning', `pg-probe schema: ${failure.message}`);
  return exitCode(input, args.update);
}

if (require.main === module) {
  // A method abandoned after its timeout may still reject later; that is
  // already counted as a timeout and must not take the whole run down.
  process.on('unhandledRejection', (reason: unknown) => {
    annotate(
      'warning',
      `pg-probe: a rejection nobody awaited: ${reason instanceof Error ? reason.message.split('\n')[0] : String(reason)}`,
    );
  });
  main().then(
    (code) => process.exit(code),
    (error: unknown) => {
      console.error(
        `pg-probe could not run: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
      process.exit(2);
    },
  );
}
