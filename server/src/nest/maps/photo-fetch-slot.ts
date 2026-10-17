// ── Concurrency limiter for outbound photo fetches ───────────────────────────
// Caps simultaneous Wikimedia/Google photo requests so a bulk import of hundreds
// of places cannot monopolise the event loop or trigger external API rate limits.
// Module-scoped ON PURPOSE (permissions-cache precedent): every consumer — the
// marker photo in MapsService and the enrichment column — must share one limiter.

const MAX_CONCURRENT_PHOTO_FETCHES = 5;
let photoFetchActive = 0;
const photoFetchQueue: Array<() => void> = [];

function acquirePhotoFetchSlot(): Promise<void> {
  if (photoFetchActive < MAX_CONCURRENT_PHOTO_FETCHES) {
    photoFetchActive++;
    return Promise.resolve();
  }
  return new Promise((resolve) => photoFetchQueue.push(resolve));
}

function releasePhotoFetchSlot(): void {
  const next = photoFetchQueue.shift();
  if (next) {
    next();
  } else {
    photoFetchActive--;
  }
}

/**
 * Runs an outbound photo fetch under the shared slot limit. Exported so the
 * enrichment module queues behind the same five slots — a picker that grabs
 * three images per selected place would otherwise sail past a cap the rest of
 * the app respects.
 */
export async function withPhotoFetchSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquirePhotoFetchSlot();
  try {
    return await fn();
  } finally {
    releasePhotoFetchSlot();
  }
}
