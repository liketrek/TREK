import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import RoadtripDayPicker from './RoadtripDayPicker'

/**
 * FE-DAYPICK-001..004 — the day the corridor searches along, in the same dropdown as what
 * it looks for.
 */

const DAYS = [{ dayId: 11, dayNumber: 1 }, { dayId: 12, dayNumber: 2 }, { dayId: 13, dayNumber: 3 }]

function picker(value = '12', onChange = vi.fn()) {
  render(<RoadtripDayPicker days={DAYS} value={value} onChange={onChange} />)
  return { onChange, trigger: () => screen.getAllByRole('button')[0] }
}

describe('RoadtripDayPicker', () => {
  it('FE-DAYPICK-001: closed, it names the picked day and nothing else', () => {
    const { trigger } = picker()
    expect(trigger()).toHaveTextContent('Day 2')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('FE-DAYPICK-002: opened, it lists every day and marks the picked one', () => {
    const { trigger } = picker()
    fireEvent.click(trigger())
    const options = screen.getAllByRole('option')
    expect(options.map(o => o.textContent)).toEqual(['1Day 1', '2Day 2', '3Day 3'])
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('FE-DAYPICK-003: picking a day reports its id and closes, a single choice being one gesture', () => {
    const { trigger, onChange } = picker()
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('option', { name: /Day 3/ }))
    expect(onChange).toHaveBeenCalledWith('13')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('FE-DAYPICK-004: a click outside or Escape closes it without a choice', () => {
    const { trigger, onChange } = picker()
    fireEvent.click(trigger())
    fireEvent.mouseDown(document.body)
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger())
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(onChange).not.toHaveBeenCalled()
  })
})
