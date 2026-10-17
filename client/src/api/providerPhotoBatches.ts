/**
 * Most provider asset ids one add request carries (#1587).
 *
 * The server parses JSON bodies up to 100 kB, and an Immich id with its media
 * type costs about 47 bytes, so a single request stopped at roughly 2,180
 * photos with a 413 the moment "Select all" could reach a whole trip. 500 keeps
 * every request far under that for either provider.
 */
export const PROVIDER_PHOTO_BATCH = 500

/** What the two provider-photo add routes answer, summed over every batch. */
export interface ProviderPhotosAdded {
  photos: unknown[]
  added: number
}

/**
 * A batched add that failed after earlier batches were stored.
 *
 * Those batches are on the journey whatever happens next, so the error carries
 * what they added: a caller can count them and reload, and still report the
 * failure for the rest. `cause` is what the failing batch rejected with.
 */
export class ProviderPhotoBatchError extends Error implements ProviderPhotosAdded {
  readonly photos: unknown[]
  readonly added: number
  readonly cause: unknown

  constructor(saved: ProviderPhotosAdded, cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Adding the photos failed part way')
    this.name = 'ProviderPhotoBatchError'
    this.photos = saved.photos
    this.added = saved.added
    this.cause = cause
  }
}

/**
 * How many photos a failed add stored all the same: the count a
 * ProviderPhotoBatchError carries, 0 for any other failure.
 */
export function addedBeforeFailure(err: unknown): number {
  return err instanceof ProviderPhotoBatchError ? err.added : 0
}

/**
 * Send a provider-photo add in batches the body limit lets through, and answer
 * as one request would have.
 *
 * `mediaTypes` is parallel to `assetIds` and is cut at the same positions, so
 * every id keeps its own type. The batches go one after the other: the server
 * numbers photos in the order it receives them, and the picker sends them in
 * capture order, which concurrent requests could interleave. A failing batch
 * stops the run. When it is the first, the request's own error comes through
 * unchanged; after that it is a ProviderPhotoBatchError carrying what the
 * earlier batches stored. Adding those again is harmless because the server
 * skips what is already there.
 *
 * An empty list still makes the one request it always made.
 */
export async function postProviderPhotosInBatches(
  assetIds: string[],
  mediaTypes: string[] | undefined,
  post: (assetIds: string[], mediaTypes: string[] | undefined) => Promise<Partial<ProviderPhotosAdded> | undefined>,
  batchSize: number = PROVIDER_PHOTO_BATCH,
): Promise<ProviderPhotosAdded> {
  const photos: unknown[] = []
  let added = 0
  let start = 0
  do {
    const end = start + batchSize
    let result: Partial<ProviderPhotosAdded> | undefined
    try {
      result = await post(assetIds.slice(start, end), mediaTypes?.slice(start, end))
    } catch (err) {
      if (start === 0) throw err
      throw new ProviderPhotoBatchError({ photos, added }, err)
    }
    photos.push(...(result?.photos ?? []))
    added += result?.added ?? 0
    start = end
  } while (start < assetIds.length)
  return { photos, added }
}
