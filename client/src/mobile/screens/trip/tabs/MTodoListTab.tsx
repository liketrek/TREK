import { useMemo, useState } from 'react'
import { Calendar, Check, ChevronRight, Flag, Plus } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useAuthStore } from '../../../../store/authStore'
import { useTranslation } from '../../../../i18n'
import { avatarSrc } from '../../../../utils/avatarSrc'
import { formatDate } from '../../../../utils/formatters'
import type { TodoItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { TabScroller } from './tabChrome'
import {
  PRIORITY_COLOR, PRIORITY_LABEL, filterTodoItems, isTodoOverdue, sortTodoRows,
  todoCategories, todoCategoryOpenCount, todoCounts, type TodoFilter,
} from './listsModel'
import MTaskSheet from './MTaskSheet'

const BUILTIN_FILTERS: TodoFilter[] = ['all', 'my', 'overdue', 'done']

/**
 * To-do sub-tab (spec 03 §4.5-4.7): progress card with "New task", the
 * All|My|Overdue|Done + priority-sort filter row (extended with a category
 * rail — the demo leaves it out, but the audit at 03 §4.8 flags "Task
 * lists/category filter" as missing and to be added), and the task cards.
 * Add/Edit lives in `MTaskSheet`.
 */
export default function MTodoListTab({ planner }: { planner: TripPlanner }) {
  const { t, tripId, todoItems: items, tripActions } = planner
  const canEdit = planner.can('packing_edit', planner.trip)
  const currentUserId = useAuthStore(s => s.user?.id) ?? null
  const tripMembers = planner.tripMembers

  const [filter, setFilter] = useState<TodoFilter>('all')
  const [sortByPriority, setSortByPriority] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [creatingTask, setCreatingTask] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const categories = useMemo(() => todoCategories(items), [items])
  const counts = todoCounts(items, currentUserId, today)
  const rows = useMemo(
    () => sortTodoRows(filterTodoItems(items, filter, currentUserId, today), sortByPriority, today),
    [items, filter, currentUserId, today, sortByPriority],
  )

  const pct = items.length > 0 ? Math.round((counts.done / items.length) * 100) : 0
  const defaultCategoryForNew = !BUILTIN_FILTERS.includes(filter) ? filter : null

  const openCreate = () => { setEditingItemId(null); setCreatingTask(true) }
  const openEdit = (id: number) => { setCreatingTask(false); setEditingItemId(id) }
  const closeSheet = () => { setCreatingTask(false); setEditingItemId(null) }
  const toggleItem = (id: number, checked: boolean) => tripActions.toggleTodoItem(tripId, id, checked)

  const filterPill = (active: boolean) =>
    `flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
    }`

  const filterLabel = (f: TodoFilter) =>
    f === 'all' ? t('todo.filter.all') : f === 'my' ? t('todo.filter.my') : f === 'overdue' ? t('todo.filter.overdue') : t('todo.filter.done')
  const filterCount = (f: TodoFilter) =>
    f === 'all' ? counts.open : f === 'my' ? counts.my : f === 'overdue' ? counts.overdue : counts.done

  return (
    <TabScroller>
      {/* ── Progress card (spec §4.5) ── */}
      <div className="rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[14px] py-[13px]">
        <div className="flex items-baseline gap-[7px]">
          <span className="font-geist text-[1rem] font-extrabold tabular-nums text-m-ink">{counts.done}/{items.length}</span>
          <span className="font-geist text-[0.625rem] font-bold text-m-faint">{pct}% · {t('todo.completed')}</span>
          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="ml-auto flex items-center gap-1 rounded-full bg-m-act px-[12px] py-[5px] text-[0.6875rem] font-semibold text-m-actfg"
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

      {/* ── Filters (spec §4.6) ── */}
      {items.length > 0 && (
        <div className="mt-[10px] flex items-center gap-[6px] overflow-x-auto whitespace-nowrap">
          {BUILTIN_FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={filterPill(filter === f)}>
              {filterLabel(f)}
              <span className="font-geist text-[0.5625rem] opacity-70">{filterCount(f)}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSortByPriority(v => !v)}
            aria-pressed={sortByPriority}
            className={filterPill(sortByPriority)}
          >
            <Flag size={11} strokeWidth={2.2} />
            {t('todo.priority')}
          </button>
          {categories.length > 0 && <span className="h-4 w-px flex-none bg-[color:var(--m-rowbr)]" />}
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => setFilter(cat)} className={filterPill(filter === cat)}>
              {cat}
              <span className="font-geist text-[0.5625rem] opacity-70">{todoCategoryOpenCount(items, cat)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Task cards (spec §4.7) ── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <MDancingTrek scene="tasks" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('todo.empty')}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-[30px] py-[26px] text-center font-geist text-[0.6875rem] leading-relaxed text-m-faint">
          {t('todo.emptyFiltered')}
        </div>
      ) : (
        rows.map(item => (
          <TaskCard
            key={item.id}
            item={item}
            members={tripMembers}
            today={today}
            onToggle={toggleItem}
            onOpen={openEdit}
          />
        ))
      )}

      <MTaskSheet
        planner={planner}
        open={creatingTask || editingItemId != null}
        itemId={editingItemId}
        categories={categories}
        members={tripMembers}
        defaultCategory={defaultCategoryForNew}
        onClose={closeSheet}
      />
    </TabScroller>
  )
}

function TaskCard({ item, members, today, onToggle, onOpen }: {
  item: TodoItem
  members: TripMember[]
  today: string
  onToggle: (id: number, checked: boolean) => void
  onOpen: (id: number) => void
}) {
  const { locale } = useTranslation()
  const done = !!item.checked
  const overdue = isTodoOverdue(item, today)
  const assignee = members.find(m => m.id === item.assigned_user_id)
  const prioColor = item.priority ? PRIORITY_COLOR[item.priority] : undefined
  const avatarSrcUrl = assignee ? assignee.avatar_url || avatarSrc(assignee.avatar) : null
  const dueLabel = item.due_date ? formatDate(item.due_date, locale) || item.due_date : null

  return (
    <div className={`mt-2 flex items-start gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px] ${done ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(item.id, !done)}
        aria-label={item.name}
        aria-pressed={done}
        className={`mt-[1px] flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[6px] border-[1.5px] ${
          done ? 'border-m-act bg-m-act text-m-actfg' : 'border-[color:var(--m-rowbr)] text-transparent'
        }`}
      >
        <Check size={12} strokeWidth={3} />
      </button>

      <button type="button" onClick={() => onOpen(item.id)} className="flex min-w-0 flex-1 items-start gap-[8px] text-left">
        <div className="min-w-0 flex-1">
          <div className={`truncate text-[0.8125rem] font-semibold ${done ? 'text-m-faint line-through opacity-45' : 'text-m-ink'}`}>
            {item.name}
          </div>
          {item.description && (
            <div className="mt-[1px] truncate font-geist text-[0.625rem] text-m-faint">{item.description}</div>
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
                <span className="inline-flex items-center gap-[4px] rounded-full bg-[color:var(--m-ic)] py-[2px] pl-[3px] pr-2 font-geist text-[0.59375rem] font-bold text-m-muted">
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
  )
}
