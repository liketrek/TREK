// FE-COMP-MAPLAYER-001 to FE-COMP-MAPLAYER-006
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { MapLayerSwitcher, MAP_ROUND_CONTROL_SIZE } from './MapLayerSwitcher'

describe('MapLayerSwitcher', () => {
  it('FE-COMP-MAPLAYER-001: on the default layer, offers the switch to satellite', () => {
    render(<MapLayerSwitcher active="default" onToggle={() => {}} />)
    const button = screen.getByRole('button', { name: 'Switch to satellite view' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
  })

  it('FE-COMP-MAPLAYER-002: on the satellite layer, offers the switch back to the map', () => {
    render(<MapLayerSwitcher active="satellite" onToggle={() => {}} />)
    const button = screen.getByRole('button', { name: 'Switch to map view' })
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  it('FE-COMP-MAPLAYER-003: clicking fires the toggle', () => {
    const onToggle = vi.fn()
    render(<MapLayerSwitcher active="default" onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to satellite view' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('FE-COMP-MAPLAYER-004: swaps the icon with the active layer', () => {
    const { rerender } = render(<MapLayerSwitcher active="default" onToggle={() => {}} />)
    // Destination icon: on the map you can reach satellite, and vice-versa.
    const iconOnDefault = screen.getByRole('button').querySelector('svg')?.getAttribute('class')
    rerender(<MapLayerSwitcher active="satellite" onToggle={() => {}} />)
    const iconOnSatellite = screen.getByRole('button').querySelector('svg')?.getAttribute('class')
    expect(iconOnDefault).not.toBe(iconOnSatellite)
  })

  it('FE-COMP-MAPLAYER-005: highlights the button on hover and clears it again', () => {
    render(<MapLayerSwitcher active="default" onToggle={() => {}} />)
    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)
    expect(button.style.background).toBe('var(--bg-hover)')
    fireEvent.mouseLeave(button)
    expect(button.style.background).toBe('transparent')
  })

  it('FE-COMP-MAPLAYER-006: the shell is as wide as the size its neighbours are placed off', () => {
    render(<MapLayerSwitcher active="default" onToggle={() => {}} />)
    const button = screen.getByRole('button')
    const shell = button.parentElement as HTMLElement

    // The phone's compass stands beside the switcher at inset + size + gap. If the
    // markup grew without the constant, the compass would slide back under the shell.
    expect(shell.style.padding).toBe('4px')
    expect(button.style.width).toBe('34px')
    expect(button.style.height).toBe('34px')
    expect(parseFloat(button.style.width) + 2 * parseFloat(shell.style.padding)).toBe(MAP_ROUND_CONTROL_SIZE)
  })
})
