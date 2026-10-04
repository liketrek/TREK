import type { JourneyPhoto } from '../../types';
import type { JourneyEntryPhotos } from '../entities/JourneyEntryPhotos.entity';
import type { JourneyPublicGalleryRow } from './JourneyShareTokens.repository';
import { TrekRepository } from './_shared/trek-repository';

/** The narrow `journey_entry_photos`/`journey_photos`/`trek_photos`/`journey_entries` shape the `JP_SELECT`/`JP_JOIN`-shaped reads need. */
interface JourneyPhotoJoinKyselyDB {
  journey_entry_photos: { entry_id: number; journey_photo_id: number; sort_order: number | null; created_at: number };
  journey_photos: { id: number; journey_id: number; photo_id: number; caption: string | null; shared: number | null; sort_order: number | null; created_at: number };
  trek_photos: {
    id: number;
    provider: string;
    asset_id: string | null;
    owner_id: number | null;
    file_path: string | null;
    thumbnail_path: string | null;
    width: number | null;
    height: number | null;
    media_type: string | null;
    duration_ms: number | null;
    taken_at: string | null;
    lat: number | null;
    lng: number | null;
  };
  journey_entries: { id: number; journey_id: number };
}

/** `JP_SELECT`'s exact column list (`journey-domain.service.ts`'s module const), aliased `jep`/`gp`/`tp` — shared by every `JP_SELECT`/`JP_JOIN`-shaped read below. */
const JP_COLUMNS = [
  'gp.id', 'jep.entry_id', 'gp.photo_id', 'gp.caption', 'jep.sort_order', 'gp.shared', 'gp.created_at',
  'tp.provider', 'tp.asset_id', 'tp.owner_id', 'tp.file_path', 'tp.thumbnail_path', 'tp.width', 'tp.height',
  'tp.media_type', 'tp.duration_ms', 'tp.taken_at', 'tp.lat', 'tp.lng',
] as const;

/**
 * JS14 (Plan 4 Task 8b relocation) — `JourneyShareService.getPublicJourney`'s
 * per-entry photo row. Column-for-column identical to `JP_COLUMNS` above
 * (only the widened nullability on a couple of fields to match the public
 * route's original hand-kept shape) — {@link
 * JourneyEntryPhotosRepository.listForPublicJourney} reuses `JP_COLUMNS`
 * rather than a second, hand-duplicated select list. Previously lived as
 * `JourneyShareTokens.repository.ts`'s own `JourneyPublicEntryPhotoRow` +
 * `listEntryPhotosForPublicJourney`, a fallback stub from 3g Task 3 (this
 * repository was still mid-flight when that task landed) — relocated here
 * now that it is stable. Derived from the public gallery row it differs from
 * only in the parent key (`entry_id` for `journey_id`), rather than restating
 * the nineteen columns a second time.
 */
export type JourneyPublicEntryPhotoRow = Omit<JourneyPublicGalleryRow, 'journey_id'> & { entry_id: number };

/**
 * `journey_entry_photos` — the entry↔gallery-photo junction (Plan 3g Task 2,
 * Part B). A genuine TWO-column composite primary key (`entry` +
 * `journeyPhoto`, both `.primary()`, R3 — pinned against
 * `Migration20200101020300_journey_gallery_refactor.ts:41-47`'s
 * `PRIMARY KEY(entry_id, journey_photo_id)` by Task 0). {@link insertIgnore}
 * (JG92) is checked against Task 1's `JourneyTripsRepository.insertIgnore`
 * (the IGNORE-shaped composite-PK reference — `JourneyContributorsRepository
 * .upsertContributor` is R3's OTHER pinned reference, but it is the
 * MERGE/REPLACE-shaped one for JG117; JG92 is `INSERT OR IGNORE`, the same
 * semantics as JG30, so it is checked against THAT reference, per
 * `task-2-report.md`).
 */
export class JourneyEntryPhotosRepository extends TrekRepository<JourneyEntryPhotos> {
  /**
   * JG15/JG72 — `getJourneyFull`'s and `listEntries`'s per-entry photo join:
   * `SELECT {JP_SELECT} FROM {JP_JOIN} WHERE jep.entry_id IN (SELECT id FROM
   * journey_entries WHERE journey_id = ?) ORDER BY jep.sort_order ASC`. The
   * legacy `entry_id IN (subquery)` becomes an inner join to
   * `journey_entries` filtered by `journey_id` — `journey_entries.id` is a
   * plain PK, so the join can never fan a `jep` row out, the same
   * "join can't duplicate" reasoning `JourneysRepository.listForUser`'s
   * docstring gives for its own subquery-shaped legacy WHERE.
   */
  async listForJourney(journeyId: number): Promise<JourneyPhoto[]> {
    const rows = await this.kysely<JourneyPhotoJoinKyselyDB>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .innerJoin('journey_entries as je', 'je.id', 'jep.entry_id')
      .select(JP_COLUMNS)
      .where('je.journey_id', '=', journeyId)
      .orderBy('jep.sort_order', 'asc')
      .execute();
    return rows as JourneyPhoto[];
  }

