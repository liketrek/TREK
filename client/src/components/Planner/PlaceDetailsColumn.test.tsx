/**
 * FE-PDC-001..015 — the detail column beside the add-place search field.
 *
 * mapsApi.placeEnrichment is mocked; these cover the load states, the caches,
 * the abort on selection change, image picking and the attribution rendering
 * that the Commons licences require.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { MapsPlaceEnrichmentResult } from '@trek/shared'
import PlaceDetailsColumn, { __clearEnrichmentCacheForTests, type PlaceDetailsSelection } from './PlaceDetailsColumn'

const placeEnrichment = vi.fn()
vi.mock('../../api/client', () => ({ mapsApi: { placeEnrichment: (...a: unknown[]) => placeEnrichment(...a) } }))

/** Echo the key back, which keeps the assertions readable. */
const t = ((key: string) => key) as never

const SELECTION: PlaceDetailsSelection = { placeId: 'way:1', lat: 50.9, lng: 6.96, name: 'Museum Ludwig' }

const COMMONS_PHOTO = {
  key: 'way:1~p0',
  url: '/api/maps/place-photo/way%3A1~p0/bytes',
  attribution: 'Alice',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  source: 'wikimedia' as const,
}

const GOOGLE_PHOTO = {
  key: 'way:1~p1',
  url: '/api/maps/place-photo/way%3A1~p1/bytes',
  attribution: null,
  license: null,
  licenseUrl: null,
  sourceUrl: null,
  source: 'google' as const,
}

const RESULT: MapsPlaceEnrichmentResult = {
  photos: [COMMONS_PHOTO],
  description: {
    text: 'Ein Museum in Köln.',
    source: 'wikipedia',
    sourceUrl: 'https://de.wikipedia.org/wiki/Museum_Ludwig',
    license: 'CC BY-SA 4.0',
  },
}

function renderColumn(props: Partial<React.ComponentProps<typeof PlaceDetailsColumn>> = {}) {
  const onPickImage = vi.fn()
  const onAdoptDescription = vi.fn()
  const utils = render(
    <PlaceDetailsColumn
      selection={SELECTION}
      onPickImage={onPickImage}
      onAdoptDescription={onAdoptDescription}
      hasDescription={false}
      language="de"
      t={t}
      {...props}
    />,
  )
  return { ...utils, onPickImage, onAdoptDescription }
}

