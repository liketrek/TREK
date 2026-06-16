import { Car, Footprints, Hotel } from 'lucide-react'
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

/**
 * The hotel's bookend legs for a day: a two-line connector naming the day's
 * accommodation with the drive to/from it. Rendered above the first place (the
 * morning departure from the hotel) and below the last place (the evening return),
 * when the "optimize from accommodation" setting is on and the day has a hotel.
 */
export function HotelRouteConnector({
  seg,
  profile,
  name,
  placement,
}: {
  seg: RouteSegment
  profile: 'driving' | 'walking'
  name: string
  placement: 'top' | 'bottom'
}) {
  const driving = profile === 'driving'
  const Icon = driving ? Car : Footprints
  const line = { flex: 1, height: 1, minHeight: 1, alignSelf: 'center', background: 'var(--border-primary)' }
  const hotelRow = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0 14px', minWidth: 0 }}>
      <Hotel size={12} strokeWidth={1.8} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
        {name}
      </span>
    </div>
  )
  const travelRow = (
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: placement === 'top' ? '2px 0 6px' : '6px 0 2px' }}>
      {placement === 'top' ? (
        <>
          {hotelRow}
          {travelRow}
        </>
      ) : (
        <>
          {travelRow}
          {hotelRow}
        </>
      )}
    </div>
  )
}
