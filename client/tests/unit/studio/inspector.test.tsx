import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { BookDocument, BookElement, BookPageNumbers, BookPageSetup } from '@trek/shared'
import {
  bookIconElementSchema, bookPageSetupSchema, bookPhotoElementSchema,
  bookShapeElementSchema, bookTextElementSchema,
} from '@trek/shared'
import { fireEvent, render } from '../../helpers/render'
import { StudioInspector } from '../../../src/components/Studio/StudioInspector'
import { useStudioStore } from '../../../src/store/studioStore'
import type { JourneySource } from '../../../src/components/Studio/StudioSidebar'

/**
 * The inspector, control by control (#1973).
 *
 * The panel was rebuilt: same job, new shape. Duplicate, lock and delete moved
 * out of a section and into the head, half the groups now start folded, every
 * boolean became the app's switch, and the number fields stopped writing on
 * every keystroke. Nothing in the suite rendered this panel, so any one of
 * those controls could have come out of the rebuild writing nothing at all and
 * the only thing that would have noticed was somebody laying out a book.
 *
 * So the assertions here are about the document rather than about the markup:
 * what is protected is that the control still writes the field it used to
 * write. Where a control has a rule of its own, that rule is pinned too: a
 * shape cannot be made invisible, choosing a coordinate notation is not an
 * override, an emptied number field leaves the value alone.
 */

const FRAME = { x: 20, y: 30, w: 60, h: 40 }

const text = (over: Record<string, unknown> = {}): BookElement =>
  bookTextElementSchema.parse({ id: 't1', kind: 'text', frame: FRAME, text: 'Harbour', ...over }) as BookElement

const photo = (over: Record<string, unknown> = {}): BookElement =>
  bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame: FRAME, ...over }) as BookElement

const shape = (over: Record<string, unknown> = {}): BookElement =>
  bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame: FRAME, ...over }) as BookElement

const icon = (over: Record<string, unknown> = {}): BookElement =>
  bookIconElementSchema.parse({ id: 'i1', kind: 'icon', frame: FRAME, name: 'Plane', ...over }) as BookElement

const setup = (folios: Partial<BookPageNumbers> = {}): BookPageSetup => bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5, pageNumbers: folios,
})

/** One entry with a point on it, so a coordinate mark has something to re-read. */
const source: JourneySource = {
  entries: [{
    id: 7, title: 'Bergen', story: null, location: 'Bergen', date: '2026-05-01',
    lat: 60.3913, lng: 5.3221, mood: null, weather: null, pros: [], cons: [],
  }],
  photos: [],
  photoEntries: {},
}

function load(elements: BookElement[], selection = elements.slice(0, 1).map(e => e.id)) {
  useStudioStore.getState().load({
    version: 1, title: 'T', page: setup(), spreads: [
      { id: 'sp1', role: 'inner', background: null, elements, parked: [], entryId: null },
    ],
  } as BookDocument)
  useStudioStore.getState().select(selection)
}

function draw(over: { page?: BookPageSetup; setPageNumbers?: (p: Partial<BookPageNumbers>) => void } = {}) {
  return render(
    <StudioInspector
      spreadIndex={0}
      page={over.page ?? setup()}
      stats={null}
      source={source}
      setPageNumbers={over.setPageNumbers ?? (() => {})}
      t={(k: string) => k}
      locale="en"
    />,
  )
}

/** What the store holds now, which is the thing every assertion here is about. */
const el = (i = 0) => useStudioStore.getState().doc!.spreads[0].elements[i]
const elements = () => useStudioStore.getState().doc!.spreads[0].elements

// ── Reaching the controls ──────────────────────────────────────────────────

function head(c: HTMLElement, label: string): HTMLElement {
  const found = [...c.querySelectorAll('.st-section-head')]
    .find(b => b.querySelector('.st-section-label')?.textContent === label)
  return found as HTMLElement
}

/** Half the panel starts folded, so a control inside one has to be uncovered. */
function open(c: HTMLElement, label: string) {
  const button = head(c, label)
  if (button.getAttribute('aria-expanded') === 'false') fireEvent.click(button)
}

