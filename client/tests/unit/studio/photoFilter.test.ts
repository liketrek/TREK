import { describe, it, expect } from 'vitest'
import type { JourneySource } from '../../../src/components/Studio/StudioSidebar'
import {
  emptyKeyFor, matchingEntries, matchingPhotos, photosFor, type PhotoFilter,
} from '../../../src/components/Studio/photoFilter'

/**
 * Narrowing the content browser to one day's pictures (#2064).
 *
 * A journey holds hundreds of photographs and most pages are about one entry,
 * so the browser's real question is "which day", not "which words". These are
 * the four rules that answer it, tested against literal arrays rather than
 * through a rendered panel: which entry a picture belongs to comes off the
 * journal's own junction, not off anything written on the picture.
 */

const source: JourneySource = {
  entries: [
    {
      id: 1, title: 'Reykjavík', story: 'walked all morning', location: 'Reykjavík',
      date: '2026-06-03', lat: null, lng: null, mood: null, weather: null,
      pros: [], cons: [], photoIds: [11, 12],
    },
    {
      id: 2, title: 'Dettifoss', story: null, location: 'Dettifoss',
      date: '2026-06-10', lat: null, lng: null, mood: null, weather: null,
      pros: ['loud'], cons: [], photoIds: [13],
    },
    {
      id: 3, title: 'A day with no pictures', story: null, location: null,
      date: '2026-06-11', lat: null, lng: null, mood: null, weather: null,
      pros: [], cons: [], photoIds: [],
    },
  ],
  photos: [
    { photoId: 11, caption: 'the harbour', entryIds: [1] },
    { photoId: 12, caption: null, entryIds: [1] },
    { photoId: 13, caption: null, entryIds: [2] },
    { photoId: 14, caption: 'nobody wrote about this one', entryIds: [] },
  ],
  photoEntries: { 11: 'reykjavík reykjavík', 12: 'reykjavík reykjavík', 13: 'dettifoss dettifoss' },
}

const ids = (filter: PhotoFilter) => photosFor(source, filter).map(p => p.photoId)

describe('which pictures a filter admits', () => {
  it('admits everything by default', () => {
    expect(ids({ kind: 'all' })).toEqual([11, 12, 13, 14])
  })

  it('admits one entry\'s pictures', () => {
    expect(ids({ kind: 'entry', id: 1 })).toEqual([11, 12])
  })

  it('admits the pictures no entry holds', () => {
    expect(ids({ kind: 'loose' })).toEqual([14])
  })

  /* A picture can hang on two days; it belongs to both of their pages. */
  it('admits a picture linked to more than one entry under each of them', () => {
    const shared: JourneySource = {
      ...source,
      photos: [{ photoId: 20, caption: null, entryIds: [1, 2] }],
    }
    expect(photosFor(shared, { kind: 'entry', id: 1 }).map(p => p.photoId)).toEqual([20])
    expect(photosFor(shared, { kind: 'entry', id: 2 }).map(p => p.photoId)).toEqual([20])
  })

  it('keeps what was just uploaded in the order it was sent, not the gallery\'s', () => {
    expect(ids({ kind: 'recent', photoIds: [13, 11] })).toEqual([13, 11])
  })

  it('passes over an id the gallery no longer has', () => {
    expect(ids({ kind: 'recent', photoIds: [13, 999] })).toEqual([13])
  })
})

describe('the words, over what the filter left', () => {
  it('matches a caption', () => {
    expect(matchingPhotos(source.photos, source, 'harbour').map(p => p.photoId)).toEqual([11])
  })

  /* Most photographs carry no words at all, so the entry's words count too. */
  it('matches on the entry a wordless picture belongs to', () => {
    expect(matchingPhotos(source.photos, source, 'dettifoss').map(p => p.photoId)).toEqual([13])
  })

  it('leaves the list alone when nothing was typed', () => {
    expect(matchingPhotos(source.photos, source, '   ')).toHaveLength(4)
  })

  it('narrows within the filter rather than across it', () => {
    const admitted = photosFor(source, { kind: 'entry', id: 1 })
    expect(matchingPhotos(admitted, source, 'dettifoss')).toEqual([])
  })

  it('searches an entry by its title, its story, its place and its verdict', () => {
    expect(matchingEntries(source, 'morning').map(e => e.id)).toEqual([1])
    expect(matchingEntries(source, 'loud').map(e => e.id)).toEqual([2])
    expect(matchingEntries(source, '')).toHaveLength(3)
  })
})

describe('why the grid is empty', () => {
  it('says the journey has none when it has none', () => {
    const bare = { ...source, photos: [] }
    expect(emptyKeyFor(bare, { kind: 'all' }, [])).toBe('journey.studio.noPhotos')
  })

  it('says the words matched nothing when the filter did admit something', () => {
    expect(emptyKeyFor(source, { kind: 'entry', id: 1 }, photosFor(source, { kind: 'entry', id: 1 })))
      .toBe('journey.studio.noMatches')
  })

  it('says the entry has none when the entry has none', () => {
    expect(emptyKeyFor(source, { kind: 'entry', id: 3 }, [])).toBe('journey.studio.noEntryPhotos')
  })

  it('says every picture belongs to an entry when none is loose', () => {
    expect(emptyKeyFor(source, { kind: 'loose' }, [])).toBe('journey.studio.noLoosePhotos')
  })

  it('falls back to the words for a filter with nothing of its own to say', () => {
    expect(emptyKeyFor(source, { kind: 'recent', photoIds: [] }, [])).toBe('journey.studio.noMatches')
  })
})
