// FE-COMP-MATLASPOPUP-001 to FE-COMP-MATLASPOPUP-006
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, fireEvent, waitFor } from '../../../../tests/helpers/render'
import { server } from '../../../../tests/helpers/msw/server'
import MAtlasCountryPopup from './MAtlasCountryPopup'
import type { AtlasController } from './atlasController'

const bucketItem = (id: number, name: string, countryCode: string | null) => ({
  id, name, country_code: countryCode, lat: null, lng: null, notes: null, target_date: null,
})

// Only the slice of the atlas hook this sheet reads. `t` echoes the key back so
// the assertions name the contract, not a locale string.
function makeAtlas(overrides: Record<string, unknown> = {}): AtlasController {
  return {
    t: (key: string) => key,
    confirmAction: { code: 'FR', name: 'France', type: 'choose' },
    setConfirmAction: vi.fn(),
    executeConfirmAction: vi.fn(),
    setData: vi.fn(),
    setVisitedRegions: vi.fn(),
    setBucketList: vi.fn(),
    visitedRegions: {},
    bucketList: [],
    handleDeleteBucketItem: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AtlasController
}

afterEach(() => {
  delete window.__addToast
})

describe('MAtlasCountryPopup', () => {
  it('FE-COMP-MATLASPOPUP-001: offers the wishlist removal for a country on the bucket list', () => {
    const atlas = makeAtlas({ bucketList: [bucketItem(42, 'Paris', 'FR')] })
    render(<MAtlasCountryPopup atlas={atlas} />)

    expect(screen.getByText('atlas.removeFromBucket')).toBeInTheDocument()
    expect(screen.getByText('atlas.removeFromBucketHint')).toBeInTheDocument()
  })

  it('FE-COMP-MATLASPOPUP-002: hides the removal for a country that is not on the bucket list', () => {
    const atlas = makeAtlas({ bucketList: [bucketItem(42, 'Tokyo', 'JP')] })
    render(<MAtlasCountryPopup atlas={atlas} />)

    expect(screen.getByText('atlas.addToBucket')).toBeInTheDocument()
    expect(screen.queryByText('atlas.removeFromBucket')).not.toBeInTheDocument()
  })

  it('FE-COMP-MATLASPOPUP-003: removing drops every entry for that country and closes the sheet', async () => {
    const handleDeleteBucketItem = vi.fn().mockResolvedValue(undefined)
    const setConfirmAction = vi.fn()
    const atlas = makeAtlas({
      // Two places in France plus one elsewhere, only the French ones go.
      bucketList: [bucketItem(1, 'Paris', 'FR'), bucketItem(2, 'Nice', 'FR'), bucketItem(3, 'Tokyo', 'JP')],
      handleDeleteBucketItem,
      setConfirmAction,
    })
    render(<MAtlasCountryPopup atlas={atlas} />)

    fireEvent.click(screen.getByText('atlas.removeFromBucket'))

    await waitFor(() => expect(setConfirmAction).toHaveBeenCalledWith(null))
    expect(handleDeleteBucketItem).toHaveBeenCalledTimes(2)
    expect(handleDeleteBucketItem).toHaveBeenCalledWith(1)
    expect(handleDeleteBucketItem).toHaveBeenCalledWith(2)
  })

  it('FE-COMP-MATLASPOPUP-004: keeps the removal out of the region variant', () => {
    const atlas = makeAtlas({
      confirmAction: { code: 'FR', name: 'Corsica', type: 'choose-region', regionCode: 'FR-20R', countryName: 'France' },
      bucketList: [bucketItem(42, 'Paris', 'FR')],
    })
    render(<MAtlasCountryPopup atlas={atlas} />)

    expect(screen.getByText('atlas.markVisited')).toBeInTheDocument()
    expect(screen.queryByText('atlas.removeFromBucket')).not.toBeInTheDocument()
  })

  it('FE-COMP-MATLASPOPUP-005: adding a country that is already wishlisted for that date posts nothing (#1898)', async () => {
    const post = vi.fn()
    server.use(http.post('/api/addons/atlas/bucket-list', () => { post(); return HttpResponse.json({ item: { id: 9 } }) }))
    const addToast = vi.fn()
    window.__addToast = addToast as unknown as typeof window.__addToast
    const setBucketList = vi.fn()
    const setConfirmAction = vi.fn()
    const atlas = makeAtlas({
      confirmAction: { code: 'FR', name: 'France', type: 'bucket' },
      bucketList: [bucketItem(42, 'France', 'FR')],
      setBucketList,
      setConfirmAction,
    })
    render(<MAtlasCountryPopup atlas={atlas} />)

    fireEvent.click(screen.getByText('atlas.addToBucket'))

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('atlas.bucketDuplicate', 'error', undefined))
    expect(post).not.toHaveBeenCalled()
    expect(setBucketList).not.toHaveBeenCalled()
    // The sheet stays open so a target month can be picked instead.
    expect(setConfirmAction).not.toHaveBeenCalled()
  })

  it('FE-COMP-MATLASPOPUP-006: the same country for another target date still goes out (#1898)', async () => {
    let body: unknown = null
    server.use(http.post('/api/addons/atlas/bucket-list', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ item: { id: 9 } })
    }))
    const setBucketList = vi.fn()
    const setConfirmAction = vi.fn()
    const atlas = makeAtlas({
      confirmAction: { code: 'FR', name: 'France', type: 'bucket' },
      bucketList: [bucketItem(42, 'France', 'FR')],
      setBucketList,
      setConfirmAction,
    })
    render(<MAtlasCountryPopup atlas={atlas} />)

    const monthInput = document.querySelector('input[type="month"]') as HTMLInputElement
    fireEvent.change(monthInput, { target: { value: '2027-05' } })
    fireEvent.click(screen.getByText('atlas.addToBucket'))

    await waitFor(() => expect(setConfirmAction).toHaveBeenCalledWith(null))
    expect(body).toEqual({ name: 'France', country_code: 'FR', target_date: '2027-05' })
    expect(setBucketList).toHaveBeenCalled()
  })
})
