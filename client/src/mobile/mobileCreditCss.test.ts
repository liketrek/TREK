import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// FE-MOB-CREDITCSS-001 to FE-MOB-CREDITCSS-003
//
// The phone map carries no visible credit: that is a decision, and the only thing holding
// it is a rule in mobile.css against the vendor control containers. jsdom applies no
// stylesheet, so these read the real file. Written as tests because the rule is easy to
// lose: it names vendor class names nothing else in the codebase refers to, and a credit
// creeping back is a change to the map's face that no component test would catch.
describe('phone map credit css', () => {
  // Vitest runs with the client package as its root, so cwd is stable here.
  const css = readFileSync(resolve(process.cwd(), 'src/mobile/mobile.css'), 'utf8')

  /**
   * Every rule in the sheet as its selector list and its declarations, comments dropped.
   * Parsed rather than found by substring, because a vendor class name also appears in the
   * prose above the rules.
   */
  const rules = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .filter(chunk => chunk.includes('{'))
    .map(chunk => {
      const open = chunk.lastIndexOf('{')
      const head = chunk.slice(0, open)
      return {
        selectors: head.slice(head.lastIndexOf('{') + 1).split(',').map(s => s.trim()),
        body: chunk.slice(open + 1),
      }
    })
  /** The rules whose selector list names this selector. */
  const rulesFor = (selector: string) => rules.filter(rule => rule.selectors.includes(selector))

  it('FE-MOB-CREDITCSS-001: both engines and both corners are hidden by one rule', () => {
    const hidden = rulesFor('.m-root .leaflet-control-attribution')

    expect(hidden).toHaveLength(1)
    expect(hidden[0].body).toMatch(/display:\s*none;/)
    // One rule for all of them, so Leaflet, MapLibre and Mapbox cannot drift apart, and so
    // the credit cannot come back on the one engine nobody happened to open.
    for (const selector of [
      '.m-root .maplibregl-ctrl-bottom-left',
      '.m-root .mapboxgl-ctrl-bottom-left',
      '.m-root .maplibregl-ctrl-bottom-right',
      '.m-root .mapboxgl-ctrl-bottom-right',
    ]) {
      expect(hidden[0].selectors).toContain(selector)
    }
  })

  it('FE-MOB-CREDITCSS-002: nothing else in the sheet places a credit', () => {
    // The hiding rule is the last word only while no later rule moves one of these
    // containers back into view. Both corners, because the GL wordmark sits in the left one.
    const placed = rules.filter(rule => rule.selectors.some(s => /ctrl-bottom-(left|right)|leaflet-control-attribution/.test(s)))

    expect(placed).toHaveLength(1)
    expect(placed[0].body).toMatch(/display:\s*none;/)
  })

  it('FE-MOB-CREDITCSS-003: the credit corner and its variables are gone with it', () => {
    // `m-credit-corner` was the trip map's own credit slot, `m-attrib-open` the class the
    // Leaflet (i) toggled. Both are dead now; a leftover rule would place an element that
    // no longer exists and read as if the credit were still somewhere on screen.
    expect(css).not.toContain('m-credit-corner')
    expect(css).not.toContain('m-attrib-open')
    expect(css).not.toContain('--m-credit')
  })

  it('FE-MOB-CREDITCSS-004: the phone map is the only thing this touches', () => {
    // Every selector is under `.m-root`, the phone shell. The desktop map keeps its full
    // credit with its links, which is where it belongs.
    const hidden = rulesFor('.m-root .leaflet-control-attribution')

    for (const selector of hidden[0].selectors) expect(selector.startsWith('.m-root ')).toBe(true)
  })
})
