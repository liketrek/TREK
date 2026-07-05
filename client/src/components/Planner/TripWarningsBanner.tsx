import { useEffect, useState } from 'react'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { pluginsApi } from '../../api/client'

/**
 * Shows validation/warning contributions from `warningProvider` plugins (#1429).
 * Self-contained + fail-safe: the server skips any slow/failing provider, so this
 * only ever adds rows; it renders nothing (and takes no space) when there are none.
 */
type Warning = { pluginId: string; level: 'info' | 'warning' | 'error'; message: string }

const STYLE = {
  info: { Icon: Info, color: 'var(--info)', bg: 'var(--info-soft)' },
  warning: { Icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-soft)' },
  error: { Icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-soft)' },
} as const

export default function TripWarningsBanner({ tripId }: { tripId: number }) {
  const [warnings, setWarnings] = useState<Warning[]>([])
  useEffect(() => {
    if (!Number.isFinite(tripId)) { setWarnings([]); return }
    let cancelled = false
    pluginsApi.tripWarnings(tripId)
      .then((d) => { if (!cancelled) setWarnings(d.warnings || []) })
      .catch(() => { if (!cancelled) setWarnings([]) })
    return () => { cancelled = true }
  }, [tripId])

  if (warnings.length === 0) return null
  // A non-blocking overlay pinned to the top of the (fixed) planner content region:
  // the wrapper ignores pointer events so it never covers the map/panels, and only
  // the warning pills themselves are interactive.
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 16px' }}>
      {warnings.map((w, i) => {
        const s = STYLE[w.level] ?? STYLE.warning
        return (
          <div key={`${w.pluginId}-${i}`} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: s.bg, color: s.color, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, boxShadow: 'var(--shadow-card)' }}>
            <s.Icon size={15} style={{ flexShrink: 0 }} />
            <span>{w.message}</span>
          </div>
        )
      })}
    </div>
  )
}
