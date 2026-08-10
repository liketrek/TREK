import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// The GL map's hover card is styled from index.css while its geometry comes
// from the vendor stylesheet, so the two only agree by convention. These read
// the real files rather than a rendered component: jsdom applies no vendor CSS,
// which is exactly the interaction that can break here.
describe('GL hover popup css', () => {
  // Vitest runs with the client package as its root, so cwd is stable here.
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
  const block = (selector: string): string => {
    const at = css.indexOf(selector)
    expect(at, `${selector} missing from index.css`).toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('}', at) + 1)
  }

  it('FE-COMP-MAPPOPUPCSS-001: the tail is off, not merely painted white', () => {
    // Colouring it left a visible notch under the card in every theme.
    expect(block('.trek-map-popup .maplibregl-popup-tip')).toMatch(/display:\s*none/)
  })

  it('FE-COMP-MAPPOPUPCSS-002: the corner radius outweighs the vendor anchor rules', () => {
    // maplibre-gl.css squares one corner per anchor so the tail meets the card
    // flush. With the tail gone that is just a squared corner, and the vendor
    // rule carries the same specificity as a plain `.trek-map-popup .content`
    // — whichever sheet loads last would win. The `[class]` guard settles it.
    const radius = block('.trek-map-popup[class] .maplibregl-popup-content')
    expect(radius).toMatch(/border-radius:\s*10px/)
  })

  it('FE-COMP-MAPPOPUPCSS-003: leaflet click popups keep their tail', () => {
    // Those are anchored, dismissable popups where the tail earns its place —
    // the fix above is scoped to the GL hover card on purpose.
    expect(block('.leaflet-popup-tip')).not.toMatch(/display:\s*none/)
  })
})
