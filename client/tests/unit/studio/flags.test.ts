import { describe, it, expect } from 'vitest'
import { COUNTRY_SHAPES } from '../../../src/components/Studio/countryShapes'
import {
  FLAG_H, FLAG_SPECS, FLAG_W, flagBands, flagDisc, flagSpec,
} from '../../../src/components/Studio/flags'

/**
 * The drawn flags (#1973).
 *
 * The rule that matters is the one about restraint: a flag is listed only when
 * its construction is exact. A wrong flag in a printed book is worse than a
 * country outline, so the guard here is as much about what is *absent* as
 * about what is drawn.
 */

describe('the flag table', () => {
  it('uses two-letter uppercase codes throughout', () => {
    for (const code of Object.keys(FLAG_SPECS)) {
      expect(code, code).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('gives every colour as #rrggbb, so it can be handed straight to SVG', () => {
    for (const [code, spec] of Object.entries(FLAG_SPECS)) {
      const colours = spec.t === 'h' || spec.t === 'v'
        ? spec.c
        : spec.t === 'nordic'
          ? [spec.field, spec.cross, ...(spec.inner ? [spec.inner] : [])]
          : spec.t === 'cross'
            ? [spec.field, spec.cross]
            : [spec.field, spec.disc]
      for (const c of colours) expect(c, `${code}: ${c}`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('has at least two bands on any striped flag', () => {
    for (const [code, spec] of Object.entries(FLAG_SPECS)) {
      if (spec.t === 'h' || spec.t === 'v') {
        expect(spec.c.length, code).toBeGreaterThanOrEqual(2)
      }
    }
  })

  /*
   * The point of the whole approach: anything that cannot be built from bands,
   * a cross or a disc is left out rather than approximated. These are the flags
   * most likely to be reached for and wrongly added — each carries an emblem or
   * unequal bands that this construction cannot express.
   */
  it('leaves out the flags it cannot draw exactly', () => {
    for (const code of ['GB', 'US', 'ES', 'PT', 'MX', 'BR', 'IN', 'EG', 'CA', 'AU', 'CO', 'LV', 'GR', 'TR']) {
      expect(FLAG_SPECS[code], code).toBeUndefined()
    }
  })

  it('has a country silhouette for every flag it does not draw', () => {
    // The fallback has to exist, or a missing flag becomes bare letters.
    for (const code of ['GB', 'US', 'ES', 'PT', 'MX', 'BR', 'IN', 'CA', 'AU', 'TR', 'GR']) {
      expect(COUNTRY_SHAPES[code], code).toBeTruthy()
    }
  })
})

describe('flagBands', () => {
  it('splits horizontal bands evenly across the height', () => {
    const bands = flagBands({ t: 'h', c: ['#000000', '#dd0000', '#ffce00'] })
    expect(bands).toHaveLength(3)
    for (const b of bands) {
      expect(b.w).toBe(FLAG_W)
      expect(b.h).toBeCloseTo(FLAG_H / 3, 6)
    }
    expect(bands[0].y).toBe(0)
    expect(bands[2].y + bands[2].h).toBeCloseTo(FLAG_H, 6)
  })

  it('splits vertical bands evenly across the width', () => {
    const bands = flagBands({ t: 'v', c: ['#002395', '#ffffff', '#ed2939'] })
    for (const b of bands) {
      expect(b.h).toBe(FLAG_H)
      expect(b.w).toBeCloseTo(FLAG_W / 3, 6)
    }
    expect(bands[2].x + bands[2].w).toBeCloseTo(FLAG_W, 6)
  })

  it('keeps the band order, which is the whole identity of a tricolour', () => {
    const bands = flagBands(FLAG_SPECS.DE)
    expect(bands.map(b => b.fill)).toEqual(['#000000', '#dd0000', '#ffce00'])
  })

  /*
   * Left of centre is what separates a Nordic cross from a plain one — the
   * upright at the halfway mark would be the Swiss flag's geometry, not
   * Denmark's.
   */
  it('puts the Nordic upright left of centre', () => {
    const bands = flagBands(FLAG_SPECS.DK)
    const upright = bands[1]
    expect(upright.x + upright.w / 2).toBeLessThan(FLAG_W / 2)
    expect(upright.h).toBe(FLAG_H)
  })

  it('draws the inner cross on top of the outer one, and thinner', () => {
    const bands = flagBands(FLAG_SPECS.IS)
    // field, upright, crossbar, then the two inner bars.
    expect(bands).toHaveLength(5)
    expect(bands[3].fill).toBe('#dc1e35')
    expect(bands[3].w).toBeLessThan(bands[1].w)
  })

  it('omits the inner cross where the flag has none', () => {
    expect(flagBands(FLAG_SPECS.DK)).toHaveLength(3)
  })

  it('centres the Swiss cross both ways and keeps it inside the field', () => {
    const [field, upright, bar] = flagBands(FLAG_SPECS.CH)
    expect(field.w).toBe(FLAG_W)
    expect(upright.x + upright.w / 2).toBeCloseTo(FLAG_W / 2, 6)
    expect(bar.y + bar.h / 2).toBeCloseTo(FLAG_H / 2, 6)
    expect(upright.y).toBeGreaterThan(0)
    expect(upright.y + upright.h).toBeLessThan(FLAG_H)
  })

  it('keeps every band inside the flag box', () => {
    for (const [code, spec] of Object.entries(FLAG_SPECS)) {
      for (const b of flagBands(spec)) {
        expect(b.x, code).toBeGreaterThanOrEqual(0)
        expect(b.y, code).toBeGreaterThanOrEqual(0)
        expect(b.x + b.w, code).toBeLessThanOrEqual(FLAG_W + 0.001)
        expect(b.y + b.h, code).toBeLessThanOrEqual(FLAG_H + 0.001)
      }
    }
  })

  it('covers the whole box with its first band, so no page shows through', () => {
    for (const [code, spec] of Object.entries(FLAG_SPECS)) {
      const bands = flagBands(spec)
      const area = bands.reduce((sum, b) => sum + b.w * b.h, 0)
      expect(area, code).toBeGreaterThanOrEqual(FLAG_W * FLAG_H - 0.001)
    }
  })
})

describe('flagDisc', () => {
  it('is a centred circle on a disc flag', () => {
    const disc = flagDisc(FLAG_SPECS.JP)!
    expect(disc.cx).toBe(FLAG_W / 2)
    expect(disc.cy).toBe(FLAG_H / 2)
    expect(disc.r).toBeLessThan(FLAG_H / 2)
    expect(disc.fill).toBe('#bc002d')
  })

  it('is null for every other construction', () => {
    expect(flagDisc(FLAG_SPECS.DE)).toBeNull()
    expect(flagDisc(FLAG_SPECS.IS)).toBeNull()
    expect(flagDisc(FLAG_SPECS.CH)).toBeNull()
  })
})

describe('flagSpec', () => {
  it('is case-insensitive, because codes arrive from several places', () => {
    expect(flagSpec('is')).toBe(FLAG_SPECS.IS)
    expect(flagSpec('IS')).toBe(FLAG_SPECS.IS)
  })

  it('is null for nothing and for a country with no construction', () => {
    expect(flagSpec(null)).toBeNull()
    expect(flagSpec(undefined)).toBeNull()
    expect(flagSpec('')).toBeNull()
    expect(flagSpec('GB')).toBeNull()
  })
})