  /**
   * JG93 — `linkGalleryPhotoToEntry`'s post-insert read: `SELECT {JP_SELECT}
   * FROM {JP_JOIN} WHERE jep.entry_id = ? AND jep.journey_photo_id = ?`.
   * Named `findLink`, not `findOne` — `TrekRepository`/`EntityRepository`
   * already declare `findOne` with MikroORM's own generic signature, the
   * same collision `JourneyContributorsRepository.upsertContributor`'s own
   * docstring names for `upsert`.
   */
  async findLink(entryId: number, journeyPhotoId: number): Promise<JourneyPhoto | undefined> {
    const row = await this.kysely<JourneyPhotoJoinKyselyDB>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(JP_COLUMNS)
      .where('jep.entry_id', '=', entryId)
      .where('jep.journey_photo_id', '=', journeyPhotoId)
      .executeTakeFirst();
    return row as JourneyPhoto | undefined;
  }

  /** JG113 — `updatePhoto`'s return read: `SELECT {JP_SELECT} FROM {JP_JOIN} WHERE gp.id = ? LIMIT 1`. */
  async findOneByGalleryId(galleryId: number): Promise<JourneyPhoto | undefined> {
    const row = await this.kysely<JourneyPhotoJoinKyselyDB>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(JP_COLUMNS)
      .where('gp.id', '=', galleryId)
      .limit(1)
      .executeTakeFirst();
    return row as JourneyPhoto | undefined;
  }

  /**
   * JS14 (Plan 4 Task 8b relocation) — the public `getPublicJourney` route's
   * per-entry photo read: `SELECT {JP_SELECT} FROM {JP_JOIN} WHERE
   * gp.journey_id = ? ORDER BY jep.sort_order`. Filters directly on
   * `gp.journey_id`, NOT via a `journey_entries` join like {@link
   * listForJourney}/JG15/JG72 — a different statement text (the legacy
   * public route never scoped through `journey_entries` at all), so this is
   * a distinct method reusing the same `JP_COLUMNS` select list, not a call
   * to {@link listForJourney}.
   */
  async listForPublicJourney(journeyId: number): Promise<JourneyPublicEntryPhotoRow[]> {
    const rows = await this.kysely<JourneyPhotoJoinKyselyDB>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(JP_COLUMNS)
      .where('gp.journey_id', '=', journeyId)
      .orderBy('jep.sort_order', 'asc')
      .execute();
    return rows as unknown as JourneyPublicEntryPhotoRow[];
  }

  /** JG91 — `linkGalleryPhotoToEntry`'s next-sort-order probe: `SELECT MAX(sort_order) as m FROM journey_entry_photos WHERE entry_id = ?`. */
  async maxSortOrderForEntry(entryId: number): Promise<number | null> {
    const row = await this.kysely<Pick<JourneyPhotoJoinKyselyDB, 'journey_entry_photos'>>()
      .selectFrom('journey_entry_photos')
      .select((eb) => eb.fn.max<number | null>('sort_order').as('m'))
      .where('entry_id', '=', entryId)
      .executeTakeFirst();
    // Plan 4 Task 8b: `row?.` is unreachable — an unqualified, ungrouped
    // `MAX(...)` always returns exactly one row, so `executeTakeFirst()`
    // can't actually miss here. Kept for type-shape symmetry with
    // `executeTakeFirst()`'s `| undefined` return type, same accepted class
    // as `OauthClients:147`. `row.m` itself genuinely can be `null`.
    return row?.m ?? null;
  }

  /**
   * JG92 — `linkGalleryPhotoToEntry`'s `INSERT OR IGNORE INTO
   * journey_entry_photos (entry_id, journey_photo_id, sort_order,
   * created_at) VALUES (?,?,?,?)`, the composite-PK conflict target
   * (`entry`+`journeyPhoto`). `INSERT OR IGNORE` never touches an existing
   * row, so — like Task 1's `JourneyTripsRepository.insertIgnore` (the
   * reference this is checked against) — there is no R3 reset-column trap
   * here.
   */
  async insertIgnore(entryId: number, journeyPhotoId: number, sortOrder: number, createdAt: number): Promise<void> {
    await this.upsert(
      { entry: entryId, journeyPhoto: journeyPhotoId, sort_order: sortOrder, created_at: createdAt },
      { onConflictFields: ['entry', 'journeyPhoto'], onConflictAction: 'ignore' },
    );
  }

