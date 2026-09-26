import { Fragment, useState, useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { Check, Plus, Flag, X, Calendar, User, AlertCircle, Inbox, CheckCheck, Trash2 } from 'lucide-react'
import type { TodoItem } from '../../types'

import { katColor, taskInputStyle, type FilterType, type Member, type TaskFieldValues } from './todoListModel'
import { useTodoList } from './useTodoList'
import TodoRow from './TodoRow'
import TodoTaskFields from './TodoTaskFields'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'
import EmptyState from '../shared/EmptyState'
import NameDialog from '../shared/NameDialog'

/** The card the list and the detail pane sit in, the packing list's category card. */
const CARD: CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 16,
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}
const HEAD_BAND: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 10px 16px', background: 'var(--bg-tertiary)', flexShrink: 0,
}

// Sidebar filter row. Declared at module level so React keeps the same component
// type across renders — inline it and every re-render remounts the buttons,
// which drops clicks that are already in flight.
function SidebarItem({ id, icon: Icon, label, count, color, active, compact, onSelect }: {
  id: string
  icon: React.ComponentType<{ size?: number; style?: CSSProperties }> | null
  label: string
  count: number
  color?: string
  active: boolean
  compact: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button type="button" onClick={() => onSelect(id)}
      title={compact ? label : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: compact ? 'center' : 'flex-start',
        gap: compact ? 0 : 9, width: '100%', padding: compact ? '8px 0' : '8px 12px',
        border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(13px * var(--fs-scale-body, 1))',
        background: active ? 'var(--bg-tertiary)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 500, transition: 'all 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-secondary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      {color ? (
        <span style={{ width: compact ? 12 : 10, height: compact ? 12 : 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      ) : Icon ? (
        <Icon size={compact ? 18 : 15} style={{ flexShrink: 0, opacity: 0.7 }} />
      ) : null}
      {!compact && <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>}
      {!compact && count > 0 && (
        <span style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', background: active ? 'var(--bg-card)' : 'var(--bg-tertiary)', borderRadius: 99, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
          {count}
        </span>
      )}
      {compact && count > 0 && (
        <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--bg-primary)', background: 'var(--text-faint)', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {count}
        </span>
      )}
    </button>
  )
}

function SidebarCaption({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 700, color: 'var(--text-faint)', padding: '14px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  )
}

export default function TodoListPanel({ tripId, items, addItemSignal = 0 }: { tripId: number; items: TodoItem[]; addItemSignal?: number }) {
  // Layout component: state/effects/derived/handlers live in useTodoList.
  const {
    canEdit, t, formatDate, toggleTodoItem, reorderTodoItems,
    isMobile, filter, setFilter, selectedId, setSelectedId,
    isAddingNew, setIsAddingNew, sortByPrio, setSortByPrio, sortByDue, setSortByDue,
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
  const canReorder = canEdit && !sortByPrio && !sortByDue

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

  const selectFilter = (id: string) => setFilter(id as FilterType)
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // Filter title
  const filterTitle = (() => {
    if (filter === 'all') return t('todo.filter.all')
    if (filter === 'done') return t('todo.filter.done')
    if (filter === 'my') return t('todo.filter.my')
    if (filter === 'overdue') return t('todo.filter.overdue')
    return filter
  })()

  // One segment of the sort track in the list's head band; a second click on the
  // active one goes back to the manual order.
  const sortSegment = (active: boolean): CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: isMobile ? '0 9px' : '0 11px', borderRadius: 99,
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600,
    background: active ? 'var(--text-primary)' : 'transparent', color: active ? 'var(--bg-primary)' : 'var(--text-muted)',
    transition: 'all 0.12s',
  })

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 420 }}>

      {/* ── Left Sidebar ── */}
      <div style={{
        width: isMobile ? 52 : 220, flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        transition: 'width 0.2s',
      }}>
        {/* Progress card, the packing list's: done of all, the share, the bar */}
        {!isMobile && (
          <div style={{ margin: '0 0 8px', padding: '14px 16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{doneCount}</span>
                <span style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-faint)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>/{totalCount}</span>
              </span>
              <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden', marginTop: 12 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 6 }}>
              {doneCount} / {totalCount} {t('todo.completed')}
            </div>
          </div>
        )}

        {/* Smart filters */}
        {!isMobile && <SidebarCaption>{t('todo.sidebar.tasks')}</SidebarCaption>}
        <SidebarItem id="all" icon={Inbox} label={t('todo.filter.all')} count={items.filter(i => !i.checked).length} active={filter === 'all'} compact={isMobile} onSelect={selectFilter} />
        <SidebarItem id="my" icon={User} label={t('todo.filter.my')} count={myCount} active={filter === 'my'} compact={isMobile} onSelect={selectFilter} />
        <SidebarItem id="overdue" icon={AlertCircle} label={t('todo.filter.overdue')} count={overdueCount} active={filter === 'overdue'} compact={isMobile} onSelect={selectFilter} />
        <SidebarItem id="done" icon={CheckCheck} label={t('todo.filter.done')} count={doneCount} active={filter === 'done'} compact={isMobile} onSelect={selectFilter} />

        {/* Lists */}
        {!isMobile && <SidebarCaption>{t('todo.sidebar.categories')}</SidebarCaption>}
        {isMobile && <div style={{ height: 1, background: 'var(--border-faint)', margin: '8px 4px' }} />}
        {categories.map(cat => (
          <SidebarItem key={cat} id={cat} icon={null} label={cat} count={catCount(cat)} color={katColor(cat, categories)} active={filter === cat} compact={isMobile} onSelect={selectFilter} />
        ))}

        {canEdit && (
          <button type="button" onClick={() => setAddingCategory(true)}
            title={isMobile ? t('todo.addCategory') : undefined}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 0 : 6,
              margin: '6px 0 0', padding: isMobile ? '8px 0' : '8px 12px', borderRadius: 99, border: '1.5px dashed var(--border-primary)',
              fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-faint)', background: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            }}>
            <Plus size={isMobile ? 16 : 13} /> {!isMobile && t('todo.addCategory')}
          </button>
        )}
      </div>

      {/* ── Middle: the task list, as a card ── */}
      <div style={{ ...CARD, flex: 1, minWidth: 0 }}>
        <div style={HEAD_BAND}>
          <h2 style={{ margin: 0, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filterTitle}
          </h2>
          <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 99, padding: '2px 8px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {filtered.length}
          </span>
          <span style={{ flex: 1 }} />
          {/* Sort order: priority or due date, neither means the manual order */}
          <div role="group" aria-label={t('todo.sidebar.sortBy')} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 99, background: 'var(--bg-card)', flexShrink: 0 }}>
            <button type="button" aria-pressed={sortByPrio} title={t('todo.priority')} onClick={() => { setSortByDue(false); setSortByPrio(v => !v) }} style={sortSegment(sortByPrio)}>
              <Flag size={12} />{!isMobile && t('todo.priority')}
            </button>
            <button type="button" aria-pressed={sortByDue} title={t('todo.detail.dueDate')} onClick={() => { setSortByPrio(false); setSortByDue(v => !v) }} style={sortSegment(sortByDue)}>
              <Calendar size={12} />{!isMobile && t('todo.detail.dueDate')}
            </button>
          </div>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? <EmptyState scene="tasks" title={t('todo.empty')} /> : (
            filtered.map((item, index) => {
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
                    divider={index > 0}
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
                    <div style={{ padding: '0 16px 8px' }}><PluginCardFooter items={contributions} tripId={tripId} /></div>
                  )}
                </Fragment>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: Detail Pane ── */}
      {selectedItem && !isAddingNew && !isMobile && (
        <DetailPane item={selectedItem} tripId={tripId} categories={categories} members={members} onClose={() => setSelectedId(null)} />
      )}
      {selectedItem && !isAddingNew && isMobile && (
        <div role="presentation" onClick={e => { if (e.target === e.currentTarget) setSelectedId(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'var(--bottom-nav-h)' }}>
          <div style={{ width: '100%', maxHeight: '85vh', display: 'flex' }}>
            <DetailPane variant="sheet" item={selectedItem} tripId={tripId} categories={categories} members={members} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      )}
      {isAddingNew && !selectedItem && createPortal(
        <div role="presentation" onClick={e => { if (e.target === e.currentTarget) setIsAddingNew(false) }}
          className="trek-modal-backdrop"
          style={isMobile
            ? { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 'var(--bottom-nav-h)' }
            : { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 40 }}>
          <div style={isMobile
            ? { width: '100%', maxHeight: '85vh', display: 'flex' }
            : { width: 'min(520px, 92vw)', maxHeight: 'calc(100vh - var(--nav-h) - 120px)', display: 'flex', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', borderRadius: 16 }}>
            <NewTaskPane
              variant={isMobile ? 'sheet' : 'dialog'}
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

      <NameDialog
        open={canEdit && addingCategory}
        title={t('todo.addCategory')}
        placeholder={t('todo.newCategory')}
        confirmLabel={t('common.add')}
        value={newCategoryName}
        onChange={setNewCategoryName}
        onConfirm={addCategory}
        onClose={() => { setAddingCategory(false); setNewCategoryName('') }}
      />
    </div>
  )
}

type PaneVariant = 'side' | 'dialog' | 'sheet'

/** The pane's frame: a card beside the list, a dialog, or a sheet from the bottom on a phone. */
function paneFrame(variant: PaneVariant): CSSProperties {
  if (variant === 'side') return { ...CARD, width: 340, flexShrink: 0 }
  return { ...CARD, width: '100%', border: 'none', borderRadius: variant === 'sheet' ? '16px 16px 0 0' : 16 }
}

function PaneHead({ title, onClose, lead }: { title: string; onClose: () => void; lead?: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div style={HEAD_BAND}>
      {lead}
      <span style={{ flex: 1, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
      <button type="button" onClick={onClose} aria-label={t('common.close')} style={{ width: 28, height: 28, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'grid', placeItems: 'center' }}>
        <X size={16} />
      </button>
    </div>
  )
}

const nameFieldStyle: CSSProperties = {
  width: '100%', fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 600, border: 'none', padding: '2px 0',
  background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
}
const FORM_BODY: CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }
const FOOTER: CSSProperties = { padding: '12px 16px', borderTop: '1px solid var(--border-faint)', display: 'flex', gap: 8, flexShrink: 0, background: 'var(--bg-card)' }
const primaryButton = (enabled: boolean): CSSProperties => ({
  flex: 1, padding: '9px 16px', borderRadius: 10, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600,
  cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit', border: 'none',
  background: 'var(--accent)', color: 'var(--accent-text)', opacity: enabled ? 1 : 0.4, transition: 'opacity 0.15s',
})

// ── Detail Pane (right side) ──────────────────────────────────────────────

/** A task's editable fields as the form holds them: empty strings where the task has nothing. */
function fieldsOf(item: TodoItem): TaskFieldValues {
  return {
    desc: item.description || '', priority: item.priority || 0, category: item.category || '',
    dueDate: item.due_date || '', assignedUserId: item.assigned_user_id,
  }
}

function DetailPane({ item, tripId, categories, members, onClose, variant = 'side' }: {
  item: TodoItem; tripId: number; categories: string[]; members: Member[];
  onClose: () => void; variant?: PaneVariant;
}) {
  const { updateTodoItem, deleteTodoItem, toggleTodoItem } = useTripStore()
  const trip = useTripStore((s) => s.trip)
  const can = useCanDo()
  const canEdit = can('packing_edit', trip)
  const toast = useToast()
  const { t } = useTranslation()

  const [name, setName] = useState(item.name)
  const [fields, setFields] = useState<TaskFieldValues>(() => fieldsOf(item))
  const [saving, setSaving] = useState(false)

  // Sync when selected item changes
  useEffect(() => {
    setName(item.name)
    setFields({
      desc: item.description || '', priority: item.priority || 0, category: item.category || '',
      dueDate: item.due_date || '', assignedUserId: item.assigned_user_id,
    })
  }, [item.id, item.name, item.description, item.due_date, item.category, item.assigned_user_id, item.priority])

  const hasChanges = name !== item.name || fields.desc !== (item.description || '') ||
    fields.dueDate !== (item.due_date || '') || fields.category !== (item.category || '') ||
    fields.assignedUserId !== item.assigned_user_id || fields.priority !== (item.priority || 0)

  const save = async () => {
    if (!name.trim() || !hasChanges) return
    setSaving(true)
    try {
      await updateTodoItem(tripId, item.id, {
        name: name.trim(), description: fields.desc || null,
        due_date: fields.dueDate || null, category: fields.category || null,
        assigned_user_id: fields.assignedUserId, priority: fields.priority,
      })
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await deleteTodoItem(tripId, item.id)
      onClose()
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
  }

  const done = !!item.checked
  const doneBox = (
    <button type="button" onClick={() => canEdit && toggleTodoItem(tripId, item.id, !done)} aria-pressed={done} aria-label={t('todo.filter.done')} title={t('todo.filter.done')}
      style={{
        flexShrink: 0, cursor: canEdit ? 'pointer' : 'default', padding: 0, width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center',
        border: `1.5px solid ${done ? 'var(--accent)' : 'var(--text-faint)'}`, background: done ? 'var(--accent)' : 'transparent', color: 'var(--accent-text)',
      }}>
      <Check size={12} strokeWidth={3} style={{ opacity: done ? 1 : 0 }} />
    </button>
  )

  return (
    <div role="region" aria-label={t('todo.detail.title')} style={paneFrame(variant)}>
      <PaneHead title={t('todo.detail.title')} onClose={onClose} lead={doneBox} />

      <div style={FORM_BODY}>
        <input value={name} onChange={e => setName(e.target.value)} disabled={!canEdit}
          style={{ ...nameFieldStyle, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-faint)' : 'var(--text-primary)' }}
          placeholder={t('todo.namePlaceholder')} />
        <TodoTaskFields values={fields} onChange={patch => setFields(f => ({ ...f, ...patch }))} categories={categories} members={members} canEdit={canEdit} />
      </div>

      {/* Always in sight: the pane scrolls between its head and this foot. */}
      {canEdit && (
        <div style={FOOTER}>
          <button type="button" onClick={handleDelete}
            style={{
              padding: '9px 14px', borderRadius: 10, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
            <Trash2 size={13} />
            {t('todo.detail.delete')}
          </button>
          <button type="button" onClick={save} disabled={!hasChanges || saving} style={primaryButton(hasChanges && !saving)}>
            {saving ? '...' : t('todo.detail.save')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── New Task Pane (a dialog on a wide screen, a sheet on a phone) ─────────

function NewTaskPane({ tripId, categories, members, defaultCategory, onCreated, onClose, variant = 'dialog' }: {
  tripId: number; categories: string[]; members: Member[]; defaultCategory: string | null;
  onCreated: (id: number) => void; onClose: () => void; variant?: PaneVariant;
}) {
  const { addTodoItem } = useTripStore()
  const toast = useToast()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [fields, setFields] = useState<TaskFieldValues>({ desc: '', priority: 0, category: defaultCategory || '', dueDate: '', assignedUserId: null })
  const [saving, setSaving] = useState(false)

  const create = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const trimmedCategory = fields.category.trim()
      const item = await addTodoItem(tripId, {
        name: name.trim(), description: fields.desc || null, priority: fields.priority,
        due_date: fields.dueDate || null, category: trimmedCategory || null,
        assigned_user_id: fields.assignedUserId,
      })
      if (item?.id) onCreated(item.id)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.error')) }
    setSaving(false)
  }

  return (
    <div role="region" aria-label={t('todo.newItem')} style={paneFrame(variant)}>
      <PaneHead title={t('todo.newItem')} onClose={onClose} />

      <div style={FORM_BODY}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) create() }}
          style={{ ...taskInputStyle, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600 }}
          placeholder={t('todo.namePlaceholder')} />
        <TodoTaskFields values={fields} onChange={patch => setFields(f => ({ ...f, ...patch }))} categories={categories} members={members} />
      </div>

      <div style={FOOTER}>
        <button type="button" onClick={create} disabled={!name.trim() || saving} style={primaryButton(!!name.trim() && !saving)}>
          {saving ? '...' : t('todo.detail.create')}
        </button>
      </div>
    </div>
  )
}
