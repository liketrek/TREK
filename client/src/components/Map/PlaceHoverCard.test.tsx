import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlaceHoverCard from './PlaceHoverCard'

describe('PlaceHoverCard', () => {
  it('FE-MAP-HOVERCARD-001: says what the place is, which a round photo cannot', () => {
    render(<PlaceHoverCard x={10} y={20} name="Museumsinsel" categoryName="Sights" categoryIcon="Landmark" address="Bodestraße 1" />)

    expect(screen.getByText('Museumsinsel')).toBeInTheDocument()
    expect(screen.getByText('Sights')).toBeInTheDocument()
    expect(screen.getByText('Bodestraße 1')).toBeInTheDocument()
  })

  it('FE-MAP-HOVERCARD-002: shows a rating beside the name, and only when there is one', () => {
    const { rerender } = render(<PlaceHoverCard x={0} y={0} name="Museumsinsel" rating={4} />)
    expect(screen.getByText('4')).toBeInTheDocument()

    rerender(<PlaceHoverCard x={0} y={0} name="Museumsinsel" rating={null} />)
    expect(screen.queryByText('4')).toBeNull()
  })

  it('FE-MAP-HOVERCARD-003: never takes the pointer — it is a label, not a target', () => {
    render(<PlaceHoverCard x={0} y={0} name="Museumsinsel" />)
    expect(screen.getByTestId('tooltip')).toHaveStyle({ pointerEvents: 'none' })
  })
})
