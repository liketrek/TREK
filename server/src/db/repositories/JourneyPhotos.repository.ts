import type { Platform } from '@mikro-orm/core';
import type { ExpressionBuilder } from 'kysely';
import type { GalleryPhoto } from '../../types';
import type { JourneyPhotos } from '../entities/JourneyPhotos.entity';
import { concatKysely, unixEpochToIsoKysely } from '../dialect/sql-functions';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** `SELECT * FROM journey_photos WHERE id = ?`'s row (JG105) — every scalar column of the entity. */
export interface JourneyPhotoFullRow {
  id: number;
  journey_id: number;
  photo_id: number;
  caption: string | null;
  shared: number | null;
  sort_order: number | null;
  provider: string | null;
  asset_id: string | null;
  owner_id: number | null;
  created_at: number;
}

const _journeyPhotoFullRowKeys: AssertRowKeys<JourneyPhotoFullRow, JourneyPhotos> = true;

/** The narrow `journey_photos`/`trek_photos`/`journey_entry_photos`/`journey_entries` shape the gallery reads (JG19/JG101/JG102, `galleryChronologicalOrderExpr`) need. */
interface GalleryKyselyDB {
  journey_photos: {
    id: number;
    journey_id: number;
    photo_id: number;
    caption: string | null;
    shared: number | null;
    sort_order: number | null;
    created_at: number;
  };
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
  journey_entry_photos: { entry_id: number; journey_photo_id: number };
  journey_entries: { id: number; entry_date: string; entry_time: string | null; is_draft: number };
  journeys: { id: number; user_id: number };
}

/** JS7 (Plan 4 Task 8b relocation) — the public photo-validation join's row (`journey_photos` + `trek_photos`). */
export interface JourneyPublicPhotoValidationRow {
  photo_id: number;
  owner_id: number | null;
  journey_id: number;
}

/** JS10 (Plan 4 Task 8b relocation) — the public asset-validation join's row (`journey_photos` + `trek_photos` + `journeys`). */
export interface JourneyPublicAssetValidationRow {
  owner_id: number | null;
  journey_owner_id: number;
}

/** `GALLERY_SELECT`'s exact column list (`journey-domain.service.ts`'s module const), aliased `gp`/`tp` — shared by every gallery-shaped read below. */
const GALLERY_COLUMNS = [
  'gp.id', 'gp.journey_id', 'gp.photo_id', 'gp.caption', 'gp.shared', 'gp.sort_order', 'gp.created_at',
  'tp.provider', 'tp.asset_id', 'tp.owner_id', 'tp.file_path', 'tp.thumbnail_path', 'tp.width', 'tp.height',
  'tp.media_type', 'tp.duration_ms', 'tp.taken_at', 'tp.lat', 'tp.lng',
] as const;

/**
 * `GALLERY_CHRONOLOGICAL_ORDER` (R1), the Kysely rebuild Task 0 proved
 * row-order-identical to the legacy SQL text against a seeded gallery
 * (SQLF-070, `sql-functions.test.ts`) — pasted verbatim from Task 0's report
 * (renaming its `GalleryOrderTestDB` to this file's own `GalleryKyselyDB`,
 * a structural superset that still satisfies the fixed `gp`/`tp` alias
 * contract). NOT exported: Task 0 deliberately did not add a shared,
 * exported builder ("re-verify it typechecks against your own repository's
 * DB interface" — a naive `ExpressionBuilder<DB, 'journey_photos' |
 * 'trek_photos'>` signature compiles under vitest's SWC transform but fails
 * `tsc`, the exact trap this fixed-alias intersection typing avoids). Task
 * 3 builds its own copy for JS15 (`getPublicJourney`'s gallery read) in
 * `JourneyShareTokens.repository.ts`, tailored to THAT file's own DB
 * interface, not a second caller of this one.
 */
