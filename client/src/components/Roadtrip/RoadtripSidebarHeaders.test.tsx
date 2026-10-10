import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'
import { DayHeader, TripSummary } from './RoadtripSidebarHeaders'
import { preferences, resetRailStores, seedRailSettings, tooltipOf } from '../../../tests/helpers/roadtripRail'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

beforeEach(() => seedRailSettings())
afterEach(() => resetRailStores())

function stop(over: Partial<RoadtripStop> & { assignmentId: number; name: string }): RoadtripStop {
  return {
    placeId: over.assignmentId * 10, ownerDayId: 1, ownerIndex: 0, lat: 53.5, lng: 9.9,
    time: null, dwellMinutes: null, legMode: null, incomingLegMode: null, stopType: null,
    ...over,
  }
}

const leg = (): RouteSegment =>
  ({ distance: 152000, duration: 5880, distanceText: '152 km', durationText: '1 h 38 min', mode: 'driving' }) as RouteSegment

function day(over: Partial<RoadtripDay> = {}): RoadtripDay {
  const stops = over.stops ?? [stop({ assignmentId: 1, name: 'Hamburg' }), stop({ assignmentId: 2, name: 'Lübeck' })]
  return {
    dayId: 1, dayNumber: 2, date: null, title: null,
    legs: [leg()], legVias: [], driveWarnings: [], dayWarning: null,
    schedule: { entries: stops.map(() => ({ arrival: null, departure: null, anchored: false, dayOffset: 0 })), warnings: [] },
    geometry: [], distance: 152000, duration: 5880,
    ...over,
    stops,
  }
}

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [], lines: [], lineDays: [], lineJoins: [], segments: [], accessLines: [], vias: [],
    totalDistance: 691600, totalDuration: 32640, totalStops: 12, quietDays: [], loading: false,
    ...over,
  }
}

describe('TripSummary', () => {
  it('FE-ROADTRIP-HEADERS-001: three figures under their captions, the whole numbers set apart from the units and decimals', () => {
    const { container } = wrap(<TripSummary routes={routes()} narrow={false} />)
    const value = (caption: string): Element => screen.getByText(caption).parentElement!.lastElementChild!
    expect(value('Distance')).toHaveTextContent('691.6 km')
    expect(value('Driving time')).toHaveTextContent('9 h 4 min')
    expect(value('Stops')).toHaveTextContent('12')
    // "691" carries the size, ".6" and " km" step back into the unit's quiet type.
    expect([...value('Distance').querySelectorAll('.text-content-muted')].map(u => u.textContent)).toEqual(['.6', ' km'])
    expect([...value('Driving time').querySelectorAll('.text-content-muted')].map(u => u.textContent)).toEqual([' h ', ' min'])
    expect(value('Stops').children).toHaveLength(0)
    expect(container.querySelectorAll('span.w-px')).toHaveLength(2)
    expect(screen.queryByText('Still working out the rest of the drive')).toBeNull()
  })

  it('FE-ROADTRIP-HEADERS-002: pulled narrow the stops give way, and while legs still land the figures say they are partial', () => {
    const { container } = wrap(<TripSummary routes={routes({ loading: true })} narrow />)
    expect(screen.queryByText('Stops')).toBeNull()
    expect(container.querySelectorAll('span.w-px')).toHaveLength(1)
    expect(container.querySelector('header')!.lastElementChild).toHaveTextContent('Still working out the rest of the drive')
  })
})

