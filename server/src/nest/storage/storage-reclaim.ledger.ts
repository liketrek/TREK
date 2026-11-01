import type { StorageReclaimableCategory, StorageReferenceSourceId } from './storage-reclaim.types';
import type { BackendSnapshot } from './storage-registry.service';
import type { ServedCategory } from './storage.types';

import path from 'node:path';

export type ReclaimRule =
  | { readonly reclaim: false; readonly reason: string }
  | { readonly reclaim: true; readonly requiredSources: readonly StorageReferenceSourceId[] };

/** The owners of columns that hold a free-form upload path, which can point into any category. */
const FREE_FORM_SOURCES: readonly StorageReferenceSourceId[] = [
  'trips',
  'collections',
  'places',
  'place-contrib',
  'journey',
  'photos',
];

/**
 * What the reclaim pass may do per category, and which reference sources must
 * have registered before it may call one object of it unreferenced. A Record,
 * so a new category does not compile until it is decided here (the
 * KEPT_ON_DEMO precedent). A category missing one of its sources is skipped,
 * never swept on a partial answer.
 */
export const RECLAIM_LEDGER: Readonly<Record<ServedCategory, ReclaimRule>> = {
  // trip_files.filename (trashed rows included) holds the bare name; collab
  // note files, chat images and doc-sync copies are trip_files rows too.
  files: { reclaim: true, requiredSources: ['files', ...FREE_FORM_SOURCES] },
  // trek_photos.file_path and thumbnail_path (posters), journeys.cover_image.
  journey: { reclaim: true, requiredSources: FREE_FORM_SOURCES },
  // Trip, collection and journey covers; a trip copy and a journey share one object.
  covers: { reclaim: true, requiredSources: FREE_FORM_SOURCES },
  avatars: { reclaim: true, requiredSources: ['auth', ...FREE_FORM_SOURCES] },
  // places.image_url, collection_places.image_url and the contribution outbox
  // (place-contrib's queue holds an image path until it is sent).
  places: { reclaim: true, requiredSources: FREE_FORM_SOURCES },
  photos: {
    reclaim: false,
    reason:
      'the legacy photo folder is served to every signed-in user by name, holds the place-photo caches in its ' +
      'google/ and trek/ subtrees, and nothing writes to it any more',
  },
  'photos-google': { reclaim: false, reason: 'a cache the place-photo sweep keeps against its meta rows' },
  'photos-trek': { reclaim: false, reason: 'a cache with a one-hour lifetime and a sweep of its own' },
  backups: { reclaim: false, reason: 'no row names a backup; auto-backup rotates them by name' },
};

/** Every source id some category of the ledger waits for: what a full app must register. */
export function requiredReclaimSources(): Set<StorageReferenceSourceId> {
  const ids = new Set<StorageReferenceSourceId>();
  for (const rule of Object.values(RECLAIM_LEDGER)) {
    if (rule.reclaim) for (const id of rule.requiredSources) ids.add(id);
  }
  return ids;
}

/** The categories the ledger lets a pass delete from. */
export function reclaimableCategories(): StorageReclaimableCategory[] {
  return (Object.keys(RECLAIM_LEDGER) as ServedCategory[]).filter(
    (category): category is StorageReclaimableCategory => RECLAIM_LEDGER[category].reclaim,
  );
}

/**
 * Only the root level of a category is swept: `files/assistant/` belongs to the
 * assistant's retention, `journey/thumbs/` to the thumbnail sweep, and a nested
 * key elsewhere was not written by TREK.
 */
export function inReclaimScope(key: string): boolean {
  return key !== '' && !key.includes('/');
}

export interface CategoryAssignment {
  backendName: string;
  keyPrefix: string;
}

/**
 * The categories whose objects may sit where another category's do, decided
 * from the RESOLVED backends rather than their names: two backends can share a
 * root or a bucket, `TREK_PLACE_PHOTO_DIR` can point inside the uploads folder,
 * the legacy `photos/` folder holds the two photo caches, and `backups` on a
 * shared backend is that backend's whole root. A category is excluded when its
 * location, or a mirror member's copy of it, contains another category's (equal
 * counts), or when a location cannot be resolved at all.
 */
export function sharedLocationCategories(
  assignments: ReadonlyMap<ServedCategory, CategoryAssignment>,
  backends: readonly BackendSnapshot[],
): Set<ServedCategory> {
  const byName = new Map(backends.map((backend) => [backend.name, backend]));
  const locations = new Map<ServedCategory, string[] | null>();
  for (const [category, assignment] of assignments) {
    locations.set(category, locationsOf(assignment, byName));
  }
  const shared = new Set<ServedCategory>();
  for (const [category, own] of locations) {
    if (own === null) {
      shared.add(category);
      continue;
    }
    for (const [other, theirs] of locations) {
      if (other === category) continue;
      if (theirs === null || theirs.some((location) => own.some((mine) => location.startsWith(mine)))) {
        shared.add(category);
        break;
      }
    }
  }
  return shared;
}

function locationsOf(assignment: CategoryAssignment, backends: ReadonlyMap<string, BackendSnapshot>): string[] | null {
  const backend = backends.get(assignment.backendName);
  if (!backend) return null;
  const members =
    backend.type === 'mirror'
      ? [backend.options.primary, ...asList(backend.options.replicas)].map((name) => backends.get(String(name)))
      : [backend];
  const bases: string[] = [];
  for (const member of members) {
    const base = member ? baseOf(member) : null;
    if (base === null) return null;
    bases.push(base);
  }
  return bases.map((base) => base + assignment.keyPrefix.toLowerCase());
}

/**
 * Where a backend keeps its objects, lowercased: comparing more paths as equal
 * than the volume does only excludes more, never less.
 */
function baseOf(backend: BackendSnapshot): string | null {
  const { options } = backend;
  if (backend.type === 'local') {
    if (typeof options.root !== 'string' || options.root === '') return null;
    return `local:${trimSlashes(path.resolve(options.root).replace(/\\/g, '/'))}/`.toLowerCase();
  }
  if (backend.type === 's3') {
    if (typeof options.endpoint !== 'string' || typeof options.bucket !== 'string') return null;
    const keyPrefix = typeof options.keyPrefix === 'string' ? trimSlashes(options.keyPrefix) : '';
    const base = `s3:${trimSlashes(options.endpoint)}/${options.bucket}/`;
    return (keyPrefix === '' ? base : `${base}${keyPrefix}/`).toLowerCase();
  }
  return null;
}

function asList(value: string | number | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function trimSlashes(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === '/') start += 1;
  while (end > start && value[end - 1] === '/') end -= 1;
  return value.slice(start, end);
}