function galleryChronologicalOrderExpr(
  platform: Platform,
  eb: ExpressionBuilder<GalleryKyselyDB & { gp: GalleryKyselyDB['journey_photos']; tp: GalleryKyselyDB['trek_photos'] }, 'gp' | 'tp'>,
) {
  return eb.fn.coalesce(
    eb.fn<string | null>('nullif', [eb.ref('tp.taken_at'), eb.val('')]),
    eb
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_entries as je', 'je.id', 'jep.entry_id')
      .select((eb2) =>
        eb2.fn
          .min<string | null>(
            concatKysely(
              platform,
              eb2,
              { column: 'je.entry_date' },
              { value: 'T' },
              { expression: eb2.fn.coalesce(eb2.fn<string | null>('nullif', [eb2.ref('je.entry_time'), eb2.val('')]), eb2.val('00:00')) },
            ),
          )
          .as('min_dt'),
      )
      .whereRef('jep.journey_photo_id', '=', 'gp.id'),
    unixEpochToIsoKysely(platform, eb, 'gp.created_at'),
  );
}

/**
 * The gallery rows a public share leaves out (#696): a photo whose every entry
 * is a draft stays off the public page, and so do its bytes. One that also sits
 * on a published entry, or on no entry at all (a plain gallery photo), is shown.
 * Legacy `NOT_DRAFT_ONLY_PHOTO`, `NOT (EXISTS (SELECT 1 FROM journey_entry_photos d
 * JOIN journey_entries de ON de.id = d.entry_id WHERE d.journey_photo_id = gp.id AND
 * de.is_draft = 1) AND NOT EXISTS (SELECT 1 FROM journey_entry_photos p JOIN
 * journey_entries pe ON pe.id = p.entry_id WHERE p.journey_photo_id = gp.id AND
 * pe.is_draft = 0))`, correlated on `gp.id` the same way. Same fixed-alias typing
 * as {@link galleryChronologicalOrderExpr}.
 */
function notDraftOnlyPhoto(eb: ExpressionBuilder<GalleryKyselyDB & { gp: GalleryKyselyDB['journey_photos'] }, 'gp'>) {
  return eb.not(
    eb.and([
      eb.exists(
        eb
          .selectFrom('journey_entry_photos as d')
          .innerJoin('journey_entries as de', 'de.id', 'd.entry_id')
          .select('d.entry_id')
          .whereRef('d.journey_photo_id', '=', 'gp.id')
          .where('de.is_draft', '=', 1),
      ),
      eb.not(
        eb.exists(
          eb
            .selectFrom('journey_entry_photos as p')
            .innerJoin('journey_entries as pe', 'pe.id', 'p.entry_id')
            .select('p.entry_id')
            .whereRef('p.journey_photo_id', '=', 'gp.id')
            .where('pe.is_draft', '=', 0),
        ),
      ),
    ]),
  );
}

/**
 * `journey_photos` — the gallery table (Plan 3g Task 2, Part B). A plain
 * single-column `id` PK with a `uniques: [{ properties: ['journey', 'photo'] }]`
 * constraint — R3's composite-PK upsert ruling does NOT apply here (that
 * ruling covers `JourneyTrips`/`JourneyEntryPhotos`/`JourneyContributors`
 * only, all genuine composite PKs; this table's `INSERT OR IGNORE` conflict
 * target is a UNIQUE index instead, the same `onConflictFields` shape
 * `TripMembers.repository.ts`'s own `UNIQUE(trip_id, user_id)` precedent
 * uses over a plain `id` PK).
 */
export class JourneyPhotosRepository extends TrekRepository<JourneyPhotos> {
  /** JG68 — `journeyStats`'s photo count: `SELECT COUNT(*) AS n FROM journey_photos WHERE journey_id = ?`. */
  async countForJourney(journeyId: number): Promise<number> {
    return await this.count({ journey: journeyId });
  }

  /**
   * PH10 (Plan 3g Task 4 survivor, `TrekPhotoRegistrationService.deleteIfOrphan`)
   * — `SELECT 1 FROM journey_photos WHERE photo_id = ?`: the `journey_photos`
   * half of PH10's split orphan-check (the `trip_photos` half is 3e's own,
   * already converted onto `TripPhotosRepository.existsForPhoto`).
   */
  async existsForPhoto(photoId: number): Promise<boolean> {
    const row = await this.qb('gp').select(['gp.id']).where({ photo: photoId }).execute<{ id: number } | undefined>('get', false);
    return !!row;
  }

