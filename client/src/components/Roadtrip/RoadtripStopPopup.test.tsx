import React from 'react'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import RoadtripStopPopup, { type RoadtripStopDraft } from './RoadtripStopPopup'
import { chargingRepo } from '../../repo/chargingRepo'
import type { CorridorPoi } from './useCorridorPois'

// The dialog carries the charging panel, which reads the open availability data for a
// station that is not on the trip yet. Both of its collaborators are stubbed: the trip
// is whichever one is open, and the data comes off the network.
vi.mock('../../store/tripStore', () => ({ useTripStore: (select: (s: { trip: { id: number } }) => unknown) => select({ trip: { id: 1 } }) }))
vi.mock('../../repo/chargingRepo', () => ({ chargingRepo: { read: vi.fn(), readAt: vi.fn() } }))

const wrap = (ui: React.ReactElement) => render(<TranslationProvider>{ui}</TranslationProvider>)

const charging = {
  checkedAt: new Date().toISOString(), status: 'ok' as const, station: 'Ladepark Nord',
  source: 'Operator', sourceUrl: 'https://example.com', license: 'CC-0',
  updatedAt: new Date().toISOString(), stale: false, available: 2, total: 4, unknown: 0,
  tariffs: [], pricesUnavailable: false,
}

beforeEach(() => { vi.clearAllMocks() })

function poi(over: Partial<CorridorPoi> = {}): CorridorPoi {
  return {
    osm_id: 'node:9',
    name: 'Aral Autohof',
    lat: 53.1,
    lng: 10.2,
    category: 'fuel',
    poi_type: 'amenity=fuel',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    cuisine: null,
    source: 'openstreetmap',
    offRouteKm: 1.2,
    alongKm: 120,
    ...over,
  } as CorridorPoi
}

const draft = (over: Partial<RoadtripStopDraft> = {}): RoadtripStopDraft => ({
  poi: poi(),
  dayId: 4,
  position: 2,
  dayNumber: 1,
  ...over,
})

const noop = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  onMoreDetails: vi.fn(),
}

