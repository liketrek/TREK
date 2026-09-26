import { deriveAll, type AppEnv, type RawEnv } from './derive';
import { envSchema } from './env.schema';

export type { AppEnv, RawEnv };

/**
 * Live typed view of the environment. Re-derives from the CURRENT process.env
 * on every call — never cache the result across requests: the test suite (and
 * the admin demo tooling) mutates process.env at runtime and depends on the
 * next read observing the change. Derivation is a handful of string coercions,
 * not a Zod parse; validation happens once at boot via validateEnvAtBoot().
 */
export function readEnv(): AppEnv {
  return deriveAll(process.env as RawEnv);
}

/**
 * Variables whose value never goes into the boot report, even when it is the
 * malformed one: the report lands in container logs, and a key that is merely
 * mistyped is still a real key. The name and the problem are enough to fix it.
 */
export const SECRET_ENV_KEYS: ReadonlySet<string> = new Set([
  'ENCRYPTION_KEY',
  'OIDC_CLIENT_SECRET',
  'SMTP_PASS',
  'VAPID_PRIVATE_KEY',
  'UNSPLASH_ACCESS_KEY',
  'ADMIN_PASSWORD',
  'PLACES_API_KEY',
  'AMAP_API_KEY',
  'AMAP_API_SECRET',
  'MAPBOX_ACCESS_TOKEN',
  'CARTO_API_KEY',
  'DEMO_ADMIN_PASS',
]);

/** How a variable's value appears in the boot report. */
function reportedValue(key: string, value: string | undefined): string {
  return SECRET_ENV_KEYS.has(key) ? '***' : JSON.stringify(value);
}

/**
 * Fail-fast startup validation: a variable that is PRESENT but malformed aborts
 * boot with an aggregated report; unset/blank variables always pass (their
 * documented defaults apply). Called once from the production entrypoint (see
 * boot-validate.ts, imported by index.ts right after dotenv) — deliberately NOT
 * wired into buildApp() or ConfigModule, so tests booting apps with a minimal
 * env are unaffected.
 */
export function validateEnvAtBoot(raw: RawEnv = process.env as RawEnv): void {
  const result = envSchema.safeParse(raw);
  const lines = result.success
    ? []
    : result.error.issues.map((issue) => {
        const key = String(issue.path[0]);
        return `  - ${key}=${reportedValue(key, raw[key])}: ${issue.message}`;
      });
  lines.push(...managedPreconditions(raw));
  if (lines.length === 0) return;
  console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
  throw new Error(
    `Invalid environment configuration (${lines.length} problem${lines.length === 1 ? '' : 's'}). ` +
      'Fix the variables listed above, or unset them to use their defaults.',
  );
}

/**
 * Cross-field rules that only apply to a centrally administered install.
 *
 * These are not schema problems — every value here is individually valid, and
 * blank always means "use the default" everywhere else in this file. They are
 * combinations that would boot happily and be wrong, which is the case the
 * schema cannot express and the one worth refusing (fail closed, see
 * server/CLAUDE.md).
 *
 * Deliberately unreachable for a self-hoster: without TREK_MANAGED the list is
 * empty and nothing changes.
 */
function managedPreconditions(raw: RawEnv): string[] {
  if (deriveAll(raw).managed.enabled !== true) return [];
  const problems: string[] = [];

  // Without it the key is a file in the data volume, and backupService bundles
  // that file into every archive it builds. The archive is downloadable by any
  // instance admin, so the at-rest encryption would come with its own key in the
  // same zip. Provisioning sets this; forgetting it is silent otherwise.
  if (!raw.ENCRYPTION_KEY) {
    problems.push(
      '  - ENCRYPTION_KEY is unset: required with TREK_MANAGED, because otherwise the ' +
        'at-rest key lives in the data volume and is bundled into every backup download.',
    );
  }

  return problems;
}
