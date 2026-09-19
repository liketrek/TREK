import { useEffect } from 'react'
import { useNetworkMode } from '../../../hooks/useNetworkMode'
import { useDocSyncOfferStore } from '../../../store/docSyncOfferStore'
import { useServerPing } from '../../../sync/useServerPing'

/**
 * Whether this trip's Files screen shows the "Document sync" button.
 *
 * One hook for both shells, so the toolbar and the phone header cannot drift
 * on who sees it. The last known answer renders straight away; the server is
 * asked again when the screen mounts and when the connection comes back, and
 * never while offline, where the button keeps whatever it last knew.
 *
 * It is also asked on every `docsync:changed`, which the server sends when a
 * binding comes or goes. A member can sit on the Files tab while the owner
 * binds the trip, and on desktop that tab may never remount before a reload.
 */
export function useDocSyncOffered(tripId: number | string, canManage: boolean): boolean {
  const offered = useDocSyncOfferStore(
    s => s.bound[String(tripId)] === true || (canManage && s.providers === true),
  )
  const refresh = useDocSyncOfferStore(s => s.refresh)
  const { offline } = useNetworkMode()

  useEffect(() => {
    if (!offline) void refresh(tripId, canManage)
  }, [tripId, canManage, offline, refresh])

  // Off while offline: the effect above already asks on the way back, and the
  // ping's own return-to-online refetch would only ask a second time.
  useServerPing('docsync:changed', !offline, () => refresh(tripId, canManage))

  return offered
}
