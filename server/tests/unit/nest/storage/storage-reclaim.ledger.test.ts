/**
 * The reclaim ledger and the location check (#2924), plus the registry the
 * reference sources land in. Local roots are resolved through their symlinks,
 * so the layouts live in a temp folder. RCLL-001 to RCLL-013.
 */
import { StorageReclaimRegistryService } from '../../../../src/nest/storage/storage-reclaim-registry.service';
import {
  inReclaimScope,
  RECLAIM_LEDGER,
  reclaimableCategories,
  requiredReclaimSources,
  sharedLocationCategories,
  type CategoryAssignment,
  type ReclaimRule,
} from '../../../../src/nest/storage/storage-reclaim.ledger';
import {
  STORAGE_RECLAIMABLE_CATEGORIES,
  STORAGE_REFERENCE_SOURCE_IDS,
  type StorageReferenceSource,
} from '../../../../src/nest/storage/storage-reclaim.types';
import type { BackendSnapshot } from '../../../../src/nest/storage/storage-registry.service';
import { CATEGORY_PREFIXES } from '../../../../src/nest/storage/storage-registry.service';
import { SERVED_CATEGORIES, type ServedCategory } from '../../../../src/nest/storage/storage.types';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/nest/audit/audit-log.logger')>()),
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const ROOT = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'trek-reclaim-ledger-')));
/** A folder under the temp root, made if missing: a location is only resolved when its root exists. */
function dir(...parts: string[]): string {
  const target = path.join(ROOT, ...parts);
  fs.mkdirSync(target, { recursive: true });
  return target;
}
const UPLOADS = dir('uploads');
const BACKUPS = dir('backups');
for (const category of SERVED_CATEGORIES) dir('uploads', CATEGORY_PREFIXES[category]);

afterAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
});

function local(name: string, root: string): BackendSnapshot {
  return { name, type: 'local', source: 'settings', options: { root } };
}

/** The default layout: every served category on uploads-local, backups on its own backend. */
function defaults(overrides: Partial<Record<ServedCategory, CategoryAssignment>> = {}) {
  const map = new Map<ServedCategory, CategoryAssignment>();
  for (const category of SERVED_CATEGORIES) {
    map.set(category, { backendName: 'uploads-local', keyPrefix: CATEGORY_PREFIXES[category] });
  }
  map.set('backups', { backendName: 'backups-local', keyPrefix: '' });
  for (const [category, assignment] of Object.entries(overrides)) map.set(category as ServedCategory, assignment);
  return map;
}

const BASE_BACKENDS = [local('uploads-local', UPLOADS), local('backups-local', BACKUPS)];

describe('RECLAIM_LEDGER', () => {
  it('RCLL-001: reclaims exactly the five content categories and never a cache, the backups or legacy photos', () => {
    expect(reclaimableCategories().sort()).toEqual([...STORAGE_RECLAIMABLE_CATEGORIES].sort());
    for (const category of ['photos', 'photos-google', 'photos-trek', 'backups'] as const) {
      const rule: ReclaimRule = RECLAIM_LEDGER[category];
      expect(rule.reclaim).toBe(false);
      if (rule.reclaim === false) expect(rule.reason.length).toBeGreaterThan(10);
    }
  });

  it('RCLL-002: every reclaimable category waits for all the free-form owners, files and avatars for their own too', () => {
    const freeForm = ['trips', 'collections', 'places', 'place-contrib', 'journey', 'photos'];
    for (const category of STORAGE_RECLAIMABLE_CATEGORIES) {
      const rule = RECLAIM_LEDGER[category];
      expect(rule.reclaim).toBe(true);
      if (rule.reclaim) expect(rule.requiredSources).toEqual(expect.arrayContaining(freeForm));
    }
    const files = RECLAIM_LEDGER.files;
    const avatars = RECLAIM_LEDGER.avatars;
    expect(files.reclaim && files.requiredSources).toContain('files');
    expect(avatars.reclaim && avatars.requiredSources).toContain('auth');
    expect([...requiredReclaimSources()].sort()).toEqual([...STORAGE_REFERENCE_SOURCE_IDS].sort());
  });

  it('RCLL-003: only root-level keys are in scope', () => {
    expect(inReclaimScope('a.jpg')).toBe(true);
    expect(inReclaimScope('assistant/a.pdf')).toBe(false);
    expect(inReclaimScope('thumbs/x.jpg')).toBe(false);
    expect(inReclaimScope('')).toBe(false);
  });
});

