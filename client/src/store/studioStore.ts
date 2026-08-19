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
  /**
   * Turn one element, in degrees.
   *
   * `apply`, not `commit`, for the same reason setFrame is: a drag is one undo
   * step, and the gesture that drives this calls it on every pointer move.
   */
  setRotation: (spreadIndex: number, id: string, rotation: number) => void
  addElement: (spreadIndex: number, el: BookElement) => void
  removeElements: (spreadIndex: number, ids: string[]) => void
  duplicate: (spreadIndex: number, ids: string[]) => void
  raise: (spreadIndex: number, id: string, to: 'front' | 'back' | 'up' | 'down') => void

  /** Insert an empty spread after `index`, and select it. */
  addSpread: (index: number) => void
  /**
   * Put a spread that already has contents into the book after `index`.
   *
   * Separate from addSpread because the thing being inserted comes from
   * outside the document — an imported file — and arrives complete. Fresh ids
   * are minted here rather than trusted from the file: two elements sharing an
   * id would confuse selection and every lookup after it.
   */
  insertSpread: (index: number, spread: BookSpread) => void
  /** Copy a spread, contents and all, directly after it. */
  duplicateSpread: (index: number) => void
  removeSpread: (index: number) => void
  /** Move a spread one place towards the front or the back of the book. */
  moveSpread: (index: number, dir: -1 | 1) => void
  /** Whether a spread may be moved, deleted or duplicated at all. */
  canEditSpread: (index: number) => boolean

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

  setRotation: (spreadIndex, id, rotation) => get().apply(doc =>
    replaceSpread(doc, spreadIndex, sp => ({
      ...sp,
      elements: sp.elements.map(e => (e.id === id ? { ...e, rotation } : e)),
    }))),

  addElement: (spreadIndex, el) => {
    get().commit(doc =>
      replaceSpread(doc, spreadIndex, sp => ({ ...sp, elements: [...sp.elements, el] })))
    /*
     * Selected on arrival.
     *
     * Everything you would want to do next is in the inspector, and the
     * inspector shows the selection: placing a day counter and then hunting for
     * it on the page to click it before its settings appear is a step nobody
     * asked for. Duplicating already worked this way; placing did not.
     */
    set({ selection: [el.id] })
  },

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

  /*
   * ── Spread management ────────────────────────────────────────────────
   *
   * The cover and the back cover are fixed points: a book has exactly one of
   * each, they are single pages rather than spreads, and the layouts panel
   * already refuses to touch them. So everything here operates on the inner
   * spreads between them, and `canEditSpread` is the one place that decides
   * what counts as inner — the rail, the menu and the store all ask it rather
   * than each testing `role` for themselves.
   */
  canEditSpread: index => {
    const sp = get().doc?.spreads[index]
    return !!sp && sp.role === 'inner'
  },

  addSpread: index => {
    const doc = get().doc
    if (!doc) return
    /*
     * After the given spread, and inside the covers at both ends.
     *
     * The lower bound is not decoration: a book with no inner spreads yet
     * reports its last inner one as -1, which asked for a page at 0 — in front
     * of the cover, where it could not be moved back from either, because a
     * move only ever swaps with another inner spread. The first page of an
     * empty book is the one this catches.
     */
    const cover = doc.spreads.findIndex(sp => sp.role === 'cover')
    const back = doc.spreads.findIndex(sp => sp.role === 'back')
    const first = cover === -1 ? 0 : cover + 1
    const limit = back === -1 ? doc.spreads.length : back
    const at = Math.min(Math.max(index + 1, first), limit)
    get().commit(d => ({
      ...d,
      spreads: [
        ...d.spreads.slice(0, at),
        {
          id: `sp-${Math.random().toString(36).slice(2, 9)}`,
          role: 'inner' as const,
          background: null,
          elements: [],
          parked: [],
          entryId: null,
        },
        ...d.spreads.slice(at),
      ],
    }))
    set({ activeSpread: at, selection: [] })
  },

  insertSpread: (index, spread) => {
    const doc = get().doc
    if (!doc) return
    // Same bounds as addSpread: inside the covers at both ends.
    const cover = doc.spreads.findIndex(sp => sp.role === 'cover')
    const back = doc.spreads.findIndex(sp => sp.role === 'back')
    const first = cover === -1 ? 0 : cover + 1
    const limit = back === -1 ? doc.spreads.length : back
    const at = Math.min(Math.max(index + 1, first), limit)
    get().commit(d => ({
      ...d,
      spreads: [
        ...d.spreads.slice(0, at),
        {
          ...spread,
          id: `sp-${Math.random().toString(36).slice(2, 9)}`,
          role: 'inner' as const,
          elements: spread.elements.map(e => ({ ...e, id: `${e.kind[0]}-${Math.random().toString(36).slice(2, 9)}` })),
        },
        ...d.spreads.slice(at),
      ],
    }))
    set({ activeSpread: at, selection: [] })
  },

  duplicateSpread: index => {
    const doc = get().doc
    if (!doc || !get().canEditSpread(index)) return
    const source = doc.spreads[index]
    const at = index + 1
    get().commit(d => ({
      ...d,
      spreads: [
        ...d.spreads.slice(0, at),
        {
          ...source,
          id: `sp-${Math.random().toString(36).slice(2, 9)}`,
          // Fresh ids throughout: two elements sharing one id would confuse
          // selection and every lookup that follows it.
          elements: source.elements.map(e => ({ ...e, id: `${e.kind[0]}-${Math.random().toString(36).slice(2, 9)}` })),
          parked: source.parked.map(e => ({ ...e, id: `${e.kind[0]}-${Math.random().toString(36).slice(2, 9)}` })),
        },
        ...d.spreads.slice(at),
      ],
    }))
    set({ activeSpread: at, selection: [] })
  },

  removeSpread: index => {
    const doc = get().doc
    if (!doc || !get().canEditSpread(index)) return
    get().commit(d => ({ ...d, spreads: d.spreads.filter((_, i) => i !== index) }))
    // Land on the spread that took its place, or the one before it if the
    // deleted spread was the last inner one.
    const next = get().doc?.spreads ?? []
    set({ activeSpread: Math.min(index, Math.max(0, next.length - 1)), selection: [] })
  },

  moveSpread: (index, dir) => {
    const doc = get().doc
    if (!doc || !get().canEditSpread(index)) return
    const target = index + dir
    // Only ever swaps with another inner spread, so the cover and back cover
    // keep their places without needing to be special-cased anywhere else.
    if (!get().canEditSpread(target)) return
    get().commit(d => {
      const spreads = d.spreads.slice()
      const [moved] = spreads.splice(index, 1)
      spreads.splice(target, 0, moved)
      return { ...d, spreads }
    })
    set({ activeSpread: target, selection: [] })
  },

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
