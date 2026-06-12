import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'

interface AddItemRowProps {
  onAdd: (data: { name: string; total_price: number; persons: number | null; days: number | null; note: string | null; expense_date: string | null }) => void
  t: (key: string) => string
}

export default function AddItemRow({ onAdd, t }: AddItemRowProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [persons, setPersons] = useState('')
  const [days, setDays] = useState('')
  const [note, setNote] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), total_price: parseFloat(String(price).replace(',', '.')) || 0, persons: parseInt(persons) || null, days: parseInt(days) || null, note: note.trim() || null, expense_date: expenseDate || null })
    setName(''); setPrice(''); setPersons(''); setDays(''); setNote(''); setExpenseDate('')
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const inp = { border: '1px solid var(--border-primary)', borderRadius: 4, padding: '4px 6px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', background: 'var(--bg-input)', color: 'var(--text-primary)' }

  return (
    <tr className="bg-surface-secondary">
      <td style={{ padding: '4px 6px' }}>
        <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={t('budget.newEntry')} style={inp} />
      </td>
      <td style={{ padding: '4px 6px' }}>
        <input value={price} onChange={e => setPrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          onPaste={e => { e.preventDefault(); let t = e.clipboardData.getData('text').trim().replace(/[^\d.,-]/g, ''); const lc = t.lastIndexOf(','), ld = t.lastIndexOf('.'), dp = Math.max(lc, ld); if (dp > -1) { t = t.substring(0, dp).replace(/[.,]/g, '') + '.' + t.substring(dp + 1) } else { t = t.replace(/[.,]/g, '') } setPrice(t) }}
          placeholder="0,00" inputMode="decimal" style={{ ...inp, textAlign: 'center' }} />
      </td>
      <td className="hidden sm:table-cell" style={{ padding: '4px 6px', textAlign: 'center' }}>
        <input value={persons} onChange={e => setPersons(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="-" inputMode="numeric" style={{ ...inp, textAlign: 'center', maxWidth: 60, margin: '0 auto' }} />
      </td>
      <td className="hidden sm:table-cell" style={{ padding: '4px 6px', textAlign: 'center' }}>
        <input value={days} onChange={e => setDays(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="-" inputMode="numeric" style={{ ...inp, textAlign: 'center', maxWidth: 60, margin: '0 auto' }} />
      </td>
      <td className="hidden md:table-cell text-content-faint" style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}>-</td>
      <td className="hidden md:table-cell text-content-faint" style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}>-</td>
      <td className="hidden lg:table-cell text-content-faint" style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}>-</td>
      <td className="hidden sm:table-cell" style={{ padding: '4px 6px', textAlign: 'center' }}>
        <div style={{ maxWidth: 90, margin: '0 auto' }}>
          <CustomDatePicker value={expenseDate} onChange={setExpenseDate} placeholder="-" compact />
        </div>
      </td>
      <td className="hidden sm:table-cell" style={{ padding: '4px 6px' }}>
        <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder={t('budget.table.note')} style={inp} />
      </td>
      <td style={{ padding: '4px 6px', textAlign: 'center' }}>
        <button onClick={handleAdd} disabled={!name.trim()} title={t('reservations.add')}
          style={{ background: name.trim() ? 'var(--text-primary)' : 'var(--border-primary)', border: 'none', borderRadius: 4, color: 'var(--bg-primary)',
            cursor: name.trim() ? 'pointer' : 'default', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}>
          <Plus size={14} />
        </button>
      </td>
    </tr>
  )
}
