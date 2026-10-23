import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';

import { z } from 'zod';

/**
 * Everything secret a connection holds, in ONE encrypted JSON blob
 * (`ai_connections.secrets`), the way document connections keep theirs: an API
 * key, or a ChatGPT sign-in's tokens with the time the access token stops
 * being used (epoch ms, already a little before it really expires).
 * scripts/migrate-encryption.ts rotates the blob as a whole.
 */
const aiSecretsSchema = z.union([
  z.object({ apiKey: z.string().min(1) }).strict(),
  z
    .object({
      accessToken: z.string().min(1),
      refreshToken: z.string().min(1),
      expiresAt: z.number(),
    })
    .strict(),
]);
type AiSecrets = z.infer<typeof aiSecretsSchema>;
export type ChatgptTokens = Extract<AiSecrets, { accessToken: string }>;

export function sealSecrets(secrets: AiSecrets): string {
  return String(maybe_encrypt_api_key(JSON.stringify(aiSecretsSchema.parse(secrets))));
}

/**
 * The blob opened for use, or null when there is none or it cannot be read
 * (a key rotated without this table, a broken row): the connection then asks
 * for its credential again rather than failing the boot or a request.
 */
export function openSecrets(stored: string | null | undefined): AiSecrets | null {
  if (!stored) return null;
  const plain = decrypt_api_key(stored);
  if (typeof plain !== 'string' || !plain) return null;
  try {
    const parsed = aiSecretsSchema.safeParse(JSON.parse(plain));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** What the settings show of a key: its last four characters. */
export function maskHint(apiKey: string): string {
  return `…${apiKey.slice(-4)}`;
}
