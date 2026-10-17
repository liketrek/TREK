import React from 'react'
import { fs } from '../../components/shared/DialogShell'
import { StatusPill } from '../../components/Settings/settingsKit'

interface ProviderBlockProps {
  title: string
  /** Optional pill beside the title, like the one on the TREK block. */
  badge?: string
  /**
   * `accent` marks the recommended path, `muted` a neutral one, `caution` a
   * provider that costs something other than money. Deliberately not `danger`:
   * using a Google key is a legitimate choice, and a red badge would be the
   * settings page shouting at the person who made it.
   */
  tone?: 'muted' | 'caution'
  children: React.ReactNode
}

/**
 * One provider inside the API card, in the same shape as the TREK block above
 * it, so the page reads as a list of comparable options rather than one
 * highlighted thing and some loose fields underneath. A white box on the
 * card's grey body, its name in a head row, like a bag in the packing sidebar.
 */
export default function ProviderBlock({
  title, badge, tone = 'muted', children,
}: ProviderBlockProps): React.ReactElement {
  return (
    <section className="overflow-hidden rounded-[14px] border border-edge-faint bg-surface-card">
      <div className="flex min-w-0 items-center gap-2 border-b border-edge-faint px-3.5 py-2.5">
        <h3 className="m-0 min-w-0 flex-1 truncate font-semibold text-content" style={fs(13, 'body')}>{title}</h3>
        {badge && <StatusPill tone={tone === 'caution' ? 'warning' : 'neutral'}>{badge}</StatusPill>}
      </div>
      <div className="flex flex-col gap-3 p-3.5">{children}</div>
    </section>
  )
}
