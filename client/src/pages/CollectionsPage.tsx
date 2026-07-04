import React from 'react'
import { List as ListIcon, Map as MapIcon, Search, Bookmark, CheckCheck, X, Trash2, Copy, CopyPlus, FolderInput, Plus, Tags } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'
import Modal from '../components/shared/Modal'
import ListsRail from '../components/Collections/ListsRail'
import ListEditorModal from '../components/Collections/ListEditorModal'
import CollectionHero from '../components/Collections/CollectionHero'
import CollectionList from '../components/Collections/CollectionList'
import CollectionFilterBar from '../components/Collections/CollectionFilterBar'
import CollectionMapPanel from '../components/Collections/CollectionMapPanel'
import CopyToTripModal from '../components/Collections/CopyToTripModal'
import MoveToListModal from '../components/Collections/MoveToListModal'
import ShareCollectionModal from '../components/Collections/ShareCollectionModal'
import AddPlaceToCollectionModal from '../components/Collections/AddPlaceToCollectionModal'
import CollectionPlaceDetail from '../components/Collections/CollectionPlaceDetail'
import LabelManager from '../components/Collections/LabelManager'
import BulkAssignLabelModal from '../components/Collections/BulkAssignLabelModal'
import { useCollections } from './collections/useCollections'
import '../styles/dashboard.css'
import '../styles/collections.css'

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }): React.ReactElement {
  return (
    <div className="col-emptystate">
      <div className="ic">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  )
}

