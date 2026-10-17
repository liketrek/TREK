import { Anchor, Loader2, Map as MapIcon, MapPinPlus, Mountain, Rotate3d, Satellite } from 'lucide-react'
import type { PaddleMapLayer } from '../Tours/paddle/paddleMapLayer'
import type { CSSProperties } from 'react'
import { useTranslation } from '../../i18n'
import { FerrataLineIcon } from '../Ferratas/FerrataGlyph'
import type { FerrataMapLayer } from '../Ferratas/useFerrataMapLayer'
import type { FerrataStatus } from '../Ferratas/useTripFerratas'
import { fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import { MAP_CONTROL_SHADOW } from './mapControlShadow'
import type { ToggleableRasterOverlay } from './mapRasterOverlay'

export type BaseLayer = 'default' | 'satellite'
export type TourBaseLayer = BaseLayer | 'topo'

/** What a tour's type offers on the planner map (P2B-06): its base layers, and the overlays beside the ferratas. */
export interface TourLayerOffer {
  bases?: readonly TourBaseLayer[]
  overlays?: readonly ToggleableRasterOverlay[]
  /** PAD-05B: the paddle obstacles around a paddle tour, drawn by every renderer. */
  paddle?: PaddleMapLayer
}

const FROSTED_SHELL = {
  display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999, pointerEvents: 'auto' as const,
  background: 'var(--sidebar-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: MAP_CONTROL_SHADOW,
}

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
    <div style={FROSTED_SHELL}>
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

const TOUR_LAYERS = [
  { id: 'default', labelKey: 'map.baseLayer.default', Icon: MapIcon },
  { id: 'topo', labelKey: null, Icon: Mountain },
  { id: 'satellite', labelKey: 'map.baseLayer.satellite', Icon: Satellite },
] as const

/** A pill segment of the Tours control; `filled` lets its class paint the background. */
const segmentStyle = (filled: boolean): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  minHeight: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
  background: filled ? undefined : 'transparent', padding: '0 10px',
  fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600,
})

type Translate = (key: string, params?: Record<string, string | number>) => string

/** What the via ferrata layer is doing, in words, for the toggle's tooltip and the screen reader. */
function ferrataStatusLabel(status: Exclude<FerrataStatus, 'idle'>, count: number, t: Translate): string {
  switch (status) {
    case 'loading':
      return t('ferratas.loading')
    case 'error':
      return t('ferratas.error')
    case 'offline':
      return t('ferratas.offline')
    case 'tooLarge':
      return t('ferratas.zoomIn')
    case 'ready':
      return t('ferratas.count', { count })
  }
}

/**
 * The via ferrata switch with its count as a badge: how many ferratas reach
 * into the view, a small spinner while tiles load, and the warning tone when
 * there is a reason it cannot load (offline, the mirrors down, the view too
 * wide), which the tooltip names. Nothing beside the switch, so the bottom row
 * stays one pill wide. `compact` drops the word and keeps the icon and the
 * badge; the tooltip and the accessible name still say what it is.
 */
