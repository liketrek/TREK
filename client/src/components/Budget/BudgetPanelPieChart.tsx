import { Wallet } from 'lucide-react'

interface PieSegment {
  label: string
  value: number
  color: string
}

// ── Pie Chart (pure CSS conic-gradient) ──────────────────────────────────────
interface PieChartProps {
  segments: PieSegment[]
  size?: number
  totalLabel: string
}

export default function PieChart({ segments, size = 200, totalLabel }: PieChartProps) {
  if (!segments.length) return null

  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return null

  let cumDeg = 0
  const stops = segments.map(seg => {
    const start = cumDeg
    const deg = (seg.value / total) * 360
    cumDeg += deg
    return `${seg.color} ${start}deg ${start + deg}deg`
  }).join(', ')

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <div
        className="trek-pie-reveal"
        style={{
          width: size, height: size, borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 0.55, height: size * 0.55,
        borderRadius: '50%', background: 'var(--bg-card)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.04)',
      }}>
        <Wallet size={18} color="var(--text-faint)" style={{ marginBottom: 2 }} />
        <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 500 }}>{totalLabel}</span>
      </div>
    </div>
  )
}
