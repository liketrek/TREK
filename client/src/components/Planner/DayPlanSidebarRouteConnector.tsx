import { Car, Footprints } from 'lucide-react'
import type { RouteSegment } from '../../types'

/** Slim travel-time connector shown between two consecutive located stops in a day. */
export function RouteConnector({ seg, profile }: { seg: RouteSegment; profile: 'driving' | 'walking' }) {
  const driving = profile === 'driving'
  const Icon = driving ? Car : Footprints
  const line = { flex: 1, height: 1, minHeight: 1, alignSelf: 'center', background: 'var(--border-primary)' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 14px', fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.2 }}>
      <div style={line} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Icon size={11} strokeWidth={2} />
        <span>{seg.durationText ?? (driving ? seg.drivingText : seg.walkingText)}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>{seg.distanceText}</span>
      </div>
      <div style={line} />
    </div>
  )
}
