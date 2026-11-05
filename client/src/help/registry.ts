import type { HelpContext, HelpGuide } from './types'
import { useAddonStore } from '../store/addonStore'
import { useAuthStore } from '../store/authStore'
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
import { tripToursContext, tripToursGuides } from './contexts/tripTours'
import { tripTourDetailContext, tripTourDetailGuides } from './contexts/tripTourDetail'
import { tripTourPlannerContext, tripTourPlannerGuides } from './contexts/tripTourPlanner'
import { tripTourImportContext, tripTourImportGuides } from './contexts/tripTourImport'
import { tripTourMapContext, tripTourMapGuides } from './contexts/tripTourMap'
import { tripTourStagesContext, tripTourStagesGuides } from './contexts/tripTourStages'
import { tripTourHikeContext, tripTourHikeGuides } from './contexts/tripTourHike'
import { tripTourWalkContext, tripTourWalkGuides } from './contexts/tripTourWalk'
import { tripTourBikeContext, tripTourBikeGuides } from './contexts/tripTourBike'
import { tripTourSkiContext, tripTourSkiGuides } from './contexts/tripTourSki'
import { tripTourPaddleContext, tripTourPaddleGuides } from './contexts/tripTourPaddle'
import { tripTourHorseContext, tripTourHorseGuides } from './contexts/tripTourHorse'
import { notificationsContext, notificationsGuides } from './contexts/notifications'

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
  // Tours: the list and the card on the Plan tab, then the Tours tab with its
  // jobs and one screen per kind of tour, in the order the type picker has them.
  tripToursContext, tripTourDetailContext,
  tripTourPlannerContext, tripTourImportContext, tripTourMapContext, tripTourStagesContext,
  tripTourHikeContext, tripTourWalkContext, tripTourBikeContext, tripTourSkiContext, tripTourPaddleContext, tripTourHorseContext,
  notificationsContext,
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
  ...tripToursGuides, ...tripTourDetailGuides,
  ...tripTourPlannerGuides, ...tripTourImportGuides, ...tripTourMapGuides, ...tripTourStagesGuides,
  ...tripTourHikeGuides, ...tripTourWalkGuides, ...tripTourBikeGuides, ...tripTourSkiGuides, ...tripTourPaddleGuides, ...tripTourHorseGuides,
  ...notificationsGuides,
]

export const HELP_CONTEXTS: ReadonlyMap<string, HelpContext> = new Map(CONTEXT_LIST.map(c => [c.id, c]))
export const HELP_GUIDES: ReadonlyMap<string, HelpGuide> = new Map(GUIDE_LIST.map(g => [g.id, g]))

/**
 * What a managed install leaves out: the admin screens it hides (AdminPage) and
 * the guides about what the operator runs there, such as keys, OIDC, place
 * search, routing, backups, storage, releases and plugins. A guide that walks
 * somebody through a panel they cannot open is worse than none.
 */
const MANAGED_HIDDEN_CONTEXTS: ReadonlySet<string> = new Set([
  'admin-plugins', 'admin-storage', 'admin-github', 'admin-backup', 'settings-plugins',
])
const MANAGED_HIDDEN_GUIDES: ReadonlySet<string> = new Set([
  'oidc', 'instance-keys', 'places-transit', 'rotate-jwt-secret', 'own-routing-engine',
  'install-plugin', 'storage-backends', 'release-history', 'create-backup', 'auto-backup',
  'plugin-settings', 'files-sync', 'files-sync-settings', 'document-providers',
])

/**
 * Guides about an integration, shown on a managed install only while it is on
 * there: the operator decides which integrations the instance has, and a guide
 * to connect one it does not offer leads nowhere.
 */
const addonOn = (id: string) => (): boolean => useAddonStore.getState().isEnabled(id)
const MANAGED_FEATURE_GUIDES: Readonly<Record<string, () => boolean>> = {
  'connect-dawarich': addonOn('dawarich'),
  'dawarich-countries': addonOn('dawarich'),
  'dawarich-wishes': addonOn('dawarich'),
  'dawarich-stays': addonOn('dawarich'),
  'journey-day-stays': addonOn('dawarich'),
  'map-dawarich-trail': addonOn('dawarich'),
  'connect-airtrail': addonOn('airtrail'),
  'airtrail-import': addonOn('airtrail'),
  'photo-providers': addonOn('memories'),
  'mcp-oauth': addonOn('mcp'),
  'api-keys': addonOn('mcp'),
  'mcp-tokens-admin': addonOn('mcp'),
  'tour-connect-wanderer': () => useAddonStore.getState().toursWanderer,
  'tour-wanderer-watch': () => useAddonStore.getState().toursWanderer,
  'tour-import-wanderer': () => useAddonStore.getState().toursWanderer,
}

/** Read at call time: `managed` arrives with app-config, after the registry loaded. */
const isManaged = (): boolean => useAuthStore.getState().managed
const shownContext = (c: HelpContext): boolean => !(isManaged() && MANAGED_HIDDEN_CONTEXTS.has(c.id))
const shownGuide = (g: HelpGuide): boolean => {
  if (!isManaged()) return true
  if (MANAGED_HIDDEN_GUIDES.has(g.id) || MANAGED_HIDDEN_CONTEXTS.has(g.context)) return false
  const feature = MANAGED_FEATURE_GUIDES[g.id]
  return feature ? feature() : true
}

export function getHelpContext(id: string | null | undefined): HelpContext | null {
  const context = id ? HELP_CONTEXTS.get(id) : undefined
  return context && shownContext(context) ? context : null
}

export function getHelpGuide(id: string | null | undefined): HelpGuide | null {
  const guide = id ? HELP_GUIDES.get(id) : undefined
  return guide && shownGuide(guide) ? guide : null
}

/** The guides of a context, in the order the context lists them. */
export function guidesFor(context: HelpContext): HelpGuide[] {
  return context.guides.map(id => HELP_GUIDES.get(id)).filter((g): g is HelpGuide => g !== undefined && shownGuide(g))
}

export function allHelpGuides(): HelpGuide[] {
  return isManaged() ? GUIDE_LIST.filter(shownGuide) : GUIDE_LIST
}

/** Every screen that has help, in registration order, for the screen switcher. */
export function allHelpContexts(): HelpContext[] {
  return isManaged() ? CONTEXT_LIST.filter(shownContext) : CONTEXT_LIST
}

/** The screens that stand on their own; their sub-screens hang under them in the switcher. */
export function topLevelHelpContexts(): HelpContext[] {
  return CONTEXT_LIST.filter(c => !c.parent && shownContext(c))
}

/** The sub-screens of a screen, in registration order. */
export function childHelpContexts(parentId: string): HelpContext[] {
  return CONTEXT_LIST.filter(c => c.parent === parentId && shownContext(c))
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
  clip: (guideId: string, n: number): string => `${MEDIA_BASE}/${guideId}/step-${n}.loop.webp`,
}

/** Wiki route for a doc link, with the heading anchor when the link names one. */
export function docsRoute(link: { slug: string; anchor?: string }): string {
  return `/help/${link.slug}${link.anchor ? `#${link.anchor}` : ''}`
}
