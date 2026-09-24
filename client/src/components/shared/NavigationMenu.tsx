import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Navigation } from 'lucide-react'
import type { NavigationTarget } from '../Planner/placeNavigation'
import { openNavigationTarget } from '../Planner/placeNavigation'

interface NavigationMenuProps {
  targets: NavigationTarget[]
  /** The element the menu is anchored to; it is measured, never moved. */
  anchor: HTMLElement | null
  onClose: () => void
  /** Heading above the list. Omitted on desktop, where the trigger says it. */
  title?: string
}

const GAP = 6
const EDGE = 8

/**
 * The map-app picker.
 *
 * Portalled rather than nested, because both call sites sit inside panels that
 * clip their overflow — a menu rendered in place would be cut off at the panel
 * edge. Being in the body means the position has to be computed, and computed
 * after the menu has a size: opening near the bottom of the window flips it
 * above the trigger instead of letting it run off the screen, and a menu wider
 * than the space to its right is pulled back inside.
 */
export function NavigationMenu({ targets, anchor, onClose, title }: NavigationMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Layout effect, not effect: the menu is placed before the browser paints, so
  // it never appears at the wrong spot for a frame and jumps.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !anchor) return
    const place = () => {
      const a = anchor.getBoundingClientRect()
      const m = el.getBoundingClientRect()
      const below = window.innerHeight - a.bottom
      const flip = below < m.height + GAP + EDGE && a.top > below
      const top = flip ? Math.max(EDGE, a.top - m.height - GAP) : a.bottom + GAP
      const left = Math.min(Math.max(EDGE, a.left), window.innerWidth - m.width - EDGE)
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor, targets.length])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchor?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchor, onClose])

  if (targets.length === 0) return null

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        // Hidden until measured, so the first paint is never in the wrong place.
        visibility: pos ? 'visible' : 'hidden',
        zIndex: 99999,
        minWidth: 186,
        maxHeight: `calc(100vh - ${EDGE * 2}px)`,
        overflowY: 'auto',
        // Portaled and fixed like CustomSelect's list, so it chains to the viewport
        // unless told otherwise (#2078). This one reaches the phone through
        // MPlaceSheet, not only the desktop inspector.
        overscrollBehavior: 'contain',
        padding: 5,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--border-primary)',
        borderRadius: 12,
        boxShadow: '0 10px 34px rgba(0,0,0,0.16)',
        animation: 'trek-menu-enter 180ms cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'transform, opacity',
      }}
    >
      {title && (
        <div style={{
          padding: '5px 10px 7px',
          fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}>
          {title}
        </div>
      )}
      {targets.map(target => (
        <button type="button"
          key={target.id}
          role="menuitem"
          onClick={() => { openNavigationTarget(target); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '8px 10px', borderRadius: 8, border: 'none',
            background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500,
            textAlign: 'left', color: 'var(--text-primary)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          <Navigation size={13} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
          <span>{target.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}
