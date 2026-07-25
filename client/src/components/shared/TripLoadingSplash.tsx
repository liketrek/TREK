import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n'
import MDancingTrek, { type TrekScene } from '../../mobile/components/MDancingTrek'

/**
 * Trip-open splash for desktop â€” the same little journey the mobile splash
 * plays: the TREK mascot packs, hits the road, cruises in and drops the
 * destination pin while the trip loads. It now takes over the viewport as a
 * calm, Apple-style scene: a slowly drifting pastel gradient wash (soft
 * pink/lavender/periwinkle, toned right down) whose tiles pan and whose hue
 * gently breathes, dusted with a faint filmic grain, and the whole journey
 * floating on a frosted "liquid glass" card. Monochrome mascot tokens map onto
 * the desktop palette; the mascot's eye cut-outs (--m-bg) are pinned to the
 * card surface so they read as clean holes. Under reduced motion the background
 * freezes and the mascot parks on "loading photos". Palette + glass tint swap
 * for light/dark via the .dark class the app puts on <html>.
 */
const STEPS: { scene: TrekScene; key: string }[] = [
  { scene: 'packing', key: 'trip.loadingSteps.pack' },
  { scene: 'transport', key: 'trip.loadingSteps.road' },
  { scene: 'dashboard', key: 'trip.loadingPhotos' },
  { scene: 'collections', key: 'trip.loadingSteps.arrive' },
]
const STEP_MS = 1400
const STILL_INDEX = 2

const SPLASH_CSS = `
.m-splash-root { background: #eef0fb; }
.dark .m-splash-root { background: #0c0c12; }

/* â”€â”€ Drifting gradient wash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   A layered pastel mesh whose tiles pan on a long ease-in-out loop, so nothing
   ever snaps or races. Toned-down opacity keeps it airy rather than garish. */
.m-splash-bg {
  position: absolute;
  inset: 0;
  background-color: #eef0fb;
  background-image:
    radial-gradient(60% 60% at 50% 50%, rgba(244, 199, 221, 0.55), transparent 70%),
    radial-gradient(56% 56% at 50% 50%, rgba(206, 201, 245, 0.50), transparent 72%),
    radial-gradient(60% 60% at 50% 50%, rgba(190, 209, 247, 0.52), transparent 72%),
    radial-gradient(52% 52% at 50% 50%, rgba(238, 214, 236, 0.44), transparent 72%);
  background-repeat: no-repeat;
  background-size: 122% 122%, 132% 132%, 126% 126%, 116% 116%;
  background-position: 12% 20%, 82% 18%, 74% 82%, 22% 78%;
  animation: m-splash-drift 30s ease-in-out infinite alternate;
  will-change: background-position;
}
.dark .m-splash-bg {
  background-color: #0c0c12;
  background-image:
    radial-gradient(60% 60% at 50% 50%, rgba(158, 116, 192, 0.30), transparent 70%),
    radial-gradient(56% 56% at 50% 50%, rgba(112, 122, 196, 0.28), transparent 72%),
    radial-gradient(60% 60% at 50% 50%, rgba(90, 132, 194, 0.26), transparent 72%),
    radial-gradient(52% 52% at 50% 50%, rgba(164, 112, 176, 0.24), transparent 72%);
}
@keyframes m-splash-drift {
  0%   { background-position: 12% 20%, 82% 18%, 74% 82%, 22% 78%; }
  100% { background-position: 26% 36%, 66% 30%, 58% 68%, 36% 62%; }
}

/* Hue veil â€” a heavily blurred conic sweep that gently hue-rotates, so the
   palette breathes without any visible spinning. */
.m-splash-veil {
  position: absolute;
  inset: -25%;
  background: conic-gradient(from 210deg at 50% 50%,
    rgba(255, 214, 232, 0), rgba(214, 205, 248, 0.16),
    rgba(198, 214, 248, 0.16), rgba(245, 214, 236, 0),
    rgba(255, 214, 232, 0));
  filter: blur(46px) hue-rotate(0deg);
  mix-blend-mode: soft-light;
  animation: m-splash-hue 26s ease-in-out infinite alternate;
  will-change: filter;
}
.dark .m-splash-veil { opacity: 0.55; }
@keyframes m-splash-hue {
  from { filter: blur(46px) hue-rotate(0deg); }
  to   { filter: blur(46px) hue-rotate(24deg); }
}

/* Filmic grain â€” an inline (self-contained) fractal-noise texture at a whisper
   of opacity for that reference-shot texture. Static, so it never adds motion. */
.m-splash-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
  opacity: 0.05;
  mix-blend-mode: overlay;
}
.dark .m-splash-grain { opacity: 0.09; mix-blend-mode: soft-light; }

/* A breath of vignette for depth. */
.m-splash-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(48, 38, 72, 0.10) 100%);
}
.dark .m-splash-vignette {
  background: radial-gradient(120% 100% at 50% 42%, transparent 46%, rgba(0, 0, 0, 0.42) 100%);
}

/* â”€â”€ Frosted "liquid glass" card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Translucent, blurred + saturated, a hairline light edge, soft lift, generous
   radius. Painted after the background layers so the frost blurs them. */
.m-splash-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 56px 40px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 24px 70px -26px rgba(60, 48, 96, 0.38),
    0 2px 8px -4px rgba(60, 48, 96, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(30px) saturate(1.7);
  -webkit-backdrop-filter: blur(30px) saturate(1.7);
  animation: m-splash-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.dark .m-splash-card {
  background: rgba(26, 24, 34, 0.52);
  border-color: rgba(255, 255, 255, 0.09);
  box-shadow:
    0 28px 80px -28px rgba(0, 0, 0, 0.65),
    0 2px 10px -4px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
@keyframes m-splash-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}

/* Monochrome mascot tokens live on the content wrapper. --m-bg is pinned to the
   frosted card's surface tone (not the page) so the eye cut-outs read clean. */
.m-splash-content {
  --m-ink: var(--text-primary);
  --m-bg: #f3f1f8;
}
.dark .m-splash-content { --m-bg: #1b1a22; }

@keyframes m-trek-beat {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* â”€â”€ Motion prefs: freeze the drifting background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
@media (prefers-reduced-motion: reduce) {
  .m-splash-bg,
  .m-splash-veil,
  .m-splash-card { animation: none !important; }
}
`

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
      className="m-splash-root fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      role="status"
      aria-label={title || 'TREK'}
    >
      {/* Slowly drifting glass gradient â€” painted behind the card so the frost
          blurs it. */}
      <div className="m-splash-bg" aria-hidden="true" />
      <div className="m-splash-veil" aria-hidden="true" />
      <div className="m-splash-grain" aria-hidden="true" />
      <div className="m-splash-vignette" aria-hidden="true" />

      <div className="m-splash-card">
        <div className="m-splash-content flex flex-col items-center justify-center">
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

          {/* Beat dots â€” the active stage widens into a pill. */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-[6px] rounded-full transition-all duration-[400ms] ease-out"
                style={{ width: i === activeIndex ? 20 : 6, background: i === activeIndex ? 'var(--text-primary)' : 'var(--border-primary)' }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{SPLASH_CSS}</style>
    </div>
  )
}
