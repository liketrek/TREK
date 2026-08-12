/**
 * Rendering a CheckReport for a human.
 *
 * Split from the checks themselves so the same outcomes can be a checklist you READ (`status`)
 * or an exit code a script reads (`validate`) without either owning the rules.
 *
 * The thing that actually makes this useful is `nextStep()`. A list of failures tells an author
 * what is wrong; it does not tell them what to DO, and with four things red the honest question
 * is "which one first?". So the report always ends with exactly one command.
 */
import { STAGES, type CheckOutcome, type CheckReport } from './types.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/** Colour only when stderr is a terminal — piped output must stay clean for scripts. */
function colour(on: boolean) {
  const c = (code: string) => (s: string) => (on ? code + s + RESET : s);
  return { green: c(GREEN), red: c(RED), yellow: c(YELLOW), dim: c(DIM), bold: c(BOLD) };
}

function glyph(o: CheckOutcome): string {
  if (o.status === 'skip') return '·';
  if (o.status === 'pass') return '✓';
  return o.severity === 'error' ? '✗' : '!';
}

/**
 * The single next command.
 *
 * Preference order is deliberate: the FIRST failing error that names a command wins, and checks
 * are ordered manifest → code → docs → release, so an author is always pointed at the earliest
 * thing that is broken rather than the last. A plugin with a broken manifest and no screenshot
 * should be told to fix the manifest; telling it to take a screenshot would be busywork.
 */
export function nextStep(report: CheckReport): { command?: string; hint: string } {
  const firstWithCommand = report.errors.find((e) => e.next);
  if (firstWithCommand?.next) {
    return { command: firstWithCommand.next, hint: firstWithCommand.title };
  }
  const first = report.errors[0];
  if (first) {
    return { hint: `fix "${first.title}" above, then re-run \`trek-plugin status\`` };
  }
  return { command: 'trek-plugin publish --repo <owner/name> --tag v<x.y.z>', hint: 'everything checks out' };
}

export interface RenderOptions {
  /** Show passing and skipped checks too. `status` does; `validate` only reports problems. */
  verbose?: boolean;
  colour?: boolean;
}

/** The full checklist, grouped by stage. This is what `status` prints. */
export function renderChecklist(report: CheckReport, opts: RenderOptions = {}): string {
  const c = colour(opts.colour ?? false);
  const lines: string[] = [];

  for (const stage of STAGES) {
    const outcomes = report.outcomes.filter((o) => o.stage === stage.id);
    if (!outcomes.length) continue;
    // A stage where everything skipped has nothing to say (e.g. `release` before you have packed).
    const shown = opts.verbose ? outcomes : outcomes.filter((o) => o.status === 'fail');
    if (!shown.length) continue;

    lines.push('');
    lines.push('  ' + c.bold(stage.title));
    for (const o of shown) {
      const g = glyph(o);
      const paint = o.status === 'pass' ? c.green : o.status === 'skip' ? c.dim : o.severity === 'error' ? c.red : c.yellow;
      const detail = o.detail ? c.dim(` — ${o.detail}`) : '';
      const title = o.status === 'skip' ? c.dim(o.title) : o.title;
      lines.push(`    ${paint(g)} ${title}${detail}`);
      // The `fix` is the part an author can act on, so it is never hidden behind a flag.
      if (o.status === 'fail' && o.fix) {
        for (const l of o.fix.split('\n')) lines.push('        ' + c.dim(l));
      }
    }
  }
  return lines.join('\n');
}

/** The plain one-problem-per-line form, for pipes and CI. `validate` prints this. */
export function renderPlain(report: CheckReport): string {
  const lines: string[] = [];
  for (const w of report.warnings) {
    lines.push(`warning: ${w.title}${w.detail ? ` — ${w.detail}` : ''}`);
    if (w.fix) for (const l of w.fix.split('\n')) lines.push('         ' + l);
  }
  for (const e of report.errors) {
    lines.push(`error: ${e.title}${e.detail ? ` — ${e.detail}` : ''}`);
    if (e.fix) for (const l of e.fix.split('\n')) lines.push('       ' + l);
  }
  return lines.join('\n');
}

/** "3 things block publishing." / "ready to publish." */
export function summaryLine(report: CheckReport): string {
  const e = report.errors.length;
  const w = report.warnings.length;
  if (!e && !w) return 'ready to publish.';
  const parts: string[] = [];
  if (e) parts.push(`${e} thing${e === 1 ? '' : 's'} block${e === 1 ? 's' : ''} publishing`);
  if (w) parts.push(`${w} warning${w === 1 ? '' : 's'}`);
  return parts.join(', ') + '.';
}
