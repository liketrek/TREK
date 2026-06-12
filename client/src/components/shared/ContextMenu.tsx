import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { LucideIcon } from 'lucide-react'

interface MenuItem {
  label?: string
  icon?: LucideIcon
  onClick?: () => void
  danger?: boolean
  divider?: boolean
}

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

export function useContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null)

  const open = (e: React.MouseEvent, items: MenuItem[]) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, items })
  }

  const close = () => setMenu(null)

  return { menu, open, close }
}

interface ContextMenuProps {
  menu: MenuState | null
  onClose: () => void
}

export function ContextMenu({ menu, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const handler = () => onClose()
    document.addEventListener('click', handler)
    document.addEventListener('contextmenu', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('contextmenu', handler)
    }
  }, [menu, onClose])

  useEffect(() => {
    if (!menu || !ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    let { x, y } = menu
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8
    if (x !== menu.x || y !== menu.y) {
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
  }, [menu])

  if (!menu) return null

  return ReactDOM.createPortal(
    <div ref={ref} className="trek-popover-enter" style={{
      position: 'fixed', left: menu.x, top: menu.y, zIndex: 999999,
      background: 'var(--bg-card)', borderRadius: 10, padding: '4px',
      border: '1px solid var(--border-primary)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      minWidth: 160,
      fontFamily: "var(--font-system)",
      transformOrigin: 'top left',
    }}>
      {menu.items.filter(Boolean).map((item, i) => {
        if (item.divider) return <div key={i} style={{ height: 1, background: 'var(--border-faint)', margin: '3px 6px' }} />
        const Icon = item.icon
        return (
          <button key={i} onClick={() => { item.onClick?.(); onClose() }} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 10px', borderRadius: 7, border: 'none',
            background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 500, textAlign: 'left',
            color: item.danger ? '#ef4444' : 'var(--text-primary)',
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {Icon && <Icon size={13} style={{ flexShrink: 0, color: item.danger ? '#ef4444' : 'var(--text-faint)' }} />}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>,
    document.body
  )
}
