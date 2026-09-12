import { Injectable } from '@nestjs/common';
import { hazardGeometrySchema, roadtripHazardSchema, type RoadtripHazard, type RoadtripHazards } from '@trek/shared';
import { z } from 'zod';
import { readCappedJson } from '../../utils/cappedFetch';

const collection = z.object({
  type: z.literal('FeatureCollection'), features: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(), geometry: z.unknown(), properties: z.record(z.string(), z.unknown()),
  })).max(1000), numberMatched: z.union([z.number(), z.string()]).optional(),
});
const dwdProperties = z.object({
  HEADLINE: z.string(), DESCRIPTION: z.string().nullish(), SENT: z.string(), EXPIRES: z.string(),
});
const gdacsProperties = z.object({
  eventtype: z.string().regex(/^[A-Z]{2}$/), eventid: z.number().int().positive(), episodeid: z.number().int().nonnegative(),
  episodealertscore: z.number().finite().nonnegative().optional().catch(undefined),
  alertscore: z.number().finite().nonnegative().optional().catch(undefined),
  name: z.string(), description: z.string(), datemodified: z.string(), iscurrent: z.union([z.string(), z.boolean()]),
});
const utc = (date: string) => new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(date) ? date : `${date}Z`).toISOString();

async function fetchCollection(url: string) {
  const fetched = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!fetched.ok) { await fetched.body?.cancel(); throw new Error('Hazard source unavailable'); }
  return collection.parse(await readCappedJson<unknown>(fetched, 8_000_000));
}

@Injectable()
export class RoadtripHazardsService {
  private cached?: RoadtripHazards;
  private pending?: Promise<RoadtripHazards>;

  async read(): Promise<RoadtripHazards> {
    if (this.cached && Date.now() - Date.parse(this.cached.fetchedAt) < 600000) return this.cached;
    if (this.pending !== undefined) return this.pending;
    this.pending = this.load();
    try { this.cached = await this.pending; return this.cached; }
    finally { this.pending = undefined; }
  }

  private async load(): Promise<RoadtripHazards> {
    const loaded = await Promise.allSettled([this.dwd(), this.gdacs()]);
    return {
      fetchedAt: new Date().toISOString(),
      hazards: loaded.flatMap(entry => entry.status === 'fulfilled' ? entry.value.hazards : []),
      sources: loaded.map((entry, index) => ({ source: index === 0 ? 'DWD' : 'GDACS', status: entry.status === 'fulfilled' ? entry.value.status : 'unavailable' })),
    };
  }

  private async dwd() {
    const feed = await fetchCollection('https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=dwd:Warnungen_Gemeinden_vereinigt&outputFormat=application/json&srsName=CRS:84&count=500');
    const hazards: RoadtripHazard[] = [];
    let partial = Number(feed.numberMatched) > feed.features.length;
    for (const [index, feature] of feed.features.entries()) {
      try {
        const props = dwdProperties.parse(feature.properties);
        if (Date.parse(props.EXPIRES) <= Date.now()) continue;
        hazards.push(roadtripHazardSchema.parse({
          id: `dwd-${feature.id ?? index}`, source: 'DWD', title: props.HEADLINE, description: props.DESCRIPTION ?? '',
          updatedAt: utc(props.SENT), validUntil: utc(props.EXPIRES),
          url: 'https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html', geometry: feature.geometry,
        }));
      } catch { partial = true; }
    }
    return { hazards, status: partial ? 'partial' as const : 'ok' as const };
  }

  private async gdacs() {
    const feed = await fetchCollection('https://www.gdacs.org/gdacsapi/api/events/geteventlist/events4app');
    const hazards: RoadtripHazard[] = [];
    let partial = feed.features.length >= 100;
    const current = feed.features.filter(feature => feature.properties.iscurrent === 'true' || feature.properties.iscurrent === true);
    for (const feature of current) {
      try {
        const props = gdacsProperties.parse(feature.properties);
        hazards.push(roadtripHazardSchema.parse({
          id: `gdacs-${props.eventtype}-${props.eventid}-${props.episodeid}`, source: 'GDACS',
          title: props.name, description: props.description, updatedAt: utc(props.datemodified), validUntil: null,
          url: `https://www.gdacs.org/report.aspx?eventtype=${props.eventtype}&eventid=${props.eventid}&episodeid=${props.episodeid}`,
          geometry: feature.geometry,
          alertScore: props.episodealertscore ?? props.alertscore,
        }));
      } catch { partial = true; }
    }
    const areas = hazards.filter(hazard => /^gdacs-(FL|WF|TC)-/.test(hazard.id));
    if (areas.length > 12) partial = true;
    await Promise.all(areas.slice(0, 12).map(async hazard => {
      const [, eventtype, eventid, episodeid] = hazard.id.split('-');
      try {
        const shapes = await fetchCollection(`https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=${eventtype}&eventid=${eventid}&episodeid=${episodeid}`);
        const polygons = shapes.features.filter(feature => feature.properties.Class === 'Poly_Affected').flatMap(feature => {
          const parsed = hazardGeometrySchema.safeParse(feature.geometry);
          if (!parsed.success) { partial = true; return []; }
          return parsed.data.type === 'Polygon' ? [parsed.data.coordinates] : parsed.data.type === 'MultiPolygon' ? parsed.data.coordinates : [];
        });
        if (polygons.length) hazard.geometry = hazardGeometrySchema.parse({ type: 'MultiPolygon', coordinates: polygons });
      } catch { partial = true; }
    }));
    return { hazards, status: partial ? 'partial' as const : 'ok' as const };
  }
}
