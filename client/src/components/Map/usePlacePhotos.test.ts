import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Place } from '../../types'

const getCached = vi.fn()
vi.mock('../../services/photoService', () => ({
  getCached: (...a: unknown[]) => getCached(...a),
  isLoading: () => false,
  fetchPhoto: () => {},
  onThumbReady: () => () => {},
  getAllThumbs: () => ({}),
}))

const { placePhotoUrl, placePopupPhotoUrl } = await import('./usePlacePhotos')

const place = (over: Partial<Place> = {}) =>
  ({ id: 1, trip_id: 1, name: 'Bowling', lat: 30, lng: 31, ...over }) as Place

const THUMB = 'data:image/jpeg;base64,AAAA'
const PROXY = '/api/maps/place-photo/abc123'

beforeEach(() => getCached.mockReset())

describe('placePhotoUrl (the pin)', () => {
  it('uses the cached thumbnail, which is what a 36px circle wants', () => {
    expect(placePhotoUrl(place(), { '30,31': THUMB })).toBe(THUMB)
  })

  it('prefers a user-uploaded image over the fetched thumbnail', () => {
    expect(placePhotoUrl(place({ image_url: '/uploads/mine.jpg' }), { '30,31': THUMB })).toBe('/uploads/mine.jpg')
  })
})

describe('placePopupPhotoUrl (the hover card)', () => {
  // The regression this exists for: the card is ~220px wide and the thumbnail is
  // downscaled to 48px, so showing the pin's image made the card look blurry.
  it('prefers the full-size proxy URL over the 48px thumbnail', () => {
    getCached.mockReturnValue({ photoUrl: PROXY, thumbDataUrl: THUMB })

    expect(placePopupPhotoUrl(place(), { '30,31': THUMB })).toBe(PROXY)
  })

  it('falls back to the thumbnail when no full-size source is cached', () => {
    getCached.mockReturnValue({ photoUrl: null, thumbDataUrl: THUMB })

    expect(placePopupPhotoUrl(place(), { '30,31': THUMB })).toBe(THUMB)
  })

  it('takes a proxy URL stored on the place itself', () => {
    getCached.mockReturnValue(undefined)

    expect(placePopupPhotoUrl(place({ image_url: PROXY }), {})).toBe(PROXY)
  })

  it('still lets a user-uploaded image win', () => {
    getCached.mockReturnValue({ photoUrl: PROXY, thumbDataUrl: THUMB })

    expect(placePopupPhotoUrl(place({ image_url: '/uploads/mine.jpg' }), {})).toBe('/uploads/mine.jpg')
  })

  // A bare provider URL is a fetch seed, not something an <img src> can render.
  it('ignores a non-displayable provider URL', () => {
    getCached.mockReturnValue({ photoUrl: 'https://lh3.googleusercontent.com/p/AF1', thumbDataUrl: THUMB })

    expect(placePopupPhotoUrl(place(), { '30,31': THUMB })).toBe(THUMB)
  })

  it('returns null when there is no image anywhere', () => {
    getCached.mockReturnValue(undefined)

    expect(placePopupPhotoUrl(place(), {})).toBeNull()
  })
})
