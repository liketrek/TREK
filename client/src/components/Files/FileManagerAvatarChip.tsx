import ReactDOM from 'react-dom'
import { useState, useRef } from 'react'

export function AvatarChip({ name, avatarUrl, size = 20 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const onEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.top - 6, left: rect.left + rect.width / 2 })
    }
    setHover(true)
  }

  return (
    <>
      <div ref={ref} onMouseEnter={onEnter} onMouseLeave={() => setHover(false)}
        style={{
          width: size, height: size, borderRadius: '50%', border: '1.5px solid var(--border-primary)',
          background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4, fontWeight: 700, color: 'var(--text-muted)', overflow: 'hidden', flexShrink: 0,
          cursor: 'default',
        }}>
        {avatarUrl
          ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : name?.[0]?.toUpperCase()
        }
      </div>
      {hover && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)',
          background: 'var(--bg-elevated)', color: 'var(--text-primary)',
          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', whiteSpace: 'nowrap', zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {name}
        </div>,
        document.body
      )}
    </>
  )
}
