import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripSidebar from './RoadtripSidebar'
import RoadtripModeSwitch from './RoadtripModeSwitch'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

function stop(over: Partial<RoadtripStop> & { assignmentId: number; name: string }): RoadtripStop {
  return {
    placeId: over.assignmentId * 10,
    lat: 53.5,
    lng: 9.9,
    time: null,
    dwellMinutes: null,
    legMode: null,
    incomingLegMode: null,
    ...over,
  }
}

const leg = (over: Partial<RouteSegment> = {}): RouteSegment =>
  ({ distance: 100000, duration: 3600, distanceText: '100 km', durationText: '1 h', mode: 'driving', ...over }) as RouteSegment

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  const stops = over.stops ?? [
    stop({ assignmentId: 1, name: 'Hamburg' }),
    stop({ assignmentId: 2, name: 'Berlin' }),
  ]
  return {
    dayId: 1,
    dayNumber: 1,
    date: null,
    title: null,
    stops,
    legs: [leg()],
    schedule: { entries: stops.map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })), warnings: [] },
    geometry: [],
    distance: 100000,
    duration: 3600,
    ...over,
  }
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [day()],
    lines: [],
    segments: [],
    totalDistance: 100000,
    totalDuration: 3600,
    totalStops: 2,
    loading: false,
    ...over,
  }
}

describe('RoadtripSidebar', () => {
  /** The value shown in the totals card with this label. */
  const total = (label: string): string =>
    within(screen.getByText(label).closest('div.rounded-xl')!).getAllByText(/./)[1].textContent!

  it('FE-ROADTRIP-SIDEBAR-001: leads with the totals for the whole drive', () => {
    wrap(<RoadtripSidebar routes={routes({ totalDistance: 250000, totalDuration: 9000, totalStops: 5 })} />)

    expect(total('Distance')).toBe('250 km')
    expect(total('Driving time')).toBe('2 h 30 min')
    expect(total('Stops')).toBe('5')
  })

  it('FE-ROADTRIP-SIDEBAR-002: chains the stops with the drive between them', () => {
    // Day totals deliberately differ from the single leg, so the leg is unambiguous.
    wrap(<RoadtripSidebar routes={routes({ days: [day({ distance: 250000, duration: 9000 })] })} />)

    expect(screen.getByText('Hamburg')).toBeInTheDocument()
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    // The leg reads as one line between the two stops it connects.
    expect(screen.getByText('100 km · 1 h')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-003: says a leg is still coming rather than showing a blank', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [day({ legs: [undefined], distance: 0, duration: 0 })] })} />)

    expect(screen.queryByText('100 km · 1 h')).not.toBeInTheDocument()
    expect(screen.getByText('No route')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-004: sets a pinned arrival apart from a computed one', () => {
    const stops = [stop({ assignmentId: 1, name: 'Ferry' }), stop({ assignmentId: 2, name: 'Berlin' })]
    const schedule = {
      entries: [
        { arrival: '09:00', departure: '09:30', anchored: true, dayOffset: 0 },
        { arrival: '10:30', departure: '10:30', anchored: false, dayOffset: 0 },
      ],
      warnings: [],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    expect(screen.getByText('09:00').className).toContain('font-semibold')
    expect(screen.getByText('10:30').className).toContain('text-content-muted')
  })

  it('FE-ROADTRIP-SIDEBAR-005: flags a stop the drive cannot reach in time', () => {
    const stops = [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Ferry' })]
    const schedule = {
      entries: stops.map(() => ({ arrival: '09:00', departure: '09:00', anchored: true, dayOffset: 0 })),
      warnings: [{ index: 1, code: 'late' as const, minutes: 45 }],
    }
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops, schedule })] })} />)

    expect(screen.getByLabelText(/45/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-006: shows how long a stop is planned to take', () => {
    const stops = [stop({ assignmentId: 1, name: 'Museum', dwellMinutes: 90 }), stop({ assignmentId: 2, name: 'Berlin' })]
    wrap(<RoadtripSidebar routes={routes({ days: [day({ stops })] })} />)

    expect(screen.getByText('1 h 30 min')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-007: selecting a stop reports the place and the assignment', () => {
    const onSelectStop = vi.fn()
    wrap(<RoadtripSidebar routes={routes()} onSelectStop={onSelectStop} />)

    fireEvent.click(screen.getByText('Berlin'))
    expect(onSelectStop).toHaveBeenCalledWith(20, 2)
  })

  it('FE-ROADTRIP-SIDEBAR-008: marks the selected stop for assistive tech', () => {
    wrap(<RoadtripSidebar routes={routes()} selectedAssignmentId={2} />)

    const selected = screen.getByText('Berlin').closest('button')!
    expect(selected).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Hamburg').closest('button')).not.toHaveAttribute('aria-current')
  })

  it('FE-ROADTRIP-SIDEBAR-009: a trip with nothing to drive explains itself', () => {
    wrap(<RoadtripSidebar routes={routes({ days: [], totalDistance: 0, totalDuration: 0, totalStops: 0 })} />)

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    expect(screen.queryByText('Hamburg')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-SIDEBAR-010: each day carries its own distance and time', () => {
    const second = day({ dayId: 2, dayNumber: 2, distance: 50000, duration: 1800, stops: [
      stop({ assignmentId: 3, name: 'Dresden' }),
      stop({ assignmentId: 4, name: 'Prague' }),
    ] })
    wrap(<RoadtripSidebar routes={routes({ days: [day(), second], totalStops: 4 })} />)

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(2)
    expect(within(headings[1].parentElement!).getByText(/50 km/)).toBeInTheDocument()
  })
})

describe('RoadtripModeSwitch', () => {
  it('FE-ROADTRIP-MODESWITCH-001: offers both readings and marks the active one', () => {
    wrap(<RoadtripModeSwitch active onChange={vi.fn()} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('FE-ROADTRIP-MODESWITCH-002: switching back to the day plan reports false', () => {
    const onChange = vi.fn()
    wrap(<RoadtripModeSwitch active onChange={onChange} />)

    fireEvent.click(screen.getAllByRole('tab')[0])
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
