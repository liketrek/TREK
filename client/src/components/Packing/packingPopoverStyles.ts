import { useEffect, type CSSProperties, type RefObject } from 'react'

/**
 * The one look every packing popover shares (the item menu, the bag picker, a
 * list's menu): a soft card, entries with an icon column, a tick on the
 * current choice.
 */
export const POPOVER: CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-secondary)', borderRadius: 14,
  boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.06)', padding: 6,
}
export const POPOVER_DIVIDER: CSSProperties = { height: 1, background: 'var(--border-faint)', margin: '5px 6px' }
export const POPOVER_CAPTION: CSSProperties = {
  padding: '5px 10px 4px', fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 700,
  color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em',
}

/** An inline field that adds something (an item, a bag): framed, with a soft accent ring. */
export const COMPOSER: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
  border: '1px solid var(--border-primary)', background: 'var(--bg-card)',
  boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent) 10%, transparent)',
}

/** The square accent button that confirms a composer; faded while there is nothing to add. */
export const composerConfirm = (enabled: boolean): CSSProperties => ({
  width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--accent-text)',
  cursor: enabled ? 'pointer' : 'default', opacity: enabled ? 1 : 0.35, display: 'grid', placeItems: 'center',
  flexShrink: 0, transition: 'opacity 120ms ease',
})

/**
 * Closes a popover or composer on a press anywhere outside `ref`. A copy that
 * is mounted but not displayed (the bag sidebar below its breakpoint) has no
 * layout box, and must not close the visible copy's twin.
 */
export function useDismissOnOutside(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const el = ref.current
      if (!el || el.getClientRects().length === 0 || el.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [ref, open, onClose])
}
