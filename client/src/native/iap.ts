/**
 * In-app purchase, from the app's side. A seam, like {@link TrekShell}: the
 * screens drive a plan to a receipt through this, and never touch the store
 * plugin directly. Two implementations stand behind it — a fake one for
 * development and preview, so the whole subscription flow can be walked without a
 * store, and the native one that will call the platform plugin once the store
 * products and accounts exist. Until then the native client reports itself
 * unavailable and the plan picker falls back to finishing on the web, so nothing
 * half-wired ever faces a customer.
 */

export type IapPlatform = 'apple' | 'google';

/** The receipt a completed purchase yields, in the shape `/api/iap/redeem` takes. */
export interface Purchase {
  platform: IapPlatform;
  productId: string;
  receipt: string;
}

/** What a purchase attempt came to. `cancelled` is the customer backing out, not an error. */
export type PurchaseOutcome =
  | { kind: 'bought'; purchase: Purchase }
  | { kind: 'cancelled' }
  | { kind: 'failed' };

export interface IapClient {
  /** Whether this build can take a payment: the plugin is present and the store products exist. */
  isAvailable(): Promise<boolean>;
  /** Runs the platform's purchase sheet for a product and resolves with what became of it. */
  purchase(productId: string): Promise<PurchaseOutcome>;
}

/**
 * The store product id for a plan and interval. Must match the identifiers created
 * in App Store Connect and the Play Console, and the control plane's catalog
 * (`cloud.<plan>.<monthly|yearly>`); kept here as the one place the app names them.
 */
export function productIdFor(planId: string, interval: 'month' | 'year'): string {
  return `cloud.${planId}.${interval === 'year' ? 'yearly' : 'monthly'}`;
}

/**
 * The fake used in development and preview: it waits a beat, as a real sheet
 * would, then returns a receipt the control plane's fake verifier accepts. Never
 * reached in a store build.
 */
export const fakeIapClient: IapClient = {
  async isAvailable() {
    return true;
  },
  async purchase(productId) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      kind: 'bought',
      purchase: { platform: 'apple', productId, receipt: `fake-receipt:${productId}:${Date.now()}` },
    };
  },
};

/**
 * The store client. A stub until the purchase plugin is a dependency and the
 * products exist: it reports itself unavailable, so the plan picker finishes on
 * the web instead of offering a payment it cannot take. When the plugin lands,
 * this is where it is wired; the screens do not change.
 */
export const nativeIapClient: IapClient = {
  async isAvailable() {
    return false;
  },
  async purchase() {
    return { kind: 'failed' };
  },
};

/**
 * Whether to use the fake. On in a development build, and switchable on in a
 * preview build with `localStorage['trek-iap-fake'] = '1'`, so the flow can be
 * shown without a store. Off in a store build, where the native client decides.
 */
function useFake(): boolean {
  try {
    if (import.meta.env?.DEV) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('trek-iap-fake') === '1';
  } catch {
    return false;
  }
}

export function getIapClient(): IapClient {
  return useFake() ? fakeIapClient : nativeIapClient;
}
