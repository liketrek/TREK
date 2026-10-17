import type { JourneyShareTokens } from '../entities/JourneyShareTokens.entity';
import { TrekRepository } from './_shared/trek-repository';

/** JS1's narrow projection — `createOrUpdateJourneyShareLink`'s existing-link read. */
export interface JourneyShareLinkFlagsRow {
  token: string;
  share_timeline: number | null;
  share_gallery: number | null;
  share_map: number | null;
  newest_first: number;
}

/** JS4/JS11's full-row shape (`getJourneyShareLink`, `getPublicJourney`'s entrypoint read). */
export interface JourneyShareTokenRow {
  id: number;
  journey_id: number;
  token: string;
  created_by: number;
  share_timeline: number | null;
  share_gallery: number | null;
  share_map: number | null;
  created_at: string | null;
  newest_first: number;
}

/** JS6/JS9's narrow token-lookup projection — the anonymous photo/asset validators. */
export interface JourneyShareTokenAccessRow {
  journey_id: number;
  share_gallery: number | null;
}

/** JS15 — the public gallery read (`GALLERY_SELECT` shape, `GALLERY_CHRONOLOGICAL_ORDER` applied). */
export interface JourneyPublicGalleryRow {
  id: number;
  journey_id: number;
  photo_id: number;
  caption: string | null;
  shared: number;
  sort_order: number | null;
  created_at: number;
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
}

// L2 — `galleryChronologicalOrderExpr`/`listGalleryForPublicJourney` (JS15)
// used to be a byte-identical duplicate of `JourneyPhotosRepository`'s own
// `galleryChronologicalOrderExpr`/`galleryRead` (same `GALLERY_COLUMNS`
// select list, same ORDER BY, differing only in which local `DB` interface
// the builder is typed against). `JourneyShareService.getPublicJourney` now
// calls `JourneyPhotosRepository.galleryRead` directly instead — one gallery
// ORDER BY builder, one gallery query, per the whole-plan review (M5/L2).
// `JourneyPublicGalleryRow` stays exported: it is still the accurate shape
// of what that query returns (`GalleryPhoto`, the type `galleryRead` is
// declared against, is a narrower public-API type missing `taken_at`/`lat`/
// `lng`/`media_type`/`duration_ms`), and tests keep using it to type the
// public gallery response.

/**
 * `journey_share_tokens` — public share links (Plan 3g Task 3, R4).
 * `findAccessByToken`/`findByToken` are reachable from
 * `JourneyPublicController` with NO authentication at all, gated purely by
 * the unguessable token — a plain `.where({token})`/`.where('token', '=',
 * token)` equality, no `LIKE`, no `COLLATE NOCASE`, no case-folding of any
 * kind (R4), returning `undefined` on a miss, never throwing, so a
 * missing/revoked/wrong-case/NUL token 404s through the controller instead
 * of 500ing. The five cross-table public reads (JS7/JS10/JS13/JS14/JS15)
 * that used to live here as a fallback Kysely stub (3g Task 3, before Task
 * 2's own repositories landed) have all been relocated to their natural
 * home repositories — see the bottom of this file (Plan 4 Task 8b).
 */
export class JourneyShareTokensRepository extends TrekRepository<JourneyShareTokens> {
  /** JS1 — `createOrUpdateJourneyShareLink`'s existing-link read: `SELECT token, share_timeline, share_gallery, share_map, newest_first FROM journey_share_tokens WHERE journey_id = ?`. */
  async findFlagsByJourneyId(journeyId: number): Promise<JourneyShareLinkFlagsRow | undefined> {
    return await this.qb('jst')
      .select(['jst.token', 'jst.share_timeline', 'jst.share_gallery', 'jst.share_map', 'jst.newest_first'])
      .where({ journey: journeyId })
      .execute<JourneyShareLinkFlagsRow | undefined>('get', false);
  }

