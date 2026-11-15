import { describe, expect, it } from 'vitest';
import { bringsItem, packingItemAccess, toggledRecipients } from './packingItemAccess';

describe('packingItemAccess', () => {
  it('FE-PACKACCESS-001: a common item of mine is mine to share, not to copy', () => {
    expect(packingItemAccess({ is_private: 0, owner_id: 1 }, 1)).toMatchObject({
      isCommon: true,
      isOwner: true,
      visibility: 'common',
      sharedToMe: false,
      canClone: false,
      recipientIds: [],
    });
  });

  it("FE-PACKACCESS-002: nobody owning it makes it everyone's to share", () => {
    expect(packingItemAccess({ is_private: 0, owner_id: null }, 5).isOwner).toBe(true);
  });

  it("FE-PACKACCESS-003: someone else's common item can be copied, their private one is theirs", () => {
    expect(packingItemAccess({ is_private: 0, owner_id: 2 }, 1)).toMatchObject({ canClone: true, sharedToMe: false });
    expect(packingItemAccess({ is_private: 1, owner_id: 2 }, 1)).toMatchObject({
      canClone: false,
      sharedToMe: true,
      visibility: 'personal',
    });
  });

  it('FE-PACKACCESS-004: a private item with people on it is shared', () => {
    const access = packingItemAccess({ is_private: 1, owner_id: 1, recipients: [{ user_id: 3, username: 'c' }] }, 1);
    expect(access.visibility).toBe('shared');
    expect(access.recipientIds).toEqual([3]);
  });

  it('FE-PACKACCESS-005: the owner and the co-bringers bring it, nobody else', () => {
    const item = { owner_id: 1, contributors: [{ user_id: 2, username: 'b', status: 'accepted' }] };
    expect(bringsItem(item, 1)).toBe(true);
    expect(bringsItem(item, 2)).toBe(true);
    expect(bringsItem(item, 3)).toBe(false);
    expect(bringsItem({ owner_id: null }, 3)).toBe(false);
  });

  it('FE-PACKACCESS-006: a tap adds or removes a person, and the last one out leaves it personal', () => {
    expect(toggledRecipients([3], 4)).toEqual({ visibility: 'shared', recipientIds: [3, 4] });
    expect(toggledRecipients([3, 4], 3)).toEqual({ visibility: 'shared', recipientIds: [4] });
    expect(toggledRecipients([3], 3)).toEqual({ visibility: 'personal', recipientIds: [] });
  });
});
