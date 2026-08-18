import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import {
  ArrowLeft, BookOpen, Check, ChevronDown, Download, Maximize2, Minus, Plus,
  Redo2, Sparkles, Undo2,
} from 'lucide-react'
import { useJourneyStudio } from '../../pages/journeyStudio/useJourneyStudio'
import { PAGE_PRESET_ORDER, PAGE_PRESETS } from './pagePresets'
import { StudioSidebar } from './StudioSidebar'
import { StudioCanvas } from './StudioCanvas'
import { StudioInspector } from './StudioInspector'
import '../../styles/dashboard.css'
import '../../styles/studio.css'

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
        <button
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
        <StudioBar s={s} bookView={bookView} setBookView={setBookView} />

        <div className="st-body">
          <StudioSidebar
            page={s.page}
            pxPerMm={s.pxPerMm}
            bookView={bookView}
            source={s.source}
            t={s.t}
            locale={s.locale}
          />
          <Workbench s={s} bookView={bookView} />
          <StudioInspector spreadIndex={s.activeSpread} page={s.page} t={s.t} />
        </div>
      </div>
    </>,
    document.body,
  )
}

type Studio = ReturnType<typeof useJourneyStudio>

function StudioBar({
  s, bookView, setBookView,
}: { s: Studio; bookView: boolean; setBookView: (v: boolean) => void }) {
  return (
    <div className="st-bar">
      <button onClick={s.close} className="st-back" title={s.t('journey.studio.backToJourney')}>
        <ArrowLeft size={16} />
        {s.coverUrl
          ? <img src={s.coverUrl} alt="" className="st-cover" />
          : <span className="st-cover" />}
        <span className="st-back-label">{s.journey?.title || s.t('journey.title')}</span>
      </button>

      <div className="st-sep" />

      <div className="st-name">
        <input
          value={s.bookName}
          onChange={e => s.renameBook(e.target.value)}
          placeholder={s.t('journey.studio.namePlaceholder')}
          aria-label={s.t('journey.studio.bookName')}
          spellCheck={false}
        />
      </div>

      <div className="st-bar-group">
        <button
          className={`st-tool ${bookView ? 'is-on' : ''}`}
          onClick={() => setBookView(!bookView)}
          title={s.t('journey.studio.bookView')}
        >
          <BookOpen size={14} />
          <span className="st-tool-label">{s.t('journey.studio.bookView')}</span>
        </button>

        <div className="st-sep" />

        <FormatPicker s={s} />

        <div className="st-sep" />

        <button
          className="st-tool is-icon"
          disabled={!s.canUndo}
          onClick={s.undo}
          title={s.t('journey.studio.undo')}
          aria-label={s.t('journey.studio.undo')}
        >
          <Undo2 size={15} />
        </button>
        <button
          className="st-tool is-icon"
          disabled={!s.canRedo}
          onClick={s.redo}
          title={s.t('journey.studio.redo')}
          aria-label={s.t('journey.studio.redo')}
        >
          <Redo2 size={15} />
        </button>

        <div className="st-sep" />

        <button className="st-tool" disabled title={s.t('journey.studio.autoLayout')}>
          <Sparkles size={14} />
          <span className="st-tool-label">{s.t('journey.studio.autoLayout')}</span>
        </button>
        <button className="st-tool is-primary" disabled title={s.t('journey.studio.export')}>
          <Download size={14} />
          <span className="st-tool-label">{s.t('journey.studio.export')}</span>
        </button>
      </div>
    </div>
  )
}

/**
 * The format picker.
 *
 * A native <select> was the first draft and it was wrong: the browser draws the
 * list in its own chrome, so it ignores the theme entirely and drops a list that
 * runs off the bottom of the screen. This is a small popover instead — themed,
 * anchored under the bar, and it shows each format's proportions rather than
 * only naming them.
 */
function FormatPicker({ s }: { s: Studio }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      // Swallow it, or the shell's Escape handler would close Studio itself.
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const active = PAGE_PRESETS[s.preset] ?? PAGE_PRESETS['square-210']

  return (
    <div className="st-picker" ref={box}>
      <button
        className="st-tool"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={s.t('journey.studio.format')}
      >
        <span className="st-tool-label">{s.t(active.labelKey)}</span>
        <ChevronDown size={13} style={{ opacity: .5 }} />
      </button>

      {open && (
        <div className="st-menu" role="listbox">
          {PAGE_PRESET_ORDER.map(id => {
            const p = PAGE_PRESETS[id]
            const on = id === s.preset
            return (
              <button
                key={id}
                role="option"
                aria-selected={on}
                className={`st-menu-item ${on ? 'is-active' : ''}`}
                onClick={() => { s.setPreset(id); setOpen(false) }}
              >
                <span className="st-menu-tile">
                  <span
                    className="st-menu-shape"
                    style={
                      p.pageWidthMm >= p.pageHeightMm
                        ? { width: 24, height: Math.round(24 * p.pageHeightMm / p.pageWidthMm) }
                        : { height: 24, width: Math.round(24 * p.pageWidthMm / p.pageHeightMm) }
                    }
                  />
                </span>
                <span className="st-menu-text">
                  <span className="st-menu-name">{s.t(p.labelKey)}</span>
                  <span className="st-menu-dim">{p.pageWidthMm} × {p.pageHeightMm} mm</span>
                </span>
                {on && <Check size={14} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Workbench({ s, bookView }: { s: Studio; bookView: boolean }) {
  return (
    <div className="st-work-wrap">
      <div className="st-work" ref={s.workRef}>
        <StudioCanvas
          spread={s.spread}
          spreadIndex={s.activeSpread}
          page={s.page}
          zoom={s.zoom}
          pxPerMm={s.pxPerMm}
          bookView={bookView}
          dropLabel={s.t('journey.studio.dropPhotoHere')}
        />
      </div>

      <div className="st-zoom">
        <button onClick={() => s.stepZoom(-1)} disabled={!s.canZoomOut} aria-label={s.t('journey.studio.zoomOut')}>
          <Minus size={15} />
        </button>
        <span className="st-zoom-value">{s.zoomPercent}%</span>
        <button onClick={() => s.stepZoom(1)} disabled={!s.canZoomIn} aria-label={s.t('journey.studio.zoomIn')}>
          <Plus size={15} />
        </button>
        <button onClick={s.zoomToFit} aria-label={s.t('journey.studio.zoomFit')} title={s.t('journey.studio.zoomFit')}>
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
