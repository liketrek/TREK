import { addedBeforeFailure } from '../../api/providerPhotoBatches'
import type { ProviderPhotoGroup } from '../../components/Journey/JourneyDetailPageProviderPicker'
import { useToast } from '../../components/shared/Toast'
import { useTranslation } from '../../i18n'
import { useJourneyStore } from '../../store/journeyStore'

/** A group the entry editor queued: the picker's group plus the provider it came from. */
export type ProviderEntryGroup = ProviderPhotoGroup & { provider: string }

/**
 * Adding provider photos (Immich, Synology Photos) to a journey, for both shells:
 * the desktop gallery and entry editor, the phone screen and its entry sheet.
 *
 * A large add goes out in batches, so it can fail after some of them were stored
 * (#1587). Those photos are on the journey whatever happens next, so both flows
 * here count them and reload, and still report the failure for the rest. Before,
 * such an add read as a plain failure while its photos sat hidden until the next
 * reload.
 *
 * `reload` is how the host fetches the journey again.
 */
export function useProviderPhotoAdds(reload: () => void) {
  const toast = useToast()
  const { t } = useTranslation()

  const showAdded = (count: number) => {
    if (count <= 0) return
    toast.success(t('journey.photosAdded', { count }))
    reload()
  }

  /**
   * The picker's Add: every group onto the entry picked in it, or onto the
   * gallery, then one count, one reload and at most one error.
   */
  const addPickedPhotos = async (
    journeyId: number,
    provider: string,
    groups: ProviderPhotoGroup[],
    entryId: number | null,
  ): Promise<void> => {
    const { addProviderPhotos, addProviderPhotosToGallery } = useJourneyStore.getState()
    let added = 0
    let anyFailed = false
    // One group after the other: the server numbers photos in the order they
    // arrive, and each group is already sorted oldest first.
    for (const group of groups) {
      try {
        const result = entryId
          ? await addProviderPhotos(entryId, provider, group)
          : await addProviderPhotosToGallery(journeyId, provider, group)
        added += result.added
      } catch (err) {
        added += addedBeforeFailure(err)
        anyFailed = true
      }
    }
    showAdded(added)
    if (anyFailed) toast.error(t('common.error'))
  }

  /**
   * One group the entry editor queued, sent at Save. Rethrows, so the editor
   * still reports the group and keeps it queued: sending it again skips what
   * did land.
   */
  const addEntryPhotos = async (entryId: number, group: ProviderEntryGroup): Promise<void> => {
    try {
      await useJourneyStore.getState().addProviderPhotos(entryId, group.provider, group)
    } catch (err) {
      showAdded(addedBeforeFailure(err))
      throw err
    }
  }

  return { addPickedPhotos, addEntryPhotos }
}
