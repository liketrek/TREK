import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('../../api/client', () => ({
  mapsApi: {
    poiDetails: vi.fn(async () => ({ place: { name: 'Blue Bottle', google_place_id: 'ChIJ123', rating: 4.5 }, matched: true })),
    placePhoto: vi.fn(async () => ({ photoUrl: null })),
  },
}))

import PoiDetailPanel from './PoiDetailPanel'

const poi = { osm_id: 'node:42', name: 'Blue Bottle', lat: 48.1, lng: 11.5, category: 'cafe', poi_type: 'amenity=cafe', address: '1 Main St', website: null, phone: null, opening_hours: null, cuisine: null, source: 'openstreetmap' as const }

describe('PoiDetailPanel', () => {
  it('shows details and forwards the resolved google_place_id on Add to trip', async () => {
    sessionStorage.clear()
    const onAdd = vi.fn(); const onClose = vi.fn()
    render(<PoiDetailPanel poi={poi} onAddToTrip={onAdd} onClose={onClose} />)
    await waitFor(() => expect(screen.getByText('4.5')).toBeInTheDocument())
    fireEvent.click(screen.getByText('poi.details.addToTrip'))
    expect(onAdd).toHaveBeenCalledWith(poi, 'ChIJ123')
  })

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn()
    render(<PoiDetailPanel poi={poi} onAddToTrip={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('common.close'))
    expect(onClose).toHaveBeenCalled()
  })
})
