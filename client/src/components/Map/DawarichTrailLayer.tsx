import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { DawarichTrack } from '@trek/shared'
import {
  DAWARICH_TRAIL_CASING,
  trailSegments,
  type DawarichTrailSegment,
} from './dawarichTrail'

/**
 * The recorded route on the Leaflet renderer.
 *
 * Three lines per segment, the same construction the GPX tracks next door use:
 * a white casing so the line survives a satellite tile, the coloured line
 * itself, and nothing on top — this overlay is not clickable. That last part is
 * deliberate: a fat invisible hit-line would sit over the places and the
 * planned route, and swallow the clicks that select them, in exchange for a
 * popup nobody asked for.
 *
 * Dashed rather than solid. The planned route is already a solid line in the
 * user's accent, and the whole point of this layer is to be visibly the other
 * thing — what actually happened, next to what was planned. Telling them apart
 * has to survive being printed, screenshotted and looked at by someone who
 * cannot distinguish the two hues.
 */
export default function DawarichTrailLayer({
  track,
  selectedDate,
  hiddenDates,
  casingPane,
}: {
  track: DawarichTrack | null
  /** When set, only that local day is drawn. */
  selectedDate?: string | null
  /** Local dates whose day is folded away in the day plan. */
  hiddenDates?: ReadonlySet<string> | null
  /** The `trek-track-casing` pane, when the renderer supports panes. */
  casingPane?: string
}) {
  const segments = useMemo(() => trailSegments(track, selectedDate, hiddenDates), [track, selectedDate, hiddenDates])
  if (segments.length === 0) return null

  return (
    <>
      {segments.map((segment: DawarichTrailSegment) => (
        <Polyline
          key={`dawarich-casing-${segment.id}`}
          positions={segment.points}
          pane={casingPane}
          // theme-lint-disable — map paint
          pathOptions={{
            color: DAWARICH_TRAIL_CASING,
            weight: 6,
            opacity: 0.55,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
      {/* pathOptions rather than bare props: react-leaflet only calls setStyle
          when the pathOptions reference changes, so a bare `color` would stick
          at its mount-time value and a day recolour would never arrive. */}
      {segments.map((segment: DawarichTrailSegment) => (
        <Polyline
          key={`dawarich-line-${segment.id}`}
          positions={segment.points}
          pathOptions={{
            color: segment.color,
            weight: 3,
            opacity: 0.85,
            dashArray: '6 5',
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
    </>
  )
}
