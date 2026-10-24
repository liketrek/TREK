import { fireEvent, render, screen } from '../../../../../tests/helpers/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourListItem } from '@trek/shared'
import en from '@trek/shared/i18n/en'
import de from '@trek/shared/i18n/de'
import { resetAllStores, seedStore } from '../../../../../tests/helpers/store'
import { useSettingsStore } from '../../../../store/settingsStore'
import { useTripStore } from '../../../../store/tripStore'
import type { TripPlanner, MTripShellApi } from '../MTripShell'
import MToursSelectionList from './MToursSelectionList'
import type { ComponentProps } from 'react'
import { useTourListFilters } from '../../../../components/Tours/useTourListFilters'

/** The list as the places browser mounts it: its filters from the shared hook (PR1-13). */
function List(props: Omit<ComponentProps<typeof MToursSelectionList>, 'filters'>) {
  const filters = useTourListFilters(props.planner.tours)
  return <MToursSelectionList {...props} filters={filters} />
}

const tour: TourListItem = {
  place_id: 42,
  name: 'Camping tour with a deliberately long readable name',
  tour_type: 'hike',
  distance: 12.5,
  elevation_gain: 420,
  elevation_loss: 390,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  has_waypoints: true,
  max_hiking_difficulty: 2,
  planned: false,
  caution: false,
}

const day = { id: 11, day_number: 1, date: '2026-07-08', title: null } as never

const handlePlaceClick = vi.fn()
const openSheet = vi.fn()

function translate(table: Record<string, unknown>) {
  return (key: string, params?: Record<string, string | number>) => {
    // The one form is all a count of 1 needs here; the real t() picks it by Intl.PluralRules.
    const one = params?.count === 1 ? table[`${key}.one`] : undefined
    const value = one ?? table[key] ?? en[key]
    if (typeof value !== 'string') return key
    return value.replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? ''))
  }
}

function planner(overrides: Partial<TripPlanner> = {}): TripPlanner {
  return {
    t: translate(en),
    tripId: 7,
    tours: [tour],
    places: [{ id: 42, name: tour.name, route_geometry: '[[47,11],[47.1,11.1]]', route_color: '#ff0000' }],
    selectedPlaceId: null,
    days: [day],
    handlePlaceClick,
    ...overrides,
  } as unknown as TripPlanner
}

function shell(): MTripShellApi {
  return { sheet: null, openSheet } as unknown as MTripShellApi
}

beforeEach(() => {
  resetAllStores()
  vi.clearAllMocks()
  seedStore(useSettingsStore, { settings: { distance_unit: 'metric' } })
})

describe('MToursSelectionList', () => {
  it('lists a tour like a place: its grade tile, its name, its figures and a plus to put it on a day', () => {
    render(<List planner={planner()} shell={shell()} canAssign />)

    expect(screen.getByRole('img', { name: en['tours.planner.difficulty.t2'] as string })).toHaveTextContent('T2')
    expect(screen.getByText(tour.name)).toHaveClass('truncate')
    expect(screen.getByTestId('mobile-tour-metrics')).toHaveTextContent('12.5 km')
    expect(screen.getByTestId('mobile-tour-metrics')).toHaveTextContent('420 m')
    expect(screen.getByText('1 tour')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add to day' }))
    expect(openSheet).toHaveBeenCalledWith('bract', { placeId: tour.place_id, dayPicker: true })
  })

  it('opens the tour on a tap and marks the selected one', () => {
    render(<List planner={planner({ selectedPlaceId: tour.place_id })} shell={shell()} canAssign />)

    const open = screen.getByRole('button', { name: new RegExp(tour.name) })
    expect(open).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(open)
    expect(handlePlaceClick).toHaveBeenCalledWith(tour.place_id)
  })

  it('names the day a planned tour is on, and how many more, instead of the plus', () => {
    seedStore(useTripStore, { assignments: { '11': [{ id: 1, place_id: 42 }], '12': [{ id: 2, place_id: 42 }] } })
    const days = [day, { id: 12, day_number: 2, date: '2026-07-09', title: null }] as never
    render(<List planner={planner({ days })} shell={shell()} canAssign />)

    expect(screen.getByText(/Day 1/)).toHaveTextContent('Day 1 +1')
    expect(screen.queryByRole('button', { name: 'Add to day' })).not.toBeInTheDocument()
  })

  it('offers no plus to someone who may not plan days', () => {
    render(<List planner={planner()} shell={shell()} canAssign={false} />)
    expect(screen.queryByRole('button', { name: 'Add to day' })).not.toBeInTheDocument()
  })

  it('shows the type of an ungraded tour and where an import came from', () => {
    const imported = { ...tour, has_waypoints: false, max_hiking_difficulty: null, tour_type: 'kayak' as const }
    render(<List planner={planner({ tours: [imported] })} shell={shell()} />)

    expect(screen.getByRole('img', { name: en['tourTypes.kayak'] as string })).not.toHaveTextContent(/T\d/)
    expect(screen.getByLabelText(en['tours.badge.gpx'] as string)).toHaveTextContent('GPX')
  })

  it('says once that tours are planned on a bigger screen, and counts in German', () => {
    render(<List planner={planner({ t: translate(de) })} shell={shell()} />)
    // The badge reads the app's language, English in this suite.
    expect(screen.getByText('Planned on desktop')).toBeInTheDocument()
    expect(screen.getByText('1 Tour')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\b(tours|mobileTrip)\.[a-zA-Z]/)
  })

  it('without tours shows the empty state with the same badge', () => {
    render(<List planner={planner({ tours: [], t: translate(de) })} shell={shell()} />)
    expect(screen.getByText('Noch keine Touren')).toBeInTheDocument()
    expect(screen.getByText(de['mobileTrip.toursEmptyBody'] as string)).toBeInTheDocument()
    expect(screen.getByText('Planned on desktop')).toBeInTheDocument()
  })

  it('narrows the list by a facet and widens it again', () => {
    const other = { ...tour, place_id: 43, name: 'Other', max_hiking_difficulty: 4 }
    render(<List planner={planner({ tours: [tour, other] })} shell={shell()} />)

    fireEvent.click(screen.getByRole('button', { name: /^T4\s*\d+$/ }))
    expect(screen.getByText('Other')).toBeInTheDocument()
    expect(screen.queryByText(tour.name)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^T4\s*\d+$/ }))
    expect(screen.getByText(tour.name)).toBeInTheDocument()
  })
})
