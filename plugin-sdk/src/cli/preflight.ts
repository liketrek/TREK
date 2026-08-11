/**
 * trek-plugin preflight — run the registry's CI checks locally, BEFORE you open a PR.
 *
 * This used to be the ONLY place the registry's real rules were applied, which made it the place
 * authors discovered their README was unwritten — over the network, against a pushed tag, after
 * an immutable GitHub release had been cut. The rules now live in ./checks/ and most of them fire
 * offline from `status` and `validate`, long before any of that. What preflight adds is the last
 * mile: the things that can only be known once the tag, the release and the registry exist.
 *
 * The contract has not changed, and now covers the whole check registry:
 * A GATE THE REGISTRY HAS AND WE DON'T IS A FALSE GREEN, and an author trusts a green.
 * test/checks-parity.test.ts is what keeps this honest.
 */
import { loadContext } from './checks/context.js';
import { runAll } from './checks/index.js';
import type { RegistryEntry } from './checks/types.js';

export type { RegistryEntry as Entry, RegistryEntryVersion as EntryVersion } from './checks/types.js';

export interface PreflightReport {
  ok: boolean;
  failures: string[];
  passed: string[];
}

export interface PreflightOptions {
  /** Check every version in the entry, not just the newest. */
  all?: boolean;
  /** The plugin directory, for the offline half. Defaults to cwd. */
  dir?: string;
  /** Registry repo to check owner binding + signing history against. */
  registry?: string;
  /** The exact artifact bytes the entry was built from, when the caller still holds them. */
  zipBytes?: Buffer;
}

/** Flatten a check outcome into the one-line strings this command has always printed. */
const line = (o: { title: string; detail?: string; fix?: string }): string =>
  (o.detail ? `${o.title} — ${o.detail}` : o.title) + (o.fix ? '\n' + o.fix.split('\n').map((l) => '    ' + l).join('\n') : '');

export async function preflight(entry: RegistryEntry, opts: PreflightOptions = {}): Promise<PreflightReport> {
  const ctx = loadContext(opts.dir ?? '.', { entry, zipBytes: opts.zipBytes });
  ctx.registry = opts.registry;
  ctx.allVersions = opts.all;

  const report = await runAll(ctx);
  return {
    ok: report.ok,
    // Warnings are surfaced by `status`/`validate`; preflight reports only what would REJECT the
    // entry, because its whole promise is "this will get through CI".
    failures: report.errors.map(line),
    passed: report.outcomes.filter((o) => o.status === 'pass').map((o) => (o.detail ? `${o.title} — ${o.detail}` : o.title)),
  };
}
