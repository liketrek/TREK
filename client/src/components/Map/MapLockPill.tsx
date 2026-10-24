import { Lock, Unlock } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { MapTogglePill } from './MapTogglePill'

/**
 * Locks the map view (#2010): picking days and places then leaves the camera where it is.
 * Sits on top of the base-layer switcher, the other control about the view itself.
 */
export function MapLockPill({ locked, onToggle }: { locked: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  return (
    <MapTogglePill
      active={locked}
      onToggle={onToggle}
      label={locked ? t('map.lock.unlock') : t('map.lock.lock')}
      testId="map-lock-pill"
      tooltipPlacement="right"
      icon={locked ? <Lock size={16} strokeWidth={2} /> : <Unlock size={16} strokeWidth={2} />}
    />
  )
}
