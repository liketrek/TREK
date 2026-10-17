import { useState, useMemo, useRef, useEffect } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { tripsApi } from '../../api/client'
import { useAddonStore } from '../../store/addonStore'
import type { PackingItem } from '../../types'
import { parseImportLines, sortItemsByName } from './packingListPanel.helpers'
import { groupPackingItems, packingCategoryOrder, packingProgress, packingViewItems } from './packingListModel'
import { usePackingBags } from './usePackingBags'
import { usePackingCategoryAssignees } from './usePackingCategoryAssignees'
import { usePackingImport } from './usePackingImport'
import { usePackingItemActions } from './usePackingItemActions'
import { usePackingTemplates } from './usePackingTemplates'

export type { CategoryAssignee } from './usePackingCategoryAssignees'

const PACKING_SORT_KEY = 'trek:packing-sort'

export type PackingSort = 'manual' | 'name'

export interface TripMember {
  id: number
  username: string
  avatar?: string | null
  avatar_url?: string | null
  is_guest?: boolean
}

export interface PackingListPanelProps {
  tripId: number
  items: PackingItem[]
  openImportSignal?: number
  // Raised by the Lists bar's Add list button, which opens the name field here.
  addCategorySignal?: number
  saveTemplateSignal?: number
  inlineHeader?: boolean
  // Lifted so an out-of-panel Apply Template button knows the active view (#1565).
  view?: 'common' | 'personal'
  onViewChange?: (view: 'common' | 'personal') => void
}

/**
 * Packing list state: trip members + per-category assignees, category grouping
 * and progress, item/category CRUD, bag tracking (weights + members) and the
 * template apply/save + bulk CSV import flows (driven by signal props). The
 * sections below render header, filters, the grouped list, the bag sidebar/
 * modal and the import dialog.
 */
