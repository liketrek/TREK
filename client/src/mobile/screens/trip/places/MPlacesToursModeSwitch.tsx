import { MapPin, Mountain } from 'lucide-react'
import { useTranslation } from '../../../../i18n/TranslationContext'

interface MPlacesToursModeSwitchProps {
  active: boolean
  onChange: (tours: boolean) => void
  /** Its place in the row it sits in; by default a row of its own above the filters. */
  className?: string
}

/** Mobile counterpart of PlacesToursModeSwitch: top-level "Places <-> Tours"
 *  switch of the places browser, with m-token styling to match the browser chrome. */
export default function MPlacesToursModeSwitch({ active, onChange, className = 'mb-3' }: MPlacesToursModeSwitchProps) {
  const { t } = useTranslation()
  const options: [boolean, string, typeof MapPin][] = [
    [false, t('tours.mode.places'), MapPin],
    [true, t('tours.mode.tours'), Mountain],
  ]
  return (
    <div
      role="tablist"
      aria-label={t('tours.mode.label')}
      className={`flex gap-1 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-1 ${className}`}
    >
      {options.map(([value, label, Icon]) => {
        const selected = active === value
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(value)}
            className={`flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-[0.78125rem] transition-colors ${
              selected ? 'bg-m-card font-semibold text-m-ink shadow-sm' : 'font-medium text-m-muted'
            }`}
          >
            <Icon size={14} strokeWidth={1.8} aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
