import { describe, expect, it } from 'vitest'
import maplibregl from 'maplibre-gl'

function attribution(html: string, fromSource = false) {
  const control = new maplibregl.AttributionControl({
    compact: false,
    customAttribution: fromSource ? undefined : html,
  })
  const map = {
    style: {
      tileManagers: fromSource
        ? { tiles: { used: true, getSource: () => ({ attribution: html }) } }
        : {},
    },
    _getUIString: () => 'Toggle attribution',
    on: () => {},
    off: () => {},
    getCanvasContainer: () => document.createElement('div'),
  } as unknown as maplibregl.Map
  return control.onAdd(map)
}

describe('MapLibre attribution sanitizer backport', () => {
  it.each([false, true])('removes adjacent event handlers (source: %s)', fromSource => {
    const container = attribution('<details open onload="1" ontoggle="alert(1)">Credit</details>', fromSource)
    const details = container.querySelector('.maplibregl-ctrl-attrib-inner details')!
    expect(details.hasAttribute('onload')).toBe(false)
    expect(details.hasAttribute('ontoggle')).toBe(false)
    expect(details.textContent).toBe('Credit')
  })

  it('removes consecutive dangerous URLs and handlers in nested markup', () => {
    const container = attribution('<span><a href="javascript:alert(1)" onclick="alert(2)" onfocus="alert(3)">Credit</a></span>')
    const link = container.querySelector('.maplibregl-ctrl-attrib-inner a')!
    expect(link.attributes.length).toBe(0)
  })

  it('preserves provider credit and safe links', () => {
    const container = attribution('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>')
    const link = container.querySelector('.maplibregl-ctrl-attrib-inner a')!
    expect(link.getAttribute('href')).toBe('https://www.openstreetmap.org/copyright')
    expect(link.getAttribute('rel')).toBe('noopener')
    expect(link.textContent).toBe('OpenStreetMap')
  })
})