  /**
   * MA1 (Plan 3g Task 4 survivor, `MemoriesAccessService.canAccessUserPhoto`'s
   * journey-photo half) — `SELECT gp.journey_id FROM journey_photos gp JOIN
   * trek_photos tkp ON tkp.id=gp.photo_id WHERE tkp.asset_id=? AND
   * tkp.provider=? AND tkp.owner_id=? LIMIT 1`. Security-critical: returns
   * only the FIRST matching row's `journey_id` (the legacy statement's own
   * `LIMIT 1`), not every journey the asset might appear in — preserved
   * exactly, not "fixed" into a list.
   */
  async findJourneyIdForAsset(assetId: string, provider: string, ownerId: number): Promise<number | undefined> {
    const row = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tkp', 'tkp.id', 'gp.photo_id')
      .select('gp.journey_id')
      .where('tkp.asset_id', '=', assetId)
      .where('tkp.provider', '=', provider)
      .where('tkp.owner_id', '=', ownerId)
      .executeTakeFirst();
    return row?.journey_id;
  }

  /**
   * MA6 (Plan 3g Task 4 survivor, `MemoriesAccessService.canAccessTrekPhoto`'s
   * unified-photo-access read) — the outer `SELECT 1 FROM journey_photos gp
   * WHERE gp.photo_id=?` half of the original correlated `EXISTS` statement;
   * returns every DISTINCT `journey_id` a `journey_photos` row links this
   * `trek_photos.id` to (a photo can be added to more than one journey's
   * gallery), so the caller can probe owner-or-contributor access against
   * each one in turn — same loop shape `MemoriesAccessService`'s own MA5
   * (`sharedTripIds`/`findAccessible`) already uses for the trip-photo half.
   */
  async listJourneyIdsForPhoto(photoId: number): Promise<number[]> {
    const rows = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos')
      .select('journey_id')
      .distinct()
      .where('photo_id', '=', photoId)
      .execute();
    return rows.map((r) => r.journey_id);
  }

  /**
   * JS7 (Plan 4 Task 8b relocation) — `JourneyShareService
   * .validateShareTokenForPhoto`'s photo/journey resolution: `SELECT
   * gp.photo_id, tkp.owner_id, gp.journey_id FROM journey_photos gp JOIN
   * trek_photos tkp ON tkp.id=gp.photo_id WHERE gp.photo_id=? AND
   * gp.journey_id=? AND {NOT_DRAFT_ONLY_PHOTO}` (#696, see
   * {@link notDraftOnlyPhoto}). Public/anonymous — reachable from
   * `JourneyPublicController` with no authentication, gated only by the
   * unguessable share token the service already checked before calling
   * this. Previously lived as `JourneyShareTokens.repository.ts`'s own
   * fallback stub from 3g Task 3 (this repository was still mid-flight when
   * that task landed) — relocated here now that it is stable.
   */
  async findGalleryPhotoForValidation(photoId: number, journeyId: number): Promise<JourneyPublicPhotoValidationRow | undefined> {
    return await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tkp', 'tkp.id', 'gp.photo_id')
      .select(['gp.photo_id', 'tkp.owner_id', 'gp.journey_id'])
      .where('gp.photo_id', '=', photoId)
      .where('gp.journey_id', '=', journeyId)
      .where((eb) => notDraftOnlyPhoto(eb))
      .executeTakeFirst();
  }

  /**
   * JS10 (Plan 4 Task 8b relocation) — `JourneyShareService
   * .validateShareTokenForAsset`'s owner resolution: `SELECT tkp.owner_id,
   * j.user_id AS journey_owner_id FROM journey_photos gp JOIN trek_photos
   * tkp ON tkp.id=gp.photo_id JOIN journeys j ON j.id=gp.journey_id WHERE
   * tkp.asset_id=? AND gp.journey_id=? AND {NOT_DRAFT_ONLY_PHOTO}` (#696).
   * Public/anonymous, security-critical
   * — the service never trusts a caller-supplied owner id; only this join
   * resolves `ownerId`. Relocated the same way as {@link
   * findGalleryPhotoForValidation}/JS7.
   */
  async findAssetForValidation(assetId: string, journeyId: number): Promise<JourneyPublicAssetValidationRow | undefined> {
    return await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tkp', 'tkp.id', 'gp.photo_id')
      .innerJoin('journeys as j', 'j.id', 'gp.journey_id')
      .select(['tkp.owner_id', 'j.user_id as journey_owner_id'])
      .where('tkp.asset_id', '=', assetId)
      .where('gp.journey_id', '=', journeyId)
      .where((eb) => notDraftOnlyPhoto(eb))
      .executeTakeFirst();
  }

