import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Nothing in a rendered test can see the notice's stacking order: jsdom applies
// no author stylesheet and resolves no custom properties, so the two real files
// are the only place the answer lives. Issue #2052 is exactly that gap, the
// overlay sat at a bare 50 and the Vacay mode bar covered it.
describe('release notice css', () => {
  // Vitest runs with the client package as its root, so cwd is stable here.
  const read = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')
  const notice = read('src/components/SystemNotices/releaseNotice.css')
  const tokens = read('src/index.css')

  const within = (source: string, selector: string): string => {
    const at = source.indexOf(selector)
    expect(at, `${selector} missing from releaseNotice.css`).toBeGreaterThan(-1)
    return source.slice(at, source.indexOf('}', at) + 1)
  }

  const block = (selector: string): string => within(notice, selector)

  // A half is named twice: indented in the stacked block, where it is only placed
  // in the grid, and at the top level, where it is painted. Anchor on the newline
  // to get the second.
  const painted = (selector: string): string => within(notice, `\n${selector}`)

  const stacked = (): string => {
    const at = notice.indexOf('@media (max-width: 1080px)')
    expect(at, 'the stacked block').toBeGreaterThan(-1)
    return notice.slice(at, notice.indexOf('\n}', at))
  }

  // How many rules deep a position sits, comments taken out so a brace in prose
  // cannot shift the count. Zero means the rule applies at every width.
  const depthAt = (index: number): number => {
    let depth = 0
    for (const ch of notice.slice(0, index).replace(/\/\*[\s\S]*?\*\//g, '')) {
      if (ch === '{') depth += 1
      else if (ch === '}') depth -= 1
    }
    return depth
  }

  const decl = (rule: string, prop: string): string => {
    const found = new RegExp(`(?:^|[;{\\n])\\s*${prop}:\\s*([^;]+);`).exec(rule)
    expect(found, `${prop} missing from ${rule.slice(0, 44)}`).not.toBeNull()
    return found![1].trim()
  }

  interface Rgba { r: number; g: number; b: number; a: number }

  // The custom properties of one theme, so a declaration can be resolved the way
  // the browser resolves it instead of being taken on trust.
  const theme = (opener: string): Record<string, string> => {
    const at = tokens.indexOf(opener)
    expect(at, `${opener} missing from index.css`).toBeGreaterThan(-1)
    const body = tokens.slice(at, tokens.indexOf('\n}', at))
    const map: Record<string, string> = {}
    for (const [, token, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) map[token] = value.trim()
    return map
  }

  const rgba = (value: string, vars: Record<string, string>): Rgba => {
    const v = value.trim()
    const ref = /^var\((--[\w-]+)\)$/.exec(v)
    if (ref) {
      const token = vars[ref[1]]
      expect(token, `${ref[1]} missing from index.css`).toBeDefined()
      return rgba(token, vars)
    }
    const mix = /^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*(.+)\)$/.exec(v)
    if (mix) {
      const share = Number(mix[2]) / 100
      const first = rgba(mix[1], vars)
      const second = rgba(mix[3], vars)
      const blend = (x: number, y: number): number => x * share + y * (1 - share)
      return {
        r: blend(first.r, second.r),
        g: blend(first.g, second.g),
        b: blend(first.b, second.b),
        a: blend(first.a, second.a)
      }
    }
    const hex = /^#([0-9a-f]{6})$/i.exec(v)
    if (hex) {
      return {
        r: parseInt(hex[1].slice(0, 2), 16),
        g: parseInt(hex[1].slice(2, 4), 16),
        b: parseInt(hex[1].slice(4, 6), 16),
        a: 1
      }
    }
    const fn = /^rgba?\(([^)]+)\)$/.exec(v)
    expect(fn, `${value} is not a colour this test can resolve`).not.toBeNull()
    const parts = fn![1].split(',').map(Number)
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }

  const over = (front: Rgba, back: Rgba): Rgba => ({
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a),
    a: 1
  })

  const contrast = (one: Rgba, other: Rgba): number => {
    const luminance = (c: Rgba): number => {
      const channel = (raw: number): number => {
        const v = raw / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    }
    const [light, dark] = [luminance(one), luminance(other)].sort((a, b) => b - a)
    return (light + 0.05) / (dark + 0.05)
  }

  const step = (name: string): number => {
    const found = new RegExp(`${name}:\\s*(\\d+);`).exec(tokens)
    expect(found, `${name} missing from index.css`).not.toBeNull()
    return Number(found![1])
  }

  it('FE-COMP-RELEASENOTICECSS-001: the overlay stacks from the token, not a bare 50', () => {
    const overlay = block('.rn-overlay {')
    expect(overlay).toMatch(/z-index:\s*var\(--z-notice/)
    expect(overlay).not.toMatch(/z-index:\s*50\b/)
  })

  it('FE-COMP-RELEASENOTICECSS-002: the notice step clears the navbar and the Vacay toolbar', () => {
    // The Vacay calendar's mode bar is sticky at 61 and no stacking context
    // separates the two, so it comes down to a plain number comparison.
    expect(step('--z-notice')).toBeGreaterThan(step('--z-nav'))
    expect(step('--z-notice')).toBeGreaterThan(61)
  })

  it('FE-COMP-RELEASENOTICECSS-003: what the columns hold keeps its height, the columns scroll', () => {
    // A flex item with overflow hidden may shrink to nothing. The promise box is
    // one, and on a 1080p screen at 100% it was pressed down to its label while
    // the column around it scrolled. jsdom lays nothing out, so the rule itself
    // is the assertion.
    const columns = block('.rn-release-inner > *,')
    expect(columns).toMatch(/\.rn-note-body > \*/)
    expect(columns).toMatch(/flex-shrink:\s*0/)
    expect(block('.rn-promise {')).toMatch(/overflow:\s*hidden/)
  })

  it('FE-COMP-RELEASENOTICECSS-004: stacked, the close button stays on screen for the whole scroll', () => {
    // Below 1080px the panel scrolls as one column with the release half first.
    // The X lived in the note, so on a tablet it was a whole release half below
    // the fold, and at 900px and under there is no backdrop to tap instead. It
    // is a grid item spanning both rows now, stuck to the panel's top edge; the
    // base rule is absolute and must come first or it wins the cascade.
    const at = notice.indexOf('@media (max-width: 1080px)')
    const base = notice.indexOf('.rn-close {\n  position: absolute')
    expect(base, 'the absolute close rule').toBeGreaterThan(-1)
    expect(at).toBeGreaterThan(base)
    const close = within(stacked(), '.rn-close {')
    expect(close).toMatch(/position:\s*sticky/)
    expect(close).toMatch(/grid-row:\s*1 \/ -1/)
    // Both halves need a definite cell, or auto-placement steps around the button.
    expect(stacked()).toMatch(/\.rn-release \{ grid-area: 1 \/ 1; \}/)
    expect(stacked()).toMatch(/\.rn-note \{ grid-area: 2 \/ 1; \}/)
    expect(block('.rn-panel {')).toMatch(/position:\s*relative/)
    // Sticky without an offset never sticks, and the offset is the base rule's:
    // scope that into a width query of its own and the button silently scrolls
    // away again with every assertion above still green.
    expect(decl(notice.slice(base), 'top'), 'the close button has no offset to stick to').toMatch(/^\d+px$/)
    expect(depthAt(base), 'the offset the sticky rule leans on sits inside a query').toBe(0)
  })

  it('FE-COMP-RELEASENOTICECSS-005: stacked, the close button reads over the release half too', () => {
    // Stuck to the panel's top edge the X hangs over .rn-release, a brand panel
    // that is dark in both themes, but it kept the palette it had on the white
    // note: a near-transparent fill under secondary ink. Resolved against the real
    // tokens that is a slate glyph on near black in the light theme, about 1.8:1,
    // and below 1080px this button is the only way out of the notice. Both halves
    // are one scroll, so the chip has to carry over either.
    const gradient = decl(painted('.rn-release {'), 'background')
    const backdrops = [...gradient.matchAll(/#[0-9a-f]{6}/gi)].map(match => match[0])
    expect(backdrops.length, 'the release half paints no gradient stops').toBeGreaterThan(1)
    backdrops.push(decl(painted('.rn-note {'), 'background'))

    const themes = [
      { name: 'light', vars: theme(':root {') },
      { name: 'dark', vars: theme('.dark {') }
    ]
    const states = [
      { name: 'at rest', rule: within(stacked(), '.rn-close {') },
      { name: 'hovered', rule: block('.rn-close:hover {') }
    ]

    for (const { name, vars } of themes) {
      for (const state of states) {
        const glyph = rgba(decl(state.rule, 'color'), vars)
        for (const behind of backdrops) {
          const chip = over(rgba(decl(state.rule, 'background'), vars), rgba(behind, vars))
          expect(contrast(glyph, chip), `${name}, ${state.name}, over ${behind}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})
