import { useCallback, useEffect, useState } from 'react'
import { pluginsApi, type TripCardBadge } from '../../api/client'

/**
 * Host-rendered plugin badges on the dashboard trip cards (#plugins, tripCardProvider
 * hook). The server has already access-checked every tripId for the user and bounded
 * every field (label/value length, enum tone, http/https/mailto-only url), so this
 * renders trusted primitives only — a badge is a small text chip or link. Plugin JS
 * never runs here; it only ever runs inside the opaque-origin PluginFrame. Fail-safe:
 * any error yields an empty lookup, so a plugin can only ADD chips, never break a card.
 */
const EMPTY: TripCardBadge[] = []

/** Fetch badges for all visible cards in ONE call (the server fans out per plugin over
 * the whole id list) and bucket them by tripId. `enabled` gates the call so a dashboard
 * with no active plugins never hits the endpoint. */
export function useTripCardBadges(tripIds: number[], enabled: boolean) {
  const [byTrip, setByTrip] = useState<Map<number, TripCardBadge[]>>(new Map())
  const key = tripIds.join(',')
  useEffect(() => {
    if (!enabled || tripIds.length === 0) { setByTrip(new Map()); return }
    let cancelled = false
    pluginsApi.tripCardContributions(tripIds)
      .then(({ contributions }) => {
        if (cancelled) return
        const m = new Map<number, TripCardBadge[]>()
        for (const c of contributions || []) {
          const arr = m.get(c.tripId)
          if (arr) arr.push(c); else m.set(c.tripId, [c])
        }
        setByTrip(m)
      })
      .catch(() => { if (!cancelled) setByTrip(new Map()) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])
  return useCallback((tripId: number): TripCardBadge[] => byTrip.get(tripId) ?? EMPTY, [byTrip])
}

/** The plugin badge strip on a trip card. Renders nothing when no plugin contributes. */
export function TripCardBadges({ items }: { items: TripCardBadge[] }) {
  if (!items.length) return null
  return (
    <div className="trip-plugin-badges">
      {items.map((b) => {
        const inner = (
          <>
            <span className="badge-label">{b.label}</span>
            {b.value != null && b.value !== '' && <span className="badge-value">{b.value}</span>}
          </>
        )
        const cls = `trip-plugin-badge tone-${b.tone}`
        return b.url
          ? <a key={b.pluginId + b.id} href={b.url} target="_blank" rel="noreferrer noopener" className={cls} onClick={(e) => e.stopPropagation()}>{inner}</a>
          : <span key={b.pluginId + b.id} className={cls}>{inner}</span>
      })}
    </div>
  )
}
