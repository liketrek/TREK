import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpResponse, delay, http } from 'msw'
import PlPlaceSearch from '../../../../src/mobile/screens/trip/sheets/PlPlaceSearch'
import type { TripPlanner } from '../../../../src/mobile/screens/trip/MTripShell'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { server } from '../../../helpers/msw/server'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PLSRCH-001 to FE-MOB-PLSRCH-018
// planner.t echoes the key, so labels/toasts are asserted as their keys.

const LOUVRE = {
  name: 'Louvre Museum',
  address: 'Rue de Rivoli, Paris',
  lat: 48.8606,
  lng: 2.3376,
  google_place_id: 'ChIJ_louvre',
  google_ftid: '0x47e:0x1',
  osm_id: 'W7444,',
  website: 'https://louvre.fr',
  phone: '+33 1',
}

const SUGGESTION = { placeId: 'sug-1', mainText: 'Louvre', secondaryText: 'Paris, France' }

/** Bodies of every autocomplete request the component fired. */
let autocompleteBodies: Record<string, unknown>[] = []
let searchBodies: Record<string, unknown>[] = []

function recordAutocomplete(suggestions: unknown[] = [SUGGESTION]) {
  return http.post('/api/maps/autocomplete', async ({ request }) => {
    autocompleteBodies.push(await request.json() as Record<string, unknown>)
    return HttpResponse.json({ suggestions, source: 'osm' })
  })
}

function recordSearch(places: unknown[] = [LOUVRE]) {
  return http.post('/api/maps/search', async ({ request }) => {
    searchBodies.push(await request.json() as Record<string, unknown>)
    return HttpResponse.json({ places, source: 'osm' })
  })
}

function setup(plannerOverrides: Partial<TripPlanner> = {}, locationBias?: Parameters<typeof PlPlaceSearch>[0]['locationBias']) {
  const onPick = vi.fn()
  const onResolvingChange = vi.fn()
  const planner = buildPlanner(plannerOverrides)
  const view = render(
    <PlPlaceSearch planner={planner} locationBias={locationBias} onPick={onPick} onResolvingChange={onResolvingChange} />,
  )
  const input = screen.getByPlaceholderText('places.mapsSearchPlaceholder')
  return { ...view, planner, onPick, onResolvingChange, input }
}

