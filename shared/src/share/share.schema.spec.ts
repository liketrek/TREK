import { shareLinkRequestSchema } from './share.schema';

import { describe, it, expect } from 'vitest';

describe('shareLinkRequestSchema', () => {
  it('accepts any subset of section toggles (all optional) and an empty body', () => {
    expect(shareLinkRequestSchema.safeParse({ share_map: true, share_budget: false }).success).toBe(true);
    expect(shareLinkRequestSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a non-boolean toggle', () => {
    expect(shareLinkRequestSchema.safeParse({ share_map: 'yes' }).success).toBe(false);
  });
});
