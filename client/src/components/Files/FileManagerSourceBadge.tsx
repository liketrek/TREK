// Source badge
interface SourceBadgeProps {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  label: string
}

export function SourceBadge({ icon: Icon, label }: SourceBadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: '#4b5563',
      background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
      borderRadius: 6, padding: '2px 7px',
      fontWeight: 500, maxWidth: '100%', overflow: 'hidden',
    }}>
      <Icon size={10} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </span>
  )
}
