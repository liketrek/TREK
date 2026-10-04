import type { ReactNode } from 'react'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { fs } from '../shared/DialogShell'

/**
 * One addon in its type's card: a row like the bag sidebar's (#2541), with the
 * icon tile on the left, name and description beside it and the switch on the
 * right. Its sub-features sit under it in a grey inset box of hairline rows.
 *
 * The on/off state rides on the icon tile and the switch: a switched-off addon
 * greys its tile and its description, but keeps its name at full strength. The
 * name is the tile's identity, not its state; greying it out reads as "broken"
 * rather than "not enabled".
 *
 * The row is not a click target, only the switches are. No lift, no pointer
 * cursor, no `role="button"`.
 */
export default function AddonTile({
  icon,
  name,
  description,
  enabled,
  onToggle,
  children,
}: {
  icon: ReactNode
  name: string
  description?: string
  enabled: boolean
  onToggle: () => void
  /** The sub-shelf: `<AddonSubRow>` children. */
  children?: ReactNode
}) {
  return (
    <article className="px-3.5 py-3 transition-colors duration-150 focus-within:bg-surface-secondary">
      <div className="flex items-start gap-3">
        <div
          // overflow-hidden so a brand mark that fills the slot keeps the slot's
          // rounded corners instead of squaring them off.
          className={`grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-[10px] transition-colors ${
            enabled ? 'bg-surface-card text-content shadow-sm ring-1 ring-edge-faint' : 'bg-surface-tertiary text-content-faint'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1 pt-px">
          <h4 className="m-0 truncate font-semibold text-content" style={fs(13, 'body')} title={name}>
            {name}
          </h4>
          <p
            className={`m-0 mt-0.5 line-clamp-2 leading-snug ${enabled ? 'text-content-muted' : 'text-content-faint'}`}
            style={fs(11.5)}
            title={description}
          >
            {description}
          </p>
        </div>

        <div className="flex-none pt-1.5">
          <ToggleSwitch on={enabled} onToggle={onToggle} label={name} />
        </div>
      </div>

      {children && (
        <div className="mt-3 overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
          {/* Sitting inside the parent on its own fill is enough to say these belong
              to it: no rail, no indent guides. */}
          <ul className="m-0 list-none divide-y divide-edge-faint p-0">{children}</ul>
        </div>
      )}
    </article>
  )
}
