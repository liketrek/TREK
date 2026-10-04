import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import type { TrekPhoto } from '../../types';
import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import type { TrekPhotosRepository } from '../../db/repositories/TrekPhotos.repository';
import { TripPhotos } from '../../db/entities/TripPhotos.entity';
import type { TripPhotosRepository } from '../../db/repositories/TripPhotos.repository';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';

/**
 * The `trek_photos` table: register a photo, look one up, retarget it, drop it
 * when nothing references it any more.
 *
 * Split out of photoResolverService, which was two things in one file — this
 * half touches no photo provider at all, while the other half (streamPhoto,
 * getPhotoInfo, streamCachedThumbnail) dispatches to immich/synology. Keeping
 * them together is what forced every consumer that just wanted to store a row —
 * the unified trip-photo service, the journey service — to drag both providers
 * in behind it.
 *
 * It also draws the photos/ vs memories/ line: storage lives here, provider
 * dispatch stays with memories.
 *
 * Renamed from `TrekPhotosRepository` (Plan 3e R13): despite the name, it was
 * never a MikroORM repository — a `DatabaseService`-backed service that ran
 * raw SQL directly — and the old name collided with the generated ORM
 * repository this class now injects (`../../db/repositories/TrekPhotos
 * .repository.ts`, also `TrekPhotosRepository`, per the `EntityRepositoryType`
 * convention every entity in this program follows). Same shape as the 3d
 * §18.3 `ReservationsReadRepository` → `ReservationsReadService` precedent.
 *
 * File/test renamed to match (Plan 4 Task 8a — 3e Task 6 renamed only the
 * class). The old path, `trek-photos.repository.ts`, was kept as a thin
 * re-export stub (the same `src/websocket.ts` shape) while its ~20
 * importers sat in sibling tasks' exclusively-owned windows on this shared
 * branch; Plan 4 Task 4 repointed every one of them at this file directly
 * and deleted the stub.
 */
@Injectable()
export class TrekPhotoRegistrationService {
  constructor(
    @InjectRepository(TrekPhotos) private readonly trekPhotos: TrekPhotosRepository,
    @InjectRepository(TripPhotos) private readonly tripPhotos: TripPhotosRepository,
    // Plan 3g Task 4 (PH10) — the `journey_photos` half of `deleteIfOrphan`'s
    // split orphan-check.
    @InjectRepository(JourneyPhotos) private readonly journeyPhotos: JourneyPhotosRepository,
  ) {}

  /** PH1 — find-or-register a remote provider asset, re-encrypting a changed album passphrase on an existing row. */
  async getOrCreate(
    provider: string,
    assetId: string,
    ownerId: number,
    passphrase?: string,
    mediaType: string = 'image',
  ): Promise<number> {
    const existing = await this.trekPhotos.findByProviderAsset(provider, assetId, ownerId);
    if (existing) {
      if (passphrase) {
        await this.trekPhotos.setPassphrase(existing.id, encrypt_api_key(passphrase));
      }
      return existing.id;
    }

    return await this.trekPhotos.insertRemote({
      provider,
      asset_id: assetId,
      owner_id: ownerId,
      passphrase: passphrase ? encrypt_api_key(passphrase) : null,
      media_type: mediaType,
    });
  }

  /** PH4/PH5 — find-or-register a locally uploaded photo, keyed on its stored path. */
  async getOrCreateLocal(
    filePath: string,
    thumbnailPath?: string | null,
    width?: number | null,
    height?: number | null,
    mediaType: string = 'image',
    durationMs?: number | null,
  ): Promise<number> {
    const existing = await this.trekPhotos.findLocalByPath(filePath);
    if (existing) return existing.id;

    return await this.trekPhotos.insertLocal({
      file_path: filePath,
      thumbnail_path: thumbnailPath || null,
      width: width || null,
      height: height || null,
      media_type: mediaType,
      duration_ms: durationMs ?? null,
    });
  }

  /** PH6 — `SELECT * FROM trek_photos WHERE id = ?`, the same statement `MemoriesAccessService.canAccessTrekPhoto` (MA4) reads through `TrekPhotosRepository.findById`. */
  async resolve(photoId: number): Promise<TrekPhoto | null> {
    return await this.trekPhotos.findById(photoId);
  }

  /** PH7 — retarget an existing row, used when a local photo is uploaded to Immich. */
  async setProvider(trekPhotoId: number, provider: string, assetId: string, ownerId: number): Promise<void> {
    await this.trekPhotos.retarget(trekPhotoId, provider, assetId, ownerId);
  }

  /**
   * PH8 — stamp a generated local thumbnail onto the row. COALESCE keeps
   * dimensions that were already known — a re-generated thumbnail must not
   * blank them.
   */
  async recordLocalThumbnail(photoId: number, thumbnailPath: string, width: number, height: number): Promise<void> {
    await this.trekPhotos.patchThumbnail(photoId, thumbnailPath, width, height);
  }

  /**
   * PH9 — where and when the picture was taken (#1614).
   *
   * COALESCE throughout, for the same reason recordLocalThumbnail does it: the
   * three sources disagree in how much they know. A provider search answers with
   * coordinates, the same provider's album listing does not, and a local file
   * only gives them up once its EXIF has been read. Whichever arrives first wins,
   * and a later, emptier answer must not blank what is already there.
   *
   * A photo with neither is the normal case, not a failure. The all-empty
   * early return and the pair-or-neither coordinate guard both stay here.
   *
   * Answers whether the row learned anything. The repository only counts a
   * row whose missing column actually receives a value: SQLite counts a
   * matched row as changed even when every COALESCE kept the old value, and
   * the caller broadcasts a journey refresh on it (#1587).
   */
  async recordCaptureMetadata(
    photoId: number,
    meta: { takenAt?: string | null; lat?: number | null; lng?: number | null },
  ): Promise<boolean> {
    const { takenAt = null, lat = null, lng = null } = meta;
    if (takenAt == null && lat == null && lng == null) return false;
    // Coordinates are stored as a pair or not at all — a lone latitude is not a
    // place, and half a pair would put the photo on the null island.
    const hasPair = Number.isFinite(lat) && Number.isFinite(lng);
    return await this.trekPhotos.patchCaptureMetadata(photoId, takenAt, hasPair ? lat : null, hasPair ? lng : null);
  }

  /**
   * PH10/PH11 — drop the row once no trip and no journey references it.
   * Local photos are kept: their bytes are ours, and the file would outlive
   * the row.
   *
   * PH10's original statement was one `UNION ALL` existence check across
   * `trip_photos` and `journey_photos`; split into its two halves here
   * (`TripPhotosRepository.existsForPhoto` for the 3e-owned table,
   * `JourneyPhotosRepository.existsForPhoto` for the Plan 3g-owned table,
   * converted by Plan 3g Task 4) — logically identical (neither half needs
   * to run if the other already found a row), never a transaction (both are
   * reads).
   */
  async deleteIfOrphan(photoId: number): Promise<void> {
    if (await this.tripPhotos.existsForPhoto(photoId)) return;
    if (await this.journeyPhotos.existsForPhoto(photoId)) return; // PH10 — converted (Plan 3g Task 4)
    await this.trekPhotos.deleteNonLocal(photoId);
  }
}
