import { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { TwemojiImg } from './CollabChatTwemojiImg'
import type { ChatReaction } from './CollabChat.types'

/* ── Reaction Badge with NOMAD tooltip ── */
interface ReactionBadgeProps {
  reaction: ChatReaction
  currentUserId: number
  onReact: () => void
}

export function ReactionBadge({ reaction, currentUserId, onReact }: ReactionBadgeProps) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)
  const names = reaction.users.map(u => u.username).join(', ')

  return (
    <>
      <button ref={ref} onClick={onReact}
        onMouseEnter={() => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect()
            setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 })
          }
          setHover(true)
        }}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 2, padding: '1px 3px',
          borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: 'transparent', transition: 'transform 0.1s',
        }}
      >
        <TwemojiImg emoji={reaction.emoji} size={16} />
        {reaction.count > 1 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', minWidth: 8 }}>{reaction.count}</span>}
      </button>
      {hover && names && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)',
          pointerEvents: 'none', zIndex: 10000, whiteSpace: 'nowrap',
          background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
          fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-faint, #e5e7eb)',
        }}>
          {names}
        </div>,
        document.body
      )}
    </>
  )
}
