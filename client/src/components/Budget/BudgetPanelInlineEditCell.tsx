import { useState, useEffect, useRef } from 'react'

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
    if (type === 'number') { const p = parseFloat(String(editValue).replace(',', '.')); v = isNaN(p) ? null : p }
    if (v !== value) onSave(v)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (type !== 'number') return
    e.preventDefault()
    let text = e.clipboardData.getData('text').trim()
    // Strip everything except digits, dots, commas, minus
    text = text.replace(/[^\d.,-]/g, '')
    // Remove all thousand separators (dots or commas before 3-digit groups), keep last separator as decimal
    const lastComma = text.lastIndexOf(',')
    const lastDot = text.lastIndexOf('.')
    const decimalPos = Math.max(lastComma, lastDot)
    if (decimalPos > -1) {
      const intPart = text.substring(0, decimalPos).replace(/[.,]/g, '')
      const decPart = text.substring(decimalPos + 1)
      text = intPart + '.' + decPart
    } else {
      text = text.replace(/[.,]/g, '')
    }
    setEditValue(text)
  }

  if (editing) {
    return <input ref={inputRef} type="text" inputMode={type === 'number' ? 'decimal' : 'text'} value={editValue}
      onChange={e => setEditValue(e.target.value)} onBlur={save} onPaste={handlePaste}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditValue(value ?? ''); setEditing(false) } }}
      style={{ width: '100%', border: '1px solid var(--accent)', borderRadius: 4, padding: '4px 6px', fontSize: 13, outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', ...style }}
      placeholder={placeholder} />
  }

  const display = type === 'number' && value != null
    ? Number(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (value || '')

  return (
    <div onClick={() => { if (readOnly) return; setEditValue(value ?? ''); setEditing(true) }} title={readOnly ? undefined : editTooltip}
      style={{ cursor: readOnly ? 'default' : 'pointer', padding: '2px 4px', borderRadius: 4, minHeight: 22, display: 'flex', alignItems: 'center',
        justifyContent: style?.textAlign === 'center' ? 'center' : 'flex-start', transition: 'background 0.15s',
        color: display ? 'var(--text-primary)' : 'var(--text-faint)', fontSize: 13, ...style }}
      onMouseEnter={e => { if (!readOnly) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!readOnly) e.currentTarget.style.background = 'transparent' }}>
      {display || placeholder || '-'}
    </div>
  )
}
