import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ ios: true, android: false }));
const shell = vi.hoisted(() => ({
  getCapabilities: vi.fn(),
  storeProducts: vi.fn(),
  storePurchase: vi.fn(),
  storeFinish: vi.fn(),
  storeRestore: vi.fn(),
  storeUnfinished: vi.fn(),
  storeHeld: vi.fn(),
  addListener: vi.fn(),
}));

vi.mock('./platform', () => ({ isNativeIos: () => platform.ios, isNativeAndroid: () => platform.android }));
vi.mock('./trekShell', () => ({ TrekShell: shell }));

import { fakeIapClient, nativeIapClient, productIdFor } from './iap';

/** A signed transaction as far as the client reads it: only the payload matters here. */
function jwsFor(productId: string): string {
  const payload = btoa(JSON.stringify({ productId })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

beforeEach(() => {
  platform.ios = true;
  platform.android = false;
  for (const fn of Object.values(shell)) fn.mockReset();
});

describe('in-app purchase client', () => {
  it('names store products by the shared scheme', () => {
    expect(productIdFor('start', 'month')).toBe('cloud.start.monthly');
    expect(productIdFor('pro', 'year')).toBe('cloud.pro.yearly');
  });

  it('the fake client can play a store account that already holds a subscription', async () => {
    localStorage.setItem('trek-iap-fake-held', '1');
    try {
      expect(await fakeIapClient.held()).toBe(true);
      expect(await fakeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'subscribed' });
    } finally {
      localStorage.removeItem('trek-iap-fake-held');
    }
    expect(await fakeIapClient.held()).toBe(false);
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

  it('knows a test build from a store one, and takes an error for a store build', async () => {
    shell.storeProducts.mockResolvedValue({ products: [], sandbox: true });
    expect(await nativeIapClient.isSandbox()).toBe(true);
    expect(shell.storeProducts).toHaveBeenCalledWith({ ids: [] });
    shell.storeProducts.mockResolvedValue({ products: [] });
    expect(await nativeIapClient.isSandbox()).toBe(false);
    shell.storeProducts.mockRejectedValue(new Error('no store'));
    expect(await nativeIapClient.isSandbox()).toBe(false);
    expect(await fakeIapClient.isSandbox()).toBe(true);
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

  it('says when the store account already holds a subscription, and buys nothing then', async () => {
    shell.storePurchase.mockResolvedValue({ kind: 'subscribed' });
    expect(await nativeIapClient.purchase('cloud.plus.monthly')).toEqual({ kind: 'subscribed' });
    shell.storeHeld.mockResolvedValue({ held: true });
    expect(await nativeIapClient.held()).toBe(true);
    expect(shell.storeHeld).toHaveBeenCalledWith({ prefix: 'cloud.' });
    shell.storeHeld.mockResolvedValue({ held: false });
    expect(await nativeIapClient.held()).toBe(false);
  });

  it('a build without storeHeld counts as holding nothing; the purchase still guards', async () => {
    shell.storeHeld.mockRejectedValue(new Error('not implemented'));
    expect(await nativeIapClient.held()).toBe(false);
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

describe('native client on Android (Google Play Billing)', () => {
  beforeEach(() => {
    platform.ios = false;
    platform.android = true;
  });

  it('is available with the playBilling feature, not with storeKit', async () => {
    shell.getCapabilities.mockResolvedValue({ features: ['playBilling'] });
    expect(await nativeIapClient.isAvailable()).toBe(true);
    shell.getCapabilities.mockResolvedValue({ features: ['storeKit'] });
    expect(await nativeIapClient.isAvailable()).toBe(false);
  });

  it('a bought subscription yields the purchase token as a Google receipt', async () => {
    shell.storePurchase.mockResolvedValue({
      kind: 'bought',
      purchaseToken: 'token-1',
      transactionId: 'token-1',
      productId: 'cloud.plus.yearly',
    });
    const outcome = await nativeIapClient.purchase('cloud.plus.yearly');
    expect(outcome).toEqual({
      kind: 'bought',
      purchase: { platform: 'google', productId: 'cloud.plus.yearly', receipt: 'token-1', transactionId: 'token-1' },
    });
    shell.storePurchase.mockResolvedValue({ kind: 'pending' });
    expect(await nativeIapClient.purchase('cloud.plus.yearly')).toEqual({ kind: 'pending' });
    shell.storePurchase.mockResolvedValue({ kind: 'bought' });
    expect(await nativeIapClient.purchase('cloud.plus.yearly')).toEqual({ kind: 'failed' });
  });

  it('a restore finds the subscription on the Google account, and acknowledges through finish', async () => {
    shell.storeRestore.mockResolvedValue({
      purchaseToken: 'token-2',
      transactionId: 'token-2',
      productId: 'cloud.start.monthly',
    });
    const purchase = await nativeIapClient.restore();
    expect(purchase).toEqual({
      platform: 'google',
      productId: 'cloud.start.monthly',
      receipt: 'token-2',
      transactionId: 'token-2',
    });
    shell.storeRestore.mockResolvedValue({});
    expect(await nativeIapClient.restore()).toBeNull();
    shell.storeFinish.mockResolvedValue(undefined);
    if (!purchase) throw new Error('expected the restored purchase');
    await nativeIapClient.finish(purchase);
    expect(shell.storeFinish).toHaveBeenCalledWith({ transactionId: 'token-2' });
  });

  it('hands a payment that cleared later over to the shell, and tells it when one clears', async () => {
    shell.storeUnfinished.mockResolvedValue({
      purchaseToken: 'late',
      transactionId: 'late',
      productId: 'cloud.plus.monthly',
    });
    expect(await nativeIapClient.unfinished()).toEqual({
      platform: 'google',
      productId: 'cloud.plus.monthly',
      receipt: 'late',
      transactionId: 'late',
    });
    expect(shell.storeUnfinished).toHaveBeenCalledWith({ prefix: 'cloud.' });
    shell.storeUnfinished.mockResolvedValue({});
    expect(await nativeIapClient.unfinished()).toBeNull();
    shell.storeUnfinished.mockRejectedValue({ code: 'UNIMPLEMENTED' });
    expect(await nativeIapClient.unfinished()).toBeNull();

    shell.addListener.mockResolvedValue({ remove: vi.fn() });
    const listener = vi.fn();
    nativeIapClient.onTransaction(listener);
    const [event, handler] = shell.addListener.mock.calls[0] as [string, () => void];
    expect(event).toBe('storeTransaction');
    handler();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('on iOS leaves an interrupted purchase to the restore, as StoreKit does', async () => {
    platform.ios = true;
    platform.android = false;
    expect(await nativeIapClient.unfinished()).toBeNull();
    nativeIapClient.onTransaction(vi.fn());
    expect(shell.storeUnfinished).not.toHaveBeenCalled();
    expect(shell.addListener).not.toHaveBeenCalled();
  });
});
