import type { ValhallaRelayAction } from '@trek/shared';

/**
 * POST /api/routing/valhalla/:action: a question for the TREK services'
 * Valhalla, which this server asks with the installation key. The answer is
 * Valhalla's own, its status included, so it is handed back as a Response and
 * read like the answer of any other Valhalla. Plain fetch on purpose: the
 * shared client would turn a 401 into a sign-in redirect and a 429 into a
 * toast, where the planner only wants to ask FOSSGIS instead.
 */
export function postValhallaRelay(action: ValhallaRelayAction, body: unknown, signal?: AbortSignal): Promise<Response> {
  return fetch(`/api/routing/valhalla/${action}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}
