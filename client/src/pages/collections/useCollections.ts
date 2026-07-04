import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { useElementSize } from '../../hooks/useElementSize'
import { useElementRect } from '../../hooks/useElementRect'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/shared/Toast'
import { getApiErrorMessage } from '../../types'
import { addListener, removeListener } from '../../api/websocket'
import { useCollectionStore, ALL_SAVED } from '../../store/collectionStore'
import type { ActiveCollectionId } from '../../store/collectionStore'
import { categoriesApi } from '../../api/client'
import type { Collection, CollectionStatus } from '@trek/shared'
import type { Category, Place } from '../../types'
import { filterPlaces, sortPlaces, statusCounts, mappablePlaces, presentCategories, presentLabels } from './collectionsModel'
import type { CollectionLabelUpdateRequest } from '@trek/shared'

/**
 * Collections page logic — owns the page-local UI state (new/edit-list forms,
 * mobile rail drawer), pulls the collection store, wires the WebSocket live sync
 * (incl. collections:deleted clearing the active list) and keeps the route param
 * (/collections/:id) in sync with the active list. CollectionsPage stays a pure
 * wiring container around the rail + toolbar + view JSX.
 */
export function useCollections() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const { id: routeId } = useParams<{ id: string }>()
  const toast = useToast()

  const dm = useSettingsStore(s => s.settings.dark_mode)
  const dark = dm === true || dm === 'dark' || (dm === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Desktop breakpoint for the list+map split (list view only). Below it the
  // list stays single-column and the map is its own view.
  const [isWide, setIsWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setIsWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // Measure the hero so the list rail can be kept at least as tall as it.
  const hero = useElementSize<HTMLDivElement>()
  // Measure the split's list column so the place-detail sheet can dock over it.
  const listCol = useElementRect<HTMLDivElement>()

  const store = useCollectionStore()
  const {
    collections, activeId, places, members, labels, incomingInvites,
    view, statusFilter, categoryFilter, labelFilter, search, selectedPlaceId, selectMode, selectedIds,
    loading, placesLoading,
    loadAll, setActive, refreshActive, loadCollection,
    deleteCollection,
    setStatus, updatePlace, deletePlace, deleteMany, copyToTrip, clearSelection,
    moveToList, duplicateToList, setSelectedIds,
    createLabel, updateLabel, deleteLabel, assignLabels,
    acceptInvite, declineInvite,
    setView, setStatusFilter, setCategoryFilter, setLabelFilter, setSearch, setSelectedPlaceId, setSelectMode, toggleSelect,
  } = store

  // ── Page-local UI state ─────────────────────────────────────────────
  // The list editor modal: null = closed, 'new' = create, a Collection = edit it.
  const [editorTarget, setEditorTarget] = useState<Collection | 'new' | null>(null)
  const [confirmDeleteList, setConfirmDeleteList] = useState<number | null>(null)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showAddPlace, setShowAddPlace] = useState(false)
  // The place ids the Copy-to-trip modal is open for (null = closed). Single
  // place from the detail panel, or the select-mode set for a bulk copy.
  const [copyIds, setCopyIds] = useState<number[] | null>(null)

  // Initial load.
  useEffect(() => { loadAll() }, [])

  // Central admin-defined categories, for assigning a category to a saved place.
  const [categories, setCategories] = useState<Category[]>([])
  useEffect(() => { categoriesApi.list().then((d: { categories: Category[] }) => setCategories(d.categories ?? [])).catch(() => {}) }, [])

  // When the list↔map split toggles, its grid columns animate; keep nudging the
  // mounted map to re-layout during the transition (Leaflet's trackResize hooks
  // window resize; MapLibre observes its own box). Skip the initial mount — the
  // map already sizes itself there, and nudging would fight its first fit.
  const firstViewRun = useRef(true)
  useEffect(() => {
    if (firstViewRun.current) { firstViewRun.current = false; return }
    if (!isWide) return
    const start = performance.now()
    let raf = 0
    const tick = () => {
      window.dispatchEvent(new Event('resize'))
      if (performance.now() - start < 440) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [view, isWide])

  // Keep the active list in sync with the URL (/collections/:id, or the
  // "All saved" union at /collections).
  useEffect(() => {
    const next: ActiveCollectionId = routeId ? Number(routeId) : ALL_SAVED
    if (Number.isNaN(next as number)) return
    if (next !== activeId) setActive(next)
    // Only re-run when the route or the loaded list set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, collections.length])

  // Live sync via WebSocket. collections:deleted / :removed must bounce a member
  // off a list that was removed (or that they were kicked from) under them.
  const handleWsMessage = useCallback((msg: { type: string; collectionId?: number }) => {
    if (!msg.type?.startsWith('collections:')) return
    if (msg.type === 'collections:deleted' || msg.type === 'collections:removed') {
      if (msg.collectionId != null && activeId === msg.collectionId) {
        navigate('/collections')
      }
      loadAll()
      return
    }
    if (msg.type === 'collections:invite') {
      toast.info(t('collections.invites.received'))
    }
    // invite / accepted / declined / cancelled / left / updated → refresh the
    // rail, and refresh the active list WITHOUT clearing the current selection or
    // select-mode (setActive would reset selectedPlaceId → close the open detail).
    loadAll()
    if (typeof activeId === 'number') loadCollection(activeId)
    else if (activeId === ALL_SAVED) setActive(ALL_SAVED)
  }, [activeId])

  useEffect(() => {
    addListener(handleWsMessage)
    return () => removeListener(handleWsMessage)
  }, [handleWsMessage])

  // ── Derived ─────────────────────────────────────────────────────────
  const activeCollection = useMemo(
    () => (typeof activeId === 'number' ? collections.find(c => c.id === activeId) ?? null : null),
    [collections, activeId],
  )
  const isAllSaved = activeId === ALL_SAVED
  const isOwner = activeCollection?.is_owner ?? false

  // The current user's permission on the active list drives what the UI offers.
  // "All saved" spans many lists (each enforced per-place on the server), so it
  // stays permissive on the client; a viewer of a shared list loses add/edit/delete.
  const currentUserId = useAuthStore(s => s.user?.id)
  const myRole = useMemo(() => {
    if (isOwner) return 'owner' as const
    const me = members.find(m => m.user_id === currentUserId && !m.is_owner)
    return me?.role ?? null
  }, [isOwner, members, currentUserId])
  const canEdit = isAllSaved || myRole === 'owner' || myRole === 'admin' || myRole === 'editor'
  const canDelete = isAllSaved || myRole === 'owner' || myRole === 'admin'

  // Sharing is offered on any real (non "All saved") list the user can see. The
  // badge counts everyone but the owner — accepted collaborators + pending invites.
  const canShare = typeof activeId === 'number' && activeCollection != null
  const shareMemberCount = useMemo(() => members.filter(m => !m.is_owner).length, [members])

  // Close the share modal if the active list changes out from under it.
  useEffect(() => { setShowShare(false) }, [activeId])

  const ownedLists = useMemo(() => collections.filter(c => c.is_owner !== false), [collections])
  const sharedLists = useMemo(() => collections.filter(c => c.is_owner === false), [collections])

  // Labels are per-collection, so never apply them on the "All saved" union.
  const visiblePlaces = useMemo(
    () => sortPlaces(filterPlaces(places, statusFilter, search, categoryFilter, isAllSaved ? [] : labelFilter)),
    [places, statusFilter, search, categoryFilter, isAllSaved, labelFilter],
  )
  // Categories actually present in this list, for the category filter dropdown.
  const categoryOptions = useMemo(() => presentCategories(places), [places])
  // The active list's labels (with per-label counts) for the filter + manager.
  const labelOptions = useMemo(() => presentLabels(labels, places), [labels, places])
  // Stable reference so the map doesn't tear down + rebuild every marker on each
  // unrelated re-render (which would swallow marker clicks mid-rebuild).
  const mappable = useMemo(() => mappablePlaces(visiblePlaces), [visiblePlaces])
  const counts = useMemo(() => statusCounts(places), [places])

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSelectList = useCallback((id: ActiveCollectionId) => {
    setMobileRailOpen(false)
    navigate(id === ALL_SAVED || id === null ? '/collections' : `/collections/${id}`)
  }, [navigate])

  // The editor modal owns its own form + create/update/upload calls; the hook
  // just opens it and navigates to a freshly created list.
  const handleEditorCreated = useCallback((id: number) => {
    navigate(`/collections/${id}`)
  }, [navigate])

  const handlePlaceAdded = useCallback(() => { refreshActive() }, [refreshActive])

  const handleDeleteList = useCallback(async () => {
    if (confirmDeleteList == null) return
    const id = confirmDeleteList
    setConfirmDeleteList(null)
    try {
      await deleteCollection(id)
      if (activeId === id) navigate('/collections')
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [confirmDeleteList, deleteCollection, activeId, navigate, toast, t])

  const handleStatusChange = useCallback(async (placeId: number, status: CollectionStatus) => {
    try {
      await setStatus(placeId, status)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [setStatus, toast, t])

  const handleDeletePlace = useCallback(async (placeId: number) => {
    try {
      await deletePlace(placeId)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [deletePlace, toast, t])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return
    try {
      await deleteMany(selectedIds)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [selectedIds, deleteMany, toast, t])

  // Select-all toggles between every visible place and none.
  const allVisibleSelected = visiblePlaces.length > 0 && visiblePlaces.every(p => selectedIds.includes(p.id))
  const handleSelectAll = useCallback(() => {
    setSelectedIds(allVisibleSelected ? [] : visiblePlaces.map(p => p.id))
  }, [allVisibleSelected, visiblePlaces, setSelectedIds])

  // Move / duplicate the selection into another list (a list-picker modal).
  const [listPickerMode, setListPickerMode] = useState<'move' | 'copy' | null>(null)
  const handleMoveToList = useCallback(async (targetId: number) => {
    if (selectedIds.length === 0) return
    try {
      await moveToList(selectedIds, targetId)
      toast.success(t('collections.movedCount', { count: selectedIds.length }))
      setListPickerMode(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [selectedIds, moveToList, toast, t])
  const handleDuplicateToList = useCallback(async (targetId: number) => {
    if (selectedIds.length === 0) return
    try {
      await duplicateToList(selectedIds, targetId)
      toast.success(t('collections.duplicatedCount', { count: selectedIds.length }))
      setListPickerMode(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [selectedIds, duplicateToList, toast, t])

  // ── Labels ──────────────────────────────────────────────────────────
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)

  const handleCreateLabel = useCallback(async (name: string, color?: string) => {
    try { await createLabel(name, color) }
    catch (err) { toast.error(getApiErrorMessage(err, t('common.error'))) }
  }, [createLabel, toast, t])

  const handleUpdateLabel = useCallback(async (labelId: number, body: CollectionLabelUpdateRequest) => {
    try { await updateLabel(labelId, body) }
    catch (err) { toast.error(getApiErrorMessage(err, t('common.error'))) }
  }, [updateLabel, toast, t])

  const handleDeleteLabel = useCallback(async (labelId: number) => {
    try { await deleteLabel(labelId) }
    catch (err) { toast.error(getApiErrorMessage(err, t('common.error'))) }
  }, [deleteLabel, toast, t])

  // Bulk-assign one or more labels to the current selection.
  const handleBulkAssignLabels = useCallback(async (labelIds: number[]) => {
    if (selectedIds.length === 0 || labelIds.length === 0) return
    try {
      await assignLabels(labelIds, selectedIds)
      toast.success(t('collections.labels.assignedCount', { count: selectedIds.length }))
      setLabelPickerOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [assignLabels, selectedIds, toast, t])

  // Replace a single place's labels (from the detail sheet chips).
  const handleAssignPlaceLabels = useCallback(async (placeId: number, labelIds: number[]) => {
    try { await updatePlace(placeId, { label_ids: labelIds }) }
    catch (err) { toast.error(getApiErrorMessage(err, t('common.error'))) }
  }, [updatePlace, toast, t])

  const handleAcceptInvite = useCallback(async (collectionId: number) => {
    try {
      await acceptInvite(collectionId)
      navigate(`/collections/${collectionId}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [acceptInvite, navigate, toast, t])

  const handleDeclineInvite = useCallback(async (collectionId: number) => {
    try {
      await declineInvite(collectionId)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [declineInvite, toast, t])

  // Member left the active shared list — the store already cleared it; bounce to
  // the rail and close the share modal. Errors are surfaced inside the modal.
  const handleAfterLeave = useCallback(() => {
    setShowShare(false)
    navigate('/collections')
  }, [navigate])

  // ── Detail panel (re-pointed PlaceInspector in collection mode) ──────
  const selectedPlace = useMemo(
    () => places.find(p => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId],
  )

  // PlaceInspector expects a trip Place; the collection place lacks trip_id, so
  // shim it (collection mode guards every trip-only sub-panel anyway).
  const detailPlace = useMemo<Place | null>(
    () => (selectedPlace ? ({ ...selectedPlace, trip_id: selectedPlace.source_trip_id ?? 0 } as unknown as Place) : null),
    [selectedPlace],
  )

  // A single-entry categories array so the inspector header can show the chip.
  const detailCategories = useMemo<Category[]>(
    () => (selectedPlace?.category ? ([selectedPlace.category] as unknown as Category[]) : []),
    [selectedPlace],
  )

  const handleCloseDetail = useCallback(() => setSelectedPlaceId(null), [setSelectedPlaceId])

  const handleDetailStatus = useCallback((status: CollectionStatus) => {
    if (selectedPlaceId != null) handleStatusChange(selectedPlaceId, status)
  }, [selectedPlaceId, handleStatusChange])

  const handleDetailRemove = useCallback(async () => {
    if (selectedPlaceId == null) return
    await handleDeletePlace(selectedPlaceId)
    setSelectedPlaceId(null)
  }, [selectedPlaceId, handleDeletePlace, setSelectedPlaceId])

  // ── Copy to trip ────────────────────────────────────────────────────
  const openCopyForSelectedPlace = useCallback(() => {
    if (selectedPlaceId != null) setCopyIds([selectedPlaceId])
  }, [selectedPlaceId])

  const openCopyForSelection = useCallback(() => {
    if (selectedIds.length > 0) setCopyIds([...selectedIds])
  }, [selectedIds])

  const closeCopy = useCallback(() => setCopyIds(null), [])

  const handleCopyToTrip = useCallback(async (tripId: number) => {
    const ids = copyIds ?? []
    const res = await copyToTrip(tripId, ids)
    if (selectMode) clearSelection()
    return res
  }, [copyIds, copyToTrip, selectMode, clearSelection])

  return {
    t, language, dark, navigate,
    isWide, heroRef: hero.ref, heroHeight: hero.height,
    listColRef: listCol.ref, listColRect: listCol.rect, categories,
    // store data
    collections, ownedLists, sharedLists, activeCollection, isAllSaved, isOwner,
    myRole, canEdit, canDelete,
    canShare, shareMemberCount,
    activeId, places, visiblePlaces, mappable, members, incomingInvites, counts,
    view, statusFilter, categoryFilter, categoryOptions, search, selectedPlaceId, selectMode, selectedIds,
    labels, labelFilter, labelOptions,
    loading, placesLoading,
    // store setters
    setView, setStatusFilter, setCategoryFilter, setLabelFilter, setSearch, setSelectedPlaceId, setSelectMode, toggleSelect,
    updatePlace,
    // labels
    showLabelManager, setShowLabelManager, labelPickerOpen, setLabelPickerOpen,
    handleCreateLabel, handleUpdateLabel, handleDeleteLabel, handleBulkAssignLabels, handleAssignPlaceLabels,
    // local UI state
    editorTarget, setEditorTarget, handleEditorCreated,
    showAddPlace, setShowAddPlace, handlePlaceAdded,
    confirmDeleteList, setConfirmDeleteList,
    mobileRailOpen, setMobileRailOpen,
    showShare, setShowShare, handleAfterLeave,
    // detail panel + copy-to-trip
    selectedPlace, detailPlace, detailCategories, handleCloseDetail,
    handleDetailStatus, handleDetailRemove,
    copyIds, openCopyForSelectedPlace, openCopyForSelection, closeCopy, handleCopyToTrip,
    // handlers
    handleSelectList, handleDeleteList,
    handleStatusChange, handleDeletePlace, handleDeleteSelected,
    handleAcceptInvite, handleDeclineInvite,
    allVisibleSelected, handleSelectAll,
    listPickerMode, setListPickerMode, handleMoveToList, handleDuplicateToList,
  }
}
