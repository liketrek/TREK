import { ReactNode, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bookmark, Check, CheckCheck, CheckSquare, ChevronDown, Copy, CopyPlus,
  FolderInput, Layers, List, Loader2, Map as MapIcon, Pencil, Plus, Search, Share2,
  Tag, Tags, Trash2, X,
} from 'lucide-react'
import type { CollectionStatus } from '@trek/shared'
import MDancingTrek, { type TrekScene } from '../../components/MDancingTrek'
import { useCollections } from '../../../pages/collections/useCollections'
import { STATUS_ORDER } from '../../../pages/collections/collectionsModel'
import type { StatusFilter } from '../../../store/collectionStore'
import { ALL_SAVED } from '../../../store/collectionStore'
import CollectionMap from '../../../components/Collections/CollectionMap'
import MSheet from '../../components/MSheet'
import MCollPlaceRow from './MCollPlaceRow'
import MCollPlaceSheet from './MCollPlaceSheet'
import MCollAddSheet from './MCollAddSheet'
import MCollShareSheet from './MCollShareSheet'
import MCollEditSheet from './MCollEditSheet'
import MCollLabelsSheet from './MCollLabelsSheet'
import MCollTripPickerSheet from './MCollTripPickerSheet'
import MCollListPickerSheet from './MCollListPickerSheet'
import { STATUS_SPEC } from './collectionsMobileModel'
import { CancelPill, PrimaryPill } from './MCollSheetKit'

const HEADER_CIRCLE =
  'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]'

const FILTER_CHIP =
  'flex flex-1 items-center justify-center gap-[5px] rounded-full py-2 text-[0.75rem] font-semibold'

const CHIP_IDLE = 'border border-[color:var(--m-rowbr)] bg-m-sheetop text-m-ink'
const CHIP_ON = 'border border-transparent bg-m-act text-m-actfg'

const DROP_PANEL =
  'rounded-[14px] border border-[color:var(--m-rowbr)] bg-m-sheetop shadow-[0_20px_44px_-18px_rgba(0,0,0,.45)]'

function EmptyNote({ icon, scene, title }: { icon?: ReactNode; scene?: TrekScene; title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-[6px] px-6 text-center">
      {scene ? (
        <MDancingTrek scene={scene} className="mb-2" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--m-ic)] text-m-faint">{icon}</span>
      )}
      <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{title}</p>
    </div>
  )
}

/**
 * Mobile collections screen: list switcher (dropdown + left drawer), list/map
 * view toggle with clustering, real status/label filter chips, the select mode
 * bulk actions and all collection sheets. State and mutations come from the
 * shared useCollections() page hook.
 */
