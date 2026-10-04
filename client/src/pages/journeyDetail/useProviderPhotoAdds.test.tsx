// FE-JRN-PPADD-001 to FE-JRN-PPADD-007
import type { ReactNode } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { renderHook } from '../../../tests/helpers/render'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { ProviderPhotoBatchError } from '../../api/providerPhotoBatches'
import { useJourneyStore } from '../../store/journeyStore'
import { useProviderPhotoAdds } from './useProviderPhotoAdds'

type AddToast = NonNullable<typeof window.__addToast>

const journeyStoreInitial = useJourneyStore.getState()
let addToast: Mock<AddToast>
let toEntry: Mock
let toGallery: Mock

function wrapper({ children }: { children: ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>
}

function setup() {
  const reload = vi.fn()
  const { result } = renderHook(() => useProviderPhotoAdds(reload), { wrapper })
  return { reload, ...result.current }
}

/** A large add that failed after `added` photos of its earlier batches were stored. */
const partial = (added: number) => new ProviderPhotoBatchError({ photos: [], added }, new Error('502'))

const toasts = () => addToast.mock.calls.map(([message, type]) => [message, type])

beforeEach(() => {
  addToast = vi.fn<AddToast>(() => 0)
  window.__addToast = addToast
  toEntry = vi.fn(async () => ({ photos: [], added: 1 }))
  toGallery = vi.fn(async () => ({ photos: [], added: 1 }))
  useJourneyStore.setState({ addProviderPhotos: toEntry, addProviderPhotosToGallery: toGallery } as never)
})

afterEach(() => {
  delete window.__addToast
  useJourneyStore.setState(journeyStoreInitial, true)
})

describe('useProviderPhotoAdds', () => {
  it('FE-JRN-PPADD-001: the picker sends every group to the gallery in turn, then counts and reloads once', async () => {
    toGallery.mockResolvedValueOnce({ photos: [], added: 2 }).mockResolvedValueOnce({ photos: [], added: 3 })
    const { addPickedPhotos, reload } = setup()
    const first = { assetIds: ['a1', 'a2'], mediaTypes: ['image', 'video'] }
    const second = { assetIds: ['b1', 'b2', 'b3'], passphrase: 'pw' }

    await addPickedPhotos(9, 'immich', [first, second], null)

    expect(toGallery.mock.calls).toEqual([[9, 'immich', first], [9, 'immich', second]])
    expect(toEntry).not.toHaveBeenCalled()
    expect(toasts()).toEqual([['5 photos added', 'success']])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-PPADD-002: with an entry picked the groups go to that entry', async () => {
    const { addPickedPhotos, reload } = setup()
    const group = { assetIds: ['a1'] }

    await addPickedPhotos(9, 'synologyphotos', [group], 4)

    expect(toEntry).toHaveBeenCalledWith(4, 'synologyphotos', group)
    expect(toGallery).not.toHaveBeenCalled()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-PPADD-003: a group that fails outright is reported, and the ones that landed still count', async () => {
    toGallery.mockResolvedValueOnce({ photos: [], added: 2 }).mockRejectedValueOnce(new Error('offline'))
    const { addPickedPhotos, reload } = setup()

    await addPickedPhotos(9, 'immich', [{ assetIds: ['a1', 'a2'] }, { assetIds: ['b1'] }], null)

    expect(toasts()).toEqual([['2 photos added', 'success'], ['Error', 'error']])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-PPADD-004: nothing added and a failure: only the error, no reload', async () => {
    toGallery.mockRejectedValueOnce(new Error('offline'))
    const { addPickedPhotos, reload } = setup()

    await addPickedPhotos(9, 'immich', [{ assetIds: ['a1'] }], null)

    expect(toasts()).toEqual([['Error', 'error']])
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-JRN-PPADD-005: a group that fails part way counts the batches it stored, reloads, and still reports the failure (#1587)', async () => {
    toGallery.mockRejectedValueOnce(partial(500))
    const { addPickedPhotos, reload } = setup()

    await addPickedPhotos(9, 'immich', [{ assetIds: Array.from({ length: 700 }, (_, i) => `a${i}`) }], null)

    expect(toasts()).toEqual([['500 photos added', 'success'], ['Error', 'error']])
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('FE-JRN-PPADD-006: an add that stored nothing new, every photo already there, says nothing and reloads nothing', async () => {
    toGallery.mockResolvedValueOnce({ photos: [], added: 0 })
    const { addPickedPhotos, reload } = setup()

    await addPickedPhotos(9, 'immich', [{ assetIds: ['a1'] }], null)

    expect(addToast).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('FE-JRN-PPADD-007: an entry-editor group rethrows every failure, and shows what a partial one stored', async () => {
    const { addEntryPhotos, reload } = setup()
    const group = { provider: 'immich', assetIds: ['a1'], passphrase: 'pw', mediaTypes: ['image'] }

    // Success is quiet: the editor reloads the journey once it is done.
    await addEntryPhotos(4, group)
    expect(toEntry).toHaveBeenCalledWith(4, 'immich', group)
    expect(addToast).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()

    // Part way: the editor keeps the group queued off the rejection, so it has
    // to come through, and what did land is shown now rather than on Save.
    const err = partial(500)
    toEntry.mockRejectedValueOnce(err)
    await expect(addEntryPhotos(4, group)).rejects.toBe(err)
    expect(toasts()).toEqual([['500 photos added', 'success']])
    expect(reload).toHaveBeenCalledTimes(1)

    // Nothing stored: nothing to show, just the failure.
    addToast.mockClear()
    reload.mockClear()
    toEntry.mockRejectedValueOnce(new Error('offline'))
    await expect(addEntryPhotos(4, group)).rejects.toThrow('offline')
    expect(addToast).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
