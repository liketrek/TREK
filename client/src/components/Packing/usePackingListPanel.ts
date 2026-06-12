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
import { BAG_COLORS } from './packingListPanel.constants'
import { parseImportLines } from './packingListPanel.helpers'

export interface TripMember {
  id: number
  username: string
  avatar?: string | null
  avatar_url?: string | null
}

export interface CategoryAssignee {
  user_id: number
  username: string
  avatar?: string | null
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
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const { addPackingItem, updatePackingItem, deletePackingItem } = useTripStore()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canEdit = can('packing_edit', trip)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const toast = useToast()
  const { t } = useTranslation()

  // Trip members & category assignees
  const [tripMembers, setTripMembers] = useState<TripMember[]>([])
  const [categoryAssignees, setCategoryAssignees] = useState<Record<string, CategoryAssignee[]>>({})

  useEffect(() => {
    tripsApi.getMembers(tripId).then(data => {
      const all: TripMember[] = []
      if (data.owner) all.push({ id: data.owner.id, username: data.owner.username, avatar: data.owner.avatar_url })
      if (data.members) all.push(...data.members.map((m: any) => ({ id: m.id, username: m.username, avatar: m.avatar_url })))
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

  const allCategories = useMemo(() => {
    const seen: string[] = []
    for (const item of items) {
      const cat = item.category || t('packing.defaultCategory')
      if (!seen.includes(cat)) seen.push(cat)
    }
    return seen
  }, [items, t])

  const gruppiert = useMemo(() => {
    const filtered = items.filter(i => {
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
  }, [items, filter, t])

  const abgehakt = items.filter(i => i.checked).length
  const fortschritt = items.length > 0 ? Math.round((abgehakt / items.length) * 100) : 0

  const handleAddItemToCategory = async (category: string, name: string) => {
    try {
      await addPackingItem(tripId, { name, category })
    } catch { toast.error(t('packing.toast.addError')) }
  }

  const handleAddNewCategory = async () => {
    if (!newCatName.trim()) return
    let catName = newCatName.trim()
    // Allow duplicate display names — append invisible zero-width spaces to make unique internally
    while (allCategories.includes(catName)) {
      catName += '​'
    }
    try {
      await addPackingItem(tripId, { name: '...', category: catName })
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

  return {
    tripId, items, inlineHeader, t, canEdit, isAdmin, font,
    filter, setFilter, addingCategory, setAddingCategory, newCatName, setNewCatName,
    tripMembers, categoryAssignees, handleSetAssignees, allCategories, gruppiert, abgehakt, fortschritt,
    handleAddItemToCategory, handleAddNewCategory, handleRenameCategory, handleDeleteCategory, handleClearChecked,
    bagTrackingEnabled, bags, newBagName, setNewBagName, showAddBag, setShowAddBag, showBagModal, setShowBagModal,
    handleCreateBag, handleCreateBagByName, handleDeleteBag, handleUpdateBag, handleSetBagMembers,
    availableTemplates, showTemplateDropdown, setShowTemplateDropdown, applyingTemplate,
    showSaveTemplate, setShowSaveTemplate, saveTemplateName, setSaveTemplateName,
    showImportModal, setShowImportModal, importText, setImportText,
    csvInputRef, templateDropdownRef, handleApplyTemplate, handleSaveAsTemplate, parseImportLines, handleBulkImport, handleCsvFile,
  }
}

export type PackingState = ReturnType<typeof usePackingList>
