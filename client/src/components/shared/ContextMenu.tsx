import React, { useState, useEffect, useLayoutEffect, useRef, type ComponentType, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { LucideIcon } from 'lucide-react'

interface MenuItem {
  label?: string
  /** A lucide icon, or any icon drawn the same way (TREK's own glyphs). */
  icon?: LucideIcon | ComponentType<{ size?: number; style?: CSSProperties }>
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  /** A second, quieter line under the label: what an item does, or why it is greyed out. */
  hint?: string
  /** A row that only names what the items below it act on, such as the day picked a step before. */
  heading?: boolean
}

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
  alignEnd?: boolean
}

export function useContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null)

  const open = (e: React.MouseEvent, items: MenuItem[], alignEnd = false) => {
    e.preventDefault()
    e.stopPropagation()
    const anchor = alignEnd ? e.currentTarget.getBoundingClientRect() : { right: e.clientX, bottom: e.clientY }
    setMenu({ x: alignEnd ? anchor.right : e.clientX, y: alignEnd ? anchor.bottom + 6 : e.clientY, items, alignEnd })
  }

  /** Opens the menu under an element, its end on the element's end: the next step of a menu opened there. */
  const openAt = (anchor: Element, items: MenuItem[]) => {
    const rect = anchor.getBoundingClientRect()
    setMenu({ x: rect.right, y: rect.bottom + 6, items, alignEnd: true })
  }

  const close = () => setMenu(null)

  return { menu, open, openAt, close }
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
    // A fixed menu stays where it opened, so it closes when the page under it
    // moves or the window changes size. Escape closes it in the capture phase
    // and goes no further, so a dialog, the assistant column or Studio under
    // it does not act on the same key.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('click', handler)
    document.addEventListener('contextmenu', handler)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('contextmenu', handler)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [menu, onClose])

  // Keyboard users land on the first item and move with the arrow keys.
  useEffect(() => {
    if (!menu) return
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true })
  }, [menu])

  const moveFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    if (items.length === 0) return
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const next = e.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length
    items[next]?.focus()
  }

  useLayoutEffect(() => {
    if (!menu || !ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    let { x, y } = menu
    if (menu.alignEnd) x = Math.max(8, x - rect.width)
    if (x + rect.width > window.innerWidth - 8) x = window.innerWidth - rect.width - 8
    if (y + rect.height > window.innerHeight - 8) y = window.innerHeight - rect.height - 8
    if (x !== menu.x || y !== menu.y) {
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
  }, [menu])

  if (!menu) return null

  return createPortal(
    <div ref={ref} role="menu" tabIndex={-1} onKeyDown={moveFocus} className="trek-popover-enter" style={{
      position: 'fixed', left: menu.x, top: menu.y, zIndex: 999999,
      background: 'var(--bg-card)', borderRadius: 10, padding: '4px',
      border: '1px solid var(--border-primary)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      minWidth: 160,
      width: menu.alignEnd ? 'max-content' : undefined,
      whiteSpace: menu.alignEnd ? 'nowrap' : undefined,
      fontFamily: "var(--font-system)",
      transformOrigin: menu.alignEnd ? 'top right' : 'top left',
    }}>
      {menu.items.filter(Boolean).map((item, i) => {
        if (item.divider) return <div key={i} style={{ height: 1, background: 'var(--border-faint)', margin: '3px 6px' }} />
        if (item.heading) return (
          <div key={i} style={{
            padding: '6px 10px 4px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
            color: 'var(--text-faint)',
          }}>
            {item.label}
          </div>
        )
        const Icon = item.icon
        return (
          <button type="button" key={i} disabled={item.disabled} onClick={() => { if (item.disabled) return; item.onClick?.(); onClose() }} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 10px', borderRadius: 7, border: 'none',
            background: 'none', cursor: item.disabled ? 'default' : 'pointer', fontFamily: 'inherit',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500, textAlign: 'start',
            color: item.danger ? '#ef4444' : 'var(--text-primary)', opacity: item.disabled ? 0.45 : 1,
            transition: 'background 0.1s',
          }}
            onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-hover)' }}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {Icon && <Icon size={13} style={{ flexShrink: 0, color: item.danger ? '#ef4444' : 'var(--text-faint)' }} />}
            {item.hint ? (
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <span>{item.label}</span>
                <span style={{
                  maxWidth: 240, whiteSpace: 'normal', fontWeight: 400, color: 'var(--text-muted)',
                  fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                }}>
                  {item.hint}
                </span>
              </span>
            ) : <span>{item.label}</span>}
          </button>
        )
      })}
    </div>,
    document.body
  )
}
