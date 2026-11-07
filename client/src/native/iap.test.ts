import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ ios: true }));
const shell = vi.hoisted(() => ({
  getCapabilities: vi.fn(),
  storeProducts: vi.fn(),
  storePurchase: vi.fn(),
  storeFinish: vi.fn(),
  storeRestore: vi.fn(),
}));

vi.mock('./platform', () => ({ isNativeIos: () => platform.ios }));
vi.mock('./trekShell', () => ({ TrekShell: shell }));

import { fakeIapClient, nativeIapClient, productIdFor } from './iap';

/** A signed transaction as far as the client reads it: only the payload matters here. */
function jwsFor(productId: string): string {
  const payload = btoa(JSON.stringify({ productId })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

beforeEach(() => {
  platform.ios = true;
  for (const fn of Object.values(shell)) fn.mockReset();
});

describe('in-app purchase client', () => {
  it('names store products by the shared scheme', () => {
    expect(productIdFor('start', 'month')).toBe('cloud.start.monthly');
    expect(productIdFor('pro', 'year')).toBe('cloud.pro.yearly');
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

describe('native client', () => {
  it('is available only on iOS with the storeKit feature', async () => {
    shell.getCapabilities.mockResolvedValue({ features: ['storeKit'] });
    expect(await nativeIapClient.isAvailable()).toBe(true);

    shell.getCapabilities.mockResolvedValue({ features: ['widgets'] });
    expect(await nativeIapClient.isAvailable()).toBe(false);

    shell.getCapabilities.mockRejectedValue({ code: 'UNIMPLEMENTED' });
    expect(await nativeIapClient.isAvailable()).toBe(false);

    platform.ios = false;
    shell.getCapabilities.mockResolvedValue({ features: ['storeKit'] });
    expect(await nativeIapClient.isAvailable()).toBe(false);
  });

  it('maps the store price strings by product', async () => {
    shell.storeProducts.mockResolvedValue({ products: [{ id: 'cloud.plus.monthly', displayPrice: '9,99 €' }] });
    const prices = await nativeIapClient.prices(['cloud.plus.monthly', 'cloud.pro.monthly']);
    expect(shell.storeProducts).toHaveBeenCalledWith({ ids: ['cloud.plus.monthly', 'cloud.pro.monthly'] });
    expect(prices.get('cloud.plus.monthly')).toBe('9,99 €');
    expect(prices.has('cloud.pro.monthly')).toBe(false);

    shell.storeProducts.mockRejectedValue(new Error('down'));
    expect((await nativeIapClient.prices(['cloud.plus.monthly'])).size).toBe(0);
  });

  it('turns a bought transaction into a receipt', async () => {
    shell.storePurchase.mockResolvedValue({ kind: 'bought', jws: 'signed', transactionId: '42' });
    expect(await nativeIapClient.purchase('cloud.plus.yearly')).toEqual({
      kind: 'bought',
      purchase: { platform: 'apple', productId: 'cloud.plus.yearly', receipt: 'signed', transactionId: '42' },
    });
  });

  it('passes cancel and pending through, and fails on anything else', async () => {
    shell.storePurchase.mockResolvedValue({ kind: 'cancelled' });
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'cancelled' });
    shell.storePurchase.mockResolvedValue({ kind: 'pending' });
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'pending' });
    shell.storePurchase.mockResolvedValue({ kind: 'bought' });
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'failed' });
    shell.storePurchase.mockRejectedValue(new Error('boom'));
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'failed' });
  });

  it('finishes by transaction id and swallows a failure', async () => {
    const purchase = { platform: 'apple' as const, productId: 'cloud.plus.monthly', receipt: 'x', transactionId: '7' };
    shell.storeFinish.mockResolvedValue(undefined);
    await nativeIapClient.finish(purchase);
    expect(shell.storeFinish).toHaveBeenCalledWith({ transactionId: '7' });
    shell.storeFinish.mockRejectedValue(new Error('gone'));
    await expect(nativeIapClient.finish(purchase)).resolves.toBeUndefined();
  });

  it('restores the subscription the Apple ID holds, with its product', async () => {
    const jws = jwsFor('cloud.pro.yearly');
    shell.storeRestore.mockResolvedValue({ jws, transactionId: '9' });
    expect(await nativeIapClient.restore()).toEqual({
      platform: 'apple',
      productId: 'cloud.pro.yearly',
      receipt: jws,
      transactionId: '9',
    });
    expect(shell.storeRestore).toHaveBeenCalledWith({ prefix: 'cloud.' });

    shell.storeRestore.mockResolvedValue({});
    expect(await nativeIapClient.restore()).toBeNull();
  });
});
