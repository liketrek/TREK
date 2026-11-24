import type { PackingItem } from '../../types';

export type PackingVisibility = 'common' | 'personal' | 'shared';

type AccessItem = Pick<PackingItem, 'is_private' | 'owner_id' | 'recipients' | 'contributors'>;

/**
 * Who may do what with one packing item, by the three tiers (#858): the owner
 * (or anyone, while nobody owns it) sets who sees it, everyone on the trip can
 * be put down as bringing a common item (#3098), and a private item shared with
 * me is the owner's to look after. The desktop window and the phone sheet both
 * read it from here.
 */
export function packingItemAccess(item: AccessItem, currentUserId: number | null | undefined) {
  const isCommon = !item.is_private;
  const isOwner = item.owner_id == null || item.owner_id === currentUserId;
  const recipientIds = (item.recipients || []).map((r) => r.user_id);
  const privateTier: PackingVisibility = recipientIds.length > 0 ? 'shared' : 'personal';
  const visibility: PackingVisibility = isCommon ? 'common' : privateTier;
  return {
    isCommon,
    isOwner,
    recipientIds,
    visibility,
    /** A private item somebody else owns: shown, but theirs to change. */
    sharedToMe: !isCommon && !isOwner,
    /** A common item somebody else owns can be copied onto my own list. */
    canClone: isCommon && !isOwner,
  };
}

/** True when the person brings the item, as its owner or alongside. */
export function bringsItem(item: Pick<PackingItem, 'owner_id' | 'contributors'>, userId: number): boolean {
  return item.owner_id === userId || (item.contributors || []).some((c) => c.user_id === userId);
}

/**
 * The sharing a tap on one person leads to: on or off the list of people who see
 * the item, and with nobody left it falls back to the owner alone.
 */
export function toggledRecipients(
  recipientIds: number[],
  userId: number
): { visibility: PackingVisibility; recipientIds: number[] } {
  const next = recipientIds.includes(userId) ? recipientIds.filter((id) => id !== userId) : [...recipientIds, userId];
  return { visibility: next.length ? 'shared' : 'personal', recipientIds: next };
}
