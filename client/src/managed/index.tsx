import type { ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * The attachment point for surfaces that only exist on a centrally administered
 * install.
 *
 * Empty here, and empty in every build of this repository. An installation whose
 * operator ships additional screens replaces this file at build time; nothing
 * else in the client changes, because everything below reads from these two
 * exports rather than naming a screen directly.
 *
 * Why it is a file and not a plugin: what belongs here is not a third-party
 * extension living behind a sandbox boundary. It is part of the product for the
 * people who get that product operated for them, and it needs the same
 * components, the same tokens and the same overlays as everything around it. A
 * frame cannot open a dialog past its own edge.
 *
 * Two rules keep this honest:
 *  - Never import from here conditionally at a call site. The arrays are always
 *    read, and they are simply empty, so the public build takes exactly the same
 *    code path as any other.
 *  - Nothing here may be required for TREK to work. Everything below is
 *    additive: routes that are not registered, nav entries that are not shown.
 */

export interface ManagedRoute {
  /** Router path, e.g. `/subscription`. Must not collide with an existing one. */
  path: string
  /** Rendered inside the app's ProtectedRoute wrapper, like every other screen. */
  element: ReactElement
}

export interface ManagedNavItem {
  /** Stable id for React keys; prefixed by the consumer, so keep it bare. */
  id: string
  path: string
  label: string
  /** lucide-react, like every other icon in the app — see the theme README. */
  Icon: LucideIcon
  /**
   * Hide the entry from everyone but an admin.
   *
   * Not cosmetic. What attaches here is the operator's side of the install, and
   * a trip's other travellers are on this instance as guests of the person who
   * runs it — showing them an entry about how it is run is noise at best and
   * confusing at worst. The route behind it still checks for itself; this only
   * decides who is offered the door.
   */
  adminOnly?: boolean
}

/** Filter for the two nav bars. Exported so both apply the same rule. */
export function visibleManagedNavItems(isAdmin: boolean): ManagedNavItem[] {
  return managedNavItems.filter((item) => !item.adminOnly || isAdmin)
}

/** Extra protected routes. Spread into the router next to the built-in ones. */
export const managedRoutes: ManagedRoute[] = []

/** Extra entries for the desktop navbar and the mobile tab bar. */
export const managedNavItems: ManagedNavItem[] = []
