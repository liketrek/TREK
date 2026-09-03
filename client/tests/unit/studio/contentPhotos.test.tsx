import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { BookDocument, BookPageSetup } from '@trek/shared'
import { bookPageSetupSchema, normalizeBookDocument } from '@trek/shared'
import { fireEvent, render, screen, waitFor, within } from '../../helpers/render'
import { StudioSidebar, type JourneySource } from '../../../src/components/Studio/StudioSidebar'
import type { StudioUploader } from '../../../src/components/Studio/studioUpload'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * Content > Photos, narrowed to a day, and the upload cell (#2064).
 *
 * A journey of three hundred pictures showed them as one grid, so laying out
 * the page for one day meant scrolling past every other day to find its
 * pictures. What these check is that the browser can be narrowed to one
 * entry, to the pictures no entry claims, and to what just arrived; that the
 * search still applies on top; and that a picture uploaded here lands where
 * the panel says it will, the entry the filter names or the gallery when it
 * names none.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

type Entry = JourneySource['entries'][number]

const entry = (over: Partial<Entry>): Entry => ({
  id: 1, title: 'Reykjavik', story: null, location: null, date: '2026-06-01',
  lat: null, lng: null, mood: null, weather: null, pros: [], cons: [], photoIds: [],
  ...over,
})

/** Two days with pictures, one written day without, and one picture only the gallery holds. */
const source: JourneySource = {
  entries: [
    entry({ id: 1, title: 'Reykjavik', date: '2026-06-01', photoIds: [11, 12] }),
    entry({ id: 2, title: 'Vik', location: 'Vik i Myrdal', date: '2026-06-02', photoIds: [13] }),
    entry({ id: 3, title: 'A written day', date: '2026-06-03' }),
  ],
  photos: [
    { photoId: 11, caption: null, entryIds: [1] },
    { photoId: 12, caption: 'Harbour', entryIds: [1] },
    { photoId: 13, caption: null, entryIds: [2] },
    { photoId: 14, caption: 'Loose', entryIds: [] },
  ],
  photoEntries: { 11: 'reykjavik', 12: 'reykjavik', 13: 'vik vik i myrdal' },
}

/** One inner spread, tied to a day or to none. */
const book = (entryId: number | null = null): BookDocument => normalizeBookDocument({
  version: 1,
  title: 'Iceland',
  page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
  spreads: [{ id: 'sp1', role: 'inner', entryId, background: null, elements: [], parked: [] }],
})

const nothing: StudioUploader = async () => ({ photoIds: [], failed: 0, skippedVideos: 0 })

beforeEach(() => {
  useStudioStore.getState().load(book())
})

/** Render the sidebar and open Content, which lands on the Photos tab. */
function openContent(src = source, over: { canEdit?: boolean; onUpload?: StudioUploader } = {}) {
  const view = render(
    <StudioSidebar
      page={page}
      pxPerMm={96 / 25.4}
      bookView={false}
      source={src}
      stats={null}
      path={[]}
      t={(k: string) => k}
      locale="en-US"
      canEdit={over.canEdit ?? true}
      onUpload={over.onUpload ?? nothing}
      onToggleStop={async () => true}
    />,
  )
  fireEvent.click(screen.getByLabelText('journey.studio.content'))
  return view
}

/** The pictures the grid shows now, by id, in grid order. */
const shown = () => [...document.querySelectorAll('.st-photo-cell:not(.is-upload) img')]
  .map(img => Number(img.getAttribute('src')!.match(/\/photos\/(\d+)\//)![1]))

const openMenu = () => fireEvent.click(screen.getByTitle('journey.studio.filterPhotos'))

const chipLabel = () => document.querySelector('.st-filter-name')!.textContent

const picture = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

describe('the filter menu', () => {
  it('lists every entry that has pictures, with how many', () => {
    openContent()
    openMenu()

    const items = screen.getAllByRole('menuitemradio').map(b => b.textContent)
    expect(items[0]).toContain('journey.studio.filterAll')
    expect(items[0]).toContain('4')
    expect(items[1]).toContain('journey.studio.filterLoose')
    expect(items[1]).toContain('1')
    expect(items.find(s => s!.includes('Reykjavik'))).toContain('2')
    expect(items.find(s => s!.includes('Vik i Myrdal'))).toContain('1')
    // A day with words and no pictures is not a filter worth offering.
    expect(items.some(s => s!.includes('A written day'))).toBe(false)
  })

  it('narrows the grid to one day, and the cross widens it again', () => {
    openContent()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Reykjavik/ }))

    expect(shown()).toEqual([11, 12])
    expect(chipLabel()).toBe('Reykjavik')

    fireEvent.click(screen.getByLabelText('common.clear'))

    expect(shown()).toEqual([11, 12, 13, 14])
    expect(chipLabel()).toBe('journey.studio.filterAll')
  })

  it('shows only the pictures no entry claims', () => {
    openContent()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /journey\.studio\.filterLoose/ }))

    expect(shown()).toEqual([14])
  })

  it('combines with the search rather than replacing it', () => {
    openContent()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Reykjavik/ }))
    fireEvent.change(screen.getByLabelText('journey.studio.searchContent'), { target: { value: 'harbour' } })

    expect(shown()).toEqual([12])
  })

  /* Four reasons for an empty grid, each said in its own words. */
  it('says why the grid is empty', () => {
    openContent()
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Reykjavik/ }))
    fireEvent.change(screen.getByLabelText('journey.studio.searchContent'), { target: { value: 'myrdal' } })
    expect(screen.getByText('journey.studio.noMatches')).toBeInTheDocument()
  })

  it('says so when every picture belongs to a day', () => {
    openContent({ ...source, photos: source.photos.filter(p => p.entryIds.length) })
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /journey\.studio\.filterLoose/ }))

    expect(shown()).toEqual([])
    expect(screen.getByText('journey.studio.noLoosePhotos')).toBeInTheDocument()
  })
})

