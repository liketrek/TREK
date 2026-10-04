import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// jsdom lays nothing out, so the rules themselves are the assertion, the way
// releaseNoticeCss.test.ts pins the notice's stacking.
describe('dashboard css', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/styles/dashboard.css'), 'utf8')
  const within = (source: string, selector: string): string => {
    const at = source.indexOf(selector)
    expect(at, `${selector} missing from dashboard.css`).toBeGreaterThan(-1)
    return source.slice(at, source.indexOf('}', at) + 1)
  }
  const block = (selector: string): string => within(css, selector)
  const phone = (): string => {
    const at = css.indexOf('@media (max-width: 720px)')
    expect(at, 'the phone block').toBeGreaterThan(-1)
    return css.slice(at, css.indexOf('\n}', at))
  }
  // The leading number of a declaration, undefined when the rule does not set it.
  const number = (rule: string, prop: string): number | undefined => {
    const found = new RegExp(`(?:^|[;{\\n])\\s*${prop}:\\s*(-?[\\d.]+)`).exec(rule)
    return found ? Number(found[1]) : undefined
  }
  const value = (rule: string, prop: string): number => {
    const found = number(rule, prop)
    expect(found, `${prop} missing from ${rule.slice(0, 48)}`).toBeDefined()
    return found!
  }

  it('FE-DASH-CSS-001: a hero title that is one long word cannot widen the card', () => {
    // Reported from Discord: with a title like "asdaaaa…" the tools row and the
    // boarding pass grew to the width of the word, and edit, clone, archive and
    // delete sat off the card. The grid column may not grow past the hero, and the
    // title breaks inside the card and stops at two lines.
    expect(block('.trek-dash .hero-content {')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(block('.trek-dash .hero-title-block {')).toMatch(/min-width:\s*0/)
    const title = block('.trek-dash .hero-title {')
    expect(title).toMatch(/overflow-wrap:\s*anywhere/)
    expect(title).toMatch(/-webkit-line-clamp:\s*2/)
    expect(title).toMatch(/overflow:\s*hidden/)
  })

  it('FE-DASH-CSS-002: the clamp clips at the line boxes, so they leave room for the ink', () => {
    // Poppins paints past its line box (ascender 1.05em, descender 0.35em). With
    // the clamp's overflow: hidden at line-height 0.9, every y, g and p on the
    // last line lost its tail and É and Å on the first their accent. The room is
    // padding the margin takes back, and the line-height has to keep a clipped
    // third line's plain ascenders below that padding, which 1.12 just does (an
    // accented capital on that third line still leaves a sliver, as at 0.9).
    for (const selector of ['.trek-dash .hero-title {', '.trek-dash .trip-name {']) {
      const rule = block(selector)
      expect(rule, selector).toMatch(/overflow:\s*hidden/)
      expect(value(rule, 'line-height'), selector).toBeGreaterThanOrEqual(1.12)
      const room = /padding-block:\s*0?\.(\d+)em/.exec(rule)?.[1]
      expect(room, `${selector} pads no room for the ink`).toBeDefined()
      expect(rule, selector).toMatch(new RegExp(`margin-block:\\s*-0?\\.${room}em`))
    }
  })

  it('FE-DASH-CSS-003: a grid or list card breaks a one-word title inside the cover and stops at two lines', () => {
    // The same title that stretched the hero was cut at the cover edge on every
    // card: the cover content is absolutely positioned and the cover clips.
    const name = block('.trek-dash .trip-name {')
    expect(name).toMatch(/overflow-wrap:\s*anywhere/)
    expect(name).toMatch(/-webkit-line-clamp:\s*2/)
  })

  it('FE-DASH-CSS-004: a list row uses every title line that fits above the status badge', () => {
    // The list cover is a fixed band: the badge is pinned near its top and the
    // title hangs from its bottom edge, so each line the title gains grows upwards
    // into the badge. At 26px over a 100px cover the two-line clamp put the first
    // line at y 23 and ran it through the pill; the phone banner is taller and its
    // type smaller, so there two fit. jsdom lays nothing out, so the row is
    // measured from the rules the browser would apply.
    const inherited = 1.5 // html's line-height; nothing in dashboard.css resets it
    const badge = block('.trek-dash .trip-status {')
    const badgeBottom =
      value(badge, 'top') + 2 * value(badge, 'border') + 2 * value(badge, 'padding') + value(badge, 'font-size') * inherited
    const name = block('.trek-dash .trip-name {')
    // What the row ends up with: its own override where it has one, the shared
    // .trip-name rule otherwise.
    const shell = (rule: string, prop: string): number => number(rule, prop) ?? value(name, prop)

    const rows = [
      {
        label: 'desktop',
        cover: block('.trek-dash .trips.list-view .trip-cover {'),
        content: block('.trek-dash .trip-cover-content {'),
        row: block('.trek-dash .trips.list-view .trip-name {')
      },
      {
        label: 'phone',
        cover: within(phone(), '.trek-dash .trips.list-view .trip-cover {'),
        content: within(phone(), '.trek-dash .trips.list-view .trip-cover-content {'),
        row: within(phone(), '.trek-dash .trips.list-view .trip-name {')
      }
    ]

    for (const { label, cover, content, row } of rows) {
      const fontSize = shell(row, 'font-size')
      const line = fontSize * shell(row, 'line-height')
      // The clamp pads .1em for the ink and takes it back with a negative margin,
      // so the box keeps its height but paints that much higher.
      const ceiling = value(cover, 'height') - value(content, 'bottom') - fontSize * shell(row, 'padding-block')
      const clamp = shell(row, '-webkit-line-clamp')
      expect(ceiling - clamp * line, `${label} list title over the badge`).toBeGreaterThanOrEqual(badgeBottom)
      expect(clamp, `${label} list title leaves a line unused`).toBe(Math.floor((ceiling - badgeBottom) / line))
    }
  })
})
