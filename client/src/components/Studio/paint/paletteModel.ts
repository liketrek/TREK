import type { BookSpread } from '@trek/shared';
import { createContext, useContext } from 'react';

/** The palette rows' state and the pure parts of it (StudioPalette.tsx holds the provider). */

export interface StudioPaletteValue {
  /** The colours the book is drawn in, most used first. */
  book: string[];
  /** The colours of the photos on the page being edited. */
  photos: string[];
  /** What this person picked lately, newest first. */
  recent: string[];
  remember: (hex: string) => void;
  /** The labels the rows carry, in the reader's language. */
  labels: { book: string; photos: string; recent: string; opacity: string };
}

export const StudioPaletteContext = createContext<StudioPaletteValue | null>(null);

/** The palette rows, or null outside a provider (a swatch row then shows its fixed inks only). */
export function useStudioPalette(): StudioPaletteValue | null {
  return useContext(StudioPaletteContext);
}

export const RECENT_KEY = 'trek.studio.recentColours';
export const MAX_RECENT = 8;

/** The recent colours as stored. Storage can be missing or refuse; that is an empty list, not an error. */
export function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((c): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/.test(c)).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

/** A colour put first in the recent list, which keeps each colour once. */
export function withRecent(list: readonly string[], hex: string): string[] {
  const c = hex.toLowerCase();
  return [c, ...list.filter((x) => x !== c)].slice(0, MAX_RECENT);
}

export function writeRecent(list: readonly string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // A private window or a full quota: the list lives for this session only.
    return;
  }
}

/** The photo ids a page shows, placed or parked, in paint order. */
export function spreadPhotoIds(spread: BookSpread | undefined): number[] {
  if (!spread) return [];
  const ids = [...spread.elements, ...spread.parked].flatMap((e) =>
    e.kind === 'photo' && e.photoId != null ? [e.photoId] : []
  );
  return [...new Set(ids)].slice(0, 8);
}
