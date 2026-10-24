import { create } from 'zustand'
import type { BookAlignTo, BookDocument, BookElement, BookFrame, BookLayout, BookSpread } from '@trek/shared'
import {
  MAX_BOOK_LAYOUTS, MAX_SPREAD_ELEMENTS, applySavedBookLayout as applySavedLayout,
  bookLayoutFromSpread as layoutFromSpread, canEditSpread as isMovableSpread, fitBookTexts, innerSpreadBounds as innerBounds,
  layoutAroundLocks, withThemeLinks,
} from '@trek/shared'
import { pastedElements, type StudioClipboard } from '../components/Studio/studioClipboard'
import { regroupCopies, tidyGroups, withCopies, bookElementId } from '@trek/shared'
import { studioLayerActions, type StudioLayerActions } from './studioLayers'

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

interface StudioState extends StudioLayerActions {
  doc: BookDocument | null
  selection: string[]
  activeSpread: number
  past: BookDocument[]
  future: BookDocument[]
  /** The document as it was when the current gesture started. */
  gestureBase: BookDocument | null
  /** Elements copied for pasting onto any page of the book (#2316). Kept across page switches. */
  clipboard: StudioClipboard | null
  /**
   * Counts the times something was not added because the page already holds
   * MAX_SPREAD_ELEMENTS. The Studio says so once per count (StudioNotices), so
   * a full page no longer swallows a click without a word.
   */
  refusedFull: number
  /** Notes that an addition was refused because the page is full. */
  refuseFull: () => void
  /**
   * What the arrange section lines things up with, as last picked: kept for the
   * session, so a new selection or another kind of element does not reset it.
   * Null until somebody picks; the section then chooses by how much is selected.
   */
  alignTo: BookAlignTo | null
  setAlignTo: (to: BookAlignTo) => void
  /**
   * The page a chat card points at, outlined in the page rail (journey-studio.md
   * 4.2). Not part of the book or its history; opening a book clears it.
   */
  hintSpread: string | null
  /**
   * Whether the open book is held as it is. True for a book a newer Studio
   * saved (useBookStore's `newer`): this build has already dropped what
   * it cannot read from its copy, so every edit, undo and redo is refused
   * rather than shown as work that can never be saved. Loading and taking a
   * remote version still work, so the page stays current while it is shown.
   */
  readOnly: boolean
  setReadOnly: (readOnly: boolean) => void

  load: (doc: BookDocument) => void
  /**
   * Take a version saved somewhere else (another editor, the assistant) into
   * the open book without throwing the user out of it.
   *
   * `load` is for opening: back to the cover, history gone. Here the page stays
   * the one the user was on (found by its spread id, wherever it moved to),
   * what is still on that page stays selected, and the document it replaces
   * becomes an undo step, so Ctrl+Z takes an assistant's change back.
   *
   * `undoable: false` is for a save by somebody else: the page and selection
   * stay, but the history goes, as with `load`. Otherwise their whole save would
   * sit one Ctrl+Z away, and undoing what the user took for their own last step
   * would quietly write the older book over another person's work.
   */
  adoptRemote: (doc: BookDocument, opts?: { undoable?: boolean }) => void
  setActiveSpread: (i: number) => void
  setHintSpread: (spreadId: string | null) => void
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
  /** One element onto a page, selected; false, and nothing changed, when the page holds all it can. */
  addElement: (spreadIndex: number, el: BookElement) => boolean
  removeElements: (spreadIndex: number, ids: string[]) => void
  /** Copy elements of a spread to the clipboard (#2316). */
  copy: (spreadIndex: number, ids: string[]) => void
  /** Put the clipboard onto a spread, as one undo step, and select what arrived. */
  paste: (spreadIndex: number) => void

