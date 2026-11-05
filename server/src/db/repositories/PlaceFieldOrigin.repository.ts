import type { PlaceFieldOrigin } from '../entities/PlaceFieldOrigin.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type OriginKyselyDB = Pick<DB, 'place_field_origin' | 'places' | 'place_details_cache'>;

/** Where one field of a place got its current value, and the hash of that value. */
interface PlaceOriginRow {
  field: string;
  origin: string;
  value_hash: string;
}

/** One origin as it is written. */
export interface PlaceOriginWrite {
  place_id: number;
  field: string;
  origin: string;
  value_hash: string;
  updated_at: string;
}

/** The columns of a place the origin tracking and the contribution read: its shareable details and what names it. */
export interface PlaceShareableRow {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  osm_id: string | null;
  google_place_id: string | null;
  amap_poi_id: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  description: string | null;
  image_url: string | null;
}

/** One cached details record: the provider id it is keyed by, its kind (0 lean, 1 expanded, 2 enrichment), the JSON. */
export interface CachedProviderPayload {
  place_id: string;
  expanded: number;
  payload_json: string;
}

const SHAREABLE_COLUMNS = [
  'id',
  'name',
  'lat',
  'lng',
  'address',
  'osm_id',
  'google_place_id',
  'amap_poi_id',
  'website',
  'phone',
  'email',
  'opening_hours',
  'description',
  'image_url',
] as const;

/**
 * `place_field_origin`: per place and shareable field, who set the value it
 * holds (the user, a provider, the assistant, a plugin, an import, an
 * attachment) and the hash of that value. A row whose hash no longer matches
 * the column describes a value that is gone and counts as unknown.
 *
 * The two reads on other tables are the ones the origin rules need next to it:
 * the place's own shareable columns, and the provider records this instance
 * cached for the place's ids, so a value claimed as typed can be checked
 * against what a provider handed out.
 */
export class PlaceFieldOriginRepository extends TrekRepository<PlaceFieldOrigin> {
  private db() {
    return this.kysely<OriginKyselyDB>();
  }

  /** The place's shareable columns, or null when there is no such place. */
  async placeValues(placeId: number): Promise<PlaceShareableRow | null> {
    const row = await this.db()
      .selectFrom('places')
      .select([...SHAREABLE_COLUMNS])
      .where('id', '=', placeId)
      .executeTakeFirst();
    return row ?? null;
  }

  /** The shareable columns of several places, for an import that recorded them all at once. */
  async placeValuesMany(placeIds: number[]): Promise<PlaceShareableRow[]> {
    if (placeIds.length === 0) return [];
    return this.db()
      .selectFrom('places')
      .select([...SHAREABLE_COLUMNS])
      .where('id', 'in', placeIds)
      .execute();
  }

  async originsOf(placeId: number): Promise<PlaceOriginRow[]> {
    return this.db()
      .selectFrom('place_field_origin')
      .select(['field', 'origin', 'value_hash'])
      .where('place_id', '=', placeId)
      .execute();
  }

  /** Writes the origins in one statement; a field that has one already gets the new one. */
  async upsertOrigins(rows: PlaceOriginWrite[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db()
      .insertInto('place_field_origin')
      .values(rows)
      .onConflict((oc) =>
        oc.columns(['place_id', 'field']).doUpdateSet({
          origin: (eb) => eb.ref('excluded.origin'),
          value_hash: (eb) => eb.ref('excluded.value_hash'),
          updated_at: (eb) => eb.ref('excluded.updated_at'),
        }),
      )
      .execute();
  }

  /** Forgets the origins of these fields of a place, for a value that was cleared. */
  async deleteOrigins(placeId: number, fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    const result = await this.db()
      .deleteFrom('place_field_origin')
      .where('place_id', '=', placeId)
      .where('field', 'in', fields)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * The details records this instance cached for these provider ids (Google,
   * Amap, OpenStreetMap, the TREK index), every language and kind, as stored.
   */
  async cachedProviderPayloads(providerIds: string[]): Promise<CachedProviderPayload[]> {
    if (providerIds.length === 0) return [];
    return this.db()
      .selectFrom('place_details_cache')
      .select(['place_id', 'expanded', 'payload_json'])
      .where('place_id', 'in', providerIds)
      .execute();
  }
}
