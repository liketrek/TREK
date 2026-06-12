import { CheckSquare, Square, ChevronRight, Flag, Calendar } from 'lucide-react'
import type { TodoItem } from '../../types'
import { katColor, PRIO_CONFIG, type Member } from './todoListModel'

/** A single task row in the todo list. Pure presentation; all behaviour is
 *  delegated to onSelect/onToggle so TodoListPanel stays a layout component. */
export default function TodoRow({ item, members, categories, today, isSelected, canEdit, formatDate, onSelect, onToggle }: {
  item: TodoItem
  members: Member[]
  categories: string[]
  today: string
  isSelected: boolean
  canEdit: boolean
  formatDate: (d: string) => string
  onSelect: (id: number | null) => void
  onToggle: (id: number, checked: boolean) => void
}) {
  const done = !!item.checked
  const assignedUser = members.find(m => m.id === item.assigned_user_id)
  const isOverdue = item.due_date && !done && item.due_date < today
  const catColor = item.category ? katColor(item.category, categories) : null

  return (
    <div key={item.id}
      onClick={() => onSelect(isSelected ? null : item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        borderBottom: '1px solid var(--border-faint)', cursor: 'pointer',
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>

      {/* Checkbox */}
      <button onClick={e => { e.stopPropagation(); if (canEdit) onToggle(item.id, !done) }}
        style={{ background: 'none', border: 'none', cursor: canEdit ? 'pointer' : 'default', padding: 0, flexShrink: 0,
          color: done ? '#22c55e' : 'var(--border-primary)' }}>
        {done ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, color: done ? 'var(--text-faint)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {/* Description preview */}
        {item.description && (
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
            {item.description}
          </div>
        )}
        {/* Inline badges */}
        {(item.priority || item.due_date || catColor || assignedUser) && (
        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          {item.priority > 0 && PRIO_CONFIG[item.priority] && (
            <span style={{
              fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3,
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
              fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3,
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
              fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
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
              fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 7px', borderRadius: 5, fontWeight: 500,
              color: 'var(--text-secondary)', background: 'var(--bg-hover)',
              border: '1px solid var(--border-faint)',
            }}>
              {assignedUser.avatar ? (
                <img src={`/uploads/avatars/${assignedUser.avatar}`} style={{ width: 13, height: 13, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              ) : (
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--border-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: 'var(--text-faint)', fontWeight: 700 }}>
                  {assignedUser.username.charAt(0).toUpperCase()}
                </span>
              )}
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
