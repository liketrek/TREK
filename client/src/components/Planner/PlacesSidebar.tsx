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

const PlacesSidebar = React.memo(function PlacesSidebar(props: PlacesSidebarProps) {
  const S = usePlacesSidebar(props)
  const {
    sidebarDragOver, handleSidebarDragEnter, handleSidebarDragOver, handleSidebarDragLeave, handleSidebarDrop,
    selectMode, filtered, t, dayPickerPlace, listImportOpen,
    fileImportOpen, setFileImportOpen, sidebarDropFile, setSidebarDropFile, tripId, pushUndo,
    ctxMenu, isMobile, pendingDeleteIds, setPendingDeleteIds, onBulkDeleteConfirm,
  } = S
  return (
    <div
      onDragEnter={handleSidebarDragEnter}
      onDragOver={handleSidebarDragOver}
      onDragLeave={handleSidebarDragLeave}
      onDrop={handleSidebarDrop}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "var(--font-system)", position: 'relative' }}
    >
      {sidebarDragOver && <PlacesDropOverlay {...S} />}
      {/* Kopfbereich */}
      <PlacesHeader {...S} />

      {/* Anzahl / Auswahl-Leiste */}
      {selectMode ? (
        <PlacesSelectionBar {...S} />
      ) : (
        <div style={{ padding: '6px 16px', flexShrink: 0 }}>
          <span className="text-content-faint" style={{ fontSize: 11 }}>{filtered.length === 1 ? t('places.countSingular') : t('places.count', { count: filtered.length })}</span>
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