function FerrataToggle({ layer, compact = false }: { layer: FerrataMapLayer; compact?: boolean }) {
  const { t } = useTranslation()
  const { active, status, count } = layer
  const live = active && status !== 'idle' ? ferrataStatusLabel(status, count, t) : null
  const problem = status === 'error' || status === 'offline' || status === 'tooLarge'
  return (
    <>
      <Tooltip label={live ?? t('ferratas.layer')} placement="top">
        <button
          type="button"
          onClick={layer.onToggle}
          aria-label={t('ferratas.layer')}
          aria-pressed={active}
          className={active ? 'bg-accent text-accent-text' : 'text-content-muted'}
          style={segmentStyle(active)}
        >
          <FerrataLineIcon size={15} strokeWidth={2} />
          {!compact && <span>{t('ferratas.layer')}</span>}
          {live && (
            <span
              aria-hidden
              data-testid="ferrata-count-badge"
              data-tone={problem ? 'warning' : 'default'}
              className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-semibold tabular-nums leading-none ${
                problem ? 'bg-warning-soft text-warning' : 'bg-accent-text text-accent'
              }`}
              style={fs(10)}
            >
              {status === 'loading'
                ? <Loader2 size={10} strokeWidth={2.5} className="motion-safe:animate-spin" data-testid="ferrata-count-spinner" />
                : count}
            </span>
          )}
        </button>
      </Tooltip>
      {/* Polite, so a screen reader hears the count arrive without being interrupted. */}
      <span role="status" aria-live="polite" className="sr-only">{live ?? ''}</span>
    </>
  )
}

/** The tour map's "set points" tool: while on, a click on the map places a point. */
export interface MapPlaceTool {
  active: boolean
  onToggle: () => void
}

/** The switch for the "set points" tool, on its icon, named by its tooltip. */
function PlaceToolToggle({ tool }: { tool: MapPlaceTool }) {
  const { t } = useTranslation()
  const label = t('tours.planner.placePoints')
  return (
    <Tooltip label={label} placement="top">
      <button
        type="button"
        onClick={tool.onToggle}
        aria-label={label}
        aria-pressed={tool.active}
        data-testid="map-place-tool"
        className={tool.active ? 'bg-accent text-accent-text' : 'text-content-muted'}
        style={segmentStyle(tool.active)}
      >
        <MapPinPlus size={15} strokeWidth={2} />
      </button>
    </Tooltip>
  )
}

/** How each overlay the planner can offer is named and drawn on its switch. */
const OVERLAY_LOOK: Record<string, { Icon: typeof Anchor; labelKey: string; downKey: string }> = {
  seamarks: { Icon: Anchor, labelKey: 'tours.map.seamarks', downKey: 'tours.map.seamarksDown' },
}

/**
 * The switch for a transparent overlay (the seamarks), the way the via
 * ferrata switch looks: on in the accent, and in the warning tone with a badge
 * once its source stopped answering, which the tooltip names. The map and the
 * planning go on without it.
 */
function OverlayToggle({ overlay, compact }: { overlay: ToggleableRasterOverlay; compact: boolean }) {
  const { t } = useTranslation()
  const look = OVERLAY_LOOK[overlay.id]
  if (!look) return null
  const label = t(look.labelKey)
  const down = overlay.status === 'down'
  const on = overlay.status !== 'off'
  return (
    <>
      <Tooltip label={down ? t(look.downKey) : label} placement="top">
        <button
          type="button"
          onClick={overlay.onToggle}
          aria-label={label}
          aria-pressed={on}
          data-testid={`map-overlay-${overlay.id}`}
          data-status={overlay.status}
          className={on ? 'bg-accent text-accent-text' : 'text-content-muted'}
          style={segmentStyle(on)}
        >
          <look.Icon size={15} strokeWidth={2} />
          {!compact && <span>{label}</span>}
          {down && (
            <span aria-hidden className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warning-soft px-1 font-semibold leading-none text-warning" style={fs(10)}>
              !
            </span>
          )}
        </button>
      </Tooltip>
      <span role="status" aria-live="polite" className="sr-only">{down ? t(look.downKey) : ''}</span>
    </>
  )
}

/**
 * Per-view Tours control. It never reads or writes the global map setting.
 * `compact` shows the base layers and the via ferrata switch by their icons
 * alone, each named by its tooltip, for a bottom row that has to share its
 * width (the 3D map's, beside the flyover dock).
 */
export function TourMapLayerSwitcher({
  active,
  onChange,
  onToggleTerrain,
  terrainActive = false,
  ferrataLayer,
  placeTool,
  layers,
  compact = false,
}: {
  active: TourBaseLayer
  onChange: (layer: TourBaseLayer) => void
  /** The base layers and overlays this tour's type offers; all three bases and no overlay when left out. */
  layers?: TourLayerOffer
  /** Offers the 3D terrain switch beside the base layers. */
  onToggleTerrain?: () => void
  terrainActive?: boolean
  /** Offers the via ferrata switch, with its count badge, beside the base layers. */
  ferrataLayer?: FerrataMapLayer
  /** Offers the "set points" switch, while a tour is being edited. */
  placeTool?: MapPlaceTool
  compact?: boolean
}) {
  const { t } = useTranslation()
  const bases = layers?.bases
  const overlays = layers?.overlays

  return (
    <div style={{ ...FROSTED_SHELL, gap: 2 }} role="group" aria-label={t('settings.mapStyle')}>
      {TOUR_LAYERS.filter(({ id }) => !bases || bases.includes(id)).map(({ id, labelKey, Icon }) => {
        const selected = active === id
        const label = labelKey ? t(labelKey) : 'Topo'
        return (
          <Tooltip key={id} label={label} placement="top" disabled={!compact}>
            <button
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={selected}
              aria-label={compact ? label : undefined}
              className={selected ? 'bg-accent-soft text-accent' : 'text-content-muted'}
              style={segmentStyle(selected)}
            >
              <Icon size={15} strokeWidth={2} />
              {!compact && <span>{label}</span>}
            </button>
          </Tooltip>
        )
      })}
      {(ferrataLayer || onToggleTerrain || placeTool || !!overlays?.length) && <span aria-hidden className="mx-0.5 h-5 w-px bg-edge" />}
      {placeTool && <PlaceToolToggle tool={placeTool} />}
      {ferrataLayer && <FerrataToggle layer={ferrataLayer} compact={compact} />}
      {overlays?.map(overlay => <OverlayToggle key={overlay.id} overlay={overlay} compact={compact} />)}
      {onToggleTerrain && (
        <button
          type="button"
          onClick={onToggleTerrain}
          aria-pressed={terrainActive}
          className={terrainActive ? 'bg-accent text-accent-text' : 'text-content-muted'}
          style={segmentStyle(terrainActive)}
        >
          <Rotate3d size={15} strokeWidth={2} />
          <span>3D</span>
        </button>
      )}
    </div>
  )
}
