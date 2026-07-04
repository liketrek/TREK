import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Layers, Tag, Tags, CheckSquare } from 'lucide-react'
import type { StatusFilter } from '../../store/collectionStore'
import type { TranslationFn } from '../../types'
import { getCategoryIcon } from '../shared/categoryIcons'
import { STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { CategoryOption, LabelOption } from '../../pages/collections/collectionsModel'

interface Opt {
  key: string | number
  label: string
  icon?: React.ReactNode
  count?: number
}

/** Small custom dropdown — compact trigger + click-away popover. */
function Dropdown({ current, options, onSelect, lead }: {
  current: string | number
  options: Opt[]
  onSelect: (key: string | number) => void
  lead: React.ReactNode
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const cur = options.find(o => o.key === current) ?? options[0]
  return (
    <div className="col-filter" ref={ref}>
      <button type="button" className={`col-filter-btn${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {cur.icon ?? lead}
        <span className="col-filter-lbl">{cur.label}</span>
        <ChevronDown size={14} className="col-filter-chev" />
      </button>
      {open && (
        <div className="col-filter-pop" role="listbox">
          {options.map(o => (
            <button
              key={o.key}
              type="button"
              role="option"
              aria-selected={o.key === current}
              className={`col-filter-opt${o.key === current ? ' on' : ''}`}
              onClick={() => { onSelect(o.key); setOpen(false) }}
            >
              {o.icon ?? <span className="col-filter-dot ghost" />}
              <span className="col-filter-lbl">{o.label}</span>
              {o.count != null && <span className="col-filter-count">{o.count}</span>}
              {o.key === current && <Check size={13} className="col-filter-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface CollectionFilterBarProps {
  statusFilter: StatusFilter
  counts: Record<StatusFilter, number>
  categoryFilter: number | 'all'
  categoryOptions: CategoryOption[]
  onStatusFilter: (f: StatusFilter) => void
  onCategoryFilter: (f: number | 'all') => void
  // Per-collection labels (hidden on the "All saved" union).
  showLabels: boolean
  labelOptions: LabelOption[]
  labelFilter: number[]
  onLabelFilter: (ids: number[]) => void
  canManageLabels: boolean
  onManageLabels: () => void
  showSelect: boolean
  selectMode: boolean
  onToggleSelect: () => void
  t: TranslationFn
}

/**
 * Filter row above the places — a status dropdown (All / Idea / Want / Visited
 * with counts) and, when the list has categorised places, a category dropdown.
 * Custom compact dropdowns so they barely take any space.
 */
export default function CollectionFilterBar({
  statusFilter, counts, categoryFilter, categoryOptions, onStatusFilter, onCategoryFilter,
  showLabels, labelOptions, labelFilter, onLabelFilter, canManageLabels, onManageLabels,
  showSelect, selectMode, onToggleSelect, t,
}: CollectionFilterBarProps): React.ReactElement {
  const statusOpts: Opt[] = [
    { key: 'all', label: t('common.all'), count: counts.all },
    ...STATUS_ORDER.map(s => {
      const Icon = STATUS_META[s].icon
      return { key: s, label: t(STATUS_META[s].labelKey), icon: <Icon size={13} style={{ color: STATUS_META[s].color }} />, count: counts[s] }
    }),
  ]

  const catTotal = categoryOptions.reduce((n, c) => n + c.count, 0)
  const catOpts: Opt[] = [
    { key: 'all', label: t('common.all'), count: catTotal },
    ...categoryOptions.map(c => {
      const Icon = getCategoryIcon(c.icon ?? undefined)
      return { key: c.id, label: c.name, icon: <Icon size={13} style={{ color: c.color ?? undefined }} />, count: c.count }
    }),
  ]

  return (
    <div className="col-filterbar">
      <Dropdown current={statusFilter} options={statusOpts} onSelect={k => onStatusFilter(k as StatusFilter)} lead={<Layers size={13} />} />
      {categoryOptions.length > 0 && (
        <Dropdown current={categoryFilter} options={catOpts} onSelect={k => onCategoryFilter(k as number | 'all')} lead={<Tag size={13} />} />
      )}
      {showSelect && (
        <button type="button" onClick={onToggleSelect} className={`col-filter-btn col-filter-select${selectMode ? ' open' : ''}`} aria-pressed={selectMode}>
          <CheckSquare size={14} /> <span className="col-filter-lbl">{t('collections.select')}</span>
        </button>
      )}
      {showLabels && (labelOptions.length > 0 || canManageLabels) && (
        <div className="col-labelfilter">
          {labelOptions.map(l => {
            const on = labelFilter.includes(l.id)
            return (
              <button
                key={l.id}
                type="button"
                className={`col-labelchip${on ? ' on' : ''}`}
                style={{ ['--label' as string]: l.color ?? 'var(--accent)' }}
                onClick={() => onLabelFilter(on ? labelFilter.filter(id => id !== l.id) : [...labelFilter, l.id])}
                aria-pressed={on}
              >
                <span className="col-labelchip-dot" />
                <span className="col-filter-lbl">{l.name}</span>
                {l.count > 0 && <span className="col-filter-count">{l.count}</span>}
              </button>
            )
          })}
          {canManageLabels && (
            <button type="button" className="col-labelchip col-labelchip-manage" onClick={onManageLabels} title={t('collections.labels.manage')}>
              <Tags size={13} />
              <span className="col-filter-lbl">{labelOptions.length ? t('collections.labels.manage') : t('collections.labels.add')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
