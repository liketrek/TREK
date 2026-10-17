import { describe, expect, it, vi } from 'vitest'
import { PROVIDER_PHOTO_BATCH, ProviderPhotoBatchError, postProviderPhotosInBatches } from './providerPhotoBatches'

describe('postProviderPhotosInBatches (#1587)', () => {
  it('FE-PPBATCH-001: cuts ids and media types at the same positions and sums the answers', async () => {
    const post = vi.fn(async (ids: string[]) => ({ photos: ids.map(id => ({ id })), added: ids.length - 1 }))
    const ids = ['a', 'b', 'c', 'd', 'e']
    const types = ['image', 'video', 'image', 'video', 'image']

    const result = await postProviderPhotosInBatches(ids, types, post, 2)

    expect(post.mock.calls).toEqual([
      [['a', 'b'], ['image', 'video']],
      [['c', 'd'], ['image', 'video']],
      [['e'], ['image']],
    ])
    expect(result).toEqual({ photos: ids.map(id => ({ id })), added: 2 })
  })

  it('FE-PPBATCH-002: leaves media types out of every batch when none were given', async () => {
    const post = vi.fn(async () => ({ added: 1 }))

    await postProviderPhotosInBatches(['a', 'b', 'c'], undefined, post, 2)

    expect(post.mock.calls).toEqual([[['a', 'b'], undefined], [['c'], undefined]])
  })

  it('FE-PPBATCH-003: an empty selection still makes the one request it always made', async () => {
    const post = vi.fn(async () => undefined)

    expect(await postProviderPhotosInBatches([], undefined, post)).toEqual({ photos: [], added: 0 })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith([], undefined)
  })

  it('FE-PPBATCH-004: a failing batch stops the run and rejects, the batches after it are never sent', async () => {
    const post = vi.fn()
      .mockResolvedValueOnce({ photos: [], added: 2 })
      .mockRejectedValueOnce(new Error('413'))
    const ids = Array.from({ length: 5 }, (_, i) => `id${i}`)

    await expect(postProviderPhotosInBatches(ids, undefined, post, 2)).rejects.toThrow('413')
    expect(post).toHaveBeenCalledTimes(2)
  })

  it('FE-PPBATCH-006: a later batch that fails still reports what the earlier batches saved', async () => {
    const cause = new Error('502')
    const post = vi.fn()
      .mockResolvedValueOnce({ photos: [{ id: 1 }, { id: 2 }], added: 2 })
      .mockResolvedValueOnce({ photos: [{ id: 3 }], added: 1 })
      .mockRejectedValueOnce(cause)
    const ids = Array.from({ length: 7 }, (_, i) => `id${i}`)

    const err = await postProviderPhotosInBatches(ids, undefined, post, 2).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ProviderPhotoBatchError)
    expect(err).toMatchObject({ added: 3, photos: [{ id: 1 }, { id: 2 }, { id: 3 }], message: '502', cause })
    expect(post).toHaveBeenCalledTimes(3)
  })

  it('FE-PPBATCH-007: a first batch that fails rejects with the request error itself, nothing having been saved', async () => {
    const cause = { response: { status: 413 } }
    const post = vi.fn().mockRejectedValueOnce(cause)

    await expect(postProviderPhotosInBatches(['a', 'b', 'c'], undefined, post, 2)).rejects.toBe(cause)
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('FE-PPBATCH-008: a cause that is not an Error still gets a message', () => {
    const err = new ProviderPhotoBatchError({ photos: [], added: 0 }, 'gone')

    expect(err.message).toBe('Adding the photos failed part way')
    expect(err.name).toBe('ProviderPhotoBatchError')
    expect(err.cause).toBe('gone')
  })

  it('FE-PPBATCH-005: batches of 500 by default, far under the 100 kB body limit', async () => {
    const post = vi.fn(async (ids: string[], _types?: string[]) => ({ added: ids.length }))
    const ids = Array.from({ length: 1200 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)

    const result = await postProviderPhotosInBatches(ids, ids.map(() => 'image'), post)

    expect(PROVIDER_PHOTO_BATCH).toBe(500)
    expect(post.mock.calls.map(([batch]) => batch.length)).toEqual([500, 500, 200])
    expect(result.added).toBe(1200)
    const largest = JSON.stringify({ provider: 'immich', asset_ids: post.mock.calls[0][0], media_types: post.mock.calls[0][1] })
    expect(largest.length).toBeLessThan(100 * 1024)
  })
})
