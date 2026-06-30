import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { useToast } from '../../components/shared/Toast'
import { getApiErrorMessage } from '../../types'
import { addListener, removeListener } from '../../api/websocket'
import { useCollectionStore, ALL_SAVED } from '../../store/collectionStore'
import type { ActiveCollectionId } from '../../store/collectionStore'
import type { CollectionStatus } from '@trek/shared'
import type { Category, Place } from '../../types'
import { filterPlaces, sortPlaces, statusCounts } from './collectionsModel'

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

  const store = useCollectionStore()
  const {
    collections, activeId, places, members, incomingInvites,
    view, statusFilter, search, selectedPlaceId, selectMode, selectedIds,
    loading, placesLoading,
    loadAll, setActive,
    createCollection, updateCollection, deleteCollection,
    setStatus, deletePlace, deleteMany, copyToTrip, clearSelection,
    acceptInvite, declineInvite,
    setView, setStatusFilter, setSearch, setSelectedPlaceId, setSelectMode, toggleSelect,
  } = store

  // ── Page-local UI state ─────────────────────────────────────────────
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState('#6366f1')
  const [editingListId, setEditingListId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteList, setConfirmDeleteList] = useState<number | null>(null)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  // The place ids the Copy-to-trip modal is open for (null = closed). Single
  // place from the detail panel, or the select-mode set for a bulk copy.
  const [copyIds, setCopyIds] = useState<number[] | null>(null)

  // Initial load.
  useEffect(() => { loadAll() }, [])

  // Keep the active list in sync with the URL (/collections/:id, or the
  // "All saved" union at /collections).
  useEffect(() => {
    const next: ActiveCollectionId = routeId ? Number(routeId) : ALL_SAVED
    if (Number.isNaN(next as number)) return
    if (next !== activeId) setActive(next)
    // Only re-run when the route or the loaded list set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, collections.length])

  // Live sync via WebSocket. collections:deleted must bounce a member off a
  // list that was removed under them.
  const handleWsMessage = useCallback((msg: { type: string; collectionId?: number }) => {
    if (!msg.type?.startsWith('collections:')) return
    if (msg.type === 'collections:deleted') {
      if (msg.collectionId != null && activeId === msg.collectionId) {
        navigate('/collections')
      }
      loadAll()
      return
    }
    if (msg.type === 'collections:invite') {
      toast.info(t('collections.invites.received'))
    }
    // invite / accepted / declined / cancelled / left / updated → reload.
    loadAll()
    if (typeof activeId === 'number') setActive(activeId)
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

  const ownedLists = useMemo(() => collections.filter(c => c.is_owner !== false), [collections])
  const sharedLists = useMemo(() => collections.filter(c => c.is_owner === false), [collections])

  const visiblePlaces = useMemo(
    () => sortPlaces(filterPlaces(places, statusFilter, search)),
    [places, statusFilter, search],
  )
  const counts = useMemo(() => statusCounts(places), [places])

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSelectList = useCallback((id: ActiveCollectionId) => {
    setMobileRailOpen(false)
    navigate(id === ALL_SAVED || id === null ? '/collections' : `/collections/${id}`)
  }, [navigate])

  const handleCreateList = useCallback(async () => {
    const name = newListName.trim()
    if (!name) return
    setCreating(true)
    try {
      const created = await createCollection(name, newListColor)
      setShowNewList(false)
      setNewListName('')
      setNewListColor('#6366f1')
      if (created) navigate(`/collections/${created.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    } finally {
      setCreating(false)
    }
  }, [newListName, newListColor, createCollection, navigate, toast, t])

  const handleStartRename = useCallback((id: number, currentName: string) => {
    setEditingListId(id)
    setEditingName(currentName)
  }, [])

  const handleCommitRename = useCallback(async () => {
    if (editingListId == null) return
    const name = editingName.trim()
    if (name) {
      try {
        await updateCollection(editingListId, { name })
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('common.error')))
      }
    }
    setEditingListId(null)
    setEditingName('')
  }, [editingListId, editingName, updateCollection, toast, t])

  const handleSetColor = useCallback(async (id: number, color: string) => {
    try {
      await updateCollection(id, { color })
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }, [updateCollection, toast, t])

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
    // store data
    collections, ownedLists, sharedLists, activeCollection, isAllSaved, isOwner,
    activeId, places, visiblePlaces, members, incomingInvites, counts,
    view, statusFilter, search, selectedPlaceId, selectMode, selectedIds,
    loading, placesLoading,
    // store setters
    setView, setStatusFilter, setSearch, setSelectedPlaceId, setSelectMode, toggleSelect,
    // local UI state
    showNewList, setShowNewList, newListName, setNewListName, newListColor, setNewListColor, creating,
    editingListId, editingName, setEditingName,
    confirmDeleteList, setConfirmDeleteList,
    mobileRailOpen, setMobileRailOpen,
    // detail panel + copy-to-trip
    selectedPlace, detailPlace, detailCategories, handleCloseDetail,
    handleDetailStatus, handleDetailRemove,
    copyIds, openCopyForSelectedPlace, openCopyForSelection, closeCopy, handleCopyToTrip,
    // handlers
    handleSelectList, handleCreateList,
    handleStartRename, handleCommitRename, handleSetColor, handleDeleteList,
    handleStatusChange, handleDeletePlace, handleDeleteSelected,
    handleAcceptInvite, handleDeclineInvite,
  }
}
