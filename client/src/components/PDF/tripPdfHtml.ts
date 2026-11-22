/*
 * The small text and URL helpers every part of the trip PDF builds its markup with.
 * The document is an HTML string assembled outside React, so every value that comes
 * from the trip goes through escHtml before it lands in it.
 */

/** Text for element content or a double-quoted attribute. */
export function escHtml(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The style attribute is decoded back into raw quotes before the CSS is parsed, so
 * escHtml alone cannot stop a cover_image from closing the url() and appending its own
 * declaration. Percent-encoding is transparent to the fetch.
 */
export function cssUrl(url: string): string {
  return url.replace(/["'()\\\s]/g, (c) => '%' + (c.codePointAt(0) ?? 0).toString(16).padStart(2, '0'));
}

/**
 * A colour that goes into a style attribute built by string concatenation. Anything
 * that is not a plain hex triple is not a colour and gets the fallback instead of a
 * chance to close the declaration.
 */
export function hexColour(value: unknown, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
}

/** A path on this server as an absolute URL, so the print frame can load it. */
export function absUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return window.location.origin + (url.startsWith('/') ? '' : '/') + url;
}

/**
 * A picture the document may load: any web URL, the in-app place-photo proxy (it
 * streams a JPEG under a path without an extension) and uploaded files with an image
 * extension. Anything else prints as the fallback tile.
 */
export function safeImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('https://') || url.startsWith('http://')) return url;
  if (url.startsWith('/api/maps/place-photo/')) return absUrl(url);
  return /\.(jpe?g|png|gif|webp|bmp|tiff?)(\?.*)?$/i.test(url) ? absUrl(url) : null;
}

/** "Mon, 5 May" in the reader's language; empty for a day without a date. */
export function shortDate(date: string | null | undefined, locale: string | undefined): string {
  if (!date) return '';
  return new Date(date + 'T00:00:00Z').toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "3 May – 24 May 2026" over the dated days, or null when none has a date. */
export function longDateRange(
  days: readonly { date?: string | null; day_number?: number }[],
  locale: string | undefined
): string | null {
  const dated = days.filter((d) => d.date).sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));
  if (!dated.length) return null;
  const first = new Date(dated[0].date + 'T00:00:00Z');
  const last = new Date(dated[dated.length - 1].date + 'T00:00:00Z');
  const from = first.toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const to = last.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `${from} – ${to}`;
}

/** The host of a website, which is what fits on a printed line. */
export function websiteHost(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}
