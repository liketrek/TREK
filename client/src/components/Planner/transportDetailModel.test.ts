// FE-PLANNER-TRANSPORTDETAIL-001 to -002: the labels the desktop transport detail
// and the phone transport sheet both read off a booking.
import { describe, expect, it } from 'vitest';

import { bookingDayLabel, segmentCodeLabel } from './transportDetailModel';

const t = (key: string) => `t:${key}`;

describe('transportDetailModel', () => {
  it('FE-PLANNER-TRANSPORTDETAIL-001: the day reads as weekday, day and month, on the calendar date itself', () => {
    expect(bookingDayLabel('2026-07-01', 'en-US')).toBe('Wed, Jul 1');
    expect(bookingDayLabel('2026-12-31', 'en-US')).toBe('Thu, Dec 31');
  });

  it('FE-PLANNER-TRANSPORTDETAIL-002: a segment code is listed under its route, or the plain code label', () => {
    expect(segmentCodeLabel({ from: 'MUC', to: 'FRA' }, t)).toBe('MUC → FRA');
    expect(segmentCodeLabel({ from: 'MUC', to: null }, t)).toBe('MUC');
    expect(segmentCodeLabel({ to: 'FRA' }, t)).toBe('FRA');
    expect(segmentCodeLabel({ from: null, to: '' }, t)).toBe('t:reservations.confirmationCode');
  });
});
