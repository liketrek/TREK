import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function NightPauseTooltip({ label, x, y }: { label: string; x: number; y: number }) {
  const card = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const place = () => {
      const node = card.current!
      const { width, height } = node.getBoundingClientRect()
      const left = x + 14 + width > window.innerWidth - 12 ? x - width - 14 : x + 14
      node.style.left = `${Math.max(12, Math.min(left, window.innerWidth - width - 12))}px`
      node.style.top = `${Math.max(12, Math.min(y - 10, window.innerHeight - height - 12))}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [label, x, y])
  return createPortal(
    <div ref={card} role="tooltip" data-testid="tooltip"
      className="pointer-events-none fixed z-[var(--z-toast)] rounded-lg border border-edge-faint bg-surface-card px-3 py-2 font-semibold leading-relaxed text-content shadow-popover"
      style={{ left: x + 14, top: y - 10, maxWidth: 'min(16rem, calc(100vw - 24px))', overflowWrap: 'anywhere', fontFamily: 'var(--font-system)', fontSize: 12 }}
    >{label}</div>, document.body,
  )
}
