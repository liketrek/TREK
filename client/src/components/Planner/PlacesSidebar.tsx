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
import DawarichSuggestionsPanel from '../Dawarich/DawarichSuggestionsPanel'
import { formatDayOption } from '../Dawarich/dawarichSuggestionModel'
import { refreshTripAfterAccept } from '../Dawarich/dawarichTripRefresh'
import { useTranslation } from '../../i18n'

const PlacesSidebar = React.memo(function PlacesSidebar(props: PlacesSidebarProps) {
  const S = usePlacesSidebar(props)
  const {
    sidebarDragOver, handleSidebarDragEnter, handleSidebarDragOver, handleSidebarDragLeave, handleSidebarDrop,
    selectMode, filtered, t, dayPickerPlace, listImportOpen,
    fileImportOpen, setFileImportOpen, sidebarDropFile, setSidebarDropFile, tripId, pushUndo,
    ctxMenu, isMobile, pendingDeleteIds, setPendingDeleteIds, onBulkDeleteConfirm,
    categories, selectedIds, exitSelectMode, onBulkChangeCategory, categoryPickerOpen, setCategoryPickerOpen,
    collectionsEnabled, saveToListOpen, setSaveToListOpen, days,
  } = S
  // The sidebar hook carries `t` but not the locale; day labels need both.
  const { locale } = useTranslation()
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
      className="relative flex h-full flex-col"
      style={{ fontFamily: 'var(--font-system)' }}
    >
      {!dragDisabled && sidebarDragOver && <PlacesDropOverlay {...S} />}
      <PlacesHeader {...S} />

      {/* No count line: the show filter in the head carries the number. */}
      <div className="h-2 flex-none" />

      {/* Liste, with the Dawarich stays riding on top of it inside the same scroller —
          see the `header` prop for why they are not a band of their own. */}
      <PlacesList
        {...S}
        header={(
          <div className="px-1 pb-2">
            <DawarichSuggestionsPanel
              tripId={tripId}
              trips={[{ id: tripId, label: t('dawarich.accept.thisTrip') }]}
              daysForTrip={() => days.map(day => ({
                id: day.id,
                ...formatDayOption(day.day_number, day.date, locale, t),
              }))}
              // The place it just created belongs on the map and in the list
              // now, not after a reload.
              onAccepted={() => { void refreshTripAfterAccept(tripId) }}
              initiallyCollapsed
            />
          </div>
        )}
      />

      {/* While picking, the bar with what to do with the picks rises at the foot of the column. */}
      {selectMode && <PlacesSelectionBar {...S} />}

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
