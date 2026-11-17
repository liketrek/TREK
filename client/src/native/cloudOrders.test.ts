import { describe, expect, it } from 'vitest';
import { opensSoon, refundedBeforeOpening } from './cloudOrders';

describe('opensSoon', () => {
  const base = { available: true, closed: true, sandbox: false, onPlay: false };

  it('FE-NATIVE-ORDERS-001: closed orders hide the purchase from an App Store build', () => {
    expect(opensSoon(base)).toBe(true);
  });

  it('FE-NATIVE-ORDERS-002: a TestFlight build may buy while orders are closed', () => {
    expect(opensSoon({ ...base, sandbox: true })).toBe(false);
  });

  it('FE-NATIVE-ORDERS-003: an Android release build keeps the purchase while orders are closed', () => {
    expect(opensSoon({ ...base, onPlay: true })).toBe(false);
  });

  it('FE-NATIVE-ORDERS-004: open orders and a binary without a store never say "opens soon"', () => {
    expect(opensSoon({ ...base, closed: false })).toBe(false);
    expect(opensSoon({ ...base, available: false })).toBe(false);
  });
});

describe('refundedBeforeOpening', () => {
  it('FE-NATIVE-ORDERS-005: a purchase refused as ordering-closed on Android is the refunded one', () => {
    expect(refundedBeforeOpening('ordering-closed', true)).toBe(true);
  });

  it('FE-NATIVE-ORDERS-006: other refusals, and ordering-closed on iOS, keep the general message', () => {
    expect(refundedBeforeOpening('ordering-closed', false)).toBe(false);
    expect(refundedBeforeOpening('redeem-failed', true)).toBe(false);
    expect(refundedBeforeOpening(undefined, true)).toBe(false);
  });
});
