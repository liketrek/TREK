import { create } from 'zustand'
import axios from 'axios'
import { searchHelp, type HelpSearchHit } from '../api/help'
import { helpApi, type HelpNavSection } from '../api/client'

/**
 * State of the contextual help panel: whether it is open, which screen it is
 * for, which guide is being read, and the search that runs across guides and
 * docs. Screens set the context on mount (`useHelpContext`); the panel reads it.
 */

export type HelpSearchStatus = 'idle' | 'loading' | 'done' | 'error'

/** One picture enlarged over the dialog. */
export interface HelpLightbox {
  src: string
  alt: string
}

interface HelpState {
  open: boolean
  /** The screen the reader is on, as registered by that screen. */
  contextId: string | null
  /**
   * A screen the reader chose to browse in the dialog, other than the one they
   * are on. Null means "follow the current screen"; opening the dialog resets it.
   */
  browseId: string | null
  /** The guide currently open inside the panel, if any. */
  guideId: string | null
  lightbox: HelpLightbox | null
  query: string
  searchStatus: HelpSearchStatus
  docHits: HelpSearchHit[]
  /** Wiki table of contents, loaded once so doc links can show real titles. */
  docIndex: HelpNavSection[] | null

  openHelp: () => void
  closeHelp: () => void
  toggleHelp: () => void
  setContext: (id: string | null) => void
  /** Browse another screen's help from the switcher; null returns to the current screen. */
  browse: (id: string | null) => void
  openGuide: (id: string) => void
  closeGuide: () => void
  openLightbox: (content: HelpLightbox | null) => void
  setQuery: (query: string) => void
  loadDocIndex: () => Promise<void>
}

/** Wait this long after the last keystroke before asking the server. */
const SEARCH_DEBOUNCE_MS = 220

let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchAbort: AbortController | null = null

function cancelSearch(): void {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = null
  searchAbort?.abort()
  searchAbort = null
}

export const useHelpStore = create<HelpState>((set, get) => ({
  open: false,
  contextId: null,
  browseId: null,
  guideId: null,
  lightbox: null,
  query: '',
  searchStatus: 'idle',
  docHits: [],
  docIndex: null,

  openHelp: () => set({ open: true, browseId: null }),
  closeHelp: () => {
    cancelSearch()
    set({ open: false, lightbox: null, query: '', searchStatus: 'idle', docHits: [] })
  },
  toggleHelp: () => (get().open ? get().closeHelp() : get().openHelp()),

  setContext: (id) => {
    const { contextId, open } = get()
    if (contextId === id) return
    // While the dialog is open a guide survives a screen change on purpose:
    // the "widgets" guide walks the reader from the dashboard into Settings,
    // and closing it the moment they arrive would defeat the point. With the
    // dialog closed, arriving on another screen means the next open should
    // show that screen, not a guide left over from the last one.
    set(open ? { contextId: id } : { contextId: id, guideId: null })
  },

  browse: (id) => {
    cancelSearch()
    set({ browseId: id, guideId: null, lightbox: null, query: '', searchStatus: 'idle', docHits: [] })
  },

  openGuide: (id) => {
    cancelSearch()
    set({ guideId: id, open: true, query: '', searchStatus: 'idle', docHits: [] })
  },
  closeGuide: () => set({ guideId: null, lightbox: null }),
  openLightbox: (content) => set({ lightbox: content }),

  setQuery: (query) => {
    cancelSearch()
    const q = query.trim()
    if (!q) {
      set({ query, searchStatus: 'idle', docHits: [] })
      return
    }
    set({ query, searchStatus: 'loading' })
    searchTimer = setTimeout(() => {
      const controller = new AbortController()
      searchAbort = controller
      searchHelp(q, controller.signal)
        .then((hits) => {
          if (controller.signal.aborted) return
          set({ docHits: hits, searchStatus: 'done' })
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || axios.isCancel(err)) return
          set({ docHits: [], searchStatus: 'error' })
        })
    }, SEARCH_DEBOUNCE_MS)
  },

  loadDocIndex: async () => {
    if (get().docIndex) return
    try {
      const { sections } = await helpApi.index()
      set({ docIndex: sections })
    } catch {
      // Titles fall back to the slug; the links still work.
      set({ docIndex: [] })
    }
  },
}))

/** Title of a wiki page from the loaded index, or a readable form of its slug. */
export function docTitle(index: HelpNavSection[] | null, slug: string): string {
  for (const section of index ?? []) {
    const page = section.pages.find(p => p.slug === slug)
    if (page) return page.title
  }
  return slug.replace(/-/g, ' ')
}
