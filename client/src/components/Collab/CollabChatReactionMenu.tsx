import { useEffect, useRef } from 'react'
import { QUICK_REACTIONS } from './CollabChat.constants'
import { TwemojiImg } from './CollabChatTwemojiImg'

/* ── Reaction Quick Menu (right-click) ── */
interface ReactionMenuProps {
  x: number
  y: number
  onReact: (emoji: string) => void
  onClose: () => void
}

export function ReactionMenu({ x, y, onReact, onClose }: ReactionMenuProps) {
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose])

  // Clamp to viewport
  const menuWidth = 156
  const clampedLeft = Math.max(menuWidth / 2 + 8, Math.min(x, window.innerWidth - menuWidth / 2 - 8))

  return (
    <div ref={ref} style={{
      position: 'fixed', top: y - 80, left: clampedLeft, transform: 'translateX(-50%)', zIndex: 10000,
      background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: '6px 8px',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, width: menuWidth,
    }}>
      {QUICK_REACTIONS.map(emoji => (
        <button key={emoji} onClick={() => onReact(emoji)} style={{
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%',
          padding: 3, transition: 'transform 0.1s, background 0.1s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'none' }}
        >
          <TwemojiImg emoji={emoji} size={18} />
        </button>
      ))}
    </div>
  )
}
