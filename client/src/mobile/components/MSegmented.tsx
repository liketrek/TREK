import { ReactNode, useLayoutEffect, useRef, useState } from 'react'

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
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const active = track.querySelector<HTMLElement>('[data-active="true"]')
      if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [value, options.length])

  return (
    <div
      ref={trackRef}
      role="tablist"
      className={`relative flex rounded-full bg-[color:var(--m-ic)] p-[3px] ${className}`}
    >
      {indicator && (
        <div
          className="absolute top-[3px] bottom-[3px] rounded-full bg-m-act transition-[left,width] duration-[280ms] ease-[var(--ease-drawer)]"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active}
            onClick={() => onChange(opt.value)}
            className={`relative z-[1] rounded-full py-[7px] text-center ${
              variant === 'intrinsic'
                ? 'whitespace-nowrap px-[13px] text-[0.75rem]'
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
