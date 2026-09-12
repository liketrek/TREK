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
      className="mx-3.5 mb-0 mt-3 flex gap-1 rounded-xl border border-edge-faint bg-surface-tertiary p-1"
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
            // Sized off the day plan's own type, like the road trip rail below it: the
            // switcher sits above both, so it cannot be the largest thing in the column.
            style={{ fontSize: 'calc(11.5px * var(--fs-scale-body, 1))' }}
            className={`flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 transition-colors ${
              selected
                ? 'bg-surface-card font-semibold text-content shadow-card'
                : 'font-medium text-content-muted hover:bg-surface-hover hover:text-content'
            }`}
          >
            <Icon size={13} strokeWidth={1.8} aria-hidden />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