describe('RoadtripStopPopup', () => {
  it('FE-ROADTRIP-STOPPOPUP-001: without a draft there is nothing to show', () => {
    const { container } = wrap(<RoadtripStopPopup draft={null} {...noop} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('FE-ROADTRIP-STOPPOPUP-002: says where the stop will land, counting from one', () => {
    wrap(<RoadtripStopPopup draft={draft({ position: 2, dayNumber: 3 })} {...noop} />)

    expect(screen.getByText('Aral Autohof')).toBeInTheDocument()
    // Position 2 in the array is the third stop for a reader.
    expect(screen.getByText('Day 3, as stop 3')).toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-003: the kind the search found is preselected', () => {
    wrap(<RoadtripStopPopup draft={draft()} {...noop} />)

    expect(screen.getByRole('button', { name: /Fuel/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Charging/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-ROADTRIP-STOPPOPUP-004: saving reports the kind and how long it takes', async () => {
    const onSave = vi.fn()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    // Fuel suggests ten minutes; nobody plans an hour for it.
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ stopType: 'fuel', dwellMinutes: 10 }))
  })

  it('FE-ROADTRIP-STOPPOPUP-005: picking another kind brings its own duration along', async () => {
    const onSave = vi.fn()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSave={onSave} />)

    // Charging is half an hour, not the ten minutes a tank takes.
    fireEvent.click(screen.getByRole('button', { name: /Charging/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ stopType: 'charging', dwellMinutes: 30 }))
  })

  it('FE-ROADTRIP-STOPPOPUP-006: a duration chosen by hand survives the save', async () => {
    const onSave = vi.fn()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /45 min/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ stopType: 'fuel', dwellMinutes: 45 }))
  })

  it('FE-ROADTRIP-STOPPOPUP-007: clicking the selected kind keeps a service stop', async () => {
    const onSave = vi.fn()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSave={onSave} />)

    fireEvent.click(screen.getByRole('button', { name: /Fuel/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ stopType: 'fuel', dwellMinutes: 10 }))
  })

  /**
   * Every category the corridor can search for, with the name its button carries.
   *
   * The keys are the contract with `CATEGORY_OSM_FILTERS` on the server, which labels
   * each hit with the category its own OSM tag matched. A key the popup does not know
   * preselects nothing, and the stop is saved as an ordinary place — which is exactly
   * how food and sights used to end up as numbered destinations in the middle of a drive.
   */
  const CORRIDOR_KINDS: [string, string][] = [
    ['fuel', 'Fuel'],
    ['charging', 'Charging'],
    ['rest_area', 'Rest area'],
    ['campsite', 'Campsite'],
    ['restaurant', 'Food'],
    ['sights', 'Sights'],
  ]

  /**
   * One kind pill, by the name on it.
   *
   * Filtered on `aria-pressed` rather than taken as the only match: for a charging hit
   * the dialog also carries the charging panel, whose `<summary>` reads "Charging" too.
   */
  const kindPill = (label: string): HTMLElement =>
    screen.getAllByRole('button', { name: new RegExp(label) }).filter(el => el.hasAttribute('aria-pressed'))[0]

  it.each(CORRIDOR_KINDS)('FE-ROADTRIP-STOPPOPUP-008: a %s hit preselects its own kind', (category, label) => {
    const { unmount } = wrap(<RoadtripStopPopup draft={draft({ poi: poi({ category, name: 'Found on the way' }) })} {...noop} />)

    expect(kindPill(label)).toHaveAttribute('aria-pressed', 'true')
    // Every other kind is off, so the preselect cannot be reading the wrong row. Scoped
    // to the kind buttons: the dwell presets use `aria-pressed` for their own state.
    for (const [, other] of CORRIDOR_KINDS) {
      if (other === label) continue
      expect(kindPill(other)).toHaveAttribute('aria-pressed', 'false')
    }
    unmount()
  })

  it('FE-ROADTRIP-STOPPOPUP-012: a kind nobody knows preselects nothing', () => {
    wrap(<RoadtripStopPopup draft={draft({ poi: poi({ category: 'museum', name: 'Albertinum' }) })} {...noop} />)

    expect(screen.getByRole('button', { name: /Fuel/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /Campsite/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-ROADTRIP-STOPPOPUP-009: warns when the same place is already on the trip', () => {
    const { unmount } = wrap(<RoadtripStopPopup draft={draft()} {...noop} duplicateName="Aral Autohof" />)
    expect(screen.getByText(/already on this trip/)).toBeInTheDocument()

    unmount()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} />)
    expect(screen.queryByText(/already on this trip/)).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-010: the way out to the full form is offered and reported', () => {
    const onMoreDetails = vi.fn()
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onMoreDetails={onMoreDetails} />)

    fireEvent.click(screen.getByRole('button', { name: 'More details' }))
    expect(onMoreDetails).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-STOPPOPUP-011: a save in flight cannot be fired twice', async () => {
    let release: () => void = () => {}
    const onSave = vi.fn(() => new Promise<void>(resolve => { release = resolve }))
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSave={onSave} />)

    const add = screen.getByRole('button', { name: 'Add' })
    fireEvent.click(add)
    await waitFor(() => expect(add).toBeDisabled())
    fireEvent.click(add)
    expect(onSave).toHaveBeenCalledTimes(1)

    // Settle it inside act, or React re-enables the button after the test has finished.
    await act(async () => { release() })
    expect(add).not.toBeDisabled()
  })
  // ── Overnight mode ─────────────────────────────────────────────────────────
  //
  // Somewhere to sleep is the one hit that ends the day rather than interrupting the
  // drive, so the dialog grows a second mode instead of offering a hotel a dwell of
  // thirty minutes.

  const overnight = {
    days: [
      { id: 4, number: 1, date: '2026-08-31' },
      { id: 5, number: 2, date: '2026-09-01' },
      { id: 6, number: 3, date: '2026-09-02' },
    ],
    defaultEndDayId: 5,
  }
  const nightDraft = (category: string) => draft({
    poi: poi({ category, name: 'Hotel Adlon' }),
    overnight,
  })

  it('FE-ROADTRIP-STOPPOPUP-020: a hotel opens on the overnight mode', () => {
    wrap(<RoadtripStopPopup draft={nightDraft('hotel')} {...noop} onSaveNight={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Overnight' })).toHaveAttribute('aria-pressed', 'true')
    // Check-in and nothing else. A check-out says when the room has to be back, never
    // when anybody drives on, so the drive has no use for it and does not ask.
    expect(screen.getByRole('textbox', { name: 'Check-in' })).toBeInTheDocument()
    expect(screen.queryByText('Check out on')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Check-out' })).not.toBeInTheDocument()
    // The two questions a pause asks are gone: a hotel has no kind and no dwell.
    expect(screen.queryByText('Kind of stop')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-021: a campsite opens on the pause mode but offers the night', () => {
    // It is a service stop today and stays one, but people do sleep at campsites, so the
    // choice is offered rather than decided.
    wrap(<RoadtripStopPopup draft={nightDraft('campsite')} {...noop} onSaveNight={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Kind of stop')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overnight' })).toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-022: a petrol station is never offered a night', () => {
    // Nothing to choose between, so no switch at all.
    wrap(<RoadtripStopPopup draft={draft()} {...noop} onSaveNight={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Overnight' })).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-023: booking a night reports the check-out day, defaulting to the next', () => {
    const onSaveNight = vi.fn()
    wrap(<RoadtripStopPopup draft={nightDraft('hotel')} {...noop} onSaveNight={onSaveNight} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onSaveNight).toHaveBeenCalledWith({ endDayId: 5, checkIn: '', checkOut: '' })
  })

  it('FE-ROADTRIP-STOPPOPUP-024: switching back to a pause saves a pause', () => {
    const onSave = vi.fn()
    const onSaveNight = vi.fn()
    wrap(<RoadtripStopPopup draft={nightDraft('hotel')} {...noop} onSave={onSave} onSaveNight={onSaveNight} />)

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onSaveNight).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalled()
  })

  it('FE-ROADTRIP-STOPPOPUP-026: a scheme-less OSM website still leaves the app', () => {
    // OSM `website` tags are routinely written without a scheme. As a raw href
    // `www.hotel.de` is a RELATIVE url, so the click navigated the planner to
    // /trips/<id>/www.hotel.de and the user lost the page they were on.
    wrap(
      <RoadtripStopPopup
        draft={draft({ poi: poi({ category: 'hotel', website: 'www.hotel-adlon.de' }), overnight })}
        {...noop}
        onSaveNight={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute('href', 'https://www.hotel-adlon.de')
  })

  it('FE-ROADTRIP-STOPPOPUP-027: a website that is not a link is not rendered as one', () => {
    // Anything that is not http(s) loses the link rather than being handed to
    // the browser. The CSP stops a javascript: navigation on a stock deployment,
    // but this is defended everywhere else in the app and belongs here too.
    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'tel:+49301234']) {
      const { unmount } = wrap(
        <RoadtripStopPopup
          draft={draft({ poi: poi({ category: 'hotel', website: bad }), overnight })}
          {...noop}
          onSaveNight={vi.fn()}
        />,
      )
      expect(screen.queryByRole('link', { name: 'Website' }), bad).not.toBeInTheDocument()
      unmount()
    }
  })

  // ── Charging, before the add ───────────────────────────────────────────────
  //
  // The data was only reachable once the charger was on the trip, which is the wrong
  // way round: how busy the place is and what it charges is what decides whether to
  // add it at all.

  const chargingDraft = () => draft({ poi: poi({ category: 'charging', name: 'Ladepark Nord', lat: 48.137, lng: 11.575 }) })

  it('FE-ROADTRIP-STOPPOPUP-030: a charging hit is asked about by where it is', async () => {
    vi.mocked(chargingRepo.readAt).mockResolvedValue(charging)
    wrap(<RoadtripStopPopup draft={chargingDraft()} {...noop} />)

    // By coordinate and name: there is no place row to name it by yet.
    await waitFor(() => expect(chargingRepo.readAt).toHaveBeenCalledWith(1, 48.137, 11.575, 'Ladepark Nord'))
    expect(await screen.findByText('2/4 available')).toBeInTheDocument()
    // The licence line travels with the numbers wherever they are shown.
    expect(screen.getByRole('link', { name: 'Operator' })).toHaveAttribute('href', 'https://example.com')
  })

  it('FE-ROADTRIP-STOPPOPUP-031: a fuel stop costs nothing', () => {
    wrap(<RoadtripStopPopup draft={draft()} {...noop} />)

    expect(chargingRepo.readAt).not.toHaveBeenCalled()
    expect(screen.queryByText('Published tariffs')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-032: the question follows the kind that is picked', async () => {
    vi.mocked(chargingRepo.readAt).mockResolvedValue(charging)
    wrap(<RoadtripStopPopup draft={draft()} {...noop} />)
    expect(chargingRepo.readAt).not.toHaveBeenCalled()

    fireEvent.click(kindPill('Charging'))
    await waitFor(() => expect(chargingRepo.readAt).toHaveBeenCalledTimes(1))

    fireEvent.click(kindPill('Fuel'))
    expect(screen.queryByText('2/4 available')).not.toBeInTheDocument()
  })

  it('FE-ROADTRIP-STOPPOPUP-033: one station, one question, however much else is changed', async () => {
    // A cache miss upstream costs several requests against a shared public registry, so
    // the dialog asks once and re-rendering it for an unrelated answer must not re-ask.
    vi.mocked(chargingRepo.readAt).mockResolvedValue(charging)
    wrap(<RoadtripStopPopup draft={chargingDraft()} {...noop} />)
    await waitFor(() => expect(chargingRepo.readAt).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: /45 min/ }))

    expect(chargingRepo.readAt).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-STOPPOPUP-025: without a way to book a night the switch stays away', () => {
    // An onSaveNight-less caller gets the dialog it always had, rather than a mode that
    // leads nowhere.
    wrap(<RoadtripStopPopup draft={nightDraft('hotel')} {...noop} />)

    expect(screen.queryByRole('button', { name: 'Overnight' })).not.toBeInTheDocument()
    expect(screen.getByText('Kind of stop')).toBeInTheDocument()
  })
})


describe('editing a roadtrip stop', () => {
  it('loads the saved duration and saves without adding another stop', async () => {
    const onSave = vi.fn()
    wrap(<RoadtripStopPopup draft={draft({ editing: { placeId: 7, stopType: 'fuel', dwellMinutes: 45 } })} {...noop} onSave={onSave} />)
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ stopType: 'fuel', dwellMinutes: 45 }))
  })
  it('loads an existing overnight booking and keeps its check-in', async () => {
    // The stored check-out is left where it is rather than resaved: this surface no
    // longer asks for one, and writing back a blank would quietly drop what somebody
    // entered under Days.
    const onSaveNight = vi.fn()
    wrap(<RoadtripStopPopup draft={draft({ poi: poi({ category: 'hotel' }), overnight: { days: [{ id: 4, number: 1, date: null }, { id: 5, number: 2, date: null }], defaultEndDayId: 5 }, editing: { placeId: 7, stopType: 'hotel', dwellMinutes: 30, accommodationId: 8, checkIn: '16:00', checkOut: '10:00' } })} {...noop} onSaveNight={onSaveNight} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSaveNight).toHaveBeenCalledWith({ endDayId: 5, checkIn: '16:00', checkOut: '10:00' }))
  })
})


it('prefills check-in from arrival while preserving a saved manual time', () => {
  const onSaveNight = vi.fn()
  wrap(<RoadtripStopPopup draft={draft({ poi: poi({ category: 'hotel' }), arrivalTime: '15:45', overnight: { days: [{ id: 4, number: 1, date: null }, { id: 5, number: 2, date: null }], defaultEndDayId: 5 } })} {...noop} onSaveNight={onSaveNight} />)
  expect(screen.getByRole('textbox', { name: 'Check-in' })).toHaveValue('15:45')
  fireEvent.change(screen.getByRole('textbox', { name: 'Check-in' }), { target: { value: '16:30' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
  expect(onSaveNight).toHaveBeenCalledWith({ endDayId: 5, checkIn: '16:30', checkOut: '' })
})
