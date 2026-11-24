import { useMemo, useState, type ReactNode } from 'react'
import { selectionHaptic } from '../../../../native/haptics'
import type { LucideIcon } from 'lucide-react'
import {
  Briefcase, Check, CheckCheck, ChevronDown, ChevronUp, EyeOff, HandHelping,
  Download, FileSpreadsheet, FileText, LayoutTemplate, ListPlus, MoreHorizontal, Package, Pencil, Plus, Printer, RotateCcw,
  Save as SaveIcon, Share2, Trash2, UserRound, X,
} from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import MSwipeRow, { type SwipeAction } from '../../../components/MSwipeRow'
import MSheet from '../../../components/MSheet'
import { useAuthStore } from '../../../../store/authStore'
import { useAddonStore } from '../../../../store/addonStore'
import type { PackingItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { FIELD_CLS, FormSheetBody, FormSheetHeader } from '../sheets/PlSheetChrome'
import { TabScroller } from './tabChrome'
import { katColor, packedOf } from '../../../../components/Packing/packingListPanel.helpers'
import {
  groupPackingItems, isPackingPlaceholder,
  packingCategoryOrder, packingProgress, packingViewItems,
  type PackingCategoryGroup, type PackingView,
} from '../../../../components/Packing/packingListModel'
import { usePackingBags } from '../../../../components/Packing/usePackingBags'
import { usePackingTemplates } from '../../../../components/Packing/usePackingTemplates'
import { usePackingCategoryAssignees, type CategoryAssignee } from '../../../../components/Packing/usePackingCategoryAssignees'
import { usePackingItemActions } from '../../../../components/Packing/usePackingItemActions'
import { usePackingCategorySharing } from '../../../../components/Packing/usePackingCategorySharing'
import MBagsSheet from './MBagsSheet'
import MPackItemSheet from './MPackItemSheet'
import MPackingImportSheet from './MPackingImportSheet'
import MPackingCategorySharingSheet from './MPackingCategorySharingSheet'
import PackingPrintPreview from '../../../../components/Packing/PackingPrintPreview'
import { usePackingExport } from '../../../../components/Packing/usePackingExport'
import { packingBringerNames } from '../../../../components/Packing/packingBringers'

type ActionView = 'menu' | 'apply' | 'save'

/**
 * Packing sub-tab, shaped like the desktop list: a progress card with one "..."
 * that opens every rarely used action in a sheet, the Shared | My list switch,
 * and the category cards. A row shows its box, its name and only what is set;
 * a tap on the name opens the item sheet with everything else, and a list's own
 * actions open from its "..." as a sheet too, so nothing unfolds inside the page.
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
  const packingExport = usePackingExport(tripId, view)
  const [hideDone, setHideDone] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionView, setActionView] = useState<ActionView>('menu')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [showBagsSheet, setShowBagsSheet] = useState(false)
  const [showImportSheet, setShowImportSheet] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [menuCategory, setMenuCategory] = useState<string | null>(null)
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{ name: string; items: PackingItem[] } | null>(null)

  const closeActions = () => {
    setActionsOpen(false)
    setActionView('menu')
  }
  const { bags, unassignedWeightGrams, serverWeightsFresh, createBag, updateBag, deleteBag, setBagMembers } =
    usePackingBags({ tripId, bagTrackingEnabled, t, toast })
  const { templates, applyTemplate, saveTemplateName, setSaveTemplateName, saveAsTemplate } =
    usePackingTemplates({ tripId, view, t, toast, onApplied: closeActions, onSaved: closeActions })
  const { categoryAssignees, setAssignees: setCategoryAssigneesFor } = usePackingCategoryAssignees({ tripId, t, toast })

  const defaultCategory = t('packing.defaultCategory')
  const viewItems = useMemo(() => packingViewItems(items, view), [items, view])
  const categoryOrder = useMemo(() => packingCategoryOrder(viewItems, defaultCategory), [viewItems, defaultCategory])
  const groups = useMemo(() => groupPackingItems(viewItems, hideDone ? 'open' : 'all', defaultCategory), [viewItems, hideDone, defaultCategory])
  const progress = packingProgress(viewItems)
  const checkedCount = viewItems.filter(i => i.checked).length

  const {
    addingCategory, setAddingCategory, newCategoryName, setNewCategoryName, addItemToCategory, deleteItem,
    renameCategoryReporting: renameCategory, deleteCategoryItems, clearChecked, addNewCategory,
  } = usePackingItemActions({
    tripId, items, view, currentUserId, categories: categoryOrder, defaultCategory,
    actions: tripActions, t, toast, placeholderFrom: 'items',
  })

  // A whole list to one sharing tier (#2961), the same hook as the desktop dialog.
  const categorySharing = usePackingCategorySharing({
    tripId, items, view, defaultCategory, currentUserId,
    setPackingItemSharing: tripActions.setPackingItemSharing, t, toast,
  })

  const toggleCategory = (cat: string) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))
  const setAllInCategory = async (catItems: PackingItem[], checked: boolean) => {
    try {
      for (const item of catItems) if (!!item.checked !== checked) await tripActions.togglePackingItem(tripId, item.id, checked)
    } catch {
      toast.error(t('packing.toast.saveError'))
    }
  }

  const trueEmpty = items.length === 0
  const viewEmpty = viewItems.length === 0
  const menuGroup = menuCategory != null ? groups.find(g => g.category === menuCategory) : undefined
  const run = (action: () => void) => () => { closeActions(); action() }

  return (
    <TabScroller wide="full">
      {/* ── Progress card: the count, a slim bar and one button for the rest ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-m-rowbr bg-m-sheetop px-[14px] py-[12px]">
        <div className="min-w-0 flex-1">
          <div className="text-caption font-semibold tabular-nums text-m-ink">
            {progress.total > 0 && progress.pct === 100
              ? t('packing.allPacked')
              : t('packing.packedCount', { packed: progress.checked, total: progress.total })}
          </div>
          <div className="mt-[7px] h-[5px] overflow-hidden rounded-full bg-m-ic">
            <div className="h-full rounded-full bg-m-act" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActionsOpen(true)}
          aria-label={t('packing.actions')}
          aria-haspopup="dialog"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-m-ic text-m-ink"
        >
          <MoreHorizontal size={17} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Add list: in place under the card once asked for from the menu, or on an empty list ── */}
      {canEdit && (addingCategory || trueEmpty) && (
        addingCategory ? (
          <div className="mt-[10px] flex items-center gap-1.5 rounded-[16px] border border-m-rowbr bg-m-card py-[5px] pe-[5px] ps-[14px]">
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') void addNewCategory()
                if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName('') }
              }}
              placeholder={t('packing.newCategoryPlaceholder')}
              aria-label={t('packing.newCategoryPlaceholder')}
              className="min-w-0 flex-1 bg-transparent py-2 text-body text-m-ink outline-none placeholder:text-m-faint"
            />
            <button
              type="button"
              onClick={() => { setAddingCategory(false); setNewCategoryName('') }}
              aria-label={t('common.cancel')}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-m-muted"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={addNewCategory}
              disabled={!newCategoryName.trim()}
              aria-label={t('common.add')}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg disabled:opacity-30"
            >
              <Plus size={17} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCategory(true)}
            className="mt-[10px] flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-m-trackoff py-[10px] text-caption font-semibold text-m-muted"
          >
            <Plus size={12} strokeWidth={2.2} />
            {t('packing.addCategory')}
          </button>
        )
      )}

      {/* ── Whose list: the one switch above the lists ── */}
      {!trueEmpty && (
        <div className="mt-[10px] flex gap-[2px] rounded-full bg-m-ic p-[3px] wide:max-w-[360px]">
          {(['common', 'personal'] as const).map(id => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`flex-1 whitespace-nowrap rounded-full py-[6px] text-center text-caption font-semibold ${view === id ? 'bg-m-act text-m-actfg' : 'text-m-ink'}`}
            >
              {id === 'common' ? t('packing.viewCommon') : t('packing.viewPersonal')}
            </button>
          ))}
        </div>
      )}

      {/* ── Categories + items ── */}
      {trueEmpty ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="packing" className="mb-2" />
          <p className="text-body font-medium text-m-muted">{t('packing.emptyTitle')}</p>
        </div>
      ) : viewEmpty ? (
        <div className="px-[30px] py-[26px] text-center text-caption leading-relaxed text-m-faint">
          {t('packing.personalEmptyHint')}
        </div>
      ) : groups.length === 0 ? (
        <div className="px-[30px] py-[26px] text-center text-caption leading-relaxed text-m-faint">
          {t('packing.emptyFiltered')}
        </div>
      ) : (
        // Categories stand in columns on a wide window, as many as the page
        // holds, each card whole in its column like a masonry board.
        <div className="wide:mt-[10px] wide:columns-[300px] wide:gap-3">
          {groups.map(group => (
            <PackingCategoryCard
              key={group.category}
              group={group}
              categoryOrder={categoryOrder}
              open={!collapsed[group.category]}
              onToggle={() => toggleCategory(group.category)}
              canEdit={canEdit}
              planner={planner}
              currentUserId={currentUserId}
              assignees={categoryAssignees[group.category] || []}
              onOpenMenu={() => setMenuCategory(group.category)}
              onRename={newName => renameCategory(group.category, newName)}
              renameSignal={renamingCategory === group.category}
              onRenamed={() => setRenamingCategory(null)}
              onAddItem={name => addItemToCategory(group.category, name)}
              onEditItem={id => setEditingItemId(id)}
              onDeleteItem={deleteItem}
            />
          ))}
        </div>
      )}

      {/* ── The list's own actions, as a sheet ── */}
      <MSheet open={menuGroup != null} onClose={() => setMenuCategory(null)} ariaLabel={t('packing.categoryOptions')}>
        {menuGroup && (
          <CategoryMenu
            planner={planner}
            group={menuGroup}
            canEdit={canEdit}
            assignees={categoryAssignees[menuGroup.category] || []}
            tripMembers={tripMembers}
            onClose={() => setMenuCategory(null)}
            onRename={() => { setMenuCategory(null); setRenamingCategory(menuGroup.category) }}
            onSetAssignees={userIds => setCategoryAssigneesFor(menuGroup.category, userIds)}
            onCheckAll={() => { setMenuCategory(null); void setAllInCategory(menuGroup.items, true) }}
            onUncheckAll={() => { setMenuCategory(null); void setAllInCategory(menuGroup.items, false) }}
            onShare={() => { setMenuCategory(null); categorySharing.openFor(menuGroup.category) }}
            onDelete={() => {
              setMenuCategory(null)
              setDeleteCategoryTarget({ name: menuGroup.category, items: items.filter(i => (i.category || defaultCategory) === menuGroup.category) })
            }}
          />
        )}
      </MSheet>

      {/* ── Everything else the list does, as one sheet ── */}
      <MSheet open={actionsOpen} onClose={closeActions} ariaLabel={t('packing.actions')}>
        <FormSheetHeader title={t('packing.title')} onClose={closeActions} closeLabel={t('common.close')} />
        <FormSheetBody>
          {actionView === 'menu' && (
            <>
              <ActionGroup>
                {canEdit && <ActionRow icon={ListPlus} label={t('packing.addCategory')} onClick={run(() => setAddingCategory(true))} />}
                {canEdit && templates.length > 0 && <ActionRow icon={LayoutTemplate} label={t('packing.applyTemplate')} onClick={() => setActionView('apply')} />}
                {canEdit && isAdmin && items.length > 0 && <ActionRow icon={SaveIcon} label={t('packing.saveAsTemplate')} onClick={() => setActionView('save')} />}
                {canEdit && <ActionRow icon={Download} label={t('packing.import')} onClick={run(() => setShowImportSheet(true))} />}
              </ActionGroup>
              {packingExport.hasItems && (
                <ActionGroup>
                  <ActionRow icon={Printer} label={t('packing.exportPrint')} onClick={run(() => void packingExport.openPrint())} />
                  <ActionRow icon={FileText} label={t('packing.exportMarkdown')} onClick={run(() => packingExport.exportMarkdown())} />
                  <ActionRow icon={FileSpreadsheet} label={t('packing.exportCsv')} onClick={run(() => void packingExport.exportCsv())} />
                </ActionGroup>
              )}
              <ActionGroup>
                {!trueEmpty && (
                  <ActionRow icon={EyeOff} label={t('packing.hideDone')} trailing={hideDone ? <Check size={15} strokeWidth={2.4} /> : undefined}
                    onClick={() => setHideDone(v => !v)} />
                )}
                {bagTrackingEnabled && <ActionRow icon={Briefcase} label={t('packing.bags')} onClick={run(() => setShowBagsSheet(true))} />}
                {canEdit && checkedCount > 0 && (
                  <ActionRow icon={Trash2} label={t('packing.clearChecked', { count: checkedCount })} danger onClick={run(() => setConfirmClear(true))} />
                )}
              </ActionGroup>
            </>
          )}
          {actionView === 'apply' && (
            <ActionGroup>
              {templates.map(tmpl => (
                <ActionRow key={tmpl.id} icon={Package} label={tmpl.name}
                  trailing={<span className="text-caption text-m-faint">{tmpl.item_count}</span>}
                  onClick={() => applyTemplate(tmpl.id)} />
              ))}
            </ActionGroup>
          )}
          {actionView === 'save' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={saveTemplateName}
                onChange={e => setSaveTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void saveAsTemplate() }}
                placeholder={t('packing.templateName')}
                className={`${FIELD_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={!saveTemplateName.trim()}
                aria-label={t('common.save')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </FormSheetBody>
      </MSheet>

      <MBagsSheet
        planner={planner}
        open={showBagsSheet}
        onClose={() => setShowBagsSheet(false)}
        bags={bags}
        items={items}
        unassignedWeightGrams={unassignedWeightGrams}
        serverWeightsFresh={serverWeightsFresh}
        tripMembers={tripMembers}
        canEdit={canEdit}
        currentUserId={currentUserId}
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
        categories={categoryOrder}
        bags={bags}
        onCreateBag={createBag}
        onDelete={item => void deleteItem(item)}
        onClose={() => setEditingItemId(null)}
      />

      <MPackingImportSheet planner={planner} open={showImportSheet} onClose={() => setShowImportSheet(false)} />
      <MPackingCategorySharingSheet sharing={categorySharing} tripMembers={tripMembers} currentUserId={currentUserId} t={t} />
      <PackingPrintPreview html={packingExport.printHtml} title={packingExport.printTitle} onClose={packingExport.closePrint} />

      <MConfirmSheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t('packing.clearChecked', { count: checkedCount })}
        message={t('packing.confirm.clearChecked', { count: checkedCount })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { setConfirmClear(false); void clearChecked() }}
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
          if (target) void deleteCategoryItems(target.items)
        }}
      />
    </TabScroller>
  )
}

function ActionGroup({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mb-3 flex flex-col overflow-hidden rounded-[16px] bg-m-ic empty:hidden">{children}</div>
}

function ActionRow({ icon: Icon, label, onClick, danger = false, trailing }: Readonly<{
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
  trailing?: ReactNode
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[11px] border-b border-m-rowbr px-[14px] py-[12px] text-start text-body font-medium last:border-b-0 ${
        danger ? 'text-[color:var(--m-st-danger)]' : 'text-m-ink'
      }`}
    >
      <Icon size={16} strokeWidth={2} className="flex-none" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  )
}