describe('the way in from an entry', () => {
  it('opens the pictures of the day from its card', () => {
    openContent()
    fireEvent.click(screen.getByRole('button', { name: /journey\.studio\.entries/ }))

    const card = screen.getByText('Reykjavik').closest('.st-entry') as HTMLElement
    fireEvent.click(within(card).getByText('journey.studio.entryPhotos'))

    expect(shown()).toEqual([11, 12])
    expect(chipLabel()).toBe('Reykjavik')
  })

  it('offers no such chip on a day without pictures', () => {
    openContent()
    fireEvent.click(screen.getByRole('button', { name: /journey\.studio\.entries/ }))

    const card = screen.getByText('A written day').closest('.st-entry') as HTMLElement
    expect(within(card).queryByText('journey.studio.entryPhotos')).toBeNull()
  })

  it('offers the page\'s own day while the filter is not on it', () => {
    useStudioStore.getState().load(book(1))
    openContent()

    fireEvent.click(screen.getByText('journey.studio.filterThisPage'))

    expect(shown()).toEqual([11, 12])
    expect(screen.queryByText('journey.studio.filterThisPage')).toBeNull()
  })

  it('offers nothing for a page tied to a day without pictures', () => {
    useStudioStore.getState().load(book(3))
    openContent()
    expect(screen.queryByText('journey.studio.filterThisPage')).toBeNull()
  })
})

describe('the upload cell', () => {
  it('is not there for a viewer', () => {
    openContent(source, { canEdit: false })

    expect(document.querySelector('.st-photo-cell.is-upload')).toBeNull()
    expect(document.querySelector('input[type="file"]')).toBeNull()
    expect(screen.queryByText('journey.studio.uploadToGallery')).toBeNull()
  })

  it('sends into the gallery when no day is chosen', async () => {
    const onUpload = vi.fn(nothing)
    openContent(source, { onUpload })
    expect(screen.getByText('journey.studio.uploadToGallery')).toBeInTheDocument()

    const file = picture('a.jpg')
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } })

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith([file], null, expect.any(Function)))
  })

  it('sends into the day the filter names', async () => {
    const onUpload = vi.fn(nothing)
    openContent(source, { onUpload })
    openMenu()
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Reykjavik/ }))
    expect(screen.getByText('journey.studio.uploadToEntry')).toBeInTheDocument()

    const file = picture('b.jpg')
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } })

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith([file], 1, expect.any(Function)))
  })

  /*
   * The gallery sorts what arrives to its end, out of sight under three
   * hundred pictures; the filter is what brings it into view. The source
   * here already holds the new id, as the store would once the upload landed.
   */
  it('shows what just arrived once it has', async () => {
    const onUpload = vi.fn<StudioUploader>(async () => ({ photoIds: [99], failed: 0, skippedVideos: 0 }))
    const arrived: JourneySource = {
      ...source,
      photos: [...source.photos, { photoId: 99, caption: null, entryIds: [] }],
    }
    openContent(arrived, { onUpload })
    fireEvent.change(screen.getByLabelText('journey.studio.searchContent'), { target: { value: 'harbour' } })

    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [picture('c.jpg')] } })

    await waitFor(() => expect(chipLabel()).toBe('journey.studio.filterRecent'))
    expect(shown()).toEqual([99])
    // The search is let go of too, or the new picture would be hidden by it.
    expect((screen.getByLabelText('journey.studio.searchContent') as HTMLInputElement).value).toBe('')
  })

  it('takes a drop anywhere on the panel', async () => {
    const onUpload = vi.fn(nothing)
    openContent(source, { onUpload })

    const file = picture('d.jpg')
    fireEvent.drop(document.querySelector('.st-panel-scroll')!, {
      dataTransfer: { files: [file], types: ['Files'] },
    })

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith([file], null, expect.any(Function)))
  })
})
