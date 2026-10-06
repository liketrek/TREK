import { X } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../i18n';
import { useHelpStore } from '../../store/helpStore';

/** A step picture enlarged over the help dialog; click anywhere or Escape to close. */
export default function HelpLightbox(): React.ReactElement | null {
  const { t } = useTranslation();
  const lightbox = useHelpStore((s) => s.lightbox);
  const close = useHelpStore((s) => s.openLightbox);
  if (!lightbox) return null;

  return (
    <div
      className="trek-help-lightbox fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-[var(--overlay)] p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={lightbox.alt}
      onClick={() => close(null)}
    >
      <button
        type="button"
        onClick={() => close(null)}
        aria-label={t('help.center.close')}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-inverse text-inverse-text shadow-elevated transition-transform hover:scale-105"
      >
        <X className="h-5 w-5" />
      </button>
      <figure
        className="trek-help-lightbox-card flex max-h-[90vh] max-w-[min(1400px,94vw)] flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={lightbox.src}
          alt={lightbox.alt}
          className="max-h-[84vh] w-auto rounded-xl border border-edge bg-surface-card object-contain shadow-modal"
        />
        {lightbox.alt && (
          <figcaption className="text-center text-caption text-inverse-text opacity-80">{lightbox.alt}</figcaption>
        )}
      </figure>
    </div>
  );
}
