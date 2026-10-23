import { CHUNK, MAX_ORIGINAL, applySchema, stageSchema, writeSchema, snapshotSchema } from './transfer.schema';

import { describe, expect, it } from 'vitest';

describe('travel transfer MCP contracts', () => {
  const part = {
    trip_id: null,
    operation_id: 'synthetic-op',
    id: 'original',
    sha256: 'a'.repeat(64),
    offset: 0,
    total: MAX_ORIGINAL,
    chunk_sha256: 'b'.repeat(64),
    data: 'YQ==',
  };
  it('requires explicit private selection and preserves null creation targets', () => {
    expect(writeSchema.parse(part).include_private).toBe(false);
    expect(writeSchema.parse(part).trip_id).toBe(null);
    expect(writeSchema.parse({ ...part, include_private: true }).include_private).toBe(true);
  });
  it('bounds original metadata and base64 request size', () => {
    for (const patch of [
      { total: MAX_ORIGINAL + 1 },
      { offset: -1 },
      { data: 'a'.repeat(4 * Math.ceil(CHUNK / 3) + 1) },
      { operation_id: 'bad\nidentity' },
    ]) {
      expect(writeSchema.safeParse({ ...part, ...patch }).success).toBe(false);
    }
  });
  it('rejects extra properties rather than ignoring audience or target spelling errors', () => {
    expect(writeSchema.safeParse({ ...part, includePrivate: true }).success).toBe(false);
    expect(snapshotSchema.safeParse({ trip_id: null }).success).toBe(false);
  });
  it('requires a bounded graph and apply identity', () => {
    expect(
      stageSchema.safeParse({
        trip_id: null,
        operation_id: 'op',
        payload_digest: 'a'.repeat(64),
        offset: 0,
        total: 65 * CHUNK,
        chunk_sha256: 'b'.repeat(64),
        data: '',
      }).success,
    ).toBe(false);
    expect(
      applySchema.safeParse({ trip_id: '1', operation_id: 'op', payload_digest: 'a'.repeat(64), original_ids: [] })
        .success,
    ).toBe(false);
  });
});
