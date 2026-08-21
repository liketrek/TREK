import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../../src/config', () => ({ ENCRYPTION_KEY: 'storage-secrets-test-key' }));

import { MASKED_SETTING_VALUE, type StorageConfig } from '@trek/shared';
import {
  decrypt_api_key,
  encrypt_api_key,
} from '../../../../src/nest/common/crypto/apiKeyCrypto';
import {
  assertNoMaskSentinels,
  decryptBackendSecrets,
  encryptStorageSecrets,
  maskBackendOptions,
  redactStorageSecrets,
  unmaskStorageConfig,
} from '../../../../src/nest/storage/storage-secrets';

const S3_OPTIONS = {
  endpoint: 'http://127.0.0.1:9000',
  bucket: 'trek',
  accessKeyId: 'ak',
  secretAccessKey: 'sk-plain',
  region: 'us-east-1',
  keyPrefix: '',
  retries: 1,
  timeoutMs: 30000,
};

function s3Config(secretAccessKey: string): StorageConfig {
  return {
    backends: [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, secretAccessKey } }],
    categories: { backups: 'off-box' },
  };
}
const LOCAL_ONLY: StorageConfig = {
  backends: [{ name: 'nas', type: 'local', options: { root: '/mnt/nas' } }],
  categories: {},
};


describe('encryptStorageSecrets', () => {
  it('encrypts plaintext secrets and round-trips through decrypt', () => {
    const out = encryptStorageSecrets(s3Config('sk-plain'));
    const stored = (out.backends[0]!.options as Record<string, unknown>).secretAccessKey as string;
    expect(stored.startsWith('enc:v1:')).toBe(true);
    expect(decrypt_api_key(stored)).toBe('sk-plain');
  });

  it('is idempotent — an enc:v1: value passes through byte-for-byte', () => {
    const cipher = encrypt_api_key('sk');
    const out = encryptStorageSecrets(s3Config(cipher));
    expect((out.backends[0]!.options as Record<string, unknown>).secretAccessKey).toBe(cipher);
  });

  it('does not mutate its input', () => {
    const input = s3Config('sk-plain');
    void encryptStorageSecrets(input);
    expect((input.backends[0]!.options as Record<string, unknown>).secretAccessKey).toBe('sk-plain');
  });
});

describe('unmaskStorageConfig', () => {
  it('replaces a mask echo with the stored ciphertext byte-for-byte', () => {
    const cipher = encrypt_api_key('sk');
    const stored = [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, secretAccessKey: cipher } }];
    const out = unmaskStorageConfig(s3Config(MASKED_SETTING_VALUE), stored);
    expect((out.backends[0]!.options as Record<string, unknown>).secretAccessKey).toBe(cipher);
  });

  it('throws for a mask with no stored counterpart (rename or new backend)', () => {
    expect(() => unmaskStorageConfig(s3Config(MASKED_SETTING_VALUE), [])).toThrow(
      "re-enter the secret 'secretAccessKey' for 'off-box'",
    );
    const renamed = [{ name: 'old-name', type: 's3', options: { ...S3_OPTIONS, secretAccessKey: encrypt_api_key('sk') } }];
    expect(() => unmaskStorageConfig(s3Config(MASKED_SETTING_VALUE), renamed)).toThrow(
      "re-enter the secret 'secretAccessKey' for 'off-box'",
    );
  });

  it('leaves non-mask values and secretless backends untouched, and tolerates a garbage stored row', () => {
    expect(unmaskStorageConfig(s3Config('sk-new'), 'not-an-array')).toEqual(s3Config('sk-new'));
    expect(unmaskStorageConfig(LOCAL_ONLY, undefined)).toEqual(LOCAL_ONLY);
  });
});

describe('assertNoMaskSentinels', () => {
  it('throws when a seed-style config carries the mask sentinel in a secret field', () => {
    expect(() => assertNoMaskSentinels(s3Config(MASKED_SETTING_VALUE))).toThrow('mask');
    expect(() => assertNoMaskSentinels(s3Config('sk'))).not.toThrow();
  });

  it('throws for a mask sentinel in a NON-secret field too — the check is all-field, not secret-only', () => {
    const config: StorageConfig = {
      backends: [{ name: 'off-box', type: 's3', options: { ...S3_OPTIONS, accessKeyId: MASKED_SETTING_VALUE } }],
      categories: {},
    };
    expect(() => assertNoMaskSentinels(config)).toThrow(
      "backend 'off-box' field 'accessKeyId' is the mask sentinel — a mask can never become a stored value",
    );
  });
});

describe('decryptBackendSecrets', () => {
  it('decrypts enc:v1: secrets, passes plaintext through, throws on tampered ciphertext', () => {
    const encrypted = s3Config(encrypt_api_key('sk-secret')).backends[0]!;
    expect((decryptBackendSecrets(encrypted).options as Record<string, unknown>).secretAccessKey).toBe('sk-secret');
    const plain = s3Config('sk-plain').backends[0]!;
    expect((decryptBackendSecrets(plain).options as Record<string, unknown>).secretAccessKey).toBe('sk-plain');
    expect(() => decryptBackendSecrets(s3Config('enc:v1:AAAA').backends[0]!)).toThrow(
      "could not decrypt 'secretAccessKey'",
    );
  });
});

describe('maskBackendOptions / redactStorageSecrets', () => {
  it('masks exactly the secret fields on GET-shaped options', () => {
    const masked = maskBackendOptions('s3', { ...S3_OPTIONS });
    expect(masked.secretAccessKey).toBe(MASKED_SETTING_VALUE);
    expect(masked.accessKeyId).toBe('ak'); // never over-masked
    expect(maskBackendOptions('local', { root: '/x' })).toEqual({ root: '/x' });
  });

  it('redacts secrets to *** for audit details', () => {
    const out = redactStorageSecrets(s3Config('sk-plain'));
    expect((out.backends[0]!.options as Record<string, unknown>).secretAccessKey).toBe('***');
    expect((out.backends[0]!.options as Record<string, unknown>).accessKeyId).toBe('ak');
  });
});
