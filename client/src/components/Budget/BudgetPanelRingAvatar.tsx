import { colorForUserId } from './BudgetPanel.helpers'

export default function RingAvatar({ userId, username, avatarUrl, size = 34, innerBg = '#17171d', textColor = '#fff' }: { userId: number; username?: string; avatarUrl?: string | null; size?: number; innerBg?: string; textColor?: string }) {
  const color = colorForUserId(userId)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      padding: 2, background: color.gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: innerBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        fontSize: size < 28 ? 10 : 12, fontWeight: 600, color: textColor,
      }}>
        {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username?.[0]?.toUpperCase()}
      </div>
    </div>
  )
}
