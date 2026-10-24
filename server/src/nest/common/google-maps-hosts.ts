/**
 * Which hosts a pasted Google Maps link may come from. Shared kernel because
 * the maps link resolver and the directions import (place-import) both follow a
 * short link through the SSRF guard and then require the landing host to be
 * Google's own.
 */

export const GOOGLE_SHORT_HOSTS = ['goo.gl', 'maps.app.goo.gl'];

/**
 * Google Maps lives on every country domain — google.de, maps.google.co.uk,
 * google.com.au — so the host is matched by shape. A fixed list of .com hosts
 * would quietly stop resolving the ccTLD links people actually paste. The TLD
 * labels stay short (2-3 letters, optionally two of them) so that
 * `google.evil.com` is not a Google host.
 */
export function isGoogleMapsHost(hostname: string): boolean {
  return GOOGLE_SHORT_HOSTS.includes(hostname) || /^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname);
}

/** No credentials, no other port, https only: the shape every hop of a walk import must have. */
function plainHttps(url: URL): boolean {
  return url.protocol === 'https:' && !url.username && !url.password && url.port === '';
}

/**
 * CW-06: the short links a walk import follows at all, `maps.app.goo.gl/<code>`
 * and `goo.gl/maps/<code>`. Anything else on goo.gl was a general shortener
 * and could lead anywhere, so it is not followed.
 */
export function isGoogleMapsShortLink(url: URL): boolean {
  if (!plainHttps(url)) return false;
  if (url.hostname === 'maps.app.goo.gl') return /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
  return url.hostname === 'goo.gl' && /^\/maps\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
}

/** CW-06: where a short link may lead: Google Maps itself, which is read and never fetched. */
export function isGoogleMapsLongLink(url: URL): boolean {
  return plainHttps(url) && isGoogleMapsHost(url.hostname) && !GOOGLE_SHORT_HOSTS.includes(url.hostname);
}
