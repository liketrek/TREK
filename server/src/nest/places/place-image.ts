const URL_PREFIX = '/uploads/places/';

export function placeImageUrl(filename: string): string {
  return `${URL_PREFIX}${filename}`;
}

export function isUploadedPlaceImage(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith(URL_PREFIX);
}

// `reclaimPlaceImage` (the free function this file used to export) is gone
// (Plan 3h Task 6, closing out a 3-plan-old carve-out): `PlacesService` had
// its own converted private `reclaimPlaceImage` since Plan 3c Task 4
// (`places.service.ts`, PI1/PI2 through `PlacesRepository`/
// `CollectionPlacesRepository.existsByImageUrl`); `collections.service.ts`'s
// four call sites (`updatePlace`, `deletePlace`, `deletePlacesMany`,
// `setPlaceImage`) now call a mirroring private `CollectionsService
// .reclaimPlaceImage` method instead, through `PlacesRepository
// .existsByImageUrl` (already injected there, `tripPlaces`) and
// `CollectionPlacesRepository.existsByImageUrl` (already injected,
// `collectionPlaces`) — a whole-tree grep for `from '.*place-image'` (run
// before this deletion) confirmed zero remaining importers of this function;
// `placeImageUrl`/`isUploadedPlaceImage` above still have real importers
// (`collections.controller.ts`, `places.controller.ts`, `places.service.ts`)
// and stay.
