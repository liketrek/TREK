import { run } from './pg-process';

/**
 * The client-tool versions a restore accepts (CVE-2025-8714). A script from a
 * dump an admin uploaded is run by psql, which would also run a psql
 * meta-command (`\!` runs a shell command) smuggled into an object name. A
 * fixed pg_restore opens the script with `\restrict <random key>`, and a fixed
 * psql then refuses every meta-command until the matching `\unrestrict`.
 *
 * RESTRICT_SINCE holds, per major, the first minor that carries the fix. Every
 * major after the last one listed has it from its first release.
 */
const RESTRICT_SINCE: Readonly<Partial<Record<number, number>>> = { 14: 19, 15: 14, 16: 10, 17: 6 };
const LAST_MAJOR_WITHOUT_IT = Math.max(...Object.keys(RESTRICT_SINCE).map(Number));

/** Whether `version` (`pg_restore (PostgreSQL) 17.11 (Debian …)`) carries the fix. */
export function hasRestrictFix(version: string): boolean {
  const match = /\(PostgreSQL\) (\d+)\.(\d+)/.exec(version);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  if (major > LAST_MAJOR_WITHOUT_IT) return true;
  const firstFixedMinor = RESTRICT_SINCE[major];
  return firstFixedMinor !== undefined && minor >= firstFixedMinor;
}

/** The minimum versions as the error names them, newest major first: "17.6, 16.10, 15.14 or 14.19". */
function minimumVersionsText(): string {
  const floors = Object.keys(RESTRICT_SINCE)
    .map(Number)
    .sort((a, b) => b - a)
    .map((major) => `${major}.${RESTRICT_SINCE[major]}`);
  const last = floors.pop() ?? '';
  return floors.length > 0 ? `${floors.join(', ')} or ${last}` : last;
}

/**
 * Refuses the restore when pg_restore or psql predates the fix. The tools'
 * own versions are checked, not the script, whose text the dump controls.
 */
export async function refuseToolsWithoutRestrict(binDir: string | undefined): Promise<void> {
  const tools = ['pg_restore', 'psql'] as const;
  const versions = await Promise.all(tools.map((tool) => run(tool, binDir, ['--version'], {})));
  const stale = tools.findIndex((_, i) => !hasRestrictFix(versions[i]));
  if (stale < 0) return;
  throw new Error(
    `${tools[stale]} is too old to restore safely (${versions[stale].trim()}): it must be at least ${minimumVersionsText()} ` +
      '(the Docker image has 17). Upgrade the PostgreSQL client tools or point TREK_DB_PG_BIN_DIR at newer ones.',
  );
}
