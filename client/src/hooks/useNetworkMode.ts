import { useSyncExternalStore } from 'react'
import {
  isEffectivelyOffline,
  isForcedOffline,
  setForcedOffline,
  onNetworkModeChange,
} from '../sync/networkMode'

/**
 * React binding for the global network mode. Re-renders when the browser goes
 * online/offline or the user toggles force-offline.
 *
 *   offline    — the effective offline state (real disconnection OR forced)
 *   forced     — whether the user has the force-offline switch on
 *   setForced  — flip the force-offline switch
 */
export function useNetworkMode(): { offline: boolean; forced: boolean; setForced: (v: boolean) => void } {
  const offline = useSyncExternalStore(onNetworkModeChange, isEffectivelyOffline, () => true)
  const forced = useSyncExternalStore(onNetworkModeChange, isForcedOffline, () => false)
  return { offline, forced, setForced: setForcedOffline }
}
