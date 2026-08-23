import { http, HttpResponse } from 'msw';

/**
 * Third-party endpoints the app calls directly, rather than through /api.
 *
 * Without these the call is refused: tests/setup.ts errors on an unhandled request to
 * another origin. It used to warn and then perform the request, which is how the mobile
 * FX widget reached api.frankfurter.dev from CI and settled its promise after the test
 * environment was gone, surfacing as `window is not defined` attributed to whichever
 * case happened to be running. Add the endpoint here rather than letting it out.
 *
 * An empty rate list is the shape the widget already handles: it seeds the
 * base's own self-rate and renders with nothing else selectable.
 */
export const externalHandlers = [
  http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])),
  http.get('https://api.frankfurter.dev/v2/currencies', () => HttpResponse.json({})),
];
