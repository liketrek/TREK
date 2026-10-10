import { useEffect, useRef, useState, type TouchEvent } from 'react';

import { getAuthUrl } from '../../api/authUrl';
import type { TripFile } from '../../types';
import { isVideo } from './FileManager.helpers';

/** How far a horizontal swipe has to travel before it pages. */
const SWIPE_PX = 60;

export interface MediaLightboxOptions {
  files: TripFile[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * The media viewer behind the desktop file manager's lightbox and the phone's files tab
 * lightbox, which draw their own overlay over it: the signed address of the picture on
 * screen, paging by button, arrow keys and swipe, and Escape to close.
 */
export function useMediaLightbox({ files, index, onIndexChange, onClose }: MediaLightboxOptions) {
  const file = files[index] as TripFile | undefined;
  const [imgSrc, setImgSrc] = useState('');
  const touchStartRef = useRef<number | null>(null);
  const fileIsVideo = isVideo(file?.mime_type);
  const fileUrl = file?.url;
  const fileMimeType = file?.mime_type;

  useEffect(() => {
    // Images use a one-shot signed URL; a video keeps the plain same-origin URL (cookie
    // auth) so its many Range requests all authenticate (#823). Paging is faster than the
    // token round trip, so only the mint for the file still on screen may paint.
    let cancelled = false;
    setImgSrc('');
    if (fileUrl && !isVideo(fileMimeType)) {
      void getAuthUrl(fileUrl, 'download').then((url) => {
        if (!cancelled) setImgSrc(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileMimeType]);

  const hasPrev = index > 0;
  const hasNext = index < files.length - 1;
  const goPrev = () => {
    if (hasPrev) onIndexChange(index - 1);
  };
  const goNext = () => {
    if (hasNext) onIndexChange(index + 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < files.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, files.length, onClose, onIndexChange]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartRef.current;
    if (start === null) return;
    const diff = e.changedTouches[0].clientX - start;
    if (diff > SWIPE_PX) goPrev();
    else if (diff < -SWIPE_PX) goNext();
    touchStartRef.current = null;
  };

  return { file, imgSrc, fileIsVideo, hasPrev, hasNext, goPrev, goNext, onTouchStart, onTouchEnd };
}
