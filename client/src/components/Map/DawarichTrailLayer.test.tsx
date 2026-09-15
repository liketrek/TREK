/**
 * FE-DAWARICH-TRAILUI-010 to FE-DAWARICH-TRAILUI-015: the recorded-route
 * overlay on the Leaflet renderer.
 *
 * Everything this component decides is a decision about legibility on top of
 * somebody else's map, and every one of them is the kind that quietly rots:
 *
 *  - **two lines per segment, casing first.** The white casing is what keeps
 *    the route visible over a satellite tile. It only works while it is drawn
 *    *under* the coloured line, so the order of the two `map()` blocks is
 *    load-bearing and not cosmetic.
 *  - **`interactive: false` on both.** A Leaflet path without it grows an
 *    invisible hit area that lies over the places and the planned route and
 *    eats the clicks meant for them. Losing this flag breaks selection on a
 *    surface that has nothing to do with Dawarich, which is why it is pinned
 *    here rather than left to a reviewer's eye.
 *  - **colour through `pathOptions`**, because react-leaflet only calls
 *    `setStyle` when that object's identity changes; a bare `color` prop sticks
 *    at its mount-time value and a day recolour never arrives.
 *  - **the day filter keeps the day's colour.** The colour index comes from the
 *    day's place in the whole track, so scrubbing to a single day dims the rest
 *    of the trip instead of repainting the day the user is looking at.
 *
 * The empty case matters too: returning `null` rather than an empty fragment is
 * what stops Leaflet from being handed zero-length polylines on every trip that
 * has no recording.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DawarichTrack, DawarichTrackDay } from '@trek/shared'
import { DAWARICH_DAY_COLORS, DAWARICH_TRAIL_CASING } from './dawarichTrail'

// Leaflet itself is irrelevant here. What is under test is which polylines are
// asked for and with what options, so the mock reflects the props back as data
// attributes and the assertions read them in render order.
vi.mock('react-leaflet', () => ({
  Polyline: ({
    positions,
    pathOptions,
    pane,
    interactive,
  }: {
    positions: Array<[number, number]>
    pathOptions?: Record<string, unknown>
    pane?: string
    interactive?: boolean
  }) => (
    <div
      data-testid="polyline"
      data-points={JSON.stringify(positions)}
      data-color={String(pathOptions?.color ?? '')}
      data-weight={String(pathOptions?.weight ?? '')}
      data-opacity={String(pathOptions?.opacity ?? '')}
      data-dash={String(pathOptions?.dashArray ?? '')}
      data-pane={pane ?? ''}
      data-interactive={String(interactive)}
    />
  ),
}))

import DawarichTrailLayer from './DawarichTrailLayer'

function day(date: string, ...segments: Array<Array<[number, number]>>): DawarichTrackDay {
  return {
    date,
    segments: segments.map((points, i) => ({
      points,
      mode: 'walking',
      startedAt: date + 'T08:0' + i + ':00.000Z',
      endedAt: date + 'T09:0' + i + ':00.000Z',
      distanceMeters: 1200,
    })),
  }
}

function track(days: DawarichTrackDay[]): DawarichTrack {
  return {
    days,
    source: 'tracks',
    fetchedAt: '2026-05-03T10:00:00.000Z',
    pointCount: days.reduce((sum, d) => sum + d.segments.reduce((n, s) => n + s.points.length, 0), 0),
    truncated: false,
  }
}

const DAY_ONE = day('2026-05-01', [[48.2, 16.37], [48.21, 16.38]])
const DAY_TWO = day('2026-05-02', [[45.46, 9.18], [45.47, 9.19]], [[45.5, 9.2], [45.51, 9.21]])

const lines = () => screen.queryAllByTestId('polyline')

describe('DawarichTrailLayer', () => {
  it('FE-DAWARICH-TRAILUI-010: draws nothing at all when there is no recording', () => {
    const { container } = render(<DawarichTrailLayer track={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('FE-DAWARICH-TRAILUI-011: ignores a segment that is a single fix rather than a line', () => {
    // Dawarich reports a lone point for a day someone only opened the app on.
    // Leaflet would accept the one-point polyline and draw nothing visible, but
    // it would still be a layer, and every such day would add two of them.
    const { container } = render(<DawarichTrailLayer track={track([day('2026-05-01', [[48.2, 16.37]])])} />)
    expect(container.firstChild).toBeNull()
  })

  it('FE-DAWARICH-TRAILUI-012: draws every casing first, then every coloured line on top', () => {
    render(<DawarichTrailLayer track={track([DAY_ONE, DAY_TWO])} casingPane="trek-track-casing" />)

    const drawn = lines()
    expect(drawn).toHaveLength(6) // three segments, casing + line each

    // The first half is the casing pass. Reversing these two blocks would put
    // the white line over the coloured one and the overlay would go white.
    const casings = drawn.slice(0, 3)
    const coloured = drawn.slice(3)
    expect(casings.every(el => el.getAttribute('data-color') === DAWARICH_TRAIL_CASING)).toBe(true)
    expect(coloured.some(el => el.getAttribute('data-color') === DAWARICH_TRAIL_CASING)).toBe(false)
  })

  it('FE-DAWARICH-TRAILUI-013: gives the casing the pane and the weight that make it a casing, and nothing catches clicks', () => {
    render(<DawarichTrailLayer track={track([DAY_ONE])} casingPane="trek-track-casing" />)

    const [casing, line] = lines()
    expect(casing.getAttribute('data-pane')).toBe('trek-track-casing')
    expect(casing.getAttribute('data-weight')).toBe('6')
    expect(casing.getAttribute('data-opacity')).toBe('0.55')

    // Only the casing takes the pane; the coloured line is left in Leaflet's
    // default overlay pane. Pinned as the fact it is rather than as a rule:
    // that pane also holds the planned route, and the trail is mounted after
    // it, so the recorded line currently draws over the plan while the GL twin
    // puts both of its layers under it.
    expect(line.getAttribute('data-pane')).toBe('')
    expect(line.getAttribute('data-weight')).toBe('3')
    expect(line.getAttribute('data-dash')).toBe('6 5')
    expect(line.getAttribute('data-points')).toBe(JSON.stringify([[48.2, 16.37], [48.21, 16.38]]))

    expect(lines().every(el => el.getAttribute('data-interactive') === 'false')).toBe(true)
  })

  it('FE-DAWARICH-TRAILUI-014: works without a casing pane on a renderer that has none', () => {
    render(<DawarichTrailLayer track={track([DAY_ONE])} />)

    // An older Leaflet build, or the GL renderer's Leaflet fallback, has no
    // pane API and MapView passes undefined. Everything then lands in the
    // default overlay pane in insertion order, which still keeps the casing
    // under its own line, the one piece of the stacking that has to hold.
    expect(lines().every(el => el.getAttribute('data-pane') === '')).toBe(true)
    expect(lines()).toHaveLength(2)
  })

  it('FE-DAWARICH-TRAILUI-015: scrubbing to one day keeps that day its own colour', () => {
    const { rerender } = render(<DawarichTrailLayer track={track([DAY_ONE, DAY_TWO])} selectedDate="2026-05-02" />)

    // Two segments on the second day, so two casings and two lines, and the hue
    // is the SECOND of the palette even though it is now the only day drawn.
    expect(lines()).toHaveLength(4)
    expect(lines().slice(2).map(el => el.getAttribute('data-color')))
      .toEqual([DAWARICH_DAY_COLORS[1], DAWARICH_DAY_COLORS[1]])

    rerender(<DawarichTrailLayer track={track([DAY_ONE, DAY_TWO])} selectedDate="2026-05-01" />)
    expect(lines().slice(1).map(el => el.getAttribute('data-color'))).toEqual([DAWARICH_DAY_COLORS[0]])

    // A day nobody recorded on falls back to the empty case rather than to the
    // whole trip, which would be the worst possible answer to "show me Sunday".
    rerender(<DawarichTrailLayer track={track([DAY_ONE, DAY_TWO])} selectedDate="2026-05-09" />)
    expect(lines()).toHaveLength(0)
  })
})
