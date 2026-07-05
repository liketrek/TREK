import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('../../api/client', () => ({
  mapsApi: {
    poiDetails: vi.fn(async () => ({ place: {
      name: 'Blue Bottle', google_place_id: 'ChIJ123', rating: 4.5, rating_count: 120,
      open_now: true, opening_hours: ['Monday: 08:00–18:00'], summary: 'Great coffee.',
      reviews: [{ author: 'Ann', rating: 5, text: 'Lovely!', time: 'a week ago', photo: null }],
      website: 'https://bb.example', phone: '+49 89 1234', google_maps_url: 'https://maps.google.com/?cid=1',
    }, matched: true })),
    placePhoto: vi.fn(async () => ({ photoUrl: 'https://img.example/x.jpg', attribution: 'Wiki' })),
  },
}))

import PlaceDetailsCard, { usePoiDetails } from './PlaceDetailsCard'

function Harness() {
  const { details, photo, loading } = usePoiDetails(
    { osm_id: 'node:42', name: 'Blue Bottle', lat: 48.1, lng: 11.5 }, 'en')
  return <PlaceDetailsCard name="Blue Bottle" details={details} photo={photo} loading={loading} />
}

describe('PlaceDetailsCard', () => {
  it('renders fetched details: rating, summary, review, photo', async () => {
    sessionStorage.clear()
    render(<Harness />)
    await waitFor(() => expect(screen.getByText('4.5')).toBeInTheDocument())
    expect(screen.getByText('Great coffee.')).toBeInTheDocument()
    expect(screen.getByText('Lovely!')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://img.example/x.jpg')
  })

  it('renders name-only fallback when details are null', () => {
    render(<PlaceDetailsCard name="Mystery Bar" details={null} photo={null} loading={false} />)
    expect(screen.getByText('Mystery Bar')).toBeInTheDocument()
  })
})
