import type { Place, Tag } from '@trek/shared';

import { safeHexColor } from './safeColor';

/** A tag as a place carries it: the compact row of a place list, where every field is optional. */
type PlaceTag = NonNullable<Place['tags']>[number];

/** A tag as a picker, a filter row and a chip show it. */
export interface TagChoice {
  id: number;
  name: string;
  /** Absent for a colour that is no plain hex value: the chip then keeps the colour of its text. */
  color?: string;
}

/**
 * The tags of the given lists, each once and by name, as far as they can be shown. A tag
 * reads as the first list that has it says, so with the trip's own tags ahead of the
 * copies a place carries, the name and the colour are the current ones.
 */
export function tagChoices(...lists: (readonly PlaceTag[] | undefined)[]): TagChoice[] {
  const choices = new Map<number, TagChoice>();
  for (const tag of lists.flatMap((list) => list ?? [])) {
    if (tag.id == null || !tag.name || choices.has(tag.id)) continue;
    choices.set(tag.id, { id: tag.id, name: tag.name, color: safeHexColor(tag.color, '') || undefined });
  }
  return [...choices.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** The ids of the tags a place carries, as a write names them. */
export function placeTagIds(carried: readonly PlaceTag[] | undefined): number[] {
  return [...new Set((carried ?? []).flatMap((tag) => (tag.id == null ? [] : [tag.id])))];
}

// What a new tag is coloured with, one after the other, so the tags of a trip tell apart at a glance.
export const TAG_COLORS = [
  '#6366f1',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ef4444',
  '#f59e0b',
  '#84cc16',
  '#64748b',
];

/** The colour the next new tag of a trip gets. */
export function nextTagColor(tripTags: readonly unknown[]): string {
  return TAG_COLORS[tripTags.length % TAG_COLORS.length];
}

/** The trip's tags with one more, or with the one of that id as it is now, by name as the server lists them. */
export function withTripTag(tripTags: readonly Tag[], tag: Tag): Tag[] {
  return [...tripTags.filter((other) => other.id !== tag.id), tag].sort((a, b) => a.name.localeCompare(b.name));
}

/** What changed between two readings of a trip's tags, as far as the copies on its places go. */
interface TagChanges {
  /** The tags that are gone. */
  removed: ReadonlySet<number>;
  /** The tags with another name or colour, as they are now. */
  renamed: ReadonlyMap<number, Tag>;
}

/** Null when no tag was renamed, recoloured or deleted between the two readings. */
export function tagChanges(before: readonly Tag[], after: readonly Tag[]): TagChanges | null {
  const now = new Map(after.map((tag) => [tag.id, tag]));
  const removed = new Set<number>();
  const renamed = new Map<number, Tag>();
  for (const old of before) {
    const tag = now.get(old.id);
    if (!tag) removed.add(old.id);
    else if (tag.name !== old.name || tag.color !== old.color) renamed.set(tag.id, tag);
  }
  return removed.size > 0 || renamed.size > 0 ? { removed, renamed } : null;
}

/** A place with its tags as the trip has them now; the same object when none of its tags changed. */
export function withTagChanges<P extends { tags?: PlaceTag[] }>(place: P, changes: TagChanges): P {
  const touched = (tag: PlaceTag) => tag.id != null && (changes.removed.has(tag.id) || changes.renamed.has(tag.id));
  if (!place.tags?.some(touched)) return place;
  const tags = place.tags
    .filter((tag) => tag.id == null || !changes.removed.has(tag.id))
    .map((tag) => {
      const now = tag.id == null ? undefined : changes.renamed.get(tag.id);
      return now ? { ...tag, name: now.name, color: now.color } : tag;
    });
  return { ...place, tags };
}
