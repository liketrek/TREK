import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from '../../i18n'
import MDancingTrek, { type TrekScene } from '../../mobile/components/MDancingTrek'

/**
 * Trip-open splash for desktop — the same little journey the mobile splash
 * plays: the TREK mascot packs, hits the road, cruises in and drops the
 * destination pin while the trip loads. Sized to drop into the trip planner's
 * centred loading container; monochrome tokens are mapped onto the desktop
 * palette (the mascot lives in the mobile shell), the .trek-* choreography is
 * global. Under reduced motion it parks on the "loading photos" beat.
 */
const STEPS: { scene: TrekScene; key: string }[] = [
  { scene: 'packing', key: 'trip.loadingSteps.pack' },
  { scene: 'transport', key: 'trip.loadingSteps.road' },
  { scene: 'dashboard', key: 'trip.loadingPhotos' },
  { scene: 'collections', key: 'trip.loadingSteps.arrive' },
]
const STEP_MS = 1400
const STILL_INDEX = 2

export default function TripLoadingSplash({ title }: { title?: string }) {
  const { t } = useTranslation()
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setIndex((n) => (n + 1) % STEPS.length), STEP_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  const activeIndex = reduceMotion ? STILL_INDEX : index
  const step = STEPS[activeIndex]

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ '--m-ink': 'var(--text-primary)', '--m-bg': 'var(--bg-card)' } as CSSProperties}
    >
      {/* Fixed stage so the travelling mascot never nudges the layout. */}
      <div className="mb-6 flex h-[150px] w-[160px] items-center justify-center overflow-hidden">
        <div key={step.scene} style={reduceMotion ? undefined : { animation: 'm-trek-beat 460ms cubic-bezier(.34,1.56,.64,1) both' }}>
          <MDancingTrek scene={step.scene} mood="happy" size={128} />
        </div>
      </div>

      <div className="mb-2 text-[1.25rem] font-bold tracking-[-0.3px] text-content">{title || 'TREK'}</div>

      <div className="mb-8 flex h-4 items-center justify-center">
        <span key={step.key} className="text-[0.75rem] font-medium uppercase tracking-[2px] text-content-faint">
          {t(step.key)}
        </span>
      </div>

      {/* Beat dots — the active stage widens into a pill. */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className="h-[6px] rounded-full transition-all duration-[400ms] ease-out"
            style={{ width: i === activeIndex ? 20 : 6, background: i === activeIndex ? 'var(--text-primary)' : 'var(--border-primary)' }}
          />
        ))}
      </div>

      <style>{'@keyframes m-trek-beat { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }'}</style>
    </div>
  )
}
