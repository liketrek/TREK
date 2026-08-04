import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Collection, CollectionListResponse } from '@trek/shared'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MPlacesSaveToCollectionSheet from '../../../../src/mobile/screens/trip/places/MPlacesSaveToCollectionSheet'
import { collectionsApi } from '../../../../src/api/collections'

// FE-MOB-PSAVE-001 to FE-MOB-PSAVE-015

const listResponse = (collections: Collection[]): CollectionListResponse => ({ collections, incomingInvites: [] })

function list(over: Partial<Collection>): Collection {
  return { id: 1, owner_id: 7, name: 'List', color: null, place_count: 0, ...over } as Collection
}

const FAVORITES = list({ id: 1, name: 'Favorites', color: '#ff0000', place_count: 4 })
const WISHLIST = list({ id: 2, name: 'Wishlist' })

let addToast: ReturnType<typeof vi.fn>

function renderSheet(props: Partial<Parameters<typeof MPlacesSaveToCollectionSheet>[0]> = {}) {
  const onClose = vi.fn()
  const onDone = vi.fn()
  const view = render(
    <MPlacesSaveToCollectionSheet
      open
      tripId={5}
      placeIds={[11, 12]}
      onClose={onClose}
      onDone={onDone}
      {...props}
    />,
  )
  return { ...view, onClose, onDone }
}

describe('MPlacesSaveToCollectionSheet', () => {
  beforeEach(() => {
    addToast = vi.fn()
    window.__addToast = addToast as unknown as typeof window.__addToast
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__addToast
  })

  it('FE-MOB-PSAVE-001: lists the collections the user owns with their place counts', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]))
    renderSheet()
    expect(await screen.findByText('Favorites')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Save 2 to a list' })).toBeInTheDocument()
    expect(screen.getByText('4 places')).toBeInTheDocument()
    expect(screen.getByText('0 places')).toBeInTheDocument()
    expect(screen.getByText('Duplicates are skipped automatically')).toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-002: drops lists shared with the user — they cannot be written to', async () => {
    // A list the server sent without a count must still render a countable row.
    const untracked = { id: 4, owner_id: 7, name: 'Untracked' } as Collection
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(
      listResponse([FAVORITES, list({ id: 3, name: 'Shared trip ideas', is_owner: false }), untracked]),
    )
    renderSheet()
    expect(await screen.findByText('Favorites')).toBeInTheDocument()
    expect(screen.queryByText('Shared trip ideas')).not.toBeInTheDocument()
    expect(screen.getByText('Untracked')).toBeInTheDocument()
    expect(screen.getAllByText('0 places')).toHaveLength(1)
  })

  it('FE-MOB-PSAVE-003: shows the spinner until the lists arrive', async () => {
    let resolve!: (v: CollectionListResponse) => void
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r }))
    renderSheet()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
    expect(screen.queryByText('You have no lists yet')).not.toBeInTheDocument()
    resolve(listResponse([FAVORITES]))
    expect(await screen.findByText('Favorites')).toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-004: reports the empty state when the response carries no collections', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ incomingInvites: [] } as unknown as CollectionListResponse)
    renderSheet()
    expect(await screen.findByText('You have no lists yet')).toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-005: a failing request falls back to the empty state instead of breaking', async () => {
    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'))
    renderSheet()
    expect(await screen.findByText('You have no lists yet')).toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-006: requests nothing while the sheet is closed', () => {
    const spy = vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([]))
    renderSheet({ open: false })
    expect(spy).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-007: the search box appears above five lists and filters by name', async () => {
    const many = [1, 2, 3, 4, 5, 6].map(id => list({ id, name: `List ${id}` }))
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse(many))
    renderSheet()
    const search = await screen.findByPlaceholderText('Search')
    fireEvent.change(search, { target: { value: 'list 4' } })
    expect(screen.getByText('List 4')).toBeInTheDocument()
    expect(screen.queryByText('List 5')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'nope' } })
    expect(screen.getByText('You have no lists yet')).toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-008: five lists or fewer need no search box', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]))
    renderSheet()
    await screen.findByText('Favorites')
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-009: picking a list copies every selected place and reports the count', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]))
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 2, skipped: [] })
    const { onClose, onDone } = renderSheet()
    fireEvent.click(await screen.findByText('Favorites'))

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(save).toHaveBeenCalledWith(1, 5, [11, 12])
    expect(addToast).toHaveBeenCalledWith('Saved 2 to Favorites', 'success', undefined)
    expect(onClose).toHaveBeenCalled()
  })

  it('FE-MOB-PSAVE-010: duplicates the server skipped are reported separately', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]))
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({
      copied: 1, skipped: [{ id: 12, name: 'Louvre' }],
    })
    renderSheet()
    fireEvent.click(await screen.findByText('Favorites'))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Skipped 1 duplicates', 'info', undefined))
    expect(addToast).toHaveBeenCalledWith('Saved 1 to Favorites', 'success', undefined)
  })

  it('FE-MOB-PSAVE-011: a no-op save says so instead of staying silent', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]))
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 0, skipped: [] })
    renderSheet()
    fireEvent.click(await screen.findByText('Favorites'))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Nothing to copy', 'info', undefined))
  })

  it('FE-MOB-PSAVE-012: a failed save surfaces the server message and keeps the sheet open', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]))
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockRejectedValue({
      response: { data: { error: 'List is full' } },
    })
    const { onClose, onDone } = renderSheet()
    fireEvent.click(await screen.findByText('Favorites'))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined))
    expect(onDone).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-MOB-PSAVE-013: a second tap is ignored while a save is still running', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]))
    let resolve!: (v: { copied: number; skipped: { id: number; name: string }[] }) => void
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany')
      .mockReturnValue(new Promise(r => { resolve = r }))
    const { onDone } = renderSheet()
    fireEvent.click(await screen.findByText('Favorites'))
    fireEvent.click(screen.getByText('Wishlist'))
    expect(save).toHaveBeenCalledTimes(1)

    resolve({ copied: 2, skipped: [] })
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('FE-MOB-PSAVE-014: a response that lands after the sheet is gone is dropped', async () => {
    let resolve!: (v: CollectionListResponse) => void
    const spy = vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r }))
    const first = renderSheet()
    first.unmount()
    resolve(listResponse([FAVORITES]))
    await Promise.resolve()
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument()

    let reject!: (e: Error) => void
    spy.mockReturnValue(new Promise((_, r) => { reject = r }))
    const second = renderSheet()
    second.unmount()
    reject(new Error('offline'))
    await Promise.resolve()
    expect(screen.queryByText('You have no lists yet')).not.toBeInTheDocument()
  })

  it('FE-MOB-PSAVE-015: an empty selection never reaches the server, and close hands back', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]))
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany')
    const { onClose } = renderSheet({ placeIds: [] })
    fireEvent.click(await screen.findByText('Favorites'))
    expect(save).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
