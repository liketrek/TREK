import { useState, type ReactNode } from 'react'
import { selectionHaptic } from '../../../../native/haptics'
import { Calendar, Check, Flag, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { FormSheetBody, FormSheetHeader } from '../sheets/PlSheetChrome'
import MDancingTrek from '../../../components/MDancingTrek'
import MChipStrip from '../../../components/MChipStrip'
import MSwipeRow, { type SwipeAction } from '../../../components/MSwipeRow'
import { useAuthStore } from '../../../../store/authStore'
import { useTranslation } from '../../../../i18n'
import { avatarSrc } from '../../../../utils/avatarSrc'
import { formatDate } from '../../../../utils/formatters'
import type { TodoItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { TabPanes } from './tabChrome'
import MTodoSidebar from './MTodoSidebar'
import { useIsSplit } from '../../../../hooks/sizeClass'
import { PRIORITY_COLOR, PRIORITY_LABEL } from './listsModel'
import { TODO_SMART_FILTERS, isTodoOverdue, type TodoSmartFilter } from '../../../../components/Todo/todoListModel'
import { useTodoView } from '../../../../components/Todo/useTodoList'
import MTaskSheet from './MTaskSheet'
import MarkdownText from '../../../../components/shared/MarkdownText'

/**
 * To-do sub-tab, in the look of the packing list beside it: a progress card
 * with a round "+" for a new task and a "..." for the order and the lists, the
 * All|My|Overdue|Done switch in one tinted track, and the tasks as rows of one
 * card. Add/Edit lives in `MTaskSheet`.
 */
export default function MTodoListTab({ planner }: { planner: TripPlanner }) {
  const { t, toast, tripId, todoItems: items, tripActions } = planner
  const canEdit = planner.can('packing_edit', planner.trip)
  const currentUserId = useAuthStore(s => s.user?.id) ?? null
  const tripMembers = planner.tripMembers

  // The rail addresses a category by name, so a category a user called "all"
  // or "done" gets its own bucket instead of the built-in one.
  const { active, setActive, sortBy, toggleSort, today, categories, rows, counts, catCount } =
    useTodoView(items, currentUserId, { rankByStatus: true, pinToday: true })
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  // With room for two panes the filters become a pane of their own (MTodoSidebar).
  const split = useIsSplit()

  const pct = items.length > 0 ? Math.round((counts.done / items.length) * 100) : 0
  const defaultCategoryForNew = active.kind === 'category' ? active.name : null

  const openCreate = () => { setEditingItemId(null); setCreatingTask(true) }
  const openEdit = (id: number) => { setCreatingTask(false); setEditingItemId(id) }
  const closeSheet = () => { setCreatingTask(false); setEditingItemId(null) }
  const toggleItem = (id: number, checked: boolean) => {
    selectionHaptic()
    return tripActions.toggleTodoItem(tripId, id, checked)
  }
  // The task sheet deletes the same way, without asking first.
  const deleteItem = (id: number) => {
    tripActions.deleteTodoItem(tripId, id).catch(() => toast.error(t('common.error')))
  }

  const filterPill = (active: boolean) =>
    `flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-[11px] py-[6px] text-caption font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-m-ic text-m-ink'
    }`
  // The switch above the list: segments in one track, like Shared | My list.
  const segment = (on: boolean) =>
    `flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-[12px] py-[6px] text-caption font-semibold ${
      on ? 'bg-m-act text-m-actfg' : 'text-m-ink'
    }`

  const filterLabel = (f: TodoSmartFilter) =>
    f === 'all' ? t('todo.filter.all') : f === 'my' ? t('todo.filter.my') : f === 'overdue' ? t('todo.filter.overdue') : t('todo.filter.done')
  const filterCount = (f: TodoSmartFilter) =>
    f === 'all' ? counts.open : f === 'my' ? counts.my : f === 'overdue' ? counts.overdue : counts.done

  const sortPills = (
    <>
      <button
        type="button"
        onClick={() => toggleSort('priority')}
        aria-pressed={sortBy === 'priority'}
        className={filterPill(sortBy === 'priority')}
      >
        <Flag size={11} strokeWidth={2.2} />
        {t('todo.priority')}
      </button>
      <button
        type="button"
        onClick={() => toggleSort('due')}
        aria-pressed={sortBy === 'due'}
        className={filterPill(sortBy === 'due')}
      >
        <Calendar size={11} strokeWidth={2.2} />
        {t('todo.detail.dueDate')}
      </button>
    </>
  )

  const progressCard = (
    // The packing list's card: how far along, a slim bar, the rest and the add.
    <div className="flex items-center gap-[10px] rounded-2xl border border-m-rowbr bg-m-sheetop px-[14px] py-[12px]">
      <div className="min-w-0 flex-1">
        <div className="text-caption font-semibold tabular-nums text-m-ink">
          {progressLabel(t, counts.done, items.length)}
        </div>
        <div className="mt-[7px] h-[5px] overflow-hidden rounded-full bg-m-ic">
          <div className="h-full rounded-full bg-m-act" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {items.length > 0 && !split && (
        <button
          type="button"
          onClick={() => setOptionsOpen(true)}
          aria-label={t('todo.sidebar.sortBy')}
          aria-haspopup="dialog"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-m-ic text-m-ink"
        >
          <MoreHorizontal size={17} strokeWidth={2.2} />
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={openCreate}
          aria-label={t('todo.newItem')}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )

  return (
    <>
    <TabPanes
      asideLabel={t('todo.sidebar.tasks')}
      aside={
        <>
          {progressCard}
          {split && items.length > 0 && (
            <MTodoSidebar
              active={active}
              onPick={setActive}
              counts={counts}
              categories={categories}
              catCount={catCount}
              smartLabel={filterLabel}
              listsLabel={t('todo.sidebar.categories')}
            />
          )}
        </>
      }
    >
      {/* The list's own head beside the filters pane: what it shows, and its order. */}
      {split && items.length > 0 && (
        <div className="flex items-center gap-[6px]">
          <h2 className="min-w-0 flex-1 truncate text-subtitle font-extrabold text-m-ink">
            {active.kind === 'smart' ? filterLabel(active.id) : active.name}
          </h2>
          <span className="flex-none font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.09em] text-m-faint">{t('todo.sidebar.sortBy')}</span>
          {sortPills}
        </div>
      )}

      {/* ── Which tasks: one track, like the packing list's switch ── */}
      {!split && items.length > 0 && (
        <MChipStrip className="mt-[10px] gap-[2px] whitespace-nowrap rounded-full bg-m-ic p-[3px]">
          {TODO_SMART_FILTERS.map(f => (
            <button
              key={f}
              type="button"
              aria-pressed={active.kind === 'smart' && active.id === f}
              onClick={() => setActive({ kind: 'smart', id: f })}
              className={segment(active.kind === 'smart' && active.id === f)}
            >
              {f === 'my' ? t('todo.filter.myShort') : filterLabel(f)}
              <span className="text-caption tabular-nums opacity-60">{filterCount(f)}</span>
            </button>
          ))}
          {active.kind === 'category' && (
            <button type="button" aria-pressed onClick={() => setOptionsOpen(true)} className={segment(true)}>{active.name}</button>
          )}
        </MChipStrip>
      )}

      {/* ── Task cards (spec §4.7) ── */}
      {items.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="tasks" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('todo.empty')}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-[30px] py-[26px] text-center font-geist text-[0.6875rem] leading-relaxed text-m-faint">
          {t('todo.emptyFiltered')}
        </div>
      ) : (
        <div className="mt-[10px] overflow-hidden rounded-2xl border border-m-rowbr bg-m-sheetop px-[13px] wide:mt-2">
          {rows.map(item => (
            <TaskCard
              key={item.id}
              item={item}
              members={tripMembers}
              today={today}
              onToggle={toggleItem}
              onOpen={openEdit}
              onDelete={canEdit ? deleteItem : undefined}
            />
          ))}
        </div>
      )}
    </TabPanes>

      {/* ── The order and the lists, as a sheet ── */}
      <MSheet open={optionsOpen} onClose={() => setOptionsOpen(false)} ariaLabel={t('todo.sidebar.sortBy')}>
        <FormSheetHeader title={t('todo.sidebar.sortBy')} onClose={() => setOptionsOpen(false)} closeLabel={t('common.close')} />
        <FormSheetBody>
          <div className="mb-3 flex flex-col overflow-hidden rounded-[16px] bg-m-ic">
            <OptionRow icon={<Flag size={16} strokeWidth={2} />} label={t('todo.priority')} on={sortBy === 'priority'} onClick={() => toggleSort('priority')} />
            <OptionRow icon={<Calendar size={16} strokeWidth={2} />} label={t('todo.detail.dueDate')} on={sortBy === 'due'} onClick={() => toggleSort('due')} />
          </div>
          {categories.length > 0 && (
            <>
              <div className="mb-[6px] ps-1 text-caption font-semibold text-m-muted">{t('todo.sidebar.categories')}</div>
              <div className="flex flex-col overflow-hidden rounded-[16px] bg-m-ic">
                {categories.map(cat => {
                  const on = active.kind === 'category' && active.name === cat
                  return (
                    <OptionRow key={cat} label={cat} count={catCount(cat)} on={on}
                      onClick={() => { setActive(on ? { kind: 'smart', id: 'all' } : { kind: 'category', name: cat }); setOptionsOpen(false) }} />
                  )
                })}
              </div>
            </>
          )}
        </FormSheetBody>
      </MSheet>

      <MTaskSheet
        planner={planner}
        open={creatingTask || editingItemId != null}
        itemId={editingItemId}
        categories={categories}
        members={tripMembers}
        defaultCategory={defaultCategoryForNew}
        onClose={closeSheet}
      />
    </>
  )
}

/** How far the list has come, in words: done once every task is. */
function progressLabel(t: TripPlanner['t'], done: number, total: number): string {
  return total > 0 && done === total ? t('todo.allDone') : t('todo.progressCount', { done, total })
}

function OptionRow({ icon, label, count, on, onClick }: Readonly<{ icon?: ReactNode; label: string; count?: number; on: boolean; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className="flex w-full items-center gap-[11px] border-b border-m-rowbr px-[14px] py-[12px] text-start text-body font-medium text-m-ink last:border-b-0">
      {icon && <span className="flex flex-none">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && <span className="flex-none text-caption tabular-nums text-m-faint">{count}</span>}
      {on && <Check size={15} strokeWidth={2.4} className="flex-none" />}
    </button>
  )
}

/** A swipe does what the card offers: tick it off, open it, or delete it. */
function taskSwipeActions(
  item: TodoItem,
  t: (key: string) => string,
  onToggle: (id: number, checked: boolean) => void,
  onOpen: (id: number) => void,
  onDelete?: (id: number) => void,
): { leading: SwipeAction; trailing: SwipeAction[] } {
  const leading: SwipeAction = item.checked
    ? { label: t('todo.filter.open'), icon: RotateCcw, tone: 'neutral', onAction: () => onToggle(item.id, false) }
    : { label: t('todo.filter.done'), icon: Check, tone: 'accent', onAction: () => onToggle(item.id, true) }
  const trailing: SwipeAction[] = [
    ...(onDelete ? [{ label: t('common.delete'), icon: Trash2, tone: 'danger' as const, onAction: () => onDelete(item.id) }] : []),
    { label: t('common.edit'), icon: Pencil, tone: 'neutral', onAction: () => onOpen(item.id) },
  ]
  return { leading, trailing }
}

function TaskCard({ item, members, today, onToggle, onOpen, onDelete }: {
  item: TodoItem
  members: TripMember[]
  today: string
  onToggle: (id: number, checked: boolean) => void
  onOpen: (id: number) => void
  /** Only for those who may edit the list. */
  onDelete?: (id: number) => void
}) {
  const { t, locale } = useTranslation()
  const done = !!item.checked
  const overdue = isTodoOverdue(item, today)
  const assignee = members.find(m => m.id === item.assigned_user_id)
  const prioColor = item.priority ? PRIORITY_COLOR[item.priority] : undefined
  const avatarSrcUrl = assignee ? assignee.avatar_url || avatarSrc(assignee.avatar) : null
  // formatDate() renders "Invalid Date" for anything it can't parse — a due date
  // that isn't a real date stays raw instead.
  const dueLabel = item.due_date
    ? (Number.isNaN(Date.parse(`${item.due_date}T00:00:00Z`)) ? item.due_date : formatDate(item.due_date, locale))
    : null

  const { leading, trailing } = taskSwipeActions(item, t, onToggle, onOpen, onDelete)

  return (
    <MSwipeRow leading={leading} trailing={trailing} surface="bg-m-sheetop" inset={4} className="border-t border-m-rowbr first:border-t-0">
      <div className="flex items-start gap-[10px] py-[10px]">
        <button
          type="button"
          onClick={() => onToggle(item.id, !done)}
          aria-label={item.name}
          aria-pressed={done}
          className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.5px] ${
            done ? 'border-m-act bg-m-act text-m-actfg' : 'border-[color:var(--m-checkbr)] text-transparent'
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </button>

        {/* The rest of the row opens the task sheet, like a packing row opens its item. */}
        <button type="button" onClick={() => onOpen(item.id)} aria-haspopup="dialog"
          className="flex min-w-0 flex-1 items-start gap-[8px] rounded-[10px] text-start outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-m-act">
          <div className="min-w-0 flex-1">
            <div className={`truncate pt-[1px] text-body font-medium ${done ? 'text-m-faint line-through opacity-45' : 'text-m-ink'}`}>
              {item.name}
            </div>
            {item.description && (
              <MarkdownText clamp className="mt-[1px] text-caption text-m-faint">{item.description}</MarkdownText>
            )}
            {(item.priority > 0 || item.due_date) && (
              <div className="mt-[3px] flex flex-wrap items-center gap-x-[10px] gap-y-[2px] text-caption font-semibold">
                {item.priority > 0 && (
                  <span className="inline-flex items-center gap-[3px]" style={{ color: prioColor }}>
                    <Flag size={11} strokeWidth={2.4} />
                    {PRIORITY_LABEL[item.priority]}
                  </span>
                )}
                {item.due_date && (
                  <span className={`inline-flex items-center gap-[3px] ${overdue && !done ? 'text-[color:var(--m-st-danger)]' : 'text-m-muted'}`}>
                    <Calendar size={11} strokeWidth={2.2} />
                    {dueLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {assignee && (
            <span aria-label={assignee.username} className="mt-[1px] flex h-5 w-5 flex-none items-center justify-center overflow-hidden rounded-full bg-m-ic text-[0.5625rem] font-bold text-m-muted">
              {avatarSrcUrl ? <img src={avatarSrcUrl} alt="" className="h-full w-full object-cover" /> : assignee.username[0]?.toUpperCase()}
            </span>
          )}
        </button>
      </div>
    </MSwipeRow>
  )
}
