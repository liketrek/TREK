import React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore } from '../../store/helpStore'

/** A step picture enlarged over the help dialog; click anywhere or Escape to close. */
export default function HelpLightbox(): React.ReactElement | null {
  const { t } = useTranslation()
  const lightbox = useHelpStore(s => s.lightbox)
  const close = useHelpStore(s => s.openLightbox)
  if (!lightbox) return null

  return (
    <div
      className="trek-help-lightbox fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center p-4 sm:p-8 bg-[var(--overlay)] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={lightbox.alt}
      onClick={() => close(null)}
    >
      <button
        type="button"
        onClick={() => close(null)}
        aria-label={t('help.center.close')}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-inverse text-inverse-text flex items-center justify-center shadow-elevated hover:scale-105 transition-transform"
      >
        <X className="w-5 h-5" />
      </button>
      <figure className="trek-help-lightbox-card max-w-[min(1400px,94vw)] max-h-[90vh] flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        <img src={lightbox.src} alt={lightbox.alt} className="max-h-[84vh] w-auto object-contain rounded-xl border border-edge shadow-modal bg-surface-card" />
        {lightbox.alt && <figcaption className="text-caption text-center text-inverse-text opacity-80">{lightbox.alt}</figcaption>}
      </figure>
    </div>
  )
}
