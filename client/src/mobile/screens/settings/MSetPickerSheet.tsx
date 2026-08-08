import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import MSheet from '../../components/MSheet'

export interface MSetPickerOption {
  value: string
  label: ReactNode
}

interface MSetPickerSheetProps {
  open: boolean
  onClose: () => void
  title: string
  options: MSetPickerOption[]
  value: string
  onSelect: (value: string) => void
}

/**
 * Bottom option picker for the settings select rows (currency, language, map
 * presets). Selecting closes the sheet.
 */
export default function MSetPickerSheet({ open, onClose, title, options, value, onSelect }: MSetPickerSheetProps) {
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" material="opaque" ariaLabel={title}>
      <div className="px-[14px] pb-2 pt-4 text-[0.875rem] font-extrabold text-m-ink">{title}</div>
      <div className="min-h-0 overflow-y-auto px-2 pb-3">
        {options.map((opt) => {
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
