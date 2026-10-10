import React from 'react'
import { useCountUp } from '../../hooks/useCountUp'
import { fs } from '../../components/shared/DialogShell'

// One animated metric of the admin header: a raised tile with the icon, the
// count and its label, sized to sit four in a row on the page's bar.
export default function AdminStatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }): React.ReactElement {
  const animated = useCountUp(value, 900)
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-[12px] bg-surface-card py-2 ps-2 pe-3.5 shadow-sm">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="m-0 font-geist font-bold leading-tight tabular-nums text-content" style={fs(16, 'subtitle')}>{animated}</p>
        <p className="m-0 truncate font-geist font-bold uppercase leading-tight tracking-[.08em] text-content-faint" style={fs(9.5)}>{label}</p>
      </div>
    </div>
  )
}
