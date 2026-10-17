import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'
import { useSettingsStore } from '../../store/settingsStore'
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
  it('FE-ROADTRIP-HEADERS-001: three figures on tiles under their captions, the whole numbers set apart from the units and decimals', () => {
    const { container } = wrap(<TripSummary routes={routes()} narrow={false} />)
    const value = (caption: string): Element => screen.getByText(caption).parentElement!.lastElementChild!
    expect(value('Distance')).toHaveTextContent('691.6 km')
    expect(value('Driving time')).toHaveTextContent('9 h 4 min')
    expect(value('Stops')).toHaveTextContent('12')
    // "691" carries the size, ".6" and " km" step back into the unit's quiet type.
    expect([...value('Distance').querySelectorAll('.text-content-muted')].map(u => u.textContent)).toEqual(['.6', ' km'])
    expect([...value('Driving time').querySelectorAll('.text-content-muted')].map(u => u.textContent)).toEqual([' h ', ' min'])
    expect(value('Stops').children).toHaveLength(0)
    // One tile per figure, in as many equal columns.
    const grid = (container.querySelector('header') as HTMLElement).firstElementChild as HTMLElement
    expect(grid.children).toHaveLength(3)
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(screen.queryByText('Still working out the rest of the drive')).toBeNull()
  })

  it('FE-ROADTRIP-HEADERS-002: pulled narrow the stops give way, and while legs still land the figures say they are partial', () => {
    const { container } = wrap(<TripSummary routes={routes({ loading: true })} narrow />)
    expect(screen.queryByText('Stops')).toBeNull()
    expect(((container.querySelector('header') as HTMLElement).firstElementChild as HTMLElement).children).toHaveLength(2)
    expect(container.querySelector('header')!.lastElementChild).toHaveTextContent('Still working out the rest of the drive')
  })
})

