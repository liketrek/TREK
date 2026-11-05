import type { TripMember } from './usePackingListPanel';

interface BroughtItem {
  owner_username?: string | null;
  contributors?: { username: string }[] | null;
}

/**
 * Everyone bringing a common item, as one readable list: its bringer first, then
 * whoever also brings it. The row only has room for one avatar and a "+n", so this
 * is what its tooltip and the item sheet name (#2782).
 */
export function packingBringerNames(item: BroughtItem): string {
  const names = [item.owner_username, ...(item.contributors ?? []).map((c) => c.username)];
  return [...new Set(names.filter((n): n is string => !!n))].join(', ');
}

/** One person bringing a common item: the name, and the picture when the trip knows one. */
export interface Bringer {
  name: string;
  avatar: string | null;
}

/** The item's bringer first, then whoever also brings it, each once, with their picture from the trip's members. */
export function bringersOf(
  item: {
    owner_id?: number | null;
    owner_username?: string | null;
    contributors?: { user_id: number; username: string }[] | null;
  },
  members: readonly TripMember[]
): Bringer[] {
  const avatarOf = (id: number | null | undefined) => {
    const member = id == null ? undefined : members.find((m) => m.id === id);
    return member?.avatar_url ?? member?.avatar ?? null;
  };
  const all = [
    ...(item.owner_username ? [{ id: item.owner_id ?? null, name: item.owner_username }] : []),
    ...(item.contributors ?? []).map((c) => ({ id: c.user_id, name: c.username })),
  ];
  const bringers: Bringer[] = [];
  for (const person of all) {
    if (bringers.some((b) => b.name === person.name)) continue;
    bringers.push({ name: person.name, avatar: avatarOf(person.id) });
  }
  return bringers;
}
