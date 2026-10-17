import type { BookElement, BookLayout, BookPageSetup, BookSpread } from '@trek/shared'
import { MAX_SPREAD_ELEMENTS } from '@trek/shared'
import { elementId } from './bookIds'

/**
 * A book's own layouts (#2316): a page somebody arranged, kept to lay other
 * pages out the same way.
 *
 * The built-in layouts in templates.ts are frames only. A saved one is the whole
 * design, panels and shapes and type included, with the pictures taken out; the
 * page it is applied to brings its own.
 */

/** Which saved layouts fit a spread: a double spread's design does not fit a single page. */
export const layoutRole = (spread: BookSpread): BookLayout['role'] => (spread.role === 'inner' ? 'inner' : 'single')

/** The arrangement of a spread, as a layout to keep. */
export function layoutFromSpread(spread: BookSpread, page: BookPageSetup, name: string): BookLayout {
  return {
    id: elementId('ly'),
    name,
    role: layoutRole(spread),
    pageWidth: page.pageWidth,
    pageHeight: page.pageHeight,
    background: spread.background,
    // The design, not the pictures: every frame comes out empty.
    elements: spread.elements.map(el => (el.kind === 'photo' ? { ...el, photoId: null } : el)),
  }
}

/** The next free "Layout n" name, so a save needs no dialog. */
export function nextLayoutName(existing: readonly BookLayout[], base: string): string {
  const taken = new Set(existing.map(l => l.name))
  let n = existing.length + 1
  while (taken.has(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}

const textSize = (el: BookElement) => (el.kind === 'text' ? el.size : 0)

/**
 * Lay a spread out on a saved layout, keeping what the spread holds.
 *
 * The same contract as applying a built-in layout: the spread's pictures go into
 * the layout's frames in order, its words into the layout's text boxes (the
 * largest into the largest, so the title stays the title), and whatever does not
 * fit is parked rather than lost. The layout's own type keeps its look and takes
 * the spread's words; a text box that was filled from a journal entry and finds
 * nothing to take is left out, because its words belonged to the page it was
 * saved from. The small marks and the pros and cons list are content too: each
 * takes the values of the spread's own mark of the same kind, in order (the
 * spread's day, its coordinates), and keeps the layout's look. Everything else
 * is the design and is copied as drawn, scaled from the page it was drawn on to
 * this one.
 */
export function applySavedLayout(spread: BookSpread, layout: BookLayout, page: BookPageSetup): BookSpread {
  const sx = page.pageWidth / layout.pageWidth
  const sy = page.pageHeight / layout.pageHeight
  const pool = [...spread.elements, ...(spread.parked ?? [])]
  const photos = pool.filter(e => e.kind === 'photo' && e.photoId != null)
  const texts = pool.filter(e => e.kind === 'text' && e.text.trim()).sort((a, b) => textSize(b) - textSize(a))

  // Which of the layout's text boxes takes which of the spread's words.
  const slots = layout.elements.filter(e => e.kind === 'text').sort((a, b) => textSize(b) - textSize(a))
  const wordsFor = new Map<BookElement, BookElement>()
  slots.forEach((slot, i) => { if (texts[i]) wordsFor.set(slot, texts[i]) })

  // The spread's own marks and lists, queued per kind, for the layout's to take their values from.
  const marks = new Map<string, BookElement[]>()
  for (const el of spread.elements) {
    const key = el.kind === 'badge' ? `badge:${el.variant}` : el.kind === 'list' ? 'list' : null
    if (key) marks.set(key, [...(marks.get(key) ?? []), el])
  }
  const takeMark = (key: string) => marks.get(key)?.shift()

  let pi = 0
  const out: BookElement[] = []
  for (const el of layout.elements) {
    const frame = { x: el.frame.x * sx, y: el.frame.y * sy, w: el.frame.w * sx, h: el.frame.h * sy }
    const base = { ...el, id: elementId(el.kind[0]), frame } as BookElement
    if (base.kind === 'photo') {
      const src = photos[pi++]
      out.push(src && src.kind === 'photo'
        ? { ...base, photoId: src.photoId, focalX: src.focalX, focalY: src.focalY }
        : base)
      continue
    }
    if (base.kind === 'text' && el.kind === 'text') {
      const src = wordsFor.get(el)
      if (src && src.kind === 'text') {
        out.push({ ...base, text: src.text, binding: src.binding, overridden: src.overridden })
      } else if (!el.binding) {
        out.push(base)
      }
      continue
    }
    if (base.kind === 'badge') {
      const own = takeMark(`badge:${base.variant}`)
      out.push(own && own.kind === 'badge' ? { ...base, text: own.text, sub: own.sub, code: own.code } : base)
      continue
    }
    if (base.kind === 'list') {
      const own = takeMark('list')
      out.push(own && own.kind === 'list' ? { ...base, items: own.items } : base)
      continue
    }
    out.push(base)
  }

  const used = new Set(wordsFor.values())
  const parked = [
    ...photos.slice(pi),
    ...texts.filter(t => !used.has(t)),
  ].slice(0, MAX_SPREAD_ELEMENTS)

  return { ...spread, background: layout.background, elements: out, parked }
}

/** A saved layout drawn as a spread on this book's page, for its card. Nothing is filled in. */
export function layoutPreview(layout: BookLayout, page: BookPageSetup): BookSpread {
  const sx = page.pageWidth / layout.pageWidth
  const sy = page.pageHeight / layout.pageHeight
  return {
    id: layout.id,
    role: layout.role === 'inner' ? 'inner' : 'first',
    background: layout.background,
    elements: layout.elements.map(el => ({ ...el, frame: { x: el.frame.x * sx, y: el.frame.y * sy, w: el.frame.w * sx, h: el.frame.h * sy } }) as BookElement),
    parked: [],
    entryId: null,
  }
}