  /** JG88/JG99 — `ensureInGallery`'s and `uploadGalleryPhotos`'s next-sort-order probe: `SELECT MAX(sort_order) as m FROM journey_photos WHERE journey_id = ?`, one statement text. */
  async maxSortOrder(journeyId: number): Promise<number | null> {
    const row = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos')
      .select((eb) => eb.fn.max<number | null>('sort_order').as('m'))
      .where('journey_id', '=', journeyId)
      .executeTakeFirst();
    // Plan 4 Task 8b: `row?.` is unreachable — an unqualified, ungrouped
    // `MAX(...)` always returns exactly one row, so `executeTakeFirst()`
    // can't actually miss here. Kept for type-shape symmetry with
    // `executeTakeFirst()`'s `| undefined` return type, same accepted class
    // as `OauthClients:147`. `row.m` itself genuinely can be `null`.
    return row?.m ?? null;
  }

  /**
   * JG89/JG100 — the two `INSERT OR IGNORE INTO journey_photos` column-set
   * variants (`ensureInGallery`'s 6-column form with `caption`,
   * `uploadGalleryPhotos`'s 5-column form without it — caller passes
   * `caption: null` for that one) collapse into ONE method: `INSERT OR
   * IGNORE` never touches an existing row (unlike `INSERT OR REPLACE`'s
   * delete+reinsert), so there is no R3 reset-column trap here the way
   * `JourneyContributorsRepository.upsertContributor` has for
   * `hide_skeletons` — checked against this table's own DDL, confirmed no
   * such risk (Task 1's report, deviation 5).
   */
  async insertIgnore(data: {
    journey_id: number;
    photo_id: number;
    caption: string | null;
    shared: number;
    sort_order: number;
    created_at: number;
  }): Promise<void> {
    await this.upsert(
      {
        journey: data.journey_id,
        photo: data.photo_id,
        caption: data.caption,
        shared: data.shared,
        sort_order: data.sort_order,
        created_at: data.created_at,
      },
      { onConflictFields: ['journey', 'photo'], onConflictAction: 'ignore' },
    );
  }

  /** JG90 — `ensureInGallery`'s post-insert id resolution: `SELECT id FROM journey_photos WHERE journey_id = ? AND photo_id = ?`. */
  async findIdByJourneyAndPhoto(journeyId: number, photoId: number): Promise<number | undefined> {
    const row = await this.qb('gp')
      .select(['gp.id'])
      .where({ journey: journeyId, photo: photoId })
      .execute<{ id: number } | undefined>('get', false);
    return row?.id;
  }

  /**
   * JG98/JG110 — `linkPhotoToEntry`'s and `updatePhoto`'s scope-check read:
   * `SELECT id, journey_id FROM journey_photos WHERE id = ?`, one statement
   * text. Selects the RELATION property (`gp.journey`), not the
   * `persist(false)` shadow column name (`gp.journey_id`) directly — the
   * QueryBuilder only resolves a shadow FK column through its owning
   * relation property (§7's own trap: "read through the relation, not the
   * shadow column"); selecting the shadow name itself either throws ("No
   * fields selected") or silently drops the key from the row, both caught
   * live by this file's own test run.
   */
  async findScopeById(id: number): Promise<{ id: number; journey_id: number } | undefined> {
    return await this.qb('gp')
      .select(['gp.id', 'gp.journey'])
      .where({ id })
      .execute<{ id: number; journey_id: number } | undefined>('get', false);
  }

  /** JG114 — `deletePhoto`'s wider scope-check read: `SELECT id, journey_id, photo_id FROM journey_photos WHERE id = ?` — a DIFFERENT column set from {@link findScopeById} (JG98/JG110), not a dup. Same relation-property-not-shadow-column rule as {@link findScopeById}. */
  async findScopeWithPhotoId(id: number): Promise<{ id: number; journey_id: number; photo_id: number } | undefined> {
    return await this.qb('gp')
      .select(['gp.id', 'gp.journey', 'gp.photo'])
      .where({ id })
      .execute<{ id: number; journey_id: number; photo_id: number } | undefined>('get', false);
  }

  /** JG105 — `deleteGalleryPhoto`'s pre-delete read: `SELECT * FROM journey_photos WHERE id = ?`. */
  async findFull(id: number): Promise<JourneyPhotoFullRow | undefined> {
    return await this.qb('gp')
      .select(['gp.*'])
      .where({ id })
      .execute<JourneyPhotoFullRow | undefined>('get', false);
  }

