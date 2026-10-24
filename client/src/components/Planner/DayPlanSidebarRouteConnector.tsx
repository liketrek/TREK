import { Hotel } from 'lucide-react'
import type { RouteSegment } from '../../types'
import { fs } from '../shared/DialogShell'
import { routeModeIcon } from './routeModes'

/** The leg's figures as one quiet pill: mode, time, distance and a router note, side by side. */
function LegPill({ seg, profile }: { seg: RouteSegment; profile: string }) {
  // The leg's own mode (#1281) wins over the day-wide fallback for icon + text.
  const effProfile = seg.mode ?? profile
  const driving = effProfile !== 'walking'
  const Icon = routeModeIcon(effProfile)
  return (
    <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-secondary px-2 py-[2px] font-geist font-semibold tabular-nums text-content-muted" style={fs(10)}>
      <Icon size={11} strokeWidth={2} className="flex-none" />
      <span>{seg.durationText ?? (driving ? seg.drivingText : seg.walkingText)}</span>
      <span className="text-content-faint">{seg.distanceText}</span>
      {seg.noteText && <span className="text-content-secondary">{seg.noteText}</span>}
    </span>
  )
}

const LINE = 'h-px min-w-3 flex-1 bg-edge-faint'

/** Slim travel-time connector shown between two consecutive located stops in a day. */
export function RouteConnector({ seg, profile }: { seg: RouteSegment; profile: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-[3px]">
      <span className={LINE} />
      <LegPill seg={seg} profile={profile} />
      <span className={LINE} />
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
  profile: string
  name: string
  placement: 'top' | 'bottom'
}) {
  const hotelRow = (
    <div className="flex min-w-0 items-center justify-center gap-1.5 px-3">
      <Hotel size={12} strokeWidth={2} className="flex-none text-content-muted" />
      <span className="truncate font-semibold text-content-muted" style={{ ...fs(11), lineHeight: 1.2 }}>
        {name}
      </span>
    </div>
  )
  const travelRow = (
    <div className="flex items-center gap-2 px-3 py-[3px]">
      <span className={LINE} />
      <LegPill seg={seg} profile={profile} />
      <span className={LINE} />
    </div>
  )
  return (
    <div className={`flex flex-col gap-[3px] ${placement === 'top' ? 'pb-1.5 pt-0.5' : 'pb-0.5 pt-1.5'}`}>
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
