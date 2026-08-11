/**
 * The check registry's public face: one list, run at the depth the caller can afford.
 *
 *   runOffline(ctx)  — `status`, `validate`, and `publish`'s first step. No network, no push.
 *                      SYNCHRONOUS, which is what keeps `packPluginDir` (it validates before it
 *                      zips) from having to become async and dragging publish/release with it.
 *   runAll(ctx)      — `preflight` and `publish`: the offline set PLUS the handful of things
 *                      that genuinely need GitHub.
 *
 * Nothing here decides how to PRINT a report — that is ./report.ts, so that `status` (a
 * checklist you read) and `validate` (an exit code a script reads) can render the same
 * outcomes differently without either owning the rules.
 */
import { OFFLINE_CHECKS } from './offline.js';
import { NETWORK_CHECKS } from './network.js';
import type { Check, CheckContext, CheckOutcome, CheckReport, CheckResult } from './types.js';
import { summarize } from './types.js';

export const ALL_CHECKS: Check[] = [...OFFLINE_CHECKS, ...NETWORK_CHECKS];

/**
 * A check that throws is a bug in the CHECK, not a verdict on the plugin. Report it as a failure
 * rather than letting it crash the command: an author who cannot run `status` at all is strictly
 * worse off than one who sees "this check is broken".
 */
function threw(e: unknown): CheckResult {
  return { status: 'fail', detail: 'check threw: ' + (e instanceof Error ? e.message : String(e)) };
}

const outcome = (check: Check, result: CheckResult): CheckOutcome => ({
  id: check.id,
  stage: check.stage,
  severity: check.severity,
  // Most gates are the REGISTRY's, not the loader's — they stop you publishing, not building.
  // Only the handful that make a plugin unloadable opt into 'artifact'.
  blocks: check.blocks ?? 'publish',
  title: check.title,
  ...result,
});

/** Every gate that is a pure function of the working tree. */
export function runOffline(ctx: CheckContext): CheckReport {
  return summarize(
    OFFLINE_CHECKS.map((check) => {
      try {
        return outcome(check, check.run(ctx));
      } catch (e) {
        return outcome(check, threw(e));
      }
    }),
  );
}

/** The offline set plus the network gates. Requires ctx.entry for the network half to do anything. */
export async function runAll(ctx: CheckContext): Promise<CheckReport> {
  const outcomes: CheckOutcome[] = runOffline(ctx).outcomes;
  for (const check of NETWORK_CHECKS) {
    try {
      outcomes.push(outcome(check, await check.run(ctx)));
    } catch (e) {
      outcomes.push(outcome(check, threw(e)));
    }
  }
  return summarize(outcomes);
}

export { OFFLINE_CHECKS } from './offline.js';
export { NETWORK_CHECKS, DEFAULT_REGISTRY } from './network.js';
export * from './types.js';
export { loadContext, makeContext } from './context.js';
export { renderChecklist, renderPlain, summaryLine, nextStep } from './report.js';
