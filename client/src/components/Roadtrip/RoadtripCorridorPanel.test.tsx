import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripCorridorPanel from './RoadtripCorridorPanel'
import type { CorridorPoi } from './useCorridorPois'
import type { RoadtripCorridor } from './useRoadtripCorridor'
import type { RoadtripDay, RoadtripRoutes, RoadtripStop } from './useRoadtripRoutes'

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

const stop = (id: number, name: string): RoadtripStop => ({
  assignmentId: id,
  placeId: id * 10,
  name,
  lat: 53.5,
  lng: 9.9,
  time: null,
  dwellMinutes: null,
  legMode: null,
  incomingLegMode: null,
})

const day = (dayId: number, dayNumber: number): RoadtripDay => ({
  dayId,
  dayNumber,
  date: null,
  title: null,
  stops: [stop(dayId * 10 + 1, 'Hamburg'), stop(dayId * 10 + 2, 'Berlin')],
  legs: [],
  schedule: { entries: [], warnings: [] },
  geometry: [],
  distance: 0,
  duration: 0,
})

const routes = (days: RoadtripDay[]): RoadtripRoutes => ({
  days,
  lines: [],
  segments: [],
  totalDistance: 0,
  totalDuration: 0,
  totalStops: days.length * 2,
  loading: false,
})

function poi(over: Partial<CorridorPoi> & { osm_id: string; name: string }): CorridorPoi {
  return {
    lat: 53.5,
    lng: 9.9,
    category: 'fuel',
    poi_type: 'amenity=fuel',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    cuisine: null,
    source: 'openstreetmap',
    offRouteKm: 1.2,
    alongKm: 40,
    ...over,
  } as CorridorPoi
}

function corridor(over: Partial<RoadtripCorridor> = {}, search: Partial<RoadtripCorridor['search']> = {}): RoadtripCorridor {
  const days = over.day ? [over.day] : [day(1, 1)]
  return {
    dayId: String(days[0].dayId),
    setDayId: vi.fn(),
    day: days[0],
    categories: ['fuel'],
    toggleCategory: vi.fn(),
    widthKm: 5,
    setWidthKm: vi.fn(),
    ...over,
    search: {
      results: [],
      progress: { done: 0, total: 0 },
      loading: false,
      capped: false,
      failedAreas: 0,
      error: false,
      search: vi.fn(),
      clear: vi.fn(),
      ...search,
    },
  }
}

