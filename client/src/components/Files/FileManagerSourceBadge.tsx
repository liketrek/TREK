import { Tooltip } from '../shared/Tooltip'

interface SourceBadgeProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
  /** What the badge links to (plan, transport, booking); its tooltip. */
  kind?: string
}

/** Where a file is attached: a place, a booking, a note. */
export function SourceBadge({ icon: Icon, label, kind }: SourceBadgeProps) {
  const badge = (
    <span className="inline-flex max-w-full items-center gap-1 overflow-hidden rounded-full border border-edge-faint bg-surface-card px-2 py-[2px] font-medium text-content-secondary"
      style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))' }}>
      <Icon size={10} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
      <span className="truncate">{label}</span>
    </span>
  )
  return kind ? <Tooltip label={kind}>{badge}</Tooltip> : badge
}
