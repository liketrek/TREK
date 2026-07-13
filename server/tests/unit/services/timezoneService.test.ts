import { describe, expect, it } from 'vitest';
import { resolveTimeZone } from '../../../src/services/timezoneService';

describe('timezoneService', () => {
  it('resolves valid coordinates and rejects missing or invalid values', () => {
    expect(resolveTimeZone(35.6762, 139.6503)).toBe('Asia/Tokyo');
    expect(resolveTimeZone(null, 139.6503)).toBeNull();
    expect(resolveTimeZone(91, 139.6503)).toBeNull();
  });
});
