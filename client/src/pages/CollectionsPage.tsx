import React from 'react'
import { LayoutGrid, List as ListIcon, Map as MapIcon, Search, Bookmark, Plus, CheckSquare, X, Trash2, Copy } from 'lucide-react'
import Navbar from '../components/Layout/Navbar'
import Modal from '../components/shared/Modal'
import ListsRail from '../components/Collections/ListsRail'
import CollectionGrid from '../components/Collections/CollectionGrid'
import CollectionList from '../components/Collections/CollectionList'
import CollectionMap from '../components/Collections/CollectionMap'
import CopyToTripModal from '../components/Collections/CopyToTripModal'
import PlaceInspector from '../components/Planner/PlaceInspector'
import type { TranslationFn } from '../types'
import type { CollectionView, StatusFilter } from '../store/collectionStore'
import { STATUS_META, STATUS_ORDER, mappablePlaces } from './collections/collectionsModel'
import { useCollections } from './collections/useCollections'

const SWATCHES = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#3b82f6', '#22c55e']
const VIEW_ICONS: Record<CollectionView, typeof LayoutGrid> = { grid: LayoutGrid, list: ListIcon, map: MapIcon }

function ViewSwitch({ view, onChange, t }: { view: CollectionView; onChange: (v: CollectionView) => void; t: TranslationFn }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-secondary border border-edge">
      {(['grid', 'list', 'map'] as CollectionView[]).map(v => {
        const Icon = VIEW_ICONS[v]
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-label={t(`collections.view.${v}`)}
            title={t(`collections.view.${v}`)}
            className={`p-1.5 rounded-md transition-colors ${view === v ? 'bg-surface-card text-content shadow-sm' : 'text-content-faint hover:text-content-secondary'}`}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}

function StatusChips({
  statusFilter, counts, onChange, t,
}: { statusFilter: StatusFilter; counts: Record<StatusFilter, number>; onChange: (f: StatusFilter) => void; t: TranslationFn }): React.ReactElement {
  const chips: { key: StatusFilter; label: string; color?: string }[] = [
    { key: 'all', label: t('collections.status.filterAll') },
    ...STATUS_ORDER.map(s => ({ key: s as StatusFilter, label: t(STATUS_META[s].labelKey), color: STATUS_META[s].color })),
  ]
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {chips.map(chip => {
        const active = statusFilter === chip.key
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors ${active ? 'bg-inverse text-inverse-text border-transparent' : 'bg-surface-card text-content-secondary border-edge hover:bg-surface-hover'}`}
          >
            {chip.color && <span className="w-2 h-2 rounded-full" style={{ background: chip.color }} />}
            {chip.label}
            <span className="tabular-nums opacity-60">{counts[chip.key]}</span>
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4 text-content-faint">{icon}</div>
      <h3 className="text-[15px] font-semibold text-content">{title}</h3>
      <p className="text-[13px] text-content-faint mt-1 max-w-xs">{text}</p>
    </div>
  )
}

export default function CollectionsPage(): React.ReactElement {
  const c = useCollections()
  const { t } = c

  const title = c.isAllSaved ? t('collections.allSaved') : (c.activeCollection?.name ?? t('collections.title'))
  const hasPlaces = c.places.length > 0
  const noLists = !c.loading && c.collections.length === 0
  const showSelect = !c.isAllSaved && (c.isOwner || c.activeCollection?.is_owner === false)

  let body: React.ReactElement
  if (c.placesLoading && !hasPlaces) {
    body = (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 border-2 rounded-full animate-spin border-edge border-t-content" />
      </div>
    )
  } else if (!hasPlaces) {
    body = (
      <EmptyState
        icon={<Bookmark size={26} />}
        title={t('collections.empty.title')}
        text={t('collections.empty.text')}
      />
    )
  } else if (c.visiblePlaces.length === 0) {
    body = (
      <EmptyState
        icon={<Search size={26} />}
        title={t('collections.empty.noMatchTitle')}
        text={t('collections.empty.noMatchText')}
      />
    )
  } else if (c.view === 'grid') {
    body = (
      <CollectionGrid
        places={c.visiblePlaces}
        selectedPlaceId={c.selectedPlaceId}
        selectMode={c.selectMode}
        selectedIds={c.selectedIds}
        onOpenPlace={c.setSelectedPlaceId}
        onStatusChange={c.handleStatusChange}
        onToggleSelect={c.toggleSelect}
        t={t}
      />
    )
  } else if (c.view === 'list') {
    body = (
      <CollectionList
        places={c.visiblePlaces}
        selectedPlaceId={c.selectedPlaceId}
        selectMode={c.selectMode}
        selectedIds={c.selectedIds}
        onOpenPlace={c.setSelectedPlaceId}
        onStatusChange={c.handleStatusChange}
        onToggleSelect={c.toggleSelect}
        t={t}
      />
    )
  } else {
    const mappable = mappablePlaces(c.visiblePlaces)
    body = mappable.length === 0 ? (
      <EmptyState
        icon={<Search size={26} />}
        title={t('collections.empty.noMatchTitle')}
        text={t('collections.empty.noMatchText')}
      />
    ) : (
      <CollectionMap
        places={mappable}
        selectedPlaceId={c.selectedPlaceId}
        onOpenPlace={c.setSelectedPlaceId}
        dark={c.dark}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex" style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Lists rail — desktop sidebar / mobile slide-over */}
        <aside className="hidden md:block w-64 shrink-0 border-r border-edge p-3 overflow-y-auto" style={{ height: 'calc(100vh - var(--nav-h))', position: 'sticky', top: 'var(--nav-h)' }}>
          <ListsRail
            ownedLists={c.ownedLists}
            sharedLists={c.sharedLists}
            activeId={c.activeId}
            incomingInvites={c.incomingInvites}
            editingListId={c.editingListId}
            editingName={c.editingName}
            setEditingName={c.setEditingName}
            onSelect={c.handleSelectList}
            onNewList={() => c.setShowNewList(true)}
            onStartRename={c.handleStartRename}
            onCommitRename={c.handleCommitRename}
            onSetColor={c.handleSetColor}
            onRequestDelete={c.setConfirmDeleteList}
            onAcceptInvite={c.handleAcceptInvite}
            onDeclineInvite={c.handleDeclineInvite}
            t={t}
          />
        </aside>

        {/* Main column */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5 pb-24">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => c.setMobileRailOpen(true)}
                  className="md:hidden p-2 -ml-1 rounded-lg text-content-secondary hover:bg-surface-hover"
                  aria-label={t('collections.title')}
                >
                  <Bookmark size={18} />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-content truncate">{title}</h1>
                {c.activeCollection?.is_owner === false && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-content-faint text-[11px] font-medium">{t('collections.shared')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ViewSwitch view={c.view} onChange={c.setView} t={t} />
                {showSelect && (
                  <button
                    type="button"
                    onClick={() => c.setSelectMode(!c.selectMode)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${c.selectMode ? 'bg-accent text-accent-text border-accent' : 'bg-surface-card text-content-secondary border-edge hover:bg-surface-hover'}`}
                  >
                    <CheckSquare size={14} /> <span className="hidden sm:inline">{t('collections.selectMode')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => c.setShowNewList(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-inverse text-inverse-text hover:opacity-90"
                >
                  <Plus size={14} /> <span className="hidden sm:inline">{t('collections.newList')}</span>
                </button>
              </div>
            </div>

            {/* Toolbar: search + status chips */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <StatusChips statusFilter={c.statusFilter} counts={c.counts} onChange={c.setStatusFilter} t={t} />
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
                <input
                  value={c.search}
                  onChange={e => c.setSearch(e.target.value)}
                  placeholder={t('collections.search')}
                  className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Select-mode action bar */}
            {c.selectMode && c.selectedIds.length > 0 && (
              <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-lg bg-surface-secondary">
                <span className="text-[12px] font-medium text-content-secondary">{t('collections.selectedCount', { count: c.selectedIds.length })}</span>
                <div className="flex-1" />
                <button type="button" onClick={c.openCopyForSelection} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-content-secondary hover:bg-surface-hover">
                  <Copy size={13} /> {t('collections.copyN', { count: c.selectedIds.length })}
                </button>
                <button type="button" onClick={c.handleDeleteSelected} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-danger hover:bg-danger-soft">
                  <Trash2 size={13} /> {t('common.delete')}
                </button>
                <button type="button" onClick={() => c.setSelectMode(false)} className="p-1 rounded-md text-content-faint hover:bg-surface-hover" aria-label={t('common.cancel')}>
                  <X size={15} />
                </button>
              </div>
            )}

            {noLists ? (
              <EmptyState icon={<Bookmark size={26} />} title={t('collections.empty.firstTitle')} text={t('collections.empty.firstText')} />
            ) : body}
          </div>
        </main>
      </div>

      {/* Mobile rail slide-over */}
      {c.mobileRailOpen && (
        <div className="md:hidden fixed inset-0 z-[150] flex" onClick={() => c.setMobileRailOpen(false)}>
          <div className="absolute inset-0 trek-modal-backdrop trek-backdrop-enter bg-[rgba(15,23,42,0.5)]" />
          <div className="relative w-72 max-w-[80vw] h-full bg-surface border-r border-edge p-3 overflow-y-auto" style={{ paddingTop: 'calc(var(--nav-h) + 12px)' }} onClick={e => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {/* Detail panel — re-pointed PlaceInspector in collection mode. The outer
          layer is click-through (pointer-events-none) so the grid behind stays
          interactive; only the floating card re-enables pointer events. */}
      {c.detailPlace && (
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
    </div>
  )
}
