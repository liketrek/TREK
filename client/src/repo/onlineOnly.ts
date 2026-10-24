import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * What an online-only repository call answers while there is no connection:
 * nothing read or written, and the view says why instead of a failure.
 */
export class OnlineOnlyError extends Error {
  constructor() {
    super('This needs a connection');
    this.name = 'OnlineOnlyError';
  }
}

export function requireOnline(): void {
  if (isEffectivelyOffline()) throw new OnlineOnlyError();
}