  /** JG96 — `addProviderPhoto`'s idempotency guard: `SELECT 1 FROM journey_entry_photos jep JOIN journey_photos gp ON gp.id=jep.journey_photo_id WHERE jep.entry_id=? AND gp.photo_id=?` (`gp.photo_id` is the `trek_photos` id, not the gallery row's own id). */
  async existsLink(entryId: number, trekPhotoId: number): Promise<boolean> {
    const row = await this.kysely<Pick<JourneyPhotoJoinKyselyDB, 'journey_entry_photos' | 'journey_photos'>>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .select('jep.entry_id')
      .where('jep.entry_id', '=', entryId)
      .where('gp.photo_id', '=', trekPhotoId)
      .executeTakeFirst();
    return !!row;
  }

  /**
   * JG112 — `updatePhoto`'s sort-order write: `UPDATE journey_entry_photos
   * SET sort_order = ? WHERE journey_photo_id = ?`. **The gotcha the file's
   * own doc comment calls out**: `sort_order` for the entry↔photo junction
   * lives on THIS table, not `journey_photos` (`JourneyPhotosRepository`'s
   * `sort_order` column is a different value, the gallery's own display
   * order) — `updatePhoto`'s caption write (JG111) and this one target two
   * DIFFERENT tables for two DIFFERENT columns both named "sort order".
   * Unscoped by `entry_id` on purpose (matching the legacy statement
   * exactly): a gallery photo linked to more than one entry has every link
   * row's `sort_order` updated together.
   */
  async updateSortOrder(journeyPhotoId: number, sortOrder: number): Promise<void> {
    await this.nativeUpdate({ journeyPhoto: journeyPhotoId }, { sort_order: sortOrder });
  }

  /** JG104 — `unlinkPhotoFromEntry`: `DELETE FROM journey_entry_photos WHERE entry_id=? AND journey_photo_id=?`. Returns the affected-row count — the SERVICE branches on `changes > 0`, unchanged. */
  async deleteLink(entryId: number, journeyPhotoId: number): Promise<number> {
    return await this.nativeDelete({ entry: entryId, journeyPhoto: journeyPhotoId });
  }

  /**
   * JG69 — `journeyStats`'s "a photograph per stop" source: the entry's own
   * linked photos, earliest first, videos excluded (a video poster inside a
   * four-millimetre map marker "is not a photograph" per the doc comment).
   * The SERVICE keeps only the FIRST row per `entryId` (a `Map` that only
   * sets on first-seen, relying on this method's own ordering) — this
   * method returns every row, unchanged.
   */
  async listFirstPhotoPerEntry(journeyId: number): Promise<{ entryId: number; photoId: number }[]> {
    const rows = await this.kysely<JourneyPhotoJoinKyselyDB>()
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_photos as gp', 'gp.id', 'jep.journey_photo_id')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(['jep.entry_id as entryId', 'gp.photo_id as photoId'])
      .where('gp.journey_id', '=', journeyId)
      .where((eb) => eb.or([eb('tp.media_type', 'is', null), eb('tp.media_type', '=', 'image')]))
      .orderBy('jep.entry_id', 'asc')
      .orderBy('jep.sort_order', 'asc')
      .orderBy('gp.sort_order', 'asc')
      .orderBy('gp.id', 'asc')
      .execute();
    return rows as { entryId: number; photoId: number }[];
  }

  /** JG126 — `reorderEntryPhotos`'s held-set read: `SELECT journey_photo_id FROM journey_entry_photos WHERE entry_id = ?`. */
  async listPhotoIdsForEntry(entryId: number): Promise<number[]> {
    const rows = await this.kysely<Pick<JourneyPhotoJoinKyselyDB, 'journey_entry_photos'>>()
      .selectFrom('journey_entry_photos')
      .select('journey_photo_id')
      .where('entry_id', '=', entryId)
      .execute();
    return rows.map((r) => r.journey_photo_id);
  }

  /**
   * JG127 — `reorderEntryPhotos`'s per-photo write (#824): `UPDATE journey_entry_photos SET
   * sort_order = ? WHERE entry_id = ? AND journey_photo_id = ?`. Scoped to this entry's own
   * link, unlike {@link updateSortOrder} (JG112): a photo that also sits on another entry
   * keeps its place there.
   */
  async updateEntryLinkSortOrder(entryId: number, journeyPhotoId: number, sortOrder: number): Promise<void> {
    await this.nativeUpdate({ entry: entryId, journeyPhoto: journeyPhotoId }, { sort_order: sortOrder });
  }
}
