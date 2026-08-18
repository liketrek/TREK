import { create } from 'zustand'
import type { BookDocument, BookElement, BookFrame, BookSpread } from '@trek/shared'

/**
 * The book being edited.
 *
 * History is snapshot-based rather than patch-based, and deliberately so: a
 * document is a few hundred kilobytes of plain JSON at most (the schema caps it
 * at 150 spreads of 60 elements), and a snapshot stack that cannot possibly
 * disagree with the document beats a patch stack that can. It is capped so a
 * long session does not grow without limit.
 *
 * Granularity is the part that matters for how it *feels*: a drag is one undo
 * step, not four hundred. Callers open a gesture before the first move and close
 * it on release; only that pair touches the stack.
 */

const HISTORY_LIMIT = 60

interface StudioState {
  doc: BookDocument | null
  selection: string[]
  activeSpread: number
  past: BookDocument[]
  future: BookDocument[]
  /** The document as it was when the current gesture started. */
  gestureBase: BookDocument | null

  load: (doc: BookDocument) => void
  setActiveSpread: (i: number) => void
  select: (ids: string[]) => void
  toggleSelect: (id: string, additive: boolean) => void

  beginGesture: () => void
  endGesture: () => void
  /** A single change that is its own undo step. */
  commit: (fn: (doc: BookDocument) => BookDocument) => void
  /** A change inside an open gesture — does not touch the stack by itself. */
  apply: (fn: (doc: BookDocument) => BookDocument) => void

  updateElement: (spreadIndex: number, id: string, patch: Partial<BookElement>) => void
  setFrame: (spreadIndex: number, id: string, frame: BookFrame) => void
  addElement: (spreadIndex: number, el: BookElement) => void
  removeElements: (spreadIndex: number, ids: string[]) => void
  duplicate: (spreadIndex: number, ids: string[]) => void
  raise: (spreadIndex: number, id: string, to: 'front' | 'back' | 'up' | 'down') => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

function replaceSpread(doc: BookDocument, index: number, fn: (s: BookSpread) => BookSpread): BookDocument {
  const spreads = doc.spreads.slice()
  if (!spreads[index]) return doc
  spreads[index] = fn(spreads[index])
  return { ...doc, spreads }
}

export const useStudioStore = create<StudioState>((set, get) => ({
  doc: null,
  selection: [],
  activeSpread: 0,
  past: [],
  future: [],
  gestureBase: null,

  load: doc => set({ doc, selection: [], activeSpread: 0, past: [], future: [], gestureBase: null }),
  setActiveSpread: i => set({ activeSpread: i, selection: [] }),
  select: ids => set({ selection: ids }),
  toggleSelect: (id, additive) => set(s => {
    if (!additive) return { selection: [id] }
    return { selection: s.selection.includes(id) ? s.selection.filter(x => x !== id) : [...s.selection, id] }
  }),

  beginGesture: () => set(s => ({ gestureBase: s.doc })),
  endGesture: () => set(s => {
    // Nothing actually changed — a click that missed, a drag of zero pixels.
    if (!s.gestureBase || s.gestureBase === s.doc) return { gestureBase: null }
    return {
      past: [...s.past, s.gestureBase].slice(-HISTORY_LIMIT),
      future: [],
      gestureBase: null,
    }
  }),

  commit: fn => set(s => {
    if (!s.doc) return {}
    const next = fn(s.doc)
    if (next === s.doc) return {}
    return { doc: next, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [] }
  }),

  apply: fn => set(s => (s.doc ? { doc: fn(s.doc) } : {})),

  updateElement: (spreadIndex, id, patch) => get().apply(doc =>
    replaceSpread(doc, spreadIndex, sp => ({
      ...sp,
      elements: sp.elements.map(e => (e.id === id ? ({ ...e, ...patch } as BookElement) : e)),
    }))),

  setFrame: (spreadIndex, id, frame) => get().apply(doc =>
    replaceSpread(doc, spreadIndex, sp => ({
      ...sp,
      elements: sp.elements.map(e => (e.id === id ? { ...e, frame } : e)),
    }))),

  addElement: (spreadIndex, el) => get().commit(doc =>
    replaceSpread(doc, spreadIndex, sp => ({ ...sp, elements: [...sp.elements, el] }))),

  removeElements: (spreadIndex, ids) => {
    get().commit(doc => replaceSpread(doc, spreadIndex, sp => ({
      ...sp,
      elements: sp.elements.filter(e => !ids.includes(e.id)),
    })))
    set({ selection: [] })
  },

  duplicate: (spreadIndex, ids) => {
    // Offset the copy so it is visibly a second thing rather than an exact
    // overlay you cannot tell apart from the original.
    const OFFSET = 4
    const made: string[] = []
    get().commit(doc => replaceSpread(doc, spreadIndex, sp => {
      const copies = sp.elements
        .filter(e => ids.includes(e.id))
        .map(e => {
          const id = `${e.kind[0]}-${Math.random().toString(36).slice(2, 9)}`
          made.push(id)
          return { ...e, id, frame: { ...e.frame, x: e.frame.x + OFFSET, y: e.frame.y + OFFSET } }
        })
      return { ...sp, elements: [...sp.elements, ...copies] }
    }))
    if (made.length) set({ selection: made })
  },

  raise: (spreadIndex, id, to) => get().commit(doc =>
    replaceSpread(doc, spreadIndex, sp => {
      const i = sp.elements.findIndex(e => e.id === id)
      if (i < 0) return sp
      const els = sp.elements.slice()
      const [el] = els.splice(i, 1)
      const at = to === 'front' ? els.length
        : to === 'back' ? 0
        : to === 'up' ? Math.min(els.length, i + 1)
        : Math.max(0, i - 1)
      els.splice(at, 0, el)
      return { ...sp, elements: els }
    })),

  undo: () => set(s => {
    const prev = s.past[s.past.length - 1]
    if (!prev || !s.doc) return {}
    return { doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future].slice(0, HISTORY_LIMIT), selection: [] }
  }),

  redo: () => set(s => {
    const next = s.future[0]
    if (!next || !s.doc) return {}
    return { doc: next, future: s.future.slice(1), past: [...s.past, s.doc].slice(-HISTORY_LIMIT), selection: [] }
  }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}))
