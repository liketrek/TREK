import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import type { DryPoint } from './roadtripModel'
import type { RefuelSearch } from './useRefuelSearch'
import type { RefuelCandidate } from './refuelSuggestion'
import { RefuelBand } from './RoadtripSidebarRefuelBand'

// The vehicle comes from the trip's road trip preferences. Read here from the settings
// store, the way the limits card and the vehicle range tests read it, so a case can say
// which vehicle it is standing in without a signed-in user and an open trip.
vi.mock('../../hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (preferences: import('@trek/shared').RoadtripPreferences) => unknown) =>
    useSettingsStore(state => select(state.settings as import('@trek/shared').RoadtripPreferences)),
}))

function settings(over: Record<string, unknown> = {}): void {
  useSettingsStore.setState({ settings: { distance_unit: 'metric', ...over } as never })
}

beforeEach(() => settings())

const dry: DryPoint & { lat: number; lng: number } = {
  legIndex: 2, intoLegKm: 182.4, drivenMeters: 182400, sinceKm: 600, lat: 52.4, lng: 10.2,
}

const search = (over: Partial<RefuelSearch> = {}): RefuelSearch => ({
  openFor: null, loading: false, outcome: null, results: [], offered: [], ask: vi.fn(), close: vi.fn(),
  ...over,
})

const station = (name: string, category: string, over: Partial<RefuelCandidate> = {}): RefuelCandidate => ({
  osm_id: `osm-${name}`, name, lat: 52.4, lng: 10.1, category, poi_type: category,
  address: null, website: null, phone: null, opening_hours: null, cuisine: null, source: 'openstreetmap',
  alongKm: 170, offRouteKm: 1.4, spareKm: 48.6,
  ...over,
})

function band(refuel: RefuelSearch, handlers: { onAsk?: () => void; onAccept?: (poi: RefuelCandidate) => void } = {}) {
  return render(
    <TranslationProvider>
      <RefuelBand dry={dry} refuel={refuel} dayId={4} onAsk={handlers.onAsk ?? vi.fn()} onAccept={handlers.onAccept} />
    </TranslationProvider>,
  )
}

describe('RefuelBand', () => {
  it('FE-ROADTRIP-REFUELBAND-001: idle, it says how far into the leg the tank runs out and the lamp goes looking', () => {
    const onAsk = vi.fn()
    const { container } = band(search(), { onAsk })

    expect(screen.getByText('Tank runs out here')).toBeInTheDocument()
    expect(screen.getByText('after 182 km')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Find fuel' }))
    expect(onAsk).toHaveBeenCalledTimes(1)
    expect(container.querySelector('svg.trek-lowfuel.lucide-fuel')).not.toBeNull()
    expect(screen.queryByText('Looking along the route…')).toBeNull()
  })

  it('FE-ROADTRIP-REFUELBAND-002: for an electric car the band talks about the battery and its lamp is a bolt', () => {
    settings({ roadtrip_vehicle: 'electric' })
    const { container } = band(search())

    expect(screen.getByText('Battery runs out here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find charging' })).toBeInTheDocument()
    expect(container.querySelector('svg.trek-lowfuel.lucide-zap')).not.toBeNull()
    expect(container.querySelector('svg.lucide-fuel')).toBeNull()
  })

  it('FE-ROADTRIP-REFUELBAND-003: while the search runs for this leg the lamp gives way to closing it', () => {
    const refuel = search({ openFor: '4:2', loading: true })
    band(refuel)

    expect(screen.getByText('Looking along the route…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Find fuel' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(refuel.close).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-REFUELBAND-004: a search open for another leg leaves this band idle', () => {
    band(search({ openFor: '4:1', loading: true }))
    expect(screen.queryByText('Looking along the route…')).toBeNull()
    expect(screen.getByRole('button', { name: 'Find fuel' })).toBeInTheDocument()
  })

  it('FE-ROADTRIP-REFUELBAND-005: offers show their kind, the detour and the spare range, and pressing one accepts it', () => {
    settings({ roadtrip_vehicle: 'electric' })
    const onAccept = vi.fn()
    const charger = station('Ionity Hannover', 'charging', { offRouteKm: 0.8, spareKm: 31 })
    const odd = station('Mystery Pump', 'mystery', { offRouteKm: 2.5, spareKm: 12 })
    const { container } = band(search({ openFor: '4:2', outcome: 'found', results: [charger, odd] }), { onAccept })

    const offers = within(container.querySelector('ul')!).getAllByRole('listitem')
    expect(offers).toHaveLength(2)
    expect(within(offers[0]).getByText('800 m')).toBeInTheDocument()
    expect(within(offers[0]).getByText('31 km')).toBeInTheDocument()
    // The kind's own icon on a known kind; a kind the table does not know keeps the pump.
    expect(offers[0].querySelector('span[aria-hidden] svg.lucide-zap')).not.toBeNull()
    expect(offers[1].querySelector('span[aria-hidden] svg.lucide-fuel')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Add Ionity Hannover as a charging stop' }))
    expect(onAccept).toHaveBeenCalledWith(charger)
    // Results on show, so the lamp is the way to close them.
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('FE-ROADTRIP-REFUELBAND-006: without the right to add a stop the offers are there to read, with nothing to press', () => {
    band(search({ openFor: '4:2', outcome: 'found', results: [station('Shell Hannover', 'fuel')] }))
    expect(screen.getByText('Shell Hannover')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add Shell Hannover/ })).toBeNull()
  })

  it('FE-ROADTRIP-REFUELBAND-007: an empty answer names which nothing it was and offers to try again', () => {
    const onAsk = vi.fn()
    const { rerender } = band(search({ openFor: '4:2', outcome: 'none' }), { onAsk })
    expect(screen.getByText('Nothing found on the reachable stretch.')).toBeInTheDocument()

    rerender(
      <TranslationProvider>
        <RefuelBand dry={dry} refuel={search({ openFor: '4:2', outcome: 'incomplete' })} dayId={4} onAsk={onAsk} />
      </TranslationProvider>,
    )
    expect(screen.getByText('The search was cut short, so this stretch was not fully checked.')).toBeInTheDocument()

    rerender(
      <TranslationProvider>
        <RefuelBand dry={dry} refuel={search({ openFor: '4:2', outcome: 'failed' })} dayId={4} onAsk={onAsk} />
      </TranslationProvider>,
    )
    expect(screen.getByText('The place search did not answer.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onAsk).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('list')).toBeNull()
  })
})
