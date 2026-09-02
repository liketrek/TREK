import { useEffect, useRef } from 'react'
import { Navigation, LocateFixed, Locate } from 'lucide-react'
import type { TrackingMode, GeoWatchErrorCode } from '../../hooks/useGeolocation'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'

interface Props {
  mode: TrackingMode
  error: string | null
  errorCode: GeoWatchErrorCode | null
  onClick: () => void
  // Offset from the bottom edge — callers push this up above the mobile
  // bottom nav. Defaults to 20px for desktop.
  bottomOffset?: number
}

// The raw error string from the browser is unlocalized WebKit English, so the
// user-facing message is looked up from the typed code instead. 'unsupported'
// shares the generic text: a browser without geolocation cannot locate you.
const ERROR_KEYS: Record<GeoWatchErrorCode, string> = {
  'permission-denied': 'map.location.denied',
  'unavailable': 'map.location.unavailable',
  'timeout': 'map.location.timeout',
  'unsupported': 'map.location.unavailable',
}

// Three-state FAB. Matches the Apple/Google Maps pattern:
//   off    → outline locate icon
//   show   → filled locate (blue dot is visible on the map)
//   follow → filled navigation arrow (map follows + rotates with heading)
export default function LocationButton({ mode, error, errorCode, onClick, bottomOffset = 20 }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  // A title tooltip is invisible on touch, which is exactly where geolocation
  // errors happen (iOS PWA, see discussion #2095), so surface new errors as a
  // toast. The ref guards against re-fires: only the transition from no error
  // to an error announces itself.
  const prevCodeRef = useRef<GeoWatchErrorCode | null>(null)
  useEffect(() => {
    const prev = prevCodeRef.current
    prevCodeRef.current = errorCode
    if (errorCode && prev === null) {
      // The denied message is long, so give the toast extra time to be read.
      toast.error(t(ERROR_KEYS[errorCode]), 6000)
    }
  }, [errorCode, t, toast])

  const Icon = mode === 'follow' ? Navigation : mode === 'show' ? LocateFixed : Locate
  const isActive = mode !== 'off'
  const errorText = errorCode ? t(ERROR_KEYS[errorCode]) : error
  const title = errorText
    ? errorText
    : mode === 'off'
      ? 'Show my location'
      : mode === 'show'
        ? 'Follow my location'
        : 'Stop following'

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        right: 12,
        zIndex: 1000,
        width: 42,
        height: 42,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        background: isActive ? '#3b82f6' : 'var(--bg-card, white)',
        color: isActive ? 'white' : (error ? '#ef4444' : 'var(--text-muted, #6b7280)'),
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      <Icon size={20} strokeWidth={mode === 'follow' ? 2.5 : 2} />
    </button>
  )
}
