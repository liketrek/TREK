/**
 * trek-plugin status [dir] — where am I, and what do I do next?
 *
 * The command an author runs when they are lost, which — before this existed — was most of the
 * time. It runs every offline gate the registry enforces, prints the whole journey as a
 * checklist, and names ONE next command.
 *
 * It deliberately never exits non-zero. `status` is for orientation; `validate` is the gate. A
 * command you are afraid to run because it might fail your build is not a command you reach for
 * when you are stuck.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadContext } from './checks/context.js';
import { runOffline } from './checks/index.js';
import { renderChecklist, nextStep, summaryLine } from './checks/report.js';

/** Has this version already been tagged locally? Cheap, offline — no fetch, no API. */
function isTagged(dir: string, version: string): boolean {
  for (const tag of [`v${version}`, version]) {
    try {
      execFileSync('git', ['-C', dir, 'rev-parse', `${tag}^{commit}`], { stdio: 'pipe' });
      return true;
    } catch {
      /* not this one */
    }
  }
  return false;
}

/** Are there uncommitted changes? The registry grades the COMMIT, so a dirty tree is worth saying. */
function isDirty(dir: string): boolean {
  try {
    return execFileSync('git', ['-C', dir, 'status', '--porcelain'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().length > 0;
  } catch {
    return false; // not a git repo — `publish` will say so far more usefully than we can here
  }
}

export interface StatusOptions {
  /** Show passing checks too, not just problems. Defaults to true — the whole point is the map. */
  verbose?: boolean;
  colour?: boolean;
}

export function runStatus(dir: string, opts: StatusOptions = {}): { ok: boolean; text: string } {
  const root = path.resolve(dir);
  const out: string[] = [];

  if (!fs.existsSync(path.join(root, 'trek-plugin.json'))) {
    return {
      ok: false,
      text:
        `  No plugin here.\n\n  ${path.relative(process.cwd(), root) || '.'} has no trek-plugin.json.\n\n` +
        '  next →  trek-plugin create',
    };
  }

  const ctx = loadContext(root);
  const report = runOffline(ctx);

  const id = typeof ctx.manifest?.id === 'string' ? ctx.manifest.id : path.basename(root);
  const type = typeof ctx.manifest?.type === 'string' ? ctx.manifest.type : '?';
  const version = typeof ctx.manifest?.version === 'string' ? ctx.manifest.version : '?';

  out.push('');
  out.push(`  ${id} · ${type} · v${version}`);
  out.push(renderChecklist(report, { verbose: opts.verbose ?? true, colour: opts.colour }));

  // Git state is not a "gate" — it is context. A plugin can be perfectly valid and simply not
  // released yet, and calling that a failure would be a lie.
  out.push('');
  out.push('  Repo');
  out.push('    ' + (isTagged(root, version) ? `· v${version} is tagged locally` : `· v${version} is not tagged yet`));
  if (isDirty(root)) {
    out.push('    ! uncommitted changes — the registry grades the COMMIT, not your working tree');
  }

  const next = nextStep(report);
  out.push('');
  out.push('  ' + summaryLine(report));
  out.push(next.command ? `  next →  ${next.command}` : `  next →  ${next.hint}`);
  out.push('');

  return { ok: report.ok, text: out.join('\n') };
}
