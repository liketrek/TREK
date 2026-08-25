import fs from 'fs';

/**
 * Pure + module-scoped half of the admin domain, relocated verbatim from
 * services/adminService.ts with the 2026-08 fold (auth.helpers / maps.helpers /
 * atlas-geo precedent).
 *
 * The version cache is module-scoped **on purpose** (the permissions-cache
 * precedent, permissions.bridge.ts): the daily version-check cron
 * (VersionCheckJob) and GET /api/admin/version-check both run on the container
 * singleton now, but the module scope keeps the one-5-minute-cache guarantee
 * independent of how many AdminService instances exist (the legacy module and
 * the retired admin bridge relied on exactly that). Instance state would double
 * the GitHub traffic and let the cron notify on a version the UI has not seen
 * yet.
 */

/** bcrypt cost factor for user passwords — kept in sync with authService. */
export const BCRYPT_COST = 12;

export function utcSuffix(ts: string | null | undefined): string | null {
  if (!ts) return null;
  return ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z';
}

export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [base, pre] = v.split('-pre.');
    const parts = base.split('.').map(Number);
    const n = pre !== undefined ? Number.parseInt(pre, 10) : null;
    const preN = n !== null && Number.isFinite(n) ? n : null;
    return { parts, preN };
  };
  const pa = parse(a),
    pb = parse(b);
  for (let i = 0; i < Math.max(pa.parts.length, pb.parts.length); i++) {
    const na = pa.parts[i] || 0,
      nb = pb.parts[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  // Equal base: stable > prerelease; higher preN wins among prereleases
  if (pa.preN === null && pb.preN !== null) return 1;
  if (pa.preN !== null && pb.preN === null) return -1;
  if (pa.preN !== null && pb.preN !== null) {
    if (pa.preN > pb.preN) return 1;
    if (pa.preN < pb.preN) return -1;
  }
  return 0;
}

/**
 * Documented parity exception to the "modules must be importable without side
 * effects" rule (auth.helpers.ts's import-time DUMMY_PASSWORD_HASH precedent):
 * this probes the filesystem at module evaluation, exactly as the legacy module
 * did. Making it lazy would change *when* `fs` is consulted relative to a
 * suite's vi.mock setup, and so could shift `is_docker` in checkVersion
 * payloads.
 */
export const isDocker = (() => {
  try {
    return (
      fs.existsSync('/.dockerenv') ||
      (fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker'))
    );
  } catch {
    return false;
  }
})();

export interface VersionInfo {
  current: string;
  latest: string;
  update_available: boolean;
  release_url?: string;
  is_docker: boolean;
  is_prerelease: boolean;
}

const VERSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let _versionCache: { data: VersionInfo; expiresAt: number } | null = null;

/** Cached payload while inside the TTL, otherwise null. */
export function readVersionCache(): VersionInfo | null {
  if (_versionCache && Date.now() < _versionCache.expiresAt) return _versionCache.data;
  return null;
}

/** `ttl` overrides the 5-minute default — failed checks cache on a shorter one. */
export function writeVersionCache(data: VersionInfo, ttl: number = VERSION_CACHE_TTL): void {
  _versionCache = { data, expiresAt: Date.now() + ttl };
}

/** Test-only: clear the in-memory version cache. */
export function __clearVersionCacheForTests(): void {
  _versionCache = null;
}
