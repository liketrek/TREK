import React from 'react'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { Tooltip } from '../shared/Tooltip'
import { DROPDOWN_LIST, DROPDOWN_ROW, DROPDOWN_TRIGGER, useDropdown } from './railDropdown'
import { serviceColor } from './roadtripModel'
import { FS } from './typeScale'

interface RoadtripCategoryPickerProps {
  /** Every kind the corridor can look for, in the order they are offered. */
  keys: readonly string[]
  meta: Record<string, { labelKey: string; Icon: LucideIcon }>
  selected: readonly string[]
  onToggle: (key: string) => void
}

/**
 * What to look for, as one line.
 *
 * Six pills wrapped onto three lines and took the height of the whole card for a set of
 * answers that rarely changes. Folded into a dropdown it is one line, and the space goes
 * to the results, which is what the column is actually for.
 *
 * Closed, it shows the picked kinds by their coloured icons alone, the same ones the rail
 * puts on its dashed line and the map puts on the route; the names are in the list and in
 * the tooltip. That leaves the line room for the day picker beside it.
 *
 * Multi-select, so it stays open on a click: picking "fuel and charging" is one gesture
 * rather than two round trips through a menu.
 */
export default function RoadtripCategoryPicker({ keys, meta, selected, onToggle }: RoadtripCategoryPickerProps): React.ReactElement {
  const { t } = useTranslation()
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>()

  const picked = keys.filter(k => selected.includes(k))
  // The kinds themselves rather than a count: "Fuel, Charging" is the answer, "2 kinds"
  // is a riddle. Read out and shown on hover, since the line only draws their icons.
  const names = picked.map(k => t(meta[k].labelKey)).join(', ')

  return (
    <div ref={ref} className="relative">
      <Tooltip label={names} disabled={open || !picked.length}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={picked.length ? `${t('roadtrip.poi.looking')}: ${names}` : undefined}
          style={{ fontSize: FS.control }}
          className={`${DROPDOWN_TRIGGER} w-full`}
        >
          {picked.length ? (
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {picked.map(k => {
                const Icon = meta[k].Icon
                return (
                  <span
                    key={k}
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md"
                    style={{ background: serviceColor(k), color: '#fff' }} // theme-lint-disable: road-signage palette
                  >
                    <Icon size={10} strokeWidth={2.2} aria-hidden />
                  </span>
                )
              })}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-content-faint">{t('roadtrip.poi.looking')}</span>
          )}
          <ChevronDown
            size={14}
            className={`shrink-0 text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </Tooltip>

      {open ? (
        <div role="listbox" aria-multiselectable className={`${DROPDOWN_LIST} start-0`}>
          {keys.map(key => {
            const { labelKey, Icon } = meta[key]
            const on = selected.includes(key)
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={on}
                // Stays open: picking two kinds is one gesture, not two.
                onClick={() => onToggle(key)}
                style={{ fontSize: FS.control }}
                className={DROPDOWN_ROW}
              >
                <span
                  className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px]"
                  style={on ? { background: serviceColor(key), color: '#fff' } : { background: `${serviceColor(key)}1f`, color: serviceColor(key) }} // theme-lint-disable: road-signage palette
                >
                  <Icon size={12} strokeWidth={2} aria-hidden />
                </span>
                <span className={`min-w-0 flex-1 truncate pe-4 ${on ? 'font-semibold text-content' : 'font-medium text-content-secondary'}`}>
                  {t(labelKey)}
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
