// A member's picture, or their initial on a colour picked from the letter.
const INITIAL_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'] // theme-lint-disable: a member's own colour, like a category's

export function TripMemberAvatar({ username, avatarUrl, size = 32 }: { username: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  const letter = (username || '?')[0].toUpperCase()
  const color = INITIAL_COLORS[(letter.codePointAt(0) ?? 0) % INITIAL_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'white', flexShrink: 0, // theme-lint-disable: an initial on the member's own colour
    }}>
      {letter}
    </div>
  )
}
