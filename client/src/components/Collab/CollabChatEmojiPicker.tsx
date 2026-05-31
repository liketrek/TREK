import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { EMOJI_CATEGORIES } from './CollabChat.constants'
import { TwemojiImg } from './CollabChatTwemojiImg'

/* ── Emoji Picker ── */
interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLElement | null>
}

export function EmojiPicker({ onSelect, onClose, anchorRef, containerRef }: EmojiPickerProps) {
  const [cat, setCat] = useState(Object.keys(EMOJI_CATEGORIES)[0])
  const ref = useRef(null)

  const getPos = () => {
    const container = containerRef?.current
    const anchor = anchorRef?.current
    if (container && anchor) {
      const cRect = container.getBoundingClientRect()
      const aRect = anchor.getBoundingClientRect()
      return { bottom: window.innerHeight - aRect.top + 16, left: cRect.left + cRect.width / 2 - 140 }
    }
    return { bottom: 80, left: 0 }
  }
  const pos = getPos()

  useEffect(() => {
    const close = (e) => {
      if (ref.current && ref.current.contains(e.target)) return
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [onClose, anchorRef])

  return ReactDOM.createPortal(
    <div ref={ref} style={{
      position: 'fixed', bottom: pos.bottom, left: pos.left, zIndex: 10000,
      background: 'var(--bg-card)', border: '1px solid var(--border-faint)', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 280, overflow: 'hidden',
    }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-faint)', padding: '6px 8px', gap: 2 }}>
        {Object.keys(EMOJI_CATEGORIES).map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: cat === c ? 'var(--bg-hover)' : 'transparent',
            color: 'var(--text-primary)', fontSize: 10, fontWeight: 600, fontFamily: 'inherit',
          }}>
            {c}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, padding: 8 }}>
        {EMOJI_CATEGORIES[cat].map((emoji, i) => (
          <button key={i} onClick={() => onSelect(emoji)} style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6,
            padding: 2, transition: 'transform 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'scale(1.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <TwemojiImg emoji={emoji} size={20} />
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}
