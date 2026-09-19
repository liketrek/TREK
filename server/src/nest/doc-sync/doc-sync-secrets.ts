import { DOCSYNC_SECRET_MASK } from '@trek/shared';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';

/**
 * Credential handling for document connections.
 *
 * All secret fields of a connection live in ONE encrypted JSON column rather
 * than a column per provider. A sixth provider then needs no migration, and the
 * key rotation in scripts/migrate-encryption.ts stays a single line instead of
 * a field list somebody will extend and forget. A forgotten column does not
 * survive a rotation, and the failure only shows up months later as a
 * connection that cannot authenticate any more.
 */

export type SecretMap = Record<string, string>;

/** Encrypt the whole secret map for storage. Empty maps store as NULL. */
export function encryptSecrets(secrets: SecretMap): string | null {
  const entries = Object.entries(secrets).filter(([, v]) => typeof v === 'string' && v.length > 0);
  if (entries.length === 0) return null;
  return String(maybe_encrypt_api_key(JSON.stringify(Object.fromEntries(entries))));
}

/**
 * Decrypt for use. A value that cannot be decrypted returns an empty map rather
 * than throwing: the caller then reports `unauthorized` and the user re-enters
 * the credential, which is the recoverable outcome. That is the same choice
 * synology.service.ts makes for a stale SID: a decryption failure after an
 * ENCRYPTION_KEY rotation must not turn into a boot-time crash.
 */
export function decryptSecrets(stored: string | null | undefined): SecretMap {
  if (!stored) return {};
  const plain = decrypt_api_key(stored);
  if (typeof plain !== 'string' || plain.length === 0) return {};
  try {
    const parsed: unknown = JSON.parse(plain);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: SecretMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Merge submitted form values over the stored ones.
 *
 * A secret field that arrives blank, absent, or as the mask keeps its stored
 * value. That rule is what lets the client render a connection form without
 * ever holding the secret it was given back, the same contract the photo
 * provider form and Dawarich already use, so the generic component needs no
 * special case here.
 *
 * A stored key that is no form field is a secret the provider earned itself
 * (DSM's device token). It is carried over untouched and cannot be set from
 * here: the form never saw it, so an edit can neither wipe it nor plant one.
 */
export function mergeSecrets(stored: SecretMap, submitted: Record<string, string>, secretKeys: readonly string[]): SecretMap {
  const next: SecretMap = { ...stored };
  for (const key of secretKeys) {
    const value = submitted[key];
    if (value === undefined) continue;
    if (value === '' || value === DOCSYNC_SECRET_MASK) continue;
    next[key] = value;
  }
  return next;
}

/**
 * What a client is allowed to see: whether a secret is set, never its value.
 * Form fields only, so a secret the provider earned itself is not even
 * reported as present.
 */
export function maskSecrets(secrets: SecretMap, secretKeys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of secretKeys) {
    if (secrets[key]) out[key] = DOCSYNC_SECRET_MASK;
  }
  return out;
}
