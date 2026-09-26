import type { CSSProperties } from 'react'
import { Check, ChevronRight, Flag, Calendar, GripVertical, UserRound } from 'lucide-react'
import { avatarSrc } from '../../utils/avatarSrc'
import type { TodoItem } from '../../types'
import { katColor, PRIO_CONFIG, type Member } from './todoListModel'

/** A quiet pill for the row's facts: filled, no frame, the packing list's badge. */
const badge: CSSProperties = {
  fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 8px', borderRadius: 99, fontWeight: 600,
  color: 'var(--text-muted)', background: 'var(--bg-tertiary)',
}

/** A single task row in the todo list. Pure presentation; all behaviour is
 *  delegated to onSelect/onToggle so TodoListPanel stays a layout component. */
export default function TodoRow({ item, members, categories, today, isSelected, canEdit, formatDate, onSelect, onToggle, divider = false, drag }: {
  item: TodoItem
  members: Member[]
  categories: string[]
  today: string
  isSelected: boolean
  canEdit: boolean
  formatDate: (d: string) => string
  onSelect: (id: number | null) => void
  onToggle: (id: number, checked: boolean) => void
  /** Draws the hairline above the row; the list leaves it off its first row. */
  divider?: boolean
  // Drag-to-reorder (#969); only provided when manual ordering is active.
  drag?: {
    isDragging: boolean
    isOver: boolean
    onStart: (id: number) => void
    onOver: (id: number) => void
    onEnd: () => void
    onDrop: (targetId: number) => void
  }
}) {
  const done = !!item.checked
  const assignedUser = members.find(m => m.id === item.assigned_user_id)
  const isOverdue = item.due_date && !done && item.due_date < today
  const catColor = item.category ? katColor(item.category, categories) : null
  const canDrag = canEdit && !!drag
  const prio = item.priority > 0 ? PRIO_CONFIG[item.priority] : undefined

  return (
    <div key={item.id}
      // Selecting the task has no other trigger, so the row is the control. Its
      // checkbox and its drag handle answer for themselves, hence the key handler
      // only fires when the row itself has focus.
      role="button"
      // Opt out of the global :active press-scale: shrinking the row-wide button
      // slides the checkbox out from under the pointer mid-click, so the click
      // retargets onto the row and opens the detail pane instead (#2158).
      data-no-press
      tabIndex={0}
      onClick={() => onSelect(isSelected ? null : item.id)}
      onKeyDown={e => {
        if (e.target !== e.currentTarget) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onSelect(isSelected ? null : item.id)
      }}
      onDragOver={canDrag ? (e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; drag!.onOver(item.id) }) : undefined}
      onDragLeave={canDrag ? (e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) drag!.onOver(-1) }) : undefined}
      onDrop={canDrag ? (e => { e.preventDefault(); e.stopPropagation(); drag!.onDrop(item.id) }) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', position: 'relative',
        borderTop: divider ? '1px solid var(--border-faint)' : 'none', cursor: 'pointer',
        background: isSelected ? 'var(--bg-secondary)' : 'transparent',
        boxShadow: drag?.isOver ? 'inset 3px 0 0 0 var(--accent)' : isSelected ? 'inset 3px 0 0 0 var(--text-primary)' : 'none',
        opacity: drag?.isDragging ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>

      {canDrag && (
        <div
          // Dragging is the handle's whole job; the click only keeps the row from
          // selecting, so the handle stays presentational.
          role="presentation"
          draggable
          onClick={e => e.stopPropagation()}
          onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; drag!.onStart(item.id) }}
          onDragEnd={() => drag!.onEnd()}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-faint)', flexShrink: 0, marginLeft: -4, opacity: 0.6 }}
        >
          <GripVertical size={13} />
        </div>
      )}

      {/* The packing list's box: filled with the accent once done, an outline until then. */}
      <button type="button" onClick={e => { e.stopPropagation(); if (canEdit) onToggle(item.id, !done) }}
        aria-pressed={done}
        style={{
          flexShrink: 0, cursor: canEdit ? 'pointer' : 'default', padding: 0, width: 20, height: 20, borderRadius: 6,
          display: 'grid', placeItems: 'center',
          border: `1.5px solid ${done ? 'var(--accent)' : 'var(--text-faint)'}`,
          background: done ? 'var(--accent)' : 'transparent', color: 'var(--accent-text)',
          transition: 'background 180ms ease, border-color 180ms ease',
        }}>
        <Check size={12} strokeWidth={3} style={{ opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.5)', transition: 'opacity 180ms ease, transform 200ms ease' }} />
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, color: done ? 'var(--text-faint)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {/* Description preview */}
        {item.description && (
          <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
            {item.description}
          </div>
        )}
        {/* Priority, date and list as quiet badges */}
        {!!(prio || item.due_date || catColor) && (
        <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
          {prio && (
            <span style={{ ...badge, color: prio.color, background: `color-mix(in srgb, ${prio.color} 12%, transparent)` }}>
              <Flag size={9} />{prio.label}
            </span>
          )}
          {item.due_date && (
            <span style={{
              ...badge,
              color: isOverdue ? '#ef4444' : 'var(--text-muted)',
              background: isOverdue ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
            }}>
              <Calendar size={9} />{formatDate(item.due_date)}
            </span>
          )}
          {catColor && (
            <span style={badge}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
              {item.category}
            </span>
          )}
        </div>
        )}
      </div>

      {/* Who does it, as an avatar: the name is its tooltip and label. */}
      {assignedUser && (
        <span title={assignedUser.username} aria-label={assignedUser.username}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          {assignedUser.avatar ? (
            <img src={avatarSrc(assignedUser.avatar)!} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          ) : (
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', fontWeight: 700 }}>
              {assignedUser.username.charAt(0).toUpperCase()}
            </span>
          )}
          {assignedUser.is_guest && <UserRound size={11} style={{ color: 'var(--text-faint)' }} />}
        </span>
      )}

      <ChevronRight size={15} color="var(--text-faint)" style={{ flexShrink: 0, opacity: isSelected ? 0.8 : 0.35 }} />
    </div>
  )
}
