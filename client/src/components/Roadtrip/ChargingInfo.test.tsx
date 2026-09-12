import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TranslationProvider } from '../../i18n'
import ChargingInfo from './ChargingInfo'
import { chargingRepo } from '../../repo/chargingRepo'

vi.mock('../../store/tripStore', () => ({ useTripStore: (select: (s: { trip: { id: number } }) => unknown) => select({ trip: { id: 1 } }) }))
vi.mock('../../repo/chargingRepo', () => ({ chargingRepo: { read: vi.fn() } }))
const info = { checkedAt: new Date().toISOString(), status: 'ok' as const, station: 'Station', source: 'Operator', sourceUrl: 'https://example.com', license: 'CC-0', updatedAt: new Date().toISOString(), stale: false, available: 2, total: 4, unknown: 0, tariffs: [], pricesUnavailable: false }
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
})
