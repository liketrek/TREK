import {
  MASKED_SETTING_VALUE,
  storageSecretFields,
  type StorageBackend,
  type StorageBackendTypeId,
  type StorageConfig,
} from '@trek/shared';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { StorageBackendError } from './storage.types';

/**
 * Secret-field plumbing for admin-managed storage config (spec:
 * docs/superpowers/specs/2026-08-19-storage-admin-config-design.md). Secrets
 * live encrypted INSIDE the storage.backends JSON (the LLM addon-config
 * precedent), on exactly the fields the shared type registry marks `secret`.
 * Pure functions — the registry's seed import and the admin service share
 * them.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Map one backend's secret-field values; returns a new backend object. */
function mapSecrets(backend: StorageBackend, fn: (value: unknown, field: string) => unknown): StorageBackend {
  const fields = storageSecretFields(backend.type);
  if (fields.length === 0) return backend;
  const options: Record<string, unknown> = { ...backend.options };
  for (const field of fields) options[field] = fn(options[field], field);
  return { ...backend, options } as StorageBackend;
}

/**
 * No literal mask sentinel may ever become a stored value, in ANY option
 * field — not just the fields the type registry marks `secret`. Secret
 * fields are already covered structurally (`unmaskStorageConfig` throws
 * when a mask has no stored counterpart); this closes the same hole for a
 * mask sentinel submitted in a non-secret field, which would otherwise be
 * persisted verbatim as garbage-in. Also the seed-file guard: the seed file
 * has no mask round-trip, so a literal mask sentinel there is always a
 * mistake.
 */
export function assertNoMaskSentinels(config: StorageConfig): void {
  for (const backend of config.backends) {
    for (const field of Object.keys(backend.options as Record<string, unknown>)) {
      if ((backend.options as Record<string, unknown>)[field] === MASKED_SETTING_VALUE) {
        throw new StorageBackendError(
          `backend '${backend.name}' field '${field}' is the mask sentinel — a mask can never become a stored value`,
        );
      }
    }
  }
}

/** Encrypt every secret field (idempotent — enc:v1: values pass through unchanged). */
export function encryptStorageSecrets(config: StorageConfig): StorageConfig {
  return {
    ...config,
    backends: config.backends.map((backend) =>
      mapSecrets(backend, (value) =>
        typeof value === 'string' && value !== '' ? maybe_encrypt_api_key(value) : value,
      ),
    ),
  };
}

/**
 * Resolve mask echoes: a secret submitted as the mask is replaced by the
 * stored (still-encrypted) value for the same backend name. A mask with no
 * stored counterpart (rename, or a new backend) can never become a stored
 * value — callers turn this throw into the 400.
 */
export function unmaskStorageConfig(config: StorageConfig, storedBackends: unknown): StorageConfig {
  const stored = new Map<string, Record<string, unknown>>();
  if (Array.isArray(storedBackends)) {
    for (const entry of storedBackends) {
      if (isRecord(entry) && typeof entry.name === 'string' && isRecord(entry.options)) {
        stored.set(entry.name, entry.options);
      }
    }
  }
  return {
    ...config,
    backends: config.backends.map((backend) =>
      mapSecrets(backend, (value, field) => {
        if (value !== MASKED_SETTING_VALUE) return value;
        const storedValue = stored.get(backend.name)?.[field];
        if (typeof storedValue !== 'string' || storedValue === '') {
          throw new StorageBackendError(
            `re-enter the secret '${field}' for '${backend.name}' — a mask can never become a stored value (new or renamed backend)`,
          );
        }
        return storedValue;
      }),
    ),
  };
}

/** GET masking: secret fields always render as the sentinel, never a stored value. */
export function maskBackendOptions(
  type: StorageBackendTypeId,
  options: Record<string, string | number | string[]>,
): Record<string, string | number | string[]> {
  const masked = { ...options };
  for (const field of storageSecretFields(type)) masked[field] = MASKED_SETTING_VALUE;
  return masked;
}

/** Audit redaction: secret values become '***' (names and shapes survive). */
export function redactStorageSecrets(config: StorageConfig): StorageConfig {
  return {
    ...config,
    backends: config.backends.map((backend) => mapSecrets(backend, () => '***')),
  };
}

/** Decrypt secret fields for ephemeral use (test probes). Never persisted. */
export function decryptBackendSecrets(backend: StorageBackend): StorageBackend {
  return mapSecrets(backend, (value, field) => {
    if (typeof value !== 'string' || value === '') return value;
    const plain = decrypt_api_key(value);
    if (plain === null) {
      throw new StorageBackendError(
        `${backend.type} backend '${backend.name}': could not decrypt '${field}' — was ENCRYPTION_KEY changed or the row edited by hand?`,
      );
    }
    return plain;
  });
}
