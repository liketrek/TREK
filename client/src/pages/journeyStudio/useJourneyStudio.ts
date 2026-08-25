import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import type { BookPageNumbers, JourneyStats } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { journeyApi } from '../../api/client'
import { useJourneyStore, type GalleryPhoto, type JourneyEntry, type JourneyPhoto } from '../../store/journeyStore'
import { useStudioStore } from '../../store/studioStore'
import { useBookStore } from '../../components/Studio/useBookStore'
import { useBookPresence } from '../../components/Studio/useBookPresence'
import { useTranslation } from '../../i18n'
import { useIsMobile } from '../../hooks/useIsMobile'
import { PAGE_PRESETS, clampPageSize, type PagePresetId } from '../../components/Studio/pagePresets'
import {
  buildBook, distributeGallery, emptyBook, relayoutSpread,
  type AutoEntry, type AutoInput, type AutoPhoto,
} from '../../components/Studio/autoLayout'
import { resolveBindings } from '../../components/Studio/resolveBindings'

/** CSS defines 1in as 96px and 25.4mm, so this factor is exact, not a guess. */
const PX_PER_MM = 96 / 25.4

const ZOOM_STEPS = [0.1, 0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 2, 3]
const MIN_ZOOM = ZOOM_STEPS[0]
const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1]
const WORK_PADDING_PX = 72

/** Studio's margin to the window on all four sides — see `.st-root` in studio.css. */
export const STUDIO_INSET = 16

/**
 * TREK Studio — the book designer's shell state.
 *
 * Studio is a child route of the journey, so the journey it edits is already in
 * the store by the time this runs; it only asks for a load when someone lands on
 * the URL directly and the parent has not finished yet.
 *
 * Two decisions are worth stating because everything else follows from them:
 *
 * 1. The sheet is measured in millimetres and rendered with CSS `mm`, and zoom
 *    is a single `transform: scale()` on top. Chromium maps mm onto PDF points
 *    with a fixed ratio, so the editor is not an approximation of the print —
 *    it is the same box model at a different scale.
 * 2. Escape deselects, it does not close. In a dialog Escape means "go away"; in
 *    an editor that reflex would cost you the page you were working on. Only an
 *    Escape with nothing selected leaves.
 */
/**
 * A journey's tracks, thinned to what a printed line can show.
 *
 * A three-week drive is hundreds of thousands of GPS fixes. At the size a map
 * is printed, a point every fifteen metres and a point every kilometre are the
 * same picture, and only one of them fits in a document that has to be saved,
 * sent over a websocket and parsed on the other side.
 *
 * Thinned by taking every nth point rather than by simplifying the geometry:
 * Douglas-Peucker would keep the shape better, and it is a hundred lines of
 * code to gain something nobody can see at 60mm across. The ends of every
 * segment are kept, because a track that stops short of where it ended reads
 * as a bug.
 */
export function bookPath(tracks: { points: readonly unknown[][] }[]): [number, number][][] {
  const SEGMENTS = 40
  const PER_SEGMENT = 600
  const out: [number, number][][] = []
  for (const track of tracks.slice(0, SEGMENTS)) {
    // Normalised on the way in: the contract types a pair as a tuple, and Zod
    // infers that loosely enough that the pair has to be rebuilt to stay one.
    const pts = track.points
      .map(p => [Number(p[0]), Number(p[1])] as [number, number])
      .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
    if (pts.length < 2) continue
    if (pts.length <= PER_SEGMENT) { out.push(pts); continue }
    const step = (pts.length - 1) / (PER_SEGMENT - 1)
    const thinned: [number, number][] = []
    for (let i = 0; i < PER_SEGMENT; i++) thinned.push(pts[Math.round(i * step)])
    out.push(thinned)
  }
  return out
}

/**
 * The page a Studio with no document yet reports.
 *
 * Parsed from the contract rather than written out, so a new field on the page
 * setup cannot be missing here — and once, so it is not rebuilt per render.
 */
const EMPTY_PAGE = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 })

