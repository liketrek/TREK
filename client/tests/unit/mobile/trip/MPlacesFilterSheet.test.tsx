import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '../../../helpers/render'
import MPlacesFilterSheet from '../../../../src/mobile/screens/trip/places/MPlacesFilterSheet'
import { useTripStore } from '../../../../src/store/tripStore'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { buildPlace } from '../../../helpers/factories'
import type { Category, Place } from '../../../../src/types'

// FE-MOB-PFSHEET-001 to FE-MOB-PFSHEET-009

const CATEGORIES = [
  { id: 1, name: 'Sights', color: '#123456', icon: 'landmark' },
  { id: 2, name: 'Food', color: '', icon: 'utensils' },
] as unknown as Category[]

const TAGGED = buildPlace({ id: 1, category_id: 1 })
const BARE = buildPlace({ id: 2, category_id: null })
const TRACK = buildPlace({ id: 3, category_id: 2, route_geometry: '[[1,2],[3,4]]' })

function renderSheet({ places = [TAGGED, BARE], categories = CATEGORIES, open = true, toursEnabled = false }: {
  places?: Place[]
  categories?: Category[]
  open?: boolean
  toursEnabled?: boolean
} = {}) {
  const onClose = vi.fn()
  render(<MPlacesFilterSheet open={open} onClose={onClose} places={places} categories={categories} toursEnabled={toursEnabled} />)
  return { onClose }
}

const group = (name: string) => screen.getByRole('group', { name })

describe('MPlacesFilterSheet', () => {
  beforeEach(() => {
    resetAllStores()
  })

  it('FE-MOB-PFSHEET-001: shows the pool, the rating floors and the categories under one title', async () => {
    renderSheet()
    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(sheet).getByText('Show')).toBeInTheDocument()
    expect(within(group('Show')).getAllByRole('button').map(b => b.textContent)).toEqual(['All', 'Unplanned', 'Planned'])
    expect(within(group('Filter by rating')).getAllByRole('button').map(b => b.textContent))
      .toEqual(['All', '5+', '4+', '3+', '2+', '1+'])
    expect(screen.getByRole('checkbox', { name: 'Sights' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'No Category' })).toBeInTheDocument()
  })

  it('FE-MOB-PFSHEET-002: the tracks pool only shows once a place carries a track', async () => {
    renderSheet({ places: [TAGGED, TRACK] })
    await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(group('Show')).getByRole('button', { name: 'Tracks' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'No Category' })).not.toBeInTheDocument()
  })

  it('hides Tracks from the map filter while Tours is enabled', async () => {
    const tourTrack = buildPlace({ id: 4, route_geometry: '[[5,6],[7,8]]' })
    renderSheet({ places: [TAGGED, TRACK, tourTrack], toursEnabled: true })
    await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(group('Show')).queryByRole('button', { name: 'Tracks' })).not.toBeInTheDocument()
  })

  it('FE-MOB-PFSHEET-003: picking a pool writes it to the trip store', async () => {
    renderSheet()
    await screen.findByRole('dialog', { name: 'Filters' })
    const show = group('Show')
    expect(within(show).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(show).getByRole('button', { name: 'Unplanned' }))
    expect(useTripStore.getState().placesFilter).toBe('unplanned')
    // The chosen chip says so to a screen reader, and only that one.
    expect(within(show).getByRole('button', { name: 'Unplanned' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(show).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-MOB-PFSHEET-004: picking a floor writes the rating filter to the trip store', async () => {
    renderSheet()
    await screen.findByRole('dialog', { name: 'Filters' })
    const floors = group('Filter by rating')
    fireEvent.click(within(floors).getByRole('button', { name: '3+' }))
    expect(useTripStore.getState().placesRatingFilter).toBe(3)
    expect(within(floors).getByRole('button', { name: '3+' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(floors).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-MOB-PFSHEET-005: categories toggle in and out of the shared set, "no category" included', async () => {
    renderSheet()
    await screen.findByRole('dialog', { name: 'Filters' })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Food' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'No Category' }))
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['2', 'uncategorized'])
    expect(screen.getByRole('checkbox', { name: 'Food' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Food' }))
    expect([...useTripStore.getState().placesCategoryFilter]).toEqual(['uncategorized'])
  })

  it('FE-MOB-PFSHEET-006: reset lifts every filter, and stays off while nothing filters', async () => {
    seedStore(useTripStore, { placesFilter: 'planned', placesCategoryFilter: new Set(['1']), placesRatingFilter: 5 })
    renderSheet()
    await screen.findByRole('dialog', { name: 'Filters' })
    const reset = screen.getByRole('button', { name: 'Reset' })
    expect(reset).toBeEnabled()
    fireEvent.click(reset)
    const s = useTripStore.getState()
    expect(s.placesFilter).toBe('all')
    expect(s.placesCategoryFilter.size).toBe(0)
    expect(s.placesRatingFilter).toBe('all')
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })

  it('FE-MOB-PFSHEET-007: without any category to choose, the categories section is left out', async () => {
    renderSheet({ places: [TAGGED], categories: [] })
    const sheet = await screen.findByRole('dialog', { name: 'Filters' })
    expect(within(sheet).queryByText('Categories')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('FE-MOB-PFSHEET-008: the close button hands back to the caller', async () => {
    const { onClose } = renderSheet()
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Filters' })).getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-PFSHEET-009: nothing is rendered while closed', () => {
    renderSheet({ open: false })
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
  })
})