export default function MCollections() {
  const c = useCollections()
  const { t } = c

  const [drop, setDrop] = useState(false)
  const [statusDrop, setStatusDrop] = useState(false)
  const [labelDrop, setLabelDrop] = useState(false)

  // The bottom-nav "+" hands off via the ?create= contract.
  const [searchParams, setSearchParams] = useSearchParams()
  const createParam = searchParams.get('create')
  const { activeId, canEdit, setShowAddPlace, ownedLists } = c
  useEffect(() => {
    if (createParam !== 'place' && createParam !== '1') return
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
    // Open whenever the user can add somewhere: an editable active list, or at
    // least one owned list to pick as the target in the sheet.
    if ((typeof activeId === 'number' && canEdit) || ownedLists.length > 0) setShowAddPlace(true)
  }, [createParam, searchParams, setSearchParams, activeId, canEdit, ownedLists.length, setShowAddPlace])

  // Close transient popovers when the active list changes under them.
  useEffect(() => {
    setDrop(false)
    setStatusDrop(false)
    setLabelDrop(false)
  }, [c.activeId])

  // The mobile toolbar has no category or rating filter control, but the shared
  // hook still applies whatever was set on desktop — keep both cleared so
  // resizing to phone doesn't silently filter the list and map (#1435).
  const { categoryFilter, setCategoryFilter, ratingFilter, setRatingFilter } = c
  useEffect(() => {
    if (categoryFilter !== 'all') setCategoryFilter('all')
    if (ratingFilter !== 'all') setRatingFilter('all')
  }, [categoryFilter, setCategoryFilter, ratingFilter, setRatingFilter])

  const title = c.isAllSaved ? t('collections.allSaved') : (c.activeCollection?.name ?? t('collections.title'))
  const isRealList = !c.isAllSaved && typeof c.activeId === 'number'
  const canManageLabels = isRealList && c.canEdit
  const canEditList = isRealList && c.isOwner && c.activeCollection != null
  const canAddPlace = typeof c.activeId === 'number' && c.canEdit
  const noLists = !c.loading && c.collections.length === 0
  const hasPlaces = c.places.length > 0
  const showSelect = c.isAllSaved || c.activeCollection != null

  const statusLabel = c.statusFilter === 'all'
    ? t('collections.status.filterAll')
    : t(STATUS_SPEC[c.statusFilter].labelKey)
  const labelLabel = c.labelFilter.length === 0
    ? t('collections.status.filterAll')
    : c.labelFilter.length === 1
      ? (c.labelOptions.find(l => l.id === c.labelFilter[0])?.name ?? '1')
      : String(c.labelFilter.length)

  const selectList = (id: number | typeof ALL_SAVED) => {
    setDrop(false)
    c.handleSelectList(id)
  }

  const openNewList = () => {
    setDrop(false)
    c.setEditorTarget('new')
  }

  const pickStatusFilter = (f: StatusFilter) => {
    c.setStatusFilter(f)
    setStatusDrop(false)
  }

  const toggleLabelFilter = (id: number) => {
    c.setLabelFilter(c.labelFilter.includes(id) ? c.labelFilter.filter(x => x !== id) : [...c.labelFilter, id])
  }

  const selectChip = (disabled: boolean) =>
    `flex flex-none items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-2 text-[0.75rem] font-semibold text-m-ink ${disabled ? 'opacity-40' : ''}`

  return (
    <div className="px-4 pb-[calc(var(--bottom-nav-h,84px)+12px)] pt-[var(--m-safe-top,12px)]">
      {/* Header: back · list switcher · edit · share */}
      <div className="mb-3 flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => setDrop(v => !v)}
          aria-expanded={drop}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-[7px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] px-[14px] text-[0.8125rem] font-bold text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <Bookmark size={14} strokeWidth={2.2} className="flex-none" />
          <span className="min-w-0 flex-1 truncate text-left">{title}</span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
        {canEditList && (
          <button type="button" onClick={() => c.setEditorTarget(c.activeCollection!)} aria-label={t('collections.editListTitle')} className={HEADER_CIRCLE}>
            <Pencil size={15} strokeWidth={2.2} />
          </button>
        )}
        {c.canShare && (
          <button type="button" onClick={() => c.setShowShare(true)} aria-label={t('collections.share.title')} className={HEADER_CIRCLE}>
            <Share2 size={15} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* List switcher dropdown (in flow, like the design) */}
      {drop && (
        <div className="-mt-[6px] mb-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop p-[6px] shadow-[0_16px_40px_-20px_rgba(0,0,0,.4)]">
          <button
            type="button"
            onClick={() => selectList(ALL_SAVED)}
            className={`flex w-full items-center gap-[9px] rounded-[11px] p-[10px] text-[0.8125rem] font-semibold text-m-ink ${c.isAllSaved ? 'bg-[color:var(--m-ic)]' : ''}`}
          >
            <Layers size={15} strokeWidth={2} /> {t('collections.allSaved')}
          </button>
          <div className="my-[2px] h-px bg-[color:var(--m-rowbr)]" />
          {[...c.ownedLists, ...c.sharedLists].map(l => {
            const active = c.activeId === l.id
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => selectList(l.id)}
                className={`flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-left ${active ? 'bg-[color:var(--m-ic)]' : ''}`}
                style={active ? { boxShadow: `inset 0 0 0 1.5px ${l.color || '#6366F1'}` } : undefined}
              >
                <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: l.color || '#6366F1' }} />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{l.name}</span>
                <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{l.place_count ?? 0}</span>
              </button>
            )
          })}
          <div className="my-[2px] h-px bg-[color:var(--m-rowbr)]" />
          <button
            type="button"
            onClick={openNewList}
            className="flex w-full items-center gap-[9px] rounded-[11px] px-[10px] py-[11px] text-[0.8125rem] font-bold text-m-muted"
          >
            <Plus size={15} strokeWidth={2.2} /> {t('collections.newList')}
          </button>
        </div>
      )}

      {c.loading && c.collections.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-m-faint">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : noLists ? (
        <div className="mt-6">
          <EmptyNote scene="collections" title={t('collections.empty.firstTitle')} />
          <div className="mt-4 flex justify-center">
            <PrimaryPill onClick={openNewList}>
              <Bookmark size={14} strokeWidth={2.2} /> {t('collections.newList')}
            </PrimaryPill>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar: view toggle · search · filter chips / select actions */}
          <div className="mt-3 rounded-[18px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[10px]">
            <div className="flex items-center gap-2">
              <span className="flex flex-none rounded-xl bg-[color:var(--m-ic)] p-[3px]">
                <button
                  type="button"
                  onClick={() => c.setView('list')}
                  aria-label={t('collections.view.list')}
                  aria-pressed={c.view === 'list'}
                  className={`flex h-[30px] w-[38px] items-center justify-center rounded-[9px] ${c.view === 'list' ? 'bg-m-act text-m-actfg' : 'text-m-muted'}`}
                >
                  <List size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => c.setView('map')}
                  aria-label={t('collections.view.map')}
                  aria-pressed={c.view === 'map'}
                  className={`flex h-[30px] w-[38px] items-center justify-center rounded-[9px] ${c.view === 'map' ? 'bg-m-act text-m-actfg' : 'text-m-muted'}`}
                >
                  <MapIcon size={15} strokeWidth={2} />
                </button>
              </span>
              <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[13px]">
                <Search size={15} strokeWidth={2.2} className="flex-none text-m-muted" />
                <input
                  value={c.search}
                  onChange={e => c.setSearch(e.target.value)}
                  placeholder={t('collections.search')}
                  className="min-w-0 flex-1 bg-transparent font-geist text-[0.78125rem] text-m-ink outline-none placeholder:text-m-faint"
                />
              </div>
            </div>

            {c.view === 'list' && !c.selectMode && (
              <div className="relative mt-2 flex items-center gap-[6px]">
                <button
                  type="button"
                  onClick={() => { setStatusDrop(v => !v); setLabelDrop(false) }}
                  aria-expanded={statusDrop}
                  className={`${FILTER_CHIP} ${c.statusFilter !== 'all' ? CHIP_ON : CHIP_IDLE}`}
                >
                  <Layers size={13} strokeWidth={2} className="flex-none" />
                  <span className="truncate">{statusLabel}</span>
                  <ChevronDown size={12} strokeWidth={2} className={`flex-none ${c.statusFilter !== 'all' ? '' : 'text-m-faint'}`} />
                </button>
                {isRealList && (
                  <button
                    type="button"
                    onClick={() => { setLabelDrop(v => !v); setStatusDrop(false) }}
                    aria-expanded={labelDrop}
                    className={`${FILTER_CHIP} ${c.labelFilter.length > 0 ? CHIP_ON : CHIP_IDLE}`}
                  >
                    <Tag size={13} strokeWidth={2} className="flex-none" />
                    <span className="truncate">{labelLabel}</span>
                    <ChevronDown size={12} strokeWidth={2} className={`flex-none ${c.labelFilter.length > 0 ? '' : 'text-m-faint'}`} />
                  </button>
                )}
                {canManageLabels && (
                  <button type="button" onClick={() => c.setShowLabelManager(true)} className={`${FILTER_CHIP} ${CHIP_IDLE}`}>
                    <Plus size={12} strokeWidth={2.2} className="flex-none" />
                    <span className="truncate">{t('collections.linkLabel')}</span>
                  </button>
                )}
                {showSelect && (
                  <button type="button" onClick={() => c.setSelectMode(true)} className={`${FILTER_CHIP} ${CHIP_IDLE}`}>
                    <CheckSquare size={13} strokeWidth={2} className="flex-none" />
                    <span className="truncate">{t('collections.select')}</span>
                  </button>
                )}

                {(statusDrop || labelDrop) && (
                  <button
                    type="button"
                    aria-label={t('common.close')}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => { setStatusDrop(false); setLabelDrop(false) }}
                  />
                )}
                {statusDrop && (
                  <div className={`absolute left-0 right-0 top-[calc(100%+6px)] z-20 p-[6px] ${DROP_PANEL}`}>
                    <button
                      type="button"
                      onClick={() => pickStatusFilter('all')}
                      className={`flex w-full items-center gap-[9px] rounded-[11px] p-[10px] text-[0.8125rem] font-semibold text-m-ink ${c.statusFilter === 'all' ? 'bg-[color:var(--m-ic)]' : ''}`}
                    >
                      <Layers size={15} strokeWidth={2} />
                      <span className="flex-1 text-left">{t('collections.status.filterAll')}</span>
                      <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{c.counts.all}</span>
                    </button>
                    {STATUS_ORDER.map(s => {
                      const meta = STATUS_SPEC[s]
                      const Icon = meta.icon
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => pickStatusFilter(s)}
                          className={`flex w-full items-center gap-[9px] rounded-[11px] p-[10px] text-[0.8125rem] font-semibold text-m-ink ${c.statusFilter === s ? 'bg-[color:var(--m-ic)]' : ''}`}
                        >
                          <Icon size={15} strokeWidth={2} style={{ color: meta.color }} />
                          <span className="flex-1 text-left">{t(meta.labelKey)}</span>
                          <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{c.counts[s]}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {labelDrop && (
                  <div className={`absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-[240px] overflow-y-auto p-[6px] ${DROP_PANEL}`}>
                    <button
                      type="button"
                      onClick={() => { c.setLabelFilter([]); setLabelDrop(false) }}
                      className={`flex w-full items-center gap-[9px] rounded-[11px] p-[10px] text-[0.8125rem] font-semibold text-m-ink ${c.labelFilter.length === 0 ? 'bg-[color:var(--m-ic)]' : ''}`}
                    >
                      <Tag size={15} strokeWidth={2} />
                      <span className="flex-1 text-left">{t('collections.status.filterAll')}</span>
                    </button>
                    {c.labelOptions.map(l => {
                      const on = c.labelFilter.includes(l.id)
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => toggleLabelFilter(l.id)}
                          className={`flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-left ${on ? 'bg-[color:var(--m-ic)]' : ''}`}
                        >
                          <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: l.color || '#6366F1' }} />
                          <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{l.name}</span>
                          <span className="font-geist text-[0.6875rem] font-bold text-m-faint">{l.count}</span>
                          {on && <Check size={14} strokeWidth={2.6} className="flex-none text-m-ink" />}
                        </button>
                      )
                    })}
                    {c.labelOptions.length === 0 && (
                      <div className="p-[10px] text-center font-geist text-[0.71875rem] text-m-faint">{t('collections.labels.empty')}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {c.view === 'list' && c.selectMode && (
              <div className="mt-2 flex items-center gap-[6px] overflow-x-auto pb-[2px]">
                <button type="button" onClick={c.handleSelectAll} className={selectChip(false)}>
                  <CheckCheck size={13} strokeWidth={2.2} />
                  {c.allVisibleSelected ? t('collections.deselectAll') : t('collections.selectAll')}
                </button>
                <span className="flex-none whitespace-nowrap px-1 font-geist text-[0.6875rem] font-bold text-m-muted">
                  {t('collections.selectedCount', { count: c.selectedIds.length })}
                </span>
                {canManageLabels && (
                  <button type="button" onClick={() => c.setLabelPickerOpen(true)} disabled={c.selectedIds.length === 0} className={selectChip(c.selectedIds.length === 0)}>
                    <Tags size={13} strokeWidth={2.2} /> {t('collections.labels.assign')}
                  </button>
                )}
                <button type="button" onClick={c.openCopyForSelection} disabled={c.selectedIds.length === 0} className={selectChip(c.selectedIds.length === 0)}>
                  <Copy size={13} strokeWidth={2.2} /> {t('collections.copyToTrip')}
                </button>
                {c.canEdit && (
                  <button type="button" onClick={() => c.setListPickerMode('move')} disabled={c.selectedIds.length === 0} className={selectChip(c.selectedIds.length === 0)}>
                    <FolderInput size={13} strokeWidth={2.2} /> {t('collections.moveToList')}
                  </button>
                )}
                <button type="button" onClick={() => c.setListPickerMode('copy')} disabled={c.selectedIds.length === 0} className={selectChip(c.selectedIds.length === 0)}>
                  <CopyPlus size={13} strokeWidth={2.2} /> {t('collections.duplicateToList')}
                </button>
                {c.canDelete && (
                  <button
                    type="button"
                    onClick={c.handleDeleteSelected}
                    disabled={c.selectedIds.length === 0}
                    className={`${selectChip(c.selectedIds.length === 0)} !text-[color:var(--m-st-danger)]`}
                  >
                    <Trash2 size={13} strokeWidth={2.2} /> {t('common.delete')}
                  </button>
                )}
                <button type="button" onClick={() => c.setSelectMode(false)} aria-label={t('common.cancel')} className={selectChip(false)}>
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            )}
          </div>

          {/* List view */}
          {c.view === 'list' && (
            c.placesLoading && !hasPlaces ? (
              <div className="flex items-center justify-center py-16 text-m-faint">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : !hasPlaces ? (
              <EmptyNote scene="collections" title={t('collections.empty.title')} />
            ) : c.visiblePlaces.length === 0 ? (
              <EmptyNote icon={<Search size={19} strokeWidth={1.8} />} title={t('collections.empty.noMatchTitle')} />
            ) : (
              <div>
                {c.visiblePlaces.map(p => (
                  <MCollPlaceRow
                    key={p.id}
                    place={p}
                    selectMode={c.selectMode}
                    selected={c.selectedIds.includes(p.id)}
                    canEdit={c.canEdit}
                    onOpen={c.setSelectedPlaceId}
                    onToggleSelect={c.toggleSelect}
                    onSetStatus={(id: number, status: CollectionStatus) => c.handleStatusChange(id, status)}
                    t={t}
                  />
                ))}
              </div>
            )
          )}

          {/* Map view — the real map stack with marker clustering */}
          {c.view === 'map' && (
            c.mappable.length === 0 ? (
              <EmptyNote icon={<MapIcon size={19} strokeWidth={1.8} />} title={t('collections.empty.noMatchTitle')} />
            ) : (
              <div className="relative mt-3 h-[440px] overflow-hidden rounded-[20px] border border-[color:var(--m-rowbr)]">
                <CollectionMap
                  places={c.mappable}
                  selectedPlaceId={c.selectedPlaceId}
                  onOpenPlace={c.setSelectedPlaceId}
                  onDeselect={() => c.setSelectedPlaceId(null)}
                  dark={c.dark}
                />
              </div>
            )
          )}
        </>
      )}

      {/* Sheets */}
      <MCollPlaceSheet
        place={c.selectedPlace}
        canEdit={c.canEdit}
        canDelete={c.canDelete}
        categories={c.categories}
        labels={c.labels}
        onClose={c.handleCloseDetail}
        onSetStatus={c.handleDetailStatus}
        onSave={patch => c.updatePlace(c.selectedPlace!.id, patch)}
        onUploadImage={file => c.uploadPlaceImage(c.selectedPlace!.id, file)}
        onCopyToTrip={c.openCopyForSelectedPlace}
        onRemove={c.handleDetailRemove}
        onRate={r => c.handleRatePlace(c.selectedPlace!.id, r)}
        t={t}
      />

      <MCollAddSheet
        open={c.showAddPlace}
        collectionId={canAddPlace ? (c.activeId as number) : null}
        collectionName={canAddPlace ? (c.activeCollection?.name ?? '') : ''}
        lists={c.ownedLists}
        categories={c.categories}
        onClose={() => c.setShowAddPlace(false)}
        onAdded={c.handlePlaceAdded}
        t={t}
      />

      <MCollShareSheet
        open={c.showShare && c.canShare}
        collectionId={typeof c.activeId === 'number' ? c.activeId : null}
        collectionName={c.activeCollection?.name ?? ''}
        isOwner={c.isOwner}
        members={c.members}
        onClose={() => c.setShowShare(false)}
        onAfterLeave={c.handleAfterLeave}
        t={t}
      />

      <MCollEditSheet
        target={c.editorTarget}
        onClose={() => c.setEditorTarget(null)}
        onCreated={c.handleEditorCreated}
        onRequestDelete={c.setConfirmDeleteList}
        t={t}
      />

      <MCollLabelsSheet
        open={c.showLabelManager || c.labelPickerOpen}
        mode={c.labelPickerOpen ? 'assign' : 'manage'}
        labels={c.labelOptions}
        selectedCount={c.selectedIds.length}
        onCreate={c.handleCreateLabel}
        onUpdate={c.handleUpdateLabel}
        onDelete={c.handleDeleteLabel}
        onAssign={c.handleBulkAssignLabels}
        onSwitchToManage={() => { c.setLabelPickerOpen(false); c.setShowLabelManager(true) }}
        onClose={() => { c.setShowLabelManager(false); c.setLabelPickerOpen(false) }}
        t={t}
      />

      <MCollTripPickerSheet
        open={c.copyIds != null}
        count={c.copyIds?.length ?? 0}
        onCopy={c.handleCopyToTrip}
        onClose={c.closeCopy}
        t={t}
      />

      <MCollListPickerSheet
        mode={c.listPickerMode}
        lists={c.ownedLists.filter(l => l.id !== c.activeId)}
        count={c.selectedIds.length}
        onPick={id => (c.listPickerMode === 'move' ? c.handleMoveToList(id) : c.handleDuplicateToList(id))}
        onClose={() => c.setListPickerMode(null)}
        t={t}
      />

      {/* Delete-list confirm */}
      <MSheet
        open={c.confirmDeleteList != null}
        onClose={() => c.setConfirmDeleteList(null)}
        material="opaque"
        ariaLabel={t('collections.deleteList')}
      >
        <div className="px-[18px] pb-[18px] pt-4">
          <div className="text-[1.0625rem] font-bold text-m-ink">{t('collections.deleteList')}</div>
          <div className="mt-2 font-geist text-[0.78125rem] leading-[1.5] text-m-muted">{t('collections.deleteListConfirm')}</div>
          <div className="mt-4 flex items-center gap-2">
            <CancelPill className="ml-auto" onClick={() => c.setConfirmDeleteList(null)}>{t('common.cancel')}</CancelPill>
            <PrimaryPill onClick={c.handleDeleteList} className="!bg-[color:var(--m-st-danger)] !text-white">
              <Trash2 size={14} strokeWidth={2.2} /> {t('common.delete')}
            </PrimaryPill>
          </div>
        </div>
      </MSheet>
    </div>
  )
}
