import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
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
 * What to look for, as one full-width control.
 *
 * Six pills wrapped onto three lines and took the height of the whole card for a set of
 * answers that rarely changes. Folded into a dropdown it is one line, and the space goes
 * to the results — which is what the column is actually for.
 *
 * Multi-select, so it stays open on a click: picking "fuel and charging" is one gesture
 * rather than two round trips through a menu. Each row leads with its own coloured icon,
 * the same one the rail puts on its dashed line and the map puts on the route.
 */
export default function RoadtripCategoryPicker({ keys, meta, selected, onToggle }: RoadtripCategoryPickerProps): React.ReactElement {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // The kinds themselves rather than a count: "Fuel, Charging" is the answer, "2 kinds"
  // is a riddle. Truncated when it runs long, which is what the icons in front are for.
  const summary = selected.length
    ? keys.filter(k => selected.includes(k)).map(k => t(meta[k].labelKey)).join(', ')
    : t('roadtrip.poi.looking')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{ fontSize: FS.control }}
        className="flex h-[32px] w-full items-center gap-2 rounded-xl border border-edge bg-surface-card pe-2 ps-2.5 text-start transition-colors hover:border-content-faint"
      >
        <span className="flex shrink-0 items-center gap-1">
          {keys.filter(k => selected.includes(k)).slice(0, 3).map(k => {
            const Icon = meta[k].Icon
            return (
              <span
                key={k}
                className="grid h-[18px] w-[18px] place-items-center rounded-md"
                // theme-lint-disable — the road-signage palette in `roadtripModel`.
                style={{ background: serviceColor(k), color: '#fff' }}
              >
                <Icon size={10} strokeWidth={2.2} aria-hidden />
              </span>
            )
          })}
        </span>
        <span className={`min-w-0 flex-1 truncate ${selected.length ? 'font-medium text-content' : 'text-content-faint'}`}>
          {summary}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute inset-x-0 top-full z-[var(--z-toast)] mt-1 overflow-hidden rounded-xl border border-edge bg-surface-elevated shadow-dropdown backdrop-blur"
        >
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
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-start transition-colors hover:bg-surface-hover"
              >
                <span
                  className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px]"
                  // theme-lint-disable — see above.
                  style={on ? { background: serviceColor(key), color: '#fff' } : { background: `${serviceColor(key)}1f`, color: serviceColor(key) }}
                >
                  <Icon size={12} strokeWidth={2} aria-hidden />
                </span>
                <span className={`min-w-0 flex-1 truncate ${on ? 'font-semibold text-content' : 'font-medium text-content-secondary'}`}>
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
