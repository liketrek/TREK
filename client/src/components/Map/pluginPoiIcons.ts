import {
  Accessibility, Bath, Bike, Droplet, Droplets, Footprints, Heart, Info, Landmark, MapPin,
  Mountain, MountainSnow, PlugZap, Signpost, Star, Tent, TentTree, Trees, Waves, Zap,
  type LucideIcon,
} from 'lucide-react'
import { isPluginPoiColor, isPluginPoiIcon, type PluginPoiIcon } from '@trek/shared'

/**
 * How a plugin POI category (#1781) looks: its icon and its colour, resolved in one
 * place for everything that draws one (the explore pill, the Leaflet and GL markers,
 * the hover card and the admin panel).
 *
 * The icon table is keyed by the shared allow-list, so a name added to
 * PLUGIN_POI_ICONS without a component here is a type error rather than a chip
 * without a glyph. Imported one by one, unlike resolvePluginIcon's lookup over the
 * whole lucide module: a plugin names one of twenty shapes, never an arbitrary export.
 */
const PLUGIN_POI_ICON_COMPONENTS: Record<PluginPoiIcon, LucideIcon> = {
  Footprints,
  Mountain,
  MountainSnow,
  Signpost,
  Trees,
  TentTree,
  Tent,
  Accessibility,
  Droplet,
  Droplets,
  PlugZap,
  Zap,
  Bath,
  Bike,
  Waves,
  Landmark,
  MapPin,
  Star,
  Heart,
  Info,
}

/** The grey an unknown POI category has always been drawn in. */
export const POI_DEFAULT_COLOR = '#6b7280'

/** The lucide component for an allow-listed icon name; MapPin for anything else. */
export function resolvePluginPoiIcon(name: unknown): LucideIcon {
  return isPluginPoiIcon(name) ? PLUGIN_POI_ICON_COMPONENTS[name] : MapPin
}

/**
 * The colour to draw, checked again even though the server already did: it ends up
 * inside marker markup and a CSS background, so only a strict `#rrggbb` gets through
 * and anything else is the default grey.
 */
export function pluginPoiColor(value: unknown): string {
  return isPluginPoiColor(value) ? value : POI_DEFAULT_COLOR
}