  /** JG108 — `setPhotoProvider`'s `trek_photos.id` resolution: `SELECT photo_id FROM journey_photos WHERE id = ?`. Relation property (`gp.photo`), not the shadow column — see {@link findScopeById}'s docstring. */
  async findPhotoIdById(id: number): Promise<number | undefined> {
    const row = await this.qb('gp')
      .select(['gp.photo'])
      .where({ id })
      .execute<{ photo_id: number } | undefined>('get', false);
    return row?.photo_id;
  }

  /**
   * JG109 — `setPhotoProvider`'s denormalized-cache write. §7: `provider`/
   * `asset_id`/`owner_id` are a DELIBERATE cache of the same columns on
   * `trek_photos` ("also denorm on gallery row for fast reads"), preserved
   * exactly — never "fixed" into reading through the `photo` relation.
   */
  async updateProvider(id: number, provider: string, assetId: string, ownerId: number): Promise<void> {
    await this.nativeUpdate({ id }, { provider, asset_id: assetId, owner_id: ownerId });
  }

  /** JG111 — `updatePhoto`'s caption write: `UPDATE journey_photos SET caption = ? WHERE id = ?`. */
  async updateCaption(id: number, caption: string): Promise<void> {
    await this.nativeUpdate({ id }, { caption });
  }

  /**
   * JG107/JG116 — `deleteGalleryPhoto`'s and `deletePhoto`'s hard delete,
   * one statement text (`deletePhoto`'s own comment: "backwards-compat name
   * used by old route"). Cascades `journey_entry_photos` via the entity's
   * `deleteRule('cascade')`.
   */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** JG101 — `uploadGalleryPhotos`'s post-insert gallery-shaped read: `SELECT {GALLERY_SELECT} FROM {GALLERY_JOIN} WHERE gp.journey_id = ? AND gp.photo_id = ?`. */
  async galleryReadByJourneyAndPhoto(journeyId: number, photoId: number): Promise<GalleryPhoto | undefined> {
    const row = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(GALLERY_COLUMNS)
      .where('gp.journey_id', '=', journeyId)
      .where('gp.photo_id', '=', photoId)
      .executeTakeFirst();
    return row as GalleryPhoto | undefined;
  }

  /** JG102 — `addProviderPhotoToGallery`'s post-insert gallery-shaped read by gallery row id: `SELECT {GALLERY_SELECT} FROM {GALLERY_JOIN} WHERE gp.id = ?`. */
  async galleryReadOne(id: number): Promise<GalleryPhoto | undefined> {
    const row = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(GALLERY_COLUMNS)
      .where('gp.id', '=', id)
      .executeTakeFirst();
    return row as GalleryPhoto | undefined;
  }

  /**
   * JG19 — `getJourneyFull`'s gallery read, folding in `GALLERY_CHRONOLOGICAL_ORDER`
   * (R1). Task 1's report left this raw for this task to finish (its own
   * named file set did not include this repository); this is the FIRST real
   * consumer of Task 0's Kysely rebuild in the codebase. Unbounded (no
   * `LIMIT`/`OFFSET` — Task 0 confirmed neither consuming site paginates),
   * so the RS20 pagination rule does not independently force this ruling —
   * R1 holds anyway (a full-table-read-then-sort-in-JS is exactly what RS20
   * exists to prevent in general).
   *
   * JS15 (`getPublicJourney`) passes `hideDraftOnly`: the public page leaves out
   * a photo whose every entry is a draft (#696, `AND {NOT_DRAFT_ONLY_PHOTO}`),
   * the owner's own gallery shows everything.
   */
  async galleryRead(journeyId: number, opts: { hideDraftOnly?: boolean } = {}): Promise<GalleryPhoto[]> {
    const platform = this.getEntityManager().getPlatform();
    const rows = await this.kysely<GalleryKyselyDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select(GALLERY_COLUMNS)
      .where('gp.journey_id', '=', journeyId)
      .$if(!!opts.hideDraftOnly, (qb) => qb.where((eb) => notDraftOnlyPhoto(eb)))
      .orderBy((eb) => galleryChronologicalOrderExpr(platform, eb), 'asc')
      .orderBy('gp.sort_order', 'asc')
      .orderBy('gp.id', 'asc')
      .execute();
    return rows as GalleryPhoto[];
  }
}
