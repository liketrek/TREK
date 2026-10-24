import {
  BOOK_THEME_IDS,
  bookPaletteFromPhotos,
  bookThemeOf,
  compareCodeUnits,
  setBookTheme,
  type BookFontSlot,
  type BookPaletteKey,
  type BookTheme,
  type BookThemeDecoration,
  type BookThemeId,
  type BookThemeMotif,
  type SetBookThemeRequest,
} from '@trek/shared';
import { useCallback, useMemo, useState } from 'react';
import { useStudioStore } from '../../../store/studioStore';
import { photoSrc } from '../bookRender';
import { bookPhotoIds, readPhotoSwatches } from './themePhotoColours';

/**
 * The Theme panel's state: the theme being put together (a draft, so trying
 * colours costs nothing until it is applied), and applying it through the
 * same `setBookTheme` the assistant's `set_book_theme` runs, so the panel and
 * the assistant cannot recolour a book two different ways.
 */

/** What an apply did: how many pages changed, or null when the book refused it (read-only, no book). */
type ThemeApplyResult = { pages: number } | null;

/** The theme a book without one starts the panel on: the first of the list. */
const firstTheme = (): BookTheme => bookThemeOf(BOOK_THEME_IDS[0]);

/** The draft as `set_book_theme` takes it: the whole of it, so the result is exactly what the panel shows. */
export function themeRequest(draft: BookTheme, spreadIds: string[] | undefined, adopt: boolean): SetBookThemeRequest {
  return {
    ...(draft.id ? { theme: draft.id } : {}),
    palette: { ...draft.palette },
    fonts: { ...draft.fonts },
    motifs: [...draft.motifs],
    decoration: draft.decoration,
    ...(spreadIds ? { spreadIds } : {}),
    adopt,
  };
}

/** A theme as text, its keys in one order at every depth, so the same theme read twice compares equal. */
function themeKey(theme: BookTheme | undefined): string {
  if (!theme) return '';
  return JSON.stringify(theme, (_key, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => compareCodeUnits(a, b)));
  });
}

/** Whether a draft differs from the built-in theme it is named after. */
export function isEdited(draft: BookTheme): boolean {
  if (!draft.id) return false;
  return JSON.stringify(draft) !== JSON.stringify(bookThemeOf(draft.id));
}

export function useStudioTheme() {
  const doc = useStudioStore((s) => s.doc);
  const active = useStudioStore((s) => s.activeSpread);
  const readOnly = useStudioStore((s) => s.readOnly);
  const commit = useStudioStore((s) => s.commit);
  const current = doc?.theme;

  const [draft, setDraft] = useState<BookTheme>(() => current ?? firstTheme());
  const [adopt, setAdopt] = useState(true);
  const [reading, setReading] = useState(false);

  // The book's theme changed under the panel (applied, undone, another editor): the draft follows it,
  // set while rendering rather than in an effect, so the panel never paints the old draft first. Compared
  // by what it says, not by identity: a save from elsewhere reads the same theme in anew, and must not
  // throw away colours being tried here.
  const currentKey = useMemo(() => themeKey(current), [current]);
  const [seen, setSeen] = useState(currentKey);
  if (seen !== currentKey) {
    setSeen(currentKey);
    if (current) setDraft(current);
  }

  const pick = useCallback((id: BookThemeId) => setDraft(bookThemeOf(id)), []);
  const setColour = useCallback(
    (key: BookPaletteKey, hex: string) => setDraft((d) => ({ ...d, palette: { ...d.palette, [key]: hex } })),
    []
  );
  const setFont = useCallback(
    (slot: BookFontSlot, font: string | null, weight?: number) =>
      setDraft((d) => {
        if (font === null) return slot === 'script' ? { ...d, fonts: { ...d.fonts, script: null } } : d;
        // A family picked by hand is set upright, at the weight the picker snapped to that family.
        return { ...d, fonts: { ...d.fonts, [slot]: weight === undefined ? { font } : { font, weight } } };
      }),
    []
  );
  const toggleMotif = useCallback(
    (motif: BookThemeMotif) =>
      setDraft((d) => ({
        ...d,
        motifs: d.motifs.includes(motif) ? d.motifs.filter((m) => m !== motif) : [...d.motifs, motif],
      })),
    []
  );
  const setDecoration = useCallback((decoration: BookThemeDecoration) => setDraft((d) => ({ ...d, decoration })), []);
  const reset = useCallback(() => setDraft((d) => (d.id ? bookThemeOf(d.id) : d)), []);

  const photoIds = useMemo(() => bookPhotoIds(doc), [doc]);

  /** Accents from the book's photos. Resolves false when the photos give no colour to take. */
  const fromPhotos = useCallback(async (): Promise<boolean> => {
    setReading(true);
    try {
      const swatches = await Promise.all(photoIds.map((id) => readPhotoSwatches(photoSrc(id, false))));
      const palette = bookPaletteFromPhotos(draft.palette, swatches);
      if (palette) setDraft((d) => ({ ...d, palette }));
      return palette !== null;
    } finally {
      setReading(false);
    }
  }, [photoIds, draft.palette]);

  const apply = useCallback(
    (scope: 'book' | 'page'): ThemeApplyResult => {
      const spread = doc?.spreads[active];
      if (!doc || readOnly || (scope === 'page' && !spread)) return null;
      let result: ThemeApplyResult = null;
      commit((d) => {
        const made = setBookTheme(d, themeRequest(draft, scope === 'page' && spread ? [spread.id] : undefined, adopt));
        if (!made.ok) return d;
        result = { pages: made.spreadIds.length };
        return made.doc;
      });
      return result;
    },
    [doc, active, readOnly, commit, draft, adopt]
  );

  return {
    draft,
    current,
    edited: isEdited(draft),
    adopt,
    setAdopt,
    reading,
    hasPhotos: photoIds.length > 0,
    canApply: !!doc && !readOnly,
    pick,
    setColour,
    setFont,
    toggleMotif,
    setDecoration,
    reset,
    fromPhotos,
    apply,
  };
}
