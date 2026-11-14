import { useEffect, useState } from 'react'
import { useTranslation } from '../../../i18n'
import MDancingTrek from '../../components/MDancingTrek'
import { TRIP_SPLASH_AFTER_MS, useTripSplashBeats } from '../../../components/shared/useTripSplashBeats'

/**
 * Trip-open splash — the TREK mascot acts out a little journey while the trip
 * and its place photos load: packing the bags, hitting the road, cruising in
 * (paper plane) and dropping the destination pin. Each beat the mascot travels
 * in from the right (fade + slide) and pops in, the caption cross-fades and the
 * progress dots track which beat is on. Under reduced motion it holds a single
 * frame (the real "loading photos" one) with no transitions.
 */
// The page transition holds the page the trip was opened from for up to 350ms
// (mobile/routeTransition.ts), so a trip that loads within TRIP_SPLASH_AFTER_MS
// slides in whole, the way the dashboard slides back in on the way out.
export { TRIP_SPLASH_AFTER_MS }

/**
 * While a trip opens. At first nothing but the screen's own background, marked
 * as a route fallback, which the page transition waits on; the splash only once
 * the load takes longer than TRIP_SPLASH_AFTER_MS.
 */
export function MTripOpening({ title }: { title: string }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), TRIP_SPLASH_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])
  if (slow) return <MTripLoadingSplash title={title} />
  return (
    <div
      data-route-fallback=""
      aria-busy="true"
      className="fixed inset-0 z-50 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)]"
    />
  )
}

export default function MTripLoadingSplash({ title }: { title: string }) {
  const { t } = useTranslation()
  const { reduceMotion, activeIndex, step, steps } = useTripSplashBeats({ liveReducedMotion: true })

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] text-m-ink">
      {/* Fixed stage so the travelling mascot never nudges the layout. */}
      <div className="mb-6 flex h-[140px] w-[150px] items-center justify-center overflow-hidden">
        <div key={step.scene} style={reduceMotion ? undefined : { animation: 'm-trek-beat 460ms cubic-bezier(.34,1.56,.64,1) both' }}>
          <MDancingTrek scene={step.scene} mood="happy" size={124} />
        </div>
      </div>

      <div className="mb-2 text-[1.25rem] font-bold tracking-[-0.3px]">{title || 'TREK'}</div>

      <div className="mb-8 flex h-4 items-center justify-center">
        <span key={step.key} className="m-fade-in text-[0.75rem] font-medium uppercase tracking-[2px] text-m-faint">
          {t(step.key)}
        </span>
      </div>

      {/* Beat dots — the active stage widens into an accent pill. */}
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-[6px] rounded-full transition-all duration-[400ms] ease-out ${
              i === activeIndex ? 'w-5 bg-m-ink' : 'w-[6px] bg-[color:var(--m-faint)]'
            }`}
          />
        ))}
      </div>

      <style>{`@keyframes m-trek-beat { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}
