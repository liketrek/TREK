import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { pluginPoiCategoryKey, pluginPoiCategoryLabel } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { usePluginStore, type ActivePlugin } from '../../store/pluginStore'
import { POI_CATEGORIES } from './poiCategories'
import { pluginPoiColor, resolvePluginPoiIcon } from './pluginPoiIcons'

/**
 * One chip of the explore pill, core or plugin, ready to draw: the label is already
 * in the user's language and the colour and icon are already checked.
 */
export interface ExplorePoiCategory {
  /** A core key (`restaurant`) or a plugin key (`plugin:<pluginId>/<categoryId>`). */
  key: string
  label: string
  Icon: LucideIcon
  color: string
  /** The plugin that added the chip; absent on a core category. */
  pluginId?: string
}

/** The pill's chips in drawing order: the core ones, then what plugins added. */
export interface PoiCategoryGroups {
  core: ExplorePoiCategory[]
  plugin: ExplorePoiCategory[]
}

/** The core categories with their translated labels. */
export function corePoiCategories(t: (key: string) => string): ExplorePoiCategory[] {
  return POI_CATEGORIES.map(({ key, labelKey, Icon, color }) => ({ key, label: t(labelKey), Icon, color }))
}

/**
 * Every category the active plugins declared, in feed order and then declaration
 * order. The label is the plugin's own text for `language`, falling back to its
 * default; the colour and icon go through the same checks as a plugin POI's pin, so a
 * value that slipped past the store still cannot reach the pill's markup.
 */
export function pluginPoiCategories(plugins: readonly ActivePlugin[], language: string): ExplorePoiCategory[] {
  return plugins.flatMap(plugin => (plugin.poiCategories ?? []).map(category => ({
    key: pluginPoiCategoryKey(plugin.id, category.id),
    label: pluginPoiCategoryLabel(category, language),
    Icon: resolvePluginPoiIcon(category.icon),
    color: pluginPoiColor(category.color),
    pluginId: plugin.id,
  })))
}

/** The chip behind `key`, core or plugin; undefined when neither group has it. */
export function findPoiCategory(groups: PoiCategoryGroups, key: string): ExplorePoiCategory | undefined {
  return groups.core.find(c => c.key === key) ?? groups.plugin.find(c => c.key === key)
}

/**
 * The explore pill's categories: the fixed core list and whatever the active plugins
 * add (#1781). One hook for the desktop planner and the phone map, so the two can
 * never offer different chips; it follows the plugin feed, so a plugin switched off
 * in the admin panel takes its chips with it.
 */
export function usePoiCategories(): PoiCategoryGroups {
  const { t, language } = useTranslation()
  const plugins = usePluginStore(s => s.plugins)
  const core = useMemo(() => corePoiCategories(t), [t])
  const plugin = useMemo(() => pluginPoiCategories(plugins, language), [plugins, language])
  return useMemo(() => ({ core, plugin }), [core, plugin])
}
