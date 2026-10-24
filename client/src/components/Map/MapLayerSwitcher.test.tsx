// FE-COMP-MAPLAYER-001 to FE-COMP-MAPLAYER-024
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import { MapLayerSwitcher, TourMapLayerSwitcher, MAP_ROUND_CONTROL_SIZE } from './MapLayerSwitcher'
import type { FerrataMapLayer } from '../Ferratas/useFerrataMapLayer'
import type { ToggleableRasterOverlay } from './mapRasterOverlay'

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

  it('FE-COMP-MAPLAYER-006: offers all three Tours-only base layers', () => {
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Topo' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Satellite' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('FE-COMP-MAPLAYER-007: reports a per-view Topo selection', () => {
    const onChange = vi.fn()
    render(<TourMapLayerSwitcher active="default" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Topo' }))
    expect(onChange).toHaveBeenCalledWith('topo')
  })

  it('FE-COMP-MAPLAYER-018: offers the hiking map only where the tour type and the admin offer it (MAP-01)', () => {
    const onChange = vi.fn()
    const { rerender } = render(<TourMapLayerSwitcher active="default" onChange={onChange} layers={{ bases: ['default', 'topo', 'satellite'] }} />)
    expect(screen.queryByRole('button', { name: 'Hiking' })).toBeNull()

    rerender(<TourMapLayerSwitcher active="default" onChange={onChange} layers={{ bases: ['default', 'topo', 'hiking', 'satellite'] }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hiking' }))
    expect(onChange).toHaveBeenCalledWith('hiking')
  })

  it('FE-COMP-MAPLAYER-019: a hiking map that stopped answering says so on its segment, and only while it is shown', () => {
    const baseHealth = { base: 'hiking' as const, down: true, onTileError: vi.fn(), onTileLoad: vi.fn() }
    const layers = { bases: ['default', 'hiking'] as const, baseHealth }
    const { rerender } = render(<TourMapLayerSwitcher active="hiking" onChange={() => {}} layers={layers} />)
    const segment = screen.getByRole('button', { name: 'Hiking' })
    expect(segment).toHaveAttribute('aria-pressed', 'true')
    expect(segment).toHaveTextContent('!')
    expect(screen.getByRole('status')).toHaveTextContent('OpenHikingMap is not answering right now')

    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} layers={layers} />)
    expect(screen.getByRole('button', { name: 'Hiking' })).not.toHaveTextContent('!')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('FE-COMP-MAPLAYER-020: CyclOSM sits in the switch as Cycling and says so when it stops answering (BIK-06)', () => {
    const baseHealth = { base: 'cycle' as const, down: true, onTileError: vi.fn(), onTileLoad: vi.fn() }
    render(<TourMapLayerSwitcher active="cycle" onChange={() => {}} layers={{ bases: ['default', 'cycle'], baseHealth }} />)
    expect(screen.getByRole('button', { name: 'Cycling' })).toHaveTextContent('!')
    expect(screen.getByRole('status')).toHaveTextContent('CyclOSM is not answering right now')
    expect(screen.queryByRole('button', { name: 'Hiking' })).toBeNull()
  })

  it('FE-COMP-MAPLAYER-008: the shell is as wide as the size its neighbours are placed off', () => {
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

describe('TourMapLayerSwitcher 3D switch', () => {
  it('FE-COMP-MAPLAYER-009: offers no 3D switch on a map that has no terrain mode', () => {
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: '3D' })).toBeNull()
  })

  it('FE-COMP-MAPLAYER-010: toggles the terrain mode and shows whether it is on', () => {
    const onToggleTerrain = vi.fn()
    const { rerender } = render(<TourMapLayerSwitcher active="topo" onChange={() => {}} onToggleTerrain={onToggleTerrain} />)
    const off = screen.getByRole('button', { name: '3D' })
    expect(off).toHaveAttribute('aria-pressed', 'false')
    expect(off).toHaveClass('text-content-muted')
    expect(off.style.background).toBe('transparent')
    fireEvent.click(off)
    expect(onToggleTerrain).toHaveBeenCalledTimes(1)

    rerender(<TourMapLayerSwitcher active="topo" onChange={() => {}} onToggleTerrain={onToggleTerrain} terrainActive />)
    const on = screen.getByRole('button', { name: '3D' })
    expect(on).toHaveAttribute('aria-pressed', 'true')
    expect(on).toHaveClass('bg-accent', 'text-accent-text')
    expect(on.style.background).toBe('')
    // The base layer stays selectable beside it.
    expect(screen.getByRole('button', { name: 'Topo' })).toHaveAttribute('aria-pressed', 'true')
  })
})

const ferrataLayer = (overrides: Partial<FerrataMapLayer> = {}): FerrataMapLayer => ({
  active: false,
  onToggle: vi.fn(),
  status: 'idle',
  count: 0,
  groups: [],
  selectedId: null,
  onSelect: vi.fn(),
  ...overrides,
})

describe('TourMapLayerSwitcher via ferrata switch', () => {
  it('FE-COMP-MAPLAYER-011: offers no via ferrata switch without a layer', () => {
    const { container } = render(<TourMapLayerSwitcher active="default" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Via ferratas' })).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('role', 'group')
  })

  it('FE-COMP-MAPLAYER-012: the switch toggles the layer, pressed and in the accent while it is on', () => {
    const layer = ferrataLayer()
    const { rerender } = render(<TourMapLayerSwitcher active="topo" onChange={() => {}} ferrataLayer={layer} />)
    const off = screen.getByRole('button', { name: 'Via ferratas' })
    expect(off).toHaveAttribute('aria-pressed', 'false')
    expect(off).toHaveClass('text-content-muted')
    fireEvent.click(off)
    expect(layer.onToggle).toHaveBeenCalledTimes(1)

    rerender(<TourMapLayerSwitcher active="topo" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'loading' })} />)
    const on = screen.getByRole('button', { name: 'Via ferratas' })
    expect(on).toHaveAttribute('aria-pressed', 'true')
    expect(on).toHaveClass('bg-accent', 'text-accent-text')
  })

  it('FE-COMP-MAPLAYER-013: the count rides in the switch as a badge, nothing beside the pill, and none while off', () => {
    const { container, rerender } = render(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ count: 4 })} />)
    expect(screen.queryByTestId('ferrata-count-badge')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('role', 'group')

    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'ready', count: 4 })} />)
    const badge = screen.getByTestId('ferrata-count-badge')
    expect(badge).toHaveTextContent('4')
    expect(badge).toHaveAttribute('data-tone', 'default')
    expect(screen.getByRole('button', { name: 'Via ferratas' })).toContainElement(badge)
    expect(screen.getByRole('status')).toHaveTextContent('4 via ferrata routes')
    expect(screen.queryByTestId('ferrata-status-pill')).toBeNull()
  })

  it('FE-COMP-MAPLAYER-014: a tiny spinner in the badge while tiles load', () => {
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'loading', count: 2 })} />)
    const badge = screen.getByTestId('ferrata-count-badge')
    expect(badge).toContainElement(screen.getByTestId('ferrata-count-spinner'))
    expect(badge).not.toHaveTextContent('2')
    expect(screen.getByRole('status')).toHaveTextContent('Loading via ferratas…')
  })

  it('FE-COMP-MAPLAYER-015: offline, the mirrors down or the view too wide: a warning tone, the reason in the tooltip', async () => {
    const { rerender } = render(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'offline', count: 1 })} />)
    expect(screen.getByTestId('ferrata-count-badge')).toHaveAttribute('data-tone', 'warning')
    expect(screen.getByTestId('ferrata-count-badge')).toHaveClass('bg-warning-soft', 'text-warning')
    expect(screen.getByRole('status')).toHaveTextContent('Via ferratas need a connection')

    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'tooLarge' })} />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Via ferratas' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Zoom in to load via ferratas')

    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer({ active: true, status: 'error' })} />)
    expect(screen.getByTestId('ferrata-count-badge')).toHaveAttribute('data-tone', 'warning')
    expect(screen.getByRole('status')).toHaveTextContent('Overpass unreachable')
  })

  it('FE-COMP-MAPLAYER-016: sits beside the 3D switch behind one divider', () => {
    render(
      <TourMapLayerSwitcher active="default" onChange={() => {}} onToggleTerrain={() => {}}
        ferrataLayer={ferrataLayer({ active: true, status: 'ready', count: 2 })} />
    )
    const group = screen.getByRole('group')
    expect(group.querySelectorAll('span.bg-edge')).toHaveLength(1)
    const buttons = Array.from(group.querySelectorAll('button')).map((button) => button.getAttribute('aria-label') ?? button.textContent)
    expect(buttons.slice(-2)).toEqual(['Via ferratas', '3D'])
  })
  it('FE-COMP-MAPLAYER-017: the "set points" switch leads the tools on its icon, pressed in the accent while on', async () => {
    const onToggle = vi.fn()
    const { rerender } = render(
      <TourMapLayerSwitcher active="default" onChange={() => {}} onToggleTerrain={() => {}}
        ferrataLayer={ferrataLayer()} placeTool={{ active: true, onToggle }} />
    )
    const group = screen.getByRole('group')
    expect(group.querySelectorAll('span.bg-edge')).toHaveLength(1)
    const buttons = Array.from(group.querySelectorAll('button')).map((button) => button.getAttribute('aria-label') ?? button.textContent)
    expect(buttons.slice(-3)).toEqual(['Set points', 'Via ferratas', '3D'])
    const tool = screen.getByRole('button', { name: 'Set points' })
    expect(tool).toHaveAttribute('aria-pressed', 'true')
    expect(tool).toHaveClass('bg-accent', 'text-accent-text')
    expect(tool).not.toHaveTextContent('Set points')
    fireEvent.click(tool)
    expect(onToggle).toHaveBeenCalledTimes(1)
    fireEvent.mouseEnter(tool)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Set points')

    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} placeTool={{ active: false, onToggle }} />)
    expect(screen.getByRole('button', { name: 'Set points' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Set points' })).toHaveClass('text-content-muted')
  })
})

