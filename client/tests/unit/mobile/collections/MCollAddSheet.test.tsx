// FE-MOB-COLADD-001 to FE-MOB-COLADD-017
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { render, screen, fireEvent, waitFor } from '../../../helpers/render'
import { server } from '../../../helpers/msw/server'
import type { Category } from '../../../../src/types'
import MCollAddSheet from '../../../../src/mobile/screens/collections/MCollAddSheet'

const t = (key: string) => key

const categories = [
  { id: 3, name: 'Restaurant', color: '#E8843D', icon: 'utensils' },
  { id: 4, name: 'Museum', color: '#8b5cf6', icon: null },
] as unknown as Category[]

type Props = React.ComponentProps<typeof MCollAddSheet>

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    open: true,
    collectionId: 1,
    collectionName: 'Hamburg',
    lists: [{ id: 1, name: 'Hamburg', color: '#38BDF8' }],
    categories,
    onClose: vi.fn(),
    onAdded: vi.fn(),
    t,
    ...overrides,
  }
}

/** Search hit shaped like the maps proxy: lat arrives as a string, website empty. */
const hit = {
  name: 'Elbphilharmonie',
  address: 'Platz der Deutschen Einheit 1',
  lat: '53.5413',
  lng: 9.9841,
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
  osm_id: 'osm-1',
  website: '',
  phone: '+49 40 357666',
}

function mockSearch(places: Record<string, unknown>[] = [hit]) {
  server.use(http.post('/api/maps/search', () => HttpResponse.json({ places })))
}

type AddToast = NonNullable<typeof window.__addToast>
let toast: Mock<AddToast>

/** Captures the last savePlace body so the payload mapping can be asserted. */
function mockSave(response: Record<string, unknown> = { place: { id: 5 } }) {
  const seen: { body?: Record<string, unknown> } = {}
  server.use(
    http.post('/api/addons/collections/places', async ({ request }) => {
      seen.body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(response)
    }),
  )
  return seen
}

