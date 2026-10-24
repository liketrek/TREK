import { useEffect, useState } from 'react'
import { addonsApi, memoriesApi } from '../../api/client'

export interface ConnectedPhotoProvider { id: string; name: string }

/**
 * The photo providers (Immich, Synology Photos) that are switched on for the
 * instance AND connected for this user, for every place that offers to pick
 * from them: the journey gallery and Studio (#2271). A provider whose status
 * cannot be read is left out rather than offered and then failing.
 */
export function useConnectedPhotoProviders(enabled = true): ConnectedPhotoProvider[] {
  const [providers, setProviders] = useState<ConnectedPhotoProvider[]>([])
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void (async () => {
      try {
        const addonsData = await addonsApi.enabled()
        const enabledProviders = (addonsData.addons || []).filter(
          (a: { type?: string; enabled?: boolean }) => a.type === 'photo_provider' && a.enabled,
        ) as { id: string; name: string }[]
        const connected: ConnectedPhotoProvider[] = []
        for (const p of enabledProviders) {
          try {
            const status = await memoriesApi.status(p.id)
            if (status.connected) connected.push({ id: p.id, name: p.name })
          } catch { /* not reachable for this user: not offered */ }
        }
        if (!cancelled) setProviders(connected)
      } catch { /* no addon list: nothing to offer */ }
    })()
    return () => { cancelled = true }
  }, [enabled])
  return providers
}
