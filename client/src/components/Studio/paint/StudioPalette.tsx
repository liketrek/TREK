import { bookColours, type BookDocument, type BookSpread, type PaletteSwatch } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStudioStore } from '../../../store/studioStore';
import { photoSrc } from '../bookRender';
import {
  StudioPaletteContext,
  readRecent,
  spreadPhotoIds,
  withRecent,
  writeRecent,
  type StudioPaletteValue,
} from './paletteModel';
import { photoSwatches, readPhotoPalette } from './photoPalette';

/**
 * The colours every swatch row in the inspector offers beside its fixed inks:
 * the book's own, the ones in the page's photographs, and the ones this
 * person picked lately.
 *
 * A context rather than props, because the swatch rows sit at every depth of
 * the inspector, the travel elements' panels included, and each of them
 * should offer the same three rows without every caller passing them down.
 */

/** The palettes of the page's photos, read once per photo for as long as the inspector is open. */
function usePhotoColours(photoIds: readonly number[]): string[] {
  const [read, setRead] = useState<ReadonlyMap<number, PaletteSwatch[]>>(() => new Map());
  // The ids travel as one string, so a new array holding the same photos reads nothing again.
  const key = photoIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',').map(Number) : [];
    const missing = ids.filter((id) => !read.has(id));
    if (!missing.length) return;
    const ctrl = new AbortController();
    void Promise.all(
      missing.map(async (id) => [id, await readPhotoPalette(photoSrc(id, false), ctrl.signal)] as const)
    ).then((found) => {
      if (ctrl.signal.aborted) return;
      setRead((prev) => new Map([...prev, ...found]));
    });
    return () => ctrl.abort();
  }, [key, read]);

  return useMemo(() => {
    const ids = key ? key.split(',').map(Number) : [];
    return photoSwatches(ids.map((id) => read.get(id) ?? []));
  }, [key, read]);
}

export function StudioPaletteProvider({
  doc,
  spread,
  labels,
  children,
}: {
  doc: BookDocument | null;
  spread: BookSpread | undefined;
  labels: StudioPaletteValue['labels'];
  children: ReactNode;
}) {
  const book = useMemo(() => bookColours(doc), [doc]);
  const photos = usePhotoColours(useMemo(() => spreadPhotoIds(spread), [spread]));
  const [recent, setRecent] = useState(readRecent);
  const remember = useCallback((hex: string) => {
    setRecent((list) => {
      const next = withRecent(list, hex);
      writeRecent(next);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ book, photos, recent, remember, labels }), [book, photos, recent, remember, labels]);
  return <StudioPaletteContext.Provider value={value}>{children}</StudioPaletteContext.Provider>;
}

/** The provider for the open book: the inspector of the page being edited sits inside it. */
export function StudioPaletteScope({
  spreadIndex,
  t,
  children,
}: {
  spreadIndex: number;
  t: (k: string) => string;
  children: ReactNode;
}) {
  const doc = useStudioStore((s) => s.doc);
  const labels = useMemo(
    () => ({
      book: t('journey.studio.paint.bookColours'),
      photos: t('journey.studio.paint.photoColours'),
      recent: t('journey.studio.paint.recentColours'),
      opacity: t('journey.studio.paint.opacity'),
    }),
    [t]
  );
  return (
    <StudioPaletteProvider doc={doc} spread={doc?.spreads[spreadIndex]} labels={labels}>
      {children}
    </StudioPaletteProvider>
  );
}
