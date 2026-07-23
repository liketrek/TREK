import { lazy, Suspense, useState } from 'react'
import { Play, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { noFearCopy } from './noFearLines'
import './fourzero.css'

// TREK 4.0.0 release moment — remove together with the FourZero folder.

const NoFearShow = lazy(() => import('./NoFearShow'))

const DISMISS_KEY = 'trek-fourzero-dismissed'

/**
 * The dashboard trigger for the 4.0.0 "KEINE ANGST" show: a dark, pulsing card
 * at the top of the right sidebar (desktop only). One click starts the show;
 * the small × dismisses the beacon for good on this device.
 */
export default function NoFearBeacon() {
  const { language } = useTranslation()
  const copy = noFearCopy(language)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [open, setOpen] = useState(false)

  if (dismissed) return null

  return (
    <>
      <button type="button" className="fz-beacon" onClick={() => setOpen(true)}>
        <span className="fz-beacon-pulse" aria-hidden />
        <span
          role="button"
          tabIndex={0}
          className="fz-beacon-dismiss"
          aria-label="×"
          onClick={e => { e.stopPropagation(); localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) } }}
        >
          <X size={12} />
        </span>
        <p className="fz-beacon-eyebrow">TREK 4.0.0</p>
        <p className="fz-beacon-title">{copy.beaconTitle}</p>
        <p className="fz-beacon-sub">{copy.beaconSub}</p>
        <span className="fz-beacon-cta"><Play size={12} fill="currentColor" /> {copy.beaconCta}</span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <NoFearShow onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
