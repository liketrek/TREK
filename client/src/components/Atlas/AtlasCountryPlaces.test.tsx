// FE-ATLAS-PLACES-001 to FE-ATLAS-PLACES-002 (#2174)
import { vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import AtlasCountryPlaces from './AtlasCountryPlaces'

const detail = {
  trips: [{ id: 1, title: 'Berlin 2026' }],
  places: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Place ${i + 1}`, lat: 0, lng: 0, trip_id: 1, address: i === 0 ? 'Pariser Platz' : null })),
}

describe('AtlasCountryPlaces', () => {
  it('FE-ATLAS-PLACES-001: lists the places under their trip and opens the trip on a click', () => {
    const onOpenTrip = vi.fn()
    render(<AtlasCountryPlaces detail={detail} onOpenTrip={onOpenTrip} />)
    expect(screen.getByText('Berlin 2026')).toBeInTheDocument()
    expect(screen.getByText('Pariser Platz')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Place 3'))
    expect(onOpenTrip).toHaveBeenCalledWith(1)
  })

  it('FE-ATLAS-PLACES-002: narrows a long list and says when nothing matches', () => {
    render(<AtlasCountryPlaces detail={detail} onOpenTrip={() => {}} variant="mobile" />)
    const search = screen.getByRole('textbox', { name: 'Search places' })
    fireEvent.change(search, { target: { value: 'Place 2' } })
    expect(screen.getByText('Place 2')).toBeInTheDocument()
    expect(screen.queryByText('Place 3')).toBeNull()
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('No place matches')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('Place 3')).toBeInTheDocument()
  })
})
