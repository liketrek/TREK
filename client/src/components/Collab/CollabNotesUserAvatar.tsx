import { FONT } from './CollabNotes.constants'
import type { NoteAuthor } from './CollabNotes.types'

// ── Avatar ──────────────────────────────────────────────────────────────────
interface UserAvatarProps {
  user: NoteAuthor | null
  size?: number
}

export function UserAvatar({ user, size = 14 }: UserAvatarProps) {
  if (!user) return null
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          background: 'var(--bg-tertiary)',
        }}
      />
    )
  }
  const initials = (user.username || '?').slice(0, 1)
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--bg-tertiary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.45,
      fontWeight: 600,
      color: 'var(--text-faint)',
      flexShrink: 0,
      textTransform: 'uppercase',
      fontFamily: FONT,
    }}>
      {initials}
    </div>
  )
}
