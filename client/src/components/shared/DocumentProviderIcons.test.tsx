// FE-DOCSYNC-ICONS-001 to FE-DOCSYNC-ICONS-014

/**
 * The document providers' marks, and TREK's own.
 *
 * These are static files, so the only things worth holding still are the ones a
 * person would notice if they slipped: a provider the server seeds but the
 * client has no glyph for (the row renders nothing at all), a mark that keeps a
 * brand colour and so stays black on a dark background, and the sizing contract
 * the callers rely on: `size` for the bare lucide-sized rows, a `className`
 * everywhere the surrounding Tailwind box decides how big the glyph is.
 */
import { describe, it, expect } from 'vitest'
import { DOCUMENT_PROVIDER_IDS } from '@trek/shared'
import { render } from '../../../tests/helpers/render'
import { DOCUMENT_PROVIDER_ICONS } from './DocumentProviderIcons'
import TrekIcon from './TrekIcon'

const marks = Object.entries(DOCUMENT_PROVIDER_ICONS)

/** The svg plus everything drawn inside it. */
function allElements(svg: SVGElement): Element[] {
  return [svg, ...Array.from(svg.querySelectorAll('*'))]
}

function renderMark(Icon: (typeof marks)[number][1], props: Record<string, unknown> = {}): SVGElement {
  const { container } = render(<Icon {...props} />)
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('no svg rendered')
  return svg as unknown as SVGElement
}

describe('DOCUMENT_PROVIDER_ICONS', () => {
  it('FE-DOCSYNC-ICONS-001: carries exactly one mark per provider the server seeds', () => {
    // A provider seeded without a glyph here renders an empty slot in the
    // connect modal and the addon shelf; a glyph with no provider is dead code.
    expect(Object.keys(DOCUMENT_PROVIDER_ICONS).sort()).toEqual([...DOCUMENT_PROVIDER_IDS].sort())
  })

  it('FE-DOCSYNC-ICONS-002: resolves each id the way the panels look one up', () => {
    for (const id of DOCUMENT_PROVIDER_IDS) {
      expect(typeof DOCUMENT_PROVIDER_ICONS[id], id).toBe('function')
    }
  })

  it('FE-DOCSYNC-ICONS-003: renders an svg for every provider', () => {
    for (const [id, Icon] of marks) {
      const { container } = render(<Icon />)
      expect(container.querySelector('svg'), id).not.toBeNull()
    }
  })

  it('FE-DOCSYNC-ICONS-004: draws only in currentColor, so the mark inverts with the theme', () => {
    const hex = /#[0-9a-f]{3}/i

    for (const [id, Icon] of marks) {
      const svg = renderMark(Icon)
      const painted: string[] = []

      for (const el of allElements(svg)) {
        for (const attr of Array.from(el.attributes)) {
          expect(attr.value, `${id} ${attr.name}`).not.toMatch(hex)
          if (attr.name === 'fill' || attr.name === 'stroke') painted.push(attr.value)
        }
      }

      expect(painted.length, id).toBeGreaterThan(0)
      for (const value of painted) expect(['currentColor', 'none'], id).toContain(value)
      expect(painted, id).toContain('currentColor')
    }
  })

  it('FE-DOCSYNC-ICONS-005: keeps a viewBox, so the glyph scales instead of cropping', () => {
    for (const [id, Icon] of marks) {
      expect(renderMark(Icon).getAttribute('viewBox'), id).toMatch(/^0 0 \d+ \d+$/)
    }
  })

  it('FE-DOCSYNC-ICONS-006: stays out of the accessibility tree, the provider name is next to it', () => {
    for (const [id, Icon] of marks) {
      expect(renderMark(Icon).getAttribute('aria-hidden'), id).toBe('true')
    }
  })

  it('FE-DOCSYNC-ICONS-007: sizes itself to 20px when nothing says otherwise', () => {
    for (const [id, Icon] of marks) {
      const svg = renderMark(Icon)
      expect(svg.getAttribute('width'), id).toBe('20')
      expect(svg.getAttribute('height'), id).toBe('20')
    }
  })

  it('FE-DOCSYNC-ICONS-008: honours an explicit size', () => {
    for (const [id, Icon] of marks) {
      const svg = renderMark(Icon, { size: 32 })
      expect(svg.getAttribute('width'), id).toBe('32')
      expect(svg.getAttribute('height'), id).toBe('32')
    }
  })

  it('FE-DOCSYNC-ICONS-009: drops its own width and height once a className sizes it', () => {
    // Callers pass utility classes (`h-6 w-6`); a width attribute would win over
    // them on some of these and leave a 20px glyph in a 24px box.
    for (const [id, Icon] of marks) {
      const svg = renderMark(Icon, { className: 'h-6 w-6', size: 32 })
      expect(svg.getAttribute('width'), id).toBeNull()
      expect(svg.getAttribute('height'), id).toBeNull()
    }
  })

  it('FE-DOCSYNC-ICONS-010: puts the caller className on the svg', () => {
    for (const [id, Icon] of marks) {
      expect(renderMark(Icon, { className: 'h-6 w-6 text-content' }).getAttribute('class'), id).toBe(
        'h-6 w-6 text-content',
      )
    }
  })
})

describe('TrekIcon', () => {
  it('FE-DOCSYNC-ICONS-011: renders TREK\u2019s app icon in currentColor', () => {
    const { container } = render(<TrekIcon />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 512 512')
    expect(svg!.querySelectorAll('path[fill="currentColor"]').length).toBeGreaterThan(0)
  })

  it('FE-DOCSYNC-ICONS-012: takes a className, which is the only thing that sizes it', () => {
    const { container } = render(<TrekIcon className="h-6 w-6 text-content" />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('class')).toBe('h-6 w-6 text-content')
    expect(svg.getAttribute('width')).toBeNull()
    expect(svg.getAttribute('height')).toBeNull()
  })

  it('FE-DOCSYNC-ICONS-013: forwards the rest of its svg props', () => {
    const { container } = render(<TrekIcon data-testid="trek-icon" role="img" />)
    const svg = container.querySelector('svg')!

    expect(svg.getAttribute('data-testid')).toBe('trek-icon')
    expect(svg.getAttribute('role')).toBe('img')
  })

  it('FE-DOCSYNC-ICONS-014: is decorative by default and can be unhidden by the caller', () => {
    const { container } = render(<TrekIcon />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')

    const labelled = render(<TrekIcon aria-hidden={false} aria-label="TREK" />)
    const svg = labelled.container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('false')
    expect(svg.getAttribute('aria-label')).toBe('TREK')
  })
})
