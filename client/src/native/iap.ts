import { isNativeIos } from './platform';
import { TrekShell } from './trekShell';

/**
 * In-app purchase, from the app's side. A seam, like {@link TrekShell}: the
 * screens drive a plan to a receipt through this, and never touch StoreKit
 * directly. Two implementations stand behind it: a fake one for development and
 * preview, so the whole subscription flow can be walked without a store, and the
 * native one that runs StoreKit 2 through TrekShell (feature storeKit). Where
 * neither can take a payment (Android until Play Billing is wired, a binary from
 * before storeKit) the client reports itself unavailable and the shell offers no
 * purchase at all: the store rules leave no room for sending buyers to the web.
 */

type IapPlatform = 'apple' | 'google';

/** The receipt a completed purchase yields, in the shape `/api/iap/redeem` takes. */
export interface Purchase {
  platform: IapPlatform;
  productId: string;
  /** Apple: the signed transaction (JWS) the control plane verifies. */
  receipt: string;
  /** The store's id for this transaction, handed back to {@link IapClient.finish}. */
  transactionId: string;
}

/**
 * What a purchase attempt came to. `cancelled` is the customer backing out, not
 * an error; `pending` is a purchase waiting on someone else (Ask to Buy, a bank),
 * which a restore picks up once it goes through.
 */
type PurchaseOutcome =
  { kind: 'bought'; purchase: Purchase } | { kind: 'cancelled' } | { kind: 'pending' } | { kind: 'failed' };

export interface IapClient {
  /** Whether this build can take a payment. */
  isAvailable(): Promise<boolean>;
  /**
   * The store's own price strings by product id, in the buyer's currency. A
   * product missing from the map cannot be bought here. Empty for the fake, whose
   * prices come from the plan list.
   */
  prices(productIds: string[]): Promise<Map<string, string>>;
  /** A test build (TestFlight, App Review), whose purchases cost nothing and may go ahead before the opening. */
  isSandbox(): Promise<boolean>;
  /** Runs the platform's purchase sheet for a product and resolves with what became of it. */
  purchase(productId: string): Promise<PurchaseOutcome>;
  /** Tells the store a purchase was delivered, once its instance exists. */
  finish(purchase: Purchase): Promise<void>;
  /** The subscription this store account already holds, for a reinstall or a new device. */
  restore(): Promise<Purchase | null>;
}

/** Every store product of the cloud starts with this. */
const PRODUCT_PREFIX = 'cloud.';

/**
 * The store product id for a plan and interval. Must match the identifiers created
 * in App Store Connect and the Play Console, and the control plane's catalog
 * (`cloud.<plan>.<monthly|yearly>`); kept here as the one place the app names them.
 */
export function productIdFor(planId: string, interval: 'month' | 'year'): string {
  return `${PRODUCT_PREFIX}${planId}.${interval === 'year' ? 'yearly' : 'monthly'}`;
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
  async prices() {
    return new Map();
  },
  async isSandbox() {
    return true;
  },
  async purchase(productId) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    const nonce = String(Date.now());
    return {
      kind: 'bought',
      purchase: { platform: 'apple', productId, receipt: `fake-receipt:${productId}:${nonce}`, transactionId: nonce },
    };
  },
  async finish() {},
  async restore() {
    return null;
  },
};

/**
 * StoreKit 2 through TrekShell. Available on iOS when the binary has the
 * storeKit feature; everywhere else (Android, the web, an older binary) it
 * reports itself unavailable and every call comes to nothing.
 */
export const nativeIapClient: IapClient = {
  async isAvailable() {
    if (!isNativeIos()) return false;
    try {
      const caps = await TrekShell.getCapabilities();
      return caps.features.includes('storeKit');
    } catch {
      return false;
    }
  },
  async prices(productIds) {
    try {
      const { products } = await TrekShell.storeProducts({ ids: productIds });
      return new Map(products.map((p) => [p.id, p.displayPrice]));
    } catch {
      return new Map();
    }
  },
  async isSandbox() {
    try {
      return (await TrekShell.storeProducts({ ids: [] })).sandbox === true;
    } catch {
      return false;
    }
  },
  async purchase(productId) {
    try {
      const result = await TrekShell.storePurchase({ productId });
      if (result.kind === 'bought' && result.jws && result.transactionId) {
        return {
          kind: 'bought',
          purchase: { platform: 'apple', productId, receipt: result.jws, transactionId: result.transactionId },
        };
      }
      if (result.kind === 'cancelled' || result.kind === 'pending') return { kind: result.kind };
      return { kind: 'failed' };
    } catch {
      return { kind: 'failed' };
    }
  },
  async finish(purchase) {
    try {
      await TrekShell.storeFinish({ transactionId: purchase.transactionId });
    } catch {
      // Left unfinished, the store hands the transaction over again; a restore redeems it idempotently.
    }
  },
  async restore() {
    try {
      const { jws, transactionId } = await TrekShell.storeRestore({ prefix: PRODUCT_PREFIX });
      if (!jws || !transactionId) return null;
      return { platform: 'apple', productId: productIdOf(jws), receipt: jws, transactionId };
    } catch {
      return null;
    }
  },
};

/**
 * The product id inside a signed transaction, read for display and routing only:
 * the control plane verifies the signature and takes the product from there.
 */
function productIdOf(jws: string): string {
  try {
    const part = jws.split('.')[1] ?? '';
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const id = (JSON.parse(json) as { productId?: unknown }).productId;
    return typeof id === 'string' ? id : '';
  } catch {
    return '';
  }
}

/**
 * Whether to use the fake. On in a development build, and switchable on in a
 * preview build with `localStorage['trek-iap-fake'] = '1'`, so the flow can be
 * shown without a store. Off in a store build, where the native client decides.
 */
function fakeEnabled(): boolean {
  try {
    if (import.meta.env?.DEV) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('trek-iap-fake') === '1';
  } catch {
    return false;
  }
}

export function getIapClient(): IapClient {
  return fakeEnabled() ? fakeIapClient : nativeIapClient;
}
