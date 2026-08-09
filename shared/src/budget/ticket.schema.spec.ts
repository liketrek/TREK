import { ticketPayloadSchema } from './ticket.schema';

import { describe, expect, it } from 'vitest';

describe('ticketPayloadSchema', () => {
  it('accepts the persisted ticket payload shape', () => {
    expect(
      ticketPayloadSchema.parse({
        items: [{ name: 'Museum', price: '12.50', parts: [2, 7] }],
      }),
    ).toEqual({ items: [{ name: 'Museum', price: '12.50', parts: [2, 7] }] });
  });

  it.each([
    [{ items: [{ name: 'Museum', price: '12.50', parts: [2, 2] }] }],
    [{ items: [{ name: 'Museum', price: '12.50', parts: [0] }] }],
    [{ items: [{ name: 'Museum', price: '12.50', parts: [1.5] }] }],
    [{ items: [{ name: 'Museum', price: '12.50', parts: ['2'] }] }],
  ])('rejects non-distinct positive-integer participant IDs', (payload) => {
    expect(ticketPayloadSchema.safeParse(payload).success).toBe(false);
  });
});
