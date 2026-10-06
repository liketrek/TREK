/**
 * `toCamelCase` (Plan 3j Task 6, design spec D8) — the DORMANT plugin-RPC facade
 * utility. This is its entire test surface: it is wired into no `*.rpc.ts` handler, so
 * no RPC-handler test changes alongside it. See `row-shape.ts`'s own docstring for why
 * it exists unwired and what it must never be applied to.
 */
import { toCamelCase } from '../../../../src/nest/plugins/host/rpc-kit/row-shape';

import { describe, it, expect, expectTypeOf } from 'vitest';

describe('toCamelCase', () => {
  it('ROWSHAPE-001 a flat row with several snake_case keys gets both cases, originals unchanged', () => {
    const row = { id: 1, display_name: 'Ada', avatar_url: null as string | null };
    const mapped = toCamelCase(row);
    expect(mapped).toEqual({
      id: 1,
      display_name: 'Ada',
      avatar_url: null,
      displayName: 'Ada',
      avatarUrl: null,
    });
    // Originals present and unchanged, not moved.
    expect(mapped.display_name).toBe('Ada');
    expect(mapped.avatar_url).toBeNull();
  });

  it('ROWSHAPE-002 a key with no underscore passes through untouched — no identity-transform copy', () => {
    const row = { id: 1, username: 'ada' };
    const mapped = toCamelCase(row);
    expect(mapped).toEqual({ id: 1, username: 'ada' });
    expect(Object.keys(mapped).sort()).toEqual(['id', 'username']);
  });

  it('ROWSHAPE-003 an array of rows maps element-wise', () => {
    const rows = [
      { id: 1, display_name: 'Ada' },
      { id: 2, display_name: 'Bea' },
    ];
    const mapped = toCamelCase(rows);
    expect(mapped).toEqual([
      { id: 1, display_name: 'Ada', displayName: 'Ada' },
      { id: 2, display_name: 'Bea', displayName: 'Bea' },
    ]);
  });

  it('ROWSHAPE-004 a nested object stays untouched — proves the shallow, one-level scope', () => {
    const profile = { first_name: 'Ada', last_name: 'Lovelace' };
    const row = { id: 1, user_profile: profile };
    const mapped = toCamelCase(row);
    // The camel sibling points at the exact SAME object — never a recursively-mapped copy.
    expect(mapped.userProfile).toBe(profile);
    expect(mapped.user_profile).toBe(profile);
    // The nested object itself gained no camelCase siblings.
    expect(Object.keys(profile).sort()).toEqual(['first_name', 'last_name']);
    expect((profile as Record<string, unknown>).firstName).toBeUndefined();
  });

  it('ROWSHAPE-005 null, undefined and a primitive pass through safely, unchanged', () => {
    expect(toCamelCase(null)).toBeNull();
    expect(toCamelCase(undefined)).toBeUndefined();
    expect(toCamelCase('a string')).toBe('a string');
    expect(toCamelCase(42)).toBe(42);
    expect(toCamelCase(true)).toBe(true);
  });

  it('ROWSHAPE-006 a Date or Buffer value — at the top level or nested under a key — passes through unchanged', () => {
    const when = new Date('2026-09-24T00:00:00.000Z');
    const bytes = Buffer.from('hello');

    // Top-level argument.
    expect(toCamelCase(when)).toBe(when);
    expect(toCamelCase(bytes)).toBe(bytes);

    // Nested under a row key — never spread, never recursed into.
    const row = { id: 1, created_at: when, blob_data: bytes };
    const mapped = toCamelCase(row);
    expect(mapped.createdAt).toBe(when);
    expect(mapped.created_at).toBe(when);
    expect(mapped.blobData).toBe(bytes);
    expect(mapped.blob_data).toBe(bytes);
  });

  it('ROWSHAPE-007 a digit immediately after an underscore follows the same rule (no special case)', () => {
    const row = { place_2_id: 7 };
    const mapped = toCamelCase(row);
    expect(mapped).toEqual({ place_2_id: 7, place2Id: 7 });
  });

  it('ROWSHAPE-008 an empty object round-trips to an equal empty object', () => {
    expect(toCamelCase({})).toEqual({});
  });

  it('ROWSHAPE-009 an empty array round-trips to an empty array', () => {
    expect(toCamelCase([])).toEqual([]);
  });

  it('ROWSHAPE-010 type-level: the SDK-shaped User row keeps its snake_case members AND exposes the camel siblings', () => {
    // Mirrors plugin-sdk/src/index.ts's published `User` shape exactly (id, username,
    // display_name, avatar, plus its index signature) — the one row HostSurfaceRpc#getUser
    // (HR1) would wrap if the facade were ever wired in.
    interface SdkUserRow {
      id: number;
      username?: string;
      display_name?: string | null;
      avatar?: string | null;
      [k: string]: unknown;
    }
    const row: SdkUserRow = { id: 1, username: 'ada', display_name: 'Ada Lovelace', avatar: null };
    const mapped = toCamelCase(row);

    // The mapped type is `SdkUserRow & Record<string, unknown>`: every original member
    // stays typed, and any camelCase sibling (`displayName`, unlisted on `SdkUserRow`
    // itself) resolves through the added index signature rather than failing to compile —
    // exactly the shape a plugin-sdk follow-up release's row types would need.
    expectTypeOf(mapped).toEqualTypeOf<SdkUserRow & Record<string, unknown>>();
    expectTypeOf(mapped.display_name).toEqualTypeOf<SdkUserRow['display_name']>();
    expectTypeOf(mapped.displayName).toEqualTypeOf<unknown>();

    expect(mapped.display_name).toBe('Ada Lovelace');
    expect(mapped.displayName).toBe('Ada Lovelace');
  });
});
