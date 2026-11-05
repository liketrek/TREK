import { describe, expect, it } from 'vitest';
import { fakeIapClient, nativeIapClient, productIdFor } from './iap';

describe('in-app purchase client', () => {
  it('names store products by the shared scheme', () => {
    expect(productIdFor('start', 'month')).toBe('cloud.start.monthly');
    expect(productIdFor('pro', 'year')).toBe('cloud.pro.yearly');
  });

  it('the native client is unavailable until the purchase plugin is wired', async () => {
    expect(await nativeIapClient.isAvailable()).toBe(false);
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'failed' });
  });

  it('the fake client yields a receipt for the product asked for', async () => {
    expect(await fakeIapClient.isAvailable()).toBe(true);
    const outcome = await fakeIapClient.purchase('cloud.plus.monthly');
    expect(outcome.kind).toBe('bought');
    if (outcome.kind !== 'bought') return;
    expect(outcome.purchase.productId).toBe('cloud.plus.monthly');
    expect(outcome.purchase.platform).toBe('apple');
    expect(outcome.purchase.receipt).toContain('cloud.plus.monthly');
  });
});
