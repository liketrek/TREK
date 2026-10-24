import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { BookOpen, Download, Maximize2, Minus, Plus } from 'lucide-react'
import { useJourneyStudio } from '../../pages/journeyStudio/useJourneyStudio'
import { useTranslation } from '../../i18n'
import { foliosOf } from './bookSheets'
import { StudioSidebar } from './StudioSidebar'
import type { RailSection } from './sidebar/railSections'
import { ProviderPicker } from '../Journey/JourneyDetailPageProviderPicker'
import { useAuthStore } from '../../store/authStore'
import { StudioCanvas } from './StudioCanvas'
import { StudioInspector } from './StudioInspector'
import { StudioPaletteScope } from './paint/StudioPalette'
import { downloadSpread } from './spreadFile'
import { StudioExport } from './StudioExport'
import { StudioAssistantColumn, StudioPageStage } from './StudioAssistantPanel'
import { useStudioAssistant } from './useStudioAssistant'
import { StudioHeader } from './StudioHeader'
import { NewerBookOverlay } from './SaveIndicator'
import { StudioNotices } from './StudioNotices'
import '../../styles/dashboard.css'
import '../../styles/studio.css'
import './bookFontFaces'
import { useWarmBookFaces } from './bookFontWarm'

/**
 * The Studio shell: top bar, page rail, workbench, inspector.
 *
 * It is a child route of the journey and portals itself over it, so the journey
 * stays mounted underneath and shows through the blurred 16px margin. That
 * margin is the whole point — you are meant to see that you never left.
 *
 * `.trek-dash` on the root is not decoration: every colour, radius and shadow in
 * studio.css resolves against those tokens, so Studio follows the user's theme
 * and accent without a second palette to keep in sync.
 */
export default function StudioShell() {
  const s = useJourneyStudio()
  const navigate = useNavigate()
  const [bookView, setBookView] = useState(true)
  const [exporting, setExporting] = useState(false)
  // The rail's open section lives here, so the inspector can open the Theme or the Layers panel beside it.
  const [railSection, setRailSection] = useState<RailSection>('pages')
  const assistant = useStudioAssistant({ journeyId: s.journeyId, flush: s.flushBook })
  // The book's faces into the offline cache as it opens (bookFontWarm.ts).
  useWarmBookFaces()

  if (s.isMobile) {
    return createPortal(
      <div className="st-phone trek-dash">
        <BookOpen size={30} strokeWidth={1.5} style={{ color: 'var(--ink-3)' }} />
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {s.t('journey.studio.desktopOnly')}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-3)', maxWidth: 320, lineHeight: 1.55 }}>
          {s.t('journey.studio.desktopOnlyHint')}
        </div>
        <button type="button"
          onClick={() => navigate(s.backTo, { replace: true })}
          className="st-tool is-primary"
          style={{ marginTop: 6 }}
        >
          {s.t('journey.studio.backToJourney')}
        </button>
      </div>,
      document.body,
    )
  }

  const originStyle = s.origin
    ? ({ '--st-ox': `${s.origin.x}px`, '--st-oy': `${s.origin.y}px` } as React.CSSProperties)
    : undefined

  return createPortal(
    <>
      <div
        className={`st-scrim ${s.closing ? 'st-scrim-exit' : 'st-scrim-enter'}`}
        onClick={s.close}
        aria-hidden
      />
      <div
        className={`st-root trek-dash ${s.closing ? 'st-exit' : 'st-enter'}`}
        style={originStyle}
        role="dialog"
        aria-modal="true"
        aria-label={s.t('journey.studio.title')}
      >
        <StudioHeader s={s} onExport={() => setExporting(true)} assistant={assistant} />
        <StudioNotices />
        {/* A newer Studio saved this book: nothing done here would be kept, so the whole Studio waits for a reload. */}
        {s.saveState.status === 'newer' && <NewerBookOverlay t={s.t} />}
        {/* The journey gallery's picker, inside Studio's own layer (#2271). */}
        {s.providerPick && s.journey && (
          <ProviderPicker
            provider={s.providerPick.provider}
            userId={useAuthStore.getState().user?.id || 0}
            entries={s.journey.entries.filter(e => e.type !== 'skeleton' || e.title)}
            trips={s.journey.trips}
            existingAssetIds={new Set((s.journey.gallery ?? []).filter(p => p.asset_id).map(p => p.asset_id!))}
            initialEntryId={s.providerPick.entryId}
            onClose={s.closeProviderPick}
            onAdd={s.addFromProvider}
          />
        )}

        <div className="st-body">
          <StudioSidebar
            page={s.page}
            pxPerMm={s.pxPerMm}
            bookView={bookView}
            source={s.source}
            stats={s.stats}
            path={s.path}
            t={s.t}
            locale={s.locale}
            canEdit={s.canEdit}
            onUpload={s.uploadPhotos}
            onToggleStop={s.setStopExcluded}
            providers={s.photoProviders}
            onBrowseProvider={s.browseProvider}
            section={railSection}
            onSection={setRailSection}
          />
          <Workbench s={s} bookView={bookView} setBookView={setBookView} />
          <StudioPaletteScope spreadIndex={s.activeSpread} t={s.t}>
            <StudioInspector
              spreadIndex={s.activeSpread}
              page={s.page}
              stats={s.stats}
              path={s.path}
              source={s.source}
              setPageNumbers={s.setPageNumbers}
              t={s.t}
              locale={s.locale}
              onOpenPanel={setRailSection}
            />
          </StudioPaletteScope>
        </div>
        <StudioAssistantColumn assistant={assistant} title={s.journey?.title} bookVersion={s.bookVersion} />
        <StudioPageStage assistant={assistant} />

        {exporting && s.doc && (
          <StudioExport
            doc={s.doc}
            title={s.doc.title || s.journey?.title || ''}
            t={s.t}
            onClose={() => setExporting(false)}
          />
        )}
      </div>
    </>,
    document.body,
  )
}

