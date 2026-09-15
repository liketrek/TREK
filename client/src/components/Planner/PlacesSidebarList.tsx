import { Fragment } from 'react'
import EmptyState from '../shared/EmptyState'
import { MemoPlaceRow } from './PlacesSidebarRow'
import type { SidebarState } from './usePlacesSidebar'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'

export function PlacesList(S: SidebarState) {
  const {
    filtered, scrollContainerRef, onScrollTopChange, filter, t, canEditPlaces, onAddPlace,
    categories, selectedPlaceId, plannedIds, inDaySet, selectedIds, selectMode, selectedDayId,
    isMobile, onPlaceClick, openContextMenu, onAssignToDay, toggleSelected, setDayPickerPlace, registerPlaceRow, tripId,
  } = S
  // Plugin-contributed columns/actions for the places view, keyed by place id (#plugins).
  const contribFor = usePluginViewContributions('places', tripId)
  return (
    <div className="trek-stagger" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} ref={scrollContainerRef} onScroll={(e) => onScrollTopChange?.((e.currentTarget as HTMLElement).scrollTop)}>
      {filtered.length === 0 ? (
        /* The mascot and one line, the shape every other empty state in TREK has.
           The add link stays as the state's action: an empty list of places is
           one of the few that has an obvious next step. */
        <EmptyState
          scene="search"
          mood="sad"
          size={92}
          fill
          surface="var(--bg-secondary)"
          title={filter === 'unplanned' ? t('places.allPlanned') : t('places.noneFound')}
          action={canEditPlaces ? (
            <button
              type="button"
              onClick={onAddPlace}
              className="text-caption text-content underline underline-offset-2 hover:text-accent"
            >
              {t('places.addPlace')}
            </button>
          ) : undefined}
        />
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
