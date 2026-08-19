import type { BookElement, BookPageSetup } from '@trek/shared'

/**
 * Photo grids — a set of frames placed together, in one gesture.
 *
 * ── How this differs from a layout ────────────────────────────────────────
 *
 * A layout (`templates.ts`) rearranges the *whole spread*: it takes what is
 * already there, pours it into a new arrangement and parks the rest. A grid
 * adds a block of empty frames wherever you put it, and touches nothing else.
 * You reach for a layout when you are deciding what a page is; you reach for a
 * grid when you have decided, and want four pictures in a row on the left half.
 *
 * Canva keeps them apart for the same reason, and calling both "templates"
 * would make the difference invisible at exactly the moment it matters.
 *
 * ── Why fractions ────────────────────────────────────────────────────────
 *
 * Cells are stored as fractions of the block, so one definition serves a grid
 * dropped across a whole spread and the same grid dropped into a quarter of a
 * page. The gutter is the exception: it is a real measurement in millimetres,
 * because 2mm between two pictures is 2mm whether the block is 60mm or 300mm
 * wide — scaling the gap with the block would make small grids look glued
 * together and big ones look scattered.
 */

export interface GridCell {
  /** Fractions of the block, 0..1. */
  x: number
  y: number
  w: number
  h: number
}

export interface GridDef {
  id: string
  cells: GridCell[]
}

/** `rows` of equal cells, each row split into that many columns. */
function rows(...counts: number[]): GridCell[] {
  const h = 1 / counts.length
  const out: GridCell[] = []
  counts.forEach((cols, r) => {
    for (let c = 0; c < cols; c++) out.push({ x: c / cols, y: r * h, w: 1 / cols, h })
  })
  return out
}

/** `cols` of equal columns, each split into that many rows. */
function cols(...counts: number[]): GridCell[] {
  const w = 1 / counts.length
  const out: GridCell[] = []
  counts.forEach((n, c) => {
    for (let r = 0; r < n; r++) out.push({ x: c * w, y: r / n, w, h: 1 / n })
  })
  return out
}

/**
 * The catalogue.
 *
 * Ordered by how often a photo book actually wants them: one big picture, then
 * pairs, then the asymmetric arrangements that carry a page, then the dense
 * grids that end a chapter.
 */
