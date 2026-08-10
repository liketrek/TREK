import type { Response } from 'express';
import type { AssetInfo, ServiceResult } from './memories.helpers';

/** What a caller can ask a provider for. */
export type PhotoAssetKind = 'thumbnail' | 'original';

/**
 * One asset, and everything a provider needs to reach it.
 *
 * The two shipped providers took the same three numbers in different orders —
 * Immich as `(userId, assetId, ownerId)`, Synology as `(userId, targetUserId,
 * photoId)` — so every dispatch site had to remember which was which, and a
 * transposition would have compiled cleanly and served the wrong user's photo.
 */
export interface PhotoAssetRef {
  /** Who is asking. */
  userId: number;
  /** Whose credentials the provider is reached with — not always the caller. */
  ownerId: number;
  assetId: string;
  /** Synology share links carry their own passphrase; other providers ignore it. */
  passphrase?: string;
  /** Lets a provider tell a video apart from an image without a second lookup. */
  mediaType?: string | null;
  /** Forwarded Range header, for seeking in a video. */
  range?: string;
}

export interface PhotoBytes {
  bytes: Buffer;
  contentType: string;
}

export interface PhotoFetchError {
  error: string;
  status: number;
}

/**
 * A photo backend TREK can serve assets from (#584).
 *
 * The dispatch used to be a `switch (photo.provider)` in three places, which is
 * what made "add a provider" a search-and-edit task rather than a registration.
 * `local` is deliberately NOT one of these: it is storage on this disk, not an
 * integration, and the `photo_providers` table it would have to appear in does
 * not list it either.
 */
export interface PhotoProvider {
  /** Matches `trek_photos.provider` and the `photo_providers` row id. */
  readonly id: string;

  /**
   * Write the asset to the response, headers and status included.
   *
   * Void, and that is a contract rather than an oversight: a provider that
   * cannot serve the asset writes its own error status. Immich used to return
   * `{ error, status }` on a missing connection and leave the response
   * untouched, which hung the request in every one of its four callers.
   */
  streamAsset(res: Response, ref: PhotoAssetRef, kind: PhotoAssetKind): Promise<void>;

  /** Thumbnail bytes for the cache, rather than straight to a response. */
  fetchThumbnailBytes(ref: PhotoAssetRef): Promise<PhotoBytes | PhotoFetchError>;

  /** Capture date, dimensions, place — whatever the backend knows. */
  getAssetInfo(ref: PhotoAssetRef): Promise<ServiceResult<AssetInfo>>;
}

/** Multi-provider injection token. Register an adapter here and it is reachable. */
export const PHOTO_PROVIDERS = Symbol('PHOTO_PROVIDERS');
