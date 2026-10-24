// FE-JOURNEY-PHOTOLAYER-001
import { describe, expect, it } from 'vitest'
import { clusterPhotos, photoMarkerHtml } from './journeyPhotoLayer'

describe('journey photo layer (#2453)', () => {
  it('FE-JOURNEY-PHOTOLAYER-001: buckets by screen position, anchors on the first photo, badges a count', () => {
    const photos = [
      { id: '1', lat: 1, lng: 1, thumbUrl: '/a.jpg' },
      { id: '2', lat: 1.2, lng: 1.2, thumbUrl: '/b.jpg' },
      { id: '3', lat: 50, lng: 50, thumbUrl: '/c.jpg' },
    ]
    const clusters = clusterPhotos(photos, (lat, lng) => ({ x: lng * 10, y: lat * 10 }))
    expect(clusters.map(c => c.members.map(m => m.id))).toEqual([['1', '2'], ['3']])
    expect(clusters[0]).toMatchObject({ lat: 1, lng: 1 })
    expect(photoMarkerHtml('/a b.jpg', 1)).toContain("url('/a%20b.jpg')")
    expect(photoMarkerHtml('/a.jpg', 1)).not.toContain('</span>')
    expect(photoMarkerHtml('/a.jpg', 3)).toContain('>3<')
  })
})
