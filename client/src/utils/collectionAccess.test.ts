import type { CollectionMember } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { canAddToCollection } from './collectionAccess';

// FE-COLLECTION-ACCESS-001 to FE-COLLECTION-ACCESS-002

const member = (over: Partial<CollectionMember>): CollectionMember => ({
  user_id: 7,
  username: 'mia',
  status: 'accepted',
  role: 'editor',
  ...over,
});

describe('canAddToCollection', () => {
  it('FE-COLLECTION-ACCESS-001: a list of one’s own always takes more', () => {
    expect(canAddToCollection({ is_owner: true }, 7)).toBe(true);
    expect(canAddToCollection({}, undefined)).toBe(true);
  });

  it('FE-COLLECTION-ACCESS-002: a shared list only for an accepted editor or admin', () => {
    expect(canAddToCollection({ is_owner: false, members: [member({})] }, 7)).toBe(true);
    expect(canAddToCollection({ is_owner: false, members: [member({ role: 'admin' })] }, 7)).toBe(true);
    expect(canAddToCollection({ is_owner: false, members: [member({ role: 'viewer' })] }, 7)).toBe(false);
    expect(canAddToCollection({ is_owner: false, members: [member({ status: 'pending' })] }, 7)).toBe(false);
    expect(canAddToCollection({ is_owner: false, members: [member({ user_id: 8 })] }, 7)).toBe(false);
    expect(canAddToCollection({ is_owner: false }, 7)).toBe(false);
  });
});
