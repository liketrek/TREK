import { useEffect, useState } from 'react'
import { useTranslation } from '../../../i18n'
import MDancingTrek, { type TrekScene } from '../../components/MDancingTrek'

/**
 * Trip-open splash — the TREK mascot acts out a little journey while the trip
 * and its place photos load: packing the bags, hitting the road, cruising in
 * (paper plane) and dropping the destination pin. Each beat the mascot travels
 * in from the right (fade + slide) and pops in, the caption cross-fades and the
 * progress dots track which beat is on. Under reduced motion it holds a single
 * frame (the real "loading photos" one) with no transitions.
 */
const STEPS: { scene: TrekScene; key: string }[] = [
  { scene: 'packing', key: 'trip.loadingSteps.pack' },
  { scene: 'transport', key: 'trip.loadingSteps.road' },
  { scene: 'dashboard', key: 'trip.loadingPhotos' },
  { scene: 'collections', key: 'trip.loadingSteps.arrive' },
]

const STEP_MS = 1400
// Reduced motion parks on the paper-plane / "loading photos" beat.
const STILL_INDEX = 2

export default function MTripLoadingSplash({ title }: { title: string }) {
  const { t } = useTranslation()
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduceMotion) return
    const id = setInterval(() => setIndex(n => (n + 1) % STEPS.length), STEP_MS)
    return () => clearInterval(id)
  }, [reduceMotion])

  const activeIndex = reduceMotion ? STILL_INDEX : index
  const step = STEPS[activeIndex]

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
        {STEPS.map((_, i) => (
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
