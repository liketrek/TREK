import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { Fuel, Zap, Utensils } from 'lucide-react'
import { fireEvent, render, screen, within } from '../../../tests/helpers/render'
import RoadtripCategoryPicker from './RoadtripCategoryPicker'

/**
 * FE-CATPICK-001..008 — what the corridor is asked to look for.
 *
 * Multi-select, so it stays open on a click: picking "fuel and charging" is one
 * gesture rather than two round trips through a menu. The summary names the
 * kinds rather than counting them, because "Fuel, Charging" is the answer and
 * "2 kinds" is a riddle.
 */

const KEYS = ['fuel', 'charging', 'food'] as const
const META = {
  fuel: { labelKey: 'roadtrip.poi.fuel', Icon: Fuel },
  charging: { labelKey: 'roadtrip.poi.charging', Icon: Zap },
  food: { labelKey: 'roadtrip.poi.food', Icon: Utensils },
}

function picker(selected: string[] = [], onToggle = vi.fn()) {
  render(<RoadtripCategoryPicker keys={KEYS} meta={META} selected={selected} onToggle={onToggle} />)
  return { onToggle, trigger: () => screen.getByRole('button', { expanded: false }) }
}

/** The control that opens the list, whatever its current state. */
const trigger = () => screen.getAllByRole('button')[0]

describe('RoadtripCategoryPicker', () => {
  it('FE-CATPICK-001: closed by default, so the column belongs to the results', () => {
    picker()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('FE-CATPICK-002: with nothing picked it asks rather than reporting an empty set', () => {
    picker()
    expect(screen.getByText('Looking for')).toBeInTheDocument()
  })

  it('FE-CATPICK-003: the summary names the kinds, in the order they are offered', () => {
    // Reversed on the way in: the control lists them the way it offers them, not
    // the way they happened to be clicked.
    picker(['food', 'fuel'])
    expect(screen.getByText('Fuel, Food')).toBeInTheDocument()
  })

  it('FE-CATPICK-004: opening lists every kind', () => {
    picker()
    fireEvent.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    for (const label of ['Fuel', 'Charging', 'Food']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })

  it('FE-CATPICK-005: picking one reports it and leaves the list open', () => {
    // The whole reason it is multi-select: two kinds is one gesture.
    const { onToggle } = picker()
    fireEvent.click(trigger())
    fireEvent.click(screen.getByText('Charging'))

    expect(onToggle).toHaveBeenCalledWith('charging')
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('FE-CATPICK-006: picking a kind that is already on reports it too, for the toggle', () => {
    const { onToggle } = picker(['fuel'])
    fireEvent.click(trigger())
    fireEvent.click(screen.getAllByText('Fuel')[1] ?? screen.getByText('Fuel'))
    expect(onToggle).toHaveBeenCalledWith('fuel')
  })

  it('FE-CATPICK-007: a click outside closes it, a click inside does not', () => {
    picker()
    fireEvent.click(trigger())

    fireEvent.mouseDown(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.mouseDown(document.body)
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('FE-CATPICK-008: Escape closes it', () => {
    picker()
    fireEvent.click(trigger())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })
})
