// FE-COMP-COLPICKER-001 to FE-COMP-COLPICKER-016
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render'
import type { Collection, CollectionDetailResponse, CollectionPlace } from '@trek/shared'
import { collectionsApi } from '../../api/collections'
import { useAuthStore } from '../../store/authStore'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { buildUser } from '../../../tests/helpers/factories'
import { useTranslation } from '../../i18n/TranslationContext'
import CollectionPicker from './CollectionPicker'

type Props = React.ComponentProps<typeof CollectionPicker>
function Harness(props: Omit<Props, 't'>): React.ReactElement {
  const { t } = useTranslation()
  return <CollectionPicker {...props} t={t} />
}

const listA: Collection = { id: 1, owner_id: 1, name: 'Tokyo 2026', color: '#ec4899' }
const listB: Collection = { id: 2, owner_id: 1, name: 'Rome', color: null }

function place(over: Partial<CollectionPlace> & { id: number; collection_id: number; name: string }): CollectionPlace {
  return { status: 'idea', ...over }
}

// Zebra Cafe sits far from the bias box, Alpha Bar right inside it — so the
// alphabetical and the proximity order are deliberately opposites.
const zebra = place({ id: 10, collection_id: 1, name: 'Zebra Cafe', address: 'Shibuya 1', lat: 35.6, lng: 139.7 })
const alpha = place({ id: 11, collection_id: 2, name: 'Alpha Bar', address: 'Trastevere 9', lat: 41.9, lng: 12.5, category: { id: 3, name: 'Bar', color: '#f59e0b', icon: 'beer' } })
const noCoords = place({ id: 12, collection_id: 2, name: 'Mystery Spot', status: 'visited' })

function detail(collection: Collection, places: CollectionPlace[]): CollectionDetailResponse {
  return { collection, places }
}

function setup(over: Partial<Omit<Props, 't'>> = {}) {
  const props: Omit<Props, 't'> = { onSelect: vi.fn(), ...over }
  const view = render(<Harness {...props} />)
  return { ...view, props }
}

