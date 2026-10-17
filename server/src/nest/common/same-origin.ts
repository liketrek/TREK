/**
 * Whether a browser `Origin` names the very host the request was sent to.
 *
 * `ALLOWED_ORIGINS` exists to let OTHER origins in. A request whose Origin is the
 * instance's own host is not cross-origin at all, yet a browser still attaches the
 * header to every POST and to every WebSocket upgrade. Checking only the list
 * turned an ordinary login into a refusal as soon as the list and the address in
 * the address bar differed in any way (another hostname, the LAN IP, http against
 * https), which is #2543.
 *
 * The comparison is against the `Host` header only. The browser sets it from the
 * URL it was asked to load, and a page on another site cannot choose it, so a
 * foreign Origin never matches. `X-Forwarded-Host` is deliberately not consulted:
 * that one is client-controlled unless a proxy overwrites it.
 *
 * The scheme is compared through the host normalisation only (a default port on
 * the Host header is dropped for the Origin's own scheme), not for equality: TLS
 * usually ends at a reverse proxy, so the server itself cannot tell which scheme
 * the page was loaded over.
 */
export function isSameHostOrigin(origin: string | undefined, hostHeader: string | undefined): boolean {
  if (!origin || !hostHeader) return false;
  const host = hostHeader.trim();
  // A Host is a hostname with an optional port, nothing that a URL parser would
  // read as userinfo, a path or a query.
  if (!host || /[\s/\\@?#]/.test(host)) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false; // `null` and anything else that is not a URL
  }
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') return false;
  try {
    const requestHost = new URL(`${originUrl.protocol}//${host}`).host;
    return requestHost !== '' && requestHost === originUrl.host;
  } catch {
    return false;
  }
}
