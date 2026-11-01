import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';

/**
 * The contract between the storage reclaim pass and the domains whose rows
 * name stored objects (#2924). Storage cannot read those rows itself: it may
 * import no domain that imports it, and it may not inject another domain's
 * repositories. So each owner registers a source with
 * `StorageReclaimRegistryService` and answers, for a page of keys, which of
 * them its rows still name.
 *
 * The ids are a closed list: the ledger in storage names, per category, which
 * of them must have answered before a single object of that category may be
 * called unreferenced.
 */
export const STORAGE_REFERENCE_SOURCE_IDS = [
  'trips',
  'collections',
  'places',
  'place-contrib',
  'journey',
  'photos',
  'files',
  'auth',
] as const;
export type StorageReferenceSourceId = (typeof STORAGE_REFERENCE_SOURCE_IDS)[number];

/**
 * The categories a pass may delete from, at their root level only (the
 * `files/assistant/` and `journey/thumbs/` subtrees have sweeps of their own).
 * A source whose columns hold free-form upload paths (a cover, an image url,
 * a photo path) claims all of them, since such a value can point anywhere.
 */
export const STORAGE_RECLAIMABLE_CATEGORIES = ['files', 'journey', 'covers', 'avatars', 'places'] as const;
export type StorageReclaimableCategory = (typeof STORAGE_RECLAIMABLE_CATEGORIES)[number];

/** A part of a category a source answers for: the keys starting with `prefix` ('' is the whole category). */
export interface StorageReferenceClaim {
  readonly category: ServedCategory;
  readonly prefix: string;
}

/** What a source whose columns hold free-form upload paths claims: the whole of every reclaimable category. */
export const EVERY_RECLAIMABLE_CATEGORY: readonly StorageReferenceClaim[] = STORAGE_RECLAIMABLE_CATEGORIES.map(
  (category) => ({ category, prefix: '' }),
);

export interface StorageReferenceSource {
  readonly id: StorageReferenceSourceId;
  /**
   * Every category the source's columns can point into, not only the one they
   * usually do: a trip cover may name `/uploads/places/x`, and that object
   * must stay. A source asked about a category it does not claim is not asked.
   */
  readonly claims: ReadonlyArray<StorageReferenceClaim>;
  /**
   * Of these category-relative keys (as `StorageService.list` yields them, at
   * most a page of 500), the ones a row still names. A row that is trashed,
   * pending or otherwise not gone counts. Throwing stops the pass for the
   * category; it never deletes on a failed answer.
   */
  referenced(category: ServedCategory, keys: readonly string[]): Promise<Set<string>>;
}

/** One object a stored value names. */
export interface StorageKeyRef {
  category: string;
  key: string;
}

/** What a column's value can mean besides the `/uploads/<category>/<key>` and `<category>/<key>` spellings. */
export interface StorageKeyOptions {
  /** The column holds a bare name of this category (`users.avatar`, `trip_files.filename`). */
  bare?: ServedCategory;
  /** Legacy rows may carry any path before the name; the last segment names an object of `bare` too. */
  basename?: boolean;
}

const UPLOADS_PATH = /(?:^|\/)uploads\/([a-z0-9][a-z0-9-]*)\//gi;
const KEY_END = /[?#"'<>\r\n]/;
const SERVED = new Set<string>(SERVED_CATEGORIES);

/**
 * Every `/uploads/<category>/<key>` in a value, wherever it stands: a path, an
 * absolute URL of this instance (`https://host/uploads/covers/x.jpg`), a leading
 * `uploads/` without the slash, several in one text. A query or a fragment is
 * dropped, the key is percent-decoded and trimmed. A key with a blank in it is
 * reported both whole and cut at the blank, since a value may be a sentence:
 * reporting one key too many only keeps an object, one too few would lose it.
 */
export function uploadKeysIn(value: string | null | undefined): StorageKeyRef[] {
  if (typeof value !== 'string' || value === '') return [];
  const matches = [...value.matchAll(UPLOADS_PATH)];
  return matches.flatMap((match, i) => {
    const start = match.index + match[0].length;
    const next = matches[i + 1];
    const tail = value.slice(start, next ? next.index : value.length);
    const end = tail.search(KEY_END);
    const category = match[1]!.toLowerCase();
    return keyVariants(end === -1 ? tail : tail.slice(0, end)).map((key) => ({ category, key }));
  });
}

/**
 * Every object a stored value can name: the upload paths above, the relative
 * `<category>/<key>` spelling (`journeys.cover_image` holds `covers/x`), and
 * with `options` the bare or legacy-prefixed name of one category. A value
 * that names nothing this way (an https URL elsewhere, a data: URL, garbage)
 * answers an empty list: it references nothing a pass can find.
 */
export function storageKeysIn(value: string | null | undefined, options: StorageKeyOptions = {}): StorageKeyRef[] {
  if (typeof value !== 'string') return [];
  const trimmed = stripSuffix(value).trim();
  if (trimmed === '') return [];
  const refs = uploadKeysIn(value);
  const relative = /^\.?\/?([a-z0-9][a-z0-9-]*)\/(.+)$/i.exec(trimmed);
  if (relative && SERVED.has(relative[1]!.toLowerCase())) {
    const category = relative[1]!.toLowerCase();
    for (const key of keyVariants(relative[2]!)) refs.push({ category, key });
  }
  if (options.bare) {
    const bare = options.bare;
    if (!/[/\\:]/.test(trimmed)) {
      for (const key of keyVariants(trimmed)) refs.push({ category: bare, key });
    } else if (options.basename) {
      const last = trimmed.slice(Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\')) + 1);
      for (const key of keyVariants(last)) refs.push({ category: bare, key });
    }
  }
  return refs;
}

/**
 * The candidates of `category` that any of `values` names, compared without
 * regard to case: a local volume on Windows or macOS serves `A.jpg` for `a.jpg`,
 * so an object is kept when a value names it in either spelling. The helper a
 * source builds `referenced()` from, so no source parses with a regex of its own.
 */
export function referencedAmong(
  category: ServedCategory,
  candidates: readonly string[],
  values: Iterable<string | null | undefined>,
  options: StorageKeyOptions = {},
): Set<string> {
  const named = new Set<string>();
  for (const value of values) {
    for (const ref of storageKeysIn(value, options)) {
      if (ref.category === category) named.add(ref.key.toLowerCase());
    }
  }
  return new Set(candidates.filter((key) => named.has(key.toLowerCase())));
}

function stripSuffix(value: string): string {
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
}

/** The raw key, decoded, and cut at a blank; never an empty key or one that climbs out of its category. */
function keyVariants(raw: string): string[] {
  const forms = new Set<string>();
  const add = (key: string) => {
    const clean = key.trim().replace(/^\/+/, '');
    if (clean === '' || clean.split('/').some((segment) => segment === '..' || segment === '.')) return;
    forms.add(clean);
  };
  const whole = stripSuffix(raw);
  for (const form of [whole, decoded(whole)]) {
    add(form);
    add(form.trim().split(/\s/)[0]!);
  }
  return [...forms];
}

function decoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
