import { Children, type ReactNode } from 'react'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { HintMark } from '../Settings/settingsKit'
import { fs } from '../shared/DialogShell'

/**
 * One addon in its type's card, as a settings row: the icon tile, the name with
 * its description behind an info mark, and the switch on the right. Its
 * sub-features follow as indented rows while it is on, in the same list and with
 * the same hairlines: no box of their own, nothing folded away.
 *
 * The on/off state rides on the icon tile and the switch: a switched-off addon
 * greys its tile but keeps its name at full strength. The name is the row's
 * identity, not its state; greying it out reads as "broken" rather than "not
 * enabled". The row is not a click target, only the switches are.
 */
export default function AddonTile({
  icon,
  name,
  description,
  enabled,
  onToggle,
  trailing,
  children,
}: {
  icon: ReactNode
  name: string
  description?: string
  enabled: boolean
  /** The addon's switch; leave it out for a row that shows a state instead (`trailing`). */
  onToggle?: () => void
  /** Shown in place of the switch. */
  trailing?: ReactNode
  /** The sub-features: `<AddonSubRow>` children. */
  children?: ReactNode
}) {
  return (
    <article>
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          // overflow-hidden so a brand mark that fills the slot keeps the slot's
          // rounded corners instead of squaring them off.
          className={`grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-[10px] transition-colors ${
            enabled ? 'bg-surface-card text-content-secondary shadow-sm ring-1 ring-edge-faint' : 'bg-surface-tertiary text-content-faint'
          }`}
        >
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h4 className="m-0 truncate font-medium text-content" style={fs(13, 'body')}>{name}</h4>
          {description && <HintMark hint={description} />}
        </div>
        <div className="flex flex-none items-center">
          {trailing ?? (onToggle && <ToggleSwitch on={enabled} onToggle={onToggle} label={name} />)}
        </div>
      </div>
      {/* An empty shelf (a tours addon without its options here) draws no line. */}
      {Children.count(children) > 0 && <ul className="m-0 list-none divide-y divide-edge-faint border-t border-edge-faint p-0">{children}</ul>}
    </article>
  )
}