export type Studio = ReturnType<typeof useJourneyStudio>

function Workbench({ s, bookView, setBookView }: { s: Studio; bookView: boolean; setBookView: (on: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <div className="st-work-wrap">
      <div className="st-work" ref={s.workRef}>
        <StudioCanvas
          spread={s.spread}
          spreadIndex={s.activeSpread}
          folios={s.doc ? foliosOf(s.doc.spreads, s.activeSpread, s.page.pageNumbers.startAt) : []}
          page={s.page}
          zoom={s.zoom}
          pxPerMm={s.pxPerMm}
          bookView={bookView}
          dropLabel={s.t('journey.studio.dropPhotoHere')}
          cursors={s.cursors}
          onCursor={(x, y) => s.moveCursor(s.activeSpread, x, y)}
          onDropFiles={s.canEdit ? s.dropFiles : undefined}
          fileDropLabel={s.t('journey.studio.dropFilesHere')}
        />
        {/*
          Pictures dropped on the sheet are on their way. The page keeps
          rendering underneath; the veil only says that something is happening
          where the pointer let go, so the second or two before the frame
          appears does not read as the drop having been ignored.
        */}
        {s.canvasUpload && (
          <div className="st-upload-veil" role="status" aria-live="polite">
            {s.t('journey.studio.uploading', { done: s.canvasUpload.done, total: s.canvasUpload.total })}
          </div>
        )}
      </div>

      <div className="st-zoom">
        <button type="button" onClick={() => s.stepZoom(-1)} disabled={!s.canZoomOut} aria-label={s.t('journey.studio.zoomOut')}>
          <Minus size={15} />
        </button>
        <span className="st-zoom-value">{s.zoomPercent}%</span>
        <button type="button" onClick={() => s.stepZoom(1)} disabled={!s.canZoomIn} aria-label={s.t('journey.studio.zoomIn')}>
          <Plus size={15} />
        </button>
        <button type="button" onClick={s.zoomToFit} aria-label={s.t('journey.studio.zoomFit')} title={s.t('journey.studio.zoomFit')}>
          <Maximize2 size={14} />
        </button>
        {/* How the page is looked at, so with the zoom rather than in the head band. */}
        <button type="button"
          onClick={() => setBookView(!bookView)}
          aria-pressed={bookView}
          aria-label={t('journey.studio.bookView')}
          title={t('journey.studio.bookView')}
          className={bookView ? 'is-on' : undefined}
        >
          <BookOpen size={14} />
        </button>
        {/*
          The page, as a file.

          Here rather than in a menu because it belongs to the spread on screen
          — the zoom bar is the only chrome that is about *this* page rather
          than about the book. What comes out is the design without the
          photographs, which is the thing worth passing on.
        */}
        <span className="st-zoom-sep" />
        <button type="button"
          onClick={() => s.spread && downloadSpread(s.spread, s.page, s.journey?.title || 'spread')}
          disabled={!s.spread}
          aria-label={s.t('journey.studio.downloadSpread')}
          title={s.t('journey.studio.downloadSpreadHint')}
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  )
}
