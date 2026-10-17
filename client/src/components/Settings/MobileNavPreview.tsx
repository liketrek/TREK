import { Plus, MoreHorizontal } from 'lucide-react'
import type { NavItemDef } from '../Layout/navItems'

/** One circle of the dock: the card surface on a hairline ring, the icon in the secondary ink. */
const SLOT = 'flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-card text-content-secondary shadow-[inset_0_0_0_1px_var(--border-faint)]'

/**
 * A live, non-interactive mock of the mobile bottom dock that mirrors the
 * customizer's current split: Dashboard + bar items around the raised centre
 * "+", with a trailing "More" circle when items are demoted. Themed via base
 * tokens so it reads correctly in light and dark.
 */
export default function MobileNavPreview({
  bar,
  hasMore,
  moreLabel,
}: {
  bar: NavItemDef[]
  hasMore: boolean
  moreLabel: string
}) {
  // Mirror MBottomNav's geometry: split the slots (bar items + the More slot)
  // around the centre so the "+" sits dead centre.
  const slotCount = bar.length + (hasMore ? 1 : 0)
  const splitAt = Math.ceil(slotCount / 2)
  const left = bar.slice(0, splitAt)
  const right = bar.slice(splitAt)

  const circle = (item: NavItemDef) => {
    const Icon = item.icon
    return (
      <span
        key={item.id}
        title={item.label}
        className={SLOT}
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1.5 rounded-full border border-edge-faint bg-surface-hover px-3 py-2">
      {left.map(circle)}

      <span className="mx-1 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-content text-surface-card shadow-sm">
        <Plus size={18} strokeWidth={2.4} />
      </span>

      {right.map(circle)}
      {hasMore && (
        <span
          title={moreLabel}
          className={SLOT}
        >
          <MoreHorizontal size={16} strokeWidth={1.9} />
        </span>
      )}
    </div>
  )
}
