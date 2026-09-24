import { z } from 'zod';

/**
 * A place's homepage as a source hands it over, made into an address a browser
 * opens as a page, or nothing.
 *
 * The place index, OpenStreetMap and Amap carry websites the way people type
 * them into a form: `fr.wikipedia.org/wiki/…`, `www.hotel.cn`, `//example.com`.
 * The write contract wants http(s), so a place picked from search used to be
 * refused on save over a field the dialog does not even show (#2483). Every
 * path that brings a website in from outside goes through here, and a value
 * either arrives with its scheme or does not arrive at all.
 *
 * Only the scheme is added. The rest of the text stays as it came, so an
 * accented path is not percent-encoded on the way through.
 */

/** The cap the write contract puts on the field; a longer value could not be saved. */
export const PLACE_WEBSITE_MAX_LENGTH = 500;

const HTTP_URL = /^https?:\/\//i;
// A host and an optional port. The port is what tells `example.com:8080/x`
// apart from a scheme such as `mailto:` or `javascript:`, which never match.
const HOST_AND_PORT = /^([^:/?#@\s]+)(?::\d{1,5})?$/;
const LABEL = /^[\p{L}\p{N}\p{M}_-]+$/u;
const OCTET = /^\d{1,3}$/;
const LETTER = /\p{L}/u;
const openable = z.url({ protocol: /^https?$/ });

/** Everything up to the path, the query or the fragment. */
function authorityOf(rest: string): string {
  const end = rest.search(/[/?#]/);
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * A name with at least one dot and a top-level label that has a letter in it,
 * or an IPv4 address. Without a scheme, "Chapelle", "localhost" and "3.5" are
 * not websites.
 */
function isHostName(host: string): boolean {
  const labels = host.split('.');
  if (labels.length < 2) return false;
  if (labels.every((label) => OCTET.test(label))) {
    return labels.length === 4 && labels.every((label) => Number(label) <= 255);
  }
  const valid = labels.every((label) => LABEL.test(label) && !label.startsWith('-') && !label.endsWith('-'));
  return valid && LETTER.test(labels[labels.length - 1] ?? '');
}

function hasHost(authority: string): boolean {
  const host = HOST_AND_PORT.exec(authority)?.[1];
  return host !== undefined && isHostName(host);
}

/**
 * The website a place gets from `value`, or null.
 *
 * Trimmed; http and https stay as they are whenever a browser can open them,
 * an intranet host or an IPv6 literal included, which is what the write
 * contract keeps as well. A bare host or a protocol-relative `//host` gains
 * https, and only there does the host need a dot: it is what tells a site
 * from a word. Any other scheme (`javascript:`, `data:`, `mailto:`, `ftp:`),
 * free text and anything a browser cannot parse come back as null, as does a
 * value longer than the contract allows.
 */
export function normalizePlaceWebsite(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  let url: string;
  if (HTTP_URL.test(text)) {
    url = text;
  } else if (text.startsWith('//')) {
    if (!hasHost(authorityOf(text.slice(2)))) return null;
    url = `https:${text}`;
  } else {
    if (!hasHost(authorityOf(text))) return null;
    url = `https://${text}`;
  }

  if (url.length > PLACE_WEBSITE_MAX_LENGTH) return null;
  return openable.safeParse(url).success ? url : null;
}
