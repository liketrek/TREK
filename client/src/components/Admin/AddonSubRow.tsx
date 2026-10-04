import type { ReactNode } from 'react'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { fs } from '../shared/DialogShell'

/**
 * One child row inside an {@link AddonTile}'s sub-shelf: bag tracking under
 * Lists, a collab feature under Collab, a photo provider under Journey.
 *
 * A photo provider without a vendor mark has to stay free of `<svg>`
 * (FE-ADMIN-ADDON-015), which is why `icon` falls back to a fixed-width spacer
 * rather than a placeholder glyph. Nothing else belongs in this row either: no
 * chevron, no status dot, no lucide fallback.
 *
 * The row carries its title only; the description rides along as the `title`
 * tooltip, because a second line of text is what makes a child weigh as much as
 * an addon.
 */
export default function AddonSubRow({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  /** Vendor mark or lucide glyph at 14px. Omit it and the slot keeps its width. */
  icon?: ReactNode
  title: string
  description?: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex min-h-[44px] items-center gap-2.5 px-3 py-1.5">
      {icon
        ? <span className={`grid h-6 w-6 flex-none place-items-center ${enabled ? 'text-content-muted' : 'text-content-faint'}`}>{icon}</span>
        : <span className="w-6 flex-none" aria-hidden />}
      <span className={`min-w-0 flex-1 truncate font-medium ${enabled ? 'text-content' : 'text-content-muted'}`} style={fs(12.5, 'body')} title={description}>
        {title}
      </span>
      <ToggleSwitch on={enabled} onToggle={onToggle} label={title} />
    </li>
  )
}
