export type MStatus = 'confirmed' | 'pending' | 'info' | 'danger' | 'neutral'

interface MStatusDotProps {
  status: MStatus
  /** Diameter in px */
  size?: number
  className?: string
}

const STATUS_VAR: Record<MStatus, string> = {
  confirmed: 'var(--m-st-confirmed)',
  pending: 'var(--m-st-pending)',
  info: 'var(--m-st-info)',
  danger: 'var(--m-st-danger)',
  neutral: 'var(--m-st-neutral)',
}

/** Status dot in the canonical status colors (confirmed/pending/info/danger/neutral). */
export default function MStatusDot({ status, size = 7, className = '' }: MStatusDotProps) {
  return (
    <span
      aria-hidden
      className={`inline-block flex-none rounded-full ${className}`}
      style={{ width: size, height: size, background: STATUS_VAR[status] }}
    />
  )
}
