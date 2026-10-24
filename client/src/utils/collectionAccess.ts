import type { Collection, CollectionMember, CollectionRole } from '@trek/shared';

/**
 * Whether the user may add to a list: their own, or a shared one where they
 * are an accepted editor or admin. The rule the server applies on the way in,
 * so a dialog never offers a list the write would refuse.
 */
export function canAddToCollection(
  collection: Pick<Collection, 'is_owner' | 'members'>,
  userId: number | null | undefined
): boolean {
  if (collection.is_owner !== false) return true;
  return (collection.members ?? []).some(
    (member) =>
      member.user_id === userId && member.status === 'accepted' && (member.role === 'editor' || member.role === 'admin')
  );
}

/**
 * The user's role on a list: owner of their own, else the role a shared list
 * gives them as a member, or null when they are neither.
 */
export function collectionRoleOf(
  isOwner: boolean,
  members: readonly Pick<CollectionMember, 'user_id' | 'is_owner' | 'role'>[],
  userId: number | null | undefined
): 'owner' | CollectionRole | null {
  if (isOwner) return 'owner';
  return members.find((member) => member.user_id === userId && !member.is_owner)?.role ?? null;
}

/** Whether a role may remove from a list: its owner or an admin of it. */
export function canRemoveFromCollection(role: 'owner' | CollectionRole | null): boolean {
  return role === 'owner' || role === 'admin';
}