describe('RoadtripCorridorPanel', () => {
  it('FE-ROADTRIP-PANEL-001: searching is a button, never a side effect of opening the panel', () => {
    const c = corridor()
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(c.search.search).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(c.search.search).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-PANEL-002: nothing selected means nothing to search for', () => {
    const c = corridor({ categories: [] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('FE-ROADTRIP-PANEL-003: a day with a single stop has no drive to search along', () => {
    const lonely = { ...day(1, 1), stops: [stop(11, 'Hamburg')] }
    const c = corridor({ day: lonely })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([lonely])} />)

    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('FE-ROADTRIP-PANEL-004: toggling a kind reports which one', () => {
    const c = corridor()
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    fireEvent.click(screen.getByRole('button', { name: /campsite/i }))
    expect(c.toggleCategory).toHaveBeenCalledWith('campsite')
    // What is already selected reads as pressed rather than only looking different.
    expect(screen.getByRole('button', { name: /fuel/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-ROADTRIP-PANEL-005: the corridor width is a choice, and the current one is marked', () => {
    const c = corridor()
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    const five = screen.getByRole('button', { name: '5 km' })
    expect(five).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: '10 km' }))
    expect(c.setWidthKm).toHaveBeenCalledWith(10)
  })

  it('FE-ROADTRIP-PANEL-006: the day picker only appears once there is more than one drive', () => {
    const one = corridor()
    const { unmount } = wrap(<RoadtripCorridorPanel corridor={one} routes={routes([day(1, 1)])} />)
    expect(screen.queryByText('Day 1')).not.toBeInTheDocument()
    unmount()

    wrap(<RoadtripCorridorPanel corridor={corridor()} routes={routes([day(1, 1), day(2, 2)])} />)
    expect(screen.getByText('Day 1')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-PANEL-007: groups the hits by kind and counts each group', () => {
    const c = corridor({ categories: ['fuel', 'campsite'] }, {
      results: [
        poi({ osm_id: 'a', name: 'Aral', alongKm: 10 }),
        poi({ osm_id: 'b', name: 'Shell', alongKm: 20 }),
        poi({ osm_id: 'c', name: 'Camping Elbe', category: 'campsite', alongKm: 30 }),
      ],
    })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    // "Fuel" is also a filter chip; the group header is the one inside a <header>.
    const fuelGroup = screen.getAllByText('Fuel').map(el => el.closest('header')).find(Boolean)!
    expect(within(fuelGroup).getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Camping Elbe')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-PANEL-008: each hit says how far off the route and how far along it is', () => {
    const c = corridor({}, { results: [poi({ osm_id: 'a', name: 'Aral', offRouteKm: 1.2, alongKm: 40 })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    const row = screen.getByText('Aral').closest('li')!
    expect(within(row).getByText(/1\.2 km/)).toBeInTheDocument()
    expect(within(row).getByText(/40 km/)).toBeInTheDocument()
  })

  it('FE-ROADTRIP-PANEL-009: a hit right at the start says so instead of "0 km along"', () => {
    const c = corridor({}, { results: [poi({ osm_id: 'a', name: 'Aral', alongKm: 0.1 })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByText('Aral').closest('li')!.textContent).not.toContain('0 km along')
  })

  it('FE-ROADTRIP-PANEL-010: a chain shows its own logo ahead of its name', () => {
    const c = corridor({}, { results: [poi({ osm_id: 'a', name: 'Aral', brand_wikidata: 'Q565734' } as Partial<CorridorPoi> & { osm_id: string; name: string })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    const row = screen.getByText('Aral').closest('li')!
    const logo = row.querySelector('img')!
    expect(logo).toHaveAttribute('src', '/api/maps/brand-logo/Q565734')
    // Hidden until it has loaded, so a brand without one shows the category icon
    // rather than a hole in the row.
    expect(logo.className).toContain('opacity-0')
  })

  it('FE-ROADTRIP-PANEL-011: a wikidata id that is not one is never put in a URL', () => {
    const c = corridor({}, { results: [poi({ osm_id: 'a', name: 'Aral', brand_wikidata: '../../etc/passwd' } as Partial<CorridorPoi> & { osm_id: string; name: string })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByText('Aral').closest('li')!.querySelector('img')).toBeNull()
  })

  it('FE-ROADTRIP-PANEL-012: adding a hit puts it on the day that was searched', () => {
    const onAddPoi = vi.fn()
    const c = corridor({}, { results: [poi({ osm_id: 'node:9', name: 'Aral' })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} onAddPoi={onAddPoi} />)

    fireEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAddPoi).toHaveBeenCalledWith(expect.objectContaining({ osm_id: 'node:9' }), 1)
  })

  it('FE-ROADTRIP-PANEL-013: while searching it reports progress rather than sitting still', () => {
    const c = corridor({}, { loading: true, progress: { done: 3, total: 12 } })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(screen.getByRole('button', { name: /3/ })).toBeDisabled()
  })

  it('FE-ROADTRIP-PANEL-014: a partial answer says which stretches nobody looked at', () => {
    const c = corridor({}, { failedAreas: 2, results: [poi({ osm_id: 'a', name: 'Aral' })] })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    // The difference between "no fuel here" and "nobody looked here".
    expect(screen.getByText('2 stretches could not be searched — the place search did not answer.')).toBeInTheDocument()
    expect(screen.getByText('Aral')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-PANEL-015: a total outage reads as a failure, not as an empty road', () => {
    const c = corridor({}, { error: true, failedAreas: 4 })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByText('The place search is not answering right now.')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-PANEL-016: a drive longer than the budget admits the tail went unsearched', () => {
    const c = corridor({}, { capped: true })
    wrap(<RoadtripCorridorPanel corridor={c} routes={routes([day(1, 1)])} />)

    expect(screen.getByText('The route is long — only the first stretch was searched.')).toBeInTheDocument()
  })
})
