import React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { DROPDOWN_LIST, DROPDOWN_ROW, DROPDOWN_TRIGGER, useDropdown } from './railDropdown'
import { FS } from './typeScale'

interface RoadtripDayPickerProps {
  days: readonly { dayId: number; dayNumber: number }[]
  /** The picked day's id, as the corridor keeps it. */
  value: string
  onChange: (dayId: string) => void
}

/**
 * The day whose drive the corridor searches along, in the same dropdown as what it looks
 * for and on the same line, so the question reads as one: these kinds, along this day.
 * Each day leads with its number where a kind leads with its icon.
 */
export default function RoadtripDayPicker({ days, value, onChange }: RoadtripDayPickerProps): React.ReactElement {
  const { t } = useTranslation()
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>()
  const current = days.find(d => String(d.dayId) === value)

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{ fontSize: FS.control }}
        className={DROPDOWN_TRIGGER}
      >
        <span className="whitespace-nowrap font-medium text-content">
          {current ? t('roadtrip.day', { number: current.dayNumber }) : null}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div role="listbox" className={`${DROPDOWN_LIST} end-0 max-h-[18rem] overflow-y-auto`}>
          {days.map(day => {
            const on = String(day.dayId) === value
            return (
              <button
                key={day.dayId}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => { onChange(String(day.dayId)); setOpen(false) }}
                style={{ fontSize: FS.control }}
                className={DROPDOWN_ROW}
              >
                <span
                  className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] bg-surface-tertiary font-semibold tabular-nums text-content-secondary"
                  style={{ fontSize: FS.label }}
                >
                  {day.dayNumber}
                </span>
                <span className={`min-w-0 flex-1 truncate pe-4 ${on ? 'font-semibold text-content' : 'font-medium text-content-secondary'}`}>
                  {t('roadtrip.day', { number: day.dayNumber })}
                </span>
                {on ? <Check size={14} strokeWidth={2.4} className="shrink-0 text-content" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
