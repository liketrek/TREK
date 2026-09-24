import { useEffect, useState } from 'react'
import type { RoadtripHazards } from '@trek/shared'
import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { roadtripHazardsRepo } from '../../repo/roadtripHazardsRepo'
import { isEffectivelyOffline, onNetworkModeChange } from '../../sync/networkMode'

export function useRoadtripHazards(tripId: number | undefined, roadtrip: boolean) {
  const enabled = useRoadtripSettings(s => s.roadtrip_show_hazards === true, tripId) && roadtrip && !!tripId
  const [feed, setFeed] = useState<RoadtripHazards | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable' | 'offline'>('loading')
  useEffect(() => {
    if (!enabled || !tripId) return
    let controller: AbortController
    const load = () => {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      setFeed(null)
      if (isEffectivelyOffline()) { setStatus('offline'); return }
      setStatus('loading')
      roadtripHazardsRepo.read(tripId, signal).then(saved => {
        if (!signal.aborted) { setFeed(saved); setStatus('ready') }
      }).catch(() => { if (!signal.aborted) setStatus('unavailable') })
    }
    load()
    const timer = window.setInterval(load, 600000)
    const unsubscribe = onNetworkModeChange(load)
    window.addEventListener('online', load)
    return () => { controller.abort(); window.clearInterval(timer); unsubscribe(); window.removeEventListener('online', load) }
  }, [enabled, tripId])
  return { enabled, feed: enabled ? feed : null, status }
}
