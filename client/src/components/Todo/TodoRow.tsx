import { CheckSquare, Square, ChevronRight, Flag, Calendar, GripVertical, UserRound } from 'lucide-react'
import { avatarSrc } from '../../utils/avatarSrc'
import type { TodoItem } from '../../types'
import { katColor, PRIO_CONFIG, type Member } from './todoListModel'

/** A single task row in the todo list. Pure presentation; all behaviour is
 *  delegated to onSelect/onToggle so TodoListPanel stays a layout component. */
export default function TodoRow({ item, members, categories, today, isSelected, canEdit, formatDate, onSelect, onToggle, drag }: {
  item: TodoItem
  members: Member[]
  categories: string[]
  today: string
  isSelected: boolean
  canEdit: boolean
  formatDate: (d: string) => string
  onSelect: (id: number | null) => void
  onToggle: (id: number, checked: boolean) => void
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

  return (
    <div key={item.id}
      onClick={() => onSelect(isSelected ? null : item.id)}
      onDragOver={canDrag ? (e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; drag!.onOver(item.id) }) : undefined}
      onDragLeave={canDrag ? (e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) drag!.onOver(-1) }) : undefined}
      onDrop={canDrag ? (e => { e.preventDefault(); e.stopPropagation(); drag!.onDrop(item.id) }) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        borderBottom: '1px solid var(--border-faint)', cursor: 'pointer',
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        opacity: drag?.isDragging ? 0.4 : 1,
        boxShadow: drag?.isOver ? 'inset 3px 0 0 0 var(--accent)' : 'none',
        transition: 'background 0.1s, opacity 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>

      {canDrag && (
        <div
          draggable
          onClick={e => e.stopPropagation()}
          onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; drag!.onStart(item.id) }}
          onDragEnd={() => drag!.onEnd()}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-faint)', flexShrink: 0, marginLeft: -6 }}
        >
          <GripVertical size={14} />
        </div>
      )}

      {/* Checkbox */}
      <button onClick={e => { e.stopPropagation(); if (canEdit) onToggle(item.id, !done) }}
        style={{ background: 'none', border: 'none', cursor: canEdit ? 'pointer' : 'default', padding: 0, flexShrink: 0,
          color: done ? '#22c55e' : 'var(--border-primary)' }}>
        {done ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'calc(14px * var(--fs-scale-body, 1))', color: done ? 'var(--text-faint)' : 'var(--text-primary)',
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
        {/* Inline badges */}
        {(item.priority || item.due_date || catColor || assignedUser) && (
        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          {item.priority > 0 && PRIO_CONFIG[item.priority] && (
            <span style={{
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 5, fontWeight: 600,
              color: PRIO_CONFIG[item.priority].color,
              background: `${PRIO_CONFIG[item.priority].color}10`,
              border: `1px solid ${PRIO_CONFIG[item.priority].color}25`,
            }}>
              <Flag size={9} />{PRIO_CONFIG[item.priority].label}
            </span>
          )}
          {item.due_date && (
            <span style={{
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 5, fontWeight: 500,
              color: isOverdue ? '#ef4444' : 'var(--text-secondary)',
              background: isOverdue ? 'rgba(239,68,68,0.08)' : 'var(--bg-hover)',
              border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.15)' : 'var(--border-faint)'}`,
            }}>
              <Calendar size={9} />{formatDate(item.due_date)}
            </span>
          )}
          {catColor && (
            <span style={{
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: 5, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'var(--bg-hover)',
              border: '1px solid var(--border-faint)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
              {item.category}
            </span>
          )}
          {assignedUser && (
            <span style={{
              fontSize: 'calc(10px * var(--fs-scale-caption, 1))', display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: 5, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'var(--bg-hover)',
              border: '1px solid var(--border-faint)',
            }}>
              {assignedUser.avatar ? (
                <img src={avatarSrc(assignedUser.avatar)!} style={{ width: 13, height: 13, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              ) : (
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--border-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(7px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 700 }}>
                  {assignedUser.username.charAt(0).toUpperCase()}
                </span>
              )}
              {assignedUser.is_guest && <UserRound size={11} style={{ opacity: 0.7 }} />}
              {assignedUser.username}
            </span>
          )}
        </div>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={16} color="var(--text-faint)" style={{ flexShrink: 0, opacity: 0.4 }} />
    </div>
  )
}