const pisteOverlay = (overrides: Partial<ToggleableRasterOverlay> = {}): ToggleableRasterOverlay => ({
  id: 'pistes',
  url: 'https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png',
  attribution: 'OpenSnowMap',
  minZoom: 9,
  maxZoom: 18,
  active: false,
  status: 'off',
  belowMinZoom: false,
  onToggle: vi.fn(),
  onTileError: vi.fn(),
  onTileLoad: vi.fn(),
  ...overrides,
})

describe('TourMapLayerSwitcher piste switch (SKI-01)', () => {
  it('FE-COMP-MAPLAYER-021: the pistes switch sits on its icon alone, named by its tooltip, and offers no key while off', async () => {
    const overlay = pisteOverlay()
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} ferrataLayer={ferrataLayer()} layers={{ overlays: [overlay] }} />)
    const toggle = screen.getByRole('button', { name: 'Pistes, cross-country trails and lifts' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle.textContent).toBe('')
    expect(screen.queryByTestId('piste-key-button')).toBeNull()
    fireEvent.click(toggle)
    expect(overlay.onToggle).toHaveBeenCalledTimes(1)
    fireEvent.mouseEnter(toggle)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Pistes, cross-country trails and lifts')
  })

  it('FE-COMP-MAPLAYER-022: on, the switch is pressed in the accent and the key rides beside it in the same pill', () => {
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} layers={{ overlays: [pisteOverlay({ active: true, status: 'on' })] }} />)
    const toggle = screen.getByRole('button', { name: 'Pistes, cross-country trails and lifts' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveClass('bg-accent', 'text-accent-text')
    const key = screen.getByTestId('piste-key-button')
    expect(screen.getByRole('group')).toContainElement(key)
    expect(key).toHaveAccessibleName('Piste key')
  })

  it('FE-COMP-MAPLAYER-023: a piste source that stopped answering shows the warning badge, says so, and keeps the key readable', async () => {
    render(<TourMapLayerSwitcher active="default" onChange={() => {}} layers={{ overlays: [pisteOverlay({ active: true, status: 'down' })] }} />)
    const toggle = screen.getByRole('button', { name: 'Pistes, cross-country trails and lifts' })
    expect(toggle).toHaveAttribute('data-status', 'down')
    expect(toggle).toHaveTextContent('!')
    expect(screen.getByTestId('piste-key-button')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Pistes are not loading. The map and your route still work.')
    fireEvent.mouseEnter(toggle)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Pistes are not loading.')
  })

  it('FE-COMP-MAPLAYER-024: on further out than the pistes reach, the switch stays pressed in the soft accent and says to zoom in', async () => {
    const { rerender } = render(
      <TourMapLayerSwitcher active="default" onChange={() => {}} layers={{ overlays: [pisteOverlay({ active: true, status: 'on', belowMinZoom: true })] }} />
    )
    const toggle = screen.getByRole('button', { name: 'Pistes, cross-country trails and lifts' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAttribute('data-below-min-zoom', 'true')
    expect(toggle).toHaveClass('bg-accent-soft', 'text-accent')
    expect(screen.getByRole('status')).toHaveTextContent('Zoom in to see the pistes')
    fireEvent.mouseEnter(toggle)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Zoom in to see the pistes')
    // The key stays at hand and opens with the same line on top.
    fireEvent.click(screen.getByTestId('piste-key-button'))
    expect(await screen.findByTestId('piste-key-zoom-in')).toHaveTextContent('Zoom in to see the pistes')

    // A source that stopped answering says so instead, and close enough the switch is plainly on.
    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} layers={{ overlays: [pisteOverlay({ active: true, status: 'down', belowMinZoom: true })] }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Pistes are not loading.')
    rerender(<TourMapLayerSwitcher active="default" onChange={() => {}} layers={{ overlays: [pisteOverlay({ active: true, status: 'on' })] }} />)
    const plain = screen.getByRole('button', { name: 'Pistes, cross-country trails and lifts' })
    expect(plain).not.toHaveAttribute('data-below-min-zoom')
    expect(plain).toHaveClass('bg-accent', 'text-accent-text')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})
