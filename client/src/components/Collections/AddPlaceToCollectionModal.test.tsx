// FE-COMP-ADDPLACECOL-001 to FE-COMP-ADDPLACECOL-028
import React from 'react'
import type { Mock } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render'
import { server } from '../../../tests/helpers/msw/server'
import type { Category } from '@trek/shared'
import { useTranslation } from '../../i18n/TranslationContext'
import AddPlaceToCollectionModal from './AddPlaceToCollectionModal'

type Props = React.ComponentProps<typeof AddPlaceToCollectionModal>
function Harness(props: Omit<Props, 't'>): React.ReactElement {
  const { t } = useTranslation()
  return <AddPlaceToCollectionModal {...props} t={t} />
}

const categories: Category[] = [
  { id: 3, name: 'Food', color: '#f97316', icon: 'utensils' },
  { id: 4, name: 'Museum', color: '', icon: 'landmark' },
]

const mapsResult = {
  name: 'Kissa Sakaiki',
  address: 'Shibuya, Tokyo',
  lat: 35.66,
  lng: 139.7,
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
  osm_id: 'osm-1',
  website: 'https://kissa.example',
  phone: '+81 3 0000 0000',
}

type AddToast = NonNullable<typeof window.__addToast>
let addToast: Mock<AddToast>
/** Bodies POSTed to the save endpoint, newest last. */
let savedBodies: Record<string, unknown>[]

function mockSearch(places: Record<string, unknown>[]): void {
  server.use(http.post('/api/maps/search', () => HttpResponse.json({ places, source: 'nominatim' })))
}

function mockSave(response: Record<string, unknown> = { place: { id: 99 } }): void {
  server.use(
    http.post('/api/addons/collections/places', async ({ request }) => {
      savedBodies.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json(response)
    }),
  )
}

function setup(over: Partial<Omit<Props, 't'>> = {}) {
  const props: Omit<Props, 't'> = {
    isOpen: true,
    collectionId: 7,
    collectionName: 'Tokyo 2026',
    categories,
    onClose: vi.fn(),
    onAdded: vi.fn(),
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, props }
}

/** Fills the one field the save button waits on. */
function typeName(value: string): void {
  fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value } })
}

