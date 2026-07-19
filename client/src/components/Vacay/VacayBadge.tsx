interface VacayBadgeProps {
  label: string
  // 'amber' flags a pending/attention state; the default is a neutral grey pill.
  tone?: 'amber'
}

export default function VacayBadge({ label, tone }: VacayBadgeProps) {
  const toneStyle = tone === 'amber'
    ? { background: 'rgba(245,158,11,0.16)', color: '#b45309' }
    : { background: 'color-mix(in srgb, var(--vg-ink3) 14%, transparent)', color: 'var(--vg-ink2)' }
  return (
    <span
      className="shrink-0 rounded-full font-semibold uppercase"
      style={{ fontSize: 8.5, letterSpacing: '0.05em', padding: '2px 6px', lineHeight: 1.4, ...toneStyle }}
    >
      {label}
    </span>
  )
}
