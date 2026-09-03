import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import type { JourneySource, StudioT } from './StudioSidebar'
import type { PhotoFilter } from './photoFilter'

/**
 * Which day's pictures the content browser is showing.
 *
 * A row of its own under the tabs rather than a control inside the search box:
 * the search answers "which words" and this answers "which day", and the two
 * combine. It takes the panel's full width, so the entry in force reads as a
 * heading over the grid rather than as one control among several, and a long
 * entry name has somewhere to go.
 *
 * The popover is the top bar's format menu, hung from the left edge instead of
 * the right: the side panel is 236px wide and a menu anchored right would open
 * into the rail.
 */
export function StudioContentFilter({
  source, filter, setFilter, admitted, pageEntryId, t, locale,
}: {
  source: JourneySource
  filter: PhotoFilter
  setFilter: (f: PhotoFilter) => void
  /** How many pictures the current filter admits, for the chip's own count. */
  admitted: number
  /** The entry the spread on the sheet was laid out from, when it has one. */
  pageEntryId: number | null
  t: StudioT
  locale: string
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      // Swallowed, as the format picker does it: the shell's Escape closes Studio.
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const pick = (f: PhotoFilter) => { setFilter(f); setOpen(false) }
  const withPhotos = source.entries.filter(e => e.photoIds.length > 0)
  const looseCount = source.photos.filter(p => !p.entryIds.length).length
  const nameOf = (e: { title: string | null; location: string | null } | undefined) =>
    e?.title || e?.location || t('journey.studio.untitled')

  const label = filter.kind === 'loose' ? t('journey.studio.filterLoose')
    : filter.kind === 'recent' ? t('journey.studio.filterRecent')
    : filter.kind === 'entry' ? nameOf(source.entries.find(e => e.id === filter.id))
    : t('journey.studio.filterAll')

  /*
   * The page on the sheet belongs to a day, so its pictures are one press
   * away. Offered only while the filter is not already there: a chip for the
   * state you are in is a chip that does nothing.
   */
  const pageEntry = pageEntryId != null ? withPhotos.find(e => e.id === pageEntryId) : undefined
  const offerThisPage = pageEntry && !(filter.kind === 'entry' && filter.id === pageEntry.id)

  return (
    <div className="st-filter-row">
      <div className="st-picker" ref={box}>
        <span className={`st-chip st-filter-chip ${filter.kind !== 'all' ? 'is-on' : ''}`}>
          <button type="button"
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            title={t('journey.studio.filterPhotos')}
          >
            <span className="st-filter-name">{label}</span>
            <em>{admitted}</em>
            <ChevronDown size={12} style={{ opacity: .5 }} />
          </button>
          {filter.kind !== 'all' && (
            <button type="button" onClick={() => setFilter({ kind: 'all' })} aria-label={t('common.clear')}>
              <X size={12} />
            </button>
          )}
        </span>

        {open && (
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
  )
}

/** One line of the menu: a name, a count, and a tick on the one in force. */
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
