import React, { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

export interface SlidingTab<T extends string> {
  id: T
  label: React.ReactNode
  title?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  count?: number
}

interface SlidingTabsProps<T extends string> {
  tabs: readonly SlidingTab<T>[]
  activeTab: T
  onChange: (id: T) => void
  size?: 'sm' | 'md'
  fullWidth?: boolean
  className?: string
  indicatorColor?: string
  indicatorTextColor?: string
}

// Stripe-style sliding indicator — der aktive Pill gleitet zwischen Tabs.
// Nutzt gemessene Offsets der Buttons + CSS transform.
export function SlidingTabs<T extends string>({
  tabs, activeTab, onChange, size = 'md', fullWidth, className,
  indicatorColor = 'var(--accent)', indicatorTextColor = 'var(--accent-text)',
}: SlidingTabsProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<T, HTMLButtonElement | null>>(new Map())
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const measure = (): void => {
      const active = tabRefs.current.get(activeTab)
      const container = containerRef.current
      if (!active || !container) return
      const containerRect = container.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      const left = activeRect.left - containerRect.left + container.scrollLeft
      const width = activeRect.width
      setIndicator(prev =>
        prev.ready && prev.left === left && prev.width === width
          ? prev
          : { left, width, ready: true },
      )
    }

    measure()

    // Re-measure once web fonts settle — on a reload the first measure runs against
    // fallback-font metrics, so the (bold) active label reflows and the pill drifts.
    let cancelled = false
    document.fonts?.ready?.then(() => {
      if (!cancelled) measure()
    })

    // Re-measure on layout/size changes: container (window resize) + active label reflow.
    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure())
      if (containerRef.current) ro.observe(containerRef.current)
      const active = tabRefs.current.get(activeTab)
      if (active) ro.observe(active)
    }

    return () => {
      cancelled = true
      ro?.disconnect()
    }
  }, [activeTab, tabs.length])

  const padding = size === 'sm' ? '5px 12px' : '6px 14px'
  const fontSize = size === 'sm' ? 12 : 13
  const borderRadius = size === 'sm' ? 18 : 20

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        gap: 2, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {/* Sliding indicator */}
      {indicator.ready && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: indicator.left,
            width: indicator.width,
            height: size === 'sm' ? 26 : 30,
            background: indicatorColor,
            borderRadius,
            transform: 'translateY(-50%)',
            transition: 'left 320ms cubic-bezier(0.77, 0, 0.175, 1), width 320ms cubic-bezier(0.77, 0, 0.175, 1)',
            pointerEvents: 'none',
            zIndex: 0,
            willChange: 'left, width',
          }}
        />
      )}
      {tabs.map(tab => {
        const isActive = tab.id === activeTab
        const Icon = tab.icon
        const btnStyle: CSSProperties = {
          position: 'relative', zIndex: 1,
          flexShrink: 0,
          padding,
          borderRadius,
          border: 'none',
          cursor: 'pointer',
          fontSize,
          fontWeight: isActive ? 600 : 500,
          background: 'transparent',
          color: isActive ? indicatorTextColor : 'var(--text-muted)',
          fontFamily: 'inherit',
          transition: 'color 220ms cubic-bezier(0.23, 1, 0.32, 1)',
          display: 'flex', alignItems: 'center', gap: 6,
          flex: fullWidth ? 1 : undefined,
          justifyContent: 'center',
          whiteSpace: 'nowrap',
        }
        return (
          <button
            key={tab.id}
            ref={el => { tabRefs.current.set(tab.id, el) }}
            onClick={() => onChange(tab.id)}
            style={btnStyle}
            title={tab.title ?? (typeof tab.label === 'string' ? tab.label : undefined)}
          >
            {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
            {tab.label}
            {tab.count != null && (
              <span style={{
                fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600,
                padding: '1px 6px', borderRadius: 99, minWidth: 16,
                background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--bg-tertiary)',
                color: isActive ? 'inherit' : 'var(--text-faint)',
                textAlign: 'center',
              }}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SlidingTabs
