import { useEffect, useState } from 'react';

import { photoSrc } from '../bookRender';

export interface PhotoPixels {
  width: number;
  height: number;
}

/**
 * The pixel size of a photo's original, measured by loading it.
 *
 * The journey the Studio holds knows which pictures there are but not how
 * large their originals are (the server measures that for the book engine and
 * keeps it there), and a print resolution is nothing without it. So the
 * inspector reads it off the original itself, for the one photo selected: the
 * canvas loads that same original from a zoom of a third up, so most of the
 * time the browser already has it. Null until it has loaded, and for an empty
 * frame or a picture that does not load, which says nothing rather than guess.
 */
export function usePhotoPixels(photoId: number | null): PhotoPixels | null {
  const [seen, setSeen] = useState<{ photoId: number; pixels: PhotoPixels } | null>(null);

  useEffect(() => {
    if (photoId == null) return undefined;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      setSeen({ photoId, pixels: { width: img.naturalWidth, height: img.naturalHeight } });
    };
    img.src = photoSrc(photoId, true);
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [photoId]);

  return seen && seen.photoId === photoId ? seen.pixels : null;
}
