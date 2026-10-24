/**
 * Which encyclopaedia entry, Wikidata item and Commons category describe a
 * place, read off its OpenStreetMap tags.
 *
 * Shared by the OSM client (a Nominatim hit carries the tags in `extratags`)
 * and the enrichment column (which follows them to Wikimedia), so it lives
 * apart from both.
 */

/**
 * The keys that say which encyclopaedia entry, Wikidata item and Commons
 * category describe a place. Everything the enrichment column shows beyond
 * coordinates hangs off one of these.
 *
 * Bare keys only. OSM also carries `brand:wikidata` / `brand:wikipedia`, and
 * following those means a branch of a chain gets the chain's article and the
 * chain's logo — for "L'Osteria Rostock" you would confidently describe
 * L'Osteria the company. That is the exact failure the tag-only rule was
 * written to avoid, so do not "improve" this by falling back to brand:*.
 */
const WIKI_IDENTITY_TAGS = ['wikipedia', 'wikidata', 'wikimedia_commons'] as const;

export interface WikiIdentity {
  wikipedia: string | null;
  wikidata: string | null;
  wikimedia_commons: string | null;
}

/**
 * The chain a place belongs to, when it belongs to one.
 *
 * Read separately from `readWikiIdentity` and never mixed into it. Following
 * `brand:wikidata` as if it described the place is how "L'Osteria Rostock"
 * ends up illustrated with the company logo and described as a franchise
 * operator — which is why the picture ladder never sees these. For a
 * description they are still worth something: a branch of a chain has no
 * article of its own and never will, and "L'Osteria is a German restaurant
 * chain serving pizza and pasta" beats an empty column, as long as the reader
 * is told that is what they are looking at.
 */
export function readBrandIdentity(extratags: Record<string, string> | null | undefined): {
  wikidata: string | null;
  wikipedia: string | null;
} {
  const read = (key: string): string | null => {
    const value = extratags?.[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };
  return { wikidata: read('brand:wikidata'), wikipedia: read('brand:wikipedia') };
}

/** Picks the three identity tags out of a Nominatim `extratags` blob. */
export function readWikiIdentity(extratags: Record<string, string> | null | undefined): WikiIdentity {
  const out: WikiIdentity = { wikipedia: null, wikidata: null, wikimedia_commons: null };
  if (!extratags) return out;
  for (const tag of WIKI_IDENTITY_TAGS) {
    const value = extratags[tag];
    if (typeof value === 'string' && value.trim()) out[tag] = value.trim();
  }
  return out;
}