beforeEach(() => {
  placeEnrichment.mockReset()
  placeEnrichment.mockResolvedValue(RESULT)
  sessionStorage.clear()
  __clearEnrichmentCacheForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PlaceDetailsColumn', () => {
  it('FE-PDC-001: shows the empty state and calls nothing while nothing is selected', () => {
    renderColumn({ selection: null })

    expect(screen.getByText('places.details.empty')).toBeInTheDocument()
    expect(placeEnrichment).not.toHaveBeenCalled()
  })

  it('FE-PDC-002: shows a loading state, then the result', async () => {
    let settle: (v: MapsPlaceEnrichmentResult) => void = () => {}
    placeEnrichment.mockReturnValue(new Promise<MapsPlaceEnrichmentResult>((r) => { settle = r }))

    renderColumn()
    expect(screen.getByText('places.details.loading')).toBeInTheDocument()

    settle(RESULT)
    await waitFor(() => expect(screen.getByText('Ein Museum in Köln.')).toBeInTheDocument())
  })

  it('FE-PDC-003: sends the selection and the language to the endpoint', async () => {
    renderColumn()

    await waitFor(() => expect(placeEnrichment).toHaveBeenCalled())
    expect(placeEnrichment.mock.calls[0][0]).toEqual({
      placeId: 'way:1',
      lat: 50.9,
      lng: 6.96,
      name: 'Museum Ludwig',
      lang: 'de',
    })
  })

  it('FE-PDC-004: renders author and licence under every Commons picture', async () => {
    renderColumn()

    const credit = await screen.findByText('Alice')
    // Links to the file description page, where the full terms are.
    expect(credit.closest('a')).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:X.jpg')
    const licence = screen.getByText('CC BY-SA 4.0', { selector: 'a' })
    expect(licence).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/')
  })

  it('FE-PDC-005: names the source when a picture has no author, instead of inventing one', async () => {
    placeEnrichment.mockResolvedValue({ photos: [GOOGLE_PHOTO], description: null })
    renderColumn()

    expect(await screen.findByText('Google')).toBeInTheDocument()
  })

  it('FE-PDC-006: picking a picture reports its proxy URL', async () => {
    const { onPickImage } = renderColumn()

    fireEvent.click(await screen.findByRole('button', { name: /places.details.pickImage/ }))

    expect(onPickImage).toHaveBeenCalledWith('/api/maps/place-photo/way%3A1~p0/bytes')
  })

  it('FE-PDC-007: clicking the picked picture again clears the hero image', async () => {
    const { onPickImage } = renderColumn({ selectedImageUrl: COMMONS_PHOTO.url })

    const tile = await screen.findByRole('button', { name: /places.details.pickImage/ })
    expect(tile).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(tile)

    expect(onPickImage).toHaveBeenCalledWith(null)
  })

  it('FE-PDC-008: adopting the description hands the text up', async () => {
    const { onAdoptDescription } = renderColumn()

    fireEvent.click(await screen.findByRole('button', { name: 'places.details.adopt' }))

    expect(onAdoptDescription).toHaveBeenCalledWith('Ein Museum in Köln.')
  })

  it('FE-PDC-009: will not overwrite a description the user already wrote', async () => {
    renderColumn({ hasDescription: true })

    expect(await screen.findByRole('button', { name: 'places.details.adopt' })).toBeDisabled()
  })

  it('FE-PDC-010: shows where the description came from', async () => {
    renderColumn()

    const link = await screen.findByRole('link', { name: /Wikipedia/ })
    expect(link).toHaveAttribute('href', 'https://de.wikipedia.org/wiki/Museum_Ludwig')
    // The photo credit carries the same licence string, so scope to the source
    // line that sits directly under the description.
    expect(link.parentElement).toHaveTextContent('CC BY-SA 4.0')
  })

  it('FE-PDC-011: says so when the admin switched enrichment off', async () => {
    placeEnrichment.mockResolvedValue({ photos: [], description: null, disabled: true })
    renderColumn()

    expect(await screen.findByText('places.details.disabled')).toBeInTheDocument()
  })

  it('FE-PDC-012: says so when a place has no pictures', async () => {
    placeEnrichment.mockResolvedValue({ photos: [], description: null })
    renderColumn()

    expect(await screen.findByText('places.details.noPhotos')).toBeInTheDocument()
  })

  it('FE-PDC-013: shows an error state when the request fails', async () => {
    placeEnrichment.mockRejectedValue(new Error('network'))
    renderColumn()

    expect(await screen.findByText('places.details.error')).toBeInTheDocument()
  })

  it('FE-PDC-014: serves a second look at the same place from cache', async () => {
    const first = renderColumn()
    await screen.findByText('Ein Museum in Köln.')
    first.unmount()

    renderColumn()
    await screen.findByText('Ein Museum in Köln.')

    expect(placeEnrichment).toHaveBeenCalledTimes(1)
  })

  it('FE-PDC-015: aborts the pending request when the selection changes', async () => {
    placeEnrichment.mockReturnValue(new Promise(() => {})) // never settles
    const { rerender, onPickImage, onAdoptDescription } = renderColumn()

    await waitFor(() => expect(placeEnrichment).toHaveBeenCalledTimes(1))
    const firstSignal = placeEnrichment.mock.calls[0][1] as AbortSignal
    expect(firstSignal.aborted).toBe(false)

    rerender(
      <PlaceDetailsColumn
        selection={{ placeId: 'way:2', lat: 1, lng: 2, name: 'Somewhere else' }}
        onPickImage={onPickImage}
        onAdoptDescription={onAdoptDescription}
        hasDescription={false}
        language="de"
        t={t}
      />,
    )

    await waitFor(() => expect(firstSignal.aborted).toBe(true))
    expect(placeEnrichment).toHaveBeenCalledTimes(2)
  })
})
