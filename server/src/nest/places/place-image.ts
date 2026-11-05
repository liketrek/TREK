const URL_PREFIX = '/uploads/places/';

export function placeImageUrl(filename: string): string {
  return `${URL_PREFIX}${filename}`;
}

// No place or saved-place write deletes a replaced image any more: copies
// share the object by reference and other columns can name it, so the storage
// reclaim job removes it once no row does (#2924, places-storage-refs.service.ts
// and collections-storage-refs.service.ts answer for these columns).
