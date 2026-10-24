import { paddleRegionsApi } from '../api/paddleRegions';
import { isEffectivelyOffline } from '../sync/networkMode';

/** Thrown instead of asking while the app is offline, so the view can say so rather than show a failure. */
export class PaddleRegionsOfflineError extends Error {
  constructor() {
    super('Paddle regions are managed with a connection only');
    this.name = 'PaddleRegionsOfflineError';
  }
}

function online<A extends unknown[], R>(call: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  return (...args) => (isEffectivelyOffline() ? Promise.reject(new PaddleRegionsOfflineError()) : call(...args));
}

/** Why a region call was refused, from the code the server puts next to its error. */
export function paddleRegionErrorCode(err: unknown): 'offline' | 'catalog_unavailable' | 'unknown_region' | null {
  if (err instanceof PaddleRegionsOfflineError) return 'offline';
  const code = (err as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code;
  return code === 'catalog_unavailable' || code === 'unknown_region' ? code : null;
}

/**
 * PAD-05A: the instance's paddle regions. Online only on purpose: they are
 * instance administration, and a queued add or remove replayed later could
 * undo what another admin decided meanwhile.
 */
export const paddleRegionRepo = {
  list: online(paddleRegionsApi.list),
  catalog: online(paddleRegionsApi.catalog),
  add: online(paddleRegionsApi.add),
  refresh: online(paddleRegionsApi.refresh),
  remove: online(paddleRegionsApi.remove),
  decline: online(paddleRegionsApi.decline),
  settings: online(paddleRegionsApi.settings),
  saveSettings: online(paddleRegionsApi.saveSettings),
};
