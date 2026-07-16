import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../helpers/render'
import MCollPlaceRow from '../../../../src/mobile/screens/collections/MCollPlaceRow'
import type { CollectionPlace } from '@trek/shared'

// FE-MOB-COLL-010 onwards

const place: CollectionPlace = {
  id: 7,
  collection_id: 1,
  name: 'Jungfernstieg',
  address: 'Jungfernstieg 12, Hamburg',
  status: 'want',
  category_id: 3,
  category: { id: 3, name: 'Attraction', color: '#8b5cf6', icon: null },
}

const t = (key: string) => ({
  'collections.status.want': 'Want to go',
  'collections.status.visited': 'Visited',
}[key] ?? key)

function renderRow(overrides: Partial<React.ComponentProps<typeof MCollPlaceRow>> = {}) {
  const props = {
    place,
    selectMode: false,
    selected: false,
    canEdit: true,
    onOpen: vi.fn(),
    onToggleSelect: vi.fn(),
    onSetStatus: vi.fn(),
    t,
    ...overrides,
  }
  render(<MCollPlaceRow {...props} />)
  return props
}

describe('MCollPlaceRow', () => {
  it('FE-MOB-COLL-010: renders name, address, status pill and category pill; tap opens the place', () => {
    const props = renderRow()
    expect(screen.getByText('Jungfernstieg')).toBeInTheDocument()
    expect(screen.getByText('Jungfernstieg 12, Hamburg')).toBeInTheDocument()
    expect(screen.getByText('Want to go')).toBeInTheDocument()
    expect(screen.getByText('Attraction')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Jungfernstieg'))
    expect(props.onOpen).toHaveBeenCalledWith(7)
    expect(props.onToggleSelect).not.toHaveBeenCalled()
  })

  it('FE-MOB-COLL-011: the status pill cycles want → visited', () => {
    const props = renderRow()
    fireEvent.click(screen.getByRole('button', { name: 'Want to go' }))
    expect(props.onSetStatus).toHaveBeenCalledWith(7, 'visited')
  })

  it('FE-MOB-COLL-012: in select mode a tap toggles the selection instead of opening', () => {
    const props = renderRow({ selectMode: true })
    fireEvent.click(screen.getByText('Jungfernstieg'))
    expect(props.onToggleSelect).toHaveBeenCalledWith(7)
    expect(props.onOpen).not.toHaveBeenCalled()
  })
})
