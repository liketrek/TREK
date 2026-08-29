import { ReplicaFailureDebouncer } from '../../../../src/nest/notifications/replica-failure-debouncer';

import { describe, it, expect } from 'vitest';

const HOUR = 60 * 60 * 1000;

describe('ReplicaFailureDebouncer', () => {
  it('DEB-001 first failure per backend is admitted with suppressed=0', () => {
    let now = 1_000_000;
    const debouncer = new ReplicaFailureDebouncer(HOUR, () => now);
    expect(debouncer.admit('s3-bkp')).toBe(0);
  });

  it('DEB-002 failures inside the window are suppressed; the next one after it carries the count', () => {
    let now = 1_000_000;
    const debouncer = new ReplicaFailureDebouncer(HOUR, () => now);
    expect(debouncer.admit('s3-bkp')).toBe(0);
    now += 1000;
    expect(debouncer.admit('s3-bkp')).toBeNull();
    expect(debouncer.admit('s3-bkp')).toBeNull();
    now += HOUR;
    expect(debouncer.admit('s3-bkp')).toBe(2); // the two suppressed ones ride the summary
    now += 1000;
    expect(debouncer.admit('s3-bkp')).toBeNull(); // window reset
  });

  it('DEB-003 backends debounce independently', () => {
    let now = 1_000_000;
    const debouncer = new ReplicaFailureDebouncer(HOUR, () => now);
    expect(debouncer.admit('a')).toBe(0);
    expect(debouncer.admit('b')).toBe(0);
    expect(debouncer.admit('a')).toBeNull();
    expect(debouncer.admit('b')).toBeNull();
  });
});