function num(c: HTMLElement, label: string): HTMLInputElement {
  const span = [...c.querySelectorAll('.st-num-label')].find(s => s.textContent === label)
  return span!.closest('.st-num')!.querySelector('input') as HTMLInputElement
}

/** Every number field the panel is currently showing, by label. */
const numLabels = (c: HTMLElement) => [...c.querySelectorAll('.st-num-label')].map(s => s.textContent)

/** Type and leave, which is the only thing that commits a number now. */
function typeNum(c: HTMLElement, label: string, value: string) {
  const input = num(c, label)
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
}

function line(c: HTMLElement, label: string): HTMLElement {
  const found = [...c.querySelectorAll('.st-line')]
    .find(l => l.querySelector('.st-line-label')?.textContent === label)
  return found as HTMLElement
}

/** The swatch row on one named line, so fill and stroke stay told apart. */
function pickSwatch(c: HTMLElement, lineLabel: string, hex: string) {
  fireEvent.click(line(c, lineLabel).querySelector(`[aria-label="${hex}"]`)!)
}

/** One of several: a chip that reads as chosen. */
function pick(c: HTMLElement, label: string) {
  const chip = [...c.querySelectorAll('[role="radio"]')].find(b => b.textContent === label)
  fireEvent.click(chip!)
}

/** On or off: the app switch, on its own line beside the words. */
function toggle(c: HTMLElement, label: string) {
  const row = [...c.querySelectorAll('.st-switch')]
    .find(s => s.querySelector('.st-switch-label')?.textContent === label)
  fireEvent.click(row!.querySelector('button')!)
}

beforeEach(() => {
  useStudioStore.getState().load({
    version: 1, title: 'T', page: setup(), spreads: [],
  } as unknown as BookDocument)
})

// ── The head ───────────────────────────────────────────────────────────────

