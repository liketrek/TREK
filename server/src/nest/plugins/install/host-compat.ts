import { readEnv, runningVersion } from '../../../app-config';

import semver from 'semver';

/**
 * Host-version compatibility for plugins (#plugins). A manifest declares the TREK
 * versions it supports as a semver RANGE (`"trek": ">=3.2.0 <4.0.0"`); this module
 * is the single place that answers "what TREK is running" and "does that range admit
 * it". Every install front door (registry, sideload, dev-link) and the activation
 * gate go through here, so a plugin can never run against a host it says it doesn't
 * support — and, just as importantly, they all answer the question the same way.
 */

/** The running TREK version (same source as the rest of the app). */
export function hostVersion(): string {
  return runningVersion();
}

let warnedUnparseable = false;

/**
 * The running version as a plain release triple, or null when it can't be parsed at all.
 *
 * Prereleases are deliberately COERCED to their target release: 3.4.0-rc.1 compares as
 * 3.4.0, and 4.0.0-rc.1 as 4.0.0. Both halves of that matter, and semver's own ordering
 * gets both wrong for this purpose:
 *
 *  - Plain `satisfies()` excludes a prerelease from any range that doesn't name one, so
 *    3.4.0-rc.1 would fail ">=3.2.0 <4.0.0" and EVERY plugin on the instance would go
 *    incompatible the moment TREK shipped a release candidate.
 *  - `includePrerelease` fixes that but orders 4.0.0-rc.1 BEFORE 4.0.0, so it satisfies
 *    "<4.0.0" — letting a plugin that disclaims TREK 4 load on a build that already
 *    carries TREK 4's breaking changes. That is the precise failure this gate exists to
 *    prevent.
 *
 * Coercing to the release says the useful thing instead: for compatibility purposes, an
 * rc of 4.0 IS 4.0.
 *
 * A null host NEVER blocks anything (see {@link hostSatisfies}). This is deliberate:
 * a source install can set APP_VERSION to anything (`dev`, a branch name), and an
 * unversioned build must stay fully usable. The warning exists so that a MISCONFIGURED
 * APP_VERSION in production — which silently switches this whole gate off — is visible
 * in the logs instead of being discovered when an incompatible plugin misbehaves.
 */
export function normalizedHost(): string | null {
  const raw = hostVersion();
  const coerced = semver.coerce(raw)?.version ?? null;
  if (!coerced && !warnedUnparseable) {
    warnedUnparseable = true;
    console.warn(
      `[plugins] APP_VERSION "${raw}" is not a semver version — plugin TREK-compatibility checks are disabled`,
    );
  }
  return coerced;
}

/** Test hook: re-arm the one-time unparseable-host warning. */
export function __resetHostWarningForTests(): void {
  warnedUnparseable = false;
}

/**
 * Whether `r` is a semver range a plugin may declare.
 *
 * `semver.validRange` alone is not enough: ">=4.0.0 <3.0.0" is a VALID range that no
 * version can ever satisfy, and a plugin that declares it would be uninstallable with
 * no way to tell the author why. minVersion() returns null for exactly that case (and
 * throws outright on garbage like "latest"), so it is the real satisfiability test.
 */
export function isValidTrekRange(r: unknown): r is string {
  if (typeof r !== 'string' || !r.trim()) return false;
  if (semver.validRange(r) === null) return false;
  try {
    return semver.minVersion(r) !== null;
  } catch {
    return false;
  }
}

/**
 * The lowest TREK version a range admits — what the UI shows as "Requires TREK x+".
 * Undefined for a range with no real lower bound (`*`, `<4.0.0`), because "requires
 * TREK 0.0.0+" is noise rather than information.
 */
export function minTrekOf(range: string): string | undefined {
  if (!isValidTrekRange(range)) return undefined;
  const min = semver.minVersion(range);
  if (!min || min.version === '0.0.0') return undefined;
  return min.version;
}

/**
 * Whether the running TREK satisfies `range`. The host arrives here already coerced to a
 * release triple (see {@link normalizedHost}), which is what makes a plain satisfies()
 * correct on both prerelease edges.
 *
 * A null/empty range is not a decision this function can make — the caller knows whether
 * an undeclared range means "reject" (an install) or "unknown" (an already-installed
 * plugin), and they surface different codes. It returns false so neither can pass by
 * accident.
 */
export function hostSatisfies(range: string | null | undefined, host: string | null = normalizedHost()): boolean {
  // Coerce again rather than trusting the argument: callers that pass a host explicitly
  // (the registry, tests) would otherwise skip the prerelease normalisation and get a
  // different answer than the default path for the same TREK.
  const release = host === null ? null : (semver.coerce(host)?.version ?? null);
  if (release === null) return true; // unversioned build — never block
  if (!isValidTrekRange(range)) return false;
  return semver.satisfies(release, range);
}

/**
 * Whether TREK_PLUGINS_IGNORE_TREK_RANGE is set: the operator's explicit "install it
 * anyway" for a plugin whose author has not updated its `trek` range. While it is on,
 * every TREK-version gate (registry picker, post-extraction re-check, sideload, dev-link,
 * activation) WARNS instead of refusing. Nothing else changes — {@link hostSatisfies}
 * keeps telling the truth, so the admin UI can still say the plugin is running outside
 * the range its author vouched for. Read live, like the other plugin switches.
 */
