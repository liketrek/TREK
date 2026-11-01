import { SERVED_CATEGORIES, type ServedCategory } from './storage.types';

/**
 * The contract between the storage reclaim pass and the domains whose rows
 * name stored objects (#2924). Storage cannot read those rows itself: it may
 * import no domain that imports it, and it may not inject another domain's
 * repositories. So each owner registers a source with
 * `StorageReclaimRegistryService` and answers which keys its rows still name.
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
   * Every key of `category` the rows name, lowercased: one fresh read of the
   * whole column set, the question a pass asks right before it deletes. A row
   * that is trashed, pending or otherwise not gone counts. Throwing stops the
   * pass for the category; it never deletes on a failed answer.
   */
  namedKeys(category: ServedCategory): Promise<Set<string>>;
  /**
   * The same for several categories from one read, each the source claims
   * keyed in the answer: what a pass reads once and judges every category by.
   */
  namedKeysByCategory(categories: readonly ServedCategory[]): Promise<Map<ServedCategory, Set<string>>>;
  /**
   * Of these category-relative keys (as `StorageService.list` yields them), the
   * ones a row names right now, read narrowed to the rows that can name them:
   * the question the release queue asks before it deletes.
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
/** Where a key inside a longer text ends at the latest: a quote, markup or a line break. */
const TEXT_END = /["'<>\r\n]/;
const SUFFIX = /[?#]/;
const SERVED = new Set<string>(SERVED_CATEGORIES);

/**
 * Every `/uploads/<category>/<key>` in a value, wherever it stands: a path, an
 * absolute URL of this instance (`https://host/uploads/covers/x.jpg`), a leading
 * `uploads/` without the slash, several in one text. Each key is reported as it
 * stands and in its other readings: cut at a query or fragment, percent-decoded,
 * trimmed, cut at a blank. Reporting one key too many only keeps an object; one
 * too few would lose it, so the raw spelling is always among them.
 */
export function uploadKeysIn(value: string | null | undefined): StorageKeyRef[] {
  if (typeof value !== 'string' || value === '') return [];
  const matches = [...value.matchAll(UPLOADS_PATH)];
  return matches.flatMap((match, i) => {
    const start = match.index + match[0].length;
    const next = matches[i + 1];
    const tail = value.slice(start, next ? next.index : value.length);
    const end = tail.search(TEXT_END);
    const category = match[1].toLowerCase();
    return keyVariants(end === -1 ? tail : tail.slice(0, end)).map((key) => ({ category, key }));
  });
}

/**
 * Every object a stored value can name: the upload paths above, the relative
 * `<category>/<key>` spelling (`journeys.cover_image` holds `covers/x`), and
 * with `options` the bare or legacy-prefixed name of one category. A bare name
 * is the object's exact name (`uuid. #4711`, `uuid.pdf `), so it is reported
 * untouched first and in its other readings after. A value that names nothing
 * this way (an https URL elsewhere, a data: URL, garbage) answers an empty list:
 * it references nothing a pass can find.
 */
export function storageKeysIn(value: string | null | undefined, options: StorageKeyOptions = {}): StorageKeyRef[] {
  if (typeof value !== 'string' || value === '') return [];
  const refs = uploadKeysIn(value);
  for (const form of new Set([value, value.trim(), stripSuffix(value).trim()])) {
    const relative = /^\.?\/?([a-z0-9][a-z0-9-]*)\/(.+)$/is.exec(form);
    if (relative && SERVED.has(relative[1].toLowerCase())) {
      const category = relative[1].toLowerCase();
      for (const key of keyVariants(relative[2])) refs.push({ category, key });
    }
  }
  if (options.bare) {
    const bare = options.bare;
    if (!/[/\\:]/.test(value)) {
      for (const key of keyVariants(value)) refs.push({ category: bare, key });
    } else if (options.basename) {
      const last = value.slice(Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\')) + 1);
      for (const key of keyVariants(last)) refs.push({ category: bare, key });
    }
  }
  return refs;
}

/**
 * The keys of `category` any of `values` names, lowercased: a local volume on
 * Windows or macOS serves `A.jpg` for `a.jpg`, so an object is kept when a value
 * names it in either spelling. The helper a source builds its answers from, so
 * no source parses with a regex of its own.
 */
export function keysNamedIn(
  category: ServedCategory,
  values: Iterable<string | null | undefined>,
  options: StorageKeyOptions = {},
): Set<string> {
  const named = new Set<string>();
  for (const value of values) {
    for (const ref of storageKeysIn(value, options)) {
      if (ref.category === category) named.add(ref.key.toLowerCase());
    }
  }
  return named;
}

/**
 * The longest run of plain characters in a key (`[a-z0-9-]`, the random part
 * of every name TREK writes): a row that names the key in any spelling holds
 * this run verbatim, so a `LIKE '%run%'` finds every row worth parsing. Null
 * when the key has no run long enough to narrow anything.
 */
export function keySearchCore(key: string): string | null {
  const runs: string[] = key.toLowerCase().match(/[a-z0-9-]+/g) ?? [];
  const longest = runs.reduce<string>((best, run) => (run.length > best.length ? run : best), '');
  return longest.length >= 8 ? longest : null;
}

/**
 * The marker object a pass keeps at the root of each category it judges,
 * naming this installation (`trek-owner-<install id>`). A second TREK
 * installation that keeps its uploads in the same place writes its own, and
 * from then on neither deletes there.
 */
const OWNER_MARKER_PREFIX = 'trek-owner-';
const OWNER_MARKER = /^trek-owner-([a-z0-9-]{8,64})$/;

export function storageOwnerMarkerKey(installId: string): string {
  return `${OWNER_MARKER_PREFIX}${installId}`;
}

/** The install id an owner marker names, or null for any other key. Backups leave markers out. */
export function storageOwnerMarkerInstall(key: string): string | null {
  return OWNER_MARKER.exec(key)?.[1] ?? null;
}

function stripSuffix(value: string): string {
  const cut = value.search(SUFFIX);
  return cut === -1 ? value : value.slice(0, cut);
}

/** The raw key and its other readings; never an empty one. */
function keyVariants(raw: string): string[] {
  const forms = new Set<string>();
  const add = (key: string) => {
    if (key.trim() === '') return;
    forms.add(key);
    const unslashed = key.replace(/^\/+/, '');
    if (unslashed.trim() !== '') forms.add(unslashed);
  };
  const stripped = stripSuffix(raw);
  for (const form of [raw, stripped, decoded(raw), decoded(stripped)]) {
    add(form);
    add(form.trim());
    add(form.trim().split(/\s/)[0] ?? '');
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
