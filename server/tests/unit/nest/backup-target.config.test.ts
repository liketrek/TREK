import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Deterministic stand-in for apiKeyCrypto so these tests assert THIS module's
// masking/precedence logic rather than re-testing AES-GCM. The prefix mirrors
// the real `enc:v1:` marker, including its legacy-plaintext passthrough.
vi.mock('../../../src/services/apiKeyCrypto', () => ({
  maybe_encrypt_api_key: (v: unknown) => {
    const s = String(v ?? '').trim();
    return s === '' ? null : s.startsWith('enc:v1:') ? s : `enc:v1:${s}`;
  },
  decrypt_api_key: (v: unknown) => {
    if (!v || typeof v !== 'string') return null;
    return v.startsWith('enc:v1:') ? v.slice('enc:v1:'.length) : v;
  },
}));

const store = new Map<string, string>();
vi.mock('../../../src/db/database', () => ({
  db: {
    prepare: (sql: string) => ({
      get: (key: string) => (store.has(key) ? { value: store.get(key) } : undefined),
      run: (...args: unknown[]) => {
        // INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
        if (sql.includes('INSERT')) store.set(String(args[0]), String(args[1]));
      },
    }),
  },
}));

import {
  isManagedByEnv,
  isTargetUsable,
  normalizePrefix,
  readTargetForClient,
  resolveTarget,
  saveTarget,
} from '../../../src/nest/backup/backup-target.config';

const S3_ENV = [
  'BACKUP_TARGET_TYPE', 'BACKUP_LOCAL_PATH',
  'BACKUP_S3_ENDPOINT', 'BACKUP_S3_REGION', 'BACKUP_S3_BUCKET',
  'BACKUP_S3_PREFIX', 'BACKUP_S3_ACCESS_KEY_ID', 'BACKUP_S3_SECRET_ACCESS_KEY',
  'BACKUP_S3_FORCE_PATH_STYLE', 'BACKUP_S3_REQUIRE_TLS',
];

beforeEach(() => {
  store.clear();
  for (const k of S3_ENV) delete process.env[k];
});
afterEach(() => {
  for (const k of S3_ENV) delete process.env[k];
});

describe('normalizePrefix', () => {
  it('collapses to bare `dir/` form and leaves an empty prefix empty', () => {
    expect(normalizePrefix('')).toBe('');
    expect(normalizePrefix('   ')).toBe('');
    expect(normalizePrefix('trek')).toBe('trek/');
    expect(normalizePrefix('/trek/')).toBe('trek/');
    expect(normalizePrefix('///a/b///')).toBe('a/b/');
  });
});

describe('resolveTarget — stored settings', () => {
  it('defaults to a disabled, empty target on a fresh install', () => {
    const cfg = resolveTarget();
    expect(cfg.type).toBe('none');
    expect(cfg.bucket).toBe('');
    expect(cfg.region).toBe('us-east-1');
    expect(cfg.requireTls).toBe(true); // secure default
    expect(cfg.forcePathStyle).toBe(false);
    expect(isTargetUsable(cfg)).toBe(false);
  });

  it('round-trips a saved target and decrypts the secret', () => {
    saveTarget({
      type: 's3',
      endpoint: 'https://s3.example.test',
      bucket: 'trek-backups',
      prefix: '/nightly/',
      access_key_id: 'AKIA',
      secret_access_key: 'super-secret',
      force_path_style: true,
    });

    const cfg = resolveTarget();
    expect(cfg.type).toBe('s3');
    expect(cfg.bucket).toBe('trek-backups');
    expect(cfg.prefix).toBe('nightly/');
    expect(cfg.secretAccessKey).toBe('super-secret');
    expect(cfg.forcePathStyle).toBe(true);
    expect(isTargetUsable(cfg)).toBe(true);
  });

  it('stores the secret encrypted, never in plaintext', () => {
    saveTarget({ secret_access_key: 'super-secret' });
    expect(store.get('backup_s3_secret_access_key')).toBe('enc:v1:super-secret');
  });

  it('applies a partial patch without clearing untouched fields', () => {
    saveTarget({ bucket: 'a', access_key_id: 'k', secret_access_key: 's' });
    saveTarget({ type: 's3' });
    const cfg = resolveTarget();
    expect(cfg.bucket).toBe('a');
    expect(cfg.accessKeyId).toBe('k');
    expect(cfg.type).toBe('s3');
  });
});

