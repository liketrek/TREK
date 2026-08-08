import { useState } from 'react'

/**
 * The TREK mascot — an empty-state character that IS the TREK mark: the logo is
 * the whole body, no arms, no legs. Two eyes give it life; a soft idle keeps it
 * breathing and blinking, and a ground shadow anchors it. Monochrome
 * (currentColor, theme-driven) and it holds a single pose under reduced motion.
 *
 * Two orthogonal props drive personality:
 *  - `scene` picks the prop + body motion for a page (skateboard, suitcase, …).
 *  - `mood` picks the facial expression (default / happy / sleepy / confused /
 *    error) so loading and error states can reuse the same face. Scenes carry a
 *    sensible default mood (notifications → sleepy, search → confused) that an
 *    explicit `mood` overrides.
 *
 * Body motion (`.trek-bounce--<scene>`) and each prop animate independently, so
 * the mascot can react to a prop without the prop moving with it. Choreography
 * lives in mobile.css (.trek-*). Poking (tap) remounts the svg to replay the
 * entrance pop-in as a bounce.
 */
export type TrekScene =
  | 'idle'
  | 'chat'
  | 'transport'
  | 'bookings'
  | 'guide'
  | 'packing'
  | 'files'
  | 'notes'
  | 'polls'
  | 'journey'
  | 'collections'
  | 'dashboard'
  | 'atlas'
  | 'notifications'
  | 'costs'
  | 'search'
  | 'tasks'

export type TrekMood = 'default' | 'happy' | 'sleepy' | 'confused' | 'error'

const MARK =
  'M 855.636719 699.203125 L 222.246094 699.203125 C 197.679688 699.203125 179.90625 675.75 186.539062 652.101562 L 360.429688 32.390625 C 364.921875 16.386719 379.511719 5.328125 396.132812 5.328125 L 1029.527344 5.328125 C 1054.089844 5.328125 1071.867188 28.777344 1065.230469 52.429688 L 891.339844 672.136719 C 886.851562 688.140625 872.257812 699.203125 855.636719 699.203125 Z M 444.238281 1166.980469 L 533.773438 847.898438 C 540.410156 824.246094 522.632812 800.796875 498.070312 800.796875 L 172.472656 800.796875 C 155.851562 800.796875 141.261719 811.855469 136.769531 827.859375 L 47.234375 1146.941406 C 40.597656 1170.59375 58.375 1194.042969 82.9375 1194.042969 L 408.535156 1194.042969 C 425.15625 1194.042969 439.75 1182.984375 444.238281 1166.980469 Z M 609.003906 827.859375 L 435.113281 1447.570312 C 428.476562 1471.21875 446.253906 1494.671875 470.816406 1494.671875 L 1104.210938 1494.671875 C 1120.832031 1494.671875 1135.421875 1483.609375 1139.914062 1467.605469 L 1313.804688 847.898438 C 1320.441406 824.246094 1302.664062 800.796875 1278.101562 800.796875 L 644.707031 800.796875 C 628.085938 800.796875 613.492188 811.855469 609.003906 827.859375 Z M 1056.105469 333.019531 L 966.570312 652.101562 C 959.933594 675.75 977.710938 699.203125 1002.273438 699.203125 L 1327.871094 699.203125 C 1344.492188 699.203125 1359.085938 688.140625 1363.574219 672.136719 L 1453.109375 353.054688 C 1459.746094 329.40625 1441.96875 305.953125 1417.40625 305.953125 L 1091.808594 305.953125 C 1075.1875 305.953125 1060.597656 317.015625 1056.105469 333.019531 Z'

const SCENE_MOOD: Partial<Record<TrekScene, TrekMood>> = {
  notifications: 'sleepy',
  search: 'confused',
}

export default function MDancingTrek({
  size = 96,
  scene = 'idle',
  mood,
  className = '',
}: {
  size?: number
  scene?: TrekScene
  mood?: TrekMood
  className?: string
}) {
  const face = mood ?? SCENE_MOOD[scene] ?? 'default'
  // Ground shadow sits under whatever the mascot stands on this scene.
  const shadowCy = scene === 'transport' ? 86 : 73
  // Poke to react: remounting the svg replays the entrance pop-in as a tap bounce.
  const [poke, setPoke] = useState(0)
  return (
    <svg
      key={poke}
      onClick={() => setPoke(p => p + 1)}
      width={size}
      height={(size * 96) / 88}
      viewBox="0 0 88 96"
      fill="none"
      aria-hidden="true"
      className={`trek trek--${scene} cursor-pointer text-m-ink ${className}`}
    >
      <ellipse className="trek-shadow" cx="44" cy={shadowCy} rx="19" ry="3.4" fill="currentColor" />
      <g className="trek-root">
        {/* scene prop behind / under the body — animates on its own */}
        <SceneBack scene={scene} />

        {/* body = the TREK mark, with its own per-scene bounce (hop, nod, …) */}
        <g className={`trek-bounce trek-bounce--${scene}`}>
          <g className="trek-body">
            <g transform="translate(20.5 21.7) scale(0.0313)">
              <path fill="currentColor" d={MARK} />
            </g>
            <Eyes mood={face} />
          </g>
        </g>

        {/* scene prop in front of the body — animates on its own */}
        <SceneFront scene={scene} />
      </g>
    </svg>
  )
}

