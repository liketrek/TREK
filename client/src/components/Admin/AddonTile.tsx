import type { ReactNode } from 'react'
import ToggleSwitch from '../Settings/ToggleSwitch'

/**
 * One addon in the admin grid: a card whose fill carries the on/off state, with
 * an optional shelf at the foot holding its sub-features.
 *
 * The fill ladder is `--bg-secondary` (on) against `--bg-card` (the panel it
 * sits on) — that pair reads in both themes, because secondary is *darker* than
 * the card in light and *lighter* in dark. The obvious alternative, on =
 * `bg-surface-card`, inverts in dark and turns the disabled tiles into the loud
 * ones.
 *
 * Hover and focus ride on border and fill rather than a shadow: `--shadow-card`
 * is only declared in `:root`, so the `.dark` palette never overrides it and a
 * shadow-based affordance would be invisible there.
 *
 * The card is not a click target — only the switches are. No lift, no pointer
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
    <article
      className={`flex flex-col overflow-hidden rounded-xl border transition-[background-color,border-color] duration-150 focus-within:ring-2 focus-within:ring-accent ${
        enabled
          ? 'border-edge bg-surface-secondary'
          : 'border-edge-secondary bg-surface hover:border-edge hover:bg-surface-secondary'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            enabled ? 'border border-accent bg-accent-subtle text-accent-on' : 'bg-surface-tertiary text-content-faint'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          {/* The name stays full-strength when off: it is the tile's identity, not its
              state. Greying it out reads as "broken" rather than "not enabled". */}
          <h4 className="truncate text-body font-semibold text-content" title={name}>
            {name}
          </h4>
          <p
            className={`mt-0.5 line-clamp-2 text-caption ${enabled ? 'text-content-muted' : 'text-content-faint'}`}
            title={description}
          >
            {description}
          </p>
        </div>

        <ToggleSwitch on={enabled} onToggle={onToggle} label={name} />
      </div>

      {children && (
        <div className="border-t border-edge-secondary bg-surface-tertiary px-4 py-2.5">
          {/* Sitting inside the parent on its own fill is enough to say these belong
              to it — no rail, no indent guides. */}
          <ul className="space-y-0.5">{children}</ul>
        </div>
      )}
    </article>
  )
}
