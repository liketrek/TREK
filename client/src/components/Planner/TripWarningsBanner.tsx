import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { pluginsApi } from '../../api/client'
import { usePluginStore } from '../../store/pluginStore'

/**
 * Shows validation/warning contributions from `warningProvider` plugins (#1429).
 * Self-contained + fail-safe: the server skips any slow/failing provider, so this
 * only ever adds rows; it renders nothing (and takes no space) when there are none.
 *
 * Placement: a warning from a plugin that owns a trip-page tab in this planner
 * renders as a compact chip in the navbar centre (click jumps to that tab); all
 * other warnings float above the content at the BOTTOM of the planner, so neither
 * kind ever covers the map toolbar or displaces the working area up top.
 */
type Warning = { pluginId: string; level: 'info' | 'warning' | 'error'; message: string }

const STYLE = {
  info: { Icon: Info, color: 'var(--info)', bg: 'var(--info-soft)' },
  warning: { Icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-soft)' },
  error: { Icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-soft)' },
} as const

export default function TripWarningsBanner({ tripId, onOpenPluginTab }: { tripId: number; onOpenPluginTab?: (pluginId: string) => void }) {
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(min-width: 768px)')?.matches ?? true)
  )
  const plugins = usePluginStore((s) => s.plugins)

  useEffect(() => {
    if (!Number.isFinite(tripId)) { setWarnings([]); return }
    let cancelled = false
    pluginsApi.tripWarnings(tripId)
      .then((d) => { if (!cancelled) setWarnings(d.warnings || []) })
      .catch(() => { if (!cancelled) setWarnings([]) })
    return () => { cancelled = true }
  }, [tripId])

  // The navbar renders in the same commit as the planner, so the slot exists by
  // the time effects run; it is display:none'd with the navbar below md.
  useEffect(() => { setNavSlot(document.getElementById('trek-nav-center-slot')) }, [])
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 768px)')
    if (!mq) return
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (warnings.length === 0) return null

  const tripPageIds = new Set(plugins.filter((p) => p.type === 'trip-page').map((p) => p.id))
  const chips = navSlot && isDesktop ? warnings.filter((w) => tripPageIds.has(w.pluginId)) : []
  const floating = warnings.filter((w) => !chips.includes(w))

  return (
    <>
      {navSlot && chips.length > 0 && createPortal(
        chips.map((w, i) => {
          const s = STYLE[w.level] ?? STYLE.warning
          return (
            <button
              key={`${w.pluginId}-${i}`}
              type="button"
              onClick={onOpenPluginTab ? () => onOpenPluginTab(w.pluginId) : undefined}
              title={w.message}
              style={{
                pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999, border: 'none',
                background: s.bg, color: s.color, cursor: onOpenPluginTab ? 'pointer' : 'default',
                fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
                maxWidth: 'min(44vw, 520px)', minWidth: 0,
              }}
            >
              <s.Icon size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.message}</span>
            </button>
          )
        }),
        navSlot
      )}
      {floating.length > 0 && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--bottom-nav-h, 0px) + 8px)', left: 0, right: 0, zIndex: 6, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px' }}>
          {floating.map((w, i) => {
            const s = STYLE[w.level] ?? STYLE.warning
            return (
              <div key={`${w.pluginId}-${i}`} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: s.bg, color: s.color, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, boxShadow: 'var(--shadow-card)' }}>
                <s.Icon size={15} style={{ flexShrink: 0 }} />
                <span>{w.message}</span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
