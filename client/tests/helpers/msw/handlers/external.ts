import { http, HttpResponse } from 'msw';

/**
 * Third-party endpoints the app calls directly, rather than through /api.
 *
 * Without these the request leaves the runner: MSW is started with
 * `onUnhandledRequest: 'warn'`, so an unmatched call is a warning and a live
 * network round trip, not a failure. That is how the mobile FX widget reached
 * api.frankfurter.dev from CI and settled its promise after the test
 * environment was gone, surfacing as `window is not defined` attributed to
 * whichever case happened to be running.
 *
 * An empty rate list is the shape the widget already handles: it seeds the
 * base's own self-rate and renders with nothing else selectable.
 */
export const externalHandlers = [
  http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])),
  http.get('https://api.frankfurter.dev/v2/currencies', () => HttpResponse.json({})),
];
