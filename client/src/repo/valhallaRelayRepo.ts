import { compactValhallaRequest, type ValhallaRelayAction } from '@trek/shared';
import { postValhallaRelay } from '../api/valhallaRelay';

/**
 * Routing through the TREK services. **Deliberately online-only and without a
 * Dexie table:** a route is asked for while planning, and the routes worth
 * keeping are kept by the route cache, whichever router drew them. A line to
 * describe goes as a polyline, which keeps a long one under the relay's limit.
 */
export const valhallaRelayRepo = {
  ask(action: ValhallaRelayAction, body: object, signal?: AbortSignal): Promise<Response> {
    return postValhallaRelay(action, compactValhallaRequest(action, body), signal);
  },
};