export default function CollectionsPage(): React.ReactElement {
  const c = useCollections()
  const { t } = c

  const title = c.isAllSaved ? t('collections.allSaved') : (c.activeCollection?.name ?? t('collections.title'))
  const isShared = c.activeCollection?.is_owner === false
  const eyebrow = c.isAllSaved ? t('collections.hero.all') : (isShared ? t('collections.hero.shared') : t('collections.hero.mine'))
  const heroColor = c.activeCollection?.color || '#6366f1'
  const heroCover = c.activeCollection?.cover_image ?? null

  const hasPlaces = c.places.length > 0
  const noLists = !c.loading && c.collections.length === 0
  const showSelect = c.isAllSaved || c.activeCollection != null
  // Labels are per-collection, so only on a real (non "All saved") list.
  const isRealList = !c.isAllSaved && typeof c.activeId === 'number'
  const canManageLabels = isRealList && c.canEdit

  // Selecting a place toggles it, so clicking it again — or the map background —
  // clears it. Below the desktop breakpoint the list and map are separate views;
  // above it the list view is a split with a persistent map that pans to the
  // selection (the map stays mounted across the list↔map toggle so it animates).
  const mappable = c.mappable
  const openPlace = (id: number) => c.setSelectedPlaceId(c.selectedPlaceId === id ? null : id)
  const deselect = () => c.setSelectedPlaceId(null)
  const toggleView = () => {
    // Going to the full-map view closes the (list-docked) detail sheet.
    if (c.view !== 'map') c.setSelectedPlaceId(null)
    c.setView(c.view === 'map' ? 'list' : 'map')
  }
  // Clicking a marker in the full-map view drops back to the split so the list
  // + detail come into view alongside the map.
  const onMapSelect = (id: number) => { openPlace(id); if (c.view === 'map') c.setView('list') }

  const desktopSplit = c.isWide && mappable.length > 0
  const mapShown = mappable.length > 0 && (c.view === 'map' || c.isWide)
  const mapOverlay = c.isWide && mapShown // the map carries the toggle + search
  const canAddPlace = typeof c.activeId === 'number' && c.canEdit // a real list you can edit

  const listEl = (
    <CollectionList
      places={c.visiblePlaces}
      labels={c.labels}
      selectedPlaceId={c.selectedPlaceId}
      selectMode={c.selectMode}
      selectedIds={c.selectedIds}
      onOpenPlace={openPlace}
      onStatusChange={c.canEdit ? c.handleStatusChange : undefined}
      onToggleSelect={c.toggleSelect}
      t={t}
    />
  )
  const mapPanel = (overlay: boolean) => (
    <CollectionMapPanel
      places={mappable}
      selectedPlaceId={c.selectedPlaceId}
      onSelect={onMapSelect}
      onDeselect={deselect}
      dark={c.dark}
      overlay={overlay}
      view={c.view}
      onToggleView={toggleView}
      canAddPlace={canAddPlace}
      onAddPlace={() => c.setShowAddPlace(true)}
      search={c.search}
      onSearch={c.setSearch}
      t={t}
    />
  )

  // Filter row + the list (or a "no match" note when a filter hides everything).
  // Kept together so the filters stay reachable even when nothing matches.
  const filterBar = hasPlaces ? (
    <CollectionFilterBar
      statusFilter={c.statusFilter}
      counts={c.counts}
      categoryFilter={c.categoryFilter}
      categoryOptions={c.categoryOptions}
      onStatusFilter={c.setStatusFilter}
      onCategoryFilter={c.setCategoryFilter}
      showLabels={isRealList}
      labelOptions={c.labelOptions}
      labelFilter={c.labelFilter}
      onLabelFilter={c.setLabelFilter}
      canManageLabels={canManageLabels}
      onManageLabels={() => c.setShowLabelManager(true)}
      showSelect={showSelect}
      selectMode={c.selectMode}
      onToggleSelect={() => c.setSelectMode(!c.selectMode)}
      t={t}
    />
  ) : null
  const listColumn = (
    <>
      {filterBar}
      {c.visiblePlaces.length > 0
        ? listEl
        : <EmptyState icon={<Search size={26} />} title={t('collections.empty.noMatchTitle')} text={t('collections.empty.noMatchText')} />}
    </>
  )

  let body: React.ReactElement
  if (c.placesLoading && !hasPlaces) {
    body = <div className="col-loading"><div className="col-spinner" /></div>
  } else if (!hasPlaces) {
    body = <EmptyState icon={<Bookmark size={26} />} title={t('collections.empty.title')} text={t('collections.empty.text')} />
  } else if (desktopSplit) {
    body = (
      <div className={`col-split${c.view === 'map' ? ' map-full' : ''}`}>
        <div className="col-split-list" ref={c.listColRef}>{listColumn}</div>
        <div className="col-split-map">{mapPanel(true)}</div>
      </div>
    )
  } else if (c.view === 'map' && mappable.length > 0) {
    body = <div className="col-mapwrap">{mapPanel(false)}</div>
  } else {
    body = listColumn
  }

  const rail = (
    <ListsRail
      ownedLists={c.ownedLists}
      sharedLists={c.sharedLists}
      activeId={c.activeId}
      incomingInvites={c.incomingInvites}
      onSelect={c.handleSelectList}
      onNewList={() => { c.setMobileRailOpen(false); c.setEditorTarget('new') }}
      onAcceptInvite={c.handleAcceptInvite}
      onDeclineInvite={c.handleDeclineInvite}
      t={t}
    />
  )

  return (
    <>
      <Navbar />
      <div className="trek-dash col-root">
        <div className="col-page">
          <aside className="col-rail" style={{ minHeight: c.heroHeight || undefined }}>{rail}</aside>

          <div className="col-body">
            {noLists ? (
              <EmptyState
                icon={<Bookmark size={26} />}
                title={t('collections.empty.firstTitle')}
                text={t('collections.empty.firstText')}
                action={
                  <button type="button" onClick={() => c.setEditorTarget('new')} className="col-cta">
                    <Bookmark size={16} /> {t('collections.newList')}
                  </button>
                }
              />
            ) : (
              <>
                <div ref={c.heroRef}>
                  <CollectionHero
                    eyebrow={eyebrow}
                    title={title}
                    color={heroColor}
                    coverImage={heroCover}
                    description={c.isAllSaved ? null : (c.activeCollection?.description ?? null)}
                    links={c.isAllSaved ? undefined : c.activeCollection?.links}
                    members={c.members}
                    canShare={c.canShare}
                    isOwner={c.isOwner}
                    canEdit={!c.isAllSaved && c.isOwner && c.activeCollection != null}
                    onEdit={() => { if (c.activeCollection) c.setEditorTarget(c.activeCollection) }}
                    shareMemberCount={c.shareMemberCount}
                    onShare={() => c.setShowShare(true)}
                    t={t}
                  />
                </div>

                {!mapOverlay && (
                  <div className="col-toolbar">
                    <button type="button" className="col-rail-toggle" onClick={() => c.setMobileRailOpen(true)}>
                      <Bookmark size={15} /> {t('collections.title')}
                    </button>
                    {!c.isWide && mappable.length > 0 && (
                      <div className="col-viewseg" role="group" aria-label={t('collections.title')}>
                        <button type="button" aria-pressed={c.view === 'list'} onClick={() => c.setView('list')} aria-label={t('collections.view.list')} title={t('collections.view.list')} className={c.view === 'list' ? 'on' : ''}>
                          <ListIcon size={16} />
                        </button>
                        <button type="button" aria-pressed={c.view === 'map'} onClick={() => c.setView('map')} aria-label={t('collections.view.map')} title={t('collections.view.map')} className={c.view === 'map' ? 'on' : ''}>
                          <MapIcon size={16} />
                        </button>
                      </div>
                    )}
                    {canAddPlace && (
                      <button type="button" onClick={() => c.setShowAddPlace(true)} className="col-iconbtn" aria-label={t('collections.addPlace')} title={t('collections.addPlace')}>
                        <Plus size={16} />
                      </button>
                    )}
                    <div className="col-toolbar-spacer" />
                    {!mapOverlay && (
                      <div className="col-search">
                        <Search size={15} />
                        <input
                          value={c.search}
                          onChange={e => c.setSearch(e.target.value)}
                          placeholder={t('collections.search')}
                        />
                      </div>
                    )}
                  </div>
                )}

                {c.selectMode && (
                  <div className="col-selbar">
                    <button type="button" onClick={c.handleSelectAll} className="col-selbar-btn">
                      <CheckCheck size={14} /> {c.allVisibleSelected ? t('collections.deselectAll') : t('collections.selectAll')}
                    </button>
                    <span className="lbl">{t('collections.selectedCount', { count: c.selectedIds.length })}</span>
                    <div className="col-toolbar-spacer" />
                    {c.canEdit && isRealList && (
                      <button type="button" onClick={() => c.setLabelPickerOpen(true)} disabled={c.selectedIds.length === 0} className="col-selbar-btn">
                        <Tags size={14} /> {t('collections.labels.assign')}
                      </button>
                    )}
                    {c.canEdit && (
                      <button type="button" onClick={() => c.setListPickerMode('move')} disabled={c.selectedIds.length === 0} className="col-selbar-btn">
                        <FolderInput size={14} /> {t('collections.moveToList')}
                      </button>
                    )}
                    <button type="button" onClick={() => c.setListPickerMode('copy')} disabled={c.selectedIds.length === 0} className="col-selbar-btn">
                      <CopyPlus size={14} /> {t('collections.duplicateToList')}
                    </button>
                    <button type="button" onClick={c.openCopyForSelection} disabled={c.selectedIds.length === 0} className="col-selbar-btn">
                      <Copy size={14} /> {t('collections.copyToTrip')}
                    </button>
                    {c.canDelete && (
                      <button type="button" onClick={c.handleDeleteSelected} disabled={c.selectedIds.length === 0} className="col-selbar-btn danger">
                        <Trash2 size={14} /> {t('common.delete')}
                      </button>
                    )}
                    <button type="button" onClick={() => c.setSelectMode(false)} className="col-selbar-btn" aria-label={t('common.cancel')}>
                      <X size={15} />
                    </button>
                  </div>
                )}

                {body}
              </>
            )}
          </div>
        </div>

        {/* Mobile rail drawer */}
        {c.mobileRailOpen && (
          <>
            <div className="col-drawer-backdrop" onClick={() => c.setMobileRailOpen(false)} />
            <div className="col-drawer">
              <div className="col-drawer-head">
                <button type="button" onClick={() => c.setMobileRailOpen(false)} aria-label={t('common.close')}><X size={18} /></button>
              </div>
              {rail}
            </div>
          </>
        )}

        {/* Place detail — a bottom sheet (no backdrop, so the map behind stays
            visible + interactive). On the desktop split it docks over the list
            column so the map stays clear; otherwise it's a full-width sheet.
            Clicking another place / the map background re-points the selection. */}
        {c.selectedPlace && c.view !== 'map' && (
          <CollectionPlaceDetail
            place={c.selectedPlace}
            canEdit={c.canEdit}
            canDelete={c.canDelete}
            categories={c.categories}
            labels={c.labels}
            anchorRect={desktopSplit ? c.listColRect : null}
            onClose={c.handleCloseDetail}
            onSetStatus={c.handleDetailStatus}
            onSave={patch => c.updatePlace(c.selectedPlace!.id, patch)}
            onCopyToTrip={c.openCopyForSelectedPlace}
            onRemove={c.handleDetailRemove}
            t={t}
          />
        )}
      </div>

      {/* Add a place to the current list */}
      {typeof c.activeId === 'number' && c.activeCollection && (
        <AddPlaceToCollectionModal
          isOpen={c.showAddPlace}
          collectionId={c.activeId}
          collectionName={c.activeCollection.name}
          categories={c.categories}
          onClose={() => c.setShowAddPlace(false)}
          onAdded={c.handlePlaceAdded}
          t={t}
        />
      )}

      {/* Copy to trip */}
      <CopyToTripModal
        isOpen={c.copyIds != null}
        onClose={c.closeCopy}
        placeIds={c.copyIds ?? []}
        onCopy={c.handleCopyToTrip}
        t={t}
      />

      {/* Move / duplicate the selection into another list */}
      {c.listPickerMode && (
        <MoveToListModal
          mode={c.listPickerMode}
          lists={c.ownedLists.filter(l => l.id !== c.activeId)}
          count={c.selectedIds.length}
          onPick={c.listPickerMode === 'move' ? c.handleMoveToList : c.handleDuplicateToList}
          onClose={() => c.setListPickerMode(null)}
          t={t}
        />
      )}

      {/* Share / fusion */}
      {c.canShare && typeof c.activeId === 'number' && c.activeCollection && (
        <ShareCollectionModal
          isOpen={c.showShare}
          onClose={() => c.setShowShare(false)}
          collectionId={c.activeId}
          collectionName={c.activeCollection.name}
          isOwner={c.isOwner}
          members={c.members}
          onAfterLeave={c.handleAfterLeave}
          t={t}
        />
      )}

      {/* Create / edit a list — name, colour, cover, description, links */}
      <ListEditorModal target={c.editorTarget} onClose={() => c.setEditorTarget(null)} onCreated={c.handleEditorCreated} onRequestDelete={c.setConfirmDeleteList} t={t} />

      {/* Manage the list's custom labels (editor+) */}
      {canManageLabels && (
        <LabelManager
          isOpen={c.showLabelManager}
          labels={c.labels}
          onCreate={c.handleCreateLabel}
          onUpdate={c.handleUpdateLabel}
          onDelete={c.handleDeleteLabel}
          onClose={() => c.setShowLabelManager(false)}
          t={t}
        />
      )}

      {/* Bulk-assign labels to the current selection */}
      {canManageLabels && (
        <BulkAssignLabelModal
          isOpen={c.labelPickerOpen}
          labels={c.labels}
          count={c.selectedIds.length}
          onAssign={c.handleBulkAssignLabels}
          onManage={() => { c.setLabelPickerOpen(false); c.setShowLabelManager(true) }}
          onClose={() => c.setLabelPickerOpen(false)}
          t={t}
        />
      )}

      {/* Delete-list confirm */}
      <Modal
        isOpen={c.confirmDeleteList != null}
        onClose={() => c.setConfirmDeleteList(null)}
        title={t('collections.deleteList')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => c.setConfirmDeleteList(null)} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={c.handleDeleteList} className="px-3 py-1.5 rounded-lg bg-danger text-white text-[13px] font-semibold hover:opacity-90">
              {t('common.delete')}
            </button>
          </div>
        }
      >
        <p className="text-[13px] text-content-secondary">{t('collections.deleteListConfirm')}</p>
      </Modal>
    </>
  )
}
