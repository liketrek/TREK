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
      <div className="fz-beacon">
        <button type="button" className="fz-beacon-play" onClick={() => setOpen(true)}>
          <p className="fz-beacon-eyebrow">TREK 4.0.0</p>
          <p className="fz-beacon-title">{copy.beaconTitle}</p>
          <p className="fz-beacon-sub">{copy.beaconSub}</p>
          <span className="fz-beacon-cta"><Play size={12} fill="currentColor" /> {copy.beaconCta}</span>
        </button>
        <span className="fz-beacon-pulse" aria-hidden />
        <button
          type="button"
          className="fz-beacon-dismiss"
          aria-label={copy.skip}
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) }}
        >
          <X size={12} />
        </button>
      </div>
      {open && (
        <Suspense fallback={null}>
          <NoFearShow onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