describe('MCollAddSheet', () => {
  beforeEach(() => {
    toast = vi.fn<AddToast>(() => 1)
    window.__addToast = toast
  })

  afterEach(() => {
    delete window.__addToast
  })

  it('FE-MOB-COLADD-001: stays unmounted while closed and skips the list picker for a fixed list', () => {
    const { rerender } = render(<MCollAddSheet {...baseProps({ open: false })} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<MCollAddSheet {...baseProps()} />)
    expect(screen.getByRole('dialog', { name: 'collections.addPlace' })).toBeInTheDocument()
    expect(screen.queryByText('COLLECTIONS.PICKLIST')).not.toBeInTheDocument()
    // Nothing typed yet → the add action is unreachable.
    expect(screen.getByRole('button', { name: /common.add/ })).toBeDisabled()
  })

  it('FE-MOB-COLADD-002: searching lists the hits and picking one fills name, address and query', async () => {
    const user = userEvent.setup()
    mockSearch()
    render(<MCollAddSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('collections.addPlaceSearch'), 'elbphil')
    await user.click(screen.getByRole('button', { name: 'common.search' }))

    const hitRow = await screen.findByText('Elbphilharmonie')
    expect(screen.getByText('Platz der Deutschen Einheit 1')).toBeInTheDocument()

    await user.click(hitRow)
    expect(screen.getByPlaceholderText('common.name')).toHaveValue('Elbphilharmonie')
    expect(screen.getByPlaceholderText('collections.addPlaceSearch')).toHaveValue('Elbphilharmonie')
    // The result list collapses once a hit is taken; the address lands in the
    // editable field instead of the old read-only hint (#1870).
    expect(screen.queryByText('COMMON.SEARCH')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('places.formAddressPlaceholder')).toHaveValue('Platz der Deutschen Einheit 1')
  })

  it('FE-MOB-COLADD-003: Enter in the search field runs the search and the panel can be dismissed', async () => {
    const user = userEvent.setup()
    mockSearch()
    render(<MCollAddSheet {...baseProps()} />)

    const input = screen.getByPlaceholderText('collections.addPlaceSearch')
    await user.type(input, 'elbphil{Enter}')
    expect(await screen.findByText('Elbphilharmonie')).toBeInTheDocument()

    // The result panel has its own close affordance (there is also the sheet's).
    const closers = screen.getAllByRole('button', { name: 'common.close' })
    await user.click(closers[closers.length - 1])
    expect(screen.queryByText('Elbphilharmonie')).not.toBeInTheDocument()
  })

  it('FE-MOB-COLADD-004: a failing maps search surfaces the provider error as a toast', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/maps/search', () =>
        HttpResponse.json({ error: 'Maps provider unavailable' }, { status: 502 }),
      ),
    )
    render(<MCollAddSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('collections.addPlaceSearch'), 'x')
    await user.click(screen.getByRole('button', { name: 'common.search' }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Maps provider unavailable', 'error', undefined))
    // The search button becomes usable again after the failure.
    expect(screen.getByRole('button', { name: 'common.search' })).toBeEnabled()
  })

  it('FE-MOB-COLADD-005: an empty query keeps the search button disabled', () => {
    render(<MCollAddSheet {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'common.search' })).toBeDisabled()
  })

  it('FE-MOB-COLADD-006: saving a picked place maps the maps payload onto the save request', async () => {
    const user = userEvent.setup()
    mockSearch()
    const seen = mockSave()
    const props = baseProps()
    render(<MCollAddSheet {...props} />)

    await user.type(screen.getByPlaceholderText('collections.addPlaceSearch'), 'elbphil')
    await user.click(screen.getByRole('button', { name: 'common.search' }))
    await user.click(await screen.findByText('Elbphilharmonie'))
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({
      collection_id: 1,
      name: 'Elbphilharmonie',
      address: 'Platz der Deutschen Einheit 1',
      // lat arrives as a string from the proxy and has to be coerced.
      lat: 53.5413,
      lng: 9.9841,
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      osm_id: 'osm-1',
      // An empty website string must not be stored as ''.
      website: null,
      phone: '+49 40 357666',
      status: 'idea',
      force: true,
    })
    expect(toast).toHaveBeenCalledWith('collections.addedToList', 'success', undefined)
    expect(props.onAdded).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLADD-007: a hand-typed place saves without any maps provenance', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    const props = baseProps()
    render(<MCollAddSheet {...props} />)

    await user.type(screen.getByPlaceholderText('common.name'), '  Sternschanze  ')
    await user.type(screen.getByPlaceholderText('collections.descriptionPlaceholder'), 'Streetfood')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({
      name: 'Sternschanze',
      address: null,
      lat: null,
      lng: null,
      google_place_id: null,
      description: 'Streetfood',
      category_id: null,
    })
    expect(props.onAdded).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLADD-008: the status chips and the category picker feed the save request', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    render(<MCollAddSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Museum')
    await user.click(screen.getByRole('button', { name: /collections.status.visited/ }))
    expect(screen.getByRole('button', { name: /collections.status.visited/ })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByText('collections.noCategory'))
    await user.click(screen.getByText('Museum', { selector: 'span' }))
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({ status: 'visited', category_id: 4 })
  })

  it('FE-MOB-COLADD-009: a duplicate reported by the server informs instead of confirming', async () => {
    const user = userEvent.setup()
    mockSave({ duplicate: true, duplicateOf: { id: 2, name: 'Sternschanze' } })
    const props = baseProps()
    render(<MCollAddSheet {...props} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Sternschanze')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith('collections.duplicateWarning', 'info', undefined))
    expect(props.onAdded).not.toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-MOB-COLADD-010: a rejected save reports the server error and leaves the sheet open', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/addons/collections/places', () =>
        HttpResponse.json({ error: 'List is full' }, { status: 400 }),
      ),
    )
    const props = baseProps()
    render(<MCollAddSheet {...props} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Sternschanze')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith('List is full', 'error', undefined))
    expect(props.onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /common.add/ })).toBeEnabled()
  })

  it('FE-MOB-COLADD-011: opened from "All saved" with several lists the target has to be picked first', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    render(
      <MCollAddSheet
        {...baseProps({
          collectionId: null,
          lists: [
            { id: 1, name: 'Hamburg', color: '#38BDF8' },
            { id: 2, name: 'Kopenhagen', color: null },
          ],
        })}
      />,
    )

    expect(screen.getByText('COLLECTIONS.PICKLIST')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('common.name'), 'Tivoli')
    expect(screen.getByRole('button', { name: /common.add/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Kopenhagen' }))
    expect(screen.getByRole('button', { name: 'Kopenhagen' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({ collection_id: 2, name: 'Tivoli' })
    expect(toast).toHaveBeenCalledWith('collections.addedToList', 'success', undefined)
  })

  it('FE-MOB-COLADD-012: with exactly one owned list that list is preselected', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    render(<MCollAddSheet {...baseProps({ collectionId: null })} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Alster')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({ collection_id: 1 })
  })

  it('FE-MOB-COLADD-013: without any list the picker explains there is nothing to save into', () => {
    render(<MCollAddSheet {...baseProps({ collectionId: null, lists: [] })} />)

    expect(screen.getByText('collections.noListsYet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /common.add/ })).toBeDisabled()
  })

  it('FE-MOB-COLADD-014: closing resets the form so the next open starts blank', async () => {
    const user = userEvent.setup()
    const props = baseProps()
    const { rerender } = render(<MCollAddSheet {...props} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Alster')
    fireEvent.click(screen.getAllByRole('button', { name: 'common.close' })[0])
    expect(props.onClose).toHaveBeenCalledTimes(1)

    rerender(<MCollAddSheet {...baseProps({ open: false })} />)
    rerender(<MCollAddSheet {...baseProps()} />)
    expect(screen.getByPlaceholderText('common.name')).toHaveValue('')
  })

  it('FE-MOB-COLADD-015: a list arriving after the open still becomes the default target', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    const { rerender } = render(<MCollAddSheet {...baseProps({ collectionId: null, lists: [] })} />)

    expect(screen.getByText('collections.noListsYet')).toBeInTheDocument()
    // The collection list only resolves once the sheet is already open.
    rerender(<MCollAddSheet {...baseProps({ collectionId: null })} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Alster')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({ collection_id: 1 })
  })

  // ── Typed address (#1870) ──────────────────────────────────────────────────

  it('FE-MOB-COLADD-016: a hand-typed address is trimmed into the save request', async () => {
    const user = userEvent.setup()
    const seen = mockSave()
    render(<MCollAddSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('common.name'), 'Sternschanze')
    await user.type(screen.getByPlaceholderText('places.formAddressPlaceholder'), '  Schanzenstr. 1  ')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    expect(seen.body).toMatchObject({ name: 'Sternschanze', address: 'Schanzenstr. 1' })
  })

  it('FE-MOB-COLADD-017: the address of a picked hit can be corrected before saving', async () => {
    const user = userEvent.setup()
    mockSearch()
    const seen = mockSave()
    render(<MCollAddSheet {...baseProps()} />)

    await user.type(screen.getByPlaceholderText('collections.addPlaceSearch'), 'elbphil')
    await user.click(screen.getByRole('button', { name: 'common.search' }))
    await user.click(await screen.findByText('Elbphilharmonie'))

    const addressInput = screen.getByPlaceholderText('places.formAddressPlaceholder')
    await user.clear(addressInput)
    await user.type(addressInput, 'Platz der Deutschen Einheit 4')
    await user.click(screen.getByRole('button', { name: /common.add/ }))

    await waitFor(() => expect(seen.body).toBeDefined())
    // The corrected address is stored, the rest of the maps provenance survives.
    expect(seen.body).toMatchObject({ address: 'Platz der Deutschen Einheit 4', google_place_id: 'gp-1' })
  })
})