describe('CollectionPicker', () => {
  beforeEach(() => {
    resetAllStores()
    // Keeps PlaceAvatar from reaching for provider photos in jsdom.
    seedStore(useAuthStore, { user: buildUser(), placesPhotosEnabled: false })
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ collections: [listA, listB], incomingInvites: [] })
    vi.spyOn(collectionsApi, 'get').mockImplementation(async (id: number) =>
      id === 1 ? detail(listA, [zebra]) : detail(listB, [alpha, noCoords]),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-COMP-COLPICKER-017: shows the first ten and offers the rest behind a button', async () => {
    // Saved places accumulate across every list, so the panel used to scroll
    // without end.
    const many = Array.from({ length: 23 }, (_, i) =>
      place({ id: 100 + i, collection_id: 1, name: `Place ${String(i).padStart(2, '0')}` }),
    )
    vi.spyOn(collectionsApi, 'get').mockImplementation(async (id: number) =>
      id === 1 ? detail(listA, many) : detail(listB, []),
    )
    setup()

    expect(await screen.findByText('Place 00')).toBeInTheDocument()
    expect(screen.getByText('Place 09')).toBeInTheDocument()
    expect(screen.queryByText('Place 10')).not.toBeInTheDocument()

    const more = () => screen.getByRole('button', { name: /show .* more/i })
    fireEvent.click(more())
    expect(screen.getByText('Place 19')).toBeInTheDocument()
    expect(screen.queryByText('Place 20')).not.toBeInTheDocument()

    fireEvent.click(more())
    expect(screen.getByText('Place 22')).toBeInTheDocument()
    // Nothing left to ask for.
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-018: searching resets the page and looks at every place, not just the visible ten', async () => {
    const many = Array.from({ length: 23 }, (_, i) =>
      place({ id: 100 + i, collection_id: 1, name: `Place ${String(i).padStart(2, '0')}` }),
    )
    vi.spyOn(collectionsApi, 'get').mockImplementation(async (id: number) =>
      id === 1 ? detail(listA, many) : detail(listB, []),
    )
    setup()
    await screen.findByText('Place 00')

    // "Place 22" is well past the first page; the filter has to reach it.
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'Place 22' } })

    expect(screen.getByText('Place 22')).toBeInTheDocument()
    expect(screen.queryByText('Place 00')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-001: shows a spinner until the lists have loaded', async () => {
    const { container } = setup()
    expect(container.querySelector('.animate-spin')).toBeTruthy()
    expect(await screen.findByText('Zebra Cafe')).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).toBeFalsy()
  })

  it('FE-COMP-COLPICKER-002: merges the places of every list and shows their addresses', async () => {
    setup()
    expect(await screen.findByText('Zebra Cafe')).toBeInTheDocument()
    expect(screen.getByText('Alpha Bar')).toBeInTheDocument()
    expect(screen.getByText('Mystery Spot')).toBeInTheDocument()
    expect(screen.getByText('Shibuya 1')).toBeInTheDocument()
    expect(screen.getByText('Saved places')).toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-003: sorts alphabetically without a bias box', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    const names = screen.getAllByRole('button', { name: /Alpha Bar|Mystery Spot|Zebra Cafe/ }).map(b => b.textContent)
    expect(names).toEqual(['Alpha BarTrastevere 9', 'Mystery Spot', 'Zebra CafeShibuya 1'])
  })

  it('FE-COMP-COLPICKER-004: a bias box sorts by proximity and pushes coordinate-less places last', async () => {
    setup({ bias: { low: { lat: 35.5, lng: 139.6 }, high: { lat: 35.7, lng: 139.8 } } })
    await screen.findByText('Zebra Cafe')
    const names = screen.getAllByRole('button', { name: /Alpha Bar|Mystery Spot|Zebra Cafe/ }).map(b => b.textContent)
    expect(names).toEqual(['Zebra CafeShibuya 1', 'Alpha BarTrastevere 9', 'Mystery Spot'])
  })

  it('FE-COMP-COLPICKER-005: picking a place hands the whole record to onSelect', async () => {
    const { props } = setup()
    fireEvent.click(await screen.findByRole('button', { name: /Zebra Cafe/ }))
    expect(props.onSelect).toHaveBeenCalledTimes(1)
    expect(props.onSelect).toHaveBeenCalledWith(zebra)
  })

  it('FE-COMP-COLPICKER-006: the search box matches on name', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.change(screen.getByPlaceholderText('Search your saved places'), { target: { value: 'zebra' } })
    expect(screen.getByText('Zebra Cafe')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Bar')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-007: the search box also matches on address', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.change(screen.getByPlaceholderText('Search your saved places'), { target: { value: 'trastevere' } })
    expect(screen.getByText('Alpha Bar')).toBeInTheDocument()
    expect(screen.queryByText('Zebra Cafe')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-008: a search with no hits falls back to the empty copy', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.change(screen.getByPlaceholderText('Search your saved places'), { target: { value: 'nothing here' } })
    expect(screen.getByText('No saved places to add')).toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-009: the list dropdown counts each list and filters to it', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.click(screen.getByRole('button', { name: /All lists/ }))

    const menu = screen.getByRole('listbox')
    expect(within(menu).getByRole('option', { name: /All lists/ })).toHaveTextContent('3')
    expect(within(menu).getByRole('option', { name: /Rome/ })).toHaveTextContent('2')

    fireEvent.click(within(menu).getByRole('option', { name: /Tokyo 2026/ }))
    expect(screen.getByText('Zebra Cafe')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Bar')).not.toBeInTheDocument()
    // The trigger adopts the picked option and the menu closes.
    expect(screen.getByRole('button', { name: /Tokyo 2026/ })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-010: the status dropdown filters by saved status', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.click(screen.getByRole('button', { name: /^All$/ }))
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: /Visited/ }))

    expect(screen.getByText('Mystery Spot')).toBeInTheDocument()
    expect(screen.queryByText('Zebra Cafe')).not.toBeInTheDocument()
    expect(screen.queryByText('Alpha Bar')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-011: the selected option is flagged for assistive tech', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.click(screen.getByRole('button', { name: /All lists/ }))
    const menu = screen.getByRole('listbox')
    expect(within(menu).getByRole('option', { name: /All lists/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(menu).getByRole('option', { name: /Rome/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('FE-COMP-COLPICKER-012: a click outside closes an open dropdown', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    const trigger = screen.getByRole('button', { name: /All lists/ })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.mouseDown(document.body)
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  it('FE-COMP-COLPICKER-013: a mousedown inside the dropdown keeps it open', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.click(screen.getByRole('button', { name: /All lists/ }))
    fireEvent.mouseDown(screen.getByRole('listbox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-014: Escape closes an open dropdown', async () => {
    setup()
    await screen.findByText('Zebra Cafe')
    fireEvent.click(screen.getByRole('button', { name: /All lists/ }))
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    // A different key leaves it alone.
    fireEvent.click(screen.getByRole('button', { name: /All lists/ }))
    fireEvent.keyDown(document, { key: 'a' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-015: a list whose detail request fails is skipped, the rest still load', async () => {
    vi.mocked(collectionsApi.get).mockImplementation(async (id: number) => {
      if (id === 1) throw new Error('403')
      return detail(listB, [alpha])
    })
    setup()
    expect(await screen.findByText('Alpha Bar')).toBeInTheDocument()
    expect(screen.queryByText('Zebra Cafe')).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-016: a failing list request degrades to the empty state without filters', async () => {
    vi.mocked(collectionsApi.list).mockRejectedValue(new Error('offline'))
    setup()
    expect(await screen.findByText('No saved places to add')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /All lists/ })).not.toBeInTheDocument()
  })

  it('FE-COMP-COLPICKER-017: with no lists at all the filter row stays hidden', async () => {
    vi.mocked(collectionsApi.list).mockResolvedValue({ collections: [], incomingInvites: [] })
    setup()
    expect(await screen.findByText('No saved places to add')).toBeInTheDocument()
    expect(collectionsApi.get).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /All lists/ })).not.toBeInTheDocument()
  })
})
