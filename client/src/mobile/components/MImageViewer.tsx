import { X } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n';
import { lockBodyScroll } from '../../utils/bodyScrollLock';

function sheetRoot(): HTMLElement {
  return document.getElementById('m-sheet-root') ?? document.body;
}

/**
 * One image full screen, for a picture shown small in a list (a chat
 * attachment). A tap on the image zooms in, and the zoomed image pans with the
 * finger as any scrolled page does; a tap beside it or the X closes the view,
 * as Escape does with a keyboard. The page's own pinch zoom is off in the app,
 * so the zoom is the viewer's.
 */
export default function MImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => lockBodyScroll(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="m-root fixed inset-0 z-[65] bg-black/[.92]"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('collab.chat.closeImage')}
        className="absolute end-4 top-[calc(var(--m-safe-top,12px)+4px)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <X size={20} strokeWidth={2} />
      </button>
      <div
        className={`h-full w-full ${zoomed ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden p-4'}`}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          className={
            zoomed ? 'block w-[250%] max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain'
          }
        />
      </div>
    </div>,
    sheetRoot()
  );
}