  /**
   * JS2 — the update branch: `UPDATE journey_share_tokens SET
   * share_timeline=?, share_gallery=?, share_map=?, newest_first=? WHERE
   * journey_id=?`. A plain 4-column write, NOT a `presenceSet` call — the
   * service resolves every flag's final value (the `permissions.X ?? !!
   * existing.X` fallback merge) before calling this, so every call writes
   * all four columns, present or not.
   */
  async updateFlags(
    journeyId: number,
    flags: { share_timeline: number; share_gallery: number; share_map: number; newest_first: number },
  ): Promise<void> {
    await this.nativeUpdate({ journey: journeyId }, flags);
  }

  /** JS3 — the create branch: `INSERT INTO journey_share_tokens (journey_id, token, created_by, share_timeline, share_gallery, share_map, newest_first) VALUES (?,?,?,?,?,?,?)`. */
  async insertLink(
    journeyId: number,
    token: string,
    createdBy: number,
    flags: { share_timeline: number; share_gallery: number; share_map: number; newest_first: number },
  ): Promise<void> {
    await this.insert({ journey: journeyId, token, createdByRef: createdBy, ...flags });
  }

  /** JS4 — `getJourneyShareLink`: `SELECT * FROM journey_share_tokens WHERE journey_id = ?`. */
  async findByJourneyId(journeyId: number): Promise<JourneyShareTokenRow | undefined> {
    return await this.qb('jst')
      .select(['jst.*'])
      .where({ journey: journeyId })
      .execute<JourneyShareTokenRow | undefined>('get', false);
  }

  /** JS5 — `deleteJourneyShareLink`: `DELETE FROM journey_share_tokens WHERE journey_id = ?`. */
  async deleteByJourneyId(journeyId: number): Promise<void> {
    await this.nativeDelete({ journey: journeyId });
  }

  /**
   * UC7 (Plan 3g Task 4 survivor, `UserCleanupService.cleanupUserReferences`)
   * — `DELETE FROM journey_share_tokens WHERE created_by = ?`: erasure of
   * public share links this user created (on any journey, owned or not).
   */
  async deleteByCreatedBy(userId: number): Promise<void> {
    await this.nativeDelete({ createdByRef: userId });
  }

  /**
   * JS6/JS9 — the public photo/asset validators' token lookup: `SELECT
   * journey_id, share_gallery FROM journey_share_tokens WHERE token = ?`.
   * Exact-match only (R4) — a differently-cased or NUL-truncated token binds
   * as a distinct value and simply misses.
   */
  async findAccessByToken(token: string): Promise<JourneyShareTokenAccessRow | undefined> {
    return await this.qb('jst')
      .select(['jst.journey', 'jst.share_gallery'])
      .where({ token })
      .execute<JourneyShareTokenAccessRow | undefined>('get', false);
  }

  /** JS11 — `getPublicJourney`'s entrypoint read: `SELECT * FROM journey_share_tokens WHERE token = ?`. Exact-match only (R4), same as {@link findAccessByToken}. */
  async findByToken(token: string): Promise<JourneyShareTokenRow | undefined> {
    return await this.qb('jst')
      .select(['jst.*'])
      .where({ token })
      .execute<JourneyShareTokenRow | undefined>('get', false);
  }

  // JS7/JS10 — `validateShareTokenForPhoto`'s/`validateShareTokenForAsset`'s
  // photo/asset resolution moved to `JourneyPhotosRepository
  // .findGalleryPhotoForValidation`/`.findAssetForValidation` (Plan 4 Task
  // 8b relocation — this repository's own fallback stub from 3g Task 3 is
  // gone now that `JourneyPhotosRepository` is stable).

  // JS13 — `getPublicJourney`'s entry list moved to
  // `JourneyEntriesRepository.listPublicEntries` (Plan 4 Task 8b, same
  // reason as JS7/JS10 above).

  // JS14 — `getPublicJourney`'s per-entry photo read moved to
  // `JourneyEntryPhotosRepository.listForPublicJourney` (Plan 4 Task 8b,
  // dedupe against that repository's own `JP_COLUMNS`).

  // JS15 — `getPublicJourney`'s gallery read moved to
  // `JourneyPhotosRepository.galleryRead` (L2, above).
}