describe('DayHeader', () => {
  /** The width the pill row measures, so a case can pull the rail narrow. */
  const rowWidth = (px: number) => vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(px)
  afterEach(() => { vi.restoreAllMocks() })

  it('FE-ROADTRIP-HEADERS-003: the day reads its number and short date on the tile, its title, its drive and its stops', () => {
    const { container } = wrap(<DayHeader day={day({ title: 'Along the coast', date: '2026-06-02' })} />)
    const header = container.querySelector('header')!
    expect(container.firstElementChild).toBe(header)
    // A day with a title of its own reads the title as its heading; the number is on the tile.
    expect(screen.getByRole('heading', { name: 'Along the coast' })).toBeInTheDocument()
    const tile = header.firstElementChild as HTMLElement
    expect(tile.firstElementChild).toHaveTextContent('2')
    const time = container.querySelector('time') as HTMLElement
    expect(time).toHaveAttribute('dateTime', '2026-06-02')
    // The tile holds the short form; the full date is what a screen reader hears.
    expect(time).toHaveTextContent('2.6.')
    expect(time).toHaveAttribute('aria-label')
    expect(time.getAttribute('aria-label')).not.toBe('2.6.')
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    // Read-only: no control, no chevron, and the head band's neutral wash.
    expect(header).not.toHaveAttribute('role')
    expect(container.querySelector('svg.lucide-chevron-down, svg.lucide-chevron-right')).toBeNull()
    expect(header.style.background).toBe('color-mix(in srgb, var(--accent) 7%, transparent)')
  })

  it('FE-ROADTRIP-HEADERS-003b: without a title the heading is the day itself, and a 12-hour reader gets the month first on the tile', () => {
    useSettingsStore.setState({ settings: { distance_unit: 'metric', time_format: '12h' } as never })
    const { container } = wrap(<DayHeader day={day({ date: '2026-06-02' })} />)
    expect(screen.getByRole('heading', { name: 'Day 2' })).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveTextContent('6/2')
  })

  it('FE-ROADTRIP-HEADERS-004: the pills never wrap but give way in steps as the row narrows, and a day of only its night has no drive and no count', () => {
    // Room for everything: the drive with its time, the count with its word. The old
    // narrow flag no longer decides it; the row measures its own room.
    const wide = wrap(<DayHeader day={day()} narrow />)
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
    expect(screen.getByText('2 stops')).toBeInTheDocument()
    wide.unmount()

    // First the count drops its word, keeping it for a screen reader.
    rowWidth(220)
    const step1 = wrap(<DayHeader day={day()} />)
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
    expect(screen.getByLabelText('2 stops')).toHaveTextContent(/^2$/)
    step1.unmount()

    // Then the drive drops its time.
    rowWidth(150)
    const step2 = wrap(<DayHeader day={day()} />)
    expect(screen.getByText('152 km')).toBeInTheDocument()
    expect(screen.queryByText(/km in/)).toBeNull()
    expect(screen.getByLabelText('2 stops')).toBeInTheDocument()
    step2.unmount()

    // Last the count goes.
    rowWidth(80)
    const step3 = wrap(<DayHeader day={day()} />)
    expect(screen.getByText('152 km')).toBeInTheDocument()
    expect(screen.queryByLabelText('2 stops')).toBeNull()
    step3.unmount()
    vi.restoreAllMocks()

    wrap(<DayHeader day={day({ legs: [], stops: [stop({ assignmentId: 1, name: 'Hotel' })] })} />)
    expect(screen.queryByText(/km in/)).toBeNull()
    expect(screen.queryByText(/stop/)).toBeNull()
  })

  it('FE-ROADTRIP-HEADERS-005: the whole header folds the day on a click, Enter or Space, says whether it is open, and its chevron says the same', () => {
    const onToggle = vi.fn()
    const { container, rerender } = wrap(<DayHeader day={day()} onToggle={onToggle} />)
    const header = screen.getByRole('button', { name: 'Day 2', expanded: true })
    expect(header.tagName).toBe('HEADER')
    expect(container.querySelector('svg.lucide-chevron-down')).not.toBeNull()
    fireEvent.click(header)
    fireEvent.keyDown(header, { key: 'Enter' })
    fireEvent.keyDown(header, { key: ' ' })
    fireEvent.keyDown(header, { key: 'Tab' })
    expect(onToggle).toHaveBeenCalledTimes(3)

    rerender(<TranslationProvider><DayHeader day={day()} onToggle={onToggle} collapsed /></TranslationProvider>)
    expect(container.querySelector('header')).toHaveAttribute('aria-expanded', 'false')
    expect(container.querySelector('svg.lucide-chevron-right')).not.toBeNull()
    expect(container.querySelector('svg.lucide-chevron-down')).toBeNull()
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

  it('FE-ROADTRIP-HEADERS-008: a ride the drive reaches too late takes no pill in the head, which keeps to the facts of the day', () => {
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
    expect(screen.queryByText('Flight missed')).toBeNull()
    expect(screen.getByText('152 km in 1 h 38 min')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-HEADERS-009: the track pill follows a track without folding the day, names the one it follows, and is filled once the day carries vias', () => {
    const onFollowTrack = vi.fn()
    const onToggle = vi.fn()
    const plain = wrap(<DayHeader day={day()} onFollowTrack={onFollowTrack} onToggle={onToggle} />)
    const badge = screen.getByRole('button', { name: 'Track' })
    expect(badge).toHaveClass('bg-surface-card')
    expect(tooltipOf(badge)).toBe('Make this day follow an imported track')
    fireEvent.click(badge)
    expect(onFollowTrack).toHaveBeenCalledWith(1)
    expect(onToggle).not.toHaveBeenCalled()
    // A key pressed on the pill belongs to the pill, not to the band around it.
    fireEvent.keyDown(badge, { key: 'Enter' })
    expect(onToggle).not.toHaveBeenCalled()
    plain.unmount()

    wrap(<DayHeader day={day()} onFollowTrack={onFollowTrack} viaCount={3} trackName="Küstenweg" />)
    const shaped = screen.getByRole('button', { name: 'Track' })
    expect(shaped).toHaveClass('bg-accent', 'text-accent-text')
    expect(tooltipOf(shaped)).toBe('Currently following Küstenweg')
  })

  it('FE-ROADTRIP-HEADERS-010: while the map draws days in colour, the header band and the day tile are washed with its own', () => {
    preferences({ roadtrip_day_colors: true })
    const { container } = wrap(<DayHeader day={day({ dayNumber: 2 })} />)
    const header = container.querySelector('header')!
    // The DOM spells the hue its own way here, so only the mix is pinned.
    expect(header.style.background).toMatch(/^color-mix\(in srgb, .+ 11%, transparent\)$/)
    expect((header.firstElementChild as HTMLElement).style.background).toMatch(/^color-mix\(in srgb, .+ 22%, var\(--bg-card\)\)$/)
  })
})
