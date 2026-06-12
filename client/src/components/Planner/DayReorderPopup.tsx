import { useState } from 'react'
import { GripVertical, ArrowUp, ArrowDown, Plus } from 'lucide-react'
import type { Day } from '../../types'

interface DayReorderPopupProps {
  days: Day[]
  t: (key: string, params?: Record<string, any>) => string
  locale: string
  onReorder: (orderedIds: number[]) => void
  onAddDay: () => void
  onClose: () => void
}

/**
 * Compact panel for moving whole days around: drag a row by its grip or use the
 * up/down arrows, and add a day at the end. Day headers stay untouched — this is
 * the single surface for ordering. Reorders are applied optimistically by the
 * store, so the list reflects each move immediately.
 */
export function DayReorderPopup({ days, t, locale, onReorder, onAddDay, onClose }: DayReorderPopupProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const ordered = [...days].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))

  const label = (day: Day, index: number) => {
    if (day.title) return day.title
    if (day.date) {
      const d = new Date(day.date + 'T00:00:00')
      return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    }
    return t('dayplan.dayN', { n: index + 1 })
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= ordered.length || from === to) return
    const ids = ordered.map(d => d.id)
    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)
    onReorder(ids)
  }

  const cellBtn = {
    display: 'grid', placeItems: 'center', width: 26, height: 26,
    border: '1px solid var(--border-faint)', borderRadius: 7,
    background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
  } as const

  return (
    <>
      {/* outside-click catcher */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 250 }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 251,
          width: 290, maxHeight: 360, display: 'flex', flexDirection: 'column',
          background: 'var(--bg-card, white)', color: 'var(--text-primary)',
          border: '1px solid var(--border-faint)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 12px 8px' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t('dayplan.reorderTitle')}</span>
          <button
            onClick={onAddDay}
            className="bg-accent text-accent-text"
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
              borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={13} strokeWidth={2} />
            {t('dayplan.addDay')}
          </button>
        </div>
        <div style={{ padding: '0 12px 8px', fontSize: 10.5, color: 'var(--text-faint)', lineHeight: 1.35 }}>
          {t('dayplan.reorderHint')}
        </div>

        <div className="scroll-container" style={{ overflowY: 'auto', padding: '0 8px 8px', minHeight: 0 }}>
          {ordered.map((day, index) => (
            <div
              key={day.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
              onDragOver={e => { e.preventDefault(); if (overIndex !== index) setOverIndex(index) }}
              onDrop={e => {
                e.preventDefault()
                if (dragIndex !== null && dragIndex !== index) move(dragIndex, index)
                setDragIndex(null); setOverIndex(null)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                borderRadius: 8, marginTop: 2,
                background: overIndex === index && dragIndex !== null && dragIndex !== index ? 'var(--bg-hover)' : 'transparent',
                opacity: dragIndex === index ? 0.5 : 1,
                outline: overIndex === index && dragIndex !== null && dragIndex !== index ? '2px dashed var(--border-primary)' : 'none',
                outlineOffset: -2,
              }}
            >
              <GripVertical size={14} strokeWidth={1.8} style={{ cursor: 'grab', color: 'var(--text-faint)', flexShrink: 0 }} />
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                background: 'var(--bg-hover)', color: 'var(--text-muted)',
                display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 700,
              }}>
                {index + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label(day, index)}
              </span>
              <button
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label={t('dayplan.moveUp')}
                style={{ ...cellBtn, opacity: index === 0 ? 0.35 : 1, cursor: index === 0 ? 'default' : 'pointer' }}
              >
                <ArrowUp size={13} strokeWidth={2} />
              </button>
              <button
                onClick={() => move(index, index + 1)}
                disabled={index === ordered.length - 1}
                aria-label={t('dayplan.moveDown')}
                style={{ ...cellBtn, opacity: index === ordered.length - 1 ? 0.35 : 1, cursor: index === ordered.length - 1 ? 'default' : 'pointer' }}
              >
                <ArrowDown size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
