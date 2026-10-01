import type { MouseEvent, ReactNode } from 'react'
import { Bookmark, CheckCheck, CheckCircle2, Loader2, Tag, Trash2, X } from 'lucide-react'
import { fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import type { SidebarState } from './usePlacesSidebar'

/** An action on the dark selection bar: an icon named by its tooltip. */
function BarAction({ label, onClick, disabled = false, danger = false, children }: {
  label: string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip label={label} placement="top">
      <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
        className={`grid h-8 w-8 flex-none place-items-center rounded-[10px] transition-colors enabled:hover:bg-[color:color-mix(in_srgb,var(--accent-text)_14%,transparent)] disabled:cursor-default disabled:opacity-35 ${danger ? 'text-danger' : ''}`}>
        {children}
      </button>
    </Tooltip>
  )
}

/**
 * The bar that rises at the foot of the column while places are being picked:
 * how many, what to do with them, and the way out. Dark like a toast, so it
 * reads as the one thing in charge while the list is in this mode.
 */
export function PlacesSelectionBar(S: SidebarState) {
  const { t, selectedIds, filtered, setSelectedIds, isMobile, setPendingDeleteIds, onBulkDeletePlaces, setCategoryPickerOpen, collectionsEnabled, setSaveToListOpen, markSelectionVisited, markVisitedBusy, exitSelectMode } = S
  const none = selectedIds.size === 0
  // An empty list keeps "Select all": 0 === 0 would otherwise read as everything selected.
  const allLabel = selectedIds.size === filtered.length && filtered.length > 0 ? t('common.deselectAll') : t('common.selectAll')
  return (
    <div className="flex-none p-2">
      <div className="flex items-center gap-0.5 rounded-[14px] bg-accent py-1 pl-1.5 pr-1 text-accent-text shadow-lg">
        {/* Just the number, on a white badge: the words are its name and its tooltip. */}
        <Tooltip label={t('places.selectionCount', { count: selectedIds.size })} placement="top">
          <span role="status" aria-label={t('places.selectionCount', { count: selectedIds.size })}
            className="grid h-7 min-w-7 flex-none place-items-center rounded-full bg-surface-card px-2 font-geist font-bold tabular-nums text-content"
            style={fs(12.5, 'body')}>
            {selectedIds.size}
          </span>
        </Tooltip>
        <span className="flex-1" />
        <BarAction
          label={allLabel}
          onClick={() => {
            if (selectedIds.size === filtered.length) setSelectedIds(new Set())
            else setSelectedIds(new Set(filtered.map(p => p.id)))
          }}
        >
          <CheckCheck size={15} strokeWidth={2} />
        </BarAction>
        <BarAction label={t('places.changeCategory')} disabled={none} onClick={() => { if (none) return; setCategoryPickerOpen(true) }}>
          <Tag size={14} strokeWidth={2} />
        </BarAction>
        {collectionsEnabled && (
          <BarAction label={t('inspector.saveToCollection')} disabled={none} onClick={() => { if (none) return; setSaveToListOpen(true) }}>
            <Bookmark size={14} strokeWidth={2} />
          </BarAction>
        )}
        {collectionsEnabled && (
          <BarAction label={t('collections.markVisitedSelection')} disabled={none || markVisitedBusy} onClick={() => { if (none) return; void markSelectionVisited() }}>
            {markVisitedBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2} />}
          </BarAction>
        )}
        <BarAction
          label={t('places.deleteSelected')}
          disabled={none}
          danger
          onClick={() => {
            if (none) return
            if (isMobile) setPendingDeleteIds(Array.from(selectedIds))
            else onBulkDeletePlaces?.(Array.from(selectedIds))
          }}
        >
          <Trash2 size={14} strokeWidth={2} />
        </BarAction>
        <span className="mx-1 h-5 w-px flex-none bg-[color:color-mix(in_srgb,var(--accent-text)_22%,transparent)]" />
        <BarAction label={t('packing.editDone')} onClick={exitSelectMode}>
          <X size={15} strokeWidth={2.2} />
        </BarAction>
      </div>
    </div>
  )
}
