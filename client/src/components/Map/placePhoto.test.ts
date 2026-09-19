import { describe, it, expect } from 'vitest'
import { isCustomPlaceImage, markerPhotoHtml, photoCacheKey, photoSourcesKey } from './placePhoto'

function imgOf(html: string): HTMLImageElement {
  const holder = document.createElement('div')
  holder.innerHTML = html
  return holder.querySelector('img')!
}

describe('isCustomPlaceImage', () => {
  it('FE-MAP-PLACEPHOTO-001: an upload or an inline image is shown as it is, a provider photo is not', () => {
    expect(isCustomPlaceImage('/uploads/places/a.jpg')).toBe(true)
    expect(isCustomPlaceImage('data:image/png;base64,AAA')).toBe(true)
    expect(isCustomPlaceImage('/api/maps/place-photo/gp-1~p0/bytes')).toBe(false)
    expect(isCustomPlaceImage(null)).toBe(false)
  })
})

describe('markerPhotoHtml', () => {
  it('FE-MAP-PLACEPHOTO-002: sizes the picture by its style, where no stylesheet rule can undo it', () => {
    // Preflight's `height: auto` and Leaflet's `width: auto` both outrank a width or
    // height attribute, so a photo that is not a small square has to be pinned here.
    const img = imgOf(markerPhotoHtml('/uploads/places/wide.jpg'))
    expect(img.getAttribute('src')).toBe('/uploads/places/wide.jpg')
    expect(img.style.width).toBe('100%')
    expect(img.style.height).toBe('100%')
    expect(img.hasAttribute('width')).toBe(false)
    expect(img.hasAttribute('height')).toBe(false)
  })

  it('FE-MAP-PLACEPHOTO-003: escapes the url, which a user can set', () => {
    const html = markerPhotoHtml('/uploads/x" onerror="alert(1)" y="')
    expect(html).not.toContain('onerror="alert(1)"')
    expect(imgOf(html).getAttribute('src')).toBe('/uploads/x" onerror="alert(1)" y="')
  })
})

describe('photoCacheKey', () => {
  it('FE-MAP-PLACEPHOTO-004: a picked provider photo is its own key, ahead of the provider id', () => {
    expect(photoCacheKey({ image_url: '/api/maps/place-photo/gp-1~p2/bytes', google_place_id: 'gp-1', lat: 1, lng: 2 }))
      .toBe('/api/maps/place-photo/gp-1~p2/bytes')
  })

  it('FE-MAP-PLACEPHOTO-005: otherwise the provider id, then the coordinates, then nothing', () => {
    expect(photoCacheKey({ image_url: '/uploads/places/a.jpg', google_place_id: 'gp-1', osm_id: 'node/1' })).toBe('gp-1')
    expect(photoCacheKey({ osm_id: 'node/1', lat: 1, lng: 2 })).toBe('node/1')
    expect(photoCacheKey({ lat: 0, lng: 0 })).toBe('0,0')
    expect(photoCacheKey({ image_url: 'https://example.com/a.jpg', lat: null, lng: null })).toBe('')
  })
})

describe('photoSourcesKey', () => {
  const place = { id: 7, google_place_id: 'gp-7', lat: 48, lng: 2 }

  it('FE-MAP-PLACEPHOTO-006: changes when an upload comes off or another photo is picked', () => {
    const withUpload = photoSourcesKey([{ ...place, image_url: '/uploads/places/a.jpg' }])
    const bare = photoSourcesKey([{ ...place, image_url: null }])
    const picked = photoSourcesKey([{ ...place, image_url: '/api/maps/place-photo/gp-7~p0/bytes' }])
    const pickedAgain = photoSourcesKey([{ ...place, image_url: '/api/maps/place-photo/gp-7~p1/bytes' }])
    expect(new Set([withUpload, bare, picked, pickedAgain]).size).toBe(4)
  })

  it('FE-MAP-PLACEPHOTO-007: stays put when one upload replaces another, which needs no thumb', () => {
    expect(photoSourcesKey([{ ...place, image_url: '/uploads/places/a.jpg' }]))
      .toBe(photoSourcesKey([{ ...place, image_url: '/uploads/places/b.jpg' }]))
  })
})
