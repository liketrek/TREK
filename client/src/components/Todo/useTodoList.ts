import { useState, useMemo, useEffect, useRef } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import apiClient from '../../api/client'
import { formatDate as fmtDate } from '../../utils/formatters'
import type { TodoItem } from '../../types'
import { localToday } from '../Planner/today'
import {
  compareTodoDue, compareTodoPriority, filterTodoItems, filterTodoItemsByCategory, isTodoSmartFilter, sortTodoRows,
  todoCategories, todoCategoryOpenCount, todoCounts, type FilterType, type Member, type TodoSmartFilter,
} from './todoListModel'
import { useIsPhone } from '../../mobile/useIsPhone'

/**
 * The bucket the list shows: one of the four built-ins, addressed by id, or a
 * category, addressed by name, so a category a user called "all" or "done"
 * can have its own bucket instead of the built-in one.
 */
type TodoActiveFilter = { kind: 'smart'; id: TodoSmartFilter } | { kind: 'category'; name: string }

type TodoSort = 'priority' | 'due' | null

export interface TodoViewOptions {
  /**
   * The phone's row order: done tasks sink to the end and open overdue ones
   * float to the top, the sort toggle only breaks ties. The desktop list keeps
   * the filtered order and sorts it by the toggle alone.
   */
  rankByStatus?: boolean
  /**
   * Read "today" once when the view mounts, as the phone tab does. The desktop
   * list reads it on every render, so its overdue cut-off moves at midnight.
   */
  pinToday?: boolean
}

/**
 * The to-do view state both views share: the active bucket, the sort toggle,
 * "today" and what is derived from them (categories, rows, counts). The
 * desktop panel gets it through useTodoList, the phone tab calls it with its
 * own options.
 */
export function useTodoView(items: TodoItem[], currentUserId: number | null, options: TodoViewOptions = {}) {
  const { rankByStatus = false, pinToday = false } = options
  const [active, setActive] = useState<TodoActiveFilter>({ kind: 'smart', id: 'all' })
  const [sortBy, setSortBy] = useState<TodoSort>(null)

  // due_date is a bare calendar date, so "today" has to be the user's calendar
  // day: toISOString() hands over the UTC one and shifts the overdue cut-off.
  const [mountDay] = useState(() => localToday())
  const today = pinToday ? mountDay : localToday()

  const categories = useMemo(() => todoCategories(items), [items])

  const rows = useMemo(() => {
    const result = active.kind === 'category'
      ? filterTodoItemsByCategory(items, active.name)
      : filterTodoItems(items, active.id, currentUserId, today)
    if (rankByStatus) return sortTodoRows(result, sortBy, today)
    if (sortBy === 'priority') return [...result].sort(compareTodoPriority)
    // Ties keep the manual order, the stable sort leaves them untouched (#2205).
    if (sortBy === 'due') return [...result].sort(compareTodoDue)
    return result
  }, [items, active, currentUserId, today, sortBy, rankByStatus])

  const counts = todoCounts(items, currentUserId, today)

  // The desktop sidebar addresses every bucket by one string, so a category
  // that shares a built-in's id lands on the built-in, as it always has there.
  const filter: FilterType = active.kind === 'smart' ? active.id : active.name
  const setFilter = (f: FilterType) =>
    setActive(isTodoSmartFilter(f) ? { kind: 'smart', id: f } : { kind: 'category', name: f })

  // A second press on the active sort goes back to the manual order.
  const toggleSort = (key: 'priority' | 'due') => setSortBy(v => (v === key ? null : key))

  // Open (non-done) count of a category
  const catCount = (cat: string) => todoCategoryOpenCount(items, cat)

  return { active, setActive, filter, setFilter, sortBy, toggleSort, today, categories, rows, counts, catCount }
}

/**
 * Todo list logic — store actions, member load, the filter/selection/add-new
 * view state and the derived buckets (filtered list + counts) + handlers.
 * TodoListPanel stays a layout component that renders the sidebar, the rows
 * (TodoRow) and the detail/new panes from this state.
 */
export function useTodoList(tripId: number, items: TodoItem[], addItemSignal: number) {
  const { addTodoItem, updateTodoItem, deleteTodoItem, toggleTodoItem, reorderTodoItems } = useTripStore()
  const trip = useTripStore((s) => s.trip)
  const can = useCanDo()
  const canEdit = can('packing_edit', trip)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const formatDate = (d: string) => fmtDate(d, locale) || d

  const isMobile = useIsPhone()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const lastHandledAddSignal = useRef(addItemSignal)

  useEffect(() => {
    if (addItemSignal !== lastHandledAddSignal.current && addItemSignal > 0) {
      setSelectedId(null)
      setIsAddingNew(true)
    }
    lastHandledAddSignal.current = addItemSignal
  }, [addItemSignal])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    apiClient.get(`/trips/${tripId}/members`).then(r => {
      const owner = r.data?.owner
      const mems = r.data?.members || []
      const all = owner ? [owner, ...mems] : mems
      setMembers(all)
      setCurrentUserId(r.data?.current_user_id || null)
    }).catch(() => {})
  }, [tripId])

  const { filter, setFilter, sortBy, toggleSort, today, categories, rows: filtered, counts, catCount } = useTodoView(items, currentUserId)
  const sortByPrio = sortBy === 'priority'
  const sortByDue = sortBy === 'due'

  const selectedItem = items.find(i => i.id === selectedId) || null
  const { total: totalCount, done: doneCount, overdue: overdueCount, my: myCount } = counts

  const addCategory = () => {
    const name = newCategoryName.trim()
    if (!name || categories.includes(name)) { setAddingCategory(false); setNewCategoryName(''); return }
    addTodoItem(tripId, { name: t('todo.newItem'), category: name } as any)
      .then(() => { setAddingCategory(false); setNewCategoryName(''); setFilter(name) })
      .catch(err => toast.error(err instanceof Error ? err.message : t('common.error')))
  }

  return {
    canEdit, t, formatDate, toggleTodoItem, reorderTodoItems,
    isMobile, filter, setFilter, selectedId, setSelectedId,
    isAddingNew, setIsAddingNew, sortByPrio, sortByDue, toggleSort,
    addingCategory, setAddingCategory, newCategoryName, setNewCategoryName,
    members, categories, today, filtered, selectedItem,
    totalCount, doneCount, overdueCount, myCount,
    addCategory, catCount,
    // exposed for completeness (DetailPane/NewTaskPane already get their own)
    updateTodoItem, deleteTodoItem,
  }
}
