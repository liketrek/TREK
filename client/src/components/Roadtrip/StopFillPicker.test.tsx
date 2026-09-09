import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/helpers/render'
import { useSettingsStore } from '../../store/settingsStore'
import StopFillPicker from './StopFillPicker'

/**
 * FE-STOPFILL-001..010 — how full one stop fills, as opposed to how full they all do.
 *
 * The figure is two-sided: a stop either has its own or borrows the traveller's, and the
 * panel has to open showing which. What is worth pinning is the seam between them —
 * that an inherited figure reads as chosen, that picking it again hands the stop back to
 * the setting rather than writing the same number, and that the kilometre line under the
 * pills is absent rather than invented when no range is set.
 */

let anchor: HTMLElement

beforeEach(() => {
  anchor = document.createElement('button')
  document.body.appendChild(anchor)
  useSettingsStore.setState({
    settings: { roadtrip_fill_percent: 80, roadtrip_range_km: 500, distance_unit: 'metric' } as never,
  })
})
afterEach(() => { anchor.remove() })

function open(over: { current?: number | null; onPick?: (p: number | null) => void } = {}) {
  const onPick = over.onPick ?? vi.fn()
  const onClose = vi.fn()
  render(
    <StopFillPicker
      anchor={anchor}
      current={over.current ?? null}
      onPick={onPick}
      onClose={onClose}
    />,
  )
  return { onPick, onClose }
}

const pill = (percent: number) => screen.getByRole('button', { name: String(percent) })

describe('StopFillPicker', () => {
  it('FE-STOPFILL-001: without an anchor there is nothing to hang under', () => {
    render(<StopFillPicker anchor={null} current={null} onPick={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-STOPFILL-002: the traveller own figure is the one shown as chosen', () => {
    // Nothing said about this stop, so it fills the way every other one does. Opening
    // with nothing pressed would suggest the stop has no answer, when it has one.
    open({ current: null })
    expect(pill(80)).toHaveAttribute('aria-pressed', 'true')
    expect(pill(100)).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-STOPFILL-003: the stop own figure wins over the traveller own', () => {
    open({ current: 60 })
    expect(pill(60)).toHaveAttribute('aria-pressed', 'true')
    expect(pill(80)).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-STOPFILL-004: picking a percentage reports it', () => {
    const { onPick } = open({ current: null })
    fireEvent.click(pill(60))
    expect(onPick).toHaveBeenCalledWith(60)
  })

  it('FE-STOPFILL-005: picking the figure the stop already has hands it back to the setting', () => {
    // The same gesture the kind picker uses to un-pick a kind. Writing 60 again would
    // leave the stop pinned to a number it only ever had by inheritance.
    const { onPick } = open({ current: 60 })
    fireEvent.click(pill(60))
    expect(onPick).toHaveBeenCalledWith(null)
  })

  it('FE-STOPFILL-006: an inherited figure can be pinned by picking it', () => {
    // Pressed because it is what the stop uses, but not its own — so clicking it means
    // "make this one mine", not "take it off".
    const { onPick } = open({ current: null })
    fireEvent.click(pill(80))
    expect(onPick).toHaveBeenCalledWith(80)
  })

  it('FE-STOPFILL-007: what the choice buys is stated, and only when it is known', () => {
    open({ current: 60 })
    // 60 % of a 500 km range.
    expect(screen.getByText(/300 km/)).toBeInTheDocument()
  })

  it('FE-STOPFILL-008: with no range set the kilometres are absent rather than invented', () => {
    useSettingsStore.setState({
      settings: { roadtrip_fill_percent: 80, distance_unit: 'metric' } as never,
    })
    open({ current: 60 })
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()
  })

  it('FE-STOPFILL-009: the way back to the default appears only once there is one to undo', () => {
    // On a stop with no figure of its own it would be a button that says "leave
    // everything as it is".
    open({ current: null })
    expect(screen.queryByText('Use my default')).not.toBeInTheDocument()
  })

  it('FE-STOPFILL-010: a stop with its own figure can be handed back to the setting', () => {
    const { onPick } = open({ current: 60 })
    fireEvent.click(screen.getByText('Use my default'))
    expect(onPick).toHaveBeenCalledWith(null)
  })
})
