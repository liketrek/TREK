import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { budgetApi } from '../../api/client'
import type { BudgetItem } from '../../types'
import { currencyDecimals } from '../../utils/formatters'
import { widgetTheme, fmtNum, calcPP, calcPD, calcPPD } from './BudgetPanel.helpers'
import { PIE_COLORS } from './BudgetPanel.constants'
import type { TripMember } from './BudgetPanelMemberChips'

function useIsDark(): boolean {
  const [dark, setDark] = useState<boolean>(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => {
    if (typeof document === 'undefined') return
    const mo = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return dark
}

export interface EditingCat {
  name: string
  value: string
}

interface SettlementPerson {
  user_id: number
  username: string
  avatar_url: string | null
}

interface SettlementFlow {
  from: SettlementPerson
  to: SettlementPerson
  amount: number
}

interface SettlementBalance {
  user_id: number
  username: string
  avatar_url: string | null
  balance: number
}

export interface SettlementData {
  balances: SettlementBalance[]
  flows: SettlementFlow[]
}

export interface PieSegment {
  name: string
  value: number
  color: string
}

export interface AddItemData {
  name: string
  total_price: number
  persons: number | null
  days: number | null
  note: string | null
  expense_date: string | null
}

export function useBudgetPanel(tripId: number, tripMembers: TripMember[]) {
  const { trip, budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, loadBudgetItems, updateTrip, setBudgetItemMembers, toggleBudgetMemberPaid, reorderBudgetItems, reorderBudgetCategories } = useTripStore()
  const can = useCanDo()
  const toast = useToast()
  const { t, locale } = useTranslation()
  const isDark = useIsDark()
  const theme = useMemo(() => widgetTheme(isDark), [isDark])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCat, setEditingCat] = useState<EditingCat | null>(null) // { name, value }
  const [settlement, setSettlement] = useState<SettlementData | null>(null)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const currency = trip?.currency || 'EUR'
  const canEdit = can('budget_edit', trip)

  const fmt = (v: number | null | undefined, cur: string) => fmtNum(v, locale, cur)
  const hasMultipleMembers = tripMembers.length > 1

  // Drag state for categories
  const [dragCat, setDragCat] = useState<string | null>(null)
  const [dragOverCat, setDragOverCat] = useState<string | null>(null)
  // Drag state for items within a category
  const [dragItem, setDragItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const [dragItemCat, setDragItemCat] = useState<string | null>(null)

  // Load settlement data whenever budget items change
  useEffect(() => {
    if (!hasMultipleMembers) return
    budgetApi.settlement(tripId).then(setSettlement).catch(() => {})
  }, [tripId, budgetItems, hasMultipleMembers])

  const setCurrency = (cur: string) => {
    if (tripId) updateTrip(tripId, { currency: cur })
  }

  useEffect(() => { if (tripId) loadBudgetItems(tripId) }, [tripId])

  const grouped = useMemo(() => {
    const map = new Map<string, BudgetItem[]>()
    for (const item of (budgetItems || [])) {
      const cat = item.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    return map
  }, [budgetItems])

  const categoryNames = Array.from(grouped.keys())

  // Stable color mapping: assign index-based colors once, never reassign on reorder
  const colorMapRef = useRef(new Map<string, string>())
  const categoryColor = useCallback((cat: string) => {
    const map = colorMapRef.current
    if (!map.has(cat)) {
      map.set(cat, PIE_COLORS[map.size % PIE_COLORS.length])
    }
    return map.get(cat)!
  }, [])
  const grandTotal = (budgetItems || []).reduce((s, i) => s + (i.total_price || 0), 0)

  const pieSegments = useMemo<PieSegment[]>(() =>
    categoryNames.map((cat, i) => ({
      name: cat,
      value: (grouped.get(cat) || []).reduce((s, x) => s + (x.total_price || 0), 0),
      color: categoryColor(cat),
    })).filter(s => s.value > 0)
  , [grouped, categoryNames])

  const handleAddItem = async (category: string, data: AddItemData) => { try { await addBudgetItem(tripId, { ...data, category }) } catch { toast.error(t('common.error')) } }
  const handleUpdateField = async (id: number, field: string, value: unknown) => { try { await updateBudgetItem(tripId, id, { [field]: value } as Partial<BudgetItem>) } catch { toast.error(t('common.error')) } }
  const handleDeleteItem = async (id: number) => { try { await deleteBudgetItem(tripId, id) } catch { toast.error(t('common.error')) } }
  const handleDeleteCategory = async (cat: string) => {
    const items = grouped.get(cat) || []
    try { for (const item of Array.from(items)) await deleteBudgetItem(tripId, item.id) }
    catch { toast.error(t('common.error')) }
  }
  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName.trim() === oldName) return
    const items = grouped.get(oldName) || []
    try { for (const item of Array.from(items)) await updateBudgetItem(tripId, item.id, { category: newName.trim() }) }
    catch { toast.error(t('common.error')) }
  }
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    Promise.resolve(addBudgetItem(tripId, { name: t('budget.defaultEntry'), category: newCategoryName.trim(), total_price: 0 }))
      .catch(() => toast.error(t('common.error')))
    setNewCategoryName('')
  }

  const handleExportCsv = () => {
    const sep = ';'
    const esc = (v: unknown) => { const s = String(v ?? ''); return s.includes(sep) || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s }
    const d = currencyDecimals(currency)
    const fmtPrice = (v: number | null | undefined) => v != null ? v.toFixed(d) : ''

    const fmtDate = (iso: string) => { if (!iso) return ''; const d = new Date(iso + 'T00:00:00Z'); return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) }
    const header = ['Category', 'Name', 'Date', 'Total (' + currency + ')', 'Persons', 'Days', 'Per Person', 'Per Day', 'Per Person/Day', 'Note']
    const rows = [header.join(sep)]

    for (const cat of categoryNames) {
      for (const item of (grouped.get(cat) || [])) {
        const pp = calcPP(item.total_price, item.persons)
        const pd = calcPD(item.total_price, item.days)
        const ppd = calcPPD(item.total_price, item.persons, item.days)
        rows.push([
          esc(item.category), esc(item.name), esc(fmtDate(item.expense_date || '')),
          fmtPrice(item.total_price), item.persons ?? '', item.days ?? '',
          fmtPrice(pp), fmtPrice(pd), fmtPrice(ppd),
          esc(item.note || ''),
        ].join(sep))
      }
    }

    const bom = '﻿'
    const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = (trip?.title || 'trip').replace(/[^a-zA-Z0-9À-ɏ _-]/g, '').trim()
    a.download = `budget-${safeName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const th: CSSProperties = { padding: '6px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--border-primary)', whiteSpace: 'nowrap', background: 'var(--bg-secondary)' }
  const td: CSSProperties = { padding: '2px 6px', borderBottom: '1px solid var(--border-secondary)', fontSize: 13, verticalAlign: 'middle', color: 'var(--text-primary)' }

  return {
    trip, budgetItems,
    setBudgetItemMembers, toggleBudgetMemberPaid, reorderBudgetItems, reorderBudgetCategories,
    t, locale, isDark, theme,
    newCategoryName, setNewCategoryName,
    editingCat, setEditingCat,
    settlement, settlementOpen, setSettlementOpen,
    currency, canEdit, fmt, hasMultipleMembers,
    dragCat, setDragCat, dragOverCat, setDragOverCat,
    dragItem, setDragItem, dragOverItem, setDragOverItem, dragItemCat, setDragItemCat,
    setCurrency,
    grouped, categoryNames, categoryColor, grandTotal, pieSegments,
    handleAddItem, handleUpdateField, handleDeleteItem, handleDeleteCategory, handleRenameCategory, handleAddCategory, handleExportCsv,
    th, td,
  }
}
