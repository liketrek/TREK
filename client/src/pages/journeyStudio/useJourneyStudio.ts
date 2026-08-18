import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useJourneyStore } from '../../store/journeyStore'
import { useStudioStore } from '../../store/studioStore'
import { useTranslation } from '../../i18n'
import { useIsMobile } from '../../hooks/useIsMobile'
import { PAGE_PRESETS, type PagePresetId } from '../../components/Studio/pagePresets'
import { buildBook, distributeGallery, type AutoEntry, type AutoPhoto } from '../../components/Studio/autoLayout'

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
export function useJourneyStudio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
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
  const [bookName, setBookName] = useState('')

  const workRef = useRef<HTMLDivElement>(null)
  const nameTouched = useRef(false)
  const builtFor = useRef<number | null>(null)

  const journey = current && current.id === journeyId ? current : null

  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    if (!current || current.id !== journeyId) void loadJourney(journeyId)
  }, [journeyId, current, loadJourney])

  // Lay the book out once, from the journey. After that it is an ordinary
  // document and this must not run again, or it would throw away the user's
  // work every time the journey re-renders.
  useEffect(() => {
    if (!journey || builtFor.current === journey.id) return
    builtFor.current = journey.id

    const entries: AutoEntry[] = (journey.entries || [])
      .filter((e: any) => e.type !== 'skeleton' || e.title)
      .map((e: any) => ({
        id: e.id,
        title: e.title ?? null,
        story: e.story ?? null,
        location: e.location_name ?? null,
        date: e.entry_date ?? null,
        photos: (e.photos || []).map((p: any): AutoPhoto => ({
          photoId: p.photo_id ?? p.id,
          width: p.width ?? null,
          height: p.height ?? null,
          caption: p.caption ?? null,
        })),
      }))

    const gallery: AutoPhoto[] = (journey.gallery || []).map((p: any) => ({
      photoId: p.photo_id ?? p.id,
      width: p.width ?? null,
      height: p.height ?? null,
      caption: p.caption ?? null,
    }))

    const withPhotos = distributeGallery(entries, gallery)
    const preset = PAGE_PRESETS['square-210']

    loadDoc(buildBook({
      title: journey.title || '',
      subtitle: journey.subtitle ?? null,
      coverPhotoId: gallery[0]?.photoId ?? null,
      entries: withPhotos,
      page: {
        preset: preset.id,
        pageWidth: preset.pageWidthMm,
        pageHeight: preset.pageHeightMm,
        bleed: preset.bleedMm,
        safe: preset.safeMm,
      },
    }))
  }, [journey, loadDoc])

  // The book is named after the journey until someone renames it. Tracking the
  // rename explicitly keeps a later journey title change from overwriting a name
  // the user chose on purpose.
  useEffect(() => {
    if (!journey || nameTouched.current) return
    setBookName(journey.title || '')
  }, [journey])

  const renameBook = useCallback((value: string) => {
    nameTouched.current = true
    setBookName(value)
  }, [])

  const preset = (doc?.page.preset ?? 'square-210') as PagePresetId
  const page = doc?.page ?? {
    preset: 'square-210' as const,
    pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
  }
  const spread = doc?.spreads[activeSpread] ?? null
  const spreadWidthMm = spread && spread.role === 'inner' ? page.pageWidth * 2 : page.pageWidth

  const setPreset = useCallback((next: PagePresetId) => {
    const p = PAGE_PRESETS[next]
    commit(d => ({
      ...d,
      page: { ...d.page, preset: p.id, pageWidth: p.pageWidthMm, pageHeight: p.pageHeightMm },
    }))
    setAutoFit(true)
  }, [commit])

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
    setClosing(true)
    // Mirrors the exit duration in studio.css.
    window.setTimeout(() => navigate(backTo, { replace: true }), 180)
  }, [navigate, backTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'

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

  /** The journey's own material, for the content browser. */
  const source = useMemo(() => ({
    entries: (journey?.entries || [])
      .filter((e: any) => e.title || e.story || e.location_name)
      .map((e: any) => ({
        id: e.id,
        title: e.title ?? null,
        story: e.story ?? null,
        location: e.location_name ?? null,
        date: e.entry_date ?? null,
      })),
    photos: (journey?.gallery || []).map((p: any) => ({
      photoId: p.photo_id ?? p.id,
      caption: p.caption ?? null,
    })),
  }), [journey])

  const coverUrl = journey?.cover_image
    ? (journey.cover_image.startsWith('/uploads/') ? journey.cover_image : `/uploads/${journey.cover_image}`)
    : null

  return {
    t,
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
    bookName,
    renameBook,

    doc,
    page,
    preset,
    setPreset,
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
