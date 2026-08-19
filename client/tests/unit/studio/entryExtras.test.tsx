import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookListElementSchema, normalizeBookDocument } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { bookPageSetupSchema } from '@trek/shared'

/**
 * Mood, weather and pros & cons (#1973).
 *
 * These come from the journal entry rather than from the trip, and they are the
 * part of an entry a photo cannot carry. What is checked here is that they draw
 * from the entry's own vocabulary — the same keys, icons and palette the journey
 * page uses — rather than from a second copy that would drift.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const typeset = { font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, stale: false }
const common = { rotation: 0, opacity: 1, locked: false, frame: { x: 10, y: 20, w: 90, h: 40 } }

function draw(elements: BookElement[]) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} />)
}

const badge = (over: Record<string, unknown>): BookElement => ({
  ...common, ...typeset, id: 'b1', kind: 'badge',
  variant: 'mood', text: '', sub: '', code: null, style: 'plain', ...over,
} as unknown as BookElement)

const list = (over: Record<string, unknown> = {}): BookElement => ({
  ...common, ...typeset, id: 'l1', kind: 'list',
  items: [
    { text: 'Warm all week', tone: 'pro' },
    { text: 'Ferry was late', tone: 'con' },
  ],
  layout: 'columns', showMarks: true, proLabel: 'Pros', conLabel: 'Cons', ...over,
} as unknown as BookElement)

describe('the mood mark', () => {
  it('draws the icon the journey page uses for that mood', () => {
    const { container } = draw([badge({ variant: 'mood', code: 'good', text: 'Good' })])
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toContain('Good')
  })

  /*
   * The palette comes from MOOD_CONFIG rather than from the element's accent:
   * a mood has a colour of its own in TREK, and a book that ignored it would
   * disagree with the page the entry was written on.
   */
  it('takes its colour from the mood, not from the element accent', () => {
    const { container } = draw([badge({ variant: 'mood', code: 'good', text: 'Good' })])
    const icon = container.querySelector('svg')!
    expect(icon.getAttribute('stroke')).toBe('#B45309')
  })

  it('draws nothing for a mood key TREK does not know', () => {
    const { container } = draw([badge({ variant: 'mood', code: 'elated', text: 'Elated' })])
    expect(container.querySelector('svg')).toBeNull()
    // The words still print — an unknown key is not a reason to lose the label.
    expect(container.textContent).toContain('Elated')
  })
})

describe('the weather mark', () => {
  it('draws the icon for that weather', () => {
    const { container } = draw([badge({ variant: 'weather', code: 'cloudy', text: 'Cloudy' })])
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toContain('Cloudy')
  })

  it('uses the element accent, since weather has no palette of its own', () => {
    const { container } = draw([badge({ variant: 'weather', code: 'sunny', text: 'Sunny' })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#c2410c')
  })
})

describe('the pros and cons list', () => {
  it('prints both columns with their headings', () => {
    const { container } = draw([list()])
    expect(container.textContent).toContain('Warm all week')
    expect(container.textContent).toContain('Ferry was late')
    expect(container.textContent).toContain('Pros')
    expect(container.textContent).toContain('Cons')
  })

  it('marks each line, a plus against a dash', () => {
    const { container } = draw([list()])
    expect(container.textContent).toContain('+')
    // An en dash, not a hyphen — at 2mm a hyphen reads as a speck.
    expect(container.textContent).toContain('–')
  })

  it('drops the marks when they are switched off', () => {
    const { container } = draw([list({ showMarks: false })])
    expect(container.textContent).toContain('Warm all week')
    expect(container.textContent).not.toContain('+')
  })

  it('prints a one-sided list without an empty second column', () => {
    const { container } = draw([list({
      items: [{ text: 'Only good things', tone: 'pro' }],
      conLabel: '',
    })])
    expect(container.textContent).toContain('Only good things')
    expect(container.textContent).not.toContain('Cons')
  })

  it('runs as one column when stacked', () => {
    const { container } = draw([list({ layout: 'stacked' })])
    expect(container.textContent).toContain('Warm all week')
    expect(container.textContent).toContain('Ferry was late')
  })

  it('survives an empty list rather than failing to draw', () => {
    const { container } = draw([list({ items: [], proLabel: '', conLabel: '' })])
    expect(container.querySelector('div')).not.toBeNull()
  })
})

describe('the list contract', () => {
  it('defaults to an empty two-column list with marks', () => {
    const parsed = bookListElementSchema.parse({
      id: 'l1', kind: 'list', frame: { x: 0, y: 0, w: 10, h: 10 },
    })
    expect(parsed.items).toEqual([])
    expect(parsed.layout).toBe('columns')
    expect(parsed.showMarks).toBe(true)
  })

  it('defaults an item with no tone to plain', () => {
    const parsed = bookListElementSchema.parse({
      id: 'l1', kind: 'list', frame: { x: 0, y: 0, w: 10, h: 10 },
      items: [{ text: 'something' }],
    })
    expect(parsed.items[0].tone).toBe('plain')
  })

  /*
   * The rule the whole format rests on: a document written before these
   * elements existed still opens, and one written with them survives a round
   * trip through storage.
   */
  it('round-trips inside a document', () => {
    const doc = normalizeBookDocument({
      version: 1,
      title: 'T',
      page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
      spreads: [{
        id: 's1', role: 'inner', entryId: null, background: null, parked: [],
        elements: [{
          id: 'l1', kind: 'list', frame: { x: 1, y: 2, w: 90, h: 40 },
          items: [{ text: 'kept', tone: 'con' }],
          proLabel: 'P', conLabel: 'C',
        }],
      }],
    })
    const el = doc.spreads[0].elements[0]
    expect(el.kind).toBe('list')
    expect(el.kind === 'list' && el.items[0]).toEqual({ text: 'kept', tone: 'con' })
    expect(el.kind === 'list' && el.conLabel).toBe('C')
  })

  it('still opens a document that predates these elements', () => {
    const doc = normalizeBookDocument({
      version: 1,
      title: 'Old',
      page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
      spreads: [{
        id: 's1', role: 'inner', entryId: null, background: null, parked: [],
        elements: [{ id: 'p1', kind: 'photo', frame: { x: 0, y: 0, w: 50, h: 50 }, photoId: 3 }],
      }],
    })
    const el = doc.spreads[0].elements[0]
    expect(el.kind).toBe('photo')
    // The fields added since default in rather than failing the parse.
    expect(el.kind === 'photo' && el.mask).toBeNull()
    expect(el.kind === 'photo' && el.frameStyle).toBe('none')
  })
})
