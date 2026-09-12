import { Injectable } from '@nestjs/common';
import type { RoadtripSearchArea, RoadtripSearchAreaResponse } from '@trek/shared';
import { MapsService } from '../maps/maps.service';
import { PluginHooks } from '../plugins/plugin-hooks.service';
import { pluginsEnabled } from '../plugins/kill-switch';
import { normalizeSearchHits, MAX_HITS } from '../plugins/contributions/plugin-search.helpers';

const queries: Record<string, string> = {
  fuel: 'fuel station', charging: 'EV charging station', rest_area: 'rest area',
  campsite: 'campsite', restaurant: 'restaurant', sights: 'tourist attraction', hotel: 'hotel',
};

@Injectable()
export class RoadtripSearchService {
  constructor(private readonly maps: MapsService, private readonly hooks: PluginHooks) {}

  async search(input: RoadtripSearchArea, userId: number): Promise<RoadtripSearchAreaResponse> {
    const { bbox, lang } = input;
    const categories = [...new Set(input.categories)];
    const providers = pluginsEnabled() ? this.hooks.providersOf('searchProvider') : [];
    const core = this.maps.pois(categories.join(','), bbox, lang);
    const tasks = providers.flatMap(pluginId => categories.map(async category => {
      const raw = await this.hooks.searchPlaces(pluginId, {
        query: queries[category], category, bounds: bbox, lang, limit: MAX_HITS,
        near: { lat: (bbox.south + bbox.north) / 2, lng: (bbox.west + bbox.east) / 2 },
      }, userId);
      if (!Array.isArray(raw)) throw new Error('Invalid plugin search answer');
      const normalized = normalizeSearchHits(pluginId, raw);
      const pois = normalized.filter(p => p.lat >= bbox.south && p.lat <= bbox.north && p.lng >= bbox.west && p.lng <= bbox.east)
        .filter(p => !p.category || !(p.category in queries) || p.category === category)
        .map(p => ({ ...p, category, poi_type: category, opening_hours: null, cuisine: null, charging: null }));
      return { pois, source: `plugin:${pluginId}`, truncated: raw.length >= MAX_HITS || normalized.length < raw.length };
    }));
    const settled = await Promise.allSettled([core, ...tasks]);
    const sources = new Set<string>();
    const failedSources = new Set<string>();
    const pois = new Map<string, RoadtripSearchAreaResponse['pois'][number]>();
    let truncated = false;
    let clamped = false;
    settled.forEach((entry, index) => {
      if (entry.status === 'rejected') {
        failedSources.add(index === 0 ? 'TREK' : `plugin:${providers[Math.floor((index - 1) / categories.length)]}`);
        return;
      }
      sources.add(entry.value.source);
      truncated ||= entry.value.truncated;
      if ('clamped' in entry.value) clamped ||= entry.value.clamped;
      for (const poi of entry.value.pois) pois.set(poi.osm_id, poi);
    });
    return { pois: [...pois.values()], sources: [...sources], failedSources: [...failedSources], truncated, clamped };
  }
}
