import { useState, useEffect } from 'react'

export function QuantityInput({ value, onSave }: { value: number; onSave: (qty: number) => void }) {
  const [local, setLocal] = useState(String(value))
  useEffect(() => setLocal(String(value)), [value])

  const commit = () => {
    const qty = Math.max(1, Math.min(999, Number(local) || 1))
    setLocal(String(qty))
    if (qty !== value) onSave(qty)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--border-primary)', borderRadius: 8, padding: '3px 6px', background: 'transparent', flexShrink: 0 }}>
      <input
        type="text" inputMode="numeric"
        value={local}
        onChange={e => setLocal(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur() } }}
        style={{ width: 24, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, textAlign: 'right', fontFamily: 'inherit', color: 'var(--text-secondary)', padding: 0 }}
      />
      <span style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 500 }}>x</span>
    </div>
  )
}
