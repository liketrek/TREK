import type { JourneySource } from './StudioSidebar'

/**
 * Which of the journey's pictures the content browser shows.
 *
 * `recent` holds ids rather than a flag on the photo: what just arrived is a
 * fact about this sitting, not about the picture, and the journey store has no
 * reason to remember it.
 */
export type PhotoFilter =
  | { kind: 'all' }
  | { kind: 'entry'; id: number }
  | { kind: 'loose' }
  | { kind: 'recent'; photoIds: number[] }

type Photo = JourneySource['photos'][number]

/**
 * The pictures a filter admits, before anything is searched.
 *
 * Which entry a picture belongs to is read off the journal's own junction
 * rather than off its words, which is what lets "not in an entry" mean exactly
 * that. Pure, and out here rather than inside the panel, because these four
 * rules are the feature and a rendered component is an awkward place to prove
 * them right.
 */
export function photosFor(source: JourneySource, filter: PhotoFilter): Photo[] {
  switch (filter.kind) {
    case 'entry':
      return source.photos.filter(p => p.entryIds.includes(filter.id))
    case 'loose':
      return source.photos.filter(p => !p.entryIds.length)
    case 'recent': {
      // In the order they were sent, which is the order they were chosen in,
      // not wherever the gallery sorted them.
      const byId = new Map(source.photos.map(p => [p.photoId, p] as const))
      return filter.photoIds.flatMap(id => {
        const photo = byId.get(id)
        return photo ? [photo] : []
      })
    }
    default:
      return source.photos
  }
}

/**
 * The words, over what the filter left.
 *
 * A photo matches on its own caption and on the entry it belongs to: most
 * photos carry no words at all, so matching only captions would make the
 * search box look broken on exactly the journeys that need it.
 */
export function matchingPhotos(photos: Photo[], source: JourneySource, query: string): Photo[] {
  const q = query.trim().toLowerCase()
  if (!q) return photos
  return photos.filter(p =>
    (p.caption && p.caption.toLowerCase().includes(q))
    || (source.photoEntries[p.photoId] || '').includes(q))
}

/** The entries the words admit, for the other tab. */
export function matchingEntries(source: JourneySource, query: string): JourneySource['entries'] {
  const q = query.trim().toLowerCase()
  if (!q) return source.entries
  return source.entries.filter(e =>
    [e.title, e.story, e.location, ...e.pros, ...e.cons]
      .some(v => v && v.toLowerCase().includes(q)))
}

/**
 * Why the grid is empty, which is four different answers.
 *
 * "No photos" on a journey with three hundred of them, because the filter is
 * on a day that has none, reads as the pictures having gone.
 */
export function emptyKeyFor(source: JourneySource, filter: PhotoFilter, admitted: Photo[]): string {
  if (!source.photos.length) return 'journey.studio.noPhotos'
  if (admitted.length) return 'journey.studio.noMatches'
  if (filter.kind === 'entry') return 'journey.studio.noEntryPhotos'
  if (filter.kind === 'loose') return 'journey.studio.noLoosePhotos'
  return 'journey.studio.noMatches'
}
