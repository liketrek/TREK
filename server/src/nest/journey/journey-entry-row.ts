import type { JourneyEntry } from '../../types';

/**
 * A journey entry on the way out.
 *
 * `tags` and `pros_cons` are JSON held in TEXT columns, so a row read straight
 * out of SQLite carries them as strings — and `JourneyEntry` types them that
 * way, because it describes the row. What every consumer wants is the decoded
 * shape, and it wants it under the same field names, so the two are one type
 * apart and only this module knows the difference.
 *
 * That distinction is the whole bug this exists for. Three read paths decoded
 * the columns by hand and the create and update paths did not, so an edit
 * answered with `tags` as a string, the store spread it into an entry the
 * client had typed as `string[]`, and the page threw `tags.map is not a
 * function`. Neither compiler could see it: both sides were reading the same
 * field name and only one of them was right.
 *
 * The broadcast is decoded for the same reason rather than because anything
 * breaks on it today — the journey page reloads on any event and ignores the
 * payload — but a payload that contradicts what the read paths answer is a trap
 * for the first listener that decides to trust it.
 *
 * `stats_excluded` is the same gap one column over: an INTEGER holding 0 or 1
 * that the wire carries as a boolean (discussion #2064). It crosses here for
 * the reason the JSON does, so that a client comparing it with `=== true` is
 * comparing against something that can be true on every path.
 */
export interface JourneyEntryWire extends Omit<JourneyEntry, 'tags' | 'pros_cons' | 'stats_excluded'> {
  tags: string[];
  pros_cons: { pros: string[]; cons: string[] } | null;
  stats_excluded: boolean;
}

/** Decode a row's JSON columns and its flag. The one place that knows how they are stored. */
export function decodeEntryRow(row: JourneyEntry): JourneyEntryWire {
  const { tags, pros_cons, stats_excluded, ...rest } = row;
  return {
    ...rest,
    tags: tags ? JSON.parse(tags) : [],
    pros_cons: pros_cons ? JSON.parse(pros_cons) : null,
    stats_excluded: !!stats_excluded,
  };
}
