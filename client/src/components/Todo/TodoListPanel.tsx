import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import ReactDOM from 'react-dom'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { tripsApi } from '../../api/client'
import apiClient from '../../api/client'
import CustomSelect from '../shared/CustomSelect'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { formatDate as fmtDate } from '../../utils/formatters'
import {
  CheckSquare, Square, Plus, ChevronRight, Flag,
  X, Check, Calendar, User, FolderPlus, AlertCircle, ListChecks, Inbox, CheckCheck, Trash2,
} from 'lucide-react'
import type { TodoItem } from '../../types'

import { KAT_COLORS, PRIO_CONFIG, katColor, type FilterType, type Member } from './todoListModel'
import { useTodoList } from './useTodoList'
import TodoRow from './TodoRow'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'

export default function TodoListPanel({ tripId, items, addItemSignal = 0 }: { tripId: number; items: TodoItem[]; addItemSignal?: number }) {
  // Layout component: state/effects/derived/handlers live in useTodoList.
  const {
    canEdit, t, formatDate, toggleTodoItem, reorderTodoItems,
    isMobile, filter, setFilter, selectedId, setSelectedId,
    isAddingNew, setIsAddingNew, sortByPrio, setSortByPrio,
    addingCategory, setAddingCategory, newCategoryName, setNewCategoryName,
    members, categories, today, filtered, selectedItem,
    totalCount, doneCount, overdueCount, myCount,
    addCategory, catCount,
  } = useTodoList(tripId, items, addItemSignal)

  // Plugin-contributed columns/actions for the todo view, keyed by task id (#plugins).
  const contribFor = usePluginViewContributions('todos', tripId)

  // Drag-to-reorder (#969). Manual ordering only makes sense when the list isn't
  // sorted by priority; a drag within the filtered view is mapped back onto the
  // full item order so unfiltered tasks keep their place.
  const [dragId, setDragId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const canReorder = canEdit && !sortByPrio

  const handleReorderDrop = (targetId: number) => {
    const from = dragId
    setDragId(null); setOverId(null)
    if (from == null || from === targetId) return
    const viewOrder = filtered.map(i => i.id)
    const fi = viewOrder.indexOf(from)
    const ti = viewOrder.indexOf(targetId)
    if (fi < 0 || ti < 0) return
    viewOrder.splice(fi, 1)
    viewOrder.splice(ti, 0, from)
    // Slot the reordered visible ids back into the positions they occupy in the
    // global list, leaving every filtered-out task where it was.
    const viewIds = new Set(filtered.map(i => i.id))
    let vi = 0
    const globalIds = items.map(i => (viewIds.has(i.id) ? viewOrder[vi++] : i.id))
    reorderTodoItems(tripId, globalIds)
  }

  // Sidebar filter item
  const SidebarItem = ({ id, icon: Icon, label, count, color }: { id: string; icon: any; label: string; count: number; color?: string }) => (
    <button onClick={() => setFilter(id as FilterType)}
      title={isMobile ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? 0 : 8, width: '100%', padding: isMobile ? '8px 0' : '7px 12px',
        border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))',
        background: filter === id ? 'var(--bg-hover)' : 'transparent',
        color: filter === id ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: filter === id ? 600 : 400, transition: 'all 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (filter !== id) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (filter !== id) e.currentTarget.style.background = 'transparent' }}>
      {color ? (
        <span style={{ width: isMobile ? 12 : 10, height: isMobile ? 12 : 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      ) : (
        <Icon size={isMobile ? 18 : 15} style={{ flexShrink: 0, opacity: 0.7 }} />
      )}
      {!isMobile && <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>}
      {!isMobile && count > 0 && (
        <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', background: 'var(--bg-hover)', borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
          {count}
        </span>
      )}
      {isMobile && count > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--bg-primary)', background: 'var(--text-faint)', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {count}
        </span>
      )}
    </button>
  )

  // Filter title
  const filterTitle = (() => {
    if (filter === 'all') return t('todo.filter.all')
    if (filter === 'done') return t('todo.filter.done')
    if (filter === 'my') return t('todo.filter.my')
    if (filter === 'overdue') return t('todo.filter.overdue')
    return filter
  })()

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 180px)', minHeight: 400 }}>

      {/* ── Left Sidebar ── */}
      <div style={{
        width: isMobile ? 52 : 220, flexShrink: 0, borderRight: '1px solid var(--border-faint)',
        padding: isMobile ? '12px 6px' : '16px 12px 16px 0', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        transition: 'width 0.2s',
      }}>
        {/* Progress Card */}
        {!isMobile && <div style={{
          margin: '0 0 12px', padding: '14px 14px 12px', borderRadius: 14,
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border-faint)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : '0%', background: '#22c55e', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>
            {doneCount} / {totalCount} {t('todo.completed')}
          </div>
        </div>}

        {/* Smart filters */}
        {!isMobile && <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('todo.sidebar.tasks')}
        </div>}
        <SidebarItem id="all" icon={Inbox} label={t('todo.filter.all')} count={items.filter(i => !i.checked).length} />
        <SidebarItem id="my" icon={User} label={t('todo.filter.my')} count={myCount} />
        <SidebarItem id="overdue" icon={AlertCircle} label={t('todo.filter.overdue')} count={overdueCount} />
        <SidebarItem id="done" icon={CheckCheck} label={t('todo.filter.done')} count={doneCount} />

        {/* Sort by */}
        {!isMobile && <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '16px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('todo.sidebar.sortBy')}
        </div>}
        <button onClick={() => setSortByPrio(v => !v)}
          title={isMobile ? t('todo.priority') : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? 0 : 8, width: '100%', padding: isMobile ? '8px 0' : '7px 12px',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))',
            background: sortByPrio ? '#f59e0b12' : 'transparent',
            color: sortByPrio ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: sortByPrio ? 600 : 400, transition: 'all 0.1s',
          }}
          onMouseEnter={e => { if (!sortByPrio) e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { if (!sortByPrio) e.currentTarget.style.background = 'transparent' }}>
          <Flag size={isMobile ? 18 : 15} style={{ flexShrink: 0, opacity: 0.7 }} />
          {!isMobile && <span style={{ flex: 1, textAlign: 'left' }}>{t('todo.priority')}</span>}
        </button>

        {/* Categories */}
        {!isMobile && <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)', padding: '16px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('todo.sidebar.categories')}
        </div>}
        {isMobile && <div style={{ height: 1, background: 'var(--border-faint)', margin: '8px 4px' }} />}
        {categories.map(cat => (
          <SidebarItem key={cat} id={cat} icon={null} label={cat} count={catCount(cat)} color={katColor(cat, categories)} />
        ))}

        {canEdit && (
          addingCategory && !isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px' }}>
              <input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName('') } }}
                placeholder={t('todo.newCategory')}
                style={{ flex: 1, fontSize: 'calc(12px * var(--fs-scale-body, 1))', padding: '4px 6px', border: '1px solid var(--border-primary)', borderRadius: 5, background: 'var(--bg-hover)', color: 'var(--text-primary)', fontFamily: 'inherit', minWidth: 0 }} />
              <button onClick={addCategory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', padding: 2 }}><Check size={13} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)}
              title={isMobile ? t('todo.addCategory') : undefined}
              style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: isMobile ? 0 : 6, padding: isMobile ? '8px 0' : '7px 12px', fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' }}>
              <Plus size={isMobile ? 18 : 13} /> {!isMobile && t('todo.addCategory')}
            </button>
          )
        )}
      </div>

      {/* ── Middle: Task List ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {filterTitle}
            </h2>
            <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', background: 'var(--bg-hover)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
              {filtered.length}
            </span>
          </div>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 ? null : (
            filtered.map(item => {
              const contributions = contribFor(item.id)
              return (
                <Fragment key={item.id}>
                  <TodoRow
                    item={item}
                    members={members}
                    categories={categories}
                    today={today}
                    isSelected={selectedId === item.id}
                    canEdit={canEdit}
                    formatDate={formatDate}
                    onSelect={(id) => { setSelectedId(id); setIsAddingNew(false) }}
                    onToggle={(id, checked) => toggleTodoItem(tripId, id, checked)}
                    drag={canReorder ? {
                      isDragging: dragId === item.id,
                      isOver: overId === item.id && dragId !== null && dragId !== item.id,
                      onStart: (id) => { setDragId(id); setOverId(null) },
                      onOver: (id) => setOverId(id),
                      onEnd: () => { setDragId(null); setOverId(null) },
                      onDrop: handleReorderDrop,
                    } : undefined}
                  />
                  {contributions.length > 0 && (
                    <div style={{ padding: '0 20px 8px' }}><PluginCardFooter items={contributions} tripId={tripId} /></div>
                  )}
                </Fragment>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: Detail Pane ── */}
      {selectedItem && !isAddingNew && !isMobile && (
        <DetailPane
          item={selectedItem}
          tripId={tripId}
          categories={categories}
          members={members}
          onClose={() => setSelectedId(null)}
        />
      )}
      {selectedItem && !isAddingNew && isMobile && (
        <div onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'var(--bottom-nav-h)' }}>
          <div style={{ width: '100%', maxHeight: '85vh', borderRadius: '16px 16px 0 0', overflow: 'auto' }}
            ref={el => { if (el) { const child = el.firstElementChild as HTMLElement; if (child) { child.style.width = '100%'; child.style.borderLeft = 'none'; child.style.borderRadius = '16px 16px 0 0' } } }}>
            <DetailPane
              item={selectedItem}
              tripId={tripId}
              categories={categories}
              members={members}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}
      {isAddingNew && !selectedItem && !isMobile && ReactDOM.createPortal(
        <div onClick={e => { if (e.target === e.currentTarget) setIsAddingNew(false) }}
          className="trek-modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 40 }}>
          <div style={{ width: 'min(520px, 92vw)', maxHeight: 'calc(100vh - var(--nav-h) - 120px)', overflow: 'auto', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            ref={el => { if (el) { const child = el.firstElementChild as HTMLElement; if (child) { child.style.width = '100%'; child.style.borderLeft = 'none'; child.style.borderRadius = '16px' } } }}>
            <NewTaskPane
              tripId={tripId}
              categories={categories}
              members={members}
              defaultCategory={typeof filter === 'string' && categories.includes(filter) ? filter : null}
              onCreated={(id) => { setIsAddingNew(false); setSelectedId(id) }}
              onClose={() => setIsAddingNew(false)}
            />
          </div>
        </div>,
        document.body
      )}
      {isAddingNew && !selectedItem && isMobile && ReactDOM.createPortal(
        <div onClick={e => { if (e.target === e.currentTarget) setIsAddingNew(false) }}
          className="trek-modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'var(--bottom-nav-h)' }}>
          <div style={{ width: '100%', maxHeight: '85vh', borderRadius: '16px 16px 0 0', overflow: 'auto' }}
            ref={el => { if (el) { const child = el.firstElementChild as HTMLElement; if (child) { child.style.width = '100%'; child.style.borderLeft = 'none'; child.style.borderRadius = '16px 16px 0 0' } } }}>
            <NewTaskPane
              tripId={tripId}
              categories={categories}
              members={members}
              defaultCategory={typeof filter === 'string' && categories.includes(filter) ? filter : null}
              onCreated={(id) => { setIsAddingNew(false); setSelectedId(id) }}
              onClose={() => setIsAddingNew(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Detail Pane (right side) ──────────────────────────────────────────────

function DetailPane({ item, tripId, categories, members, onClose }: {
  item: TodoItem; tripId: number; categories: string[]; members: Member[];
  onClose: () => void;
}) {
  const { updateTodoItem, deleteTodoItem } = useTripStore()
  const trip = useTripStore((s) => s.trip)
  const can = useCanDo()
  const canEdit = can('packing_edit', trip)
  const toast = useToast()
  const { t } = useTranslation()

  const [name, setName] = useState(item.name)
  const [desc, setDesc] = useState(item.description || '')
  const [dueDate, setDueDate] = useState(item.due_date || '')
  const [category, setCategory] = useState(item.category || '')
  const [addingCategory, setAddingCategoryInline] = useState(false)
  const [assignedUserId, setAssignedUserId] = useState<number | null>(item.assigned_user_id)
  const [priority, setPriority] = useState(item.priority || 0)
  const [saving, setSaving] = useState(false)

  // Sync when selected item changes
  useEffect(() => {
    setName(item.name)
    setDesc(item.description || '')
    setDueDate(item.due_date || '')
    setCategory(item.category || '')
    setAssignedUserId(item.assigned_user_id)
    setPriority(item.priority || 0)
  }, [item.id, item.name, item.description, item.due_date, item.category, item.assigned_user_id, item.priority])

  const hasChanges = name !== item.name || desc !== (item.description || '') ||
    dueDate !== (item.due_date || '') || category !== (item.category || '') ||
    assignedUserId !== item.assigned_user_id || priority !== (item.priority || 0)

  const save = async () => {
    if (!name.trim() || !hasChanges) return
    setSaving(true)
    try {
      await updateTodoItem(tripId, item.id, {
        name: name.trim(), description: desc || null,
        due_date: dueDate || null, category: category || null,
        assigned_user_id: assignedUserId, priority,
      } as any)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTodoItem(tripId, item.id)
      onClose()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
  }

  const labelClass = 'block text-xs font-medium text-content-secondary mb-1'
  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '8px 10px', border: '1px solid var(--border-primary)',
    borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit',
  }

  return (
    <div style={{
      width: 320, flexShrink: 0, borderLeft: '1px solid var(--border-faint)',
      display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--border-faint)' }}>
        <span style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>{t('todo.detail.title')}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Name */}
        <div>
          <input value={name} onChange={e => setName(e.target.value)} disabled={!canEdit}
            style={{ ...inputStyle, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, border: 'none', padding: '4px 0', background: 'transparent' }}
            placeholder={t('todo.namePlaceholder')} />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>{t('todo.detail.description')}</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} disabled={!canEdit} rows={4}
            placeholder={t('todo.descriptionPlaceholder')}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
        </div>

        {/* Priority */}
        <div>
          <label className={labelClass}>{t('todo.detail.priority')}</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map(p => {
              const cfg = PRIO_CONFIG[p]
              const isActive = priority === p
              return (
                <button key={p} onClick={() => canEdit && setPriority(p)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: canEdit ? 'pointer' : 'default',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    border: `1px solid ${isActive && cfg ? cfg.color + '40' : 'var(--border-primary)'}`,
                    background: isActive && cfg ? cfg.color + '12' : 'transparent',
                    color: isActive && cfg ? cfg.color : isActive ? 'var(--text-primary)' : 'var(--text-faint)',
                    transition: 'all 0.1s',
                  }}>
                  {cfg ? <><Flag size={10} />{cfg.label}</> : t('todo.detail.noPriority')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>{t('todo.detail.category')}</label>
          {addingCategory ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                autoFocus
                value={category}
                onChange={e => setCategory(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setAddingCategoryInline(false); if (e.key === 'Escape') { setCategory(''); setAddingCategoryInline(false) } }}
                placeholder={t('todo.newCategory')}
                style={{ flex: 1, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={() => setAddingCategoryInline(false)}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CustomSelect
                  value={category}
                  onChange={v => setCategory(String(v))}
                  options={[
                    { value: '', label: t('todo.noCategory') },
                    ...categories.map(c => ({
                      value: c, label: c,
                      icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(c, categories), display: 'inline-block' }} />,
                    })),
                    ...(category && !categories.includes(category) ? [{
                      value: category, label: `${category} (${t('todo.newCategoryLabel') || 'new'})`,
                      icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />,
                    }] : []),
                  ]}
                  placeholder={t('todo.noCategory')}
                  size="sm"
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <button type="button" onClick={() => { setCategory(''); setAddingCategoryInline(true) }}
                  title={t('todo.newCategory')}
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                  <Plus size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className={labelClass}>{t('todo.detail.dueDate')}</label>
          <CustomDatePicker
            value={dueDate}
            onChange={v => setDueDate(v)}
          />
        </div>

        {/* Assigned to */}
        <div>
          <label className={labelClass}>{t('todo.detail.assignedTo')}</label>
          <CustomSelect
            value={String(assignedUserId ?? '')}
            onChange={v => setAssignedUserId(v ? Number(v) : null)}
            options={[
              { value: '', label: t('todo.unassigned'), icon: <User size={14} className="text-content-faint" /> },
              ...members.map(m => ({
                value: String(m.id),
                label: m.is_guest ? `${m.username} · ${t('members.guest')}` : m.username,
                icon: m.avatar ? (
                  <img src={avatarSrc(m.avatar)!} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' as const }} alt="" />
                ) : (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--border-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 600 }}>
                    {m.username.charAt(0).toUpperCase()}
                  </span>
                ),
              })),
            ]}
            placeholder={t('todo.unassigned')}
            size="sm"
            disabled={!canEdit}
          />
        </div>
      </div>

      {/* Footer actions */}
      {canEdit && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-faint)', display: 'flex', gap: 8 }}>
          <button onClick={handleDelete}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
            <Trash2 size={13} />
            {t('todo.detail.delete')}
          </button>
          <button onClick={save} disabled={!hasChanges || saving}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: hasChanges ? 'pointer' : 'default', fontFamily: 'inherit',
              border: 'none', background: hasChanges ? 'var(--text-primary)' : 'var(--border-faint)',
              color: hasChanges ? 'var(--bg-primary)' : 'var(--text-faint)',
              transition: 'all 0.15s',
            }}>
            {saving ? '...' : t('todo.detail.save')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── New Task Pane (right side, for creating) ──────────────────────────────

function NewTaskPane({ tripId, categories, members, defaultCategory, onCreated, onClose }: {
  tripId: number; categories: string[]; members: Member[]; defaultCategory: string | null;
  onCreated: (id: number) => void; onClose: () => void;
}) {
  const { addTodoItem } = useTripStore()
  const toast = useToast()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState(defaultCategory || '')
  const [addingCategory, setAddingCategoryInline] = useState(false)
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null)
  const [priority, setPriority] = useState(0)
  const [saving, setSaving] = useState(false)

  const labelClass = 'block text-xs font-medium text-content-secondary mb-1'

  const create = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const trimmedCategory = category.trim()
      const item = await addTodoItem(tripId, {
        name: name.trim(), description: desc || null, priority,
        due_date: dueDate || null, category: trimmedCategory || null,
        assigned_user_id: assignedUserId,
      } as any)
      if (item?.id) onCreated(item.id)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
    setSaving(false)
  }

  return (
    <div style={{
      width: 320, flexShrink: 0, borderLeft: '1px solid var(--border-faint)',
      display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--border-faint)' }}>
        <span style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>{t('todo.newItem')}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) create() }}
            style={{ width: '100%', fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, border: 'none', padding: '4px 0', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
            placeholder={t('todo.namePlaceholder')} />
        </div>

        <div>
          <label className={labelClass}>{t('todo.detail.description')}</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
            placeholder={t('todo.descriptionPlaceholder')}
            style={{ width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }} />
        </div>

        <div>
          <label className={labelClass}>{t('todo.detail.category')}</label>
          {addingCategory ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                autoFocus
                value={category}
                onChange={e => setCategory(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') setAddingCategoryInline(false); if (e.key === 'Escape') { setCategory(''); setAddingCategoryInline(false) } }}
                placeholder={t('todo.newCategory')}
                style={{ flex: 1, fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
              />
              <button type="button" onClick={() => setAddingCategoryInline(false)}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CustomSelect
                  value={category}
                  onChange={v => setCategory(String(v))}
                  options={[
                    { value: '', label: t('todo.noCategory') },
                    ...categories.map(c => ({
                      value: c, label: c,
                      icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(c, categories), display: 'inline-block' }} />,
                    })),
                    ...(category && !categories.includes(category) ? [{
                      value: category, label: `${category} (${t('todo.newCategoryLabel') || 'new'})`,
                      icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />,
                    }] : []),
                  ]}
                  placeholder={t('todo.noCategory')}
                  size="sm"
                />
              </div>
              <button type="button" onClick={() => { setCategory(''); setAddingCategoryInline(true) }}
                title={t('todo.newCategory')}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0 10px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>{t('todo.detail.priority')}</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3].map(p => {
              const cfg = PRIO_CONFIG[p]
              const isActive = priority === p
              return (
                <button key={p} onClick={() => setPriority(p)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    border: `1px solid ${isActive && cfg ? cfg.color + '40' : 'var(--border-primary)'}`,
                    background: isActive && cfg ? cfg.color + '12' : 'transparent',
                    color: isActive && cfg ? cfg.color : isActive ? 'var(--text-primary)' : 'var(--text-faint)',
                    transition: 'all 0.1s',
                  }}>
                  {cfg ? <><Flag size={10} />{cfg.label}</> : t('todo.detail.noPriority')}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('todo.detail.dueDate')}</label>
          <CustomDatePicker value={dueDate} onChange={v => setDueDate(v)} />
        </div>

        <div>
          <label className={labelClass}>{t('todo.detail.assignedTo')}</label>
          <CustomSelect
            value={String(assignedUserId ?? '')}
            onChange={v => setAssignedUserId(v ? Number(v) : null)}
            options={[
              { value: '', label: t('todo.unassigned'), icon: <User size={14} className="text-content-faint" /> },
              ...members.map(m => ({
                value: String(m.id), label: m.username,
                icon: m.avatar ? (
                  <img src={avatarSrc(m.avatar)!} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' as const }} alt="" />
                ) : (
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--border-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 600 }}>
                    {m.username.charAt(0).toUpperCase()}
                  </span>
                ),
              })),
            ]}
            placeholder={t('todo.unassigned')}
            size="sm"
          />
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-faint)' }}>
        <button onClick={create} disabled={!name.trim() || saving}
          style={{
            width: '100%', padding: '9px 16px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
            border: 'none', background: name.trim() ? 'var(--text-primary)' : 'var(--border-faint)',
            color: name.trim() ? 'var(--bg-primary)' : 'var(--text-faint)', transition: 'all 0.15s',
          }}>
          {saving ? '...' : t('todo.detail.create')}
        </button>
      </div>
    </div>
  )
}
