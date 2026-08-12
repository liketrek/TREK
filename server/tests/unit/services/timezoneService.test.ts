import { localParts, resolveTimeZone } from '../../../src/services/timezoneService';

import { describe, expect, it } from 'vitest';

describe('timezoneService', () => {
  it('resolves valid coordinates and rejects missing or invalid values', () => {
    expect(resolveTimeZone(35.6762, 139.6503)).toBe('Asia/Tokyo');
    expect(resolveTimeZone(null, 139.6503)).toBeNull();
    expect(resolveTimeZone(91, 139.6503)).toBeNull();
  });

  it('converts instants to local date and time', () => {
    expect(localParts('2026-12-03T00:00:00Z', 'Asia/Tokyo')).toEqual({ date: '2026-12-03', time: '09:00' });
    expect(localParts('invalid', 'Asia/Tokyo')).toEqual({ date: null, time: null });
    expect(localParts(null, null)).toEqual({ date: null, time: null });
  });
});
