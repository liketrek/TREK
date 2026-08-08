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
 * Fail-fast startup validation: a variable that is PRESENT but malformed aborts
 * boot with an aggregated report; unset/blank variables always pass (their
 * documented defaults apply). Called once from the production entrypoint (see
 * boot-validate.ts, imported by index.ts right after dotenv) — deliberately NOT
 * wired into buildApp() or ConfigModule, so tests booting apps with a minimal
 * env are unaffected.
 */
export function validateEnvAtBoot(raw: RawEnv = process.env as RawEnv): void {
  const result = envSchema.safeParse(raw);
  if (result.success) return;
  const lines = result.error.issues.map((issue) => {
    const key = String(issue.path[0]);
    return `  - ${key}=${JSON.stringify(raw[key])}: ${issue.message}`;
  });
  console.error(`Invalid environment configuration:\n${lines.join('\n')}`);
  throw new Error(
    `Invalid environment configuration (${lines.length} problem${lines.length === 1 ? '' : 's'}). ` +
      'Fix the variables listed above, or unset them to use their defaults.',
  );
}
