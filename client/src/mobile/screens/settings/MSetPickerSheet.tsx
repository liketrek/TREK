import { ReactNode } from 'react'
import { Check } from 'lucide-react'
import MSheet from '../../components/MSheet'
import { TileHeader } from '../trip/sheets/MTripSheetUi'
import { useTranslation } from '../../../i18n'

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
  const { t } = useTranslation()
  const closeLabel = t('common.close')
  return (
    <MSheet open={open} onClose={onClose} variant="bottom" material="glass" ariaLabel={title}>
      <div className="flex-none px-[18px] pt-4">
        <TileHeader title={title} onClose={onClose} closeLabel={closeLabel} />
      </div>
      <div className="m-scroll-fade mt-1 min-h-0 overflow-y-auto px-2 pb-3 pt-2">
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
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-[11px] text-start text-[0.8125rem] ${
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
