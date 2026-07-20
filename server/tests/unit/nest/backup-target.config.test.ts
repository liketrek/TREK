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
        if (sql.includes('INSERT')) store.set(String(args[0]), String(args[1]));
      },
    }),
  },
}));

import {
  defaultLocalPath,
  isManagedByEnv,
  isS3Usable,
  normalizePrefix,
  readTargetForClient,
  resolveTarget,
  saveTarget,
} from '../../../src/nest/backup/backup-target.config';

const ENV = [
  'BACKUP_LOCAL_ENABLED', 'BACKUP_LOCAL_PATH',
  'BACKUP_S3_ENABLED', 'BACKUP_S3_ENDPOINT', 'BACKUP_S3_REGION', 'BACKUP_S3_BUCKET',
  'BACKUP_S3_PREFIX', 'BACKUP_S3_ACCESS_KEY_ID', 'BACKUP_S3_SECRET_ACCESS_KEY',
  'BACKUP_S3_FORCE_PATH_STYLE', 'BACKUP_S3_REQUIRE_TLS',
];

beforeEach(() => {
  store.clear();
  for (const k of ENV) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV) delete process.env[k];
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

describe('resolveTarget — defaults', () => {
  it('keeps the local backend on and S3 off on a fresh install', () => {
    // Opt-out vs opt-in: doing nothing must behave exactly as TREK always has.
    const cfg = resolveTarget();
    expect(cfg.localEnabled).toBe(true);
    expect(cfg.s3Enabled).toBe(false);
    expect(cfg.localPath).toBe(defaultLocalPath());
    expect(cfg.region).toBe('us-east-1');
    expect(cfg.requireTls).toBe(true); // secure default
    expect(cfg.forcePathStyle).toBe(false);
    expect(isS3Usable(cfg)).toBe(false);
  });

  it('substitutes the default path when the stored one is blank', () => {
    saveTarget({ local_path: '   ' });
    expect(resolveTarget().localPath).toBe(defaultLocalPath());
  });

  it('stores a blank path as blank so the default can move with the install', () => {
    saveTarget({ local_path: '' });
    expect(store.get('backup_local_path')).toBe('');
  });
});

describe('resolveTarget — stored settings', () => {
  it('round-trips both backends and decrypts the secret', () => {
    saveTarget({
      local_enabled: false,
      local_path: '/mnt/archive',
      s3_enabled: true,
      endpoint: 'https://s3.example.test',
      bucket: 'trek-backups',
      prefix: '/nightly/',
      access_key_id: 'AKIA',
      secret_access_key: 'super-secret',
      force_path_style: true,
    });

    const cfg = resolveTarget();
    expect(cfg.localEnabled).toBe(false);
    expect(cfg.localPath).toBe('/mnt/archive');
    expect(cfg.s3Enabled).toBe(true);
    expect(cfg.bucket).toBe('trek-backups');
    expect(cfg.prefix).toBe('nightly/');
    expect(cfg.secretAccessKey).toBe('super-secret');
    expect(cfg.forcePathStyle).toBe(true);
    expect(isS3Usable(cfg)).toBe(true);
  });

  it('lets both backends run at once', () => {
    // The whole point of independent flags: a 3-2-1 setup needs both.
    saveTarget({ local_enabled: true, s3_enabled: true, bucket: 'b', access_key_id: 'k', secret_access_key: 's' });
    const cfg = resolveTarget();
    expect(cfg.localEnabled).toBe(true);
    expect(cfg.s3Enabled).toBe(true);
  });

  it('stores the secret encrypted, never in plaintext', () => {
    saveTarget({ secret_access_key: 'super-secret' });
    expect(store.get('backup_s3_secret_access_key')).toBe('enc:v1:super-secret');
  });

  it('applies a partial patch without clearing untouched fields', () => {
    saveTarget({ bucket: 'a', access_key_id: 'k', secret_access_key: 's' });
    saveTarget({ s3_enabled: true });
    const cfg = resolveTarget();
    expect(cfg.bucket).toBe('a');
    expect(cfg.accessKeyId).toBe('k');
    expect(cfg.s3Enabled).toBe(true);
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

  it('reports the default path so the UI can show it', () => {
    expect(readTargetForClient().local_path_default).toBe(defaultLocalPath());
  });

  it('reports secret_access_key_set false when unset', () => {
    saveTarget({ bucket: 'b' });
    expect(readTargetForClient().secret_access_key_set).toBe(false);
  });
});

describe('resolveTarget — environment precedence', () => {
  it('is not env-managed until a BACKUP_* variable is set', () => {
    expect(isManagedByEnv()).toBe(false);
  });

  it('treats any BACKUP_* variable as taking over', () => {
    process.env.BACKUP_S3_BUCKET = 'from-env';
    expect(isManagedByEnv()).toBe(true);
    expect(readTargetForClient().managed_by_env).toBe(true);
  });

  it('lets the environment win over stored settings', () => {
    saveTarget({ s3_enabled: true, bucket: 'stored', access_key_id: 'sk', secret_access_key: 'ss' });
    process.env.BACKUP_S3_BUCKET = 'from-env';
    process.env.BACKUP_S3_ACCESS_KEY_ID = 'env-key';
    process.env.BACKUP_S3_SECRET_ACCESS_KEY = 'env-secret';

    const cfg = resolveTarget();
    expect(cfg.bucket).toBe('from-env');
    expect(cfg.accessKeyId).toBe('env-key');
    expect(cfg.secretAccessKey).toBe('env-secret');
  });

  it('keeps the local backend on even when S3 is configured through env', () => {
    // Configuring S3 is not a request to stop keeping backups on the machine.
    process.env.BACKUP_S3_BUCKET = 'b';
    expect(resolveTarget().localEnabled).toBe(true);
  });

  it('enables S3 implicitly when a bucket is given, explicitly otherwise', () => {
    process.env.BACKUP_S3_BUCKET = 'b';
    expect(resolveTarget().s3Enabled).toBe(true);
    process.env.BACKUP_S3_ENABLED = 'false';
    expect(resolveTarget().s3Enabled).toBe(false);
  });

  it('takes the local path and switch from the environment', () => {
    process.env.BACKUP_LOCAL_PATH = '/mnt/nas/trek';
    process.env.BACKUP_LOCAL_ENABLED = 'false';
    const cfg = resolveTarget();
    expect(cfg.localPath).toBe('/mnt/nas/trek');
    expect(cfg.localEnabled).toBe(false);
  });

  it('keeps require_tls on by default and honours an explicit opt-out', () => {
    process.env.BACKUP_S3_BUCKET = 'b';
    expect(resolveTarget().requireTls).toBe(true);
    process.env.BACKUP_S3_REQUIRE_TLS = 'false';
    expect(resolveTarget().requireTls).toBe(false);
  });
});
