import { ReactNode, useRef } from 'react'
import { useActivePill } from './useActivePill'
import { selectionHaptic } from '../../native/haptics'

export interface MSegmentedOption<T extends string = string> {
  value: T
  label: ReactNode
}

interface MSegmentedProps<T extends string = string> {
  options: MSegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** stretch = equal-width segments (costs tabs), intrinsic = pill hugs its label (dashboard filter) */
  variant?: 'stretch' | 'intrinsic'
  className?: string
}

/**
 * Segment pill with a sliding active indicator. Active segment reads in
 * --m-actfg on the --m-act pill, idle segments in --m-ink (Spec 07 §6).
 */
export default function MSegmented<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'stretch',
  className = '',
}: MSegmentedProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pill = useActivePill(trackRef, '[data-active="true"]', [value, options.length])

  return (
    <div
      ref={trackRef}
      role="tablist"
      className={`relative flex rounded-full bg-[color:var(--m-ic)] p-[3px] ${className}`}
    >
      {pill && <div aria-hidden="true" className="absolute bottom-[3px] left-0 top-[3px] rounded-full bg-m-act" style={pill} />}
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => {
              if (!active) selectionHaptic()
              onChange(opt.value)
            }}
            className={`relative z-[1] rounded-full py-[7px] text-center ${
              variant === 'intrinsic'
                ? 'whitespace-nowrap px-[11px] text-[0.75rem]'
                : 'flex-1 text-[0.71875rem]'
            } ${active ? 'font-semibold text-m-actfg' : 'font-medium text-m-ink'}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
