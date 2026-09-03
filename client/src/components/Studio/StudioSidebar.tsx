import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera, Check, ChevronDown, ChevronUp, Compass, Copy, FileDown, Files, ImageIcon, LayoutTemplate,
  Plus, Search, Shapes, Trash2, Upload, X,
} from 'lucide-react'
import type { BookElement, BookPageSetup, JourneyStats } from '@trek/shared'
import { useElementSize } from '../../hooks/useElementSize'
import { useStudioStore } from '../../store/studioStore'
import { formatDate } from '../../utils/formatters'
import { useToast } from '../shared/Toast'
import { SpreadFold, SpreadView } from './SpreadView'
import { photoSrc } from './bookRender'
import { formatBookCoords, formatBookDate, type CoordFormat } from './entryText'
import { coordValue } from './resolveBindings'
import { COVER_TEMPLATES, TEMPLATES, applyTemplate } from './templates'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'
import { PanelHead as Head } from './StudioPanelHead'
import { StudioElementsPanel } from './StudioElementsPanel'
import { StudioTravelPanel } from './StudioTravelPanel'
import { MAX_SPREAD_FILE_BYTES, importSpread } from './spreadFile'
import type { StudioUploader } from './studioUpload'

/**
 * The left side of Studio: a narrow rail of sections and one wide panel showing
 * whichever is open.
 *
 * The shape is Canva's and it is the right one here for a plain reason — a book
 * has four completely different kinds of thing you reach for (which page, what
 * from the journey, what to draw, what arrangement), and putting them behind
 * tabs in a single 200px column would make each of them cramped. An icon rail
 * costs 52px and gives the panel the room a photo browser actually needs.
 */

type Section = 'pages' | 'content' | 'elements' | 'travel' | 'templates'

export interface JourneySource {
  entries: {
    id: number
    title: string | null
    story: string | null
    location: string | null
    date: string | null
    /** Where the stop is, when the entry recorded one. Null on a written-only entry. */
    lat: number | null
    lng: number | null
    mood: string | null
    weather: string | null
    pros: string[]
    cons: string[]
    /** The pictures attached to this entry, as trek_photos ids. */
    photoIds: number[]
  }[]
  /** `entryIds` is empty for a picture that sits only in the gallery. */
  photos: { photoId: number; caption?: string | null; entryIds: number[] }[]
  /** photoId to the words of the entry it belongs to, lower-cased. */
  photoEntries: Record<number, string>
}

/** The translator, with the parameters some of the strings here take. */
export type StudioT = (k: string, params?: Record<string, string | number>) => string

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

/**
 * How wide a page preview may be drawn.
 *
 * Page thumbnails and layout cards are drawn at a `scale()` rather than laid
 * out by CSS — the sheet inside them is sized in millimetres — so they need an
 * actual pixel width, and it is **measured** rather than derived.
 *
 * Deriving it was tried twice and was wrong twice. The panel width, the scroll
 * padding and the button's own border and padding are all knowable from
 * studio.css; the scrollbar is not. It appears only once the list is long
 * enough, takes a width that depends on the platform, and the arithmetic that
 * ignored it produced a card overhanging its own selection outline. Measuring
 * the row the cards sit in gets all four contributions at once and cannot drift
 * when any of them changes.
 */
const MIN_PREVIEW_W = 120

/** The button's border and padding, which the row's width still includes. */
const THUMB_CHROME = (2 + 3) * 2