export const GRIDS: GridDef[] = [
  { id: 'single', cells: [{ x: 0, y: 0, w: 1, h: 1 }] },

  { id: 'two-across', cells: rows(2) },
  { id: 'two-down', cells: cols(2) },
  { id: 'three-across', cells: rows(3) },
  { id: 'three-down', cells: cols(3) },

  // One picture carrying the block, the rest in support. The workhorse of a
  // travel page: a landscape wide enough to hold the eye, and the details
  // underneath it.
  { id: 'hero-two', cells: [
    { x: 0, y: 0, w: 1, h: 0.62 },
    { x: 0, y: 0.62, w: 0.5, h: 0.38 },
    { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
  ] },
  { id: 'hero-three', cells: [
    { x: 0, y: 0, w: 1, h: 0.64 },
    ...[0, 1, 2].map(i => ({ x: i / 3, y: 0.64, w: 1 / 3, h: 0.36 })),
  ] },
  { id: 'two-hero', cells: [
    { x: 0, y: 0, w: 0.5, h: 0.36 },
    { x: 0.5, y: 0, w: 0.5, h: 0.36 },
    { x: 0, y: 0.36, w: 1, h: 0.64 },
  ] },
  { id: 'side-hero', cells: [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ] },
  { id: 'side-hero-left', cells: [
    { x: 0, y: 0, w: 0.38, h: 0.5 },
    { x: 0, y: 0.5, w: 0.38, h: 0.5 },
    { x: 0.38, y: 0, w: 0.62, h: 1 },
  ] },
  { id: 'side-three', cells: [
    { x: 0, y: 0, w: 0.6, h: 1 },
    ...[0, 1, 2].map(i => ({ x: 0.6, y: i / 3, w: 0.4, h: 1 / 3 })),
  ] },

  { id: 'grid-4', cells: rows(2, 2) },
  { id: 'grid-6', cells: rows(3, 3) },
  { id: 'grid-9', cells: rows(3, 3, 3) },
  { id: 'grid-8', cells: rows(4, 4) },

  { id: 'one-two', cells: [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ] },
  { id: 'two-one', cells: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 1 },
  ] },
  { id: 'rows-1-2', cells: [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ] },
  { id: 'rows-2-1', cells: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 },
  ] },
  { id: 'rows-2-3', cells: [...rows(2).map(c => ({ ...c, h: 0.52 })),
    ...[0, 1, 2].map(i => ({ x: i / 3, y: 0.52, w: 1 / 3, h: 0.48 }))] },
  { id: 'rows-3-2', cells: [...[0, 1, 2].map(i => ({ x: i / 3, y: 0, w: 1 / 3, h: 0.48 })),
    ...rows(2).map(c => ({ ...c, y: 0.48, h: 0.52 }))] },

  { id: 'cols-1-2', cells: cols(1, 2) },
  { id: 'cols-2-1', cells: cols(2, 1) },
  { id: 'cols-2-1-2', cells: cols(2, 1, 2) },
  { id: 'cols-1-2-1', cells: cols(1, 2, 1) },

  // A band across the middle: three pictures at the same height with room above
  // and below for words. The arrangement a chapter opener usually wants.
  { id: 'band-three', cells: [0, 1, 2].map(i => ({ x: i / 3, y: 0.26, w: 1 / 3, h: 0.48 })) },
  { id: 'band-four', cells: [0, 1, 2, 3].map(i => ({ x: i / 4, y: 0.3, w: 0.25, h: 0.4 })) },

  // Staggered: alternate cells drop by a fraction of their height, which is what
  // stops a row of four squares reading as a contact sheet.
  { id: 'stagger-four', cells: [0, 1, 2, 3].map(i => ({
    x: i / 4, y: i % 2 ? 0.14 : 0, w: 0.25, h: 0.86,
  })) },
  { id: 'stagger-three', cells: [0, 1, 2].map(i => ({
    x: i / 3, y: i === 1 ? 0.16 : 0, w: 1 / 3, h: 0.84,
  })) },

  { id: 'filmstrip', cells: [0, 1, 2, 3, 4].map(i => ({ x: i / 5, y: 0.32, w: 0.2, h: 0.36 })) },
  { id: 'grid-12', cells: rows(4, 4, 4) },
]

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

/**
 * Turn a grid into elements, inside a box on the page.
 *
 * The gutter is taken out of each cell rather than added between them, so the
 * block occupies exactly the box it was given — a grid asked to fill the safe
 * area fills the safe area, instead of overhanging it by one gutter.
 */
export function gridElements(
  grid: GridDef,
  box: { x: number; y: number; w: number; h: number },
  gutter = 3,
  radius = 0,
): BookElement[] {
  const half = gutter / 2
  return grid.cells.map(cell => {
    const x = box.x + cell.x * box.w
    const y = box.y + cell.y * box.h
    const w = cell.w * box.w
    const h = cell.h * box.h
    // Only interior edges get half a gutter; the block's outer edge is the box.
    const left = cell.x > 0.001 ? half : 0
    const top = cell.y > 0.001 ? half : 0
    const right = cell.x + cell.w < 0.999 ? half : 0
    const bottom = cell.y + cell.h < 0.999 ? half : 0
    return {
      id: uid('p'),
      kind: 'photo',
      frame: {
        x: x + left,
        y: y + top,
        w: Math.max(2, w - left - right),
        h: Math.max(2, h - top - bottom),
      },
      rotation: 0,
      opacity: 1,
      locked: false,
      photoId: null,
      fit: 'cover',
      focalX: 0.5,
      focalY: 0.5,
      radius,
      filter: 'none',
      mask: null,
      frameStyle: 'none',
    } as BookElement
  })
}

/**
 * The box a grid lands in when it is simply clicked rather than placed.
 *
 * The safe area of the page you are looking at, which is almost always what was
 * meant — a grid that lands half in the gutter has to be dragged before it is
 * any use.
 */
export function defaultGridBox(page: BookPageSetup, single: boolean): { x: number; y: number; w: number; h: number } {
  const W = single ? page.pageWidth : page.pageWidth * 2
  const margin = Math.max(page.safe, Math.min(W, page.pageHeight) * 0.075)
  return {
    x: margin,
    y: margin,
    w: W - margin * 2,
    h: page.pageHeight - margin * 2,
  }
}
