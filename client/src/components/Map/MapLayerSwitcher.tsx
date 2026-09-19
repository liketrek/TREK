import { Map as MapIcon, Satellite } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Tooltip } from '../shared/Tooltip'
import { MAP_CONTROL_SHADOW } from './mapControlShadow'

export type BaseLayer = 'default' | 'satellite'

// Where the switcher sits and how much room it takes, so a control placed beside it
// (the phone's compass) is positioned off the same numbers instead of guessing them.
// Both map engines place the switcher with the inset, so they cannot drift apart either.

/** Distance from the map's left edge (plus any side panel) to the switcher. */
export const MAP_LAYER_SWITCHER_INSET = 20
/**
 * Outer size of the round shell: a 34px button in 4px of padding, the same shell as
 * MapCompassPill. The markup below keeps its literals, and FE-COMP-MAPLAYER-006 holds
 * them to this number.
 */
export const MAP_ROUND_CONTROL_SIZE = 42

// Round base-layer switcher for both planner maps, Leaflet and GL (default street
// tiles ↔ satellite). Same frosted shell as MapCompassPill so it lines up with the
// other map controls; the icon shows the layer it switches to.
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
      boxShadow: MAP_CONTROL_SHADOW,
    }}>
      {/* Same tooltip as its neighbours on the map, for the same reasons — see
          TripRouteOverviewPill. To the right, though: this one sits at the
          bottom left of the map, where a tooltip to the left would land on the
          day sidebar and one below would land off the screen. */}
      <Tooltip label={label} placement="right">
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
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
      </Tooltip>
    </div>
  )
}
