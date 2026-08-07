import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as lucide from 'lucide-react'
import { renderIconMarkup } from './iconMarkup'

/**
 * The whole point of iconMarkup.ts is to stop shipping Fizz to the browser, so
 * this is the one place allowed to import it — in a test, which never reaches a
 * bundle. It diffs our serializer against the real thing for every exported
 * icon, which is what makes "byte-compatible" a checked claim rather than a
 * comment.
 */

type IconComponent = Parameters<typeof createElement>[0]

const ICONS = Object.entries(lucide).filter(
  ([name, value]) =>
    /^[A-Z]/.test(name) &&
    typeof value === 'object' &&
    value !== null &&
    (value as { $$typeof?: symbol }).$$typeof === Symbol.for('react.forward_ref')
) as [string, IconComponent][]

// The three prop shapes the call sites actually use.
const PROP_SHAPES: Record<string, unknown>[] = [
  {},
  { size: 13, strokeWidth: 2.5, color: 'white' },
  { size: 24, strokeWidth: 1.8, color: 'rgba(255,255,255,0.92)', className: 'x' },
]

describe('renderIconMarkup parity with react-dom/server', () => {
  it('FE-UTIL-ICONMARKUP-001: the icon set is actually found', () => {
    // Guards against a lucide restructure silently turning this suite into a no-op.
    expect(ICONS.length).toBeGreaterThan(1000)
  })

  it('FE-UTIL-ICONMARKUP-002: every exported icon serializes byte-identically', () => {
    const mismatches: string[] = []
    for (const [name, Icon] of ICONS) {
      for (const props of PROP_SHAPES) {
        const expected = renderToStaticMarkup(createElement(Icon, props))
        const actual = renderIconMarkup(createElement(Icon, props))
        if (actual !== expected) {
          mismatches.push(`${name} ${JSON.stringify(props)}\n  fizz: ${expected}\n  ours: ${actual}`)
        }
      }
    }
    expect(mismatches.slice(0, 5).join('\n')).toBe('')
  })

  it('FE-UTIL-ICONMARKUP-003: viewBox keeps its camel case', () => {
    // A naive prop-name-to-kebab rule turns this into view-box, and the icon
    // renders as an invisible zero-size box.
    expect(renderIconMarkup(createElement(lucide.Utensils))).toContain('viewBox="0 0 24 24"')
  })

  it('FE-UTIL-ICONMARKUP-004: attribute values are escaped like React escapes them', () => {
    const hostile = 'red" onload="alert(1)'
    const expected = renderToStaticMarkup(createElement(lucide.Utensils, { color: hostile }))
    expect(renderIconMarkup(createElement(lucide.Utensils, { color: hostile }))).toBe(expected)
    expect(renderIconMarkup(createElement(lucide.Utensils, { color: hostile }))).not.toContain('onload="alert(1)"')
  })

  it('FE-UTIL-ICONMARKUP-005: a throwing component yields an empty string, not an exception', () => {
    const Boom = () => { throw new Error('boom') }
    expect(renderIconMarkup(createElement(Boom))).toBe('')
  })
})
