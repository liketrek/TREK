import type { ComponentType } from 'react'
import {
  AlertTriangle, ArrowRight, Bell, Bot, CalendarDays, Clock, Database, FileText, Image, LayoutDashboard, ListChecks,
  LocateFixed, Luggage, MapPin, MapPinned, Navigation, Palette, Pencil, Radio, Route, Search, Tag, Users, Wallet,
  type LucideIcon,
} from 'lucide-react'
import { pluginPoiCategoryLabel } from '@trek/shared'
import { readPoiCategories } from '../../store/pluginStore'
import { pluginPoiColor, resolvePluginPoiIcon } from '../Map/pluginPoiIcons'

/**
 * A plugin's reach as the admin panel shows it: the capability chips on an installed
 * row and the access list of the detail view. One module for the desktop panel and
 * the phone panel, so the two can never tell an admin different things about the same
 * plugin; each shell only decides where the chips sit and how they look.
 */

type Translate = (key: string) => string

export interface PluginCap {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  /** A host the plugin may call out to, drawn in the network tone. */
  net?: boolean
}

/** The part of a plugin's declared capabilities the chips read. */
export interface PluginCapsSlice {
  widget?: { slot?: string }
  tripPage?: { replaces?: string[] }
}

/** The grant that puts a plugin's own categories into the map's explore pill (#1781). */
export const POI_CATEGORY_PERMISSION = 'hook:poi-category-provider'

interface ChipRule {
  icon: LucideIcon
  key: string
  held: (perms: readonly string[]) => boolean
}

const has = (perm: string) => (perms: readonly string[]) => perms.includes(perm)

// What the plugin may read and write, listed before its widget.
const DATA_CHIPS: readonly ChipRule[] = [
  { icon: Database, key: 'admin.plugins.cap.readsTrips', held: has('db:read:trips') },
  { icon: Users, key: 'admin.plugins.cap.readsUsers', held: has('db:read:users') },
  { icon: Wallet, key: 'admin.plugins.cap.writesCosts', held: has('db:write:costs') },
  // Writing costs includes reading them, so only the wider grant gets a chip.
  {
    icon: Wallet,
    key: 'admin.plugins.cap.readsCosts',
    held: perms => perms.includes('db:read:costs') && !perms.includes('db:write:costs'),
  },
  { icon: Luggage, key: 'admin.plugins.cap.readsPacking', held: has('db:read:packing') },
  { icon: FileText, key: 'admin.plugins.cap.readsFiles', held: has('db:read:files') },
  { icon: MapPin, key: 'admin.plugins.cap.writesPlaces', held: has('db:write:places') },
  { icon: CalendarDays, key: 'admin.plugins.cap.writesDays', held: has('db:write:days') },
  { icon: ListChecks, key: 'admin.plugins.cap.writesItinerary', held: has('db:write:itinerary') },
  { icon: Pencil, key: 'admin.plugins.cap.writesTrips', held: has('db:write:trips') },
  { icon: Tag, key: 'admin.plugins.cap.metadata', held: has('db:meta') },
]

// What it adds to TREK or answers for it, listed after its widget.
const HOOK_CHIPS: readonly ChipRule[] = [
  { icon: Bot, key: 'admin.plugins.cap.mcpTools', held: has('mcp:tools') },
  { icon: Radio, key: 'admin.plugins.cap.realtime', held: perms => perms.some(p => p.startsWith('ws:broadcast')) },
  { icon: Image, key: 'admin.plugins.cap.photos', held: has('hook:photo-provider') },
  { icon: CalendarDays, key: 'admin.plugins.cap.calendar', held: has('hook:calendar-source') },
  { icon: MapPin, key: 'admin.plugins.cap.placeDetails', held: has('hook:place-detail-provider') },
  { icon: Search, key: 'admin.plugins.cap.search', held: has('hook:search-provider') },
  { icon: MapPinned, key: 'admin.plugins.cap.poiCategories', held: has(POI_CATEGORY_PERMISSION) },
  { icon: AlertTriangle, key: 'admin.plugins.cap.warnings', held: has('hook:trip-warning-provider') },
  { icon: Route, key: 'admin.plugins.cap.mapLayers', held: has('hook:map-layer-provider') },
  { icon: Navigation, key: 'admin.plugins.cap.routing', held: has('hook:route-provider') },
  { icon: Clock, key: 'admin.plugins.cap.daySchedule', held: has('hook:day-schedule-provider') },
  { icon: Palette, key: 'admin.plugins.cap.dayTint', held: has('hook:day-tint-provider') },
  { icon: LocateFixed, key: 'admin.plugins.cap.geolocation', held: has('geolocation:read') },
  { icon: Bell, key: 'admin.plugins.cap.notificationChannel', held: has('hook:notification-channel') },
  { icon: Radio, key: 'admin.plugins.cap.events', held: has('events:subscribe') },
]

// A Map rather than an object literal, so a slot named after an Object.prototype
// member reads as an unknown slot instead of as that member.
const WIDGET_SLOT_KEYS: ReadonlyMap<string, string> = new Map([
  ['hero', 'admin.plugins.cap.heroWidget'],
  ['place-detail', 'admin.plugins.cap.placeSlot'],
  ['day-detail', 'admin.plugins.cap.daySlot'],
  ['reservation-detail', 'admin.plugins.cap.reservationSlot'],
])

const OUTBOUND = 'http:outbound:'

/**
 * A plugin's declared permissions and capabilities as the at-a-glance chips that
 * make its real reach legible without opening the detail view.
 */
export function deriveCaps(perms: readonly string[], caps: PluginCapsSlice, t: Translate): PluginCap[] {
  const chip = (rule: ChipRule): PluginCap => ({ icon: rule.icon, label: t(rule.key) })
  const out = DATA_CHIPS.filter(rule => rule.held(perms)).map(chip)
  if (caps.widget) {
    out.push({ icon: LayoutDashboard, label: t(WIDGET_SLOT_KEYS.get(caps.widget.slot ?? '') ?? 'admin.plugins.cap.widget') })
  }
  // Replacing planner tabs is the one capability that hides core UI, so it always gets a chip.
  if (caps.tripPage?.replaces?.length) out.push({ icon: LayoutDashboard, label: t('admin.plugins.cap.replacesTabs') })
  out.push(...HOOK_CHIPS.filter(rule => rule.held(perms)).map(chip))
  for (const perm of perms) {
    const host = perm.startsWith(OUTBOUND) ? perm.slice(OUTBOUND.length) : ''
    if (host) out.push({ icon: ArrowRight, label: host, net: true })
  }
  return out
}

/** One explore-pill category a plugin declares, ready for the admin panel to draw. */
export interface DeclaredPoiCategory {
  id: string
  label: string
  Icon: LucideIcon
  color: string
}

/**
 * The explore-pill categories a plugin declares (#1781), the way its users would get
 * them: checked again against the shared schema by the reader the plugin feed goes
 * through, labelled in the admin's language, with the icon taken from the allow-list
 * and the colour checked before it becomes a CSS value. Empty unless the plugin also
 * asks for the grant, because without it the feed never serves the categories.
 */
export function declaredPoiCategories(
  pluginId: string,
  perms: readonly string[],
  raw: unknown,
  language: string,
): DeclaredPoiCategory[] {
  if (!perms.includes(POI_CATEGORY_PERMISSION)) return []
  return readPoiCategories(pluginId, raw).map(category => ({
    id: category.id,
    label: pluginPoiCategoryLabel(category, language),
    Icon: resolvePluginPoiIcon(category.icon),
    color: pluginPoiColor(category.color),
  }))
}
