import { useEffect, useRef, useState } from 'react'
import { Check, Flag, Plus, User } from 'lucide-react'
import type { TodoCreateItemRequest, TodoUpdateItemRequest } from '@trek/shared'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import { avatarSrc } from '../../../../utils/avatarSrc'
import type { TodoItem, TripMember } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { PRIORITY_COLOR, PRIORITY_LABEL, PRIORITY_LEVELS } from './listsModel'

export interface MTaskSheetProps {
  planner: TripPlanner
  open: boolean
  /** null = create a new task; a live id re-derives the row each render (WebSocket-safe). */
  itemId: number | null
  categories: string[]
  members: TripMember[]
  defaultCategory?: string | null
  onClose: () => void
}

/** Payload shape covering both create and update — the update schema allows
 * clearing a field with `null`, which `TodoUpdateItemRequest` itself (typed
 * against the create request) doesn't express; the store call below is cast
 * to it rather than widened to `any`. */
interface TodoSavePayload {
  name: string
  description: string | null
  due_date: string | null
  category: string | null
  assigned_user_id: number | null
  priority: number
}

/**
 * Add/Edit task sheet (spec 03 §4.7 `openTask` / progress-card "New task"):
 * name, description, list (category), due date, assignee and priority.
 */
export default function MTaskSheet({ planner, open, itemId, categories, members, defaultCategory, onClose }: MTaskSheetProps) {
  const { t, toast, tripId, tripActions } = planner

  const liveItem = itemId != null ? planner.todoItems.find(i => i.id === itemId) ?? null : null
  const heldRef = useRef<TodoItem | null>(null)
  if (liveItem) heldRef.current = liveItem
  const item = itemId != null ? (liveItem ?? heldRef.current) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null)
  const [priority, setPriority] = useState(0)
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (item) {
      setName(item.name)
      setDescription(item.description || '')
      setDueDate(item.due_date || '')
      setCategory(item.category || '')
      setAssignedUserId(item.assigned_user_id)
      setPriority(item.priority || 0)
    } else {
      setName('')
      setDescription('')
      setDueDate('')
      setCategory(defaultCategory || '')
      setAssignedUserId(null)
      setPriority(0)
    }
    setAddingCategory(false)
    setCategoryDraft('')
  }, [open, item, defaultCategory])

  const confirmCategory = () => {
    const trimmed = categoryDraft.trim()
    if (trimmed) setCategory(trimmed)
    setCategoryDraft('')
    setAddingCategory(false)
  }

  const handleDelete = async () => {
    if (!item) return
    try {
      await tripActions.deleteTodoItem(tripId, item.id)
      onClose()
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName || saving) return
    setSaving(true)
    try {
      if (item) {
        const payload: TodoSavePayload = {
          name: trimmedName,
          description: description || null,
          due_date: dueDate || null,
          category: category || null,
          assigned_user_id: assignedUserId,
          priority,
        }
        await tripActions.updateTodoItem(tripId, item.id, payload as unknown as TodoUpdateItemRequest)
      } else {
        const payload: TodoCreateItemRequest = {
          name: trimmedName,
          description: description || undefined,
          due_date: dueDate || undefined,
          category: category || undefined,
          assigned_user_id: assignedUserId ?? undefined,
          priority,
        }
        await tripActions.addTodoItem(tripId, payload)
      }
      onClose()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const pillCls = (active: boolean) =>
    `flex flex-none items-center gap-[5px] rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
      active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
    }`

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={item ? t('todo.detail.title') : t('todo.newItem')}>
      <FormSheetHeader title={item ? t('todo.detail.title') : t('todo.newItem')} onClose={onClose} closeLabel={t('common.close')} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('todo.namePlaceholder')}
          className={`${FIELD_CLS} text-[0.9375rem] font-bold`}
        />

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('todo.detail.description')}</Eyebrow>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder={t('todo.descriptionPlaceholder')}
          className={FIELD_AREA_CLS}
        />

        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('todo.detail.priority')}</Eyebrow>
        <div className="flex gap-[6px]">
          {PRIORITY_LEVELS.map(p => {
            const active = priority === p
            const color = PRIORITY_COLOR[p]
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full py-[7px] text-[0.71875rem] font-bold ${
                  active ? (color ? '' : 'text-m-ink') : 'text-m-faint'
                }`}
                style={active && color ? { background: `color-mix(in srgb, ${color} 16%, transparent)`, color } : undefined}
              >
                {p === 0
                  ? t('todo.detail.noPriority')
                  : <>
                      <Flag size={10} strokeWidth={2.4} />
                      {PRIORITY_LABEL[p]}
                    </>}
              </button>
            )
          })}
        </div>

        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('todo.detail.category')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          <button type="button" onClick={() => setCategory('')} className={pillCls(category === '')}>
            {t('todo.noCategory')}
          </button>
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => setCategory(cat)} className={pillCls(category === cat)}>
              {cat}
            </button>
          ))}
          {category && !categories.includes(category) && (
            <button type="button" onClick={() => setCategory(category)} className={pillCls(true)}>
              {category}
            </button>
          )}
          {!addingCategory ? (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="flex flex-none items-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-trackoff)] px-[11px] py-[6px] text-[0.71875rem] font-semibold text-m-muted"
            >
              <Plus size={12} strokeWidth={2.2} />
              {t('todo.addCategory')}
            </button>
          ) : (
            <div className="mt-1 flex w-full items-center gap-2">
              <input
                type="text"
                autoFocus
                value={categoryDraft}
                onChange={e => setCategoryDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmCategory() }
                  if (e.key === 'Escape') { setAddingCategory(false); setCategoryDraft('') }
                }}
                placeholder={t('todo.newCategory')}
                className={`${FIELD_CLS} flex-1`}
              />
              <button
                type="button"
                onClick={confirmCategory}
                disabled={!categoryDraft.trim()}
                aria-label={t('common.add')}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('todo.detail.dueDate')}</Eyebrow>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} aria-label={t('todo.detail.dueDate')} className={FIELD_CLS} />

        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('todo.detail.assignedTo')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          <button type="button" onClick={() => setAssignedUserId(null)} className={pillCls(assignedUserId == null)}>
            <User size={12} strokeWidth={2.2} />
            {t('todo.unassigned')}
          </button>
          {members.map(m => {
            const active = assignedUserId === m.id
            const src = m.avatar_url || avatarSrc(m.avatar)
            return (
              <button key={m.id} type="button" onClick={() => setAssignedUserId(m.id)} className={pillCls(active)}>
                <span className="flex h-4 w-4 flex-none items-center justify-center overflow-hidden rounded-full bg-m-act text-[0.5rem] font-bold text-m-actfg">
                  {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : m.username[0]?.toUpperCase()}
                </span>
                {m.username}
              </button>
            )
          })}
        </div>
      </div>

      <FormSheetFooter
        onDelete={item ? handleDelete : undefined}
        deleteLabel={t('todo.detail.delete')}
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSave}
        submitLabel={item ? t('todo.detail.save') : t('todo.detail.create')}
        submitDisabled={!name.trim() || saving}
      />
    </MSheet>
  )
}
