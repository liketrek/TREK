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