export function StudioSidebar({
  page, pxPerMm, bookView, source, stats, path, t, locale,
  canEdit, onUpload, onToggleStop,
}: {
  page: BookPageSetup
  pxPerMm: number
  bookView: boolean
  source: JourneySource
  /** What the journey adds up to, for the travel elements. Null while loading or on failure. */
  stats: JourneyStats | null
  /** The roads the trip took, for a map that draws them. Empty when it has none. */
  path: [number, number][][]
  t: StudioT
  locale: string
  /** False for a viewer: no upload, no switching stops, nothing that writes. */
  canEdit: boolean
  /** Pictures into the gallery, or into one entry. See studioUpload.ts. */
  onUpload: StudioUploader
  /** Switch a stop on or off in the figures. Resolves false when it did not land. */
  onToggleStop: (entryId: number, excluded: boolean) => Promise<boolean>
}) {
  const [section, setSection] = useState<Section>('pages')

  const SECTIONS: { id: Section; icon: typeof Files; labelKey: string }[] = [
    { id: 'pages', icon: Files, labelKey: 'journey.studio.pages' },
    { id: 'content', icon: ImageIcon, labelKey: 'journey.studio.content' },
    { id: 'elements', icon: Shapes, labelKey: 'journey.studio.elements' },
    { id: 'travel', icon: Compass, labelKey: 'journey.studio.travel' },
    { id: 'templates', icon: LayoutTemplate, labelKey: 'journey.studio.templates' },
  ]

  return (
    <>
      <nav className="st-rail" aria-label={t('journey.studio.sections')}>
        {SECTIONS.map(sec => (
          <button type="button"
            key={sec.id}
            className={`st-rail-btn ${section === sec.id ? 'is-on' : ''}`}
            onClick={() => setSection(sec.id)}
            title={t(sec.labelKey)}
            aria-label={t(sec.labelKey)}
          >
            <sec.icon size={18} strokeWidth={1.7} />
            <span>{t(sec.labelKey)}</span>
          </button>
        ))}
      </nav>

      <aside className="st-panel st-side">
        {section === 'pages' && <PagesPanel page={page} pxPerMm={pxPerMm} bookView={bookView} t={t} />}
        {section === 'content' && (
          <ContentPanel source={source} page={page} t={t} locale={locale} canEdit={canEdit} onUpload={onUpload} />
        )}
        {section === 'elements' && <StudioElementsPanel page={page} t={t} />}
        {section === 'travel' && (
          <StudioTravelPanel
            page={page}
            stats={stats}
            path={path}
            t={t}
            locale={locale}
            canEdit={canEdit}
            onToggleStop={onToggleStop}
          />
        )}
        {section === 'templates' && <TemplatesPanel page={page} pxPerMm={pxPerMm} t={t} onOpenContent={() => setSection('content')} />}
      </aside>
    </>
  )
}