describe('DayHeader', () => {
  it('FE-ROADTRIP-HEADERS-003: the day reads its number, its title, its date, its drive and its stops', () => {
    const { container } = wrap(<DayHeader day={day({ title: 'Along the coast', date: '2026-06-02' })} />)
    const header = container.querySelector('header')!
    expect(container.firstElementChild).toBe(header)
    expect(screen.getByRole('heading', { name: 'Day 2' }).parentElement).toBe(header)
    expect(screen.getByText('Along the coast')).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute('dateTime', '2026-06-02')
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    // Read-only: no control, and the bottom rule over the list below.
    expect(header).not.toHaveAttribute('role')
    expect(header).toHaveClass('mb-1', 'border-b')
    expect(header).not.toHaveAttribute('style')
  })

  it('FE-ROADTRIP-HEADERS-004: pulled narrow the count gives way, and a day of only its night has no drive and no count', () => {
    const narrow = wrap(<DayHeader day={day()} narrow />)
    expect(screen.queryByText('2 stops')).toBeNull()
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
    narrow.unmount()

    wrap(<DayHeader day={day({ legs: [], stops: [stop({ assignmentId: 1, name: 'Hotel' })] })} />)
    expect(screen.queryByText(/km in/)).toBeNull()
    expect(screen.queryByText(/stop/)).toBeNull()
  })

  it('FE-ROADTRIP-HEADERS-005: the whole header folds the day on a click, Enter or Space, and says whether it is open', () => {
    const onToggle = vi.fn()
    const { container, rerender } = wrap(<DayHeader day={day()} onToggle={onToggle} />)
    const header = screen.getByRole('button', { expanded: true })
    expect(header.tagName).toBe('HEADER')
    fireEvent.click(header)
    fireEvent.keyDown(header, { key: 'Enter' })
    fireEvent.keyDown(header, { key: ' ' })
    fireEvent.keyDown(header, { key: 'Tab' })
    expect(onToggle).toHaveBeenCalledTimes(3)

    rerender(<TranslationProvider><DayHeader day={day()} onToggle={onToggle} collapsed /></TranslationProvider>)
    expect(container.querySelector('header')).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('header')).not.toHaveClass('border-b')
  })

  it('FE-ROADTRIP-HEADERS-006: a day over the driving limit says by how much, and what the limit counts', () => {
    wrap(<DayHeader day={day({ dayWarning: { code: 'dayDriving', minutes: 540, limitMinutes: 480 } })} />)
    const badge = screen.getByText('1 h over')
    expect(badge).toHaveClass('text-warning')
    expect(tooltipOf(badge)).toBe('Driving only, excluding stays and overnight legs.')
  })

  it('FE-ROADTRIP-HEADERS-007: the roads a day could not avoid are among its facts', () => {
    wrap(<DayHeader day={day({ avoidMissed: ['toll', 'ferry'] })} />)
    const badge = screen.getByText('Toll roads, Ferries unavoidable')
    expect(badge.querySelector('svg.lucide-ban')).not.toBeNull()
    expect(tooltipOf(badge)).toBe('This day has no route around it, so the drive uses it. Every other day still avoids what it can.')
  })

  it('FE-ROADTRIP-HEADERS-008: a ride the drive reaches too late is named in the header', () => {
    const departure = stop({
      assignmentId: 3, name: 'Hamburg Airport', time: '13:15',
      carrier: { reservationId: 9, type: 'flight', role: 'departure', title: 'LH 2078', code: 'HAM', at: '15:15' },
    })
    wrap(
      <DayHeader
        day={day({
          stops: [stop({ assignmentId: 1, name: 'Hamburg' }), departure],
          schedule: { entries: [], warnings: [{ index: 1, code: 'late', minutes: 180 }] },
        })}
      />,
    )
    expect(screen.getByText('Flight missed')).toHaveClass('text-warning')
  })

  it('FE-ROADTRIP-HEADERS-009: the track badge follows a track, names the one it follows, and is tinted once the day carries vias', () => {
    const onFollowTrack = vi.fn()
    const plain = wrap(<DayHeader day={day()} onFollowTrack={onFollowTrack} />)
    const badge = screen.getByRole('button', { name: 'Track' })
    expect(badge).toHaveClass('bg-surface-card')
    expect(tooltipOf(badge)).toBe('Make this day follow an imported track')
    fireEvent.click(badge)
    expect(onFollowTrack).toHaveBeenCalledWith(1)
    plain.unmount()

    wrap(<DayHeader day={day()} onFollowTrack={onFollowTrack} viaCount={3} trackName="Küstenweg" />)
    const shaped = screen.getByRole('button', { name: 'Track' })
    expect(shaped).toHaveClass('bg-accent-subtle')
    expect(tooltipOf(shaped)).toBe('Currently following Küstenweg')
  })

  it('FE-ROADTRIP-HEADERS-010: while the map draws days in colour, the header is washed with its own', () => {
    preferences({ roadtrip_day_colors: true })
    const { container } = wrap(<DayHeader day={day({ dayNumber: 2 })} />)
    const header = container.querySelector('header')!
    expect(header.style.backgroundImage).toContain('linear-gradient(180deg, color-mix(in srgb, #ff9f0a 13%, var(--bg-secondary))')
    // The DOM spells the hue its own way here, so only the mix is pinned.
    expect(header.style.borderBottomColor).toMatch(/^color-mix\(in srgb, .+ 30%, transparent\)$/)
  })
})
