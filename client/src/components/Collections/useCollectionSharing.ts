import type { CollectionMember, CollectionRole } from '@trek/shared';
import { COLLECTION_ROLES } from '@trek/shared';
import { useEffect, useMemo, useState } from 'react';

import { collectionsApi } from '../../api/collections';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import type { TranslationFn } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';

/** A per-member write: change the role, cancel a pending invite, remove an accepted member. */
export type MemberAction = 'role' | 'cancel' | 'remove';

export interface CollectionSharingOptions {
  open: boolean;
  collectionId: number | null;
  isOwner: boolean;
  members: CollectionMember[];
  /** Called after the current (member) user successfully leaves the list. */
  onAfterLeave: () => void;
  t: TranslationFn;
  /**
   * One busy member for every kind of row action (the phone sheet), instead of one
   * busy member per kind (the desktop dialog, where a role change and a cancel on
   * two different rows can run side by side). The phone sheet also ignores a second
   * leave while one is in flight.
   */
  singleBusySlot?: boolean;
}

/** Owner first, then accepted, then pending, alphabetised within each band. */
export function sortCollectionMembers(members: CollectionMember[]): CollectionMember[] {
  const rank = (m: CollectionMember) => (m.is_owner ? 0 : m.status === 'accepted' ? 1 : 2);
  return [...members].sort((a, b) => rank(a) - rank(b) || a.username.localeCompare(b.username));
}

/** The role after `current` in the Viewer, Editor, Admin cycle. */
export function nextCollectionRole(current: CollectionRole): CollectionRole {
  return COLLECTION_ROLES[(COLLECTION_ROLES.indexOf(current) + 1) % COLLECTION_ROLES.length];
}

/**
 * Fusion sharing for one list: the logic behind both the desktop dialog and the phone
 * sheet, which render their own markup over it. An owner gets the invitable users on
 * every opening (and after the roster changes size), invites, changes roles, cancels
 * pending invites and removes members; a member can leave.
 */
export function useCollectionSharing({
  open,
  collectionId,
  isOwner,
  members,
  onAfterLeave,
  t,
  singleBusySlot = false,
}: CollectionSharingOptions) {
  const toast = useToast();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const invite = useCollectionStore((s) => s.invite);
  const cancelInvite = useCollectionStore((s) => s.cancelInvite);
  const removeMember = useCollectionStore((s) => s.removeMember);
  const setMemberRole = useCollectionStore((s) => s.setMemberRole);
  const leave = useCollectionStore((s) => s.leave);

  const [availableUsers, setAvailableUsers] = useState<{ id: number; username: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [inviteRole, setInviteRole] = useState<CollectionRole>('editor');
  const [busy, setBusy] = useState<Partial<Record<MemberAction, number>>>({});
  const [inviting, setInviting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Load the invitable users whenever an owner opens the surface.
  useEffect(() => {
    if (!open || !isOwner || collectionId == null) return;
    let cancelled = false;
    collectionsApi
      .availableUsers(collectionId)
      .then((data) => {
        if (!cancelled) setAvailableUsers(data.users);
      })
      .catch(() => {
        if (!cancelled) setAvailableUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isOwner, collectionId, members.length]);

  // Reset transient state on close.
  useEffect(() => {
    if (open) return;
    setSelectedUserId(null);
    setConfirmLeave(false);
  }, [open]);

  const sortedMembers = useMemo(() => sortCollectionMembers(members), [members]);

  const slotOf = (kind: MemberAction): MemberAction => (singleBusySlot ? 'role' : kind);
  const busyUserId = (kind: MemberAction): number | null => busy[slotOf(kind)] ?? null;

  const runMemberAction = async (kind: MemberAction, userId: number, action: () => Promise<void>) => {
    const slot = slotOf(kind);
    if (busy[slot] != null) return;
    setBusy((b) => ({ ...b, [slot]: userId }));
    try {
      await action();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setBusy((b) => {
        const rest = { ...b };
        delete rest[slot];
        return rest;
      });
    }
  };

  const setRole = (userId: number, role: CollectionRole) => {
    if (collectionId == null) return Promise.resolve();
    return runMemberAction('role', userId, () => setMemberRole(collectionId, userId, role));
  };

  const cycleRole = (member: CollectionMember) => {
    if (collectionId == null) return;
    void setRole(member.user_id, nextCollectionRole(member.role ?? 'editor'));
  };

  const cancel = (userId: number) => {
    if (collectionId == null) return Promise.resolve();
    return runMemberAction('cancel', userId, () => cancelInvite(collectionId, userId));
  };

  const remove = (userId: number) => {
    if (collectionId == null) return Promise.resolve();
    return runMemberAction('remove', userId, () => removeMember(collectionId, userId));
  };

  const handleInvite = async () => {
    if (collectionId == null || selectedUserId == null || inviting) return;
    setInviting(true);
    try {
      await invite(collectionId, selectedUserId, inviteRole);
      toast.success(t('collections.invite.sent'));
      setSelectedUserId(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('collections.invite.error')));
    } finally {
      setInviting(false);
    }
  };

  const handleLeave = async () => {
    // Only the phone sheet ignores a second leave while one is in flight.
    if (collectionId == null || (singleBusySlot && leaving)) return;
    setLeaving(true);
    try {
      await leave(collectionId);
      toast.success(t('collections.share.left'));
      onAfterLeave();
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setLeaving(false);
    }
  };

  return {
    currentUserId,
    availableUsers,
    sortedMembers,
    selectedUserId,
    setSelectedUserId,
    inviteRole,
    setInviteRole,
    inviting,
    confirmLeave,
    setConfirmLeave,
    leaving,
    busyUserId,
    setRole,
    cycleRole,
    cancel,
    remove,
    handleInvite,
    handleLeave,
  };
}
