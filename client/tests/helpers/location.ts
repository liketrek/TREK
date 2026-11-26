// The page's own location, taken when this module loads, before any test
// replaces window.location with a stand-in.
const pageLocation = window.location;
const pageOrigin = new URL(document.baseURI).origin;

/** `path` as an absolute URL on the page's own origin, for asserting on location.href. */
export function pageUrl(path: string): string {
  return new URL(path, pageOrigin).href;
}

/**
 * A stand-in for window.location that shows `path` on the page's own origin.
 *
 * Requests have to stay on one origin for the HTTP mocks to answer them: msw
 * resolves its relative handlers, and its fetch interceptor a relative URL,
 * against location.href, while jsdom's XHR resolves against the document. A
 * stand-in on another origin (`http://localhost/` while the page runs on
 * `http://localhost:3000`) sends every request past its handler.
 */
export function locationAt(path: string, overrides: Partial<Location> = {}): Location {
  const url = new URL(path, pageOrigin);
  return {
    ...pageLocation,
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    ...overrides,
  };
}
