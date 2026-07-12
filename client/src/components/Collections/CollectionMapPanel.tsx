import React from 'react'
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import type { CollectionPlace } from '@trek/shared'
import type { TranslationFn } from '../../types'
import CollectionMap from './CollectionMap'

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
  t: TranslationFn
}

/**
 * The map surface for the collections page — the map plus its floating controls:
 * a top-left cluster (collapse/expand the list, toggle bulk-select) and a
 * top-right search box. Used both in the desktop split and the full-map view.
 */
export default function CollectionMapPanel({
  places, selectedPlaceId, onSelect, onDeselect, dark, overlay, view, onToggleView,
  search, onSearch, t,
}: CollectionMapPanelProps): React.ReactElement {
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
