import { useEffect, useState } from 'react'
import { airtrailApi } from '../api/client'
import { useAddonStore } from '../store/addonStore'

/**
 * Resolves whether the current user can use AirTrail in a trip: the addon must
 * be enabled globally AND the user must have a working connection. Drives the
 * "AirTrail Import/Sync" button visibility in the Transport panel.
 */
export function useAirtrailConnection() {
  const airtrailEnabled = useAddonStore(s => s.isEnabled('airtrail'))
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!airtrailEnabled) {
      setConnected(false)
      return
    }
    let cancelled = false
    setLoading(true)
    airtrailApi
      .status()
      .then(d => { if (!cancelled) setConnected(!!d.connected) })
      .catch(() => { if (!cancelled) setConnected(false) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [airtrailEnabled])

  return { airtrailEnabled, connected, available: airtrailEnabled && connected, loading }
}
