import { describe, it, expect } from 'vitest';
// Smoke test: proves the server toolchain (tsx / vitest) resolves @trek/shared.
import {
  idParamSchema,
  paginationQuerySchema,
  collabNoteCreateRequestSchema,
  shareLinkRequestSchema,
} from '@trek/shared';

describe('@trek/shared resolves in the server toolchain', () => {
  it('imports and uses a shared schema', () => {
    expect(idParamSchema.parse('7')).toBe(7);
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, perPage: 50 });
  });

  it('validates collab note create request schema with guest_name', () => {
    const parsed = collabNoteCreateRequestSchema.parse({
      title: 'Cafe Recommendation',
      content: 'Near Central Station',
      guest_name: 'Visitor John',
    });
    expect(parsed.guest_name).toBe('Visitor John');
    expect(parsed.title).toBe('Cafe Recommendation');
  });

  it('validates share link request schema with allow_guest_notes', () => {
    const parsed = shareLinkRequestSchema.parse({
      share_map: true,
      allow_guest_notes: true,
    });
    expect(parsed.allow_guest_notes).toBe(true);
  });
});

