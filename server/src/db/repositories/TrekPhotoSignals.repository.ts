import type { TrekPhotoSignals } from '../entities/TrekPhotoSignals.entity';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';
import { TrekRepository } from './_shared/trek-repository';

type SignalsDB = Pick<DB, 'trek_photo_signals' | 'trek_photos' | 'journey_photos'>;

/** What one measurement of a photo found; a null is a signal that could not be measured. */
export interface TrekPhotoSignalWrite {
  photo_id: number;
  algo: number;
  phash: string | null;
  sharpness: number | null;
  luma: number | null;
  clipped: number | null;
  orig_width: number | null;
  orig_height: number | null;
  /** The main colours as JSON of up to five `"#rrggbb:share"`; absent or null when not measured. */
  palette?: string | null;
  /** An 8 x 8 grid of edge density, one hex digit per cell, row by row. */
  busy?: string | null;
  /** Where the detail gathers, 0 to 1 of each side. */
  sal_x?: number | null;
  sal_y?: number | null;
}

/** A stored measurement, with when it was made. */
export interface TrekPhotoSignalRow extends TrekPhotoSignalWrite {
  computed_at: string;
}

/** A photo of a journey's gallery as the photo picker reads it: no bytes, no paths. */
export interface GalleryPhotoFacts {
  photo_id: number;
  caption: string | null;
  provider: string;
  media_type: string;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
}

/** SQLite binds at most so many values per statement; a gallery can hold more photos. */
const IN_CHUNK = 400;

/**
 * `trek_photo_signals`: what a photo's pixels say, one row per photo, written
 * by `PhotoSignalsService` once its worker has measured the photo and read
 * again whenever photos are picked for a book. A new measurement of a photo
 * replaces the old one (upsert on `photo_id`).
 */
export class TrekPhotoSignalsRepository extends TrekRepository<TrekPhotoSignals> {
  private db() {
    return this.kysely<SignalsDB>();
  }

  /** The measurements stored for these photos, whatever version made them; a photo without one is left out. */
  async listForPhotos(photoIds: number[]): Promise<TrekPhotoSignalRow[]> {
    const chunks = Array.from({ length: Math.ceil(photoIds.length / IN_CHUNK) }, (_, i) =>
      photoIds.slice(i * IN_CHUNK, (i + 1) * IN_CHUNK),
    );
    const found = await Promise.all(
      chunks.map((chunk) =>
        this.db()
          .selectFrom('trek_photo_signals')
          .select([
            'photo_id',
            'algo',
            'phash',
            'sharpness',
            'luma',
            'clipped',
            'orig_width',
            'orig_height',
            'computed_at',
            'palette',
            'busy',
            'sal_x',
            'sal_y',
          ])
          .where('photo_id', 'in', chunk)
          .execute(),
      ),
    );
    return found.flat();
  }

  /** Stores a measurement, replacing the photo's earlier one. */
  async saveSignals(row: TrekPhotoSignalWrite): Promise<void> {
    const computedAt = dbNow();
    await this.db()
      .insertInto('trek_photo_signals')
      .values({ ...row, ...colours(row), computed_at: computedAt })
      .onConflict((oc) =>
        oc.column('photo_id').doUpdateSet({
          algo: row.algo,
          phash: row.phash,
          sharpness: row.sharpness,
          luma: row.luma,
          clipped: row.clipped,
          orig_width: row.orig_width,
          orig_height: row.orig_height,
          ...colours(row),
          computed_at: computedAt,
        }),
      )
      .execute();
  }

  /**
   * The photos of a journey's gallery with what their rows know about them
   * (capture time and place, size, kind), in gallery order. The size is a
   * thumbnail's for an uploaded photo and none for a provider's: good for the
   * shape, never for print.
   */
  async listGalleryFacts(journeyId: number): Promise<GalleryPhotoFacts[]> {
    return await this.db()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select([
        'gp.photo_id',
        'gp.caption',
        'tp.provider',
        'tp.media_type',
        'tp.width',
        'tp.height',
        'tp.taken_at',
        'tp.lat',
        'tp.lng',
      ])
      .where('gp.journey_id', '=', journeyId)
      .orderBy('gp.sort_order', 'asc')
      .orderBy('gp.id', 'asc')
      .execute();
  }
}

/** The colour signals of a measurement, null where it has none, so an update never keeps an older one's. */
function colours(row: TrekPhotoSignalWrite) {
  return {
    palette: row.palette ?? null,
    busy: row.busy ?? null,
    sal_x: row.sal_x ?? null,
    sal_y: row.sal_y ?? null,
  };
}
