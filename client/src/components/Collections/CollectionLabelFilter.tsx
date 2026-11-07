import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Settings2, Tags } from 'lucide-react'
import type { LabelOption } from '../../pages/collections/collectionsModel'
import type { TranslationFn } from '../../types'

export type { LabelOption }

interface CollectionLabelFilterProps {
  labelOptions: LabelOption[]
  labelFilter: number[]
  onLabelFilter: (ids: number[]) => void
  canManageLabels?: boolean
  onManageLabels?: () => void
  /**
   * 'bar' is the filter row above the list, 'map' the strip floating over the
   * map, which needs the same glass treatment as the buttons beside it.
   */
  variant?: 'bar' | 'map'
  t: TranslationFn
}

interface ChipsProps {
  labelOptions: LabelOption[]
  labelFilter: number[]
  onToggle?: (id: number) => void
}

/** The label chips, as buttons, or as plain spans for the copy the map strip measures. */
function LabelChips({ labelOptions, labelFilter, onToggle }: ChipsProps): React.ReactElement {
  return (
    <>
      {labelOptions.map(l => {
        const on = labelFilter.includes(l.id)
        const body = (
          <>
            <span className="col-labelchip-dot" />
            <span className="col-filter-lbl">{l.name}</span>
            {l.count > 0 && <span className="col-filter-count">{l.count}</span>}
          </>
        )
        const style = { ['--label' as string]: l.color ?? 'var(--accent)' }
        if (!onToggle) return <span key={l.id} className={`col-labelchip${on ? ' on' : ''}`} style={style}>{body}</span>
        return (
          <button key={l.id} type="button" className={`col-labelchip${on ? ' on' : ''}`} style={style} onClick={() => onToggle(l.id)} aria-pressed={on}>
            {body}
          </button>
        )
      })}
    </>
  )
}

/**
 * Whether the map strip has to fold into its button: true once its chips need more room
 * than the slot beside the map's other controls. Measured on a hidden copy, so the strip
 * unfolds again as soon as the room comes back.
 */
function useFolds(enabled: boolean) {
  const slotRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [folded, setFolded] = useState(false)
  useLayoutEffect(() => {
    const slot = slotRef.current
    const measure = measureRef.current
    if (!enabled || !slot || !measure) return
    const check = () => setFolded(measure.scrollWidth > slot.clientWidth + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(slot)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [enabled])
  return { slotRef, measureRef, folded }
}

/** Open state of the folded strip's list: closed by a click beside it or Escape, like the filter row's dropdowns. */
function useFoldList(ref: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open, ref])
  return { open, setOpen }
}

/**
 * The label filter, in one place because it has two homes.
 *
 * Labels are an axis of their own next to status, category and rating, so they
 * are grouped into a tray instead of joining the row as more loose buttons. On
 * a desktop it rides in the map's top bar; when the bar has no room for every
 * label it folds into one button that opens them as a list, instead of hiding
 * the last ones behind a scroll nobody sees. The filter row keeps it whenever
 * no map is on screen, so it never becomes unreachable.
 */
export default function CollectionLabelFilter({
  labelOptions, labelFilter, onLabelFilter, canManageLabels = false, onManageLabels,
  variant = 'bar', t,
}: CollectionLabelFilterProps): React.ReactElement {
  const onMap = variant === 'map'
  const { slotRef, measureRef, folded } = useFolds(onMap)
  const fold = useFoldList(slotRef)
  const toggle = (id: number) => onLabelFilter(labelFilter.includes(id) ? labelFilter.filter(x => x !== id) : [...labelFilter, id])
  const manageLabel = labelOptions.length ? t('collections.labels.manage') : t('collections.labels.add')
  const manage = canManageLabels && onManageLabels && (
    <button type="button" className="col-filter-addlabel" onClick={onManageLabels} title={manageLabel} aria-label={manageLabel}>
      {labelOptions.length ? <Settings2 size={13} /> : <Plus size={13} />}
    </button>
  )

  const tray = (
    <div className={`col-labelfilter${onMap ? ' on-map' : ''}`} role="group" aria-label={t('collections.labels.manage')}>
      <Tags size={13} className="col-labelfilter-lead" aria-hidden="true" />
      <LabelChips labelOptions={labelOptions} labelFilter={labelFilter} onToggle={toggle} />
      {manage}
    </div>
  )
  if (!onMap) return tray

  const active = labelFilter.filter(id => labelOptions.some(l => l.id === id)).length
  return (
    <div className="col-labelfilter-slot" ref={slotRef}>
      {!folded ? tray : (
        <>
          <button
            type="button"
            onClick={() => fold.setOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={fold.open}
            className={`col-labelfilter on-map col-labelfilter-fold${fold.open ? ' open' : ''}`}
          >
            <Tags size={13} className="col-labelfilter-lead" aria-hidden="true" />
            <span className="col-filter-lbl">{t('collections.labels.title')}</span>
            {active > 0 && <span className="col-labelfilter-active">{active}</span>}
            <ChevronDown size={14} className="col-filter-chev" aria-hidden="true" />
          </button>
          {fold.open && (
            <div className="col-filter-pop col-labelfilter-pop" role="group" aria-label={t('collections.labels.title')}>
              {labelOptions.map(l => {
                const on = labelFilter.includes(l.id)
                return (
                  <button key={l.id} type="button" aria-pressed={on} className={`col-filter-opt${on ? ' on' : ''}`} onClick={() => toggle(l.id)}>
                    <span className="col-filter-dot" style={{ background: l.color ?? 'var(--accent)' }} />
                    <span className="col-filter-lbl">{l.name}</span>
                    {l.count > 0 && <span className="col-filter-count">{l.count}</span>}
                    {on && <Check size={13} className="col-filter-check" />}
                  </button>
                )
              })}
              {canManageLabels && onManageLabels && (
                <button type="button" className="col-filter-opt col-labelfilter-manage" onClick={() => { fold.setOpen(false); onManageLabels() }}>
                  {labelOptions.length ? <Settings2 size={13} /> : <Plus size={13} />}
                  <span className="col-filter-lbl">{manageLabel}</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
      <div className="col-labelfilter on-map col-labelfilter-measure" ref={measureRef} aria-hidden="true">
        <Tags size={13} className="col-labelfilter-lead" />
        <LabelChips labelOptions={labelOptions} labelFilter={labelFilter} />
        {canManageLabels && onManageLabels && <span className="col-filter-addlabel"><Settings2 size={13} /></span>}
      </div>
    </div>
  )
}
