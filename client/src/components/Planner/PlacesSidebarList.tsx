import { Fragment } from 'react'
import { MemoPlaceRow } from './PlacesSidebarRow'
import type { SidebarState } from './usePlacesSidebar'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'

export function PlacesList(S: SidebarState) {
  const {
    filtered, scrollContainerRef, onScrollTopChange, filter, t, canEditPlaces, onAddPlace,
    categories, selectedPlaceId, plannedIds, inDaySet, selectedIds, selectMode, selectedDayId,
    isMobile, isTouch, onPlaceClick, openContextMenu, onAssignToDay, toggleSelected, setDayPickerPlace, registerPlaceRow, tripId,
  } = S
  // Plugin-contributed columns/actions for the places view, keyed by place id (#plugins).
  const contribFor = usePluginViewContributions('places', tripId)
  return (
    <div className="trek-stagger" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} ref={scrollContainerRef} onScroll={(e) => onScrollTopChange?.((e.currentTarget as HTMLElement).scrollTop)}>
      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', gap: 8 }}>
          <span className="text-content-faint" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>
            {filter === 'unplanned' ? t('places.allPlanned') : t('places.noneFound')}
          </span>
          {canEditPlaces && <button onClick={onAddPlace} className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
            {t('places.addPlace')}
          </button>}
        </div>
      ) : (
        filtered.map(place => {
          const cat = categories.find(c => c.id === place.category_id)
          const isSelected = place.id === selectedPlaceId
          const isPlanned = plannedIds.has(place.id)
          const inDay = inDaySet.has(place.id)
          const isChecked = selectedIds.has(place.id)
          const contributions = contribFor(place.id)
          return (
            <Fragment key={place.id}>
              <MemoPlaceRow
                place={place}
                category={cat}
                isSelected={isSelected}
                isPlanned={isPlanned}
                inDay={inDay}
                isChecked={isChecked}
                selectMode={selectMode}
                selectedDayId={selectedDayId}
                canEditPlaces={canEditPlaces}
                isMobile={isMobile}
                isTouch={Boolean(isTouch)}
                t={t}
                onPlaceClick={onPlaceClick}
                onContextMenu={openContextMenu}
                onAssignToDay={onAssignToDay}
                toggleSelected={toggleSelected}
                setDayPickerPlace={setDayPickerPlace}
                registerPlaceRow={registerPlaceRow}
              />
              {contributions.length > 0 && (
                <div style={{ padding: '0 14px 8px 16px' }}><PluginCardFooter items={contributions} tripId={tripId} /></div>
              )}
            </Fragment>
          )
        })
      )}
    </div>
  )
}
