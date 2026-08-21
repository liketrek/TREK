import {
  STORAGE_BACKEND_TYPES,
  STORAGE_BACKEND_TYPE_IDS,
  STORAGE_CATEGORIES,
  storageAdminStateSchema,
  storageBackfillStatusSchema,
  storageConfigSchema,
  storageSecretFields,
  storageUsageSchema,
  type StorageBackendTypeId,
} from './storage.schema';

import { describe, expect, it } from 'vitest';

/**
 * Per-type samples with EVERY declared field present. The parity suite pins
 * that these key sets and the generated schemas cannot drift from the field
 * definitions — the registry's whole extensibility story rests on that.
 */
const SAMPLES: Record<StorageBackendTypeId, Record<string, unknown>> = {
  local: { root: '/data/uploads' },
  s3: {
    endpoint: 'http://127.0.0.1:9000',
    bucket: 'trek',
    accessKeyId: 'ak',
    secretAccessKey: 'sk',
    region: 'auto',
    keyPrefix: 'trek/prod',
    retries: 0,
    timeoutMs: 5000,
  },
  mirror: { primary: 'backups-local', replicas: ['nas-backups'] },
};

describe('STORAGE_BACKEND_TYPES generation parity', () => {
  it.each(STORAGE_BACKEND_TYPE_IDS)('%s: sample keys equal the declared field keys exactly', (type) => {
    const declared = STORAGE_BACKEND_TYPES[type].fields.map((f) => f.key).sort();
    expect(Object.keys(SAMPLES[type]).sort()).toEqual(declared);
  });

  it.each(STORAGE_BACKEND_TYPE_IDS)('%s: every declared field round-trips through the generated schema', (type) => {
    const parsed = STORAGE_BACKEND_TYPES[type].optionsSchema.parse(SAMPLES[type]) as Record<string, unknown>;
    for (const field of STORAGE_BACKEND_TYPES[type].fields) {
      expect(parsed).toHaveProperty(field.key);
    }
  });

  it.each(STORAGE_BACKEND_TYPE_IDS)('%s: unknown option keys are rejected (strict at every level)', (type) => {
    const result = STORAGE_BACKEND_TYPES[type].optionsSchema.safeParse({ ...SAMPLES[type], rogue: 'x' });
    expect(result.success).toBe(false);
  });

  it('secret fields are required strings (the encrypt/mask machinery depends on it)', () => {
    expect(storageSecretFields('s3')).toEqual(['secretAccessKey']);
    expect(storageSecretFields('local')).toEqual([]);
    expect(storageSecretFields('mirror')).toEqual([]);
    for (const type of STORAGE_BACKEND_TYPE_IDS) {
      for (const field of STORAGE_BACKEND_TYPES[type].fields) {
        if (field.kind !== 'secret') continue;
        expect(field.required).toBe(true);
        const parsed = STORAGE_BACKEND_TYPES[type].optionsSchema.parse(SAMPLES[type]) as Record<string, unknown>;
        expect(typeof parsed[field.key]).toBe('string');
      }
    }
  });

  it('every non-required field carries a defaultValue, so parsed options are always total', () => {
    for (const type of STORAGE_BACKEND_TYPE_IDS) {
      for (const field of STORAGE_BACKEND_TYPES[type].fields) {
        if (!field.required) expect(field.defaultValue).toBeDefined();
      }
    }
  });

  it('defaults fill omitted optional s3 fields', () => {
    const parsed = STORAGE_BACKEND_TYPES.s3.optionsSchema.parse({
      endpoint: 'http://127.0.0.1:9000',
      bucket: 'trek',
      accessKeyId: 'ak',
      secretAccessKey: 'sk',
    });
    expect(parsed).toMatchObject({ region: 'us-east-1', keyPrefix: '', retries: 1, timeoutMs: 30000 });
  });

  it('field refinements layer onto the base kind (endpoint URL, non-negative retries, positive timeout)', () => {
    const base = SAMPLES.s3;
    expect(STORAGE_BACKEND_TYPES.s3.optionsSchema.safeParse({ ...base, endpoint: 'not a url' }).success).toBe(false);
    expect(STORAGE_BACKEND_TYPES.s3.optionsSchema.safeParse({ ...base, retries: -1 }).success).toBe(false);
    expect(STORAGE_BACKEND_TYPES.s3.optionsSchema.safeParse({ ...base, timeoutMs: 0 }).success).toBe(false);
  });
});

