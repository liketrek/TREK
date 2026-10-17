// FE-COMP-COLSHAREHOOK-001 to FE-COMP-COLSHAREHOOK-012: the list sharing logic behind
// both the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CollectionMember } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';

import { buildUser } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { collectionsApi } from '../../api/collections';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import {
  nextCollectionRole,
  sortCollectionMembers,
  useCollectionSharing,
  type CollectionSharingOptions,
} from './useCollectionSharing';

const t = (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k);

const OWNER: CollectionMember = { user_id: 1, username: 'maurice', status: 'accepted', is_owner: true };
const EDITOR: CollectionMember = { user_id: 2, username: 'julien', status: 'accepted', role: 'editor' };
const VIEWER: CollectionMember = { user_id: 4, username: 'ada', status: 'accepted', role: 'viewer' };
const PENDING: CollectionMember = { user_id: 3, username: 'zoe', status: 'pending' };

type CollectionState = ReturnType<typeof useCollectionStore.getState>;
const initialCollectionState = useCollectionStore.getState();
let actions: {
  invite: Mock<CollectionState['invite']>;
  cancelInvite: Mock<CollectionState['cancelInvite']>;
  removeMember: Mock<CollectionState['removeMember']>;
  setMemberRole: Mock<CollectionState['setMemberRole']>;
  leave: Mock<CollectionState['leave']>;
};
let addToast: Mock<NonNullable<Window['__addToast']>>;
let availableUsers: MockInstance<typeof collectionsApi.availableUsers>;

function setup(over: Partial<CollectionSharingOptions> = {}) {
  const props: CollectionSharingOptions = {
    open: true,
    collectionId: 7,
    isOwner: true,
    members: [PENDING, EDITOR, OWNER],
    onAfterLeave: vi.fn(),
    t,
    ...over,
  };
  const hook = renderHook((p: CollectionSharingOptions) => useCollectionSharing(p), { initialProps: props });
  return { ...hook, props };
}

/** A promise the test settles by hand, to look at the hook while a write is in flight. */
function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  resetAllStores();
  useCollectionStore.setState(initialCollectionState, true);
  actions = {
    invite: vi.fn<CollectionState['invite']>().mockResolvedValue(undefined),
    cancelInvite: vi.fn<CollectionState['cancelInvite']>().mockResolvedValue(undefined),
    removeMember: vi.fn<CollectionState['removeMember']>().mockResolvedValue(undefined),
    setMemberRole: vi.fn<CollectionState['setMemberRole']>().mockResolvedValue(undefined),
    leave: vi.fn<CollectionState['leave']>().mockResolvedValue(undefined),
  };
  useCollectionStore.setState(actions);
  seedStore(useAuthStore, { user: buildUser({ id: 1, username: 'maurice' }) });
  addToast = vi.fn<NonNullable<Window['__addToast']>>();
  window.__addToast = addToast;
  availableUsers = vi
    .spyOn(collectionsApi, 'availableUsers')
    .mockResolvedValue({ users: [{ id: 9, username: 'nina' }] });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('collection sharing helpers', () => {
  it('FE-COMP-COLSHAREHOOK-001: sorts owner, then accepted, then pending, by name within a band', () => {
    expect(sortCollectionMembers([PENDING, EDITOR, VIEWER, OWNER]).map((m) => m.user_id)).toEqual([1, 4, 2, 3]);
  });

  it('FE-COMP-COLSHAREHOOK-002: cycles viewer, editor, admin and back', () => {
    expect(nextCollectionRole('viewer')).toBe('editor');
    expect(nextCollectionRole('editor')).toBe('admin');
    expect(nextCollectionRole('admin')).toBe('viewer');
  });
});