describe('the panel head', () => {
  it('says what is selected', () => {
    load([text()])
    const { container } = draw()
    expect(container.querySelector('.st-what')!.textContent).toContain('journey.studio.kind.text')
  })

  it('says how many, once there is more than one', () => {
    load([text(), shape()], ['t1', 's1'])
    const { container } = draw()
    const what = container.querySelector('.st-what')!.textContent!
    expect(what).toContain('journey.studio.multiple')
    expect(what).toContain('2')
  })

  it('duplicates the selection into the spread', () => {
    load([text()])
    const { container } = draw()

    fireEvent.click(container.querySelector('[aria-label="journey.studio.duplicate"]')!)

    expect(elements()).toHaveLength(2)
    // Offset, so the copy is a second thing rather than an exact overlay.
    expect(elements()[1].frame).toMatchObject({ x: 24, y: 34 })
  })

  it('locks and unlocks, and the button says which it is', () => {
    load([text()])
    const { container } = draw()

    fireEvent.click(container.querySelector('[aria-label="journey.studio.lock"]')!)
    expect(el()).toMatchObject({ locked: true })

    const unlock = container.querySelector('[aria-label="journey.studio.unlock"]')!
    expect(unlock.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(unlock)
    expect(el()).toMatchObject({ locked: false })
  })

  it('deletes the selection and nothing else', () => {
    load([text(), shape()], ['t1'])
    const { container } = draw()

    fireEvent.click(container.querySelector('[aria-label="journey.studio.delete"]')!)

    expect(elements().map(e => e.id)).toEqual(['s1'])
    expect(useStudioStore.getState().selection).toEqual([])
  })
})

// ── Text ───────────────────────────────────────────────────────────────────

describe('a text element', () => {
  it('takes the words typed into it, and stops re-reading its source', () => {
    load([text()])
    const { container } = draw()

    fireEvent.change(container.querySelector('.st-textarea')!, { target: { value: 'Bergen harbour' } })

    expect(el()).toMatchObject({ text: 'Bergen harbour', overridden: true })
  })

  it('sets the weight', () => {
    load([text()])
    const { container } = draw()
    pick(container, '600')
    expect(el()).toMatchObject({ weight: 600 })
  })

  it('sets the alignment', () => {
    load([text()])
    const { container } = draw()
    fireEvent.click(container.querySelector('[aria-label="right"]')!)
    expect(el()).toMatchObject({ align: 'right' })
  })

  /* Italic was drawn by the renderer and had no control at all before. */
  it('sets italic, and the button reflects it', () => {
    load([text()])
    const { container } = draw()

    fireEvent.click(container.querySelector('[aria-label="journey.studio.italic"]')!)

    expect(el()).toMatchObject({ italic: true })
    expect(container.querySelector('[aria-label="journey.studio.italic"]')!.getAttribute('aria-pressed'))
      .toBe('true')
  })

  it('sets the size, the leading and the tracking', () => {
    load([text()])
    const { container } = draw()

    typeNum(container, 'journey.studio.size', '18')
    typeNum(container, 'journey.studio.leading', '1.8')
    typeNum(container, 'journey.studio.tracking', '0.12')

    expect(el()).toMatchObject({ size: 18, leading: 1.8, tracking: 0.12 })
  })

  it('sets the colour', () => {
    load([text()])
    const { container } = draw()
    pickSwatch(container, 'journey.studio.text', '#9f1239')
    expect(el()).toMatchObject({ color: '#9f1239' })
  })

  it('asks nothing about notation when the text is not a point', () => {
    load([text()])
    const { container } = draw()
    expect(line(container, 'journey.studio.coordsMark')).toBeUndefined()
  })
})

describe('a text element bound to a stop', () => {
  const bound = () => text({
    text: '60 deg N, 5 deg E',
    binding: { source: 'entry.location', entryId: 7, format: 'dms' },
  })

  it('offers the two notations', () => {
    load([bound()])
    const { container } = draw()
    expect(line(container, 'journey.studio.coordsMark')).toBeDefined()
  })

  /*
   * Both halves, in one step. Rewriting only the binding leaves the old words
   * on the page until the next open, which reads as a control that does
   * nothing, and choosing a notation is not writing the text: `overridden` has
   * to stay off or the mark would stop following the journal.
   */
  it('rewrites the binding and the words together, without claiming an override', () => {
    load([bound()])
    const { container } = draw()

    pick(container, 'journey.studio.coordsDecimal')

    expect(el()).toMatchObject({
      binding: { source: 'entry.location', entryId: 7, format: 'decimal' },
      text: expect.stringContaining('60.3913° N'),
      overridden: false,
    })
  })
})

// ── Photo ──────────────────────────────────────────────────────────────────

describe('a photo frame', () => {
  it('sets the crop, the look and the frame style', () => {
    load([photo({ photoId: 12 })])
    const { container } = draw()

    pick(container, 'journey.studio.fit.contain')
    pick(container, 'journey.studio.filter.bw')
    pick(container, 'journey.studio.polaroidFrame')

    expect(el()).toMatchObject({ fit: 'contain', filter: 'bw', frameStyle: 'polaroid' })
  })

  /*
   * An empty frame has no picture to aim at, and asking for one by id produced
   * a request for /api/photos/null/thumbnail under a caption telling you to
   * drag the point around.
   */
  it('offers no focal point while the frame is empty', () => {
    load([photo({ photoId: null })])
    const { container } = draw()

    expect(container.querySelector('.st-focal')).toBeNull()
    expect(container.textContent).toContain('journey.studio.emptyFrame')
  })

  it('offers one once there is a picture in it', () => {
    load([photo({ photoId: 12 })])
    const { container } = draw()

    expect(container.querySelector('.st-focal')).not.toBeNull()
    expect(container.querySelector('.st-focal img')!.getAttribute('src'))
      .toBe('/api/photos/12/thumbnail')
  })

  /* A radius and a mask are the same idea at two resolutions, and a radius the
     renderer ignores once a shape is cut is a control that lies. */
  it('drops the corner radius once the picture is cut to a shape', () => {
    load([photo({ photoId: 12, mask: null })])
    const plain = draw()
    expect(numLabels(plain.container)).toContain('journey.studio.radius')
    plain.unmount()

    load([photo({ photoId: 12, mask: 'heart' })])
    expect(numLabels(draw().container)).not.toContain('journey.studio.radius')
  })
})

// ── Shape ──────────────────────────────────────────────────────────────────

describe('a shape', () => {
  /* Swapping rather than deleting and re-adding is the whole point of the
     grid: the thing on the page keeps where it is and what colour it is. */
  it('keeps its position and its colour when the shape is swapped', () => {
    load([shape({ shape: 'rect', fill: '#c2410c' })])
    const { container } = draw()

    fireEvent.click(container.querySelector('.st-mini-shapes [aria-label="ellipse"]')!)

    expect(el()).toMatchObject({ shape: 'ellipse', fill: '#c2410c', frame: FRAME })
  })

  it('writes the fill and the outline separately', () => {
    load([shape({ fill: '#111827', stroke: null, strokeWidth: 0 })])
    const { container } = draw()

    pickSwatch(container, 'journey.studio.fill', '#0f766e')
    expect(el()).toMatchObject({ fill: '#0f766e', stroke: null })

    pickSwatch(container, 'journey.studio.stroke', '#1e3a8a')
    // A colour with no width would draw nothing, so the line gets one.
    expect(el()).toMatchObject({ fill: '#0f766e', stroke: '#1e3a8a', strokeWidth: 0.5 })
  })

  /*
   * The rule that matters here: a shape with neither fill nor stroke is a
   * shape nobody can see or find again, so turning the fill off has to bring
   * the outline on with it.
   */
  it('cannot be turned invisible by switching the fill off', () => {
    load([shape({ fill: '#111827', stroke: null, strokeWidth: 0 })])
    const { container } = draw()

    toggle(container, 'journey.studio.fillOn')

    expect(el()).toMatchObject({ fill: null, stroke: '#141414', strokeWidth: 0.5 })
  })

  it('brings the fill back when it is switched on again', () => {
    load([shape({ fill: null, stroke: '#141414', strokeWidth: 0.5 })])
    const { container } = draw()

    toggle(container, 'journey.studio.fillOn')

    expect(el()).toMatchObject({ fill: '#111111', stroke: '#141414' })
  })

  it('fades the fill, and takes a direction once it does', () => {
    load([shape()])
    const { container } = draw()

    toggle(container, 'journey.studio.gradient')
    expect(el()).toMatchObject({ gradient: 'down' })

    pick(container, 'journey.studio.gradientUp')
    expect(el()).toMatchObject({ gradient: 'up' })
  })
})

// ── Icon ───────────────────────────────────────────────────────────────────

describe('an icon', () => {
  it('narrows the swap grid to what was searched for', () => {
    load([icon()])
    const { container } = draw()
    const all = container.querySelectorAll('.st-mini-shape').length

    fireEvent.change(container.querySelector('[aria-label="journey.studio.searchIcons"]')!, {
      target: { value: 'compass' },
    })

    const found = container.querySelectorAll('.st-mini-shape').length
    expect(found).toBeGreaterThan(0)
    expect(found).toBeLessThan(all)
    expect(container.querySelector('[aria-label="Compass"]')).not.toBeNull()
  })

  it('swaps the drawing, keeping everything else about the element', () => {
    load([icon({ name: 'Plane', color: '#9f1239' })])
    const { container } = draw()

    fireEvent.change(container.querySelector('[aria-label="journey.studio.searchIcons"]')!, {
      target: { value: 'compass' },
    })
    fireEvent.click(container.querySelector('[aria-label="Compass"]')!)

    expect(el()).toMatchObject({ name: 'Compass', color: '#9f1239', frame: FRAME })
  })

  it('sets how heavy the drawing is', () => {
    load([icon()])
    const { container } = draw()
    typeNum(container, 'journey.studio.lineWidth', '3')
    expect(el()).toMatchObject({ lineWidth: 3 })
  })
})

// ── The frame's numbers ────────────────────────────────────────────────────

describe('the position group', () => {
  it('is folded away until it is asked for', () => {
    load([shape()])
    const { container } = draw()

    expect(head(container, 'journey.studio.position').getAttribute('aria-expanded')).toBe('false')
    expect(numLabels(container)).not.toContain('journey.studio.width')

    open(container, 'journey.studio.position')
    expect(numLabels(container)).toContain('journey.studio.width')
  })

  /* One value is one undo step. It used to be one per keystroke, so typing
     "120" buried the previous state three steps down the stack. */
  it('writes a width once, when the field is left rather than while it is typed', () => {
    load([shape()])
    const { container } = draw()
    open(container, 'journey.studio.position')

    const input = num(container, 'journey.studio.width')
    fireEvent.change(input, { target: { value: '120' } })
    expect(el().frame.w).toBe(60)

    fireEvent.blur(input)
    expect(el().frame.w).toBe(120)
    expect(useStudioStore.getState().past).toHaveLength(1)
  })

  it('clamps a width below the minimum rather than taking it', () => {
    load([shape()])
    const { container } = draw()
    open(container, 'journey.studio.position')

    typeNum(container, 'journey.studio.width', '1')

    expect(el().frame.w).toBe(4)
  })

  /* An emptied field used to collapse the element to zero on the keystroke
     that emptied it, which typing the number back does not undo. */
  it('leaves the width alone when the field is emptied', () => {
    load([shape()])
    const { container } = draw()
    open(container, 'journey.studio.position')

    typeNum(container, 'journey.studio.width', '')

    expect(el().frame.w).toBe(60)
    expect(useStudioStore.getState().past).toHaveLength(0)
  })

  it('turns and fades the element from the same group', () => {
    load([shape()])
    const { container } = draw()
    open(container, 'journey.studio.position')

    typeNum(container, 'journey.studio.rotation', '15')
    typeNum(container, 'journey.studio.opacity', '40')

    expect(el()).toMatchObject({ rotation: 15, opacity: 0.4 })
  })
})

// ── Nothing selected ───────────────────────────────────────────────────────

describe('with nothing selected', () => {
  it('turns page numbers on', () => {
    load([])
    const setPageNumbers = vi.fn()
    const { container } = draw({ setPageNumbers })

    toggle(container, 'journey.studio.pageNumbers')

    expect(setPageNumbers).toHaveBeenCalledWith({ show: true })
  })

  it('sets where they sit', () => {
    load([])
    const setPageNumbers = vi.fn()
    const { container } = draw({ page: setup({ show: true }), setPageNumbers })

    pick(container, 'journey.studio.folio.inner')

    expect(setPageNumbers).toHaveBeenCalledWith({ position: 'inner' })
  })

  it('sets the first number, the size and the margin', () => {
    load([])
    const setPageNumbers = vi.fn()
    const { container } = draw({ page: setup({ show: true }), setPageNumbers })

    typeNum(container, 'journey.studio.folioStart', '12')
    typeNum(container, 'journey.studio.size', '10')
    typeNum(container, 'journey.studio.folioMargin', '20')

    expect(setPageNumbers).toHaveBeenCalledWith({ startAt: 12 })
    expect(setPageNumbers).toHaveBeenCalledWith({ size: 10 })
    expect(setPageNumbers).toHaveBeenCalledWith({ margin: 20 })
  })

  it('turns the automatic colour off, and picking one turns it off too', () => {
    load([])
    const setPageNumbers = vi.fn()
    const { container } = draw({ page: setup({ show: true }), setPageNumbers })

    toggle(container, 'journey.studio.folioAuto')
    expect(setPageNumbers).toHaveBeenCalledWith({ autoColor: false })

    pickSwatch(container, 'journey.studio.colour', '#111111')
    expect(setPageNumbers).toHaveBeenCalledWith({ color: '#111111', autoColor: false })
  })
})
