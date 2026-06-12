import { useState, useMemo, useEffect, useRef } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import apiClient from '../../api/client'
import { formatDate as fmtDate } from '../../utils/formatters'
import type { TodoItem } from '../../types'
import type { FilterType, Member } from './todoListModel'

/**
 * Todo list logic — store actions, member load, the filter/selection/add-new
 * view state and the derived buckets (filtered list + counts) + handlers.
 * TodoListPanel stays a layout component that renders the sidebar, the rows
 * (TodoRow) and the detail/new panes from this state.
 */
export function useTodoList(tripId: number, items: TodoItem[], addItemSignal: number) {
  const { addTodoItem, updateTodoItem, deleteTodoItem, toggleTodoItem } = useTripStore()
  const trip = useTripStore((s) => s.trip)
  const can = useCanDo()
  const canEdit = can('packing_edit', trip)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const formatDate = (d: string) => fmtDate(d, locale) || d

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [filter, setFilter] = useState<FilterType>('all')
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
  const [sortByPrio, setSortByPrio] = useState(false)
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

  const categories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach(i => { if (i.category) cats.add(i.category) })
    return Array.from(cats).sort()
  }, [items])

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    let result: TodoItem[]
    if (filter === 'all') result = items.filter(i => !i.checked)
    else if (filter === 'done') result = items.filter(i => !!i.checked)
    else if (filter === 'my') result = items.filter(i => !i.checked && i.assigned_user_id === currentUserId)
    else if (filter === 'overdue') result = items.filter(i => !i.checked && i.due_date && i.due_date < today)
    else result = items.filter(i => i.category === filter)
    if (sortByPrio) result = [...result].sort((a, b) => {
      const ap = a.priority || 99
      const bp = b.priority || 99
      return ap - bp
    })
    return result
  }, [items, filter, currentUserId, today, sortByPrio])

  const selectedItem = items.find(i => i.id === selectedId) || null
  const totalCount = items.length
  const doneCount = items.filter(i => !!i.checked).length
  const overdueCount = items.filter(i => !i.checked && i.due_date && i.due_date < today).length
  const myCount = currentUserId ? items.filter(i => !i.checked && i.assigned_user_id === currentUserId).length : 0

  const addCategory = () => {
    const name = newCategoryName.trim()
    if (!name || categories.includes(name)) { setAddingCategory(false); setNewCategoryName(''); return }
    addTodoItem(tripId, { name: t('todo.newItem'), category: name } as any)
      .then(() => { setAddingCategory(false); setNewCategoryName(''); setFilter(name) })
      .catch(err => toast.error(err instanceof Error ? err.message : t('common.error')))
  }

  // Get category count (non-done items)
  const catCount = (cat: string) => items.filter(i => i.category === cat && !i.checked).length

  return {
    canEdit, t, formatDate, toggleTodoItem,
    isMobile, filter, setFilter, selectedId, setSelectedId,
    isAddingNew, setIsAddingNew, sortByPrio, setSortByPrio,
    addingCategory, setAddingCategory, newCategoryName, setNewCategoryName,
    members, categories, today, filtered, selectedItem,
    totalCount, doneCount, overdueCount, myCount,
    addCategory, catCount,
    // exposed for completeness (DetailPane/NewTaskPane already get their own)
    updateTodoItem, deleteTodoItem,
  }
}
