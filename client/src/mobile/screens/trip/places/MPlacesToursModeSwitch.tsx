import { MapPin, Mountain } from 'lucide-react'
import { useTranslation } from '../../../../i18n/TranslationContext'

interface MPlacesToursModeSwitchProps {
  active: boolean
  onChange: (tours: boolean) => void
}

/** Mobile counterpart of PlacesToursModeSwitch: top-level "Places <-> Tours"
 *  switch of the places browser, with m-token styling to match the browser chrome. */
export default function MPlacesToursModeSwitch({ active, onChange }: MPlacesToursModeSwitchProps) {
  const { t } = useTranslation()
  const options: [boolean, string, typeof MapPin][] = [
    [false, t('tours.mode.places'), MapPin],
    [true, t('tours.mode.tours'), Mountain],
  ]
  return (
    <div
      role="tablist"
      aria-label={t('tours.mode.label')}
      className="mb-3 flex gap-1 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-1"
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
