import React from 'react'
import { MapPin, Mountain } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'

interface PlacesToursModeSwitchProps {
  active: boolean
  onChange: (tours: boolean) => void
}

/**
 * Switches the right add-panel between the ordinary Places sidebar and the
 * Tours selection list. Top level of the panel, mirroring RoadtripModeSwitch
 * (Days <-> Roadtrip), using the same placement and addon gating convention.
 * Only rendered while the tours addon is on.
 */
export default function PlacesToursModeSwitch({ active, onChange }: PlacesToursModeSwitchProps): React.ReactElement {
  const { t } = useTranslation()
  const options: [boolean, string, typeof MapPin][] = [
    [false, t('tours.mode.places'), MapPin],
    [true, t('tours.mode.tours'), Mountain],
  ]
  return (
    <div className="flex-none px-3 pb-0.5 pt-2.5" style={{ background: NEUTRAL_TINT }}>
      <div role="tablist" aria-label={t('tours.mode.label')} className="flex w-full gap-0.5 rounded-[10px] bg-surface-tertiary p-[3px]">
        {options.map(([value, label, Icon]) => {
          const selected = active === value
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(value)}
              style={fs(12.5, 'body')}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 py-1.5 font-medium transition-colors ${
                selected ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'
              }`}
            >
              <Icon size={13} strokeWidth={2} aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