export function usePackingList({ tripId, items, openImportSignal = 0, addCategorySignal = 0, saveTemplateSignal = 0, inlineHeader = true, view: viewProp, onViewChange }: PackingListPanelProps) {
  const [filter, setFilter] = useState('alle') // 'alle' | 'offen' | 'erledigt'
  // A-Z only changes what is shown; the manual order stays stored underneath and
  // comes back when the switch is turned off. Remembered per browser.
  const [sort, setSortState] = useState<PackingSort>(() => {
    try { return localStorage.getItem(PACKING_SORT_KEY) === 'name' ? 'name' : 'manual' } catch { return 'manual' }
  })
  const setSort = (next: PackingSort) => {
    setSortState(next)
    try { localStorage.setItem(PACKING_SORT_KEY, next) } catch { /* storage unavailable: the choice lasts until reload */ }
  }
  // Three-tier sharing (#858): 'common' = the group pool (where existing items
  // live — non-breaking), 'personal' = my own list (private + shared-to-me).
  const [ownView, setOwnView] = useState<'common' | 'personal'>('common')
  const view = viewProp ?? ownView
  const setView = onViewChange ?? setOwnView
  const { addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem, reorderPackingItems,
    setPackingItemSharing, clonePackingItem, addPackingContributor, removePackingContributor } = useTripStore()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canEdit = can('packing_edit', trip)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const currentUserId = useAuthStore((s) => s.user?.id)
  const toast = useToast()
  const { t, locale } = useTranslation()

  // Trip members & category assignees
  const [tripMembers, setTripMembers] = useState<TripMember[]>([])

  useEffect(() => {
    tripsApi.getMembers(tripId).then(data => {
      const all: TripMember[] = []
      if (data.owner) all.push({ id: data.owner.id, username: data.owner.username, avatar: data.owner.avatar_url, is_guest: false })
      if (data.members) all.push(...data.members.map((m: any) => ({ id: m.id, username: m.username, avatar: m.avatar_url, is_guest: !!m.is_guest })))
      setTripMembers(all)
    }).catch(() => {})
  }, [tripId])

  const { categoryAssignees, setAssignees: handleSetAssignees } = usePackingCategoryAssignees({ tripId, t, toast })

  // Split by the active view (#858): Common = group pool (is_private 0), Personal =
  // my own + shared-to-me (is_private 1, already filtered to me by the server).
  const viewItems = useMemo(() => packingViewItems(items, view), [items, view])

  const allCategories = useMemo(() => packingCategoryOrder(viewItems, t('packing.defaultCategory')), [viewItems, t])

  const gruppiert = useMemo(() => {
    const status = filter === 'offen' ? 'open' : filter === 'erledigt' ? 'done' : 'all'
    const groups: Record<string, PackingItem[]> = {}
    for (const group of groupPackingItems(viewItems, status, t('packing.defaultCategory'))) {
      groups[group.category] = sort === 'name' ? sortItemsByName(group.items, locale) : group.items
    }
    return groups
  }, [viewItems, filter, sort, locale, t])

  const { checked: abgehakt, pct: fortschritt } = packingProgress(viewItems)

  const {
    addingCategory, setAddingCategory, newCategoryName: newCatName, setNewCategoryName: setNewCatName,
    addItemToCategory: handleAddItemToCategory, deleteItem: handleDeleteItem, addNewCategory: handleAddNewCategory,
    renameCategory: handleRenameCategory, deleteCategoryItems: handleDeleteCategory, clearChecked,
  } = usePackingItemActions({
    tripId, items, view, currentUserId, categories: allCategories, defaultCategory: t('packing.defaultCategory'),
    actions: { addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem }, t, toast, placeholderFrom: 'store',
  })

  const handleClearChecked = async () => {
    if (!confirm(t('packing.confirm.clearChecked', { count: abgehakt }))) return
    await clearChecked()
  }

  // Bag tracking — the global toggle is a packing sub-flag surfaced to every
  // authenticated user via the addon store (loaded on app start), not the
  // admin-only endpoint, so non-admin members see weights/bags too.
  const bagTrackingEnabled = useAddonStore(s => s.bagTracking)
  const addonsLoaded = useAddonStore(s => s.loaded)
  const loadAddons = useAddonStore(s => s.loadAddons)
  const [newBagName, setNewBagName] = useState('')
  const [showAddBag, setShowAddBag] = useState(false)
  const [showBagModal, setShowBagModal] = useState(false)

  useEffect(() => {
    if (!addonsLoaded) loadAddons()
  }, [addonsLoaded, loadAddons])

  const {
    bags, unassignedWeightGrams, serverWeightsFresh, tryCreateBag, createBag: handleCreateBagByName,
    deleteBag: handleDeleteBag, updateBag: handleUpdateBag, setBagMembers: handleSetBagMembers,
  } = usePackingBags({ tripId, bagTrackingEnabled, t, toast })

  const handleCreateBag = async () => {
    if (!newBagName.trim()) return
    if (await tryCreateBag(newBagName.trim())) {
      setNewBagName(''); setShowAddBag(false)
    }
  }

  // Templates
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const lastHandledImportSignal = useRef(openImportSignal)
  const lastHandledAddCategorySignal = useRef(addCategorySignal)
  const lastHandledSaveSignal = useRef(saveTemplateSignal)

  useEffect(() => {
    if (openImportSignal !== lastHandledImportSignal.current && openImportSignal > 0) {
      setShowImportModal(true)
    }
    lastHandledImportSignal.current = openImportSignal
  }, [openImportSignal])

  useEffect(() => {
    if (addCategorySignal !== lastHandledAddCategorySignal.current && addCategorySignal > 0) {
      setAddingCategory(true)
    }
    lastHandledAddCategorySignal.current = addCategorySignal
  }, [addCategorySignal, setAddingCategory])

  useEffect(() => {
    if (saveTemplateSignal !== lastHandledSaveSignal.current && saveTemplateSignal > 0) {
      setShowSaveTemplate(true)
    }
    lastHandledSaveSignal.current = saveTemplateSignal
  }, [saveTemplateSignal])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const templateDropdownRef = useRef<HTMLDivElement>(null)

  const {
    templates: availableTemplates, applyingTemplate, applyTemplate: handleApplyTemplate,
    saveTemplateName, setSaveTemplateName, saveAsTemplate: handleSaveAsTemplate,
  } = usePackingTemplates({
    tripId, view, t, toast,
    onApplied: () => setShowTemplateDropdown(false),
    onSaved: () => setShowSaveTemplate(false),
  })

  useEffect(() => {
    if (!showTemplateDropdown) return
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) setShowTemplateDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTemplateDropdown])

  const {
    text: importText, setText: setImportText, readFile: handleCsvFile, runImport: handleBulkImport,
  } = usePackingImport({ tripId, t, toast, onImported: () => setShowImportModal(false), reportEmpty: true })

  const font = { fontFamily: "var(--font-system)" }

  // ── Three-tier sharing handlers (#858) ──────────────────────────────────────
  const handleSetSharing = (id: number, visibility: 'common' | 'personal' | 'shared', recipientIds: number[]) =>
    setPackingItemSharing(tripId, id, visibility, recipientIds)
  const handleCloneItem = (id: number) => clonePackingItem(tripId, id)
  const handleJoinItem = (id: number) => addPackingContributor(tripId, id)
  const handleLeaveItem = (id: number, userId: number) => removePackingContributor(tripId, id, userId)

  return {
    view, setView, currentUserId,
    handleSetSharing, handleCloneItem, handleJoinItem, handleLeaveItem,
    tripId, items, inlineHeader, t, canEdit, isAdmin, font, reorderPackingItems,
    filter, setFilter, sort, setSort, addingCategory, setAddingCategory, newCatName, setNewCatName,
    tripMembers, categoryAssignees, handleSetAssignees, allCategories, gruppiert, abgehakt, fortschritt,
    handleAddItemToCategory, handleAddNewCategory, handleRenameCategory, handleDeleteCategory, handleDeleteItem, handleClearChecked,
    bagTrackingEnabled, bags, unassignedWeightGrams, serverWeightsFresh, newBagName, setNewBagName, showAddBag, setShowAddBag, showBagModal, setShowBagModal,
    handleCreateBag, handleCreateBagByName, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    availableTemplates, showTemplateDropdown, setShowTemplateDropdown, applyingTemplate,
    showSaveTemplate, setShowSaveTemplate, saveTemplateName, setSaveTemplateName,
    showImportModal, setShowImportModal, importText, setImportText,
    csvInputRef, templateDropdownRef, handleApplyTemplate, handleSaveAsTemplate, parseImportLines, handleBulkImport, handleCsvFile,
  }
}

export type PackingState = ReturnType<typeof usePackingList>
