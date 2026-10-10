import { appClock } from '../../../src/nest/common/timezoneService';

import { afterEach, describe, expect, it } from 'vitest';

describe('appClock', () => {
  const realTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = realTz;
  });

  it('APPCLOCK-001: reads the date and time where the instance runs, not in UTC', () => {
    process.env.TZ = 'Australia/Sydney';
    // 23:30 UTC on the 6th is 10:30 on the 7th in Sydney.
    expect(appClock(new Date('2026-10-06T23:30:00Z'))).toEqual({ date: '2026-10-07', time: '10:30' });
  });

  it('APPCLOCK-002: falls back to UTC without a TZ, and for one Intl does not know', () => {
    delete process.env.TZ;
    expect(appClock(new Date('2026-10-06T23:30:00Z'))).toEqual({ date: '2026-10-06', time: '23:30' });
    process.env.TZ = 'Not/AZone';
    expect(appClock(new Date('2026-10-06T23:30:00Z'))).toEqual({ date: '2026-10-06', time: '23:30' });
  });
});