export function trekRangeBypassed(): boolean {
  return readEnv().plugins.ignoreTrekRange;
}

/** What a bypassed gate reports back to the admin: the range that was ignored and the host it was ignored on. */
export interface TrekRangeBypass {
  /** The plugin's declared range, or null when it declared none at all. */
  trekRange: string | null;
  hostVersion: string;
  /**
   * True when an admin accepted this one plugin outside its range, false when
   * TREK_PLUGINS_IGNORE_TREK_RANGE lets every plugin through.
   */
  acceptedByAdmin: boolean;
}

/** An admin's consent to run one plugin outside its range, as the plugins row keeps it. */
interface TrekRangeAcceptance {
  /** The plugin version that was installed when the admin accepted. */
  acceptedVersion: string | null;
  /** The TREK version it ran on then. */
  acceptedHost: string | null;
}

/**
 * Whether an admin's consent still covers the plugin as it is installed now: the
 * same plugin version, on the same TREK major. An update of the plugin, or a TREK
 * major past the one the admin saw it run on, asks again.
 */
export function acceptanceHolds(
  pluginVersion: string | null | undefined,
  a: TrekRangeAcceptance | null | undefined,
): boolean {
  if (!a?.acceptedVersion || !a.acceptedHost || !pluginVersion) return false;
  if (a.acceptedVersion !== pluginVersion) return false;
  const accepted = semver.coerce(a.acceptedHost);
  const host = normalizedHost();
  if (!accepted || host === null) return false;
  return semver.major(accepted) === semver.major(host);
}

/**
 * Non-null exactly when `range` would have been refused and only a bypass lets it
 * through: the marker that makes an install/activate response say "this worked, but
 * only because you told TREK to run it anyway". `accepted` is this one plugin's
 * consent from the admin; the environment switch covers every plugin. Null for a
 * normal install (the range fits) and null when neither applies (the gate refuses).
 */
export function bypassedRange(range: string | null | undefined, accepted = false): TrekRangeBypass | null {
  if (hostSatisfies(range)) return null;
  const everyPlugin = trekRangeBypassed();
  if (!everyPlugin && !accepted) return null;
  return { trekRange: range ?? null, hostVersion: hostVersion(), acceptedByAdmin: !everyPlugin };
}

/** What the activation gate reads off a plugin's row to decide whether it may run on this TREK. */
interface TrekRangeRow {
  trek_range: string | null;
  version: string | null;
  trek_range_accepted_version: string | null;
  trek_range_accepted_host: string | null;
}

/** Why the activation gate refuses a plugin on this TREK, in the shape its error carries. */
interface TrekRangeRefusal {
  message: string;
  code: 'TREK_VERSION_UNKNOWN' | 'TREK_VERSION_INCOMPATIBLE';
  detail: { trekRange: string | null; hostVersion: string };
}

/**
 * The TREK-version half of the activation gate: null when the plugin may run, else why
 * not. An admin's consent (`acceptNow`, or one kept on the row for this version and TREK
 * major) or TREK_PLUGINS_IGNORE_TREK_RANGE lets an outgrown plugin through, and every
 * start of one says so in the log; the plugin list carries the same marker for the UI.
 */
export function trekRangeRefusal(id: string, row: TrekRangeRow, acceptNow = false): TrekRangeRefusal | null {
  const accepted =
    acceptNow ||
    acceptanceHolds(row.version, {
      acceptedVersion: row.trek_range_accepted_version,
      acceptedHost: row.trek_range_accepted_host,
    });
  const bypass = bypassedRange(row.trek_range, accepted);
  if (bypass) {
    warnRangeBypass(id, bypass);
    return null;
  }
  if (!row.trek_range) {
    return {
      message: `plugin ${id} does not declare which TREK versions it supports`,
      code: 'TREK_VERSION_UNKNOWN',
      detail: { trekRange: null, hostVersion: hostVersion() },
    };
  }
  if (hostSatisfies(row.trek_range)) return null;
  return {
    message: `plugin ${id} requires TREK ${row.trek_range} — this is TREK ${hostVersion()}`,
    code: 'TREK_VERSION_INCOMPATIBLE',
    detail: { trekRange: row.trek_range, hostVersion: hostVersion() },
  };
}

/**
 * The one log line every bypassed gate writes. It names the plugin, the range that was
 * ignored and the host it was ignored on, so an operator reading the log after a plugin
 * misbehaves can connect the two without the UI.
 */
export function warnRangeBypass(id: string, b: TrekRangeBypass): void {
  const declared = b.trekRange ? `declares TREK ${b.trekRange}` : 'declares no TREK version range';
  const because = b.acceptedByAdmin ? 'an admin chose to run it anyway' : 'TREK_PLUGINS_IGNORE_TREK_RANGE is set';
  console.warn(
    `[plugins] ${id} ${declared} — this is TREK ${b.hostVersion}; continuing because ${because}. The author has not verified it on this version: it may not work, and it could corrupt TREK data.`,
  );
}
