import { Map as MapIcon, Satellite } from 'lucide-react'
import { useTranslation } from '../../i18n'

export type BaseLayer = 'default' | 'satellite'

// Round base-layer switcher for the Leaflet planner map (default street tiles ↔
// satellite). Same frosted shell as MapCompassPill so it lines up with the other
// map controls; the icon shows the layer it switches to.
export function MapLayerSwitcher({ active, onToggle }: { active: BaseLayer; onToggle: () => void }) {
  const { t } = useTranslation()
  const isSatellite = active === 'satellite'
  const Icon = isSatellite ? MapIcon : Satellite
  const label = isSatellite ? t('map.baseLayer.switchToDefault') : t('map.baseLayer.switchToSatellite')

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'var(--sidebar-shadow, 0 4px 16px rgba(0,0,0,0.14))',
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        aria-pressed={isSatellite}
        className="text-content-muted"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'transparent', padding: 0,
          transition: 'background 0.14s, color 0.14s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <Icon size={17} strokeWidth={2} />
      </button>
    </div>
  )
}