describe('useCollectionSharing', () => {
  it('FE-COMP-COLSHAREHOOK-003: loads the invitable users for an owner and reloads when the roster changes size', async () => {
    const { result, rerender, props } = setup();
    await waitFor(() => expect(result.current.availableUsers).toEqual([{ id: 9, username: 'nina' }]));
    expect(availableUsers).toHaveBeenCalledWith(7);
    expect(result.current.currentUserId).toBe(1);
    rerender({ ...props, members: [OWNER] });
    await waitFor(() => expect(availableUsers).toHaveBeenCalledTimes(2));
  });

  it('FE-COMP-COLSHAREHOOK-004: loads nothing for a member, while closed, or without a list', () => {
    setup({ isOwner: false });
    setup({ open: false });
    setup({ collectionId: null });
    expect(availableUsers).not.toHaveBeenCalled();
  });

  it('FE-COMP-COLSHAREHOOK-005: an empty invitee list when the lookup fails', async () => {
    availableUsers.mockRejectedValueOnce(new Error('boom'));
    const { result } = setup();
    await waitFor(() => expect(availableUsers).toHaveBeenCalled());
    expect(result.current.availableUsers).toEqual([]);
  });

  it('FE-COMP-COLSHAREHOOK-006: invites the picked user with the picked role, toasts and clears the pick', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleInvite();
    });
    expect(actions.invite).not.toHaveBeenCalled();

    act(() => {
      result.current.setSelectedUserId(9);
      result.current.setInviteRole('admin');
    });
    await act(async () => {
      await result.current.handleInvite();
    });
    expect(actions.invite).toHaveBeenCalledWith(7, 9, 'admin');
    expect(addToast).toHaveBeenCalledWith('collections.invite.sent', 'success', undefined);
    expect(result.current.selectedUserId).toBeNull();
    expect(result.current.inviting).toBe(false);
  });

  it('FE-COMP-COLSHAREHOOK-007: a failed invite keeps the pick and shows the server message', async () => {
    actions.invite.mockRejectedValueOnce({ response: { data: { error: 'Already invited' } } });
    const { result } = setup();
    act(() => result.current.setSelectedUserId(9));
    await act(async () => {
      await result.current.handleInvite();
    });
    expect(addToast).toHaveBeenCalledWith('Already invited', 'error', undefined);
    expect(result.current.selectedUserId).toBe(9);
  });

  it('FE-COMP-COLSHAREHOOK-008: closing drops the pick and the leave question', () => {
    const { result, rerender, props } = setup();
    act(() => {
      result.current.setSelectedUserId(9);
      result.current.setConfirmLeave(true);
    });
    rerender({ ...props, open: false });
    expect(result.current.selectedUserId).toBeNull();
    expect(result.current.confirmLeave).toBe(false);
  });

  it('FE-COMP-COLSHAREHOOK-009: one busy member per kind of row action on desktop', async () => {
    const role = deferred();
    actions.setMemberRole.mockReturnValueOnce(role.promise);
    const { result } = setup();
    act(() => {
      void result.current.setRole(2, 'viewer');
    });
    expect(result.current.busyUserId('role')).toBe(2);
    expect(result.current.busyUserId('cancel')).toBeNull();

    // A cancel on another row runs alongside, a second role change does not.
    await act(async () => {
      await result.current.cancel(3);
      await result.current.setRole(4, 'admin');
    });
    expect(actions.cancelInvite).toHaveBeenCalledWith(7, 3);
    expect(actions.setMemberRole).toHaveBeenCalledTimes(1);

    act(() => role.resolve());
    await waitFor(() => expect(result.current.busyUserId('role')).toBeNull());
    expect(actions.setMemberRole).toHaveBeenCalledWith(7, 2, 'viewer');
  });

  it('FE-COMP-COLSHAREHOOK-010: one busy member for every row action on the phone', async () => {
    const role = deferred();
    actions.setMemberRole.mockReturnValueOnce(role.promise);
    const { result } = setup({ singleBusySlot: true });
    act(() => result.current.cycleRole(EDITOR));
    expect(actions.setMemberRole).toHaveBeenCalledWith(7, 2, 'admin');
    expect(result.current.busyUserId('remove')).toBe(2);

    await act(async () => {
      await result.current.cancel(3);
      await result.current.remove(4);
    });
    expect(actions.cancelInvite).not.toHaveBeenCalled();
    expect(actions.removeMember).not.toHaveBeenCalled();

    act(() => role.resolve());
    await waitFor(() => expect(result.current.busyUserId('remove')).toBeNull());
    await act(async () => {
      await result.current.remove(4);
    });
    expect(actions.removeMember).toHaveBeenCalledWith(7, 4);
  });

  it('FE-COMP-COLSHAREHOOK-011: a failed row action toasts the generic error and frees the row', async () => {
    actions.removeMember.mockRejectedValueOnce(new Error('nope'));
    const { result } = setup();
    await act(async () => {
      await result.current.remove(2);
    });
    expect(addToast).toHaveBeenCalledWith('common.error', 'error', undefined);
    expect(result.current.busyUserId('remove')).toBeNull();
  });

  it('FE-COMP-COLSHAREHOOK-012: leaving toasts and hands over, a failure only toasts', async () => {
    const onAfterLeave = vi.fn();
    const { result } = setup({ isOwner: false, onAfterLeave });
    await act(async () => {
      await result.current.handleLeave();
    });
    expect(actions.leave).toHaveBeenCalledWith(7);
    expect(addToast).toHaveBeenCalledWith('collections.share.left', 'success', undefined);
    expect(onAfterLeave).toHaveBeenCalledTimes(1);

    actions.leave.mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.handleLeave();
    });
    expect(addToast).toHaveBeenLastCalledWith('common.error', 'error', undefined);
    expect(onAfterLeave).toHaveBeenCalledTimes(1);
    expect(result.current.leaving).toBe(false);
  });

  it('FE-COMP-COLSHAREHOOK-013: only the phone ignores a second leave while one is in flight', async () => {
    const first = deferred();
    actions.leave.mockReturnValueOnce(first.promise);
    const phone = setup({ isOwner: false, singleBusySlot: true });
    act(() => {
      void phone.result.current.handleLeave();
    });
    expect(phone.result.current.leaving).toBe(true);
    await act(async () => {
      await phone.result.current.handleLeave();
    });
    expect(actions.leave).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve());
    phone.unmount();

    const second = deferred();
    actions.leave.mockReturnValueOnce(second.promise);
    const desktop = setup({ isOwner: false });
    act(() => {
      void desktop.result.current.handleLeave();
    });
    expect(desktop.result.current.leaving).toBe(true);
    await act(async () => {
      await desktop.result.current.handleLeave();
    });
    expect(actions.leave).toHaveBeenCalledTimes(3);
    await act(async () => second.resolve());
  });
});
