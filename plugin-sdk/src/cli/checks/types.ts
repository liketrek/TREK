/**
 * The check registry: every gate the TREK-Plugins registry enforces, declared ONCE.
 *
 * The problem this solves: the registry's gates are, almost all of them, functions of two
 * files that are sitting in the author's working directory (`trek-plugin.json`, `README.md`).
 * But CI reads them over the network at a pinned commit, so we used to only check them over
 * the network too — from `preflight`, which runs against a PUSHED TAG. By then the author has
 * cut an immutable GitHub release, and the registry pins its sha256. Learning there that the
 * README is 61 chars short is learning it one step too late.
 *
 * So each check declares what it NEEDS rather than where it runs:
 *
 *   depth: 'offline'  — a pure function of the working tree. Runs in `status`, `validate`,
 *                       `preflight` and as `publish`'s first step. This is most of them.
 *   depth: 'network'  — genuinely needs GitHub or the registry repo (a tag must resolve to a
 *                       commit; an artifact must download and hash). Only four are really
 *                       like this. They run in `preflight` and `publish`.
 *
 * One list, three depths. The contract inherited from preflight.ts still holds and now covers
 * `validate` too: A GATE THE REGISTRY HAS AND THIS FILE DOESN'T IS A FALSE GREEN, and an
 * author trusts a green. When TREK-Plugins' scripts/validate-entry.mjs or check-readme.mjs
 * grows a rule, it grows one here — test/checks-parity.test.ts is what stops the two drifting.
 */

/**
 * The journey, in the order an author walks it. `status` prints its checklist grouped by
 * these, so they double as the answer to "where am I?".
 */
export type CheckStage = 'manifest' | 'code' | 'docs' | 'release';

export const STAGES: { id: CheckStage; title: string }[] = [
  { id: 'manifest', title: 'Manifest' },
  { id: 'code', title: 'Code' },
  { id: 'docs', title: 'Docs' },
  { id: 'release', title: 'Release' },
];

/** What a check needs in order to run. See the file header. */
export type CheckDepth = 'offline' | 'network';

/**
 * 'error' fails `validate` (and blocks `publish`). 'warn' never fails a command — it is for
 * things that are legal but almost always a mistake, where refusing would be presumptuous.
 *
 * The bar for 'error' is: THE REGISTRY WOULD REJECT THIS, or TREK WOULD REFUSE TO RUN IT.
 * Anything softer is a warn. Getting this wrong in the lenient direction is a false green,
 * which is the bug class this whole module exists to kill.
 */
export type CheckSeverity = 'error' | 'warn';

/**
 * What a failure actually STOPS YOU DOING. Severity says how bad it is; this says when it bites.
 *
 * The distinction is not academic. `pack` validates before it zips, so without this axis an
 * unwritten README would refuse to build an artifact — and packing is how you install a plugin
 * into a local TREK to try it. Blocking the dev loop on a docs gate that only matters at publish
 * time would be exactly the over-eager gatekeeping this rework exists to remove.
 *
 *   'artifact' — the plugin is broken. It cannot be built, loaded or installed. `pack` refuses.
 *   'publish'  — the plugin works, but the registry would reject it. `pack` allows it; `validate`
 *                and `publish` do not.
 *
 * A 'warn' never blocks anything, whatever it is tagged with.
 */
export type CheckBlocks = 'artifact' | 'publish';

export type CheckStatus = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  status: CheckStatus;
  /** The specific, quantified finding: "61/400 chars of prose". Shown next to the title. */
  detail?: string;
  /** A human sentence: what to actually do about it. Shown indented under a failure. */
  fix?: string;
  /** The literal command that fixes this, e.g. `trek-plugin shot`. Drives "next →". */
  next?: string;
}

export const pass = (detail?: string): CheckResult => ({ status: 'pass', detail });
export const skip = (detail?: string): CheckResult => ({ status: 'skip', detail });
export const fail = (detail: string, fix?: string, next?: string): CheckResult => ({
  status: 'fail',
  detail,
  fix,
  next,
});

/**
 * Everything a check may read. Assembled once by `loadContext()` so that N checks don't do N
 * reads of the same README, and so tests can hand-build a context without touching a disk.
 */
