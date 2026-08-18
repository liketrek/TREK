import { useMemo, useState } from 'react'
import {
  Circle, Files, ImageIcon, LayoutTemplate, Minus, Shapes, Square,
} from 'lucide-react'
import type { BookElement, BookPageSetup } from '@trek/shared'
import { useStudioStore } from '../../store/studioStore'
import { SpreadFold, SpreadView } from './SpreadView'
import { photoSrc } from './bookRender'
import { TEMPLATES, applyTemplate } from './templates'

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

type Section = 'pages' | 'content' | 'elements' | 'templates'

export interface JourneySource {
  entries: { id: number; title: string | null; story: string | null; location: string | null; date: string | null }[]
  photos: { photoId: number; caption?: string | null }[]
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`

export function StudioSidebar({
  page, pxPerMm, bookView, source, t,
}: {
  page: BookPageSetup
  pxPerMm: number
  bookView: boolean
  source: JourneySource
  t: (k: string) => string
}) {
  const [section, setSection] = useState<Section>('pages')

  const SECTIONS: { id: Section; icon: typeof Files; labelKey: string }[] = [
    { id: 'pages', icon: Files, labelKey: 'journey.studio.pages' },
    { id: 'content', icon: ImageIcon, labelKey: 'journey.studio.content' },
    { id: 'elements', icon: Shapes, labelKey: 'journey.studio.elements' },
    { id: 'templates', icon: LayoutTemplate, labelKey: 'journey.studio.templates' },
  ]

  return (
    <>
      <nav className="st-rail" aria-label={t('journey.studio.sections')}>
        {SECTIONS.map(sec => (
          <button
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
        {section === 'content' && <ContentPanel source={source} page={page} t={t} />}
        {section === 'elements' && <ElementsPanel page={page} t={t} />}
        {section === 'templates' && <TemplatesPanel page={page} pxPerMm={pxPerMm} t={t} onOpenContent={() => setSection('content')} />}
      </aside>
    </>
  )
}

function Head({ label, count }: { label: string; count?: number }) {
  return (
    <div className="st-panel-head">
      <span>{label}</span>
      {count != null && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>}
    </div>
  )
}

function PagesPanel({
  page, pxPerMm, bookView, t,
}: { page: BookPageSetup; pxPerMm: number; bookView: boolean; t: (k: string) => string }) {
  const doc = useStudioStore(s => s.doc)
  const active = useStudioStore(s => s.activeSpread)
  const setActive = useStudioStore(s => s.setActiveSpread)
  const spreads = doc?.spreads ?? []
  const THUMB_W = 196

  return (
    <>
      <Head label={t('journey.studio.pages')} count={spreads.length} />
      <div className="st-panel-scroll">
        <div className="st-thumbs">
          {spreads.map((sp, i) => {
            const single = sp.role !== 'inner'
            const wMm = single ? page.pageWidth : page.pageWidth * 2
            // The same component at a smaller scale, not a second drawing of the
            // page — a spread can never look different here than on the sheet.
            const scale = THUMB_W / (wMm * pxPerMm)
            return (
              <button
                key={sp.id}
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
                    <SpreadView spread={sp} page={page} />
                  </div>
                  {bookView && !single && <SpreadFold page={page} scaled={pxPerMm * scale} />}
                </div>
                <span className="st-thumb-label">
                  {sp.role === 'cover' ? t('journey.studio.cover')
                    : sp.role === 'back' ? t('journey.studio.backCover')
                    : `${i * 2} – ${i * 2 + 1}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

/**
 * The journey's own material.
 *
 * This is what separates a book maker from a drawing program: the pictures and
 * the words are already written, and the job is putting them on pages. Clicking
 * an item drops it on the current spread, centred, at a sensible size.
 */
function ContentPanel({
  source, page, t,
}: { source: JourneySource; page: BookPageSetup; t: (k: string) => string }) {
  const [tab, setTab] = useState<'photos' | 'text'>('photos')
  const addElement = useStudioStore(s => s.addElement)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]

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

  const dropText = (value: string, size: number, weight: 400 | 700, entryId: number, kind: 'entry.title' | 'entry.story' | 'entry.location' | 'entry.date') => {
    const w = page.pageWidth - 32
    addElement(active, {
      id: uid('t'), kind: 'text', frame: centre(w, size * 0.4 + 10),
      rotation: 0, opacity: 1, locked: false,
      text: value, font: 'sans', size, weight, italic: false,
      align: 'left', leading: weight === 700 ? 1.1 : 1.55, tracking: weight === 700 ? -0.02 : 0,
      color: '#1a1a1a', binding: { source: kind, entryId }, overridden: false,
    } as BookElement)
  }

