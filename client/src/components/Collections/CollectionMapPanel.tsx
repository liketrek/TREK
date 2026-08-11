import React from 'react'
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import type { CollectionPlace } from '@trek/shared'
import type { TranslationFn } from '../../types'
import CollectionMap from './CollectionMap'
import CollectionLabelFilter, { type LabelOption } from './CollectionLabelFilter'

interface CollectionMapPanelProps {
  places: CollectionPlace[]
  selectedPlaceId: number | null
  onSelect: (id: number) => void
  onDeselect: () => void
  dark: boolean
  /** Render the floating map controls (desktop). Mobile drives view from the toolbar. */
  overlay: boolean
  /** 'list' = split (map can be expanded); 'map' = full (list collapsed). */
  view: 'list' | 'map'
  onToggleView: () => void
  search: string
  onSearch: (v: string) => void
  /**
   * The label filter rides along in the map's top bar, where there is room for
   * it. The filter row keeps it whenever no map is on screen, so it can never
   * become unreachable.
   */
  labelOptions?: LabelOption[]
  labelFilter?: number[]
  onLabelFilter?: (ids: number[]) => void
  canManageLabels?: boolean
  onManageLabels?: () => void
  t: TranslationFn
}

/**
 * The map surface for the collections page — the map plus its floating controls:
 * a top-left cluster (collapse/expand the list, toggle bulk-select) and a
 * top-right search box. Used both in the desktop split and the full-map view.
 */
export default function CollectionMapPanel({
  places, selectedPlaceId, onSelect, onDeselect, dark, overlay, view, onToggleView,
  search, onSearch, labelOptions = [], labelFilter = [], onLabelFilter, canManageLabels = false,
  onManageLabels, t,
}: CollectionMapPanelProps): React.ReactElement {
  const showLabels = onLabelFilter != null && (labelOptions.length > 0 || canManageLabels)
  return (
    <div className="col-map-shell">
      <CollectionMap
        places={places}
        selectedPlaceId={selectedPlaceId}
        onOpenPlace={onSelect}
        onDeselect={onDeselect}
        dark={dark}
      />
      {overlay && (
        <div className="col-map-topbar">
          <div className="col-map-group">
            <button
              type="button"
              onClick={onToggleView}
              className="col-map-btn"
              aria-label={view === 'map' ? t('collections.showList') : t('collections.expandMap')}
              title={view === 'map' ? t('collections.showList') : t('collections.expandMap')}
            >
              {view === 'map' ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
            {showLabels && (
              <CollectionLabelFilter
                variant="map"
                labelOptions={labelOptions}
                labelFilter={labelFilter}
                onLabelFilter={onLabelFilter!}
                canManageLabels={canManageLabels}
                onManageLabels={onManageLabels}
                t={t}
              />
            )}
          </div>
          <div className="col-map-group right">
            <div className="col-map-search">
              <Search size={15} />
              <input value={search} onChange={e => onSearch(e.target.value)} placeholder={t('collections.search')} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
