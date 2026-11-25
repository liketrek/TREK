import type { UsersRepository } from '../../db/repositories/Users.repository';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import type { SettingsService } from '../settings/settings.service';

/**
 * The Amap key a cover search uses: the instance's own value first (operator
 * env, then the stored setting), the caller's personal column last — the same
 * chain `settings/instance-api-keys.ts` defines, asked through the owners'
 * public surfaces. It lives beside the cover search rather than in
 * `amap-photo` so that domain stays a plain client that never reads another
 * domain's table, and receives the key as an argument.
 */
export async function resolveAmapCoverKey(
  settings: Pick<SettingsService, 'getInstanceApiKey'>,
  users: Pick<UsersRepository, 'getApiKeyColumn'>,
  userId: number,
): Promise<string | null> {
  const instance = await settings.getInstanceApiKey('amap_api_key');
  if (instance) return instance;
  return userId ? decrypt_api_key(await users.getApiKeyColumn(userId, 'amap_api_key')) || null : null;
}
