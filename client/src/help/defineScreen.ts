import type { HelpContext, HelpDocLink, HelpGuide, HelpGuideSize, HelpIcon } from './types'

/**
 * One screen's whole registration, written once.
 *
 * Every `contexts/*.ts` file used to carry its own copy of the same little
 * factory and the same context literal; the screens of a trip alone would have
 * made thirteen copies of it. That repetition is what a duplication check
 * counts, and it is exactly the hand-mirrored state the repository's rules ask
 * us not to keep. So the shape lives here and a context file is data only: the
 * ids, the counts, the docs and what relates to what.
 *
 * A guide is a row rather than an object because the rows are read as a table:
 * one line per guide, the numbers under each other.
 */

export type GuideRow = [
  id: string,
  icon: HelpIcon,
  size: HelpGuideSize,
  steps: number,
  tips: number,
  docs: HelpDocLink | undefined,
  related: string[],
  /** Whether the guide carries a picture of the state after its last step. Default: no. */
  result?: boolean,
]

export interface ScreenSpec {
  id: string
  icon: HelpIcon
  /** How many "on this screen" bullets the catalogue has for it. */
  bullets: number
  /** Where the reference documentation continues. */
  docs: HelpDocLink[]
  /** The guides, in the order the panel lists them. */
  guides: GuideRow[]
  /** The screen this one lives under, for the switcher. */
  parent?: string
  /** Where the screen is in the app, for the "go there" button. */
  route?: string
  /** Whether `help-media/ctx/<id>.webp` exists. Default: yes. */
  hero?: boolean
}

/** The context and the guides of one screen, from one description of it. */
export function defineScreen(spec: ScreenSpec): { context: HelpContext; guides: HelpGuide[] } {
  const guides: HelpGuide[] = spec.guides.map(
    ([id, icon, size, steps, tips, docs, related, result = false]): HelpGuide => ({
      id,
      context: spec.id,
      icon,
      size,
      steps,
      tips,
      media: { steps: true, result },
      docs,
      related,
    }),
  )
  return {
    guides,
    context: {
      id: spec.id,
      parent: spec.parent,
      route: spec.route,
      icon: spec.icon,
      bullets: spec.bullets,
      guides: guides.map(g => g.id),
      docs: spec.docs,
      hero: spec.hero ?? true,
    },
  }
}