describe('AddPlaceToCollectionModal', () => {
  beforeEach(() => {
    addToast = vi.fn<AddToast>(() => 0)
    window.__addToast = addToast
    savedBodies = []
    mockSave()
  })

  afterEach(() => {
    delete window.__addToast
  })

  it('FE-COMP-ADDPLACECOL-001: a closed modal renders nothing', () => {
    setup({ isOpen: false })
    expect(screen.queryByRole('heading', { name: 'Add a place' })).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-002: renders the search, form fields and status chips', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Add a place' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search for a place…')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Street, City, Country')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Latitude (e.g. 48.8566)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Idea/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Want to go/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Visited/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add$/ })).toBeDisabled()
  })

  it('FE-COMP-ADDPLACECOL-003: the search button is inert until something is typed', () => {
    setup()
    expect(screen.getByRole('button', { name: /Search/ })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    expect(screen.getByRole('button', { name: /Search/ })).not.toBeDisabled()
  })

  it('FE-COMP-ADDPLACECOL-004: Enter runs the search and lists the results', async () => {
    mockSearch([mapsResult, { name: 'No address place' }])
    setup()
    const input = screen.getByPlaceholderText('Search for a place…')
    fireEvent.change(input, { target: { value: 'kissa' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('Kissa Sakaiki')).toBeInTheDocument()
    expect(screen.getByText('Shibuya, Tokyo')).toBeInTheDocument()
    expect(screen.getByText('No address place')).toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-005: picking a result fills name, address and coordinates', async () => {
    mockSearch([mapsResult])
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Kissa Sakaiki/ }))

    expect(screen.getByPlaceholderText('Name')).toHaveValue('Kissa Sakaiki')
    expect(screen.getByPlaceholderText('Street, City, Country')).toHaveValue('Shibuya, Tokyo')
    expect(screen.getByPlaceholderText('Latitude (e.g. 48.8566)')).toHaveValue('35.66')
    expect(screen.getByPlaceholderText('Longitude (e.g. 2.3522)')).toHaveValue('139.7')
    // The dropdown collapses once a result is taken.
    expect(screen.queryByText('Shibuya, Tokyo')).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-006: a result without name or coordinates leaves those fields blank', async () => {
    mockSearch([{ address: 'Somewhere' }])
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    fireEvent.click(await screen.findByText('Somewhere'))

    expect(screen.getByPlaceholderText('Name')).toHaveValue('')
    expect(screen.getByPlaceholderText('Latitude (e.g. 48.8566)')).toHaveValue('')
    // The query keeps what the user typed when the result carries no name.
    expect(screen.getByPlaceholderText('Search for a place…')).toHaveValue('x')
  })

  it('FE-COMP-ADDPLACECOL-007: the result dropdown can be dismissed', async () => {
    mockSearch([mapsResult])
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    await screen.findByText('Kissa Sakaiki')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Kissa Sakaiki')).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-008: a failing search toasts the provider error', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({ error: 'Places API disabled' }, { status: 500 })))
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Places API disabled', 'error', undefined))
  })

  it('FE-COMP-ADDPLACECOL-009: a search that finds nothing says so instead of staying silent', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({ source: 'nominatim' })))
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))

    expect(await screen.findByText('No places found')).toBeInTheDocument()
    // Typing the next query clears it again.
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissaten' } })
    expect(screen.queryByText('No places found')).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-009b: the empty search panel can be dismissed', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({ places: [], source: 'nominatim' })))
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    await screen.findByText('No places found')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('No places found')).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-010: saving posts the manually typed place with nulls for what is empty', async () => {
    const { props } = setup()
    typeName('  Manual spot  ')
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({
      collection_id: 7,
      name: 'Manual spot',
      address: null,
      lat: null,
      lng: null,
      google_place_id: null,
      osm_id: null,
      website: null,
      category_id: null,
      description: null,
      links: [],
      status: 'idea',
      force: true,
    })
    expect(addToast).toHaveBeenCalledWith('Added to Tokyo 2026', 'success', undefined)
    expect(props.onAdded).toHaveBeenCalledTimes(1)
    // The form clears so another place can be added straight away.
    await waitFor(() => expect(screen.getByPlaceholderText('Name')).toHaveValue(''))
  })

  it('FE-COMP-ADDPLACECOL-011: provenance from a picked result rides along with the save', async () => {
    mockSearch([mapsResult])
    setup()
    fireEvent.change(screen.getByPlaceholderText('Search for a place…'), { target: { value: 'kissa' } })
    fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Kissa Sakaiki/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({
      name: 'Kissa Sakaiki',
      address: 'Shibuya, Tokyo',
      lat: 35.66,
      lng: 139.7,
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      osm_id: 'osm-1',
      website: 'https://kissa.example',
      phone: '+81 3 0000 0000',
    })
  })

  it('FE-COMP-ADDPLACECOL-012: a duplicate response warns instead of reporting a new place', async () => {
    mockSave({ duplicate: true })
    const { props } = setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('This place is already in the list', 'info', undefined))
    expect(props.onAdded).not.toHaveBeenCalled()
  })

  it('FE-COMP-ADDPLACECOL-013: a failing save surfaces the server error and keeps the form', async () => {
    server.use(http.post('/api/addons/collections/places', () => HttpResponse.json({ error: 'List is full' }, { status: 400 })))
    const { props } = setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined))
    expect(props.onAdded).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Name')).toHaveValue('Manual spot')
  })

  it('FE-COMP-ADDPLACECOL-014: an address and coordinates typed by hand are kept, blanks stay null', async () => {
    setup()
    typeName('GPS only')
    fireEvent.change(screen.getByPlaceholderText('Street, City, Country'), { target: { value: '  5 Rue Cler, Paris  ' } })
    fireEvent.change(screen.getByPlaceholderText('Latitude (e.g. 48.8566)'), { target: { value: '48.8566' } })
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({ address: '5 Rue Cler, Paris', lat: 48.8566, lng: null })
  })

  it('FE-COMP-ADDPLACECOL-015: pasting a coordinate pair splits it across both fields', () => {
    setup()
    const lat = screen.getByPlaceholderText('Latitude (e.g. 48.8566)')
    fireEvent.paste(lat, { clipboardData: { getData: () => ' 48.8566, 2.3522 ' } })
    expect(lat).toHaveValue('48.8566')
    expect(screen.getByPlaceholderText('Longitude (e.g. 2.3522)')).toHaveValue('2.3522')
  })

  it('FE-COMP-ADDPLACECOL-015b: the pair is split the same way when pasted into longitude', () => {
    setup()
    const lng = screen.getByPlaceholderText('Longitude (e.g. 2.3522)')
    fireEvent.paste(lng, { clipboardData: { getData: () => '48.8566, 2.3522' } })
    expect(screen.getByPlaceholderText('Latitude (e.g. 48.8566)')).toHaveValue('48.8566')
    expect(lng).toHaveValue('2.3522')
  })

  it('FE-COMP-ADDPLACECOL-016: a paste that is not a coordinate pair is left to the input', () => {
    setup()
    const lat = screen.getByPlaceholderText('Latitude (e.g. 48.8566)')
    fireEvent.paste(lat, { clipboardData: { getData: () => 'Eiffel Tower' } })
    expect(lat).toHaveValue('')
    expect(screen.getByPlaceholderText('Longitude (e.g. 2.3522)')).toHaveValue('')
  })

  it('FE-COMP-ADDPLACECOL-017: the chosen status is saved', async () => {
    setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Visited/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({ status: 'visited' })
  })

  it('FE-COMP-ADDPLACECOL-018: a category can be picked and cleared again', async () => {
    setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Food/ }))
    fireEvent.click(screen.getByRole('button', { name: /Museum/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({ category_id: 4 })

    fireEvent.click(screen.getByRole('button', { name: 'No category' }))
    typeName('Second spot')
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(savedBodies).toHaveLength(2))
    expect(savedBodies[1]).toMatchObject({ category_id: null })
  })

  it('FE-COMP-ADDPLACECOL-019: without categories the category row is not rendered', () => {
    setup({ categories: [] })
    expect(screen.queryByText('Category')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'No category' })).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-020: links are normalised and blank rows dropped', async () => {
    setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    const urls = screen.getAllByPlaceholderText('https://…')
    fireEvent.change(screen.getAllByPlaceholderText('Label')[0], { target: { value: ' Menu ' } })
    fireEvent.change(urls[0], { target: { value: 'kissa.example/menu' } })

    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0].links).toEqual([{ label: 'Menu', url: 'https://kissa.example/menu' }])
  })

  it('FE-COMP-ADDPLACECOL-021: a link row can be removed again', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    expect(screen.getByPlaceholderText('https://…')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-022: a description renders a live markdown preview and is trimmed on save', async () => {
    setup()
    typeName('Manual spot')
    fireEvent.change(screen.getByPlaceholderText('Add a description…'), { target: { value: '  **Great** coffee  ' } })
    expect(screen.getByText('Great')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(savedBodies).toHaveLength(1))
    expect(savedBodies[0]).toMatchObject({ description: '**Great** coffee' })
  })

  it('FE-COMP-ADDPLACECOL-023: closing the modal resets the form for the next open', () => {
    const { rerender, props } = setup()
    typeName('Manual spot')
    fireEvent.change(screen.getByPlaceholderText('Add a description…'), { target: { value: 'notes' } })

    rerender(<Harness {...props} isOpen={false} />)
    rerender(<Harness {...props} isOpen />)

    expect(screen.getByPlaceholderText('Name')).toHaveValue('')
    expect(screen.getByPlaceholderText('Add a description…')).toHaveValue('')
  })

  it('FE-COMP-ADDPLACECOL-024: Cancel closes without saving', () => {
    const { props } = setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(savedBodies).toHaveLength(0)
  })

  it('FE-COMP-ADDPLACECOL-025: the caret goes back to the search field after an add', async () => {
    setup()
    const nameField = screen.getByPlaceholderText('Name')
    typeName('Manual spot')
    // Where the focus sits in the browser once the add button disables itself.
    nameField.focus()
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(nameField).toHaveValue(''))
    expect(screen.getByPlaceholderText('Search for a place…')).toHaveFocus()
  })

  it('FE-COMP-ADDPLACECOL-026: the search still runs after a place was added', async () => {
    mockSearch([mapsResult])
    setup()
    typeName('Manual spot')
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))
    await waitFor(() => expect(screen.getByPlaceholderText('Name')).toHaveValue(''))

    const input = screen.getByPlaceholderText('Search for a place…')
    expect(input).toHaveValue('')
    fireEvent.change(input, { target: { value: 'kissa' } })
    expect(screen.getByRole('button', { name: /Search/ })).not.toBeDisabled()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByText('Kissa Sakaiki')).toBeInTheDocument()
  })

  it('FE-COMP-ADDPLACECOL-027: the search row is pinned to the top of the scrolling body', () => {
    setup()
    // The dialog stays open after an add, so the row has to survive a scrolled form.
    expect(screen.getByPlaceholderText('Search for a place…').closest('.sticky')).not.toBeNull()
  })

  it('FE-COMP-ADDPLACECOL-028: a failed save leaves the caret where the user had it', async () => {
    server.use(http.post('/api/addons/collections/places', () => HttpResponse.json({ error: 'List is full' }, { status: 400 })))
    setup()
    const nameField = screen.getByPlaceholderText('Name')
    typeName('Manual spot')
    nameField.focus()
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined))
    expect(nameField).toHaveFocus()
  })
})
