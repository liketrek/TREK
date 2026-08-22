import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WeatherResult } from '@trek/shared'
import { weatherApi } from '../../../../src/api/client'
import MDaySheet from '../../../../src/mobile/screens/trip/sheets/MDaySheet'
import type { MTripShellApi, TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { usePluginStore } from '../../../../src/store/pluginStore'
import { useSettingsStore } from '../../../../src/store/settingsStore'
import { useTripStore } from '../../../../src/store/tripStore'
import type { Accommodation, Assignment, Day, DayNote, Reservation } from '../../../../src/types'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { act, fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-DAYSH-001 to FE-MOB-DAYSH-028

const DAYS = [
  { id: 1, trip_id: 5, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 5, day_number: 2, date: '2026-05-02', title: 'Old Town' },
  { id: 3, trip_id: 5, day_number: 3, date: '2026-05-03', title: null },
] as unknown as Day[]

function assignment(id: number, placeId: number, name: string, order: number, lat: number, lng: number) {
  return {
    id,
    day_id: 2,
    place_id: placeId,
    order_index: order,
    place: { id: placeId, name, lat, lng },
  } as unknown as Assignment
}

const MUSEUM = assignment(11, 101, 'Museum', 0, 48.21, 16.36)
const PARK = assignment(12, 102, 'Park', 1, 48.22, 16.37)
const CAFE = assignment(13, 103, 'Cafe', 2, 48.23, 16.38)

// Deliberately out of order — the sheet sorts by order_index.
const ASSIGNMENTS: Record<string, Assignment[]> = { '2': [CAFE, MUSEUM, PARK] }

const RESERVATIONS = [
  {
    id: 21, trip_id: 5, type: 'restaurant', title: 'Dinner at Figlmueller', day_id: 2,
    reservation_time: '2026-05-02T19:30', reservation_end_time: '2026-05-02T21:00',
  },
  {
    id: 22, trip_id: 5, type: 'train', title: 'Train to Salzburg', day_id: 2,
    reservation_time: '2026-05-02T08:00',
  },
  {
    id: 23, trip_id: 5, type: 'hotel', title: 'Hotel Sacher booking', day_id: 2,
    accommodation_id: 31, status: 'confirmed', confirmation_number: 'X9',
  },
  { id: 24, trip_id: 5, type: 'event', title: 'Opera (other day)', day_id: 3 },
] as unknown as Reservation[]

const ACCOMMODATIONS = [
  {
    id: 31, trip_id: 5, place_id: 55, start_day_id: 2, end_day_id: 3,
    check_in: '15:00', check_in_end: '18:00', check_out: '11:00', confirmation: 'ABC123',
    place_name: 'Hotel Sacher', place_address: 'Philharmonikerstrasse 4',
    place_lat: 48.2, place_lng: 16.35,
  },
] as unknown as Accommodation[]

const DAY_NOTES = [
  { id: 42, day_id: 2, text: 'Pack the day bag', time: 'before leaving', sort_order: 0 },
  { id: 41, day_id: 2, text: 'Buy museum tickets', time: '09:30 at the kiosk', sort_order: 1 },
] as unknown as DayNote[]

const FORECAST: WeatherResult = {
  temp: 20, temp_max: 24, temp_min: 12, main: 'Rain', description: 'light rain', type: 'forecast',
}

function makeShell(overrides: Record<string, unknown> = {}) {
  return {
    view: 'plan',
    mode: 'go',
    trTab: 'plan',
    sheet: { id: 'day', payload: { dayId: 2 } },
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    setTrTab: vi.fn(),
    toggleView: vi.fn(),
    setTravelMode: vi.fn(),
    ...overrides,
  } as unknown as MTripShellApi
}

function makePlanner(overrides: Record<string, unknown> = {}) {
  return {
    tripId: 5,
    trip: { id: 5, title: 'Vienna', start_date: '2026-05-01', end_date: '2026-05-03' },
    language: 'en',
    days: DAYS,
    places: [],
    assignments: ASSIGNMENTS,
    reservations: RESERVATIONS,
    tripAccommodations: ACCOMMODATIONS,
    selectedDayId: 2,
    routeShown: false,
    setRouteShown: vi.fn(),
    routeProfile: 'driving',
    setRouteProfile: vi.fn(),
    handleSelectDay: vi.fn(),
    handleUpdateDayTitle: vi.fn(),
    handleReorder: vi.fn(),
    handlePlaceClick: vi.fn(),
    setEditingTransport: vi.fn(),
    setTransportModalDayId: vi.fn(),
    setShowTransportModal: vi.fn(),
    setEditingReservation: vi.fn(),
    setShowReservationModal: vi.fn(),
    setTransitPrefill: vi.fn(),
    setTransportModalAutomated: vi.fn(),
    TRANSPORT_TYPES: new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other']),
    can: vi.fn(() => true),
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ...overrides,
  } as unknown as TripPlanner
}

/** Renders and settles the weather request so no state update lands outside act(). */
async function renderSheet(planner: TripPlanner = makePlanner(), shell: MTripShellApi = makeShell()) {
  const view = render(<MDaySheet planner={planner} shell={shell} />)
  await act(async () => { await Promise.resolve() })
  await waitFor(() => expect(document.querySelector('.animate-pulse')).toBeNull())
  return { ...view, planner, shell }
}

describe('MDaySheet', () => {
  beforeEach(() => {
    resetAllStores()
    usePluginStore.setState({ plugins: [] })
    seedStore(useTripStore, { dayNotes: { '2': DAY_NOTES } })
    vi.spyOn(weatherApi, 'getDetailed').mockResolvedValue(FORECAST)
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-DAYSH-001: stays closed while another sheet id is active', () => {
    render(<MDaySheet planner={makePlanner()} shell={makeShell({ sheet: { id: 'mehr' } })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(weatherApi.getDetailed).not.toHaveBeenCalled()
  })

  it('FE-MOB-DAYSH-002: falls back to the selected day when the payload carries no dayId', async () => {
    await renderSheet(makePlanner({ selectedDayId: 1 }), makeShell({ sheet: { id: 'day' } }))
    expect(screen.getByRole('dialog', { name: 'Day 1' })).toBeInTheDocument()
    expect(screen.getByText('Friday, May 1')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-003: renders the day title and its formatted date', async () => {
    await renderSheet()
    expect(screen.getByRole('dialog', { name: 'Old Town' })).toBeInTheDocument()
    expect(screen.getByText('Old Town')).toBeInTheDocument()
    expect(screen.getByText('Saturday, May 2')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-004: requests the forecast for the first located stop and shows it', async () => {
    await renderSheet()
    expect(weatherApi.getDetailed).toHaveBeenCalledWith(48.21, 16.36, '2026-05-02', 'en')
    expect(screen.getByText('20°')).toBeInTheDocument()
    expect(screen.getByRole('dialog').textContent).toContain('24° / 12° ·')
    expect(screen.getByText('light rain')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-005: converts to Fahrenheit when the user asked for it', async () => {
    seedStore(useSettingsStore, {
      settings: { ...useSettingsStore.getState().settings, temperature_unit: 'fahrenheit' },
    })
    await renderSheet()
    expect(screen.getByText('68°')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-006: marks a climate fallback with the average sign and the hint', async () => {
    vi.mocked(weatherApi.getDetailed).mockResolvedValue({ ...FORECAST, type: 'climate' })
    await renderSheet()
    expect(screen.getByText('Ø 20°')).toBeInTheDocument()
    expect(screen.getByText(/Historical averages/)).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-007: shows the empty state when the service reports an error', async () => {
    vi.mocked(weatherApi.getDetailed).mockResolvedValue({ ...FORECAST, error: 'no_forecast' })
    await renderSheet()
    expect(screen.getByText('No weather data available. Add a place with coordinates.')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-008: shows the empty state when the request rejects', async () => {
    vi.mocked(weatherApi.getDetailed).mockRejectedValue(new Error('offline'))
    await renderSheet()
    expect(screen.getByText('No weather data available. Add a place with coordinates.')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-009: skips the weather block entirely without coordinates', async () => {
    await renderSheet(makePlanner({ assignments: {}, places: [] }))
    expect(weatherApi.getDetailed).not.toHaveBeenCalled()
    expect(screen.queryByText('No weather data available. Add a place with coordinates.')).not.toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-010: renames the day inline and commits the trimmed title on Enter', async () => {
    const { planner } = await renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Rename day' }))
    const input = screen.getByPlaceholderText('Day 2')
    expect(input).toHaveValue('Old Town')
    fireEvent.change(input, { target: { value: '  Ringstrasse  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(planner.handleUpdateDayTitle).toHaveBeenCalledWith(2, 'Ringstrasse')
  })

  it('FE-MOB-DAYSH-011: Escape leaves the rename without saving', async () => {
    const { planner } = await renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Rename day' }))
    const input = screen.getByPlaceholderText('Day 2')
    fireEvent.change(input, { target: { value: 'Nope' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(planner.handleUpdateDayTitle).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Day 2')).not.toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-012: toggles the route for the already selected day', async () => {
    const { planner } = await renderSheet()
    const routeBtn = screen.getByRole('button', { name: 'Route' })
    expect(routeBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(routeBtn)
    expect(planner.setRouteShown).toHaveBeenCalledTimes(1)
    expect(planner.handleSelectDay).not.toHaveBeenCalled()
  })

  it('FE-MOB-DAYSH-013: selects the day first when the route is toggled from another one', async () => {
    const planner = makePlanner({ selectedDayId: 1, routeShown: false })
    await renderSheet(planner)
    fireEvent.click(screen.getByRole('button', { name: 'Route' }))
    expect(planner.handleSelectDay).toHaveBeenCalledWith(2, true)
    expect(planner.setRouteShown).toHaveBeenCalledWith(true)
  })

  it('FE-MOB-DAYSH-014: marks the route pill active when it is drawn for this day', async () => {
    await renderSheet(makePlanner({ routeShown: true }))
    expect(screen.getByRole('button', { name: 'Route' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-DAYSH-015: offers plugin route profiles next to the built-ins', async () => {
    usePluginStore.setState({
      plugins: [{
        id: 'brouter', name: 'BRouter', type: 'integration', icon: null,
        routeProfiles: [{ id: 'bike', label: 'Bike' }],
      }],
    })
    const { planner } = await renderSheet()
    expect(screen.getByRole('button', { name: 'Driving' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Walking' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Bike' }))
    expect(planner.setRouteProfile).toHaveBeenCalledWith('plugin:brouter/bike')
  })

  it('FE-MOB-DAYSH-016: exports the day stops plus the evening hotel to Google Maps', async () => {
    await renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Open in Google Maps' }))
    expect(window.open).toHaveBeenCalledTimes(1)
    const url = String(vi.mocked(window.open).mock.calls[0][0])
    expect(url).toContain('https://www.google.com/maps/dir/48.21,16.36/48.22,16.37/48.23,16.38')
    expect(url).toContain('/48.2,16.35')
  })

  it('FE-MOB-DAYSH-017: optimizes the day order and toasts the hotel variant', async () => {
    const { planner } = await renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Optimize' }))
    expect(planner.handleReorder).toHaveBeenCalledTimes(1)
    const [dayId, order] = vi.mocked(planner.handleReorder).mock.calls[0]
    expect(dayId).toBe(2)
    expect([...(order as unknown as number[])].sort()).toEqual([11, 12, 13])
    expect(planner.toast.success).toHaveBeenCalledWith('Route optimized from your accommodation')
  })

  it('FE-MOB-DAYSH-018: hides Optimize below three stops but keeps the route pill', async () => {
    await renderSheet(makePlanner({ assignments: { '2': [MUSEUM, PARK] } }))
    expect(screen.queryByRole('button', { name: 'Optimize' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Route' })).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-019: opens the automated transport modal for public transit', async () => {
    const { planner, shell } = await renderSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Public transit' }))
    expect(planner.setTransportModalDayId).toHaveBeenCalledWith(2)
    expect(planner.setEditingTransport).toHaveBeenCalledWith(null)
    expect(planner.setTransitPrefill).toHaveBeenCalledWith(null)
    expect(planner.setTransportModalAutomated).toHaveBeenCalledWith(true)
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)
    expect(shell.closeSheet).toHaveBeenCalled()
  })

  it('FE-MOB-DAYSH-020: lists the day bookings without hotels and opens the matching editor', async () => {
    const { planner, shell } = await renderSheet()
    expect(screen.getByText('Dinner at Figlmueller')).toBeInTheDocument()
    expect(screen.getByText('19:30 – 21:00')).toBeInTheDocument()
    expect(screen.queryByText('Opera (other day)')).not.toBeInTheDocument()
    expect(screen.queryByText('Hotel Sacher booking')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Train to Salzburg'))
    expect(planner.setEditingTransport).toHaveBeenCalledWith(expect.objectContaining({ id: 22 }))
    expect(planner.setShowTransportModal).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByText('Dinner at Figlmueller'))
    expect(planner.setEditingReservation).toHaveBeenCalledWith(expect.objectContaining({ id: 21 }))
    expect(planner.setShowReservationModal).toHaveBeenCalledWith(true)
    expect(shell.closeSheet).toHaveBeenCalledTimes(2)
  })

  it('FE-MOB-DAYSH-021: a booking row does nothing without the matching permission', async () => {
    const planner = makePlanner({ can: (perm: string) => perm !== 'day_edit' && perm !== 'reservation_edit' })
    const { shell } = await renderSheet(planner)
    fireEvent.click(screen.getByText('Dinner at Figlmueller'))
    fireEvent.click(screen.getByText('Train to Salzburg'))
    expect(planner.setShowReservationModal).not.toHaveBeenCalled()
    expect(planner.setShowTransportModal).not.toHaveBeenCalled()
    expect(shell.closeSheet).not.toHaveBeenCalled()
  })

  it('FE-MOB-DAYSH-022: renders notes sorted, splits a leading time off the detail line, and routes taps', async () => {
    const { shell } = await renderSheet()
    const notes = screen.getAllByText(/Pack the day bag|Buy museum tickets/)
    expect(notes.map(n => n.textContent)).toEqual(['Pack the day bag', 'Buy museum tickets'])
    expect(screen.getByText('at the kiosk')).toBeInTheDocument()
    expect(screen.getByText('09:30')).toBeInTheDocument()
    expect(screen.getByText('before leaving')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add Note' }))
    expect(shell.openSheet).toHaveBeenCalledWith('note', { dayId: 2 })

    fireEvent.click(screen.getByText('Buy museum tickets'))
    expect(shell.openSheet).toHaveBeenCalledWith('note', { dayId: 2, note: expect.objectContaining({ id: 41 }) })
  })

  it('FE-MOB-DAYSH-023: shows the stay with its times, code and linked booking status', async () => {
    const { planner, shell } = await renderSheet()
    expect(screen.getByText('Hotel Sacher')).toBeInTheDocument()
    expect(screen.getByText('Philharmonikerstrasse 4')).toBeInTheDocument()
    expect(screen.getByText('15:00 – 18:00')).toBeInTheDocument()
    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Confirmed · #X9')).toBeInTheDocument()
    // start_day_id is this day, end_day_id a later one → check-in badge plus the stat label.
    expect(screen.getAllByText('Check-in')).toHaveLength(2)

    // Tapping the stay edits the stay; the place is one tap further right (#2001).
    fireEvent.click(screen.getByText('Hotel Sacher'))
    expect(shell.openSheet).toHaveBeenCalledWith('accommodation', { dayId: 2, accId: ACCOMMODATIONS[0].id })

    fireEvent.click(screen.getByRole('button', { name: 'View details' }))
    expect(shell.closeSheet).toHaveBeenCalled()
    expect(planner.handlePlaceClick).toHaveBeenCalledWith(55)

    fireEvent.click(screen.getByRole('button', { name: /Add accommodation/ }))
    expect(shell.openSheet).toHaveBeenCalledWith('accommodation', { dayId: 2 })
  })

  it('FE-MOB-DAYSH-024: labels a stay that both starts and ends on this day', async () => {
    const acc = [{ ...ACCOMMODATIONS[0], end_day_id: 2 }] as unknown as Accommodation[]
    await renderSheet(makePlanner({ tripAccommodations: acc }))
    expect(screen.getByText('Check-in & Check-out')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-025: labels the check-out day and a plain mid-stay day', async () => {
    const checkOutDay = [{ ...ACCOMMODATIONS[0], start_day_id: 1, end_day_id: 2 }] as unknown as Accommodation[]
    const { unmount } = await renderSheet(makePlanner({ tripAccommodations: checkOutDay }))
    // Badge plus the check-out stat label.
    expect(screen.getAllByText('Check-out')).toHaveLength(2)
    expect(screen.queryByText('Stay')).not.toBeInTheDocument()
    unmount()

    const midStay = [{ ...ACCOMMODATIONS[0], start_day_id: 1, end_day_id: 3 }] as unknown as Accommodation[]
    await renderSheet(makePlanner({ tripAccommodations: midStay }))
    expect(screen.getByText('Stay')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-026: falls back to any trip place with coordinates as the weather anchor', async () => {
    await renderSheet(makePlanner({
      assignments: {},
      places: [{ id: 200, name: 'Prater', lat: 48.31, lng: 16.41 }],
    }))
    expect(weatherApi.getDetailed).toHaveBeenCalledWith(48.31, 16.41, '2026-05-02', 'en')
    expect(screen.getByText('20°')).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-027: hides every editing affordance for a read-only member', async () => {
    await renderSheet(makePlanner({ can: () => false }))
    expect(screen.queryByRole('button', { name: 'Rename day' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Optimize' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Public transit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add Note' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add accommodation/ })).not.toBeInTheDocument()
    // The route pill is a view toggle, not an edit — it survives.
    expect(screen.getByRole('button', { name: 'Route' })).toBeInTheDocument()
  })

  it('FE-MOB-DAYSH-028: numbers an untitled day by its position when day_number is 0', async () => {
    const days = [
      { id: 1, trip_id: 5, day_number: 1, date: '2026-05-01', title: null },
      { id: 2, trip_id: 5, day_number: 0, date: '2026-05-02', title: null },
    ] as unknown as Day[]
    await renderSheet(makePlanner({ days, tripAccommodations: [] }))
    expect(screen.getByRole('dialog', { name: 'Day 2' })).toBeInTheDocument()
  })
})
