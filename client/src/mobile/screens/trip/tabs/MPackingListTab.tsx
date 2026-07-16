import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Briefcase, Check, CheckCheck, ChevronDown, ChevronUp, HandHelping,
  LayoutTemplate, MoreHorizontal, Package, Pencil, Plus, RotateCcw, Save as SaveIcon, Trash2, Upload, UserPlus, Users, UserRound,
} from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useAuthStore } from '../../../../store/authStore'
import { useAddonStore } from '../../../../store/addonStore'
import { useTripStore } from '../../../../store/tripStore'
import { packingApi } from '../../../../api/client'
import type { PackingUpdateBagRequest } from '@trek/shared'
import type { PackingBag, PackingItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { FIELD_CLS } from '../sheets/PlSheetChrome'
import { TabScroller } from './tabChrome'
import { katColor } from '../../../../components/Packing/packingListPanel.helpers'
import { BAG_COLORS, PACKING_PLACEHOLDER_NAME } from '../../../../components/Packing/packingListPanel.constants'
import {
  formatWeight, groupPackingItems, isLastCustomItemInCategory, isPackingPlaceholder,
  packingCategoryOrder, packingProgress, packingViewItems,
  type PackingCategoryGroup, type PackingStatusFilter, type PackingView,
} from './listsModel'
import MBagsSheet from './MBagsSheet'
import MPackItemSheet from './MPackItemSheet'
import MPackingImportSheet from './MPackingImportSheet'

type ActionView = 'menu' | 'apply' | 'save'
interface CategoryAssignee { user_id: number; username: string }
interface PackingTemplate { id: number; name: string; item_count: number }

/**
 * Packing sub-tab (spec 03 §4.1-4.4): progress card, action menu (remove
 * checked / apply+save template / import), Shared|My-list + All|Open|Done
 * filters, and the category cards. Category-level state (rename/menu/assign/
 * add-item, bag picker) lives inside the row components below, mirroring how
 * the desktop `KategorieGruppe`/`ArtikelZeile` keep it local too.
 */
export default function MPackingListTab({ planner }: { planner: TripPlanner }) {
  const { t, toast, tripId, packingItems: items, tripActions } = planner
  const canEdit = planner.can('packing_edit', planner.trip)
  const isAdmin = useAuthStore(s => s.user?.role === 'admin')
  const currentUserId = useAuthStore(s => s.user?.id) ?? null
  // Bag-tracking is a global addon flag, NOT part of planner.enabledAddons (§6.4).
  const bagTrackingEnabled = useAddonStore(s => s.bagTracking)
  const tripMembers = planner.tripMembers

  const [view, setView] = useState<PackingView>('common')
  const [statusFilter, setStatusFilter] = useState<PackingStatusFilter>('all')
  const [editMode, setEditMode] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionView, setActionView] = useState<ActionView>('menu')
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [showBagsSheet, setShowBagsSheet] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{ name: string; items: PackingItem[] } | null>(null)

  const [bags, setBags] = useState<PackingBag[]>([])
  const [templates, setTemplates] = useState<PackingTemplate[]>([])
  const [categoryAssignees, setCategoryAssignees] = useState<Record<string, CategoryAssignee[]>>({})

  useEffect(() => {
    if (!bagTrackingEnabled) return
    packingApi.listBags(tripId).then(r => setBags(r.bags || [])).catch(() => {})
  }, [tripId, bagTrackingEnabled])

  useEffect(() => {
    packingApi.listTemplates(tripId).then(r => setTemplates(r.templates || [])).catch(() => {})
  }, [tripId])

  useEffect(() => {
    packingApi.getCategoryAssignees(tripId).then(r => setCategoryAssignees(r.assignees || {})).catch(() => {})
  }, [tripId])

  const defaultCategory = t('packing.defaultCategory')
  const viewItems = useMemo(() => packingViewItems(items, view), [items, view])
  const categoryOrder = useMemo(() => packingCategoryOrder(viewItems, defaultCategory), [viewItems, defaultCategory])
  const groups = useMemo(() => groupPackingItems(viewItems, statusFilter, defaultCategory), [viewItems, statusFilter, defaultCategory])
  const progress = packingProgress(viewItems)
  const checkedCount = viewItems.filter(i => i.checked).length

  const toggleCategory = (cat: string) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))

  const addItemToCategory = async (category: string, name: string) => {
    try {
      const placeholder = items.find(i => i.category === category && isPackingPlaceholder(i))
      if (placeholder) {
        await tripActions.updatePackingItem(tripId, placeholder.id, { name })
      } else {
        await tripActions.addPackingItem(
          tripId,
          { name, category, visibility: view === 'personal' ? 'personal' : 'common' } as Parameters<typeof tripActions.addPackingItem>[1],
        )
      }
    } catch {
      toast.error(t('packing.toast.addError'))
    }
  }

  const deleteItem = async (item: PackingItem) => {
    try {
      if (isLastCustomItemInCategory(item, items)) {
        if (item.checked) await tripActions.togglePackingItem(tripId, item.id, false)
        await tripActions.updatePackingItem(tripId, item.id, {
          name: PACKING_PLACEHOLDER_NAME, weight_grams: null, bag_id: null, quantity: 1,
        })
      } else {
        await tripActions.deletePackingItem(tripId, item.id)
      }
    } catch {
      toast.error(t('packing.toast.deleteError'))
    }
  }

  const renameCategory = async (oldName: string, newName: string) => {
    const toUpdate = items.filter(i => (i.category || defaultCategory) === oldName)
    try {
      for (const item of toUpdate) await tripActions.updatePackingItem(tripId, item.id, { category: newName })
    } catch {
      toast.error(t('packing.toast.renameError'))
    }
  }

  const deleteCategoryItems = async (catItems: PackingItem[]) => {
    let failed = false
    for (const item of catItems) {
      try { await tripActions.deletePackingItem(tripId, item.id) } catch { failed = true }
    }
    if (failed) toast.error(t('packing.toast.deleteError'))
  }

  const checkAllInCategory = async (catItems: PackingItem[]) => {
    try {
      for (const item of catItems) if (!item.checked) await tripActions.togglePackingItem(tripId, item.id, true)
    } catch {
      toast.error(t('packing.toast.saveError'))
    }
  }
  const uncheckAllInCategory = async (catItems: PackingItem[]) => {
    try {
      for (const item of catItems) if (item.checked) await tripActions.togglePackingItem(tripId, item.id, false)
    } catch {
      toast.error(t('packing.toast.saveError'))
    }
  }

  const addNewCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    let catName = trimmed
    while (categoryOrder.includes(catName)) catName += '​'
    try {
      await tripActions.addPackingItem(
        tripId,
        { name: PACKING_PLACEHOLDER_NAME, category: catName, visibility: view === 'personal' ? 'personal' : 'common' } as Parameters<typeof tripActions.addPackingItem>[1],
      )
      setNewCategoryName('')
      setAddingCategory(false)
    } catch {
      toast.error(t('packing.toast.addError'))
    }
  }

  const clearChecked = async () => {
    let failed = false
    for (const item of items.filter(i => i.checked)) {
      try { await tripActions.deletePackingItem(tripId, item.id) } catch { failed = true }
    }
    if (failed) toast.error(t('packing.toast.deleteError'))
  }

  const createBag = async (name: string): Promise<PackingBag | undefined> => {
    try {
      const data = await packingApi.createBag(tripId, { name, color: BAG_COLORS[bags.length % BAG_COLORS.length] })
      setBags(prev => [...prev, data.bag])
      return data.bag
    } catch {
      toast.error(t('packing.toast.saveError'))
      return undefined
    }
  }
  const updateBag = async (bagId: number, data: PackingUpdateBagRequest) => {
    try {
      const result = await packingApi.updateBag(tripId, bagId, data)
      setBags(prev => prev.map(b => (b.id === bagId ? { ...b, ...result.bag } : b)))
    } catch {
      toast.error(t('common.error'))
    }
  }
  const deleteBag = async (bagId: number) => {
    try {
      await packingApi.deleteBag(tripId, bagId)
      setBags(prev => prev.filter(b => b.id !== bagId))
    } catch {
      toast.error(t('packing.toast.deleteError'))
    }
  }
  const setBagMembers = async (bagId: number, userIds: number[]) => {
    try {
      const result = await packingApi.setBagMembers(tripId, bagId, userIds)
      setBags(prev => prev.map(b => (b.id === bagId ? { ...b, members: result.members } : b)))
    } catch {
      toast.error(t('common.error'))
    }
  }

  const setCategoryAssigneesFor = async (category: string, userIds: number[]) => {
    try {
      const data = await packingApi.setCategoryAssignees(tripId, category, userIds)
      setCategoryAssignees(prev => ({ ...prev, [category]: data.assignees || [] }))
    } catch {
      toast.error(t('packing.toast.saveError'))
    }
  }

  const applyTemplate = async (templateId: number) => {
    try {
      const data = await packingApi.applyTemplate(tripId, templateId)
      useTripStore.setState(s => ({ packingItems: [...s.packingItems, ...(data.items || [])] }))
      toast.success(t('packing.templateApplied', { count: data.count }))
      setActionsOpen(false)
      setActionView('menu')
    } catch {
      toast.error(t('packing.templateError'))
    }
  }

  const saveAsTemplate = async () => {
    if (!saveTemplateName.trim()) return
    try {
      await packingApi.saveAsTemplate(tripId, saveTemplateName.trim())
      toast.success(t('packing.templateSaved'))
      setSaveTemplateName('')
      setActionsOpen(false)
      setActionView('menu')
      packingApi.listTemplates(tripId).then(r => setTemplates(r.templates || [])).catch(() => {})
    } catch {
      toast.error(t('common.error'))
    }
  }

  const filterPillCls = (active: boolean) =>
    `flex-1 whitespace-nowrap rounded-full px-2 py-[6px] text-center text-[0.71875rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
    }`

  const trueEmpty = items.length === 0
  const viewEmpty = viewItems.length === 0

  return (
    <TabScroller>
      {/* ── Progress card (spec §4.1) ── */}
      <div className="rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[14px] py-[13px]">
        <div className="flex items-baseline gap-[7px]">
          <span className="font-geist text-[1rem] font-extrabold tabular-nums text-m-ink">{progress.checked}/{progress.total}</span>
          <span className="font-geist text-[0.625rem] font-bold text-m-faint">{progress.pct}%</span>
          <div className="ml-auto flex items-center gap-[6px]">
            {bagTrackingEnabled && (
              <button
                type="button"
                onClick={() => setShowBagsSheet(true)}
                className="flex items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[11px] py-[6px] text-[0.71875rem] font-semibold text-m-ink"
              >
                <Briefcase size={11} strokeWidth={2} />
                {t('packing.bags')}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditMode(v => !v)}
                aria-pressed={editMode}
                className={`flex items-center gap-[5px] rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
                  editMode ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
                }`}
              >
                <Pencil size={12} strokeWidth={2} />
                {editMode ? t('packing.editDone') : t('common.edit')}
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => setActionsOpen(v => !v)}
                aria-label={t('packing.actions')}
                aria-expanded={actionsOpen}
                className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
              >
                <MoreHorizontal size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-[9px] h-[5px] overflow-hidden rounded-full bg-[color:var(--m-ic)]">
          <div className="h-full rounded-full bg-m-act" style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      {/* ── Action menu (spec §4.2) ── */}
      {actionsOpen && canEdit && (
        <div className="mt-[6px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)] backdrop-blur-[24px]">
          {actionView === 'menu' && (
            <>
              {checkedCount > 0 && (
                <ActionRow
                  icon={Trash2}
                  label={t('packing.clearChecked', { count: checkedCount })}
                  danger
                  onClick={() => { setActionsOpen(false); setConfirmClear(true) }}
                />
              )}
              {templates.length > 0 && (
                <ActionRow icon={LayoutTemplate} label={t('packing.applyTemplate')} onClick={() => setActionView('apply')} />
              )}
              {isAdmin && items.length > 0 && (
                <ActionRow icon={SaveIcon} label={t('packing.saveAsTemplate')} onClick={() => setActionView('save')} />
              )}
              <ActionRow icon={Upload} label={t('packing.import')} onClick={() => { setActionsOpen(false); setShowImportSheet(true) }} />
            </>
          )}
          {actionView === 'apply' && (
            <div className="p-[6px]">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => applyTemplate(tmpl.id)}
                  className="flex w-full items-center gap-[9px] rounded-[10px] px-[10px] py-[9px] text-left"
                >
                  <Package size={14} strokeWidth={2} className="flex-none text-m-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.78125rem] font-semibold text-m-ink">{tmpl.name}</span>
                    <span className="block font-geist text-[0.625rem] text-m-faint">{tmpl.item_count} {t('admin.packingTemplates.items')}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {actionView === 'save' && (
            <div className="flex items-center gap-2 p-[10px]">
              <input
                type="text"
                autoFocus
                value={saveTemplateName}
                onChange={e => setSaveTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveAsTemplate() }}
                placeholder={t('packing.templateName')}
                className={`${FIELD_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={!saveTemplateName.trim()}
                aria-label={t('common.save')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filters (spec §4.3) ── */}
      {!trueEmpty && (
        <div className="mt-[10px] flex items-center gap-[6px]">
          <button type="button" onClick={() => setView('common')} className={filterPillCls(view === 'common')}>{t('packing.viewCommon')}</button>
          <button type="button" onClick={() => setView('personal')} className={filterPillCls(view === 'personal')}>{t('packing.viewPersonal')}</button>
          <span className="h-4 w-px flex-none bg-[color:var(--m-rowbr)]" />
          <button type="button" onClick={() => setStatusFilter('all')} className={filterPillCls(statusFilter === 'all')}>{t('packing.filterAll')}</button>
          <button type="button" onClick={() => setStatusFilter('open')} className={filterPillCls(statusFilter === 'open')}>{t('packing.filterOpen')}</button>
          <button type="button" onClick={() => setStatusFilter('done')} className={filterPillCls(statusFilter === 'done')}>{t('packing.filterDone')}</button>
        </div>
      )}

      {/* ── Categories + items (spec §4.4) ── */}
      {trueEmpty ? (
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <MDancingTrek scene="packing" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('packing.emptyTitle')}</p>
        </div>
      ) : viewEmpty ? (
        <div className="px-[30px] py-[26px] text-center font-geist text-[0.6875rem] leading-relaxed text-m-faint">
          {t('packing.personalEmptyHint')}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-[30px] py-[26px] text-center font-geist text-[0.6875rem] leading-relaxed text-m-faint">
          {t('packing.emptyFiltered')}
        </div>
      ) : (
        groups.map(group => (
          <PackingCategoryCard
            key={group.category}
            group={group}
            categoryOrder={categoryOrder}
            open={!collapsed[group.category]}
            onToggle={() => toggleCategory(group.category)}
            editMode={editMode}
            canEdit={canEdit}
            planner={planner}
            currentUserId={currentUserId}
            assignees={categoryAssignees[group.category] || []}
            tripMembers={tripMembers}
            onSetAssignees={userIds => setCategoryAssigneesFor(group.category, userIds)}
            onRename={newName => renameCategory(group.category, newName)}
            onCheckAll={() => checkAllInCategory(group.items)}
            onUncheckAll={() => uncheckAllInCategory(group.items)}
            onDeleteCategory={() => setDeleteCategoryTarget({ name: group.category, items: items.filter(i => (i.category || defaultCategory) === group.category) })}
            onAddItem={name => addItemToCategory(group.category, name)}
            onEditItem={id => setEditingItemId(id)}
            onDeleteItem={deleteItem}
            bagTrackingEnabled={bagTrackingEnabled}
            bags={bags}
            onCreateBag={createBag}
          />
        ))
      )}

      {canEdit && editMode && !trueEmpty && (
        addingCategory ? (
          <div className="mt-[10px] flex gap-2">
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addNewCategory()
                if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName('') }
              }}
              placeholder={t('packing.newCategoryPlaceholder')}
              className={`${FIELD_CLS} flex-1`}
            />
            <button
              type="button"
              onClick={addNewCategory}
              disabled={!newCategoryName.trim()}
              aria-label={t('common.add')}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
            >
              <Check size={15} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="mt-[10px] flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-trackoff)] py-[10px] font-geist text-[0.6875rem] font-semibold text-m-muted"
          >
            <Plus size={12} strokeWidth={2.2} />
            {t('packing.addCategory')}
          </button>
        )
      )}

      <MBagsSheet
        planner={planner}
        open={showBagsSheet}
        onClose={() => setShowBagsSheet(false)}
        bags={bags}
        items={items}
        tripMembers={tripMembers}
        canEdit={canEdit}
        onCreateBag={createBag}
        onUpdateBag={updateBag}
        onDeleteBag={deleteBag}
        onSetBagMembers={setBagMembers}
      />

      <MPackItemSheet
        planner={planner}
        open={editingItemId != null}
        itemId={editingItemId}
        bagTrackingEnabled={bagTrackingEnabled}
        tripMembers={tripMembers}
        currentUserId={currentUserId}
        onClose={() => setEditingItemId(null)}
      />

      <MPackingImportSheet planner={planner} open={showImportSheet} onClose={() => setShowImportSheet(false)} />

      <MConfirmSheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t('packing.clearChecked', { count: checkedCount })}
        message={t('packing.confirm.clearChecked', { count: checkedCount })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { setConfirmClear(false); clearChecked() }}
      />

      <MConfirmSheet
        open={deleteCategoryTarget != null}
        onClose={() => setDeleteCategoryTarget(null)}
        title={t('packing.menuDeleteCat')}
        message={deleteCategoryTarget
          ? t('packing.confirm.deleteCat', { name: deleteCategoryTarget.name, count: deleteCategoryTarget.items.length })
          : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          const target = deleteCategoryTarget
          setDeleteCategoryTarget(null)
          if (target) deleteCategoryItems(target.items)
        }}
      />
    </TabScroller>
  )
}

function ActionRow({ icon: Icon, label, onClick, danger = false }: {
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[9px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[11px] text-left text-[0.78125rem] font-semibold last:border-b-0 ${
        danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'
      }`}
    >
      <Icon size={14} strokeWidth={2} />
      {label}
    </button>
  )
}

// ── Category card ───────────────────────────────────────────────────────

function PackingCategoryCard({
  group, categoryOrder, open, onToggle, editMode, canEdit, planner, currentUserId, assignees, tripMembers,
  onSetAssignees, onRename, onCheckAll, onUncheckAll, onDeleteCategory, onAddItem, onEditItem, onDeleteItem,
  bagTrackingEnabled, bags, onCreateBag,
}: {
  group: PackingCategoryGroup
  categoryOrder: string[]
  open: boolean
  onToggle: () => void
  editMode: boolean
  canEdit: boolean
  planner: TripPlanner
  currentUserId: number | null
  assignees: CategoryAssignee[]
  tripMembers: TripMember[]
  onSetAssignees: (userIds: number[]) => void
  onRename: (newName: string) => void
  onCheckAll: () => void
  onUncheckAll: () => void
  onDeleteCategory: () => void
  onAddItem: (name: string) => void
  onEditItem: (itemId: number) => void
  onDeleteItem: (item: PackingItem) => Promise<void>
  bagTrackingEnabled: boolean
  bags: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
}) {
  const { t } = planner
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState(group.category)
  const [menuOpen, setMenuOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')

  const dot = katColor(group.category, categoryOrder)
  const checkedCount = group.items.filter(i => i.checked).length

  const commitRename = () => {
    const trimmed = renameDraft.trim()
    if (trimmed && trimmed !== group.category) onRename(trimmed)
    else setRenameDraft(group.category)
    setRenaming(false)
  }

  const submitAddItem = () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    onAddItem(trimmed)
    setNewItemName('')
  }

  return (
    <div className="mt-[10px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop">
      {/* A <div role="button"> rather than a real <button> — the rename input and
          the assign/menu triggers below are interactive elements a <button> may
          not contain (invalid HTML); this stays keyboard-operable via onKeyDown. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        aria-expanded={open}
        className="flex w-full items-center gap-[8px] bg-[color:var(--m-ic)] px-[13px] py-[9px] text-left"
      >
        <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: dot }} />
        {renaming ? (
          <input
            type="text"
            autoFocus
            value={renameDraft}
            onClick={e => e.stopPropagation()}
            onChange={e => setRenameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenaming(false); setRenameDraft(group.category) }
            }}
            className="min-w-0 flex-1 border-b border-[color:var(--m-rowbr)] bg-transparent text-[0.875rem] font-bold text-m-ink outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-[0.875rem] font-bold text-m-ink">{group.category}</span>
        )}
        {editMode && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setAssignOpen(v => !v) }}
            aria-label={t('packing.assignMembers')}
            className="flex-none text-m-faint"
          >
            <UserPlus size={13} strokeWidth={2} />
          </button>
        )}
        <span className="flex-none whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-bold text-m-muted">
          {checkedCount}/{group.items.length}
        </span>
        {editMode && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            aria-label={t('packing.categoryOptions')}
            className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
          >
            <MoreHorizontal size={12} strokeWidth={2} />
          </button>
        )}
        {open ? <ChevronUp size={13} strokeWidth={2} className="flex-none text-m-faint" /> : <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />}
      </div>

      {assignOpen && editMode && (
        <div className="border-b border-[color:var(--m-rowbr)] bg-m-sheetop px-[13px] py-[10px]">
          <div className="mb-[6px] font-geist text-[0.625rem] font-bold uppercase tracking-[.06em] text-m-faint">{t('packing.assignMembers')}</div>
          {tripMembers.length === 0 ? (
            <div className="font-geist text-[0.6875rem] text-m-faint">{t('packing.noMembers')}</div>
          ) : (
            <div className="flex flex-wrap gap-[6px]">
              {tripMembers.map(m => {
                const assigned = assignees.some(a => a.user_id === m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSetAssignees(assigned ? assignees.filter(a => a.user_id !== m.id).map(a => a.user_id) : [...assignees.map(a => a.user_id), m.id])}
                    className={`flex items-center gap-[5px] rounded-full px-[10px] py-[5px] text-[0.71875rem] font-semibold ${
                      assigned ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
                    }`}
                  >
                    {m.username}
                    {assigned && <Check size={11} strokeWidth={2.4} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {menuOpen && editMode && (
        <div className="border-b border-[color:var(--m-rowbr)]">
          <ActionRow icon={Pencil} label={t('packing.menuRename')} onClick={() => { setMenuOpen(false); setRenaming(true) }} />
          <ActionRow icon={CheckCheck} label={t('packing.menuCheckAll')} onClick={() => { setMenuOpen(false); onCheckAll() }} />
          <ActionRow icon={RotateCcw} label={t('packing.menuUncheckAll')} onClick={() => { setMenuOpen(false); onUncheckAll() }} />
          <ActionRow icon={Trash2} label={t('packing.menuDeleteCat')} danger onClick={() => { setMenuOpen(false); onDeleteCategory() }} />
        </div>
      )}

      {open && (
        <div className="px-[13px] pb-[8px]">
          {group.items.map(item => (
            <PackingItemRow
              key={item.id}
              item={item}
              planner={planner}
              currentUserId={currentUserId}
              editMode={editMode}
              canEdit={canEdit}
              bagTrackingEnabled={bagTrackingEnabled}
              bags={bags}
              onCreateBag={onCreateBag}
              onEdit={() => onEditItem(item.id)}
              onDelete={() => onDeleteItem(item)}
            />
          ))}

          {editMode && canEdit && (
            addingItem ? (
              <div className="flex items-center gap-[6px] py-[8px]">
                <input
                  type="text"
                  autoFocus
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitAddItem()
                    if (e.key === 'Escape') { setAddingItem(false); setNewItemName('') }
                  }}
                  placeholder={t('packing.addItemPlaceholder')}
                  className={`${FIELD_CLS} flex-1 py-[7px]`}
                />
                <button
                  type="button"
                  onClick={submitAddItem}
                  disabled={!newItemName.trim()}
                  aria-label={t('common.add')}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-m-act text-m-actfg disabled:opacity-40"
                >
                  <Plus size={14} strokeWidth={2.4} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingItem(true)}
                className="flex items-center gap-[6px] py-[8px] font-geist text-[0.6875rem] font-semibold text-m-muted"
              >
                <Plus size={12} strokeWidth={2.2} />
                {t('packing.addItem')}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Item row ────────────────────────────────────────────────────────────

function PackingItemRow({ item, planner, currentUserId, editMode, canEdit, bagTrackingEnabled, bags, onCreateBag, onEdit, onDelete }: {
  item: PackingItem
  planner: TripPlanner
  currentUserId: number | null
  editMode: boolean
  canEdit: boolean
  bagTrackingEnabled: boolean
  bags: PackingBag[]
  onCreateBag: (name: string) => Promise<PackingBag | undefined>
  onEdit: () => void
  onDelete: () => void
}) {
  const { t, tripId, tripActions } = planner
  const [bagPickerOpen, setBagPickerOpen] = useState(false)
  const [creatingBag, setCreatingBag] = useState(false)
  const [newBagName, setNewBagName] = useState('')

  const isPlaceholder = isPackingPlaceholder(item)
  const bag = item.bag_id != null ? bags.find(b => b.id === item.bag_id) : undefined

  // Sharing badges (#858) mirror ArtikelZeile: is_private + ownership split the
  // three states, so exactly one (or none) ever applies.
  const recipients = item.recipients || []
  const contributors = item.contributors || []
  const badgeSharedToMe = !!item.is_private && item.owner_id != null && item.owner_id !== currentUserId
  const badgeSharedByMe = !!item.is_private && item.owner_id === currentUserId && recipients.length > 0
  const badgeBroughtBy = !item.is_private && item.owner_username ? item.owner_username : null

  const toggle = () => tripActions.togglePackingItem(tripId, item.id, !item.checked)

  const assignBag = async (bagId: number | null) => {
    setBagPickerOpen(false)
    try { await tripActions.updatePackingItem(tripId, item.id, { bag_id: bagId }) } catch { planner.toast.error(t('packing.toast.saveError')) }
  }

  const submitNewBag = async () => {
    if (!newBagName.trim()) return
    const created = await onCreateBag(newBagName.trim())
    if (created) await assignBag(created.id)
    setNewBagName('')
    setCreatingBag(false)
  }

  return (
    <>
      <div className="flex items-center gap-[9px] border-t border-[color:var(--m-rowbr)] py-2 first:border-t-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={item.name}
          aria-pressed={!!item.checked}
          className={`flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[6px] border-[1.5px] ${
            item.checked ? 'border-m-act bg-m-act text-m-actfg' : 'border-[color:var(--m-rowbr)] text-transparent'
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </button>

        <span className={`min-w-0 flex-1 truncate text-[0.8125rem] font-medium ${item.checked ? 'text-m-faint line-through opacity-45' : 'text-m-ink'}`}>
          {isPlaceholder ? t('packing.addItemPlaceholder') : item.name}
        </span>

        {badgeSharedToMe && (
          <span className="flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-bold text-m-muted">
            <HandHelping size={9} strokeWidth={2.2} />
            {t('packing.takenCareOf', { name: item.owner_username || '' })}
          </span>
        )}
        {!badgeSharedToMe && badgeSharedByMe && (
          <span className="flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-bold text-m-muted">
            <UserRound size={9} strokeWidth={2.2} />
            {t('packing.sharedWithCount', { count: recipients.length })}
          </span>
        )}
        {!badgeSharedToMe && !badgeSharedByMe && badgeBroughtBy && (
          <span className="flex flex-none items-center gap-1 whitespace-nowrap font-geist text-[0.59375rem] font-bold text-m-faint">
            <Users size={9} strokeWidth={2.2} />
            {item.owner_username}{contributors.length > 0 ? ` +${contributors.length}` : ''}
          </span>
        )}

        {(item.quantity || 1) > 1 && (
          <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.625rem] font-bold tabular-nums text-m-muted">
            {item.quantity}×
          </span>
        )}

        {editMode && bagTrackingEnabled && (
          <span className="flex-none font-geist text-[0.625rem] font-semibold tabular-nums text-m-faint">
            {item.weight_grams != null ? formatWeight(item.weight_grams) : '— g'}
          </span>
        )}

        {bagTrackingEnabled && (
          <button
            type="button"
            onClick={() => setBagPickerOpen(v => !v)}
            aria-label={t('packing.bags')}
            className="h-[18px] w-[18px] flex-none rounded-full"
            style={bag
              ? { border: `2.5px solid ${bag.color}`, background: 'transparent' }
              : { border: '2px dashed var(--m-faint)', opacity: 0.55 }}
          />
        )}

        {editMode && canEdit && (
          <>
            <button type="button" onClick={onEdit} aria-label={t('common.edit')} className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted">
              <Pencil size={11} strokeWidth={2} />
            </button>
            <button type="button" onClick={onDelete} aria-label={t('common.delete')} className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted">
              <Trash2 size={11} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {bagPickerOpen && bagTrackingEnabled && (
        <div className="mb-[6px] ml-[28px] overflow-hidden rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)] backdrop-blur-[24px]">
          <button type="button" onClick={() => assignBag(null)} className="flex w-full items-center gap-[9px] border-b border-[color:var(--m-rowbr)] px-3 py-2 text-left text-[0.75rem] font-medium text-m-muted">
            <span className="h-[9px] w-[9px] flex-none rounded-full border border-dashed border-[color:var(--m-faint)]" />
            {t('packing.noBag')}
          </button>
          {bags.map(b => (
            <button key={b.id} type="button" onClick={() => assignBag(b.id)} className="flex w-full items-center gap-[9px] border-b border-[color:var(--m-rowbr)] px-3 py-2 text-left text-[0.75rem] font-medium text-m-ink">
              <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: b.color }} />
              {b.name}
            </button>
          ))}
          {creatingBag ? (
            <div className="flex items-center gap-[6px] p-[8px]">
              <input
                type="text"
                autoFocus
                value={newBagName}
                onChange={e => setNewBagName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitNewBag(); if (e.key === 'Escape') { setCreatingBag(false); setNewBagName('') } }}
                placeholder={t('packing.bagName')}
                className={`${FIELD_CLS} flex-1 py-[6px] text-[0.75rem]`}
              />
              <button type="button" onClick={submitNewBag} disabled={!newBagName.trim()} aria-label={t('common.add')} className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] bg-m-act text-m-actfg disabled:opacity-40">
                <Plus size={12} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setCreatingBag(true)} className="flex w-full items-center gap-[7px] px-3 py-2 text-left font-geist text-[0.6875rem] font-semibold text-m-muted">
              <Plus size={11} strokeWidth={2.2} />
              {t('packing.addBag')}
            </button>
          )}
        </div>
      )}
    </>
  )
}