  /** Keep a spread's arrangement as one of the book's layouts (#2316). Returns false when the book is full. */
  saveLayout: (spreadIndex: number, name: string) => boolean
  removeLayout: (id: string) => void
  /** Lay a spread out on a saved layout, keeping its pictures and words. */
  applyLayout: (spreadIndex: number, id: string) => void

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

// Where an inner spread may go (`innerBounds`) and which spreads may move at
// all (`isMovableSpread`) are shared with the server's book tools
// (shared/src/book/book-pages.ts), so the assistant keeps the same pages fixed.

function replaceSpread(doc: BookDocument, index: number, fn: (s: BookSpread) => BookSpread): BookDocument {
  const spreads = doc.spreads.slice()
  if (!spreads[index]) return doc
  spreads[index] = fn(spreads[index])
  return { ...doc, spreads }
}

export const useStudioStore = create<StudioState>((set, get) => ({
  // Groups, layers, align, nudge, duplicate and paste style: studioLayers.ts.
  ...studioLayerActions(set, get),
  doc: null,
  selection: [],
  activeSpread: 0,
  past: [],
  future: [],
  gestureBase: null,
  clipboard: null,
  refusedFull: 0,
  refuseFull: () => set(st => ({ refusedFull: st.refusedFull + 1 })),
  alignTo: null,
  setAlignTo: to => set({ alignTo: to }),
  hintSpread: null,
  readOnly: false,

  setReadOnly: readOnly => set({ readOnly, gestureBase: null }),
  load: doc => set({ doc, selection: [], enteredGroup: null, activeSpread: 0, past: [], future: [], gestureBase: null, hintSpread: null }),
  adoptRemote: (doc, opts) => set(s => {
    if (!s.doc) return { doc, selection: [], activeSpread: 0, past: [], future: [], gestureBase: null }
    if (doc === s.doc) return {}
    const spreadId = s.doc.spreads[s.activeSpread]?.id
    const found = spreadId ? doc.spreads.findIndex(sp => sp.id === spreadId) : -1
    // A page that is gone (deleted elsewhere) leaves the user where it was, or on the last page.
    const activeSpread = found >= 0 ? found : Math.max(0, Math.min(s.activeSpread, doc.spreads.length - 1))
    const onPage = new Set((doc.spreads[activeSpread]?.elements ?? []).map(e => e.id))
    // A gesture that has already moved is replaced half done, so the step to go
    // back to is where it started, not the half-finished frame.
    const replaced = s.gestureBase ?? s.doc
    return {
      doc,
      activeSpread,
      selection: found >= 0 ? s.selection.filter(id => onPage.has(id)) : [],
      enteredGroup: found >= 0 ? s.enteredGroup : null,
      past: opts?.undoable === false ? [] : [...s.past, replaced].slice(-HISTORY_LIMIT),
      // A new branch: redoing what was undone before this arrived would write over it.
      future: [],
      // An open gesture carries on from the new document, so closing it records
      // that, not the old one a second time.
      gestureBase: s.gestureBase ? doc : null,
    }
  }),
  setActiveSpread: i => set({ activeSpread: i, selection: [], enteredGroup: null }),
  setHintSpread: spreadId => set({ hintSpread: spreadId }),
  // Nothing selected is outside every group too.
  select: ids => set(ids.length ? { selection: ids } : { selection: ids, enteredGroup: null }),
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

  // A text set to fit its frame is solved after every change (book-text-fit.ts in shared).
  commit: fn => set(s => {
    if (!s.doc || s.readOnly) return {}
    const next = fitBookTexts(fn(s.doc), s.doc)
    if (next === s.doc) return {}
    return { doc: next, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [] }
  }),

  apply: fn => set(s => (s.doc && !s.readOnly ? { doc: fitBookTexts(fn(s.doc), s.doc) } : {})),

  // A colour or face set by hand stops following the theme; a link set here takes the theme's value.
  updateElement: (spreadIndex, id, patch) => get().apply(doc =>
    replaceSpread(doc, spreadIndex, sp => ({
      ...sp,
      elements: sp.elements.map(e => (e.id === id ? withThemeLinks({ ...e, ...patch } as BookElement, patch, doc.theme) : e)),
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
    // The page's own cap, as paste and duplicate keep it: what would make the book unsaveable is not added.
    const target = get().doc?.spreads[spreadIndex]
    if (!target) return false
    if (target.elements.length >= MAX_SPREAD_ELEMENTS) {
      get().refuseFull()
      return false
    }
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
    return true
  },

  removeElements: (spreadIndex, ids) => {
    // A group left with one member is no group any more.
    get().commit(doc => replaceSpread(doc, spreadIndex, sp => tidyGroups({
      ...sp,
      elements: sp.elements.filter(e => !ids.includes(e.id)),
    })))
    set({ selection: [], enteredGroup: null })
  },

  copy: (spreadIndex, ids) => {
    const sp = get().doc?.spreads[spreadIndex]
    if (!sp) return
    const elements = sp.elements.filter(e => ids.includes(e.id))
    if (elements.length) set({ clipboard: { fromSpreadId: sp.id, elements } })
  },

  paste: spreadIndex => {
    const { clipboard, doc } = get()
    const target = doc?.spreads[spreadIndex]
    if (!clipboard || !doc || !target) return
    // The spread's own cap: a paste that would push it past what the contract
    // accepts takes what fits rather than making the book unsaveable.
    const room = Math.max(0, MAX_SPREAD_ELEMENTS - target.elements.length)
    const source = doc.spreads.find(sp => sp.id === clipboard.fromSpreadId)
    // A copied group arrives as a group of its own, never as part of one already on the page.
    if (room === 0) {
      get().refuseFull()
      return
    }
    const copies = regroupCopies(pastedElements(clipboard, target, doc.page).slice(0, room), source, bookElementId)
    if (!copies.elements.length) return
    get().commit(d => replaceSpread(d, spreadIndex, sp => withCopies(sp, copies)))
    set({ selection: copies.elements.map(e => e.id), enteredGroup: null })
  },

  saveLayout: (spreadIndex, name) => {
    const doc = get().doc
    const sp = doc?.spreads[spreadIndex]
    if (!doc || !sp || !sp.elements.length) return false
    if ((doc.layouts ?? []).length >= MAX_BOOK_LAYOUTS) return false
    const layout: BookLayout = layoutFromSpread(sp, doc.page, name)
    get().commit(d => ({ ...d, layouts: [...(d.layouts ?? []), layout] }))
    return true
  },

  removeLayout: id => get().commit(d => ({ ...d, layouts: (d.layouts ?? []).filter(l => l.id !== id) })),

  applyLayout: (spreadIndex, id) => {
    const layout = get().doc?.layouts?.find(l => l.id === id)
    if (!layout) return
    // What is locked stays where it is, as the assistant's layout leaves it; a page it would overfill stays.
    get().commit(d => {
      const sp = d.spreads[spreadIndex]
      const laid = sp ? layoutAroundLocks(sp, free => applySavedLayout(free, layout, d.page)) : null
      return laid ? replaceSpread(d, spreadIndex, () => laid) : d
    })
    set({ selection: [] })
  },

  /*
   * ── Spread management ────────────────────────────────────────────────
   *
   * The cover and the back cover are fixed points: a book has exactly one of
   * each, they are single pages rather than spreads, and the layouts panel
   * already refuses to touch them. The single first and last pages inside
   * them are fixed the same way (#2317): a bound book opens onto one
   * right-hand page and closes on one left-hand page, and moving either into
   * the middle of the book would put a half-width page between two spreads.
   * So everything here operates on the inner spreads between them, and
   * `canEditSpread` is the one place that decides what counts as inner — the
   * rail, the menu and the store all ask it rather than each testing `role`
   * for themselves.
   */
  canEditSpread: index => isMovableSpread(get().doc?.spreads[index]),

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
    const { first, limit } = innerBounds(doc.spreads)
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
    const { first, limit } = innerBounds(doc.spreads)
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
    if (!prev || !s.doc || s.readOnly) return {}
    return { doc: prev, past: s.past.slice(0, -1), future: [s.doc, ...s.future].slice(0, HISTORY_LIMIT), selection: [], enteredGroup: null }
  }),

  redo: () => set(s => {
    const next = s.future[0]
    if (!next || !s.doc || s.readOnly) return {}
    return { doc: next, future: s.future.slice(1), past: [...s.past, s.doc].slice(-HISTORY_LIMIT), selection: [], enteredGroup: null }
  }),

  canUndo: () => !get().readOnly && get().past.length > 0,
  canRedo: () => !get().readOnly && get().future.length > 0,
}))
