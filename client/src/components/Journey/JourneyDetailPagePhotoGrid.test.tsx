import { describe, it, expect } from 'vitest'
import { render } from '../../../tests/helpers/render'
import { PhotoImg } from './JourneyDetailPagePhotoGrid'
import type { JourneyPhoto } from '../../store/journeyStore'

function buildPhoto(overrides: Partial<JourneyPhoto> = {}): JourneyPhoto {
  return {
    id: 1,
    entry_id: 10,
    photo_id: 515,
    sort_order: 0,
    shared: 1,
    created_at: 0,
    provider: 'local',
    ...overrides,
  }
}

describe('PhotoImg', () => {
  it('asks for the thumbnail of a photo', () => {
    const { container } = render(<PhotoImg photo={buildPhoto()} />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/515/thumbnail')
  })

  it('shows the poster of a clip behind the play badge', () => {
    const { container } = render(<PhotoImg photo={buildPhoto({ media_type: 'video', thumbnail_path: 'journey/poster.jpg' })} />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/515/thumbnail')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('draws no image for a clip without a poster, whose thumbnail route answers 404 (#2341)', () => {
    // The tile stays black with the play badge on it. An <img> here would only
    // add the broken-image glyph the reporter saw.
    const { container } = render(<PhotoImg photo={buildPhoto({ media_type: 'video', thumbnail_path: null })} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.firstElementChild?.className).toContain('bg-black')
  })

  it('still asks the server for a provider clip, which serves its own poster', () => {
    const { container } = render(<PhotoImg photo={buildPhoto({ media_type: 'video', provider: 'immich', thumbnail_path: null })} />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/api/photos/515/thumbnail')
  })
})
