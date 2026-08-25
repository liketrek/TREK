import type { BookElement, BookSpread } from '@trek/shared'

/**
 * What colour a page number has to be to be readable.
 *
 * ── Why this is not one setting ──────────────────────────────────────────
 *
 * A book has dark pages and light ones, often on the same spread. One fixed
 * folio colour is therefore wrong on half of them: the warm grey that reads
 * beautifully on paper vanishes into a full-bleed night photograph, and white
 * vanishes the moment the next page is white too. You end up either setting the
 * colour per spread, which the document has no place for, or accepting that
 * some numbers cannot be read.
 *
 * ── How it decides ───────────────────────────────────────────────────────
 *
 * By asking what is actually under the number. The renderer knows every element
 * and where it sits, so it walks them from the top down and takes the first one
 * that covers the spot:
 *
 * - a shape or a panel: its own fill, whose brightness is arithmetic
 * - a photograph: unknowable without decoding it, and a photograph is dark far
 *   more often than not once it has been printed. White, with a whisper of a
 *   shadow, is the answer that works on all of them
 * - nothing: the page colour
 *
 * It is a heuristic and it is meant to be — the alternative is sampling pixels
 * from an image that may not have loaded, in a renderer that also has to run
 * for print. Anyone it gets wrong can still set the colour by hand, which turns
 * it off.
 */

/** Ink for a light page, and its opposite. Never pure black on paper. */
const DARK_INK = '#3f3a33'
const LIGHT_INK = '#ffffff'

export interface FolioInk {
  color: string
  /**
   * A shadow, only over a photograph.
   *
   * White on an unknown picture is a coin toss on the pale ones, and a hairline
   * of shadow costs nothing and settles it.
   */
  shadow?: string
}

/** Perceived brightness, 0..1. Rec. 601 weights — good enough to pick an ink. */
export function brightness(hex: string): number {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const n = Number.parseInt(full.slice(0, 6), 16)
  if (!Number.isFinite(n)) return 1
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255
}

/** Whether a point in spread coordinates falls inside an element's frame. */
function covers(el: BookElement, x: number, y: number): boolean {
  const f = el.frame
  return x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h
}

/**
 * The ink for a folio at this point on the spread.
 *
 * Elements are walked from last to first, because the document's array order is
 * paint order: the last one drawn is the one you see.
 */
export function folioInk(spread: BookSpread, x: number, y: number): FolioInk {
  for (let i = spread.elements.length - 1; i >= 0; i--) {
    const el = spread.elements[i]
    if (el.opacity < 0.35 || !covers(el, x, y)) continue

    if (el.kind === 'photo') {
      return { color: LIGHT_INK, shadow: '0 0.3mm 0.6mm rgba(0,0,0,0.45)' }
    }
    if (el.kind === 'shape') {
      // A shape with no fill is not what is under the number — whatever is
      // behind it is, so keep looking.
      if (!el.fill || el.fill === 'transparent') continue
      return { color: brightness(el.fill) > 0.55 ? DARK_INK : LIGHT_INK }
    }
    // Text and the travel elements draw type on nothing, so they do not decide
    // the background; the page underneath still does.
  }

  const paper = spread.background ?? '#ffffff'
  return { color: brightness(paper) > 0.55 ? DARK_INK : LIGHT_INK }
}
