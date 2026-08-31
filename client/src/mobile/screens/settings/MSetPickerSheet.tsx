import { ReactNode, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import MSheet from '../../components/MSheet'

export interface MSetPickerOption {
  value: string
  label: ReactNode
  isHeader?: boolean
  searchLabel?: string
  groupLabel?: string
}

interface MSetPickerSheetProps {
  open: boolean
  onClose: () => void
  title: string
  options: MSetPickerOption[]
  value: string
  onSelect: (value: string) => void
  searchable?: boolean
}

/**
 * Bottom option picker for the settings select rows (currency, language, map
 * presets). Selecting closes the sheet.
 */
export default function MSetPickerSheet({ open, onClose, title, options, value, onSelect, searchable = false }: MSetPickerSheetProps) {
  const [search, setSearch] = useState('')
  useEffect(() => { if (open) setSearch('') }, [open])
  const filtered = searchable && search
    ? (() => {
        const q = search.toLowerCase()
        const result: MSetPickerOption[] = []
        let currentHeader: MSetPickerOption | null = null
        let headerAdded = false
        for (const option of options) {
          if (option.isHeader) { currentHeader = option; headerAdded = false; continue }
          const haystack = [String(option.label), option.searchLabel, option.groupLabel].filter(Boolean).join(' ').toLowerCase()
          if (haystack.includes(q)) {
            if (currentHeader && !headerAdded) { result.push(currentHeader); headerAdded = true }
            result.push(option)
          }
        }
        return result
      })()
    : options
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" material="opaque" ariaLabel={title}>
      <div className="px-[14px] pb-2 pt-4 text-[0.875rem] font-extrabold text-m-ink">{title}</div>
      {searchable && (
        <div className="px-[10px] pb-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="…" className="w-full rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-2 text-[0.8125rem] text-m-ink outline-none" />
        </div>
      )}
      <div className="min-h-0 overflow-y-auto px-2 pb-3">
        {filtered.map((opt) => {
          if (opt.isHeader) return <div key={opt.value} className="px-3 pb-1 pt-3 text-[0.625rem] font-bold uppercase tracking-[.08em] text-m-faint">{opt.label}</div>
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value)
                onClose()
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-[11px] text-left text-[0.8125rem] ${
                active ? 'bg-[color:var(--m-ic)] font-bold' : 'font-semibold'
              } text-m-ink`}
            >
              <span className="min-w-0 flex-1">{opt.label}</span>
              {active && <Check size={14} strokeWidth={2.5} className="flex-none" />}
            </button>
          )
        })}
      </div>
    </MSheet>
  )
}
