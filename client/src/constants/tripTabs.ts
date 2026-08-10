/**
 * The trip planner's core tab ids, in the order the tab bar shows them.
 *
 * These are the German legacy names the planner has always used internally
 * ('buchungen', 'finanzplan', 'dateien', 'listen') — not the English labels.
 * They are what sessionStorage, the ?tab= deep link and the startup-destination
 * setting persist, so renaming one would silently strand saved preferences.
 *
 * Addon-owned tabs are listed here even while their addon is off: useTripPlanner
 * builds TRIP_TABS from what is actually enabled, and anything pointing at a tab
 * that isn't there falls back to the plan view.
 */
export const TRIP_TAB_IDS = [
  'plan',
  'transports',
  'buchungen',
  'listen',
  'finanzplan',
  'dateien',
  'collab',
] as const

export type TripTabId = (typeof TRIP_TAB_IDS)[number]

/**
 * Translation key per tab, so the startup-destination picker in Settings names
 * the tabs exactly as the planner's own tab bar does. useTripPlanner builds its
 * TRIP_TABS from these too — one source, or the two would drift apart the first
 * time a tab is renamed.
 */
export const TRIP_TAB_LABEL_KEYS: Record<TripTabId, string> = {
  plan: 'trip.tabs.plan',
  transports: 'trip.tabs.transports',
  buchungen: 'trip.tabs.reservations',
  listen: 'trip.tabs.lists',
  finanzplan: 'trip.tabs.budget',
  dateien: 'trip.tabs.files',
  collab: 'admin.addons.catalog.collab.name',
}

export const isTripTabId = (value: unknown): value is TripTabId =>
  typeof value === 'string' && (TRIP_TAB_IDS as readonly string[]).includes(value)

/**
 * What `/trips/:id?tab=…` accepts. Trip-page plugins mount as tabs too and are
 * addressable by their `plugin:<id>` form, so a shortcut can point at one — the
 * planner's own guard still drops it if that plugin isn't installed.
 */
export const isDeepLinkableTripTab = (value: string): boolean =>
  isTripTabId(value) || value.startsWith('plugin:')
