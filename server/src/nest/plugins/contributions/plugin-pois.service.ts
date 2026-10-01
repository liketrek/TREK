import { Injectable } from '@nestjs/common';
import {
  PLUGIN_POI_HIT_CAP,
  pluginPoiCategoryKey,
  pluginPoiCategoryLabel,
  type PluginPoiCategory,
  type PluginPoiResponse,
} from '@trek/shared';
import { DatabaseService } from '../../database/database.service';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { poiCategoriesOf } from '../poi-categories';
import { sanitiseAssistantText } from '../text-sanitize';
import { normalizePluginPois, pluginPoiWindow } from './plugin-pois.helpers';

/** One search for a plugin POI category, as both the REST route and the MCP tool ask it. */
export interface PluginPoiSearch {
  pluginId: string;
  category: string;
  bbox: { south: number; west: number; north: number; east: number };
  lang?: string;
}

/** A category the explore pill can offer right now, with the plugin that answers it. */
export interface AvailablePoiCategory {
  /** The pill key, `plugin:<pluginId>/<categoryId>`. */
  key: string;
  pluginId: string;
  pluginName: string;
  /** The plugin-local id, what `search_plugin_pois` takes as `category`. */
  id: string;
  /** In the requested language where the plugin ships one. */
  label: string;
  icon: PluginPoiCategory['icon'];
  color: string;
}

export type PluginPoiOutcome =
  | { ok: true; result: PluginPoiResponse }
  | { ok: false; status: 404 | 502; error: string };

export const UNKNOWN_POI_CATEGORY = 'Unknown POI category';

// The manifest only asks for a non-empty name, and list_plugin_poi_categories hands it
// to an assistant once per category, so it gets the same flattening and cap as a
// plugin's tool title before it goes there.
const PLUGIN_NAME_MAX = 80;

/**
 * The plugin POI categories (#1781): which ones exist, and asking the plugin that
 * declared one for its places in a map area.
 *
 * A category is only ever answered by the plugin that declared it, and only while
 * that plugin is a provider (active, implements `poiCategoryProvider`, holds
 * `hook:poi-category-provider`) and still declares it in its signed manifest. Both
 * checks are re-read per request, like the route profiles next door, so a plugin
 * deactivated mid-session answers 404 rather than whatever it said last.
 *
 * Nothing is cached. The hook runs as the requesting user, so a provider may filter
 * by that user's own settings (a wheelchair profile, say), and the shared POI cache of
 * the core path is keyed by area alone.
 */
@Injectable()
export class PluginPoisService {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly dbs: DatabaseService,
  ) {}

  /** Every category a provider currently answers, in the order the feed lists plugins. */
  available(language = 'en'): AvailablePoiCategory[] {
    if (!pluginsEnabled()) return [];
    const providers = new Set(this.hooks.providersOf('poiCategoryProvider'));
    if (providers.size === 0) return [];
    const rows = this.dbs.all<{ id: string; name: string; capabilities: string | null }>(
      "SELECT id, name, capabilities FROM plugins WHERE status = 'active' ORDER BY sort_order, name",
    );
    return rows
      .filter((row) => providers.has(row.id))
      .flatMap((row) => {
        const pluginName = sanitiseAssistantText(row.name, PLUGIN_NAME_MAX) || row.id;
        return poiCategoriesOf(row.capabilities).map((c) => ({
          key: pluginPoiCategoryKey(row.id, c.id),
          pluginId: row.id,
          pluginName,
          id: c.id,
          label: pluginPoiCategoryLabel(c, language),
          icon: c.icon,
          color: c.color,
        }));
      });
  }

  /** The declaration behind (pluginId, categoryId), or null when there is none to answer. */
  declared(pluginId: string, categoryId: string): PluginPoiCategory | null {
    if (!pluginsEnabled()) return null;
    if (!this.hooks.providersOf('poiCategoryProvider').includes(pluginId)) return null;
    const row = this.dbs.get<{ capabilities: string | null }>('SELECT capabilities FROM plugins WHERE id = ?', pluginId);
    return poiCategoriesOf(row?.capabilities).find((c) => c.id === categoryId) ?? null;
  }

  async search(input: PluginPoiSearch, userId: number): Promise<PluginPoiOutcome> {
    const category = this.declared(input.pluginId, input.category);
    if (!category) return { ok: false, status: 404, error: UNKNOWN_POI_CATEGORY };

    const { bounds, clamped } = pluginPoiWindow(input.bbox);
    let raw: unknown;
    try {
      raw = await this.hooks.categoryPois(
        input.pluginId,
        { category: category.id, bounds, ...(input.lang ? { lang: input.lang } : {}), limit: PLUGIN_POI_HIT_CAP },
        userId,
      );
    } catch {
      // A timeout, a crash or a thrown error. The chip shows its error dot; the core
      // categories are separate requests and never wait on this one.
      return { ok: false, status: 502, error: 'The plugin did not answer' };
    }
    if (!Array.isArray(raw)) return { ok: false, status: 502, error: 'The plugin sent an invalid answer' };

    const { pois, truncated } = normalizePluginPois(input.pluginId, category, bounds, raw);
    return { ok: true, result: { pois, source: `plugin:${input.pluginId}`, truncated, clamped } };
  }
}