/* ── Eyes ────────────────────────────────────────────────────────────────────
   Default eyes are surface-colour cutouts with ink pupils that blink and glance.
   Expression eyes are cut into the body as m-bg strokes so they read on the
   monochrome mark. */

function Eyes({ mood }: { mood: TrekMood }) {
  if (mood === 'happy') {
    return (
      <g fill="none" stroke="var(--m-bg)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M33.7 34 Q36 31.2 38.3 34" />
        <path d="M42.7 34 Q45 31.2 47.3 34" />
      </g>
    )
  }
  if (mood === 'sleepy') {
    return (
      <g fill="none" stroke="var(--m-bg)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M33.7 33 Q36 34.4 38.3 33" />
        <path d="M42.7 33 Q45 34.4 47.3 33" />
      </g>
    )
  }
  if (mood === 'error') {
    return (
      <g stroke="var(--m-bg)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M34.4 31.4 L37.6 34.6 M37.6 31.4 L34.4 34.6" />
        <path d="M43.4 31.4 L46.6 34.6 M46.6 31.4 L43.4 34.6" />
      </g>
    )
  }
  if (mood === 'confused') {
    // one eye open, one a raised squint — reads puzzled
    return (
      <g className="trek-eyes">
        <circle className="trek-eye" cx="36" cy="33" r="2.3" />
        <circle cx="36.4" cy="33.3" r="1" fill="currentColor" />
        <path d="M42.7 32.6 Q45 31.4 47.3 32.6" fill="none" stroke="var(--m-bg)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    )
  }
  // default — open eyes that blink and glance around
  return (
    <g className="trek-eyes">
      <circle className="trek-eye" cx="36" cy="33" r="2.3" />
      <circle className="trek-eye" cx="45" cy="33" r="2.3" />
      <g className="trek-pupils">
        <circle cx="36.4" cy="33.3" r="1" fill="currentColor" />
        <circle cx="45.4" cy="33.3" r="1" fill="currentColor" />
      </g>
    </g>
  )
}

/* ── Scene props ─────────────────────────────────────────────────────────────
   Monochrome props built from a few shapes. Animated elements never carry a
   `transform` attribute (a CSS-animation transform would override it) — any
   static rotation lives on a wrapping <g transform=…> instead. */

function SceneBack({ scene }: { scene: TrekScene }) {
  switch (scene) {
    case 'transport':
      // skateboard under the body — deck + two wheels spinning in place
      return (
        <g className="trek-board">
          <rect x="24" y="72" width="40" height="4" rx="2" fill="currentColor" />
          <g className="trek-wheel">
            <circle cx="32" cy="79" r="3.1" fill="currentColor" />
            <circle cx="32" cy="79" r="1.1" fill="var(--m-bg)" />
          </g>
          <g className="trek-wheel">
            <circle cx="56" cy="79" r="3.1" fill="currentColor" />
            <circle cx="56" cy="79" r="1.1" fill="var(--m-bg)" />
          </g>
        </g>
      )
    case 'guide':
      // tall staff with a big pennant fluttering near the top
      return (
        <g className="trek-guide">
          <rect x="70.4" y="26" width="2.6" height="56" rx="1.3" fill="currentColor" />
          <circle cx="71.7" cy="26" r="2.1" fill="currentColor" />
          <g className="trek-flag">
            <path d="M73 25 L90 30.5 L73 40 Z" fill="currentColor" />
          </g>
        </g>
      )
    case 'packing':
      // rolling suitcase parked beside the body — rocks on its wheels,
      // handle telescoping up and down
      return (
        <g className="trek-suitcase">
          <g className="trek-handle">
            <path d="M69 55 Q73 47.5 77 55" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
          <rect x="62" y="54" width="21" height="18" rx="3" fill="currentColor" />
          <rect x="62" y="60" width="21" height="2.2" fill="var(--m-bg)" />
          <rect x="70.5" y="56.4" width="4" height="2.2" rx="1" fill="var(--m-bg)" />
          <g className="trek-wheel">
            <circle cx="66" cy="73.4" r="2" fill="currentColor" />
          </g>
          <g className="trek-wheel">
            <circle cx="79" cy="73.4" r="2" fill="currentColor" />
          </g>
        </g>
      )
    case 'polls':
      // vote bars gently rising and settling like live tallies
      return (
        <g className="trek-polls">
          <rect className="trek-bar" x="66" y="60" width="5" height="12" rx="1.5" fill="currentColor" />
          <rect className="trek-bar trek-d2" x="73" y="52" width="5" height="20" rx="1.5" fill="currentColor" />
          <rect className="trek-bar trek-d3" x="80" y="56" width="5" height="16" rx="1.5" fill="currentColor" />
        </g>
      )
    case 'collections':
      // a map pin dropping in and bouncing beside the body
      return (
        <g className="trek-pin">
          <path d="M73 48 C 78 48 81.5 51.6 81.5 56.4 C 81.5 61.6 76 66 73 70 C 70 66 64.5 61.6 64.5 56.4 C 64.5 51.6 68 48 73 48 Z" fill="currentColor" />
          <circle cx="73" cy="56.2" r="2.9" fill="var(--m-bg)" />
        </g>
      )
    case 'atlas':
      // a globe beside the body, meridians drifting
      return (
        <g className="trek-globe-wrap">
          <circle cx="73" cy="60" r="11" fill="currentColor" />
          <path d="M63 57 H83 M64.5 64.5 H81.5" stroke="var(--m-bg)" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse className="trek-globe" cx="73" cy="60" rx="4.6" ry="11" fill="none" stroke="var(--m-bg)" strokeWidth="1.2" />
        </g>
      )
    case 'costs':
      // a stack of coins beside the body, top one bouncing on
      return (
        <g className="trek-coins">
          <ellipse cx="74" cy="70" rx="9" ry="3.2" fill="currentColor" />
          <ellipse cx="74" cy="66" rx="9" ry="3.2" fill="currentColor" />
          <ellipse cx="74" cy="66" rx="9" ry="3.2" fill="none" stroke="var(--m-bg)" strokeWidth="1" />
          <g className="trek-coin">
            <ellipse cx="74" cy="61.5" rx="9" ry="3.2" fill="currentColor" />
            <rect x="72.7" y="58.6" width="2.6" height="5.8" rx="1.3" fill="var(--m-bg)" />
          </g>
        </g>
      )
    case 'chat':
      // a speech bubble beside the body with three typing dots pulsing in turn
      return (
        <g className="trek-chat">
          <rect x="60" y="44" width="26" height="15" rx="5.5" fill="currentColor" />
          <path d="M67 58 L63.5 64 L72 58.5 Z" fill="currentColor" />
          <circle className="trek-dot" cx="67" cy="51.5" r="1.9" fill="var(--m-bg)" />
          <circle className="trek-dot trek-d2" cx="73" cy="51.5" r="1.9" fill="var(--m-bg)" />
          <circle className="trek-dot trek-d3" cx="79" cy="51.5" r="1.9" fill="var(--m-bg)" />
        </g>
      )
    default:
      return null
  }
}

function SceneFront({ scene }: { scene: TrekScene }) {
  switch (scene) {
    // Files reuse the booking ticket per design — a card getting written on.
    case 'bookings':
    case 'files':
      return (
        <g className="trek-ticket">
          <g transform="rotate(7 70 54)">
            <rect x="60" y="41" width="20" height="26" rx="2.6" fill="currentColor" />
            <circle cx="70.5" cy="46.5" r="1.5" fill="var(--m-bg)" />
            <rect x="64" y="51" width="12" height="2.6" rx="1.3" fill="var(--m-bg)" />
            <rect className="trek-write" x="64" y="56.5" width="12" height="1.7" rx="0.85" fill="var(--m-bg)" />
            <rect className="trek-write trek-d2" x="64" y="60" width="12" height="1.7" rx="0.85" fill="var(--m-bg)" />
            <rect className="trek-write trek-d3" x="64" y="63.5" width="7" height="1.7" rx="0.85" fill="var(--m-bg)" />
          </g>
        </g>
      )
    case 'notes':
      // a paper note (surface colour) with ink lines being written and a
      // scribbling pencil — pencil is ink (light in dark theme, dark in light)
      return (
        <g className="trek-note">
          <g transform="rotate(5 70 55)">
            <rect x="60" y="44" width="20" height="24" rx="2.5" fill="var(--m-bg)" stroke="currentColor" strokeWidth="1.4" />
            <rect className="trek-write" x="63.5" y="50" width="13" height="1.7" rx="0.85" fill="currentColor" />
            <rect className="trek-write trek-d2" x="63.5" y="54.5" width="13" height="1.7" rx="0.85" fill="currentColor" />
            <rect className="trek-write trek-d3" x="63.5" y="59" width="8" height="1.7" rx="0.85" fill="currentColor" />
          </g>
          <g className="trek-pencil">
            {/* body + tip modelled vertically as one piece, then leaned together
                so the point always stays attached to the shaft */}
            <g transform="rotate(34 74.5 52)">
              <rect x="73" y="40" width="3" height="16" rx="1.3" fill="currentColor" />
              <path d="M73 56 L76 56 L74.5 60.5 Z" fill="currentColor" />
            </g>
          </g>
        </g>
      )
    case 'journey':
      // an open book with a fluttering page and a ribbon bookmark
      return (
        <g className="trek-journal">
          <path d="M58 53 Q71 49.5 71 52 L71 69 Q71 66.5 58 70 Z" fill="currentColor" />
          <path d="M84 53 Q71 49.5 71 52 L71 69 Q71 66.5 84 70 Z" fill="currentColor" />
          <path d="M60.5 56 Q66 54 70 55.5 M60.5 60 Q66 58 70 59.5 M60.5 64 Q66 62 70 63.5" stroke="var(--m-bg)" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M76 55.4 Q80 54 83 55.6 M76 59.4 Q80 58 83 59.6" stroke="var(--m-bg)" strokeWidth="1" fill="none" strokeLinecap="round" />
          <g className="trek-page">
            <path d="M71 52 Q78 50.5 82 52 L82 68.5 Q78 67 71 68.5 Z" fill="currentColor" />
            <path d="M74 55.4 Q78 54.2 81 55.6 M74 59.4 Q78 58.2 81 59.6" stroke="var(--m-bg)" strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
          <rect x="70" y="49.5" width="2.2" height="9" fill="var(--m-bg)" />
        </g>
      )
    case 'dashboard':
      // a little paper plane looping around, ready for a first trip
      return (
        <g className="trek-plane">
          <path d="M64 53 L87 58 L70 68 L71 60 Z" fill="currentColor" />
          <path d="M87 58 L71 60 L70 68" stroke="var(--m-bg)" strokeWidth="0.9" fill="none" strokeLinejoin="round" />
        </g>
      )
    case 'notifications':
      // all caught up — a stack of Zzz drifting up while the mascot dozes
      return (
        <g className="trek-zzz" fill="currentColor">
          <path className="trek-z trek-z1" d="M63 50 h5 l-5 6 h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
          <path className="trek-z trek-z2" d="M69 42 h6 l-6 7 h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          <path className="trek-z trek-z3" d="M76 32 h7 l-7 8 h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )
    case 'search':
      // a magnifying glass scanning back and forth
      return (
        <g className="trek-magnifier">
          <circle cx="72" cy="56" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="72" cy="56" r="5.4" fill="var(--m-bg)" />
          <rect x="77" y="62.5" width="3" height="10" rx="1.5" fill="currentColor" transform="rotate(-45 78.5 67.5)" />
        </g>
      )
    case 'tasks':
      // a clipboard checklist with a checkmark ticking on
      return (
        <g className="trek-tasks">
          <g transform="rotate(4 71 55)">
            <rect x="60" y="43" width="22" height="25" rx="2.6" fill="currentColor" />
            <rect x="67" y="41" width="8" height="3.4" rx="1.7" fill="currentColor" />
            <rect x="63.5" y="48.4" width="4" height="4" rx="1" fill="var(--m-bg)" />
            <rect x="69.5" y="49.6" width="9" height="1.7" rx="0.85" fill="var(--m-bg)" />
            <rect x="63.5" y="55" width="4" height="4" rx="1" fill="var(--m-bg)" />
            <rect x="69.5" y="56.2" width="9" height="1.7" rx="0.85" fill="var(--m-bg)" />
            <rect x="63.5" y="61.6" width="4" height="4" rx="1" fill="var(--m-bg)" />
            <rect x="69.5" y="62.8" width="6" height="1.7" rx="0.85" fill="var(--m-bg)" />
            <path className="trek-check" d="M64 50.5 l1.3 1.4 l2.2 -2.7" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      )
    default:
      return null
  }
}
