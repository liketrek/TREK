import type { BookElement, BookPageNumbers, BookPageSetup, BookSpread, JourneyStats } from '@trek/shared'
import { withThemeLinks } from '@trek/shared'
import { ClipboardCopy, Copy, Lock, Trash2, Unlock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useStudioStore } from '../../store/studioStore'
import { Tooltip } from '../shared/Tooltip'
import '../../styles/studio-panels.css'
import { PanelHead } from './StudioPanelHead'
import { selectionTitle } from './studioLayerRows'
import { StudioArrangeSection } from './StudioArrangeSection'
import { TravelInspector } from './StudioTravelInspector'
import { StudioStickerInspector } from './StudioStickerInspector'
import { LineInspector } from './StudioLineInspector'
import { StudioDocumentInspector } from './inspector/StudioDocumentInspector'
import { StudioPositionSection } from './inspector/StudioPositionSection'
import { StudioTextInspector } from './inspector/StudioTextInspector'
import { StudioPhotoInspector } from './inspector/StudioPhotoInspector'
import { StudioShapeInspector } from './inspector/StudioShapeInspector'
import { StudioIconInspector } from './inspector/StudioIconInspector'
import { selectionKey } from './inspector/inspectorModel'
import type { RailSection } from './sidebar/railSections'
import type { JourneySource } from './StudioSidebar'

/**
 * Properties of whatever is selected.
 *
 * ── What it shows, and in what order ─────────────────────────────────────
 *
 * Deliberately narrow: what the selected thing actually has, and nothing else.
 * A panel that lists every property of every element with most of them greyed
 * out reads as a settings dialog, not as a tool.
 *
 * The order is the same for every kind, because the panel is used by muscle
 * memory more than by reading:
 *
 *   1. **what it is and what it says**: a text's words, a photo's crop, a
 *      shape's outline, a sticker's colours, a map's scope and framing;
 *   2. **where it sits**: the position and size, folded unless the element is
 *      turned or faded (or is a sticker, which is turned as a matter of course),
 *      and for several at once their angle and opacity without the frame;
 *   3. **how it looks**: type, colour, fill, frame;
 *   4. **the effects**: folded, and open on an element that uses them;
 *   5. **arrange**: lining up, stacking, grouping, the style clipboard.
 *
 * Every group mounts afresh for each selection (inspector/inspectorModel.ts),
 * so a folded group opens for the element that uses it and closes again for
 * the next one, and nothing is remembered behind the person's back.
 *
 * Duplicate, lock and delete are in the panel head rather than in a group of
 * their own: they act on the element rather than describing it.
 */

type Set = (patch: Partial<BookElement>) => void

export function StudioInspector({
  spreadIndex,
  page,
  stats,
  path,
  source,
  setPageNumbers,
  t,
  locale,
  onOpenPanel,
}: {
  spreadIndex: number
  page: BookPageSetup
  setPageNumbers: (patch: Partial<BookPageNumbers>) => void
  /** Live journey figures, so a travel element can be brought up to date. */
  stats: JourneyStats | null
  /** The journey's recorded way, thinned, so a map of the whole journey can be given it again. */
  path: [number, number][][]
  /** The journal itself, so a bound mark can be re-set from it. */
  source: JourneySource
  t: (k: string) => string
  locale: string
  /** Opens a panel of the rail on the other side: the Theme panel, or the Layers panel beside the selection. */
  onOpenPanel?: (section: RailSection) => void
}) {
  const doc = useStudioStore(s => s.doc)
  const selection = useStudioStore(s => s.selection)
  const update = useStudioStore(s => s.updateElement)
  const commit = useStudioStore(s => s.commit)

  const spread = doc?.spreads[spreadIndex]
  const sel = spread?.elements.filter(e => selection.includes(e.id)) ?? []
  const el = sel[0]

  if (!el) {
    return (
      <StudioDocumentInspector
        spreadIndex={spreadIndex}
        page={page}
        source={source}
        setPageNumbers={setPageNumbers}
        onOpenTheme={onOpenPanel && (() => onOpenPanel('theme'))}
        t={t}
      />
    )
  }

  const one = sel.length === 1

  // A property edit is one undo step on its own; only drags open a gesture.
  const set: Set = patch => commit(d => ({
    ...d,
    spreads: d.spreads.map((sp, i) => (i !== spreadIndex ? sp : {
      ...sp,
      // A colour or face set by hand stops following the theme; a link set here takes the theme's value.
      elements: sp.elements.map(e => (selection.includes(e.id) ? withThemeLinks({ ...e, ...patch } as BookElement, patch, d.theme) : e)),
    })),
  }))

  const live: Set = patch => update(spreadIndex, el.id, patch)

  return (
    <aside className="st-panel st-inspector">
      {/*
        The head says what is selected and carries the things you do TO it, in
        the head every panel opens on.
      */}
      <PanelHead
        label={one ? t(`journey.studio.kind.${el.kind}`) : selectionTitle(spread, selection, t)}
        count={sel.length > 1 ? sel.length : undefined}
        actions={<SelectionActions spreadIndex={spreadIndex} el={el} selection={selection} set={set} t={t} />}
      />

      <div className="st-panel-scroll" key={selectionKey(selection)}>
        <KindInspector
          el={el}
          one={one}
          spreadIndex={spreadIndex}
          spread={spread}
          page={page}
          selection={selection}
          stats={stats}
          path={path}
          source={source}
          set={set}
          live={live}
          position={<StudioPositionSection el={el} sel={sel} set={set} t={t} />}
          t={t}
          locale={locale}
        />
        <StudioArrangeSection
          spreadIndex={spreadIndex}
          t={t}
          onShowLayers={onOpenPanel && (() => onOpenPanel('layers'))}
        />
      </div>
    </aside>
  )
}