describe('saveTarget — masked secret round-trip', () => {
  it('keeps the stored secret when the client echoes the mask back', () => {
    saveTarget({ secret_access_key: 'original' });
    // This is what a read hands the UI; saving the unedited form returns it.
    saveTarget({ bucket: 'b', secret_access_key: '••••••••' });
    expect(resolveTarget().secretAccessKey).toBe('original');
    expect(resolveTarget().bucket).toBe('b');
  });

  it('clears the secret on an explicit empty string', () => {
    saveTarget({ secret_access_key: 'original' });
    saveTarget({ secret_access_key: '' });
    expect(resolveTarget().secretAccessKey).toBe('');
  });
});

describe('readTargetForClient', () => {
  it('never returns the secret, only whether one is set', () => {
    saveTarget({ bucket: 'b', access_key_id: 'k', secret_access_key: 'do-not-leak' });
    const view = readTargetForClient();
    expect(view.secret_access_key_set).toBe(true);
    expect(JSON.stringify(view)).not.toContain('do-not-leak');
  });

  it('reports secret_access_key_set false when unset', () => {
    saveTarget({ bucket: 'b' });
    expect(readTargetForClient().secret_access_key_set).toBe(false);
  });
});

describe('resolveTarget — environment precedence', () => {
  it('is not env-managed until BACKUP_TARGET_TYPE is set', () => {
    process.env.BACKUP_S3_REGION = 'eu-central-1';
    process.env.BACKUP_S3_BUCKET = 'b';
    expect(isManagedByEnv()).toBe(false);
  });

  it('ignores an unknown type rather than half-applying it', () => {
    process.env.BACKUP_TARGET_TYPE = 'ftp';
    expect(isManagedByEnv()).toBe(false);
    expect(resolveTarget().type).toBe('none');
  });

  it('lets the environment win over stored settings', () => {
    saveTarget({ type: 's3', bucket: 'stored', access_key_id: 'sk', secret_access_key: 'ss' });
    process.env.BACKUP_TARGET_TYPE = 's3';
    process.env.BACKUP_S3_BUCKET = 'from-env';
    process.env.BACKUP_S3_ACCESS_KEY_ID = 'env-key';
    process.env.BACKUP_S3_SECRET_ACCESS_KEY = 'env-secret';

    const cfg = resolveTarget();
    expect(isManagedByEnv()).toBe(true);
    expect(cfg.bucket).toBe('from-env');
    expect(cfg.accessKeyId).toBe('env-key');
    expect(cfg.secretAccessKey).toBe('env-secret');
    expect(readTargetForClient().managed_by_env).toBe(true);
  });

  it('configures the local backend from the environment too', () => {
    process.env.BACKUP_TARGET_TYPE = 'local';
    process.env.BACKUP_LOCAL_PATH = '/mnt/nas/trek';
    const cfg = resolveTarget();
    expect(cfg.type).toBe('local');
    expect(cfg.localPath).toBe('/mnt/nas/trek');
  });

  it('accepts the type case-insensitively', () => {
    process.env.BACKUP_TARGET_TYPE = 'S3';
    expect(resolveTarget().type).toBe('s3');
  });

  it('keeps require_tls on by default and honours an explicit opt-out', () => {
    process.env.BACKUP_TARGET_TYPE = 's3';
    expect(resolveTarget().requireTls).toBe(true);
    process.env.BACKUP_S3_REQUIRE_TLS = 'false';
    expect(resolveTarget().requireTls).toBe(false);
  });
});