export function useJourneyStudio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, locale } = useTranslation()
  const isMobile = useIsMobile()
  const { current, loading, loadJourney } = useJourneyStore()

  const doc = useStudioStore(s => s.doc)
  const loadDoc = useStudioStore(s => s.load)
  const activeSpread = useStudioStore(s => s.activeSpread)
  const setActiveSpread = useStudioStore(s => s.setActiveSpread)
  const selection = useStudioStore(s => s.selection)
  const select = useStudioStore(s => s.select)
  const undo = useStudioStore(s => s.undo)
  const redo = useStudioStore(s => s.redo)
  const past = useStudioStore(s => s.past)
  const future = useStudioStore(s => s.future)
  const commit = useStudioStore(s => s.commit)

  const journeyId = Number(id)
  const backTo = `/journey/${id}`

  // The rect of the button that opened Studio, handed over in the navigation
  // state so the panel can grow out of it instead of appearing from nowhere.
  const origin = (location.state as { studioOrigin?: { x: number; y: number } } | null)?.studioOrigin ?? null

  const [closing, setClosing] = useState(false)
  const [zoom, setZoom] = useState(0.4)
  const [autoFit, setAutoFit] = useState(true)
  const [stats, setStats] = useState<JourneyStats | null>(null)
  /*
   * Whether the figures have been *asked for* — success or failure both count.
   *
   * The auto layout uses them, so it has to wait for the answer rather than
   * race it: laying the book out first would give a journey a summary spread
   * or not depending on which promise resolved first, which is the kind of
   * non-determinism nobody can reproduce when it goes wrong. Studio already
   * shows its loading state until the document exists, so the wait is free.
   */
  const [statsSettled, setStatsSettled] = useState(false)
  /** The travelled way, thinned for the page. See `bookPath` for the thinning. */
  const [path, setPath] = useState<[number, number][][]>([])

  /*
   * The stored book, if this journey has one.
   *
   * Studio used to lay a book out on every open, which meant the auto layout
   * was not a starting point but the only point — close the tab and the
   * afternoon went with it.
   */
  const book = useBookStore(journeyId, loadDoc)
  // Pulled out because close() needs it and the store object itself is new on
  // every render — depending on that made the save effect fire per render.
  const { queueSave, saveNow, loaded: bookLoaded } = book

  /*
   * Who else is in here, and where their pointers are.
   *
   * Deliberately unrelated to the saving above: presence is ephemeral and the
   * document is not, and tangling them would mean a pointer could not move
   * while a save was in flight.
   */
  const presence = useBookPresence(journeyId)

  const workRef = useRef<HTMLDivElement>(null)
  const builtFor = useRef<number | null>(null)
  /*
   * What the book was laid out from, kept so it can be laid out again.
   *
   * Auto layout used to run exactly once, on open, which made it the one thing
   * in Studio you could not ask for — a page that came out wrong had to be
   * rebuilt by hand. Holding the input costs a ref and makes the button
   * possible; rebuilding it from the journey on every click would be the same
   * work plus a chance of the two disagreeing.
   */
  const autoInput = useRef<AutoInput | null>(null)

  const journey = current && current.id === journeyId ? current : null

  /** The journey's own material, for the content browser. */
  const source = useMemo(() => ({
    entries: (journey?.entries || [])
      .filter((e: JourneyEntry) => !!(
        e.title || e.story || e.location_name || e.mood || e.weather
        || e.pros_cons?.pros?.length || e.pros_cons?.cons?.length
        // A stop that was only checked into still has two things a page can
        // use: the day it happened and where on earth it was.
        || e.entry_date || (e.location_lat != null && e.location_lng != null)
      ))
      .map((e: JourneyEntry) => ({
        id: e.id,
        title: e.title ?? null,
        story: e.story ?? null,
        location: e.location_name ?? null,
        date: e.entry_date ?? null,
        lat: e.location_lat ?? null,
        lng: e.location_lng ?? null,
        // What the entry recorded beyond its story: how the day felt, what the
        // weather did, and what was worth and not worth it.
        mood: e.mood ?? null,
        weather: e.weather ?? null,
        pros: e.pros_cons?.pros?.filter(Boolean) ?? [],
        cons: e.pros_cons?.cons?.filter(Boolean) ?? [],
      })),
    photos: (journey?.gallery || []).map((p: GalleryPhoto) => ({
      photoId: p.photo_id,
      caption: p.caption ?? null,
    })),
    // Which entry a photo hangs on, so a search for a place finds its pictures
    // even though a picture carries no words of its own.
    photoEntries: (() => {
      const map: Record<number, string> = {}
      for (const e of (journey?.entries || []) as JourneyEntry[]) {
        const words = [e.title, e.location_name].filter(Boolean).join(' ').toLowerCase()
        for (const p of e.photos || []) map[p.photo_id] = words
      }
      return map
    })(),
  }), [journey])

  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    if (!current || current.id !== journeyId) void loadJourney(journeyId)
  }, [journeyId, current, loadJourney])

  // Lay the book out once, from the journey. After that it is an ordinary
  // document and this must not run again, or it would throw away the user's
  // work every time the journey re-renders.
  useEffect(() => {
    if (!journey || !statsSettled || !book.loaded || builtFor.current === journey.id) return
    builtFor.current = journey.id

    /*
     * A stored book wins over a fresh layout, always.
     *
     * The auto layout is what a journey with no book gets; running it over one
     * that exists would throw away everything anyone had done, on open, with no
     * warning. `autoInput` is still built either way, because the relayout
     * button needs it.
     */
    if (book.record) {
      /*
       * Already normalised by useBookStore, and deliberately the same object it
       * holds — see `synced` there, which is what keeps opening a book from
       * counting as an edit.
       *
       * Opening is also where a bound element catches up with the journal, and
       * the only place it can be: resolving inside useBookStore would rewrite
       * the very object `synced` compares against, and every open — every
       * incoming remote save, every conflict — would become a save. Here it
       * runs once per journey, and when it did change something the ordinary
       * autosave writes that back exactly once. resolveBindings returns the
       * document it was given when nothing moved, which is what keeps the
       * common case free.
       */
      loadDoc(resolveBindings(
        book.record.document,
        {
          title: journey.title || '',
          subtitle: journey.subtitle ?? null,
          entries: source.entries,
          photos: source.photos,
        },
        locale,
      ))
    }

    // A skeleton entry is a place pulled in from a trip that nobody has written
    // about yet; without a title it has nothing to put on a page.
    const entries: AutoEntry[] = (journey.entries || [])
      .filter((e: JourneyEntry) => e.type !== 'skeleton' || !!e.title)
      .map((e: JourneyEntry) => ({
        id: e.id,
        title: e.title ?? null,
        story: e.story ?? null,
        location: e.location_name ?? null,
        date: e.entry_date ?? null,
        photos: (e.photos || []).map((p: JourneyPhoto): AutoPhoto => ({
          photoId: p.photo_id,
          width: p.width ?? null,
          height: p.height ?? null,
          caption: p.caption ?? null,
        })),
      }))

    const gallery: AutoPhoto[] = (journey.gallery || []).map((p: GalleryPhoto) => ({
      photoId: p.photo_id,
      width: p.width ?? null,
      height: p.height ?? null,
      caption: p.caption ?? null,
    }))

    const withPhotos = distributeGallery(entries, gallery)

    /*
     * Give every entry what the journey's figures know about its stop.
     *
     * The entry carries a place name; the stats carry what that name resolved
     * to — coordinates and a country. Matched by date first and by name second,
     * because a day usually has one stop and two stops on one day are told
     * apart by what they are called.
     *
     * With these a page can print the flag, the country's outline and the
     * coordinates, which is most of what makes a printed travel page look like
     * one rather than like a document.
     */
    const points = stats?.points ?? []
    const dayCount = stats?.days ?? null
    const first = stats?.start ? Date.parse(`${stats.start}T00:00:00`) : Number.NaN
    const placed = withPhotos.map(entry => {
      const point = points.find(p => p.date && entry.date && p.date === entry.date)
        ?? points.find(p => p.label && entry.location && p.label === entry.location)
      const at = entry.date ? Date.parse(`${entry.date}T00:00:00`) : Number.NaN
      const dayNumber = Number.isFinite(at) && Number.isFinite(first)
        ? Math.floor((at - first) / 86_400_000) + 1
        : null
      return {
        ...entry,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        country: point?.country ?? null,
        dayNumber: dayNumber && dayNumber > 0 ? dayNumber : null,
        dayCount,
      }
    })

    const preset = PAGE_PRESETS['square-210']

    autoInput.current = {
      locale,
      title: journey.title || '',
      subtitle: journey.subtitle ?? null,
      coverPhotoId: gallery[0]?.photoId ?? null,
      entries: placed,
      page: {
        preset: preset.id,
        pageWidth: preset.pageWidthMm,
        pageHeight: preset.pageHeightMm,
        bleed: preset.bleedMm,
        safe: preset.safeMm,
        pageNumbers: bookPageSetupSchema.shape.pageNumbers.parse({}),
      },
      stats,
      // The recorded track, when the journey has one. It is fetched in the same
      // hook and used to stop here, which left auto-laid books drawing a ruler
      // line over a route somebody had actually walked.
      path,
      stationsLabel: t('journey.studio.stations'),
      dayLabel: t('journey.studio.day'),
      summaryLabel: t('journey.studio.summary'),
      countriesLabel: t('journey.studio.countries'),
    }
    /*
     * A journey with no book yet gets an empty one, not a laid-out one.
     *
     * `autoInput` is still built above, because the Auto layout menu needs it
     * the moment somebody asks — which is the point: the layout is now offered
     * rather than applied, and a first page somebody chose beats a whole book
     * they have to take apart.
     */
    if (!book.record) loadDoc(emptyBook(autoInput.current))
    // `stats` is deliberately not a dependency: the book is laid out once, from
    // the figures as they stood at that moment. Re-running on a later fetch
    // would throw away the user's work — which is the same reason `builtFor`
    // exists for the journey itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey, statsSettled, book.loaded, book.record, loadDoc, locale, source])

  /*
   * What the journey adds up to, for the travel elements.
   *
   * Fetched once and held here rather than inside the panel that offers them:
   * the numbers are the same for every element on every spread, and a fetch per
   * element would ask the server the same question twenty times while someone
   * lays out a summary page.
   *
   * A failure is not an error state. The travel elements are one section of one
   * panel; a book with photographs in it is still a book, and a red banner
   * across the editor because a derived statistic could not be computed would
   * be out of all proportion. The section simply says it has nothing yet.
   */
  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    let cancelled = false
    journeyApi.stats(journeyId)
      .then(data => { if (!cancelled) setStats(data) })
      .catch(() => { if (!cancelled) setStats(null) })
      .finally(() => { if (!cancelled) setStatsSettled(true) })
    return () => { cancelled = true }
  }, [journeyId])

  /*
   * The roads the trip actually took.
   *
   * Separate from the statistics and deliberately not part of what the book
   * waits for: a journey with no routed geometry is the common case, the map
   * falls back to joining its stops, and holding the whole editor closed until
   * a track request has answered would be a bad trade for a line.
   */
  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    let cancelled = false
    /*
     * The frozen layout input is patched too, not just the state.
     *
     * The build effect runs as soon as the book and the figures are in, which is
     * usually before this answers, and what it froze is what the Auto layout
     * buttons hand to buildBook afterwards. Without the patch a relayout drew
     * the straight line between stops over a route somebody had walked.
     */
    const applyPath = (p: [number, number][][]) => {
      setPath(p)
      if (autoInput.current) autoInput.current = { ...autoInput.current, path: p }
    }
    journeyApi.listTracks(journeyId)
      .then(data => { if (!cancelled) applyPath(bookPath(data.tracks)) })
      .catch(() => { if (!cancelled) applyPath([]) })
    return () => { cancelled = true }
  }, [journeyId])

  /*
   * The book has no name of its own.
   *
   * It carries the journey's, written into `doc.title` when the book is laid
   * out — which is the name anyone would give it anyway. The bar used to offer
   * a field for a second one; it was a box whose only real use was being left
   * alone, and the space is better spent saying what this thing is.
   */

  const preset = (doc?.page.preset ?? 'square-210') as PagePresetId
  const page = doc?.page ?? EMPTY_PAGE
  const spread = doc?.spreads[activeSpread] ?? null
  const spreadWidthMm = spread && spread.role === 'inner' ? page.pageWidth * 2 : page.pageWidth

  const setPreset = useCallback((next: PagePresetId) => {
    const p = PAGE_PRESETS[next]
    commit(d => ({
      ...d,
      page: {
        ...d.page,
        preset: p.id,
        // Switching *to* custom keeps the page it is on: the free size is a way
        // to adjust the format you have, not a reset to a default nobody chose.
        pageWidth: next === 'custom' ? d.page.pageWidth : p.pageWidthMm,
        pageHeight: next === 'custom' ? d.page.pageHeight : p.pageHeightMm,
      },
    }))
    setAutoFit(true)
  }, [commit])

  /**
   * A free trim size.
   *
   * Setting either dimension puts the document on the custom preset — a book
   * that is 210 by 240 is not "square 21" with a typo in it, and leaving the
   * preset alone would have the picker naming a format the page no longer is.
   */
  /**
   * What the press needs around the page.
   *
   * Both were fixed at the values a photo-book vendor most often asks for, 3mm
   * of bleed and a 5mm safe margin, and neither had a control — which is fine
   * right up until somebody's printer asks for 5 and 10, and then the book
   * cannot be made here at all. The trim size already answers that question for
   * the page itself; this answers it for the edges.
   *
   * The ceilings are generous rather than typical: 20mm of bleed is more than
   * any press asks for, and a safe margin worth a third of a small page is
   * already a design decision rather than a printer's requirement.
   */
  const setPageEdge = useCallback((which: 'bleed' | 'safe', value: number) => {
    const limit = which === 'bleed' ? 20 : 40
    const clamped = Math.min(limit, Math.max(0, Math.round(value * 10) / 10))
    commit(d => ({ ...d, page: { ...d.page, [which]: clamped } }))
  }, [commit])

  const setPageSize = useCallback((axis: 'w' | 'h', value: number) => {
    commit(d => ({
      ...d,
      page: {
        ...d.page,
        preset: 'custom' as const,
        pageWidth: axis === 'w' ? clampPageSize(value) : d.page.pageWidth,
        pageHeight: axis === 'h' ? clampPageSize(value) : d.page.pageHeight,
      },
    }))
    setAutoFit(true)
  }, [commit])

  /**
   * Lay out again — one spread, or the whole book.
   *
   * Both are ordinary commits, so both undo. That is the difference between an
   * auto layout you can try and one you have to commit to: the first thing
   * anyone does with a button like this is press it to see what happens, and
   * the second is want their page back.
   *
   * The page setup is carried over rather than reset. Someone who chose A4 and
   * turned page numbers on did not ask for that to be undone by a relayout.
   */
  const relayoutBook = useCallback(() => {
    const input = autoInput.current
    if (!input) return
    commit(d => ({
      ...buildBook({ ...input, page: d.page }),
      title: d.title,
    }))
    setActiveSpread(0)
  }, [commit, setActiveSpread])

  const relayoutCurrentSpread = useCallback(() => {
    const input = autoInput.current
    if (!input) return
    commit(d => {
      const sp = d.spreads[activeSpread]
      if (!sp) return d
      const next = relayoutSpread(sp, { ...input, page: d.page })
      if (!next) return d
      return { ...d, spreads: d.spreads.map((x, i) => (i === activeSpread ? next : x)) }
    })
    select([])
  }, [commit, activeSpread, select])

  /** Whether the spread on screen came from an entry, and so can be redone. */
  const canRelayoutSpread = !!(
    autoInput.current
    && doc?.spreads[activeSpread]?.entryId != null
    && doc.spreads[activeSpread].role === 'inner'
  )

  /** Page numbers and anything else that belongs to the book rather than a page. */
  const setPageNumbers = useCallback((patch: Partial<BookPageNumbers>) => {
    commit(d => ({
      ...d,
      page: { ...d.page, pageNumbers: { ...d.page.pageNumbers, ...patch } },
    }))
  }, [commit])

  /*
   * Save on change.
   *
   * Watching the document rather than wrapping every mutation: the store has a
   * dozen ways to change a book and will grow more, and a save call at each of
   * them is a save call somebody forgets to add. One effect on the value that
   * matters cannot be forgotten.
   *
   * The document that was just loaded — at open, or when another editor's
   * version arrives — is passed straight back here on the next render. The
   * store recognises it by identity and does not write it back, so neither an
   * open nor an incoming change shows up as an edit.
   */
  useEffect(() => {
    if (!doc || !bookLoaded || !journey) return
    queueSave(doc, journey.title || '')
    /*
     * The callbacks, never the store object.
     *
     * useBookStore returns a fresh object every render, so depending on it ran
     * this effect on every render — and after a conflict, where the local
     * document is by definition not the saved one, that meant a save attempt
     * per render: a 409, a re-render, another attempt, without end. The
     * callbacks are memoised, so these dependencies hold still.
     */
  }, [doc, queueSave, bookLoaded, journey])

  /** Largest zoom at which the whole spread still fits the workbench. */
  const fitZoom = useCallback(() => {
    const el = workRef.current
    if (!el) return 0.4
    const availW = el.clientWidth - WORK_PADDING_PX * 2
    const availH = el.clientHeight - WORK_PADDING_PX * 2
    if (availW <= 0 || availH <= 0) return 0.4
    const z = Math.min(availW / (spreadWidthMm * PX_PER_MM), availH / (page.pageHeight * PX_PER_MM))
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
  }, [spreadWidthMm, page.pageHeight])

  const zoomToFit = useCallback(() => {
    setAutoFit(true)
    setZoom(fitZoom())
  }, [fitZoom])

  // Fit on mount and on resize, but only while the user has not taken over the
  // zoom — otherwise a window resize would silently undo their choice.
  useLayoutEffect(() => {
    if (autoFit) setZoom(fitZoom())
  }, [autoFit, fitZoom])

  useEffect(() => {
    const el = workRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => { if (autoFit) setZoom(fitZoom()) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [autoFit, fitZoom])

  const stepZoom = useCallback((dir: 1 | -1) => {
    setAutoFit(false)
    setZoom(prev => {
      if (dir === 1) return ZOOM_STEPS.find(s => s > prev + 0.001) ?? MAX_ZOOM
      return [...ZOOM_STEPS].reverse().find(s => s < prev - 0.001) ?? MIN_ZOOM
    })
  }, [])

  const close = useCallback(() => {
    // Whatever is still queued goes now: the debounce exists so a drag is one
    // request, not so the last edit before closing is lost.
    void saveNow()
    setClosing(true)
    // Mirrors the exit duration in studio.css.
    window.setTimeout(() => navigate(backTo, { replace: true }), 180)
  }, [navigate, backTo, saveNow])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable === true

      // Undo belongs to the field while somebody is in one: Studio text commits
      // on blur, so the sentence being typed is not in the history yet and the
      // document-level undo would take back the change before it instead.
      if (typing) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo(); else undo()
        return
      }
      if (e.key !== 'Escape' || typing) return
      // An editor's Escape clears the selection first; only a second one leaves.
      if (selection.length) {
        e.preventDefault()
        select([])
        return
      }
      e.preventDefault()
      close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selection, select, close, undo, redo])


  const coverUrl = journey?.cover_image
    ? (journey.cover_image.startsWith('/uploads/') ? journey.cover_image : `/uploads/${journey.cover_image}`)
    : null

  return {
    t,
    locale,
    isMobile,
    journeyId,
    journey,
    loading: loading || !journey || !doc,
    backTo,
    origin,
    closing,
    close,
    coverUrl,
    source,
    stats,
    /** The travelled way, ready to freeze into a map element. */
    path,

    doc,
    page,
    preset,
    setPreset,
    setPageSize,
    setPageEdge,
    setPageNumbers,
    relayoutBook,
    relayoutCurrentSpread,
    canRelayoutSpread,

    /** Applying the other side of a conflict replaces the open document. */
    loadDoc,

    /** Everyone else with the book open, and their pointers. */
    peers: presence.peers,
    cursors: presence.cursors,
    moveCursor: presence.moveCursor,

    /** Autosave: its state, and the two ways out of a conflict. */
    saveState: book.state,
    saveNow: book.saveNow,
    acceptTheirs: book.acceptTheirs,
    keepMine: book.keepMine,
    spread,
    spreadWidthMm,
    activeSpread,
    setActiveSpread,

    zoom,
    zoomPercent: Math.round(zoom * 100),
    stepZoom,
    zoomToFit,
    canZoomIn: zoom < MAX_ZOOM - 0.001,
    canZoomOut: zoom > MIN_ZOOM + 0.001,
    workRef,

    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,

    pxPerMm: PX_PER_MM,
  }
}