describe('sharedLocationCategories', () => {
  it('RCLL-004: the default layout shares only the legacy photos folder, which holds both caches', () => {
    expect(sharedLocationCategories(defaults(), BASE_BACKENDS)).toEqual(new Set(['photos']));
  });

  it('RCLL-005: TREK_PLACE_PHOTO_DIR inside the uploads folder overlaps the category it lands in', () => {
    const backends = [...BASE_BACKENDS, local('place-photos-local', dir('uploads', 'places'))];
    const shared = sharedLocationCategories(
      defaults({ 'photos-google': { backendName: 'place-photos-local', keyPrefix: '' } }),
      backends,
    );
    expect(shared.has('places')).toBe(true);
    expect(shared.has('photos-google')).toBe(true);
    expect(shared.has('covers')).toBe(false);
  });

  it('RCLL-006: backups on the uploads backend sit at its root and contain everything, yet only backups is excluded', () => {
    const shared = sharedLocationCategories(defaults({ backups: { backendName: 'uploads-local', keyPrefix: '' } }), [
      local('uploads-local', UPLOADS),
    ]);
    expect(shared.has('backups')).toBe(true);
    expect(shared.has('covers')).toBe(false);
  });

  it('RCLL-007: two backends of other names on one folder overlap, however the root is spelled', () => {
    const backends = [...BASE_BACKENDS, local('again', `${path.join(UPLOADS, 'files', '..')}${path.sep}`)];
    const shared = sharedLocationCategories(
      defaults({ avatars: { backendName: 'again', keyPrefix: 'covers/' } }),
      backends,
    );
    expect(shared.has('covers')).toBe(true);
    expect(shared.has('avatars')).toBe(true);
    expect(shared.has('files')).toBe(false);
  });

  it('RCLL-008: two s3 backends on one bucket and key prefix overlap, a different key prefix does not', () => {
    const s3 = (name: string, keyPrefix: string): BackendSnapshot => ({
      name,
      type: 's3',
      source: 'settings',
      options: { endpoint: 'https://s3.example.com/', bucket: 'trek', keyPrefix },
    });
    const backends = [...BASE_BACKENDS, s3('a', '/prod/'), s3('b', 'prod'), s3('c', 'dev'), s3('d', '')];
    const shared = sharedLocationCategories(
      defaults({
        covers: { backendName: 'a', keyPrefix: 'covers/' },
        avatars: { backendName: 'b', keyPrefix: 'covers/' },
        places: { backendName: 'c', keyPrefix: 'places/' },
        files: { backendName: 'd', keyPrefix: 'files/' },
      }),
      backends,
    );
    expect(shared.has('covers')).toBe(true);
    expect(shared.has('avatars')).toBe(true);
    expect(shared.has('places')).toBe(false);
    expect(shared.has('files')).toBe(false);
  });

  it('RCLL-009: a mirror counts its primary and every replica; a replica inside another category excludes it', () => {
    const backends: BackendSnapshot[] = [
      ...BASE_BACKENDS,
      local('primary', dir('primary')),
      local('replica', dir('uploads', 'journey')),
      { name: 'm', type: 'mirror', source: 'settings', options: { primary: 'primary', replicas: ['replica'] } },
    ];
    const shared = sharedLocationCategories(defaults({ covers: { backendName: 'm', keyPrefix: 'covers/' } }), backends);
    // The replica's copy of covers lands at uploads/journey/covers/, inside journey's location.
    expect(shared.has('journey')).toBe(true);
    expect(shared.has('covers')).toBe(false);
  });

  it('RCLL-012: a place-photo folder reached through a symlink still overlaps the category it really is', () => {
    // The image links /app/server/uploads to /app/uploads; an operator names the latter.
    const linked = path.join(ROOT, 'linked-uploads');
    if (!fs.existsSync(linked)) fs.symlinkSync(UPLOADS, linked, 'junction');
    const backends = [...BASE_BACKENDS, local('place-photos-local', path.join(linked, 'places'))];
    const shared = sharedLocationCategories(
      defaults({ 'photos-google': { backendName: 'place-photos-local', keyPrefix: '' } }),
      backends,
    );
    expect(shared.has('places')).toBe(true);
    expect(shared.has('covers')).toBe(false);
  });

  it('RCLL-013: a local root that does not resolve reads as unknown, so shared', () => {
    const backends = [...BASE_BACKENDS, local('gone', path.join(ROOT, 'never-made'))];
    const shared = sharedLocationCategories(
      defaults({ covers: { backendName: 'gone', keyPrefix: 'covers/' } }),
      backends,
    );
    expect(shared.has('covers')).toBe(true);
    expect(shared.has('files')).toBe(true);
  });

  it('RCLL-010: a location that cannot be resolved fails closed, for itself and for every other category', () => {
    const backends: BackendSnapshot[] = [
      ...BASE_BACKENDS,
      { name: 'odd', type: 'local', source: 'settings', options: { root: '' } },
      { name: 'odd-s3', type: 's3', source: 'settings', options: { bucket: 'x' } },
      { name: 'odd-mirror', type: 'mirror', source: 'settings', options: { primary: 'gone', replicas: 'x' } },
    ];
    expect(
      sharedLocationCategories(defaults({ covers: { backendName: 'odd', keyPrefix: 'covers/' } }), backends).has(
        'files',
      ),
    ).toBe(true);
    for (const backendName of ['odd-s3', 'odd-mirror', 'missing']) {
      const shared = sharedLocationCategories(defaults({ covers: { backendName, keyPrefix: 'covers/' } }), backends);
      expect(shared.has('covers')).toBe(true);
    }
  });
});

describe('StorageReclaimRegistryService', () => {
  const source = (id: StorageReferenceSource['id']): StorageReferenceSource => ({
    id,
    claims: [{ category: 'covers', prefix: '' }],
    namedKeys: async () => new Set<string>(),
    referenced: async () => new Set<string>(),
  });

  it('RCLL-011: registers once per instance, keeps two sources of one id, and answers the ids', () => {
    const registry = new StorageReclaimRegistryService();
    const trips = source('trips');
    registry.register(trips);
    registry.register(trips);
    registry.register(source('trips'));
    registry.register(source('auth'));
    expect(registry.sources()).toHaveLength(3);
    expect(registry.ids()).toEqual(new Set(['trips', 'auth']));
  });
});
