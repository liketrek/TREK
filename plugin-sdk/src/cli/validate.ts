#!/usr/bin/env node
/**
 * trek-plugin validate [dir] — the gate.
 *
 * Runs every check the registry enforces that can be answered from the working tree, and exits
 * non-zero if any of them would reject the plugin. That is a much stronger claim than it used to
 * be: this file previously ran about a fifth of the registry's rules, and demoted the two that
 * bite hardest — a bad `icon` and an unwritten README — to warnings. A green validate was not
 * evidence of anything, and the first real verdict arrived from `preflight`, over the network,
 * against a tag whose GitHub release was already immutable.
 *
 * The rules themselves live in ./checks/, shared with `status`, `preflight` and `publish`. This
 * file is now only a printer and an exit code.
 */
import { loadContext } from './checks/context.js';
import { runOffline } from './checks/index.js';
import { renderPlain } from './checks/report.js';

export interface ValidateReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * One string per problem, for callers that want a flat list rather than a rendered checklist.
 *
 * The `fix` is folded in, not dropped. Several checks summarise in `detail` ("2 problems") and put
 * the specifics in `fix` ("• tag \"Flight Tracking\" is not a lowercase slug…") — so a flat list
 * built from title + detail alone would report a failure without ever saying WHAT failed, which
 * is the exact uselessness this rework is about.
 */
function flatten(outcomes: { title: string; detail?: string; fix?: string }[]): string[] {
  return outcomes.map((o) => {
    const head = o.detail ? `${o.title} — ${o.detail}` : o.title;
    return o.fix ? `${head}\n${o.fix}` : head;
  });
}

export function validatePluginDir(dir: string): ValidateReport {
  const report = runOffline(loadContext(dir));
  return {
    ok: report.ok,
    errors: flatten(report.errors),
    warnings: flatten(report.warnings),
  };
}

if (process.argv[1] && process.argv[1].endsWith('validate.js')) {
  const dir = process.argv[2] || '.';
  const report = runOffline(loadContext(dir));
  const text = renderPlain(report);
  if (text) console.error(text);
  if (!report.ok) process.exit(1);
  console.log('✓ plugin is valid');
}
