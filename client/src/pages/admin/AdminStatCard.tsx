import React from 'react'
import { useCountUp } from '../../hooks/useCountUp'

// Single animated metric card in the admin stats grid. Presentational.
export default function AdminStatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }): React.ReactElement {
  const animated = useCountUp(value, 900)
  return (
    <div className="rounded-xl border p-4 bg-surface-card border-edge">
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5 text-content" />
        <div>
          <p className="text-xl font-bold tabular-nums text-content">{animated}</p>
          <p className="text-xs text-content-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
