import { BOOK_FONT_FACES, bookFacesUsed, type BookDocument, type BookFaceUse } from '@trek/shared';
import { useEffect, useMemo } from 'react';
import { useStudioStore } from '../../store/studioStore';

/**
 * The faces of the open book, loaded as soon as it opens, so it reads in its
 * own type offline as well.
 *
 * The service worker installs the latin files of the seven families the book
 * shipped with (vite.config.js); every other face is cached by its runtime
 * rule the first time it is fetched. A face the browser only fetches once
 * text is drawn in it would be cached only for the pages someone happened to
 * look at, so a book opened online and read offline later would show its
 * third chapter in the fallback. Asking for every face the book uses, with the
 * characters it sets, fetches each one now, through the worker, into that
 * cache: a face nobody uses is never downloaded.
 */

/** The book's own characters, for asking the right subsets of each face: its words, its title, the figures. */
export function bookSample(doc: BookDocument): string {
  const seen = new Set<string>('0123456789');
  const take = (s: string) => {
    for (const ch of s) if (ch.trim()) seen.add(ch);
  };
  take(doc.title);
  for (const spread of doc.spreads) {
    for (const el of spread.elements) if (el.kind === 'text') take(el.text);
  }
  // A face's subsets are chosen by its unicode ranges, so one character of each is enough; the cap keeps it short.
  return [...seen].slice(0, 512).join('');
}

/** One face as the CSS font shorthand `document.fonts.load` takes. */
export function faceSpec(use: BookFaceUse): string {
  const family = BOOK_FONT_FACES[use.font].name;
  return `${use.italic ? 'italic ' : ''}${use.weight} 16px "${family}"`;
}

type FontLoader = Pick<FontFaceSet, 'load'>;

/** Fetch every face the book needs; resolves with how many loaded, never rejects. */
export async function warmBookFaces(
  doc: BookDocument,
  fonts: FontLoader | undefined = globalThis.document?.fonts
): Promise<number> {
  if (!fonts) return 0;
  const sample = bookSample(doc);
  const loads = await Promise.allSettled(bookFacesUsed(doc).map((use) => fonts.load(faceSpec(use), sample)));
  return loads.filter((r) => r.status === 'fulfilled' && r.value.length > 0).length;
}

/**
 * Warms the faces of the book the Studio holds whenever the set of faces it
 * uses changes; typing into a text does not, so an edit costs nothing here.
 */
/** A key compares by code units: the same faces give the same key whatever the locale. */
const byCodeUnits = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function useWarmBookFaces(): void {
  const doc = useStudioStore((s) => s.doc);
  const key = useMemo(() => (doc ? bookFacesUsed(doc).map(faceSpec).sort(byCodeUnits).join('|') : ''), [doc]);
  useEffect(() => {
    const current = useStudioStore.getState().doc;
    // A face that will not load is drawn in its fallback, which the picker already shows; nothing to tell anyone.
    if (key && current) void warmBookFaces(current);
  }, [key]);
}
