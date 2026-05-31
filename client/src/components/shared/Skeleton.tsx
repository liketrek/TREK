import React from 'react'

// Simple skeleton placeholder with shimmer. Size via className or props.
export function Skeleton({
  width, height, radius, className, style,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
  style?: React.CSSProperties
}): React.ReactElement {
  return (
    <div
      className={`trek-skeleton ${className ?? ''}`.trim()}
      style={{
        width,
        height: height ?? 14,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden
    />
  )
}

// Trip card skeleton matching SpotlightCard layout
export function SpotlightSkeleton(): React.ReactElement {
  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-8 bg-surface-tertiary"
      style={{ minHeight: 340 }}
    >
      <div className="trek-skeleton absolute inset-0" style={{ borderRadius: 24 }} />
      <div className="relative p-6 flex flex-col justify-end" style={{ minHeight: 340 }}>
        <Skeleton width={160} height={40} radius={8} style={{ marginBottom: 8 }} />
        <Skeleton width={220} height={16} radius={4} />
      </div>
    </div>
  )
}

// Trip list item skeleton
export function TripCardSkeleton(): React.ReactElement {
  return (
    <div
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-surface-card"
    >
      <Skeleton height={140} radius={0} />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  )
}

// Day sidebar skeleton row
export function DaySkeleton(): React.ReactElement {
  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width={120} height={16} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="60%" height={12} />
    </div>
  )
}

export default Skeleton
