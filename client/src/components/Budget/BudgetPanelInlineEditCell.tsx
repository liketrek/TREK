import { useState, useEffect, useRef } from 'react'
import { normalizePastedAmount } from './BudgetPanel.helpers'

interface InlineEditCellProps {
  value: string | number | null | undefined
  onSave: (value: string | number | null) => void
  type?: 'text' | 'number'
  style?: React.CSSProperties
  placeholder?: string
  decimals?: number
  locale: string
  editTooltip?: string
  readOnly?: boolean
}

export default function InlineEditCell({ value, onSave, type = 'text', style = {} as React.CSSProperties, placeholder = '', decimals = 2, locale, editTooltip, readOnly = false }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | number>(value ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])

  const save = () => {
    setEditing(false)
    let v: string | number | null = editValue
    if (type === 'number') { const p = Number.parseFloat(String(editValue).replace(',', '.')); v = Number.isNaN(p) ? null : p }
    if (v !== value) onSave(v)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (type !== 'number') return
    e.preventDefault()
    setEditValue(normalizePastedAmount(e.clipboardData.getData('text')))
  }

  if (editing) {
    return <input ref={inputRef} type="text" inputMode={type === 'number' ? 'decimal' : 'text'} value={editValue}
      onChange={e => setEditValue(e.target.value)} onBlur={save} onPaste={handlePaste}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditValue(value ?? ''); setEditing(false) } }}
      style={{ width: '100%', border: '1px solid var(--accent)', borderRadius: 4, padding: '4px 6px', fontSize: 'calc(13px * var(--fs-scale-body, 1))', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', ...style }}
      placeholder={placeholder} />
  }

  const display = type === 'number' && value != null
    ? Number(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (value || '')

  // Editable cells are real buttons so they can be tabbed to and pressed. A
  // read-only cell renders no control at all rather than a disabled one: it is
  // plain text, and a disabled button would be announced as an unavailable
  // control that never becomes available. Same split the member chips use.
  const cellStyle: React.CSSProperties = {
    padding: '2px 4px', borderRadius: 4, minHeight: 22, display: 'flex', alignItems: 'center',
    justifyContent: style?.textAlign === 'center' ? 'center' : 'flex-start', transition: 'background 0.15s',
    color: display ? 'var(--text-primary)' : 'var(--text-faint)', fontSize: 'calc(13px * var(--fs-scale-body, 1))',
    width: '100%', textAlign: 'left', ...style,
  }
  const content = display || placeholder || '-'

  if (readOnly) return <div style={{ ...cellStyle, cursor: 'default' }}>{content}</div>

  return (
    <button type="button"
      onClick={() => { setEditValue(value ?? ''); setEditing(true) }} title={editTooltip}
      style={{ ...cellStyle, cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      {content}
    </button>
  )
}