describe('PlPlaceSearch', () => {
  beforeEach(() => {
    autocompleteBodies = []
    searchBodies = []
  })

  it('FE-MOB-PLSRCH-001: stays quiet below two characters', async () => {
    server.use(recordAutocomplete())
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'L' } })
    await new Promise(r => setTimeout(r, 450))
    expect(autocompleteBodies).toHaveLength(0)
    expect(screen.queryByText('Louvre')).not.toBeInTheDocument()
  })

  it('FE-MOB-PLSRCH-002: debounces the autocomplete and lists both suggestion lines', async () => {
    server.use(recordAutocomplete())
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    expect(autocompleteBodies).toHaveLength(0)
    expect(await screen.findByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Paris, France')).toBeInTheDocument()
    expect(autocompleteBodies[0]).toMatchObject({ input: 'Lou', lang: 'en' })
  })

  it('FE-MOB-PLSRCH-003: forwards the trip-centre bias', async () => {
    server.use(recordAutocomplete())
    const bias = { low: { lat: 48.8, lng: 2.3 }, high: { lat: 48.9, lng: 2.4 } }
    const { input } = setup({}, bias)
    fireEvent.change(input, { target: { value: 'Lou' } })
    await waitFor(() => expect(autocompleteBodies).toHaveLength(1))
    expect(autocompleteBodies[0].locationBias).toEqual(bias)
  })

  it('FE-MOB-PLSRCH-004: picking a suggestion applies its resolved details and clears the field', async () => {
    server.use(
      recordAutocomplete(),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({ place: LOUVRE })),
    )
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    const row = await screen.findByText('Louvre')
    // The row swallows pointerdown so the field's blur handler cannot close
    // the dropdown before the click lands.
    const pointerDown = fireEvent.pointerDown(row)
    expect(pointerDown).toBe(false)
    fireEvent.click(row)

    // Optimistic name first, then the full record.
    expect(onPick).toHaveBeenNthCalledWith(1, { name: 'Louvre' })
    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(2))
    expect(onPick).toHaveBeenLastCalledWith({
      name: 'Louvre Museum',
      address: 'Rue de Rivoli, Paris',
      lat: '48.8606',
      lng: '2.3376',
      google_place_id: 'ChIJ_louvre',
      google_ftid: '0x47e:0x1',
      osm_id: 'W7444,',
      website: 'https://louvre.fr',
      phone: '+33 1',
    })
    expect(input).toHaveValue('')
  })

  it('FE-MOB-PLSRCH-005: falls back to the text search when the details hop fails', async () => {
    server.use(
      recordAutocomplete(),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({ error: 'disabled' }, { status: 500 })),
      recordSearch(),
    )
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    fireEvent.click(await screen.findByText('Louvre'))

    await waitFor(() => expect(onPick).toHaveBeenCalledTimes(2))
    expect(searchBodies[0]).toEqual({ query: 'Louvre, Paris, France' })
    expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Louvre Museum', lat: '48.8606' }))
  })

  it('FE-MOB-PLSRCH-006: also falls back when the details hop answers without coordinates', async () => {
    server.use(
      recordAutocomplete(),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({ place: { name: 'Louvre' } })),
      recordSearch(),
    )
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    fireEvent.click(await screen.findByText('Louvre'))

    await waitFor(() => expect(searchBodies).toHaveLength(1))
    expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ lat: '48.8606' }))
  })

  it('FE-MOB-PLSRCH-007: restores the typed query and toasts when nothing resolves', async () => {
    server.use(
      recordAutocomplete(),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({}, { status: 500 })),
      recordSearch([]),
    )
    const { input, planner } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    fireEvent.click(await screen.findByText('Louvre'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('places.mapsSearchError'))
    expect(input).toHaveValue('Lou')
  })

  it('FE-MOB-PLSRCH-008: surfaces the server message when the fallback search rejects', async () => {
    server.use(
      recordAutocomplete(),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({}, { status: 500 })),
      http.post('/api/maps/search', () => HttpResponse.json({ error: 'Places API is disabled' }, { status: 502 })),
    )
    const { input, planner } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    fireEvent.click(await screen.findByText('Louvre'))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('Places API is disabled'))
    expect(input).toHaveValue('Lou')
  })

  it('FE-MOB-PLSRCH-009: a "lat, lng" query becomes coordinates without any lookup', async () => {
    server.use(recordAutocomplete(), recordSearch())
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: '48.8566; 2.3522' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))

    expect(onPick).toHaveBeenCalledWith({ lat: '48.8566', lng: '2.3522' })
    expect(input).toHaveValue('')
    await new Promise(r => setTimeout(r, 400))
    expect(autocompleteBodies).toHaveLength(0)
    expect(searchBodies).toHaveLength(0)
  })

  it('FE-MOB-PLSRCH-010: resolves a Google Maps URL and confirms it', async () => {
    server.use(
      recordAutocomplete(),
      http.post('/api/maps/resolve-url', () => HttpResponse.json({
        lat: 48.86, lng: 2.33, name: 'Louvre', address: 'Paris', google_ftid: '0x1:0x2',
      })),
    )
    const { input, onPick, planner } = setup()
    fireEvent.change(input, { target: { value: 'https://maps.app.goo.gl/abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))

    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('places.urlResolved'))
    expect(onPick).toHaveBeenCalledWith({
      name: 'Louvre', address: 'Paris', lat: '48.86', lng: '2.33', google_ftid: '0x1:0x2',
    })
    expect(input).toHaveValue('')
    // URLs never hit the autocomplete debounce.
    expect(autocompleteBodies).toHaveLength(0)
  })

  it('FE-MOB-PLSRCH-011: falls through to the text search when the URL carries no coordinates', async () => {
    server.use(
      http.post('/api/maps/resolve-url', () => HttpResponse.json({ lat: null, lng: null })),
      recordSearch(),
    )
    const { input, planner } = setup()
    fireEvent.change(input, { target: { value: 'https://www.google.com/maps/place/Louvre' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))

    await waitFor(() => expect(searchBodies).toHaveLength(1))
    expect(await screen.findByText('Louvre Museum')).toBeInTheDocument()
    expect(planner.toast.success).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLSRCH-012: lists text results and applies the tapped one', async () => {
    server.use(recordSearch([LOUVRE, { name: 'Louvre Lens', address: 'Lens' }]))
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('Louvre Museum')).toBeInTheDocument()
    expect(screen.getByText('Louvre Lens')).toBeInTheDocument()
    expect(screen.getByText('Rue de Rivoli, Paris')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Louvre Lens'))
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Louvre Lens', address: 'Lens', lat: undefined }))
    await waitFor(() => expect(screen.queryByText('Louvre Museum')).not.toBeInTheDocument())
    expect(input).toHaveValue('')
  })

  it('FE-MOB-PLSRCH-013: an empty query does nothing', async () => {
    server.use(recordSearch())
    const { onPick } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))
    await new Promise(r => setTimeout(r, 50))
    expect(searchBodies).toHaveLength(0)
    expect(onPick).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLSRCH-014: reports the resolving state and blocks the button while searching', async () => {
    server.use(http.post('/api/maps/search', async () => {
      await delay(120)
      return HttpResponse.json({ places: [LOUVRE], source: 'osm' })
    }))
    const { input, onResolvingChange } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'common.search' })).toBeDisabled())
    expect(onResolvingChange).toHaveBeenCalledWith(true)
    await waitFor(() => expect(onResolvingChange).toHaveBeenLastCalledWith(false))
    expect(screen.getByRole('button', { name: 'common.search' })).not.toBeDisabled()
  })

  it('FE-MOB-PLSRCH-015: toasts the fallback message when the search fails without a body', async () => {
    server.use(http.post('/api/maps/search', () => new HttpResponse(null, { status: 500 })))
    const { input, planner } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('places.mapsSearchError'))
  })

  it('FE-MOB-PLSRCH-016: a failing autocomplete empties the dropdown', async () => {
    server.use(recordAutocomplete())
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    expect(await screen.findByText('Louvre')).toBeInTheDocument()

    server.use(http.post('/api/maps/autocomplete', () => HttpResponse.json({}, { status: 500 })))
    fireEvent.change(input, { target: { value: 'Louv' } })
    await waitFor(() => expect(screen.queryByText('Louvre')).not.toBeInTheDocument())
  })

  it('FE-MOB-PLSRCH-017: a superseded autocomplete is aborted and does not clear the newer list', async () => {
    server.use(http.post('/api/maps/autocomplete', async ({ request }) => {
      const body = await request.json() as { input: string }
      autocompleteBodies.push(body)
      if (body.input === 'Lou') {
        await delay(3000)
        return HttpResponse.json({ suggestions: [], source: 'osm' })
      }
      return HttpResponse.json({ suggestions: [SUGGESTION], source: 'osm' })
    }))
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    await waitFor(() => expect(autocompleteBodies).toHaveLength(1))
    fireEvent.change(input, { target: { value: 'Louvre mus' } })

    expect(await screen.findByText('Louvre')).toBeInTheDocument()
    await new Promise(r => setTimeout(r, 100))
    expect(screen.getByText('Louvre')).toBeInTheDocument()
  })

  it('FE-MOB-PLSRCH-018b: a suggestion without a second line searches on its main text alone', async () => {
    server.use(
      recordAutocomplete([{ placeId: 'sug-2', mainText: 'Louvre', secondaryText: '' }]),
      http.get('/api/maps/details/:placeId', () => HttpResponse.json({}, { status: 500 })),
      recordSearch(),
    )
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    fireEvent.click(await screen.findByText('Louvre'))
    await waitFor(() => expect(searchBodies).toHaveLength(1))
    expect(searchBodies[0]).toEqual({ query: 'Louvre' })
  })

  it('FE-MOB-PLSRCH-018c: a response without a places array leaves the result list empty', async () => {
    server.use(http.post('/api/maps/search', () => HttpResponse.json({ source: 'osm' })))
    const { input, planner } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'common.search' })).not.toBeDisabled())
    expect(screen.queryByText('Louvre Museum')).not.toBeInTheDocument()
    expect(planner.toast.error).not.toHaveBeenCalled()
  })

  it('FE-MOB-PLSRCH-018d: a nameless result still renders and can be picked', async () => {
    server.use(recordSearch([{ lat: 48.86, lng: 2.33 }]))
    const { input, onPick } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(searchBodies).toHaveLength(1))
    // The only unlabelled button is the result row; its two lines stay empty.
    const rows = (await screen.findAllByRole('button')).filter(b => !b.getAttribute('aria-label'))
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toBe('')
    fireEvent.click(rows[0])
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: undefined, lat: '48.86', lng: '2.33' }))
  })

  it('FE-MOB-PLSRCH-018e: keys other than Enter do not trigger a search', async () => {
    server.use(recordSearch())
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'louvre museum' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await new Promise(r => setTimeout(r, 50))
    expect(searchBodies).toHaveLength(0)
  })

  it('FE-MOB-PLSRCH-018f: a URL that resolves to bare coordinates picks them without extras', async () => {
    server.use(http.post('/api/maps/resolve-url', () => HttpResponse.json({
      lat: 48.86, lng: 2.33, name: null, address: null, google_ftid: null,
    })))
    const { input, onPick, planner } = setup()
    fireEvent.change(input, { target: { value: 'https://goo.gl/maps/xyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.search' }))

    await waitFor(() => expect(planner.toast.success).toHaveBeenCalledWith('places.urlResolved'))
    expect(onPick).toHaveBeenCalledWith({
      name: undefined, address: undefined, lat: '48.86', lng: '2.33', google_ftid: undefined,
    })
  })

  it('FE-MOB-PLSRCH-018: blurring the field dismisses the dropdown', async () => {
    server.use(recordAutocomplete())
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'Lou' } })
    expect(await screen.findByText('Louvre')).toBeInTheDocument()
    fireEvent.blur(input)
    await waitFor(() => expect(screen.queryByText('Louvre')).not.toBeInTheDocument())
  })
})
