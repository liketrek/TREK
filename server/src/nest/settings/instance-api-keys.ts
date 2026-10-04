import { readEnv } from '../../app-config';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type { UsersRepository, InstanceApiKeyName } from '../../db/repositories/Users.repository';
import type { ApiKeySource } from '@trek/shared';

/**
 * The third-party keys that belong to the instance rather than to a person.
 *
 * Google Places and Unsplash bill the install, not the account that pasted the
 * key in, so the value is instance configuration — the same argument #1772 made
 * for the LLM endpoint (see llm-parse/llm-config.ts: instance-wide, admin-set,
 * wins; per-user as the fallback). Both keys used to be resolved out of the
 * `users` columns alone, which meant "the key of the admin with the lowest id"
 * for everyone else and produced #1939: the admin searched with the key they
 * had just saved, every other member searched with a stranger's and got a 403
 * from Google.
 *
 * Stored as an encrypted `app_settings` row under the name below, reusing
 * apiKeyCrypto, so the format matches what the users columns already hold and
 * a legacy plaintext value still reads back.
 *
 * `InstanceApiKeyName` itself now lives on `Users.repository.ts` (Plan 3a Task
 * 0/5) — re-exported here so this module's existing external imports of the
 * type (`auth/user-profile.service.ts` and others) keep working unchanged.
 */
export type { InstanceApiKeyName };

/** Instance names whose per-user column is still honoured as a last resort. */
export const INSTANCE_API_KEY_NAMES: readonly InstanceApiKeyName[] = [
  'maps_api_key',
  'unsplash_api_key',
  'amap_api_key',
];

/**
 * Where a resolved key came from. Logged beside a provider error so "works for
 * the admin, 403 for everyone else" is one line in the log rather than a
 * guessing game; the key itself is never logged.
 *
 * Defined in @trek/shared because the admin transit-provider response (#1699)
 * puts it on the wire — re-declaring the union here would fork the contract.
 */
export type { ApiKeySource };

/**
 * These three functions used to take the raw-connection wrapper class
 * (`nest/database/database.service.ts`'s injectable) and run raw SQL through
 * it. They now take the caller's own `AppSettingsRepository`/`UsersRepository`
 * directly — every one of the six callers (`nest/addons`, `nest/auth` × 2,
 * `nest/maps`, `nest/transit`, `nest/unsplash`) constructor-injects them via
 * `@InjectRepository` and its own module's `MikroOrmModule.forFeature`, the
 * same wiring pattern every other converted domain in this plan uses.
 *
 * An earlier version of this file resolved the repositories itself from the
 * ACTIVE MikroORM request context (`RequestContext.getEntityManager()`)
 * instead of taking them as parameters, so none of the six callers' modules
 * needed new wiring. That worked in production and in e2e (both always run
 * inside a real request context, D6) but broke everywhere a unit test
 * constructs one of those six services directly with no MikroORM context at
 * all — which turned out to be the norm, not the exception: a full `npm run
 * test` run surfaced 185 failures across 12 files
 * (`addons.service.test.ts`, `auth.service.test.ts`,
 * `user-profile.service.test.ts`, `maps.service.test.ts` and its siblings,
 * `google-transit.provider.test.ts`, `unsplash.service.test.ts`,
 * `places.service.test.ts` transitively via maps, plus the one MCP-harness
 * case this was first caught from). Explicit repository parameters, matching
 * how every other converted repository in this migration is consumed, has no
 * such failure mode: a repository built via `t.repo(X)` (`allowGlobalContext:
 * true` in tests) works with or without a request context, exactly like
 * `AppSettingsRepository`'s/`SettingsRepository`'s own tests already prove.
 */
async function readInstanceValue(appSettings: AppSettingsRepository, name: InstanceApiKeyName): Promise<string | null> {
  const value = await appSettings.getValue(name);
  if (!value) return null;
  return decrypt_api_key(value) || null;
}

/**
 * The environment variable that overrides each instance key. Whatever it holds
 * is the operator key resolveApiKey puts first, so the admin panel names the
 * variable rather than showing a field that nothing reads (#1881).
 */
const OPERATOR_KEY_ENV: Record<InstanceApiKeyName, { variable: string; read: () => string | undefined }> = {
  maps_api_key: { variable: 'PLACES_API_KEY', read: () => readEnv().maps.placesApiKey },
  unsplash_api_key: { variable: 'UNSPLASH_ACCESS_KEY', read: () => readEnv().integrations.unsplashAccessKey },
  amap_api_key: { variable: 'AMAP_API_KEY', read: () => readEnv().maps.amapApiKey },
};

/** The instance keys an environment variable sets, each with that variable's name. Never the value. */
export function operatorKeyVariables(): Partial<Record<InstanceApiKeyName, string>> {
  const set: Partial<Record<InstanceApiKeyName, string>> = {};
  for (const name of INSTANCE_API_KEY_NAMES) {
    if (OPERATOR_KEY_ENV[name].read()) set[name] = OPERATOR_KEY_ENV[name].variable;
  }
  return set;
}

/** The instance-wide value in cleartext, or null when unset/cleared. */
export async function readInstanceApiKey(appSettings: AppSettingsRepository, name: InstanceApiKeyName): Promise<string | null> {
  return readInstanceValue(appSettings, name);
}

/**
 * Store the instance-wide value, encrypted. A blank value stores '' rather than
 * deleting the row: an admin who clears the field means "this instance has no
 * key", and a missing row would let the resolver fall through to whatever old
 * value still sits in their own users column.
 */
export async function writeInstanceApiKey(appSettings: AppSettingsRepository, name: InstanceApiKeyName, value: unknown): Promise<void> {
  await appSettings.setValue(name, maybe_encrypt_api_key(value) ?? '');
}

/**
 * Resolve a key for one request: operator env → instance-wide → the caller's
 * own row.
 *
 * The caller's own row is last, not second, and no other user's row is ever
 * read — falling back to a stranger's key is what server/CLAUDE.md forbids and
 * what #1939 reported. It stays as a fallback because `PUT /me/api-keys` has
 * always accepted a personal key and dropping it would break the installs where
 * each member pays for their own.
 *
 * `userId` 0 means "nobody is asking" (the unauthenticated app-config read):
 * there is no personal key to find, so the chain ends at the instance.
 *
 * The per-user fallback used to be a literal `USER_ROW_SQL[name]` statement
 * map; it is now `UsersRepository.getApiKeyColumn(userId, name)`, the typed
 * dispatch `Users.repository.ts` (Plan 3a Task 0) already provides.
 */
export async function resolveApiKey(
  appSettings: AppSettingsRepository,
  users: UsersRepository,
  name: InstanceApiKeyName,
  userId: number,
  operatorKey: string | undefined,
): Promise<{ key: string | null; source: ApiKeySource | null }> {
  if (operatorKey) return { key: operatorKey, source: 'operator-env' };

  const instance = await readInstanceValue(appSettings, name);
  if (instance) return { key: instance, source: 'instance' };
  if (!userId) return { key: null, source: null };

  const own = decrypt_api_key(await users.getApiKeyColumn(userId, name)) || null;
  return own ? { key: own, source: 'user-row' } : { key: null, source: null };
}
