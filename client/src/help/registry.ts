import type { HelpContext, HelpGuide } from './types'
import { dashboardContext, dashboardGuides } from './contexts/dashboard'
import { vacayContext, vacayGuides } from './contexts/vacay'
import { atlasContext, atlasGuides } from './contexts/atlas'
import { collectionsContext, collectionsGuides } from './contexts/collections'
import { journeyContext, journeyGuides, journalContext, journalGuides, studioContext, studioGuides } from './contexts/journey'
import { settingsContext, settingsTabContexts, settingsGuides } from './contexts/settings'
import { adminContext, adminTabContexts, adminGuides } from './contexts/admin'
import { tripContext, tripGuides } from './contexts/trip'
import { tripPlacesContext, tripPlacesGuides } from './contexts/tripPlaces'
import { tripDaysContext, tripDaysGuides } from './contexts/tripDays'
import { tripRoadtripContext, tripRoadtripGuides } from './contexts/tripRoadtrip'
import { tripCollabContext, tripCollabGuides } from './contexts/tripCollab'
import { tripFilesContext, tripFilesGuides } from './contexts/tripFiles'
import { tripCostsContext, tripCostsGuides } from './contexts/tripCosts'
import { tripListsContext, tripListsGuides } from './contexts/tripLists'
import { tripBookingsContext, tripBookingsGuides } from './contexts/tripBookings'
import { tripTransportsContext, tripTransportsGuides } from './contexts/tripTransports'
import { tripMapContext, tripMapGuides } from './contexts/tripMap'
import { tripDayDetailContext, tripDayDetailGuides } from './contexts/tripDayDetail'
import { tripPlaceContext, tripPlaceGuides } from './contexts/tripPlace'

/**
 * Everything the help center knows, composed from one file per screen under
 * `contexts/`. A screen announces which context it is with `<HelpAnchor id>`
 * (or `useHelpContext`), and the panel looks the rest up here.
 */

// The order of the screen switcher: the trip right under My Trips, where it is opened from.
const CONTEXT_LIST: HelpContext[] = [
  dashboardContext,
  // The trip and its own screens, in the order a reader meets them: the three
  // columns of the plan, the two panels that open over it, then the tabs in the
  // order the tab bar has them, and the drive last because an addon decides it.
  tripContext, tripDaysContext, tripPlacesContext, tripMapContext,
  tripPlaceContext, tripDayDetailContext,
  tripTransportsContext, tripBookingsContext, tripListsContext, tripCostsContext, tripFilesContext, tripCollabContext,
  tripRoadtripContext,
  vacayContext, atlasContext, collectionsContext, journeyContext, journalContext, studioContext,
  settingsContext, ...settingsTabContexts, adminContext, ...adminTabContexts,
]
const GUIDE_LIST: HelpGuide[] = [
  ...dashboardGuides, ...vacayGuides, ...atlasGuides, ...collectionsGuides, ...journeyGuides, ...journalGuides, ...studioGuides,
  ...settingsGuides, ...adminGuides,
  ...tripGuides, ...tripDaysGuides, ...tripPlacesGuides, ...tripMapGuides,
  ...tripPlaceGuides, ...tripDayDetailGuides,
  ...tripTransportsGuides, ...tripBookingsGuides, ...tripListsGuides, ...tripCostsGuides, ...tripFilesGuides, ...tripCollabGuides,
  ...tripRoadtripGuides,
]

export const HELP_CONTEXTS: ReadonlyMap<string, HelpContext> = new Map(CONTEXT_LIST.map(c => [c.id, c]))
export const HELP_GUIDES: ReadonlyMap<string, HelpGuide> = new Map(GUIDE_LIST.map(g => [g.id, g]))

export function getHelpContext(id: string | null | undefined): HelpContext | null {
  return id ? (HELP_CONTEXTS.get(id) ?? null) : null
}

export function getHelpGuide(id: string | null | undefined): HelpGuide | null {
  return id ? (HELP_GUIDES.get(id) ?? null) : null
}

/** The guides of a context, in the order the context lists them. */
export function guidesFor(context: HelpContext): HelpGuide[] {
  return context.guides.map(id => HELP_GUIDES.get(id)).filter((g): g is HelpGuide => g !== undefined)
}

export function allHelpGuides(): HelpGuide[] {
  return GUIDE_LIST
}

/** Every screen that has help, in registration order, for the screen switcher. */
export function allHelpContexts(): HelpContext[] {
  return CONTEXT_LIST
}

/** The screens that stand on their own; their sub-screens hang under them in the switcher. */
export function topLevelHelpContexts(): HelpContext[] {
  return CONTEXT_LIST.filter(c => !c.parent)
}

/** The sub-screens of a screen, in registration order. */
export function childHelpContexts(parentId: string): HelpContext[] {
  return CONTEXT_LIST.filter(c => c.parent === parentId)
}

/** The screen and the screens above it, outermost first, for a breadcrumb. */
export function helpContextTrail(context: HelpContext): HelpContext[] {
  const trail: HelpContext[] = [context]
  let parent = context.parent ? HELP_CONTEXTS.get(context.parent) : undefined
  while (parent && !trail.includes(parent)) {
    trail.unshift(parent)
    parent = parent.parent ? HELP_CONTEXTS.get(parent.parent) : undefined
  }
  return trail
}

// ── Catalogue keys ──────────────────────────────────────────────────────────

export const ctxKey = (id: string, part: 'title' | 'summary'): string => `help.ctx.${id}.${part}`
export const ctxBulletKey = (id: string, n: number): string => `help.ctx.${id}.bullet.${n}`
export const guideKey = (id: string, part: 'title' | 'goal' | 'result' | 'link'): string =>
  `help.guide.${id}.${part}`
export const guideStepKey = (id: string, n: number): string => `help.guide.${id}.step.${n}`
export const guideTipKey = (id: string, n: number): string => `help.guide.${id}.tip.${n}`

// ── Media paths ─────────────────────────────────────────────────────────────

/**
 * Generated artwork under `public/help-media/`. WebP and WebM on purpose: the
 * service worker precaches `png`, and a couple of hundred help pictures do not
 * belong in every visitor's first download.
 */
const MEDIA_BASE = '/help-media'

export const helpMedia = {
  hero: (contextId: string): string => `${MEDIA_BASE}/ctx/${contextId}.webp`,
  step: (guideId: string, n: number): string => `${MEDIA_BASE}/${guideId}/step-${n}.webp`,
  result: (guideId: string): string => `${MEDIA_BASE}/${guideId}/result.webp`,
}

/** Wiki route for a doc link, with the heading anchor when the link names one. */
export function docsRoute(link: { slug: string; anchor?: string }): string {
  return `/help/${link.slug}${link.anchor ? `#${link.anchor}` : ''}`
}
