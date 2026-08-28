import React from 'react'
import { CalendarDays, Route } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'

interface RoadtripModeSwitchProps {
  active: boolean
  onChange: (roadtrip: boolean) => void
}

/**
 * Switches the plan view's left rail between the day plan and the road trip reading of
 * the same trip. Only rendered while the road trip addon is on, so a trip that isn't
 * driven anywhere never grows a control it has no use for.
 */
export default function RoadtripModeSwitch({ active, onChange }: RoadtripModeSwitchProps): React.ReactElement {
  const { t } = useTranslation()
  const options: [boolean, string, typeof Route][] = [
    [false, t('roadtrip.mode.days'), CalendarDays],
    [true, t('roadtrip.mode.roadtrip'), Route],
  ]
  return (
    <div
      role="tablist"
      aria-label={t('roadtrip.mode.label')}
      className="flex gap-1 mx-3 mt-3 mb-1 p-1 rounded-xl bg-surface-tertiary border border-edge-faint"
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
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-caption font-medium transition-colors ${
              selected ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'
            }`}
          >
            <Icon size={13} aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