  return (
    <>
      <Head label={t('journey.studio.content')} />
      <div className="st-tabs">
        <button className={tab === 'photos' ? 'is-on' : ''} onClick={() => setTab('photos')}>
          {t('journey.studio.photos')} <em>{source.photos.length}</em>
        </button>
        <button className={tab === 'text' ? 'is-on' : ''} onClick={() => setTab('text')}>
          {t('journey.studio.entries')} <em>{source.entries.length}</em>
        </button>
      </div>

      <div className="st-panel-scroll">
        {tab === 'photos' ? (
          <div className="st-photo-grid">
            {source.photos.map(p => (
              <button
                key={p.photoId}
                className="st-photo-cell"
                onClick={() => dropPhoto(p.photoId)}
                title={t('journey.studio.addToPage')}
                draggable
                onDragStart={e => {
                  // HTML5 drag is the right tool for exactly this shape of
                  // interaction — one item, from a list, onto a target — and it
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
            {!source.photos.length && <p className="st-hint">{t('journey.studio.noPhotos')}</p>}
          </div>
        ) : (
          <div className="st-entries">
            {source.entries.map(e => (
              <div key={e.id} className="st-entry">
                <div className="st-entry-head">{e.title || e.location || t('journey.studio.untitled')}</div>
                {e.date && <div className="st-entry-meta">{e.date}{e.location ? `  ·  ${e.location}` : ''}</div>}
                <div className="st-row" style={{ marginTop: 7 }}>
                  {e.title && (
                    <button className="st-chip" onClick={() => dropText(e.title!, 22, 700, e.id, 'entry.title')}>
                      {t('journey.studio.addTitle')}
                    </button>
                  )}
                  {e.story && (
                    <button className="st-chip" onClick={() => dropText(e.story!, 10, 400, e.id, 'entry.story')}>
                      {t('journey.studio.addStory')}
                    </button>
                  )}
                  {e.location && (
                    <button className="st-chip" onClick={() => dropText(e.location!, 8, 700, e.id, 'entry.location')}>
                      {t('journey.studio.addPlace')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ElementsPanel({ page, t }: { page: BookPageSetup; t: (k: string) => string }) {
  const addElement = useStudioStore(s => s.addElement)
  const active = useStudioStore(s => s.activeSpread)
  const doc = useStudioStore(s => s.doc)
  const spread = doc?.spreads[active]

  const centre = (w: number, h: number) => {
    const W = spread && spread.role !== 'inner' ? page.pageWidth : page.pageWidth * 2
    return { x: (W - w) / 2, y: (page.pageHeight - h) / 2, w, h }
  }

  const addText = (size: number, weight: 400 | 500 | 600 | 700, sample: string, extra: Partial<BookElement> = {}) =>
    addElement(active, {
      id: uid('t'), kind: 'text', frame: centre(page.pageWidth * 0.7, size * 0.5 + 8),
      rotation: 0, opacity: 1, locked: false,
      text: sample, font: 'sans', size, weight, italic: false,
      align: 'left', leading: size > 16 ? 1.1 : 1.5, tracking: size > 16 ? -0.02 : 0,
      color: '#1a1a1a', binding: null, overridden: false, ...extra,
    } as BookElement)

  const addShape = (shape: 'rect' | 'ellipse' | 'line') =>
    addElement(active, {
      id: uid('s'), kind: 'shape',
      frame: shape === 'line' ? centre(page.pageWidth * 0.5, 0.6) : centre(60, 60),
      rotation: 0, opacity: 1, locked: false,
      shape: shape === 'line' ? 'rect' : shape,
      fill: '#141414', gradient: 'none', stroke: null, strokeWidth: 0, radius: 0,
    } as BookElement)

  return (
    <>
      <Head label={t('journey.studio.elements')} />
      <div className="st-panel-scroll">
        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.text')}</div>
          <div className="st-stack">
            <button className="st-tile" onClick={() => addText(30, 700, t('journey.studio.sampleHeading'))}>
              <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('journey.studio.styleTitle')}</span>
            </button>
            <button className="st-tile" onClick={() => addText(16, 600, t('journey.studio.sampleSubheading'))}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t('journey.studio.styleSubtitle')}</span>
            </button>
            <button className="st-tile" onClick={() => addText(10, 400, t('journey.studio.sampleBody'))}>
              <span style={{ fontSize: 12.5 }}>{t('journey.studio.styleBody')}</span>
            </button>
            <button
              className="st-tile"
              onClick={() => addText(7.5, 600, t('journey.studio.sampleCaption'), { tracking: 0.14, color: '#8a8578' })}
            >
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {t('journey.studio.styleCaption')}
              </span>
            </button>
          </div>
        </div>

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.shapes')}</div>
          <div className="st-shape-grid">
            <button className="st-shape-btn" onClick={() => addShape('rect')} title={t('journey.studio.shapeKind.rect')}>
              <Square size={20} strokeWidth={1.6} />
            </button>
            <button className="st-shape-btn" onClick={() => addShape('ellipse')} title={t('journey.studio.shapeKind.ellipse')}>
              <Circle size={20} strokeWidth={1.6} />
            </button>
            <button className="st-shape-btn" onClick={() => addShape('line')} title={t('journey.studio.shapeKind.line')}>
              <Minus size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="st-section">
          <div className="st-section-label">{t('journey.studio.frames')}</div>
          <div className="st-shape-grid">
            <button
              className="st-shape-btn"
              onClick={() => addElement(active, {
                id: uid('p'), kind: 'photo',
                frame: centre(page.pageWidth * 0.5, page.pageWidth * 0.38),
                rotation: 0, opacity: 1, locked: false,
                photoId: null, fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none',
              } as BookElement)}
              title={t('journey.studio.emptyFrame')}
            >
              <ImageIcon size={20} strokeWidth={1.6} />
            </button>
          </div>
          <p className="st-hint" style={{ paddingTop: 8 }}>{t('journey.studio.frameHint')}</p>
        </div>
      </div>
    </>
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

  const CARD_W = 196
  const scale = useMemo(() => CARD_W / (page.pageWidth * 2 * pxPerMm), [page.pageWidth, pxPerMm])

  if (!spread) return null
  const single = spread.role !== 'inner'

  return (
    <>
      <Head label={t('journey.studio.templates')} count={TEMPLATES.length} />
      <div className="st-panel-scroll">
        {single ? (
          <p className="st-hint">{t('journey.studio.templatesCoverHint')}</p>
        ) : (
          <div className="st-thumbs">
            {TEMPLATES.map(tpl => {
              const slots = tpl.build(page)
              return (
                <button
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
                    <span
                      className="st-tpl-fold"
                      style={{ left: page.pageWidth * pxPerMm * scale }}
                    />
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