// ── A list's own menu ───────────────────────────────────────────────────

function CategoryMenu({
  planner, group, canEdit, assignees, tripMembers, onClose, onRename, onSetAssignees, onCheckAll, onUncheckAll, onShare, onDelete,
}: Readonly<{
  planner: TripPlanner
  group: PackingCategoryGroup
  canEdit: boolean
  assignees: CategoryAssignee[]
  tripMembers: TripMember[]
  onClose: () => void
  onRename: () => void
  onSetAssignees: (userIds: number[]) => void
  onCheckAll: () => void
  onUncheckAll: () => void
  onShare: () => void
  onDelete: () => void
}>) {
  const { t } = planner
  const toggleAssignee = (userId: number) => {
    const assigned = assignees.some(a => a.user_id === userId)
    onSetAssignees(assigned ? assignees.filter(a => a.user_id !== userId).map(a => a.user_id) : [...assignees.map(a => a.user_id), userId])
  }
  return (
    <>
      <FormSheetHeader title={group.category} onClose={onClose} closeLabel={t('common.close')} />
      <FormSheetBody>
        <ActionGroup>
          {canEdit && <ActionRow icon={Pencil} label={t('packing.menuRename')} onClick={onRename} />}
          <ActionRow icon={CheckCheck} label={t('packing.menuCheckAll')} onClick={onCheckAll} />
          <ActionRow icon={RotateCcw} label={t('packing.menuUncheckAll')} onClick={onUncheckAll} />
          {canEdit && <ActionRow icon={Share2} label={t('packing.menuShareCat')} onClick={onShare} />}
        </ActionGroup>
        {canEdit && (
          <>
            <div className="mb-[6px] ps-1 text-caption font-semibold text-m-muted">{t('packing.assignMembers')}</div>
            <ActionGroup>
              {tripMembers.length === 0
                ? <div className="px-[14px] py-[12px] text-caption text-m-faint">{t('packing.noMembers')}</div>
                : tripMembers.map(m => (
                  <ActionRow key={m.id} icon={UserRound} label={m.username}
                    trailing={assignees.some(a => a.user_id === m.id) ? <Check size={15} strokeWidth={2.4} /> : undefined}
                    onClick={() => toggleAssignee(m.id)} />
                ))}
            </ActionGroup>
            <ActionGroup>
              <ActionRow icon={Trash2} label={t('packing.menuDeleteCat')} danger onClick={onDelete} />
            </ActionGroup>
          </>
        )}
      </FormSheetBody>
    </>
  )
}

