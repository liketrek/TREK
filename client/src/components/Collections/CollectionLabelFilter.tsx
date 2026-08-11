import React from 'react'
import { Plus, Settings2, Tags } from 'lucide-react'
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

/**
 * The label filter, in one place because it has two homes.
 *
 * Labels are an axis of their own next to status, category and rating, so they
 * are grouped into a tray instead of joining the row as more loose buttons. On
 * a desktop it rides in the map's top bar, where there is room to spare; the
 * filter row keeps it whenever no map is on screen, so it never becomes
 * unreachable.
 */
export default function CollectionLabelFilter({
  labelOptions, labelFilter, onLabelFilter, canManageLabels = false, onManageLabels,
  variant = 'bar', t,
}: CollectionLabelFilterProps): React.ReactElement {
  return (
    <div
      className={`col-labelfilter${variant === 'map' ? ' on-map' : ''}`}
      role="group"
      aria-label={t('collections.labels.manage')}
    >
      <Tags size={13} className="col-labelfilter-lead" aria-hidden="true" />
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
      {canManageLabels && onManageLabels && (
        <button
          type="button"
          className="col-filter-addlabel"
          onClick={onManageLabels}
          title={labelOptions.length ? t('collections.labels.manage') : t('collections.labels.add')}
          aria-label={labelOptions.length ? t('collections.labels.manage') : t('collections.labels.add')}
        >
          {labelOptions.length ? <Settings2 size={13} /> : <Plus size={13} />}
        </button>
      )}
    </div>
  )
}
