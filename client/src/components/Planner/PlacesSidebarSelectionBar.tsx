import { Check, Trash2 } from 'lucide-react'
import Tooltip from '../shared/Tooltip'
import type { SidebarState } from './usePlacesSidebar'

export function PlacesSelectionBar(S: SidebarState) {
  const { t, selectedIds, filtered, setSelectedIds, isMobile, setPendingDeleteIds, onBulkDeletePlaces } = S
  return (
    <div style={{
      margin: '6px 16px', padding: '5px 8px 5px 10px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 11,
    }}>
      <span className="text-accent" style={{ flex: 1, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {t('places.selectionCount', { count: selectedIds.size })}
      </span>
      <Tooltip label={selectedIds.size === filtered.length && filtered.length > 0 ? t('common.deselectAll') : t('common.selectAll')} placement="bottom">
      <button
        onClick={() => {
          if (selectedIds.size === filtered.length) setSelectedIds(new Set())
          else setSelectedIds(new Set(filtered.map(p => p.id)))
        }}
        aria-label={selectedIds.size === filtered.length && filtered.length > 0 ? t('common.deselectAll') : t('common.selectAll')}
        className="bg-transparent text-content-muted"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 6, border: 'none',
          cursor: 'pointer', padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Check size={13} strokeWidth={2.2} />
      </button>
      </Tooltip>
      <Tooltip label={t('places.deleteSelected')} placement="bottom">
      <button
        onClick={() => {
          if (selectedIds.size === 0) return
          if (isMobile) setPendingDeleteIds(Array.from(selectedIds))
          else onBulkDeletePlaces?.(Array.from(selectedIds))
        }}
        disabled={selectedIds.size === 0}
        aria-label={t('places.deleteSelected')}
        className={selectedIds.size > 0 ? 'bg-transparent text-[#ef4444]' : 'bg-transparent text-content-faint'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 6, border: 'none',
          cursor: selectedIds.size > 0 ? 'pointer' : 'default', padding: 0,
        }}
        onMouseEnter={e => { if (selectedIds.size > 0) e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 14%, transparent)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Trash2 size={13} strokeWidth={2} />
      </button>
      </Tooltip>
    </div>
  )
}
