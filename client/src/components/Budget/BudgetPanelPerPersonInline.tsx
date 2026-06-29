import { useState, useEffect } from 'react'
import { budgetApi } from '../../api/client'
import type { BudgetItem } from '../../types'
import { fmtNum, colorForUserId, widgetTheme } from './BudgetPanel.helpers'
import RingAvatar from './BudgetPanelRingAvatar'

interface PerPersonSummaryEntry {
  user_id: number
  username: string
  avatar_url: string | null
  total_assigned: number
}

interface PerPersonInlineProps {
  tripId: number
  budgetItems: BudgetItem[]
  currency: string
  locale: string
}

export default function PerPersonInline({ tripId, budgetItems, currency, locale, grandTotal, theme }: PerPersonInlineProps & { grandTotal: number; theme: ReturnType<typeof widgetTheme> }) {
  const [data, setData] = useState<PerPersonSummaryEntry[] | null>(null)
  const fmt = (v: number) => fmtNum(v, locale, currency)

  useEffect(() => {
    budgetApi.perPersonSummary(tripId).then(d => setData(d.summary)).catch(() => {})
  }, [tripId, budgetItems])

  if (!data || data.length === 0) return null

  const people = data.map(p => ({ ...p, color: colorForUserId(p.user_id) }))

  return (
    <>
      {grandTotal > 0 && (
        <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', marginTop: 8, marginBottom: 4, gap: 3 }}>
          {people.map(p => (
            <div key={p.user_id} style={{
              height: '100%', borderRadius: 999,
              flex: Math.max(p.total_assigned || 0, 0.01),
              background: p.color.gradient,
            }} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.divider}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {people.map(p => {
          const percent = grandTotal > 0 ? Math.round((p.total_assigned / grandTotal) * 100) : 0
          return (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
              <RingAvatar userId={p.user_id} username={p.username} avatarUrl={p.avatar_url} size={34} innerBg={theme.centerBg} textColor={theme.text} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500, letterSpacing: '-0.01em', color: theme.text }}>{p.username}</div>
                <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: theme.faint, marginTop: 1 }}>{percent}%</div>
              </div>
              <div style={{ fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 600, color: theme.text, letterSpacing: '-0.01em' }}>{fmt(p.total_assigned)}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
