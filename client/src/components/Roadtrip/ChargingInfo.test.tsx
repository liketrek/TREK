import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import ChargingInfo from './ChargingInfo'
import { chargingRepo } from '../../repo/chargingRepo'

vi.mock('../../store/tripStore', () => ({ useTripStore: (select: (s: { trip: { id: number } }) => unknown) => select({ trip: { id: 1 } }) }))
vi.mock('../../repo/chargingRepo', () => ({ chargingRepo: { read: vi.fn(), readAt: vi.fn() } }))
const info = { checkedAt: new Date().toISOString(), status: 'ok' as const, station: 'Station', source: 'Operator', sourceUrl: 'https://example.com', license: 'CC-0', updatedAt: new Date().toISOString(), stale: false, available: 2, total: 4, unknown: 0, tariffs: [], pricesUnavailable: false }
beforeEach(() => { vi.clearAllMocks() })
describe('Charging information', () => {
  it('shows availability, attribution and missing prices without inventing a price', async () => {
    vi.mocked(chargingRepo.read).mockResolvedValue(info)
    render(<TranslationProvider><ChargingInfo placeId={7} /></TranslationProvider>)
    expect(await screen.findByText('2/4 available')).toBeInTheDocument()
    expect(screen.getByText('No reliable data available')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Charging'))
    expect(screen.getByRole('link', { name: 'Operator' })).toHaveAttribute('href', 'https://example.com')
  })
  it('does not display free capacity for stale data', async () => {
    vi.mocked(chargingRepo.read).mockResolvedValue({ ...info, stale: true })
    render(<TranslationProvider><ChargingInfo placeId={7} /></TranslationProvider>)
    expect(await screen.findByText('Status outdated')).toBeInTheDocument()
    expect(screen.queryByText('2/4')).not.toBeInTheDocument()
  })

  // A station found along the route has no place row yet, and the availability and the
  // price are what somebody wants before deciding to add it.
  it('FE-ROADTRIP-CHARGING-010: a station that is not a stop yet is asked for by coordinate', async () => {
    vi.mocked(chargingRepo.readAt).mockResolvedValue(info)
    render(<TranslationProvider><ChargingInfo lat={48.137} lng={11.575} name="Ladepark Nord" /></TranslationProvider>)

    expect(await screen.findByText('2/4 available')).toBeInTheDocument()
    expect(chargingRepo.readAt).toHaveBeenCalledWith(1, 48.137, 11.575, 'Ladepark Nord')
    expect(chargingRepo.read).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-CHARGING-011: pointed at another station, it asks again', async () => {
    // The coordinate is the identity here. Left out of the effect's dependencies the
    // panel would keep showing the first charger's availability for the second one.
    vi.mocked(chargingRepo.readAt).mockResolvedValue(info)
    const { rerender } = render(<TranslationProvider><ChargingInfo lat={48.137} lng={11.575} name="Ladepark Nord" /></TranslationProvider>)
    await screen.findByText('2/4 available')

    rerender(<TranslationProvider><ChargingInfo lat={49.013} lng={12.101} name="Autohof Sued" /></TranslationProvider>)

    await waitFor(() => expect(chargingRepo.readAt).toHaveBeenLastCalledWith(1, 49.013, 12.101, 'Autohof Sued'))
    expect(chargingRepo.readAt).toHaveBeenCalledTimes(2)
  })

  it('FE-ROADTRIP-CHARGING-012: a saved stop is still asked for by place id', async () => {
    vi.mocked(chargingRepo.read).mockResolvedValue(info)
    render(<TranslationProvider><ChargingInfo placeId={7} compact /></TranslationProvider>)

    expect(await screen.findByText('2/4')).toBeInTheDocument()
    expect(chargingRepo.read).toHaveBeenCalledWith(1, 7)
    expect(chargingRepo.readAt).not.toHaveBeenCalled()
  })

  it('FE-ROADTRIP-CHARGING-013: an unidentified station is never shown as free', async () => {
    // `available` is null whenever the answer is not both fresh and countable, and an
    // unknown status is not spare capacity. Outside the covered regions this is the
    // usual answer, so it is the one the dialog has to get right.
    vi.mocked(chargingRepo.readAt).mockResolvedValue({ ...info, status: 'ambiguous', available: null, total: 0, station: null })
    render(<TranslationProvider><ChargingInfo lat={48.137} lng={11.575} name="Ladepark Nord" /></TranslationProvider>)

    // Said twice over: once where the free count would be, once where the price would.
    // Counted only once the answer is in. The price line says the same thing while the
    // request is still out, so a plain findAllByText settles on that one alone and the
    // count would pass for the wrong reason.
    await waitFor(() => expect(screen.getAllByText('No reliable data available')).toHaveLength(2))
    // Anchored at the start on purpose. The attribution line ends in the source's
    // updatedAt run through toLocaleString(), and tests/setup.ts only forces en-US on
    // toLocaleDateString, so that timestamp is "14.9.2026" on a German machine and
    // "9/14/2026" on the CI runner. An unanchored \d+/\d+ matches the second one and
    // the test fails on Linux for a date, not for a count. Both places that print a
    // count start with it, so anchoring keeps what the case is actually about.
    expect(screen.queryByText(/^\d+\/\d+/)).not.toBeInTheDocument()
  })
})