export interface CheckContext {
  /** Absolute path to the plugin directory. */
  dir: string;
  /** Parsed `trek-plugin.json`, or undefined when it is missing or unparseable. */
  manifest?: Record<string, unknown>;
  /** Why the manifest is absent, when it is — "no trek-plugin.json" / a JSON parse error. */
  manifestError?: string;
  /** `README.md`, or undefined when missing. */
  readme?: string;
  /** `client/index.html`, when the plugin has one. */
  clientHtml?: string;
  /** Does a path relative to `dir` exist? The seam that lets tests fake a tree. */
  exists: (rel: string) => boolean;
  /**
   * The packed artifact's bytes. Present only on the `pack`/`publish` path — checks that
   * need it must `skip` when it is absent rather than fail, or `status` would demand a zip
   * from an author who has not packed one and has no reason to.
   */
  zipBytes?: Buffer;
  /** The built registry entry — network checks only. */
  entry?: RegistryEntry;
  /** The registry repo to check owner binding + signing history against. Network checks only. */
  registry?: string;
  /** Check every version in the entry, not just the newest. Mirrors `preflight --all`. */
  allVersions?: boolean;
}

/** The shape `entry.ts` builds and TREK-Plugins stores at registry/plugins/<id>.json. */
export interface RegistryEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  repo: string;
  type: string;
  icon?: string;
  homepage?: string;
  tags?: string[];
  authorPublicKey?: string;
  versions: RegistryEntryVersion[];
}

export interface RegistryEntryVersion {
  version: string;
  gitTag: string;
  commitSha: string;
  downloadUrl: string;
  sha256: string;
  trek: string;
  size: number;
  apiVersion: number;
  nativeModules: false;
  operatorEgress?: boolean;
  signature?: string;
  publishedAt: string;
  requiredAddons?: string[];
  pluginDependencies?: { id: string; version: string }[];
}

interface CheckBase {
  /** Stable dotted id, e.g. 'readme.prose'. Tests and `--only` address checks by this. */
  id: string;
  stage: CheckStage;
  severity: CheckSeverity;
  /** When a failure bites. Defaults to 'publish' — most gates are the registry's, not the loader's. */
  blocks?: CheckBlocks;
  /** Imperative and specific — it reads as a checklist line: "README has all four sections". */
  title: string;
}

/**
 * An offline check is SYNCHRONOUS, and that is enforced by the type rather than by convention.
 *
 * It buys two things. It keeps `validate` synchronous, so `packPluginDir` — which validates
 * before it zips — does not have to become async and drag `publish`/`release`/`entry` with it.
 * And it makes "this check does no IO" a thing the compiler checks: an offline check that
 * reaches for the network cannot await, so it cannot quietly become a network check.
 */
export interface OfflineCheck extends CheckBase {
  depth: 'offline';
  run(ctx: CheckContext): CheckResult;
}

export interface NetworkCheck extends CheckBase {
  depth: 'network';
  run(ctx: CheckContext): Promise<CheckResult>;
}

export type Check = OfflineCheck | NetworkCheck;

/** One check plus how it turned out. */
export interface CheckOutcome extends CheckResult {
  id: string;
  stage: CheckStage;
  severity: CheckSeverity;
  blocks: CheckBlocks;
  title: string;
}

export interface CheckReport {
  outcomes: CheckOutcome[];
  /** Failures of severity 'error' — these block `validate` and `publish`. */
  errors: CheckOutcome[];
  /** Failures of severity 'warn' — reported, never fatal. */
  warnings: CheckOutcome[];
  /** No errors. Warnings do not affect this. */
  ok: boolean;
}

export function summarize(outcomes: CheckOutcome[]): CheckReport {
  const failed = outcomes.filter((o) => o.status === 'fail');
  const errors = failed.filter((o) => o.severity === 'error');
  const warnings = failed.filter((o) => o.severity === 'warn');
  return { outcomes, errors, warnings, ok: errors.length === 0 };
}

/**
 * The subset of a report that blocks a given action. `pack` asks for 'artifact' — it refuses to
 * zip a plugin that could never load, but does not care that the README is still a stub.
 */
export function blocking(report: CheckReport, action: CheckBlocks): CheckReport {
  if (action === 'publish') return report;
  const errors = report.errors.filter((e) => e.blocks === 'artifact');
  return { ...report, errors, ok: errors.length === 0 };
}
