import React from 'react'
import { List as ListIcon, Map as MapIcon, Search, Bookmark, CheckSquare, X, Trash2, Copy } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'
import Modal from '../components/shared/Modal'
import ListsRail from '../components/Collections/ListsRail'
import CollectionHero from '../components/Collections/CollectionHero'
import CollectionList from '../components/Collections/CollectionList'
import CollectionMapPanel from '../components/Collections/CollectionMapPanel'
import CopyToTripModal from '../components/Collections/CopyToTripModal'
import ShareCollectionModal from '../components/Collections/ShareCollectionModal'
import PlaceInspector from '../components/Planner/PlaceInspector'
import { mappablePlaces } from './collections/collectionsModel'
import { useCollections } from './collections/useCollections'
import '../styles/dashboard.css'
import '../styles/collections.css'

const SWATCHES = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e']

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
  const showSelect = !c.isAllSaved && c.activeCollection != null

  // Selecting a place toggles it, so clicking it again — or the map background —
  // clears it. Below the desktop breakpoint the list and map are separate views;
  // above it the list view is a split with a persistent map that pans to the
  // selection (the map stays mounted across the list↔map toggle so it animates).
  const mappable = mappablePlaces(c.visiblePlaces)
  const openPlace = (id: number) => c.setSelectedPlaceId(c.selectedPlaceId === id ? null : id)
  const deselect = () => c.setSelectedPlaceId(null)
  const toggleView = () => c.setView(c.view === 'map' ? 'list' : 'map')

  const desktopSplit = c.isWide && mappable.length > 0
  const mapShown = mappable.length > 0 && (c.view === 'map' || c.isWide)
  const mapOverlay = c.isWide && mapShown // the map carries the toggle + search

  const listEl = (
    <CollectionList
      places={c.visiblePlaces}
      selectedPlaceId={c.selectedPlaceId}
      selectMode={c.selectMode}
      selectedIds={c.selectedIds}
      onOpenPlace={openPlace}
      onStatusChange={c.handleStatusChange}
      onToggleSelect={c.toggleSelect}
      t={t}
    />
  )
  const mapPanel = (overlay: boolean) => (
    <CollectionMapPanel
      places={mappable}
      selectedPlaceId={c.selectedPlaceId}
      onSelect={openPlace}
      onDeselect={deselect}
      dark={c.dark}
      overlay={overlay}
      view={c.view}
      onToggleView={toggleView}
      search={c.search}
      onSearch={c.setSearch}
      t={t}
    />
  )

  let body: React.ReactElement
  if (c.placesLoading && !hasPlaces) {
    body = <div className="col-loading"><div className="col-spinner" /></div>
  } else if (!hasPlaces) {
    body = <EmptyState icon={<Bookmark size={26} />} title={t('collections.empty.title')} text={t('collections.empty.text')} />
  } else if (c.visiblePlaces.length === 0) {
    body = <EmptyState icon={<Search size={26} />} title={t('collections.empty.noMatchTitle')} text={t('collections.empty.noMatchText')} />
  } else if (desktopSplit) {
    body = (
      <div className={`col-split${c.view === 'map' ? ' map-full' : ''}`}>
        <div className="col-split-list">{listEl}</div>
        <div className="col-split-map">{mapPanel(true)}</div>
      </div>
    )
  } else if (c.view === 'map' && mappable.length > 0) {
    body = <div className="col-mapwrap">{mapPanel(false)}</div>
  } else {
    body = listEl
  }

  const rail = (
    <ListsRail
      ownedLists={c.ownedLists}
      sharedLists={c.sharedLists}
      activeId={c.activeId}
      incomingInvites={c.incomingInvites}
      editingListId={c.editingListId}
      editingName={c.editingName}
      setEditingName={c.setEditingName}
      onSelect={c.handleSelectList}
      onNewList={() => { c.setMobileRailOpen(false); c.setShowNewList(true) }}
      onStartRename={c.handleStartRename}
      onCommitRename={c.handleCommitRename}
      onSetColor={c.handleSetColor}
      onRequestDelete={c.setConfirmDeleteList}
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
                  <button type="button" onClick={() => c.setShowNewList(true)} className="col-cta">
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
                    counts={c.counts}
                    statusFilter={c.statusFilter}
                    onStatusFilter={c.setStatusFilter}
                    members={c.members}
                    canShare={c.canShare}
                    isOwner={c.isOwner}
                    shareMemberCount={c.shareMemberCount}
                    onShare={() => c.setShowShare(true)}
                    onNewList={() => c.setShowNewList(true)}
                    t={t}
                  />
                </div>

                {(!c.isWide || showSelect || !mapOverlay) && (
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
                    {showSelect && (
                      <button
                        type="button"
                        onClick={() => c.setSelectMode(!c.selectMode)}
                        className={`col-iconbtn${c.selectMode ? ' on' : ''}`}
                        aria-label={t('collections.selectMode')}
                        title={t('collections.selectMode')}
                      >
                        <CheckSquare size={16} />
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

                {c.selectMode && c.selectedIds.length > 0 && (
                  <div className="col-selbar">
                    <span className="lbl">{t('collections.selectedCount', { count: c.selectedIds.length })}</span>
                    <div className="col-toolbar-spacer" />
                    <button type="button" onClick={c.openCopyForSelection} className="col-selbar-btn">
                      <Copy size={14} /> {t('collections.copyN', { count: c.selectedIds.length })}
                    </button>
                    <button type="button" onClick={c.handleDeleteSelected} className="col-selbar-btn danger">
                      <Trash2 size={14} /> {t('common.delete')}
                    </button>
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
            <div className="col-drawer">{rail}</div>
          </>
        )}
      </div>

      {/* Detail panel — re-pointed PlaceInspector in collection mode. Kept outside
          .trek-dash (it's a shared component on the app's own tokens). The outer
          layer is click-through so the grid behind stays interactive; only the
          floating card re-enables pointer events. */}
      {c.detailPlace && !mapShown && (
        <div className="fixed inset-0 z-[150]" style={{ pointerEvents: 'none', paddingTop: 'var(--nav-h)' }}>
          <div className="relative w-full h-full">
            <div style={{ pointerEvents: 'auto' }}>
              <PlaceInspector
                mode="collection"
                place={c.detailPlace}
                categories={c.detailCategories}
                collectionStatus={c.selectedPlace?.status}
                onClose={c.handleCloseDetail}
                onCopyToTrip={c.openCopyForSelectedPlace}
                onSetStatus={c.handleDetailStatus}
                onRemoveFromList={c.handleDetailRemove}
              />
            </div>
          </div>
        </div>
      )}

      {/* Copy to trip */}
      <CopyToTripModal
        isOpen={c.copyIds != null}
        onClose={c.closeCopy}
        placeIds={c.copyIds ?? []}
        onCopy={c.handleCopyToTrip}
        t={t}
      />

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

      {/* New list modal */}
      <Modal
        isOpen={c.showNewList}
        onClose={() => c.setShowNewList(false)}
        title={t('collections.newList')}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => c.setShowNewList(false)} className="px-3 py-1.5 rounded-lg border border-edge text-content-secondary text-[13px] hover:bg-surface-hover">
              {t('common.cancel')}
            </button>
            <button type="button" onClick={c.handleCreateList} disabled={!c.newListName.trim() || c.creating} className="px-3 py-1.5 rounded-lg bg-accent text-accent-text text-[13px] font-semibold disabled:opacity-50">
              {t('collections.create')}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-medium text-content-secondary mb-1.5">{t('collections.listName')}</label>
            <input
              autoFocus
              value={c.newListName}
              onChange={e => c.setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && c.newListName.trim()) c.handleCreateList() }}
              placeholder={t('collections.listNamePlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[14px] outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-content-secondary mb-2">{t('collections.listColor')}</label>
            <div className="flex gap-2 flex-wrap">
              {SWATCHES.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => c.setNewListColor(col)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: col, outline: c.newListColor === col ? '2px solid var(--accent)' : 'none', outlineOffset: 2 }}
                  aria-label={col}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

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
