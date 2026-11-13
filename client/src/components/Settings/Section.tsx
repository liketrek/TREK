import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { SettingsCard } from './settingsKit'

interface SectionProps {
  title: string
  /**
   * A lucide icon, or anything that takes the same `className` — a brand mark
   * standing in for a glyph gets sized by the same utilities.
   */
  icon: LucideIcon | React.ComponentType<{ className?: string }>
  /** The icon is a brand badge that fills its tile instead of a glyph in it. */
  iconFill?: boolean
  badge?: React.ReactNode
  /** One line under the title in the head band. */
  hint?: React.ReactNode
  /** A control on the right of the head band. */
  action?: React.ReactNode
  /** Where a link lands: `#id` scrolls to the card, or opens it from an overview. */
  id?: string
  children: React.ReactNode
}

/**
 * A settings group: the planner's card with a head band (see settingsKit).
 */
export default function Section({ title, icon, iconFill, badge, hint, action, id, children }: SectionProps): React.ReactElement {
  return (
    <SettingsCard icon={icon} iconFill={iconFill} title={title} badge={badge} hint={hint} action={action} id={id}>
      {children}
    </SettingsCard>
  )
}