// ── Category card ───────────────────────────────────────────────────────

function PackingCategoryCard({
  group, categoryOrder, open, onToggle, canEdit, planner, currentUserId, assignees,
  onOpenMenu, onRename, renameSignal, onRenamed, onAddItem, onEditItem, onDeleteItem,
}: Readonly<{
  group: PackingCategoryGroup
  categoryOrder: string[]
  open: boolean
  onToggle: () => void
  canEdit: boolean
  planner: TripPlanner
  currentUserId: number | null
  assignees: CategoryAssignee[]
  onOpenMenu: () => void
  onRename: (newName: string) => void
  /** Rename was picked in the list's menu: the name turns into a field in place. */
  renameSignal: boolean
  onRenamed: () => void
  onAddItem: (name: string) => void
  onEditItem: (itemId: number) => void
  onDeleteItem: (item: PackingItem) => Promise<void>
}>) {
  const { t } = planner
  const [renameDraft, setRenameDraft] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const renaming = renameDraft !== null || renameSignal

  const dot = katColor(group.category, categoryOrder)
  const checkedCount = group.items.filter(i => i.checked).length

  const commitRename = () => {
    const trimmed = (renameDraft ?? group.category).trim()
    if (trimmed && trimmed !== group.category) onRename(trimmed)
    setRenameDraft(null)
    onRenamed()
  }
  const submitAddItem = () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    onAddItem(trimmed)
    setNewItemName('')
  }

  return (
    <div className="mt-[10px] overflow-hidden rounded-2xl border border-m-rowbr bg-m-sheetop wide:mb-[10px] wide:mt-0 wide:inline-block wide:w-full wide:break-inside-avoid wide:align-top">
      <div className="flex w-full items-center gap-[8px] bg-m-ic py-[7px] pe-[8px] ps-[13px]">
        <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: dot }} />
        {renaming ? (
          <input
            type="text"
            autoFocus
            value={renameDraft ?? group.category}
            onChange={e => setRenameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenameDraft(null); onRenamed() }
            }}
            aria-label={t('packing.menuRename')}
            className="min-w-0 flex-1 border-b border-m-rowbr bg-transparent text-body font-bold text-m-ink outline-none"
          />
        ) : (
          <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-[8px] text-start">
            <span dir="auto" className="min-w-0 truncate text-body font-bold text-m-ink">{group.category}</span>
            {assignees.length > 0 && (
              <span className="flex flex-none" aria-label={assignees.map(a => a.username).join(', ')}>
                {assignees.slice(0, 3).map(a => (
                  <span key={a.user_id} aria-hidden className="-ms-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-m-sheetop bg-m-act text-[0.5625rem] font-bold uppercase text-m-actfg first:ms-0">
                    {a.username[0]}
                  </span>
                ))}
              </span>
            )}
            <span className="ms-auto flex-none whitespace-nowrap rounded-full bg-m-sheetop px-2 py-[2px] text-caption font-bold tabular-nums text-m-muted">
              {checkedCount}/{group.items.length}
            </span>
            {open ? <ChevronUp size={14} strokeWidth={2} className="flex-none text-m-faint" /> : <ChevronDown size={14} strokeWidth={2} className="flex-none text-m-faint" />}
          </button>
        )}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('packing.categoryOptions')}
          aria-haspopup="dialog"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-m-muted"
        >
          <MoreHorizontal size={16} strokeWidth={2} />
        </button>
      </div>

      {open && (
        <div className="px-[13px] pb-[8px]">
          {group.items.map(item => (
            <PackingItemRow
              key={item.id}
              item={item}
              planner={planner}
              currentUserId={currentUserId}
              canEdit={canEdit}
              onEdit={() => onEditItem(item.id)}
              onDelete={() => onDeleteItem(item)}
            />
          ))}

          {/* Like the desktop: the add row turns into the field in place, no frame. */}
          {canEdit && (addingItem ? (
            <div className="mt-[6px] flex items-center gap-[10px] rounded-[12px] bg-m-ic py-[5px] pe-[6px] ps-[11px]">
              <span aria-hidden className="h-[22px] w-[22px] flex-none rounded-[7px] border-[1.5px] border-[color:var(--m-checkbr)]" />
              <input
                type="text"
                autoFocus
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onBlur={() => { if (!newItemName.trim()) { setAddingItem(false); setNewItemName('') } }}
                onKeyDown={e => {
                  if (e.key === 'Enter') submitAddItem()
                  if (e.key === 'Escape') { setAddingItem(false); setNewItemName('') }
                }}
                placeholder={t('packing.addItemPlaceholder')}
                aria-label={t('packing.addItemPlaceholder')}
                className="min-w-0 flex-1 bg-transparent py-[5px] text-body text-m-ink outline-none placeholder:text-m-faint"
              />
              <button
                type="button"
                onClick={submitAddItem}
                disabled={!newItemName.trim()}
                aria-label={t('common.add')}
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${newItemName.trim() ? 'bg-m-act text-m-actfg' : 'text-m-faint'}`}
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingItem(true)}
              className="mt-[6px] flex w-full items-center gap-[10px] rounded-[12px] bg-m-ic px-[11px] py-[9px] text-start text-body font-medium text-m-faint"
            >
              <span aria-hidden className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-current">
                <Plus size={12} strokeWidth={2.4} />
              </span>
              {t('packing.addItem')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Item row ────────────────────────────────────────────────────────────

function PackingItemRow({ item, planner, currentUserId, canEdit, onEdit, onDelete }: Readonly<{
  item: PackingItem
  planner: TripPlanner
  currentUserId: number | null
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}>) {
  const { t, tripId, tripActions } = planner
  const isPlaceholder = isPackingPlaceholder(item)

  // Sharing badges (#858) mirror the desktop row: is_private + ownership split
  // the three states, so exactly one (or none) ever applies.
  const recipients = item.recipients || []
  const contributors = item.contributors || []
  const badgeSharedToMe = !!item.is_private && item.owner_id != null && item.owner_id !== currentUserId
  const badgeSharedByMe = !!item.is_private && item.owner_id === currentUserId && recipients.length > 0
  const bringerName = !item.is_private ? (item.owner_username || contributors[0]?.username || null) : null
  const bringerId = item.owner_username ? item.owner_id : contributors[0]?.user_id
  const me = useAuthStore(s => s.user)
  const bringerMember = planner.tripMembers.find(m => m.id === bringerId)
  const bringerAvatarUrl = bringerMember?.avatar_url ?? (bringerId === me?.id ? me?.avatar_url ?? null : null)
  const moreBringers = item.owner_username ? contributors.length : Math.max(0, contributors.length - 1)

  const toggle = () => {
    selectionHaptic()
    return tripActions.togglePackingItem(tripId, item.id, !item.checked)
  }
  // Multi-piece items count their pieces into the bag (#2296).
  const quantity = item.quantity || 1
  const packed = packedOf(item)
  const partlyPacked = !item.checked && packed > 0

  // A swipe does what the item sheet does: tick it off, or edit and delete it.
  const swipeTrailing: SwipeAction[] = canEdit && !isPlaceholder
    ? [
        { label: t('common.delete'), icon: Trash2, tone: 'danger', onAction: onDelete },
        { label: t('common.edit'), icon: Pencil, tone: 'neutral', onAction: onEdit },
      ]
    : []
  const swipeLeading: SwipeAction | undefined = isPlaceholder
    ? undefined
    : item.checked
      ? { label: t('packing.filterOpen'), icon: RotateCcw, tone: 'neutral', onAction: () => void toggle() }
      : { label: t('packing.filterDone'), icon: Check, tone: 'accent', onAction: () => void toggle() }

  return (
    <MSwipeRow
      leading={swipeLeading}
      trailing={swipeTrailing}
      surface="bg-m-sheetop"
      inset={4}
      className="border-t border-m-rowbr first:border-t-0"
    >
      <div className="flex items-center gap-[10px] py-[9px]">
        <button
          type="button"
          onClick={toggle}
          aria-label={item.name}
          aria-pressed={!!item.checked}
          className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] ${
            item.checked ? 'border-m-act bg-m-act text-m-actfg' : partlyPacked ? 'border-m-act text-transparent' : 'border-[color:var(--m-checkbr)] text-transparent'
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </button>

        {/* The rest of the row opens the item sheet: everything about it lives there. */}
        <button type="button" onClick={onEdit} aria-haspopup="dialog" aria-label={`${isPlaceholder ? t('packing.addItemPlaceholder') : item.name}, ${t('packing.editItem')}`} className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[10px] text-start outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-m-act">
          <span className={`min-w-0 flex-1 truncate text-body font-medium ${item.checked ? 'text-m-faint line-through opacity-45' : 'text-m-ink'}`}>
            {isPlaceholder ? t('packing.addItemPlaceholder') : item.name}
          </span>

          {partlyPacked && <span className="flex-none text-caption font-semibold tabular-nums text-m-muted">{packed}/{quantity}</span>}
          {!partlyPacked && quantity > 1 && <span className="flex-none text-caption font-medium tabular-nums text-m-faint">×{quantity}</span>}

          {badgeSharedToMe && (
            <span
              className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-m-ic text-m-muted"
              aria-label={t('packing.takenCareOf', { name: item.owner_username || '' })}
            >
              <HandHelping size={11} strokeWidth={2.2} />
            </span>
          )}
          {!badgeSharedToMe && badgeSharedByMe && (
            <span
              className="flex flex-none items-center gap-[2px] rounded-full bg-m-ic px-[6px] py-[3px] text-caption font-bold text-m-muted"
              aria-label={t('packing.sharedWithCount', { count: recipients.length })}
            >
              <UserRound size={10} strokeWidth={2.2} />
              {recipients.length}
            </span>
          )}
          {!badgeSharedToMe && !badgeSharedByMe && bringerName && (
            <span className="flex flex-none items-center gap-[3px]" aria-label={t('packing.broughtBy', { name: packingBringerNames(item) })}>
              {bringerAvatarUrl
                ? <img src={bringerAvatarUrl} alt="" className="h-5 w-5 flex-none rounded-full object-cover" />
                : <span aria-hidden className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-m-ic text-[0.5625rem] font-bold text-m-muted">{bringerName[0]?.toUpperCase()}</span>}
              {moreBringers > 0 && <span aria-hidden className="text-caption font-bold text-m-faint">+{moreBringers}</span>}
            </span>
          )}
        </button>
      </div>
    </MSwipeRow>
  )
}

