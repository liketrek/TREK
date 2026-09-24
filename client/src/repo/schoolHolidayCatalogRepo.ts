import { schoolHolidayCatalogApi } from '../api/schoolHolidayCatalog'
import { isEffectivelyOffline } from '../sync/networkMode'

// Instance administration is online-only: a shared catalog must not replay stale edits.
export const schoolHolidayCatalogRepo = {
  ...schoolHolidayCatalogApi,
  requireOnline() {
    if (isEffectivelyOffline()) throw new Error('School holiday administration requires a connection')
  },
}
