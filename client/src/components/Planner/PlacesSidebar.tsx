import React from 'react'
import { ContextMenu } from '../shared/ContextMenu'
import FileImportModal from './FileImportModal'
import ConfirmDialog from '../shared/ConfirmDialog'
import { usePlacesSidebar, type PlacesSidebarProps } from './usePlacesSidebar'
import { PlacesDropOverlay, PlacesHeader } from './PlacesSidebarHeader'
import { PlacesSelectionBar } from './PlacesSidebarSelectionBar'
import { PlacesList } from './PlacesSidebarList'
import { MobileDayPickerSheet } from './PlacesSidebarMobileDayPicker'
import { ListImportModal } from './PlacesSidebarListImportModal'
import { PlacesBulkCategoryModal } from './PlacesBulkCategoryModal'
import SaveTripPlacesToListModal from '../Collections/SaveTripPlacesToListModal'

const PlacesSidebar = React.memo(function PlacesSidebar(props: PlacesSidebarProps) {
  const S = usePlacesSidebar(props)
  const {
    sidebarDragOver, handleSidebarDragEnter, handleSidebarDragOver, handleSidebarDragLeave, handleSidebarDrop,
    selectMode, filtered, t, dayPickerPlace, listImportOpen,
    fileImportOpen, setFileImportOpen, sidebarDropFile, setSidebarDropFile, tripId, pushUndo,
    ctxMenu, isMobile, pendingDeleteIds, setPendingDeleteIds, onBulkDeleteConfirm,
    categories, selectedIds, exitSelectMode, onBulkChangeCategory, categoryPickerOpen, setCategoryPickerOpen,
    collectionsEnabled, saveToListOpen, setSaveToListOpen,
  } = S
  // Below lg the places sit in their own tab with no plan beside them to drag
  // into. A coarse pointer no longer disables the drag on its own — tablets
  // reach it through a long press (#1616).
  const dragDisabled = isMobile
  return (
    <div
      data-touch-drag={dragDisabled ? undefined : ''}
      onDragEnter={dragDisabled ? undefined : handleSidebarDragEnter}
      onDragOver={dragDisabled ? undefined : handleSidebarDragOver}
      onDragLeave={dragDisabled ? undefined : handleSidebarDragLeave}
      onDrop={dragDisabled ? undefined : handleSidebarDrop}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "var(--font-system)", position: 'relative' }}
    >
      {!dragDisabled && sidebarDragOver && <PlacesDropOverlay {...S} />}
      {/* Kopfbereich */}
      <PlacesHeader {...S} />

      {/* Anzahl / Auswahl-Leiste */}
      {selectMode ? (
        <PlacesSelectionBar {...S} />
      ) : (
        <div style={{ padding: '6px 16px', flexShrink: 0 }}>
          {/* A badge across the whole rail rather than a line of text hugging the
              left edge: it reads as the list's header instead of as a stray label.
              Outlined rather than filled, because the tertiary surface is a slate
              tone and put a blue cast on the panel. */}
          <div className="text-content-faint" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px 10px', borderRadius: 99,
            background: 'transparent', border: '1px solid var(--border-faint)',
            fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {filtered.length === 1 ? t('places.countSingular') : t('places.count', { count: filtered.length })}
          </div>
        </div>
      )}

      {/* Liste */}
      <PlacesList {...S} />

      {dayPickerPlace && <MobileDayPickerSheet {...S} />}
      {listImportOpen && <ListImportModal {...S} />}
      <FileImportModal
        isOpen={fileImportOpen}
        onClose={() => { setFileImportOpen(false); setSidebarDropFile(null) }}
        tripId={tripId}
        pushUndo={pushUndo}
        initialFile={sidebarDropFile}
      />
      <ContextMenu menu={ctxMenu.menu} onClose={ctxMenu.close} />
      {categoryPickerOpen && (
        <PlacesBulkCategoryModal
          count={selectedIds.size}
          categories={categories}
          onClose={() => setCategoryPickerOpen(false)}
          onPick={(catId) => { onBulkChangeCategory?.(Array.from(selectedIds), catId); setCategoryPickerOpen(false); exitSelectMode() }}
        />
      )}
      {collectionsEnabled && (
        <SaveTripPlacesToListModal
          isOpen={saveToListOpen}
          tripId={tripId}
          placeIds={Array.from(selectedIds)}
          onClose={() => setSaveToListOpen(false)}
          onDone={exitSelectMode}
        />
      )}
      {isMobile && (
        <ConfirmDialog
          isOpen={!!pendingDeleteIds?.length}
          onClose={() => setPendingDeleteIds(null)}
          onConfirm={() => { onBulkDeleteConfirm?.(pendingDeleteIds!); setPendingDeleteIds(null) }}
          message={t('trip.confirm.deletePlaces', { count: pendingDeleteIds?.length ?? 0 })}
        />
      )}
    </div>
  )
})

export default PlacesSidebar
