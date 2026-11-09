import { useState } from 'react'
import { selectionHaptic } from '../../../../native/haptics'
import { Calendar, Check, ChevronRight, Flag, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import MChipStrip from '../../../components/MChipStrip'
import MSwipeRow, { type SwipeAction } from '../../../components/MSwipeRow'
import { useAuthStore } from '../../../../store/authStore'
import { useTranslation } from '../../../../i18n'
import { avatarSrc } from '../../../../utils/avatarSrc'
import { formatDate } from '../../../../utils/formatters'
import type { TodoItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { CardGrid, TabPanes } from './tabChrome'
import MTodoSidebar from './MTodoSidebar'
import { useIsSplit } from '../../../../hooks/sizeClass'
import { PRIORITY_COLOR, PRIORITY_LABEL } from './listsModel'
import { TODO_SMART_FILTERS, isTodoOverdue, type TodoSmartFilter } from '../../../../components/Todo/todoListModel'
import { useTodoView } from '../../../../components/Todo/useTodoList'
import MTaskSheet from './MTaskSheet'
import MarkdownText from '../../../../components/shared/MarkdownText'

/**
 * To-do sub-tab (spec 03 §4.5-4.7): progress card with "New task", the
 * All|My|Overdue|Done + priority-sort filter row (extended with a category
 * rail — the demo leaves it out, but the audit at 03 §4.8 flags "Task
 * lists/category filter" as missing and to be added), and the task cards.
 * Add/Edit lives in `MTaskSheet`.
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
    `flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
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
      /* ── Progress card (spec §4.5) ── */
      <div className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[13px]">
        <div className="flex items-baseline gap-[7px]">
          <span className="font-geist text-[1rem] font-extrabold tabular-nums text-m-ink">{counts.done}/{items.length}</span>
          <span className="font-geist text-[0.625rem] font-bold text-m-faint">{pct}% {t('todo.completed')}</span>
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="ms-auto flex items-center gap-1 rounded-full bg-m-act px-[12px] py-[5px] text-[0.6875rem] font-semibold text-m-actfg"
            >
              <Plus size={11} strokeWidth={2.4} />
              {t('todo.newItem')}
            </button>
          )}
        </div>
        <div className="mt-[9px] h-[5px] overflow-hidden rounded-full bg-[color:var(--m-ic)]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--m-st-confirmed)' }} />
        </div>
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

      {/* ── Filters (spec §4.6) ── */}
      {!split && items.length > 0 && (
        <MChipStrip className="mt-[10px] items-center gap-[6px] whitespace-nowrap">
          {TODO_SMART_FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActive({ kind: 'smart', id: f })}
              className={filterPill(active.kind === 'smart' && active.id === f)}
            >
              {filterLabel(f)}
              <span className="font-geist text-[0.5625rem] opacity-70">{filterCount(f)}</span>
            </button>
          ))}
          {sortPills}
          {categories.length > 0 && <span className="h-4 w-px flex-none bg-[color:var(--m-rowbr)]" />}
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive({ kind: 'category', name: cat })}
              className={filterPill(active.kind === 'category' && active.name === cat)}
            >
              {cat}
              <span className="font-geist text-[0.5625rem] opacity-70">{catCount(cat)}</span>
            </button>
          ))}
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
        <CardGrid>
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
        </CardGrid>
      )}
    </TabPanes>

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
    <MSwipeRow leading={leading} trailing={trailing} surface="rounded-2xl bg-[color:var(--m-bg)]" className="mt-2 rounded-2xl">
    <div className={`flex items-start gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px] ${done ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(item.id, !done)}
        aria-label={item.name}
        aria-pressed={done}
        className={`mt-[1px] flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[6px] border-[1.5px] ${
          done ? 'border-m-act bg-m-act text-m-actfg' : 'border-[color:var(--m-checkbr)] text-transparent'
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <button type="button" onClick={() => onOpen(item.id)} className="flex min-w-0 flex-1 items-start gap-[8px] text-start">
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[0.8125rem] font-semibold ${done ? 'text-m-faint line-through opacity-45' : 'text-m-ink'}`}>
            {item.name}
          </div>
          {item.description && (
            <MarkdownText clamp className="mt-[1px] font-geist text-[0.625rem] text-m-faint">{item.description}</MarkdownText>
          )}
          {(item.priority > 0 || item.due_date || assignee) && (
            <div className="mt-[5px] flex flex-wrap items-center gap-[5px]">
              {item.priority > 0 && (
                <span className="inline-flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.59375rem] font-extrabold" style={{ color: prioColor }}>
                  <Flag size={9} strokeWidth={2.5} />
                  {PRIORITY_LABEL[item.priority]}
                </span>
              )}
              {item.due_date && (
                <span
                  className={`inline-flex items-center gap-[3px] rounded-full px-2 py-[2px] font-geist text-[0.59375rem] font-bold ${
                    overdue && !done ? 'bg-[rgba(214,39,59,.1)] text-[color:var(--m-st-danger)]' : 'bg-[color:var(--m-ic)] text-m-muted'
                  }`}
                >
                  <Calendar size={9} strokeWidth={2.2} />
                  {dueLabel}
                </span>
              )}
              {assignee && (
                <span className="inline-flex items-center gap-[4px] rounded-full bg-[color:var(--m-ic)] py-[2px] ps-[3px] pe-2 font-geist text-[0.59375rem] font-bold text-m-muted">
                  <span className="flex h-[13px] w-[13px] flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.4375rem] font-extrabold text-m-actfg">
                    {avatarSrcUrl ? <img src={avatarSrcUrl} alt="" className="h-full w-full object-cover" /> : assignee.username[0]?.toUpperCase()}
                  </span>
                  {assignee.username}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight size={14} strokeWidth={2} className="mt-[2px] flex-none text-m-faint" />
      </button>
    </div>
    </MSwipeRow>
  )
}
