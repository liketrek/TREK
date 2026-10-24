import { BOOK_FONT_FACES, BOOK_FONTS_PRECACHED } from '@trek/shared';

/**
 * Which font files the service worker installs with the app.
 *
 * The precache takes every woff and woff2 the build emits, and with the book's
 * catalogue at thirty four families that is every weight, both styles and
 * every script subset of each: megabytes fetched at install by every user,
 * most of it for faces no book of theirs is set in. So the book's faces are
 * held to this:
 *
 * - The faces the app itself draws (Poppins and MuseoModerno for the chrome,
 *   imported in src/main.tsx) stay exactly as they were.
 * - The faces the book shipped with before the catalogue grew
 *   (`BOOK_FONTS_PRECACHED`) keep their latin woff2, so a book set in them
 *   still opens offline before Studio was ever opened online.
 * - Every other file of a book family, woff, other subsets, new families,
 *   real italics, is left to the `book-fonts` runtime cache in vite.config.js,
 *   which the Studio fills with the faces of each book it opens
 *   (src/components/Studio/bookFontWarm.ts).
 *
 * Shared by vite.config.js and its test, which reads the filter against file
 * names as the build writes them.
 */

/** The faces src/main.tsx imports for the app chrome, which the book shares; bookFontPrecache.test.ts checks this copy. */
export const APP_FACES = {
  poppins: [300, 400, 500, 600, 700],
  museomoderno: [400, 700, 800],
};

/** The book packages, longest name first, so `dm-serif-display` is never read as `dm-…`. */
const BOOK_PACKAGES = [...new Set(Object.values(BOOK_FONT_FACES).map((f) => f.pkg))].sort(
  (a, b) => b.length - a.length
);

const PRECACHED = new Map(
  Object.entries(BOOK_FONTS_PRECACHED).map(([id, weights]) => [BOOK_FONT_FACES[id].pkg, new Set(weights)])
);

/**
 * A font file as the build names it, `<package>-<subset>-<weight>-<style>-<hash>.<ext>`,
 * read against the book's packages; null for any other file.
 */
export function bookFontFile(url) {
  const name = url.split('/').pop() ?? '';
  const match = /^(.+)-(\d{3})-(normal|italic)-[\w-]+\.(woff2?)$/.exec(name);
  if (!match) return null;
  const [, head, weight, style, ext] = match;
  const pkg = BOOK_PACKAGES.find((p) => head.startsWith(`${p}-`));
  if (!pkg) return null;
  return { pkg, subset: head.slice(pkg.length + 1), weight: Number(weight), italic: style === 'italic', ext };
}

/** Whether a file of the build goes into the install-time precache. */
export function keepInPrecache(url) {
  const file = bookFontFile(url);
  if (!file) return true;
  if (!file.italic && APP_FACES[file.pkg]?.includes(file.weight)) return true;
  const kept = PRECACHED.get(file.pkg);
  return !file.italic && file.subset === 'latin' && file.ext === 'woff2' && !!kept?.has(file.weight);
}

/** The precache manifest without the book faces left to the runtime cache: a Workbox `manifestTransforms` entry. */
export function withoutRuntimeFonts(entries) {
  return { manifest: entries.filter((entry) => keepInPrecache(entry.url)), warnings: [] };
}