/** Copy to another page, duplicate, lock and delete: what you do to the selection, in the head. */
function SelectionActions({ spreadIndex, el, selection, set, t }: {
  spreadIndex: number
  el: BookElement
  selection: string[]
  set: Set
  t: (k: string) => string
}) {
  const duplicate = useStudioStore(s => s.duplicate)
  const copy = useStudioStore(s => s.copy)
  const removeElements = useStudioStore(s => s.removeElements)
  const lockLabel = t(el.locked ? 'journey.studio.unlock' : 'journey.studio.lock')
  return (
    <>
      <Tooltip label={t('journey.studio.copyToPage')}>
        <button type="button" className="st-act" onClick={() => copy(spreadIndex, selection)}
          aria-label={t('journey.studio.copyToPage')}>
          <ClipboardCopy size={14} />
        </button>
      </Tooltip>
      <button type="button" className="st-act" onClick={() => duplicate(spreadIndex, selection)}
        title={t('journey.studio.duplicate')} aria-label={t('journey.studio.duplicate')}>
        <Copy size={14} />
      </button>
      <button type="button" className={`st-act ${el.locked ? 'is-on' : ''}`} onClick={() => set({ locked: !el.locked })}
        title={lockLabel} aria-label={lockLabel} aria-pressed={el.locked}>
        {el.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>
      <button type="button" className="st-act is-danger" onClick={() => removeElements(spreadIndex, selection)}
        title={t('journey.studio.delete')} aria-label={t('journey.studio.delete')}>
        <Trash2 size={14} />
      </button>
    </>
  )
}

/** The groups of the selected kind, each placing the position group after what the element is. */
function KindInspector({ el, one, spreadIndex, spread, page, selection, stats, path, source, set, live, position, t, locale }: {
  el: BookElement
  one: boolean
  spreadIndex: number
  spread: BookSpread | undefined
  page: BookPageSetup
  selection: string[]
  stats: JourneyStats | null
  path: [number, number][][]
  source: JourneySource
  set: Set
  live: Set
  position: ReactNode
  t: (k: string) => string
  locale: string
}) {
  const theme = useStudioStore(s => s.doc?.theme)
  switch (el.kind) {
    case 'text':
      return (
        <StudioTextInspector el={el} set={set} live={live} source={source} spread={spread} theme={theme}
          position={position} t={t} />
      )
    case 'photo':
      return (
        <StudioPhotoInspector el={el} one={one} spreadIndex={spreadIndex} page={page} set={set} live={live}
          position={position} t={t} />
      )
    case 'shape':
      return (
        <StudioShapeInspector el={el} spreadIndex={spreadIndex} selection={selection} theme={theme} set={set}
          position={position} t={t} />
      )
    case 'icon':
      return <StudioIconInspector el={el} theme={theme} set={set} position={position} t={t} />
    case 'sticker':
      return <StudioStickerInspector el={el} set={set} position={position} t={t} />
    case 'line':
      return <LineInspector el={el} spreadIndex={spreadIndex} position={position} t={t} />
    case 'map':
    case 'stats':
    case 'countries':
    case 'badge':
    case 'list':
      return <TravelInspector el={el} stats={stats} path={path} set={set} t={t} locale={locale} position={position} />
    default:
      return <>{position}</>
  }
}