function PagesPanel({
  page, pxPerMm, bookView, t,
}: { page: BookPageSetup; pxPerMm: number; bookView: boolean; t: (k: string) => string }) {
  const doc = useStudioStore(s => s.doc)
  const active = useStudioStore(s => s.activeSpread)
  const setActive = useStudioStore(s => s.setActiveSpread)
  const addSpread = useStudioStore(s => s.addSpread)
  const insertSpread = useStudioStore(s => s.insertSpread)
  const duplicateSpread = useStudioStore(s => s.duplicateSpread)
  const removeSpread = useStudioStore(s => s.removeSpread)
  const moveSpread = useStudioStore(s => s.moveSpread)
  const canEditSpread = useStudioStore(s => s.canEditSpread)
  const spreads = doc?.spreads ?? []
  const list = useElementSize<HTMLDivElement>()
  const THUMB_W = Math.max(MIN_PREVIEW_W, list.width - THUMB_CHROME)

  /** Where a new spread would land: after the last inner one. */
  const lastInner = spreads.reduce((last, sp, i) => (sp.role === 'inner' ? i : last), -1)
  const fileInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  return (
    <>
      <Head label={t('journey.studio.pages')} count={spreads.length} />
      <div className="st-panel-scroll">
        <div className="st-thumbs" ref={list.ref}>
          {spreads.map((sp, i) => {
            const single = sp.role !== 'inner'
            const wMm = single ? page.pageWidth : page.pageWidth * 2
            // The same component at a smaller scale, not a second drawing of the
            // page — a spread can never look different here than on the sheet.
            const scale = THUMB_W / (wMm * pxPerMm)
            const editable = canEditSpread(i)
            return (
              <div className="st-thumb-row" key={sp.id}>
                <button type="button"
                  className={`st-thumb ${i === active ? 'is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  <div className="st-thumb-sheet" style={{ width: THUMB_W, height: page.pageHeight * pxPerMm * scale }}>
                    <div
                      style={{
                        position: 'absolute', left: 0, top: 0,
                        width: `${wMm}mm`, height: `${page.pageHeight}mm`,
                        transform: `scale(${scale})`, transformOrigin: 'top left',
                      }}
                    >
                      <SpreadView spread={sp} page={page} spreadIndex={i} />
                    </div>
                    {bookView && !single && <SpreadFold page={page} scaled={pxPerMm * scale} />}
                  </div>
                  <span className="st-thumb-label">
                    {sp.role === 'cover' ? t('journey.studio.cover')
                      : sp.role === 'back' ? t('journey.studio.backCover')
                      : `${i * 2} – ${i * 2 + 1}`}
                  </span>
                </button>

                {/*
                  The actions sit on the thumbnail rather than in a menu bar of
                  their own: what you are acting on is the page you are pointing
                  at, and a toolbar somewhere else would need you to select
                  first and act second. The cover and the back cover have no
                  actions — a book has exactly one of each, and moving or
                  deleting them is not a thing anyone means to do.
                */}
                {editable && (
                  <div className="st-thumb-actions">
                    <button type="button"
                      onClick={() => moveSpread(i, -1)}
                      disabled={!canEditSpread(i - 1)}
                      title={t('journey.studio.movePageUp')}
                      aria-label={t('journey.studio.movePageUp')}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button type="button"
                      onClick={() => moveSpread(i, 1)}
                      disabled={!canEditSpread(i + 1)}
                      title={t('journey.studio.movePageDown')}
                      aria-label={t('journey.studio.movePageDown')}
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button type="button"
                      onClick={() => duplicateSpread(i)}
                      title={t('journey.studio.duplicatePage')}
                      aria-label={t('journey.studio.duplicatePage')}
                    >
                      <Copy size={12} />
                    </button>
                    <button type="button"
                      className="is-danger"
                      onClick={() => removeSpread(i)}
                      title={t('journey.studio.deletePage')}
                      aria-label={t('journey.studio.deletePage')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                {/* Insert between two spreads, where the new one will go — a
                    single "add" at the end cannot express "another page here". */}
                {editable && (
                  <button type="button"
                    className="st-thumb-insert"
                    onClick={() => addSpread(i)}
                    title={t('journey.studio.addPageAfter')}
                    aria-label={t('journey.studio.addPageAfter')}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/*
          Two ways to get a new page: an empty one, or somebody else's design.
          Side by side because they answer the same question — the import is
          not a setting buried in a menu, it is the other half of "add".
        */}
        <div className="st-add-row">
          <button type="button" className="st-add-page" onClick={() => addSpread(lastInner)}>
            <Plus size={14} />
            {t('journey.studio.addPage')}
          </button>
          <button type="button"
            className="st-add-page is-import"
            onClick={() => fileInput.current?.click()}
            title={t('journey.studio.importSpreadHint')}
          >
            <FileDown size={14} />
            {t('journey.studio.importSpread')}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async e => {
            const file = e.target.files?.[0]
            // Cleared straight away so choosing the same file twice in a row
            // still fires a change event the second time.
            e.target.value = ''
            if (!file) return
            setImportError(null)
            // Checked before reading rather than after: the point of a limit on
            // a file someone else wrote is not to parse it in the first place.
            if (file.size > MAX_SPREAD_FILE_BYTES) { setImportError(t('journey.studio.importSpreadFailed')); return }
            try {
              const spread = importSpread(JSON.parse(await file.text()), page)
              if (!spread) { setImportError(t('journey.studio.importSpreadFailed')); return }
              insertSpread(lastInner, spread)
            } catch {
              setImportError(t('journey.studio.importSpreadFailed'))
            }
          }}
        />
        {importError && <p className="st-add-error">{importError}</p>}
      </div>
    </>
  )
}

/**
 * Which of the journey's pictures the browser shows.
 *
 * `recent` holds ids rather than a flag on the photo: what just arrived is a
 * fact about this sitting, not about the picture, and the journey store has no
 * reason to remember it.
 */
type PhotoFilter =
  | { kind: 'all' }
  | { kind: 'entry'; id: number }
  | { kind: 'loose' }
  | { kind: 'recent'; photoIds: number[] }

/**
 * The journey's own material.
 *
 * This is what separates a book maker from a drawing program: the pictures and
 * the words are already written, and the job is putting them on pages. Clicking
 * an item drops it on the current spread, centred, at a sensible size.
 *
 * Pictures can also come in here. A book is where you notice the one that
 * never made it into the journal, and going back to the journey to add it, then
 * finding the page again, was the one round trip Studio still asked for. What
 * comes in goes through the journey store like any other upload, so the journal
 * sees it the moment the panel does.
 */
function ContentPanel({
  source, page, t, locale, canEdit, onUpload,
}: {
  source: JourneySource
  page: BookPageSetup
  t: StudioT
  locale: string
  canEdit: boolean
  onUpload: StudioUploader
}) {
  const [tab, setTab] = useState<'photos' | 'text'>('photos')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PhotoFilter>({ kind: 'all' })
  const toast = useToast()

  /*
   * Filtering, not a search index: a journey holds tens or hundreds of items, and
   * a substring match over what is already in memory answers instantly. A photo
   * matches on its own caption *and* on the entry it belongs to — most photos
   * carry no words at all, so matching only captions would make the box look
   * broken on exactly the journeys that need it.
   */
  const q = query.trim().toLowerCase()
  const entries = q
    ? source.entries.filter(e =>
      [e.title, e.story, e.location, ...e.pros, ...e.cons]
        .some(v => v && v.toLowerCase().includes(q)))
    : source.entries

  /*
   * The filter narrows first and the words second, so an entry filter with a
   * search typed into it means "these pictures, with these words". Which entry
   * a picture belongs to is read off the journal's own junction rather than
   * off its words, which is what lets "not in an entry" mean exactly that.
   */
  const byFilter = (() => {
    switch (filter.kind) {
      case 'entry': return source.photos.filter(p => p.entryIds.includes(filter.id))
      case 'loose': return source.photos.filter(p => !p.entryIds.length)
      case 'recent': {
        // In the order they were sent, which is the order they were chosen in,
        // not wherever the gallery sorted them.
        const byId = new Map(source.photos.map(p => [p.photoId, p] as const))
        return filter.photoIds.flatMap(id => { const p = byId.get(id); return p ? [p] : [] })
      }
      default: return source.photos
    }
  })()
  const photos = q
    ? byFilter.filter(p =>
      (p.caption && p.caption.toLowerCase().includes(q))
      || (source.photoEntries[p.photoId] || '').includes(q))
    : byFilter

  const looseCount = source.photos.filter(p => !p.entryIds.length).length
  const withPhotos = source.entries.filter(e => e.photoIds.length > 0)
  const nameOf = (e: { title: string | null; location: string | null } | undefined) =>
    e?.title || e?.location || t('journey.studio.untitled')
  const filterLabel = filter.kind === 'loose' ? t('journey.studio.filterLoose')
    : filter.kind === 'recent' ? t('journey.studio.filterRecent')
    : filter.kind === 'entry' ? nameOf(source.entries.find(e => e.id === filter.id))
    : t('journey.studio.filterAll')

  /*
   * Why the grid is empty, which is four different answers. "No photos" on a
   * journey with three hundred of them, because the filter is on a day with
   * none, reads as the pictures having gone.
   */
  const emptyKey = !source.photos.length ? 'journey.studio.noPhotos'
    : byFilter.length ? 'journey.studio.noMatches'
    : filter.kind === 'entry' ? 'journey.studio.noEntryPhotos'
    : filter.kind === 'loose' ? 'journey.studio.noLoosePhotos'
    : 'journey.studio.noMatches'

  const [menuOpen, setMenuOpen] = useState(false)
  const menuBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuBox.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      // Swallowed, as the format picker does it: the shell's Escape closes Studio.
      if (e.key === 'Escape') { e.stopPropagation(); setMenuOpen(false) }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [menuOpen])
  const pick = (f: PhotoFilter) => { setFilter(f); setMenuOpen(false) }

  const addElement = useStudioStore(s => s.addElement)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]

  /*
   * The page on the sheet belongs to a day, so its pictures are one press
   * away. Offered only while the filter is not already there: a chip for the
   * state you are in is a chip that does nothing.
   */
  const pageEntry = spread?.entryId != null ? withPhotos.find(e => e.id === spread.entryId) : undefined
  const offerThisPage = pageEntry && !(filter.kind === 'entry' && filter.id === pageEntry.id)

  const fileInput = useRef<HTMLInputElement>(null)
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null)
  /* A ref as well as the state: two drops in one second would both read the
     state before either had set it. */
  const sending = useRef(false)
  const [dropOver, setDropOver] = useState(false)

  /**
   * Into the entry the browser is filtered to, otherwise into the gallery. The
   * filter is the one thing on screen that names an entry, so it is also the
   * one thing that can say where a picture belongs; the line under it says so
   * before the press. Afterwards the new pictures get a filter of their own,
   * because the gallery sorts them to its end, and twelve pictures that arrive
   * out of sight read as twelve that did not arrive.
   */
  const send = async (files: File[]) => {
    if (sending.current || !files.length) return
    sending.current = true
    setUpload({ done: 0, total: files.length })
    try {
      const entryId = filter.kind === 'entry' ? filter.id : null
      const sent = await onUpload(files, entryId, p => setUpload({ done: p.done, total: p.total }))
      if (sent.photoIds.length) {
        setFilter({ kind: 'recent', photoIds: sent.photoIds })
        setQuery('')
        toast.success(t('journey.photosUploaded', { count: sent.photoIds.length }))
      }
    } finally {
      sending.current = false
      setUpload(null)
    }
  }

  /*
   * The whole scrolling area takes a drop, not just the dashed cell: a drag
   * from the desktop arrives with the pointer wherever it arrives, and a target
   * seventy pixels square is one you miss. Only a file drag is claimed; the
   * panel's own photo drags carry another type and go to the sheet.
   */
  const dropZone = canEdit && tab === 'photos' ? {
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      if (!e.dataTransfer.types.includes('Files')) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDropOver(true)
    },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => {
      // Moving onto a child of the box is not leaving the box.
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropOver(false)
    },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(e.dataTransfer.files ?? [])
      if (!files.length) return
      e.preventDefault()
      setDropOver(false)
      void send(files)
    },
  } : {}

  const centre = (w: number, h: number) => {
    const W = spread && spread.role !== 'inner' ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

  const dropPhoto = (photoId: number) => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.55
    addElement(active, {
      id: uid('p'), kind: 'photo', frame: centre(side, side * 0.75),
      rotation: 0, opacity: 1, locked: false,
      photoId, fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none',
    } as BookElement)
  }

  /**
   * One piece of the entry, dropped on the page and still attached to it.
   *
   * `format` is what separates a place name from a set of coordinates: both
   * read the entry's location, and which of the two gets printed is a property
   * of the binding rather than a second source — see the contract. `width`
   * exists because a line of coordinates arriving inside a full-column
   * selection rectangle looks like a bug; only the short marks pass it.
   */
  const dropText = (
    value: string,
    size: number,
    weight: 400 | 700,
    entryId: number,
    kind: 'entry.title' | 'entry.story' | 'entry.location' | 'entry.date',
    opts: { format?: CoordFormat; width?: number; value?: string } = {},
  ) => {
    const w = opts.width ?? page.pageWidth - 32
    addElement(active, {
      id: uid('t'), kind: 'text', frame: centre(w, size * 0.4 + 10),
      rotation: 0, opacity: 1, locked: false,
      text: value, font: 'sans', size, weight, italic: false,
      align: 'left', leading: weight === 700 ? 1.1 : 1.55, tracking: weight === 700 ? -0.02 : 0,
      color: '#1a1a1a',
      binding: {
        source: kind,
        entryId,
        ...(opts.format ? { format: opts.format } : {}),
        // The fact behind the words, for the marks whose words are formatted —
        // see `value` in the contract.
        ...(opts.value ? { value: opts.value } : {}),
      },
      overridden: false,
    } as BookElement)
  }

  const base = {
    rotation: 0, opacity: 1, locked: false,
    font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, stale: false,
  }

  /**
   * A mood or a weather mark, drawn with the icon the journey page uses.
   *
   * `code` holds the key rather than the label, so the element carries what the
   * entry recorded and the renderer decides how to draw it — which is what lets
   * the icon and the palette come from one place.
   */
  const dropMark = (variant: 'mood' | 'weather', code: string, label: string) =>
    addElement(active, {
      ...base, id: uid('bd'), kind: 'badge', autoColor: true,
      // Set here as well as in the contract: this object is cast, not parsed.
      showIcon: true, showLabel: true, autoIconColor: true, iconColor: '#111111',
      frame: centre(page.pageWidth * 0.22, page.pageHeight * 0.062),
      variant, text: label, sub: '', code, style: 'plain',
    } as BookElement)

  /** Both columns of an entry's pros and cons, as one element. */
  const dropProsCons = (pros: string[], cons: string[]) => {
    const rows = Math.max(pros.length, cons.length, 1)
    addElement(active, {
      ...base, id: uid('li'), kind: 'list',
      // Matches what ListView needs for `rows` lines at its largest line size,
      // so the element arrives filled rather than with a third of it empty.
      frame: centre(page.pageWidth * 0.72, Math.min(page.pageHeight * 0.6, 6 * (0.86 + 1.7 * rows))),
      items: [
        ...pros.map(text => ({ text, tone: 'pro' as const })),
        ...cons.map(text => ({ text, tone: 'con' as const })),
      ],
      layout: 'columns', showMarks: true,
      proLabel: t('journey.editor.pros'),
      conLabel: t('journey.editor.cons'),
    } as BookElement)
  }

  return (
    <>
      <Head label={t('journey.studio.content')} />

      <div className="st-search">
        <Search size={14} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('journey.studio.searchContent')}
          aria-label={t('journey.studio.searchContent')}
          spellCheck={false}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')}>
            <X size={13} />
          </button>
        )}
      </div>

      <div className="st-tabs">
        <button type="button" className={tab === 'photos' ? 'is-on' : ''} onClick={() => setTab('photos')}>
          {t('journey.studio.photos')} <em>{photos.length}</em>
        </button>
        <button type="button" className={tab === 'text' ? 'is-on' : ''} onClick={() => setTab('text')}>
          {t('journey.studio.entries')} <em>{entries.length}</em>
        </button>
      </div>

      {/*
        Which entry, as a row of its own under the tabs rather than a control
        inside the search box: the search answers "which words" and this
        answers "which day", and the two combine. The chip opens the same
        popover the bar uses for formats, hung from its left edge because the
        panel has no room to the right of it.
      */}
      {tab === 'photos' && (
        <div className="st-filter-row">
          <div className="st-picker" ref={menuBox}>
            <span className={`st-chip st-filter-chip ${filter.kind !== 'all' ? 'is-on' : ''}`}>
              <button type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={t('journey.studio.filterPhotos')}
              >
                <span className="st-filter-name">{filterLabel}</span>
                <em>{byFilter.length}</em>
                <ChevronDown size={12} style={{ opacity: .5 }} />
              </button>
              {filter.kind !== 'all' && (
                <button type="button" onClick={() => setFilter({ kind: 'all' })} aria-label={t('common.clear')}>
                  <X size={12} />
                </button>
              )}
            </span>

            {menuOpen && (
              <div className="st-menu" role="menu">
                <FilterItem
                  on={filter.kind === 'all'}
                  label={t('journey.studio.filterAll')}
                  count={source.photos.length}
                  onPick={() => pick({ kind: 'all' })}
                />
                <FilterItem
                  on={filter.kind === 'loose'}
                  label={t('journey.studio.filterLoose')}
                  count={looseCount}
                  onPick={() => pick({ kind: 'loose' })}
                />
                {withPhotos.length > 0 && <div className="st-menu-sep" />}
                {withPhotos.map(e => (
                  <FilterItem
                    key={e.id}
                    on={filter.kind === 'entry' && filter.id === e.id}
                    label={nameOf(e)}
                    // The day, and the place when the title took the top line.
                    dim={[e.date ? formatDate(e.date, locale) ?? e.date : null, e.title ? e.location : null]
                      .filter(Boolean).join(', ')}
                    count={e.photoIds.length}
                    onPick={() => pick({ kind: 'entry', id: e.id })}
                  />
                ))}
              </div>
            )}
          </div>

          {offerThisPage && (
            <button type="button" className="st-chip" onClick={() => setFilter({ kind: 'entry', id: pageEntry.id })}>
              {t('journey.studio.filterThisPage')}
            </button>
          )}
        </div>
      )}

      <div className={`st-panel-scroll ${dropOver ? 'is-drop-over' : ''}`} {...dropZone}>
        {tab === 'photos' ? (
          <>
            {canEdit && (
              <p className="st-hint st-upload-where">
                {t(filter.kind === 'entry' ? 'journey.studio.uploadToEntry' : 'journey.studio.uploadToGallery')}
              </p>
            )}
            <div className="st-photo-grid">
              {/*
                The first cell rather than a button above the grid: it is the
                size and shape of what it produces, and it stays where the eye
                already is. Disabled, not hidden, while a batch is on its way,
                so the count has somewhere to be read.
              */}
              {canEdit && (
                <button type="button"
                  className="st-photo-cell is-upload"
                  onClick={() => fileInput.current?.click()}
                  disabled={!!upload}
                  title={t('journey.studio.uploadHint')}
                >
                  <Upload size={18} strokeWidth={1.6} />
                  <span>
                    {upload
                      ? t('journey.studio.uploading', { done: upload.done, total: upload.total })
                      : t('journey.studio.uploadPhotos')}
                  </span>
                </button>
              )}
              {photos.map(p => (
                <button type="button"
                  key={p.photoId}
                  className="st-photo-cell"
                  onClick={() => dropPhoto(p.photoId)}
                  title={t('journey.studio.addToPage')}
                  draggable
                  onDragStart={e => {
                    // HTML5 drag is the right tool for exactly this shape of
                    // interaction (one item, from a list, onto a target) and it
                    // gives us the thumbnail as the drag image for free. The
                    // canvas uses pointer events instead, because free transform
                    // needs a live position that a drop event cannot provide.
                    e.dataTransfer.setData('application/x-trek-photo', String(p.photoId))
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                >
                  <img src={photoSrc(p.photoId, false)} alt="" loading="lazy" draggable={false} />
                </button>
              ))}
              {!photos.length && <p className="st-hint">{t(emptyKey)}</p>}
            </div>
            {canEdit && (
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                hidden
                onChange={e => {
                  const files = Array.from(e.target.files ?? [])
                  // Cleared straight away, as the spread import does, so the
                  // same pictures can be chosen twice in a row.
                  e.target.value = ''
                  void send(files)
                }}
              />
            )}
          </>
        ) : (
          <div className="st-entries">
            {entries.map(e => (
              <div key={e.id} className="st-entry">
                <div className="st-entry-head">{e.title || e.location || t('journey.studio.untitled')}</div>
                {(e.date || e.location) && (
                  <div className="st-entry-meta">
                    {/* Two facts, two badges. Joined by a dot they read as one
                        string and the eye has to parse where the date ends. The
                        date follows the app's language, like every other date in
                        TREK — see utils/formatters.ts. */}
                    {e.date && <span className="st-badge">{formatDate(e.date, locale) ?? e.date}</span>}
                    {e.location && <span className="st-badge is-quiet">{e.location}</span>}
                  </div>
                )}
                <div className="st-row" style={{ marginTop: 7 }}>
                  {e.title && (
                    <button type="button" className="st-chip" onClick={() => dropText(e.title!, 22, 700, e.id, 'entry.title')}>
                      {t('journey.studio.addTitle')}
                    </button>
                  )}
                  {e.story && (
                    <button type="button" className="st-chip" onClick={() => dropText(e.story!, 10, 400, e.id, 'entry.story')}>
                      {t('journey.studio.addStory')}
                    </button>
                  )}
                  {e.location && (
                    <button type="button" className="st-chip" onClick={() => dropText(e.location!, 8, 700, e.id, 'entry.location')}>
                      {t('journey.studio.addPlace')}
                    </button>
                  )}
                  {/*
                    The day and the point. Both are set the way the rest of the
                    book sets them — the long date, coordinates in degrees — so a
                    mark placed here and one the auto layout placed read alike.
                  */}
                  {e.date && (
                    <button type="button"
                      className="st-chip"
                      onClick={() => dropText(
                        formatBookDate(e.date!, locale), 8, 700, e.id, 'entry.date',
                        { width: page.pageWidth * 0.36, value: e.date! },
                      )}
                    >
                      {t('journey.studio.dateMark')}
                    </button>
                  )}
                  {e.lat != null && e.lng != null && (
                    <button type="button"
                      className="st-chip"
                      onClick={() => dropText(
                        formatBookCoords(e.lat!, e.lng!, 'dms'), 8, 700, e.id, 'entry.location',
                        { format: 'dms', width: page.pageWidth * 0.36, value: coordValue(e.lat!, e.lng!) },
                      )}
                    >
                      {t('journey.studio.coordsMark')}
                    </button>
                  )}
                  {/*
                    What the entry recorded besides its story. Each chip shows
                    the value rather than the field name — "Sunny" tells you
                    what you are about to place; "Weather" does not.
                  */}
                  {e.mood && MOOD_CONFIG[e.mood] && (
                    <button type="button"
                      className="st-chip"
                      onClick={() => dropMark('mood', e.mood!, t(MOOD_CONFIG[e.mood!].label))}
                    >
                      {t(MOOD_CONFIG[e.mood].label)}
                    </button>
                  )}
                  {e.weather && WEATHER_CONFIG[e.weather] && (
                    <button type="button"
                      className="st-chip"
                      onClick={() => dropMark('weather', e.weather!, t(WEATHER_CONFIG[e.weather!].label))}
                    >
                      {t(WEATHER_CONFIG[e.weather].label)}
                    </button>
                  )}
                  {(e.pros.length > 0 || e.cons.length > 0) && (
                    <button type="button" className="st-chip" onClick={() => dropProsCons(e.pros, e.cons)}>
                      {t('journey.studio.addProsCons')}
                      <em>{e.pros.length + e.cons.length}</em>
                    </button>
                  )}
                  {/*
                    Not a drop like the others: this one takes you to the
                    entry's pictures. The words of a day and its pictures were
                    two tabs apart with nothing joining them, and the day is
                    how anyone thinks of the pictures.
                  */}
                  {e.photoIds.length > 0 && (
                    <button type="button"
                      className="st-chip"
                      onClick={() => { setFilter({ kind: 'entry', id: e.id }); setTab('photos') }}
                    >
                      <Camera size={12} />
                      {t('journey.studio.entryPhotos')}
                      <em>{e.photoIds.length}</em>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!entries.length && <p className="st-hint">{t('journey.studio.noMatches')}</p>}
          </div>
        )}
      </div>
    </>
  )
}

/** One line of the photo filter: a name, a count, and a tick on the one in force. */
function FilterItem({ on, label, dim, count, onPick }: {
  on: boolean
  label: string
  dim?: string
  count: number
  onPick: () => void
}) {
  return (
    <button type="button"
      role="menuitemradio"
      aria-checked={on}
      className={`st-menu-item ${on ? 'is-active' : ''}`}
      onClick={onPick}
    >
      <span className="st-menu-text">
        <span className="st-menu-name">{label}</span>
        {dim && <span className="st-menu-dim">{dim}</span>}
      </span>
      <span className="st-menu-dim st-filter-count">{count}</span>
      {on && <Check size={14} />}
    </button>
  )
}

/**
 * Layouts for the current spread.
 *
 * Each card draws the arrangement itself rather than naming it — "hero + story"
 * means nothing until you have seen it, and a diagram is faster to read than a
 * label anyway.
 */
function TemplatesPanel({
  page, pxPerMm, t, onOpenContent,
}: { page: BookPageSetup; pxPerMm: number; t: (k: string) => string; onOpenContent: () => void }) {
  const doc = useStudioStore(s => s.doc)
  const active = useStudioStore(s => s.activeSpread)
  const commit = useStudioStore(s => s.commit)
  const spread = doc?.spreads[active]

  const list = useElementSize<HTMLDivElement>()
  const CARD_W = Math.max(MIN_PREVIEW_W, list.width - THUMB_CHROME)
  const doc2 = doc
  const cardIsSingle = (doc2?.spreads[active]?.role ?? 'inner') !== 'inner'
  // A cover card is one page wide, not two — scaling it as a spread would draw
  // the layout at half size in the left half of the card.
  const scale = useMemo(
    () => CARD_W / (page.pageWidth * (cardIsSingle ? 1 : 2) * pxPerMm),
    [CARD_W, page.pageWidth, pxPerMm, cardIsSingle],
  )

  if (!spread) return null
  const single = spread.role !== 'inner'
  /*
   * The cover has its own set. It used to have none — the panel said covers
   * are designed by hand, which was true and unhelpful: the cover is the page
   * people care most about and the one they had no starting point for.
   */
  const templates = single ? COVER_TEMPLATES : TEMPLATES

  return (
    <>
      <Head label={t('journey.studio.templates')} count={templates.length} />
      <div className="st-panel-scroll">
        {(
          <div className="st-thumbs" ref={list.ref}>
            {templates.map(tpl => {
              const slots = tpl.build(page)
              return (
                <button
                  type="button"
                  key={tpl.id}
                  className="st-thumb"
                  onClick={() => {
                    let empties = 0
                    commit(d => ({
                      ...d,
                      spreads: d.spreads.map((sp, i) => {
                        if (i !== active) return sp
                        const next = applyTemplate(sp, tpl, page)
                        empties = next.elements.filter(e => e.kind === 'photo' && e.photoId == null).length
                        return next
                      }),
                    }))
                    // The layout left frames waiting for a picture — so put the
                    // pictures within reach instead of making the user go and
                    // find the panel that holds them.
                    if (empties > 0) onOpenContent()
                  }}
                >
                  <div
                    className="st-thumb-sheet"
                    style={{ width: CARD_W, height: page.pageHeight * pxPerMm * scale }}
                  >
                    {slots.map((slot, i) => (
                      <span
                        key={i}
                        className={`st-tpl-slot is-${slot.kind}`}
                        style={{
                          left: slot.frame.x * pxPerMm * scale,
                          top: slot.frame.y * pxPerMm * scale,
                          width: slot.frame.w * pxPerMm * scale,
                          height: Math.max(2, slot.frame.h * pxPerMm * scale),
                        }}
                      />
                    ))}
                    {!single && (
                      <span
                        className="st-tpl-fold"
                        style={{ left: page.pageWidth * pxPerMm * scale }}
                      />
                    )}
                  </div>
                  <span className="st-thumb-label">{t(tpl.labelKey)}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
