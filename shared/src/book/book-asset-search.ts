/**
 * The search `list_book_assets` runs over every catalogue it lists (stickers,
 * shapes, fonts, lockups, themes, patterns): every word of the query has to
 * be found, a word that is the id or one of the tags counts for more than one
 * buried in the description, and between equals the catalogue keeps its own
 * order. Case and accents do not matter.
 */

/** Lower case, accents taken off: how ids, tags and words are compared. */
const normAsset = (s: string): string => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** What an item of a catalogue is found by. */
export interface AssetKey {
  id: string;
  /** Every word it is found by: its id, its tags, its description. */
  words: readonly string[];
  tags: readonly string[];
}

/** How well an item answers the words of a query, 0 when one of them is not found. */
function score(key: AssetKey, words: readonly string[]): number {
  const hay = normAsset(key.words.join(' '));
  const id = normAsset(key.id);
  const tags = key.tags.map(normAsset);
  let total = 0;
  for (const w of words) {
    if (!hay.includes(w)) return 0;
    if (id === w || tags.includes(w)) total += 3;
    else if (tags.some((t) => t.split(' ').includes(w)) || id.startsWith(w)) total += 2;
    else total += 1;
  }
  return total;
}

/**
 * The items carrying every one of `tags` that answer `query`, best first,
 * the catalogue's own order between equals; all of them in that order
 * without a query.
 */
export function rankAssets<T>(
  pool: readonly T[],
  keyOf: (item: T) => AssetKey,
  query: string | undefined,
  tags: readonly string[] = [],
): T[] {
  const wanted = tags.map(normAsset);
  const tagged = pool.filter((item) => wanted.every((t) => keyOf(item).tags.map(normAsset).includes(t)));
  const words = normAsset(query ?? '')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return tagged;
  return tagged
    .map((item, i) => ({ item, i, n: score(keyOf(item), words) }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((r) => r.item);
}
