import { resolvePackedState } from './packed-count';

import { describe, it, expect } from 'vitest';

const open = { checked: 0, packed_quantity: null };

describe('resolvePackedState (#2296)', () => {
  it('PACKED-001: keeps a partial count and leaves the box unticked', () => {
    expect(resolvePackedState(open, { bodyKeys: ['packed_quantity'], packed_quantity: 4, quantity: 10 })).toEqual({
      checked: 0,
      packed_quantity: 4,
    });
  });

  it('PACKED-002: a full or overfull count ticks the item and drops the count', () => {
    expect(resolvePackedState(open, { bodyKeys: ['packed_quantity'], packed_quantity: 10, quantity: 10 })).toEqual({
      checked: 1,
      packed_quantity: null,
    });
    expect(resolvePackedState(open, { bodyKeys: ['packed_quantity'], packed_quantity: 99, quantity: 10 })).toEqual({
      checked: 1,
      packed_quantity: null,
    });
  });

  it('PACKED-003: zero or null clears the count and unticks a finished item', () => {
    const done = { checked: 1, packed_quantity: null };
    expect(resolvePackedState(done, { bodyKeys: ['packed_quantity'], packed_quantity: 0, quantity: 3 })).toEqual({
      checked: 0,
      packed_quantity: null,
    });
    expect(resolvePackedState(done, { bodyKeys: ['packed_quantity'], packed_quantity: null, quantity: 3 })).toEqual({
      checked: 0,
      packed_quantity: null,
    });
  });

  it('PACKED-004: the box decides for the whole item', () => {
    const partial = { checked: 0, packed_quantity: 2 };
    expect(resolvePackedState(partial, { bodyKeys: ['checked'], checked: 1, quantity: 5 })).toEqual({
      checked: 1,
      packed_quantity: null,
    });
    expect(resolvePackedState(partial, { bodyKeys: ['checked'], checked: 0, quantity: 5 })).toEqual({
      checked: 0,
      packed_quantity: null,
    });
  });

  it('PACKED-005: a lowered quantity the count reaches finishes the item, anything else is left alone', () => {
    const partial = { checked: 0, packed_quantity: 4 };
    expect(resolvePackedState(partial, { bodyKeys: ['quantity'], quantity: 4 })).toEqual({
      checked: 1,
      packed_quantity: null,
    });
    expect(resolvePackedState(partial, { bodyKeys: ['quantity'], quantity: 8 })).toBe(partial);
    expect(resolvePackedState(partial, { bodyKeys: ['name'], quantity: 8 })).toBe(partial);
  });
});
