import { useState, useMemo, useRef, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { packingApi, tripsApi } from '../../api/client'
import { useAddonStore } from '../../store/addonStore'
import type { PackingItem, PackingBag } from '../../types'
import { BAG_COLORS, PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'
import { parseImportLines } from './packingListPanel.helpers'

export interface TripMember {
  id: number
  username: string
  avatar?: string | null
  avatar_url?: string | null
  is_guest?: boolean
}

export interface CategoryAssignee {
  user_id: number
  username: string
  avatar?: string | null
  is_guest?: boolean
}

export interface PackingListPanelProps {
  tripId: number
  items: PackingItem[]
  openImportSignal?: number
  clearCheckedSignal?: number
  saveTemplateSignal?: number
  inlineHeader?: boolean
}

/**
 * Packing list state: trip members + per-category assignees, category grouping
 * and progress, item/category CRUD, bag tracking (weights + members) and the
 * template apply/save + bulk CSV import flows (driven by signal props). The
 * sections below render header, filters, the grouped list, the bag sidebar/
 * modal and the import dialog.
 */
export function usePackingList({ tripId, items, openImportSignal = 0, clearCheckedSignal = 0, saveTemplateSignal = 0, inlineHeader = true }: PackingListPanelProps) {
  const [filter, setFilter] = useState('alle') // 'alle' | 'offen' | 'erledigt'
  // Three-tier sharing (#858): 'common' = the group pool (where existing items
  // live — non-breaking), 'personal' = my own list (private + shared-to-me).
  const [view, setView] = useState<'common' | 'personal'>('common')
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const { addPackingItem, updatePackingItem, deletePackingItem, togglePackingItem, reorderPackingItems,
    setPackingItemSharing, clonePackingItem, addPackingContributor, removePackingContributor } = useTripStore()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canEdit = can('packing_edit', trip)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const currentUserId = useAuthStore((s) => s.user?.id)
  const toast = useToast()
  const { t } = useTranslation()

  // Trip members & category assignees
  const [tripMembers, setTripMembers] = useState<TripMember[]>([])
  const [categoryAssignees, setCategoryAssignees] = useState<Record<string, CategoryAssignee[]>>({})

  useEffect(() => {
    tripsApi.getMembers(tripId).then(data => {
      const all: TripMember[] = []
      if (data.owner) all.push({ id: data.owner.id, username: data.owner.username, avatar: data.owner.avatar_url, is_guest: false })
      if (data.members) all.push(...data.members.map((m: any) => ({ id: m.id, username: m.username, avatar: m.avatar_url, is_guest: !!m.is_guest })))
      setTripMembers(all)
    }).catch(() => {})
    packingApi.getCategoryAssignees(tripId).then(data => {
      setCategoryAssignees(data.assignees || {})
    }).catch(() => {})
  }, [tripId])

  const handleSetAssignees = async (category: string, userIds: number[]) => {
    try {
      const data = await packingApi.setCategoryAssignees(tripId, category, userIds)
      setCategoryAssignees(prev => ({ ...prev, [category]: data.assignees || [] }))
    } catch {
      toast.error(t('packing.toast.saveError'))
    }
  }

  // Split by the active view (#858): Common = group pool (is_private 0), Personal =
  // my own + shared-to-me (is_private 1, already filtered to me by the server).
  const viewItems = useMemo(
    () => items.filter(i => (view === 'common' ? !i.is_private : !!i.is_private)),
    [items, view],
  )

  const allCategories = useMemo(() => {
    const seen: string[] = []
    for (const item of viewItems) {
      const cat = item.category || t('packing.defaultCategory')
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [viewItems, t])

  const gruppiert = useMemo(() => {
    const filtered = viewItems.filter(i => {
      if (filter === 'offen') return !i.checked
      if (filter === 'erledigt') return i.checked
      return true
    })
    const groups: Record<string, PackingItem[]> = {}
    for (const item of filtered) {
      const kat = item.category || t('packing.defaultCategory')
      if (!groups[kat]) groups[kat] = []
      groups[kat].push(item)
    }
    return groups
  }, [viewItems, filter, t])

  const abgehakt = viewItems.filter(i => i.checked).length
  const fortschritt = viewItems.length > 0 ? Math.round((abgehakt / viewItems.length) * 100) : 0

  const handleAddItemToCategory = async (category: string, name: string) => {
    try {
      // Reuse the '...' placeholder slot when the category already has one, so a
      // freshly-emptied category keeps its position (and therefore its colour)
      // instead of the new item being appended to the end of the list.
      const placeholder = useTripStore.getState().packingItems.find(
        i => i.category === category && i.name === PACKING_PLACEHOLDER_NAME
      )
      if (placeholder) {
        await updatePackingItem(tripId, placeholder.id, { name })
      } else {
        // New items inherit the active view's tier: Personal in "my list", Common otherwise.
        await addPackingItem(tripId, { name, category, visibility: view === 'personal' ? 'personal' : 'common' } as Parameters<typeof addPackingItem>[1])
      }
    } catch { toast.error(t('packing.toast.addError')) }
  }

  // Deleting an item from a row. When it is the last item of a user-created
  // category, turn that row back into the '...' placeholder in place rather than
  // deleting it (#1289). Updating the row keeps its id, list position and colour,
  // so the category neither disappears nor jumps to the end. The default
  // (uncategorized) group and the placeholder row itself are deleted normally —
  // removing the placeholder is how an empty category is dismissed.
  const handleDeleteItem = async (item: PackingItem) => {
    const category = item.category
    const isLastInCategory = !!category
      && item.name !== PACKING_PLACEHOLDER_NAME
      && !items.some(i => i.id !== item.id && i.category === category)
    try {
      if (isLastInCategory) {
        if (item.checked) await togglePackingItem(tripId, item.id, false)
        await updatePackingItem(tripId, item.id, {
          name: PACKING_PLACEHOLDER_NAME, weight_grams: null, bag_id: null, quantity: 1,
        })
      } else {
        await deletePackingItem(tripId, item.id)
      }
    } catch {
      toast.error(t('packing.toast.deleteError'))
    }
  }

  const handleAddNewCategory = async () => {
    if (!newCatName.trim()) return
    let catName = newCatName.trim()
    // Allow duplicate display names — append invisible zero-width spaces to make unique internally
    while (allCategories.includes(catName)) {
      catName += '​'
    }
    try {
      await addPackingItem(tripId, { name: '...', category: catName, visibility: view === 'personal' ? 'personal' : 'common' } as Parameters<typeof addPackingItem>[1])
      setNewCatName('')
      setAddingCategory(false)
    } catch { toast.error(t('packing.toast.addError')) }
  }

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const toUpdate = items.filter(i => (i.category || t('packing.defaultCategory')) === oldName)
    for (const item of toUpdate) {
      await updatePackingItem(tripId, item.id, { category: newName })
    }
  }

  const handleDeleteCategory = async (catItems: PackingItem[]) => {
    let failed = false
    for (const item of catItems) {
      try { await deletePackingItem(tripId, item.id) } catch { failed = true }
    }
    if (failed) toast.error(t('packing.toast.deleteError'))
  }

  const handleClearChecked = async () => {
    if (!confirm(t('packing.confirm.clearChecked', { count: abgehakt }))) return
    let failed = false
    for (const item of items.filter(i => i.checked)) {
      try { await deletePackingItem(tripId, item.id) } catch { failed = true }
    }
    if (failed) toast.error(t('packing.toast.deleteError'))
  }

  // Bag tracking — the global toggle is a packing sub-flag surfaced to every
  // authenticated user via the addon store (loaded on app start), not the
  // admin-only endpoint, so non-admin members see weights/bags too.
  const bagTrackingEnabled = useAddonStore(s => s.bagTracking)
  const addonsLoaded = useAddonStore(s => s.loaded)
  const loadAddons = useAddonStore(s => s.loadAddons)
  const [bags, setBags] = useState<PackingBag[]>([])
  const [newBagName, setNewBagName] = useState('')
  const [showAddBag, setShowAddBag] = useState(false)
  const [showBagModal, setShowBagModal] = useState(false)

  useEffect(() => {
    if (!addonsLoaded) loadAddons()
  }, [addonsLoaded, loadAddons])

  useEffect(() => {
    if (bagTrackingEnabled) packingApi.listBags(tripId).then(r => setBags(r.bags || [])).catch(() => {})
  }, [tripId, bagTrackingEnabled])

  const handleCreateBag = async () => {
    if (!newBagName.trim()) return
    try {
      const data = await packingApi.createBag(tripId, { name: newBagName.trim(), color: BAG_COLORS[bags.length % BAG_COLORS.length] })
      setBags(prev => [...prev, data.bag])
      setNewBagName(''); setShowAddBag(false)
    } catch { toast.error(t('packing.toast.saveError')) }
  }

  const handleCreateBagByName = async (name: string): Promise<PackingBag | undefined> => {
    try {
      const data = await packingApi.createBag(tripId, { name, color: BAG_COLORS[bags.length % BAG_COLORS.length] })
      setBags(prev => [...prev, data.bag])
      return data.bag
    } catch { toast.error(t('packing.toast.saveError')); return undefined }
  }

  const handleDeleteBag = async (bagId: number) => {
    try {
      await packingApi.deleteBag(tripId, bagId)
      setBags(prev => prev.filter(b => b.id !== bagId))
    } catch { toast.error(t('packing.toast.deleteError')) }
  }

  const handleUpdateBag = async (bagId: number, data: Record<string, any>) => {
    try {
      const result = await packingApi.updateBag(tripId, bagId, data)
      setBags(prev => prev.map(b => b.id === bagId ? { ...b, ...result.bag } : b))
    } catch { toast.error(t('common.error')) }
  }

  const handleSetBagMembers = async (bagId: number, userIds: number[]) => {
    try {
      const result = await packingApi.setBagMembers(tripId, bagId, userIds)
      setBags(prev => prev.map(b => b.id === bagId ? { ...b, members: result.members } : b))
    } catch { toast.error(t('common.error')) }
  }

  // Templates
  const [availableTemplates, setAvailableTemplates] = useState<{ id: number; name: string; item_count: number }[]>([])
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const lastHandledImportSignal = useRef(openImportSignal)
  const lastHandledClearSignal = useRef(clearCheckedSignal)
  const lastHandledSaveSignal = useRef(saveTemplateSignal)

  useEffect(() => {
    if (openImportSignal !== lastHandledImportSignal.current && openImportSignal > 0) {
      setShowImportModal(true)
    }
    lastHandledImportSignal.current = openImportSignal
  }, [openImportSignal])

  useEffect(() => {
    if (clearCheckedSignal !== lastHandledClearSignal.current && clearCheckedSignal > 0) {
      handleClearChecked()
    }
    lastHandledClearSignal.current = clearCheckedSignal
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCheckedSignal])

  useEffect(() => {
    if (saveTemplateSignal !== lastHandledSaveSignal.current && saveTemplateSignal > 0) {
      setShowSaveTemplate(true)
    }
    lastHandledSaveSignal.current = saveTemplateSignal
  }, [saveTemplateSignal])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const templateDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    packingApi.listTemplates(tripId).then(d => setAvailableTemplates(d.templates || [])).catch(() => {})
  }, [tripId])

  useEffect(() => {
    if (!showTemplateDropdown) return
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) setShowTemplateDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTemplateDropdown])

  const handleApplyTemplate = async (templateId: number) => {
    setApplyingTemplate(true)
    try {
      const data = await packingApi.applyTemplate(tripId, templateId)
      useTripStore.setState(s => ({ packingItems: [...s.packingItems, ...(data.items || [])] }))
      toast.success(t('packing.templateApplied', { count: data.count }))
      setShowTemplateDropdown(false)
    } catch {
      toast.error(t('packing.templateError'))
    } finally {
      setApplyingTemplate(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateName.trim()) return
    try {
      await packingApi.saveAsTemplate(tripId, saveTemplateName.trim())
      toast.success(t('packing.templateSaved'))
      setShowSaveTemplate(false)
      setSaveTemplateName('')
      packingApi.listTemplates(tripId).then(d => setAvailableTemplates(d.templates || [])).catch(() => {})
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleBulkImport = async () => {
    const parsed = parseImportLines(importText)
    if (parsed.length === 0) { toast.error(t('packing.importEmpty')); return }
    try {
      const result = await packingApi.bulkImport(tripId, parsed)
      useTripStore.setState(s => ({ packingItems: [...s.packingItems, ...(result.items || [])] }))
      toast.success(t('packing.importSuccess', { count: result.count }))
      setImportText('')
      setShowImportModal(false)
    } catch { toast.error(t('packing.importError')) }
  }

  const handleCsvFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setImportText(reader.result) }
    reader.readAsText(file)
  }

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
    filter, setFilter, addingCategory, setAddingCategory, newCatName, setNewCatName,
    tripMembers, categoryAssignees, handleSetAssignees, allCategories, gruppiert, abgehakt, fortschritt,
    handleAddItemToCategory, handleAddNewCategory, handleRenameCategory, handleDeleteCategory, handleDeleteItem, handleClearChecked,
    bagTrackingEnabled, bags, newBagName, setNewBagName, showAddBag, setShowAddBag, showBagModal, setShowBagModal,
    handleCreateBag, handleCreateBagByName, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    availableTemplates, showTemplateDropdown, setShowTemplateDropdown, applyingTemplate,
    showSaveTemplate, setShowSaveTemplate, saveTemplateName, setSaveTemplateName,
    showImportModal, setShowImportModal, importText, setImportText,
    csvInputRef, templateDropdownRef, handleApplyTemplate, handleSaveAsTemplate, parseImportLines, handleBulkImport, handleCsvFile,
  }
}

export type PackingState = ReturnType<typeof usePackingList>