describe('storageConfigSchema wire compatibility', () => {
  it('accepts the hand-written S3-slice row shapes byte-for-byte', () => {
    // The exact local→NAS mirror example the S3 spec documents as raw SQL.
    const doc = {
      backends: [
        { name: 'nas-backups', type: 'local', options: { root: '/mnt/nas/trek-backups' } },
        { name: 'backup-mirror', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas-backups'] } },
      ],
      categories: { backups: 'backup-mirror' },
    };
    expect(storageConfigSchema.parse(doc)).toEqual(doc);
  });

  it('accepts a settings-declared s3 backend (the v2 acceptance this slice ships)', () => {
    const doc = {
      backends: [{ name: 'off-box', type: 's3', options: SAMPLES.s3 }],
      categories: { backups: 'off-box' },
    };
    expect(storageConfigSchema.safeParse(doc).success).toBe(true);
  });

  it('rejects the reserved readOnly top-level key — loud until a file-override mode is implemented', () => {
    const result = storageConfigSchema.safeParse({ backends: [], categories: {}, readOnly: true });
    expect(result.success).toBe(false);
  });

  it('rejects unknown categories, unknown types, empty names, and empty backend refs', () => {
    expect(storageConfigSchema.safeParse({ backends: [], categories: { nope: 'uploads-local' } }).success).toBe(false);
    expect(
      storageConfigSchema.safeParse({ backends: [{ name: 'x', type: 'ftp', options: {} }], categories: {} }).success,
    ).toBe(false);
    expect(
      storageConfigSchema.safeParse({
        backends: [{ name: '', type: 'local', options: { root: '/x' } }],
        categories: {},
      }).success,
    ).toBe(false);
    expect(storageConfigSchema.safeParse({ backends: [], categories: { backups: '' } }).success).toBe(false);
  });

  it('exposes the canonical eight-category list — photos is served-legacy, retired from config', () => {
    expect(STORAGE_CATEGORIES).toEqual([
      'files',
      'journey',
      'covers',
      'avatars',
      'places',
      'photos-google',
      'photos-trek',
      'backups',
    ]);
  });

  it('rejects the retired photos category in a config document', () => {
    const result = storageConfigSchema.safeParse({ backends: [], categories: { photos: 'uploads-local' } });
    expect(result.success).toBe(false);
  });
});

describe('backfill + usage wire shapes', () => {
  it('storageBackfillStatusSchema round-trips a running and a finished status', () => {
    const running = {
      backend: 'backups-local-mirror',
      status: 'running',
      done: 3,
      total: 10,
      copied: 2,
      skipped: 1,
      failed: 0,
      deleted: 1,
      startedAt: 1_700_000_000_000,
    };
    expect(storageBackfillStatusSchema.parse(running)).toEqual(running);
    const done = { ...running, status: 'done', done: 10, finishedAt: 1_700_000_100_000 };
    expect(storageBackfillStatusSchema.parse(done)).toEqual(done);
    expect(storageBackfillStatusSchema.safeParse({ ...running, status: 'paused' }).success).toBe(false);
  });

  it('storageUsageSchema carries all configurable categories plus the legacy photos bucket', () => {
    const perCategory = { objects: 1, bytes: 2 };
    const usage = {
      computedAt: 1_700_000_000_000,
      categories: Object.fromEntries(STORAGE_CATEGORIES.map((c) => [c, perCategory])),
      legacyPhotos: { objects: 0, bytes: 0 },
    };
    expect(storageUsageSchema.parse(usage)).toEqual(usage);
  });

  it('the admin state embeds usage (nullable) and backfills', () => {
    const stateShape = storageAdminStateSchema.pick({ usage: true, backfills: true });
    expect(stateShape.parse({ usage: null, backfills: [] })).toEqual({ usage: null, backfills: [] });
  });
});
