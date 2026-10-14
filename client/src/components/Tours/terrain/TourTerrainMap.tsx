import { ChevronDown, ChevronUp, Gauge, Palette, Pause, Play, RotateCcw, Scan, TrendingUp } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry';
import { formatElevation } from '../../../utils/units';
import { MAP_LAYER_SWITCHER_INSET, TourMapLayerSwitcher, type TourBaseLayer } from '../../Map/MapLayerSwitcher';
import { MAP_CONTROL_SHADOW } from '../../Map/mapControlShadow';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { GRADE_BANDS, terrainStats, type GradeBandKey, type TerrainStats } from './tourTerrainModel';
import type { TerrainWaypoints } from './useTerrainPins';
import { useTourTerrain } from './useTourTerrain';

export interface TourTerrainMapProps {
  samples: DistanceIndexedProfileSample[];
  routes: [number, number][][] | null;
  trackColor: string;
  unit?: DistanceUnit;
  baseLayer: TourBaseLayer;
  onBaseLayerChange: (layer: TourBaseLayer) => void;
  onExit: () => void;
  focus: RouteProfileFocus | null;
  onFocusChange: (focus: RouteProfileFocus | null) => void;
  /** How much of the map each side panel covers, so framing and cards stay between them. */
  leftWidth: number;
  rightWidth: number;
  waypoints: TerrainWaypoints;
  framePoints: [number, number][];
}

const SPEEDS = [1, 2, 4] as const;
/** Width the layer pill takes with its 3D switch, so the dock starts beside it. */
const LAYER_PILL_WIDTH = 330;

// The planner's map-control glass, the same shell as the layer pill.
const GLASS = {
  background: 'var(--sidebar-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: MAP_CONTROL_SHADOW,
};

/**
 * The tour planner map in 3D: the same map surface between the side panels, the route
 * draped over an open elevation model and coloured by grade, with a flyover that moves
 * the cursor on the rail's elevation profile.
 */
export default function TourTerrainMap(props: TourTerrainMapProps) {
  const { samples, leftWidth, rightWidth, baseLayer, onBaseLayerChange, onExit, unit = 'metric' } = props;
  const { setContainer, ...terrain } = useTourTerrain({ ...props, panels: { leftWidth, rightWidth } });
  const stats = useMemo(() => terrainStats(samples), [samples]);

  return (
    <div className="absolute inset-0">
      {/* MapLibre makes its container position: relative, so it is sized, not inset. */}
      <div ref={setContainer} className="h-full w-full bg-surface" />

      {/* The flat map's layer pill, at the same spot, with 3D switched on. */}
      <div className="absolute bottom-3 z-[19]" style={{ insetInlineStart: leftWidth + MAP_LAYER_SWITCHER_INSET }}>
        <TourMapLayerSwitcher active={baseLayer} onChange={onBaseLayerChange} terrainActive onToggleTerrain={onExit} />
      </div>

      {/* The flyover controls and the grade legend share the bottom edge with the pill, short of the right panel. */}
      <div
        className="pointer-events-none absolute bottom-3 z-[19] grid grid-cols-[1fr_auto_1fr] items-end gap-3"
        style={{
          insetInlineStart: leftWidth + MAP_LAYER_SWITCHER_INSET + LAYER_PILL_WIDTH + 12,
          insetInlineEnd: rightWidth + MAP_LAYER_SWITCHER_INSET,
        }}
      >
        <span />
        {terrain.canReplay ? (
          <TerrainDock terrain={terrain} />
        ) : (
          <div
            className="pointer-events-auto rounded-full px-4 py-2.5 text-content-muted"
            style={{ ...GLASS, ...fs(12, 'body') }}
          >
            <PickHint editing={!!props.waypoints.onAdd} />
          </div>
        )}
        <div className="flex justify-end">{terrain.canReplay && <GradeLegend stats={stats} unit={unit} />}</div>
      </div>
    </div>
  );
}

function PickHint({ editing }: { editing: boolean }) {
  const { t } = useTranslation();
  return <>{t(editing ? 'tours.terrain.clickToPlan' : 'tours.terrain.pickTour')}</>;
}

function IconButton({
  label,
  onClick,
  children,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Tooltip label={label} placement="top">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-full transition-colors ${primary ? 'bg-accent text-accent-text hover:opacity-90' : 'text-content-muted hover:bg-surface-hover'}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px flex-none bg-edge" />;
}

/** One pill like the layer switcher: play, restart, overview · speed · relief · colour. */
function TerrainDock({ terrain }: { terrain: Omit<ReturnType<typeof useTourTerrain>, 'setContainer'> }) {
  const { t } = useTranslation();
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full p-1" style={GLASS}>
      {terrain.preloaded < 1 ? (
        <PreloadRing
          share={terrain.preloaded}
          label={t('tours.terrain.preloading', { percent: Math.round(terrain.preloaded * 100) })}
        />
      ) : (
        <IconButton
          primary
          label={terrain.playing ? t('tours.terrain.pause') : t('tours.terrain.play')}
          onClick={terrain.togglePlay}
        >
          {terrain.playing ? <Pause size={15} strokeWidth={2.2} /> : <Play size={15} strokeWidth={2.2} />}
        </IconButton>
      )}
      <IconButton label={t('tours.terrain.restart')} onClick={terrain.restart}>
        <RotateCcw size={15} strokeWidth={2} />
      </IconButton>
      <IconButton label={t('tours.terrain.overview')} onClick={terrain.overview}>
        <Scan size={15} strokeWidth={2} />
      </IconButton>
      <Divider />
      <div className="flex items-center" role="group" aria-label={t('tours.terrain.speed')}>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            aria-pressed={terrain.speed === speed}
            onClick={() => terrain.setSpeed(speed)}
            className={`h-[34px] min-w-[34px] rounded-full px-2 font-semibold tabular-nums ${terrain.speed === speed ? 'bg-accent-soft text-accent' : 'text-content-muted hover:bg-surface-hover'}`}
            style={fs(11)}
          >
            {speed}×
          </button>
        ))}
      </div>
      <Divider />
      <Tooltip label={t('tours.terrain.exaggeration')} placement="top">
        <label className="flex h-[34px] items-center gap-2 px-2 text-content-muted" style={fs(11)}>
          <TrendingUp size={15} strokeWidth={2} aria-hidden />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={terrain.exaggeration}
            aria-label={t('tours.terrain.exaggeration')}
            onChange={(e) => terrain.setExaggeration(Number(e.target.value))}
            className="w-20 accent-[var(--accent)]"
          />
          <span className="w-7 font-semibold tabular-nums">{terrain.exaggeration.toFixed(1)}×</span>
        </label>
      </Tooltip>
      <Divider />
      <button
        type="button"
        onClick={() => terrain.setColorMode(terrain.colorMode === 'grade' ? 'tour' : 'grade')}
        aria-pressed={terrain.colorMode === 'grade'}
        className={`flex h-[34px] items-center gap-1.5 rounded-full px-3 font-semibold ${terrain.colorMode === 'grade' ? 'bg-accent-soft text-accent' : 'text-content-muted hover:bg-surface-hover'}`}
        style={fs(11)}
      >
        <Palette size={15} strokeWidth={2} />
        {t('tours.terrain.colorByGrade')}
      </button>
    </div>
  );
}

/** The landscape loading ahead of the flyover: a ring that fills, with the share in its tooltip. */
function PreloadRing({ share, label }: { share: number; label: string }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <Tooltip label={label} placement="top">
      <span
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(share * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative flex h-[34px] w-[34px] items-center justify-center"
      >
        <svg width="34" height="34" viewBox="0 0 34 34" className="absolute inset-0 -rotate-90">
          <circle cx="17" cy="17" r={r} fill="none" stroke="var(--border-primary)" strokeWidth="3" />
          <circle
            cx="17"
            cy="17"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - share)}
          />
        </svg>
        <span className="font-semibold tabular-nums text-content-muted" style={fs(9)}>
          {Math.round(share * 100)}
        </span>
      </span>
    </Tooltip>
  );
}

/** The grade mix as a pill like the dock; it unfolds upwards into the bands. */
function GradeLegend({ stats, unit }: { stats: TerrainStats; unit: DistanceUnit }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const total = stats.totalMeters || 1;
  const width = (key: GradeBandKey) => `${(stats.bandMeters[key] / total) * 100}%`;
  return (
    <div className="pointer-events-auto relative">
      {open && (
        <div id="tour-terrain-grades" className="absolute inset-x-0 bottom-full mb-2 rounded-2xl p-3" style={GLASS}>
          <ul className="flex flex-col gap-1">
            {GRADE_BANDS.map((band) => (
              <li key={band.key} className="flex items-center gap-2 text-content-secondary" style={fs(11)}>
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: band.paint }} />
                <span className="flex-1">{t(`tours.terrain.band.${band.key}`)}</span>
                <span className="tabular-nums text-content">
                  {Math.round((stats.bandMeters[band.key] / total) * 100)} %
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-edge-faint pt-2 text-content-faint" style={fs(9)}>
            {t('tours.terrain.attribution')}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tour-terrain-grades"
        aria-label={t('tours.terrain.gradeMix')}
        className="flex h-[42px] items-center gap-2 rounded-full pe-2 ps-3"
        style={GLASS}
      >
        <span className="flex h-1.5 w-14 overflow-hidden rounded-full bg-surface-hover" aria-hidden>
          {GRADE_BANDS.map((band) => (
            <span key={band.key} style={{ width: width(band.key), background: band.paint }} />
          ))}
        </span>
        {stats.summit && (
          <SoftPill icon={<TrendingUp size={11} strokeWidth={2} className="flex-none" />}>
            {formatElevation(stats.summit.elevationMeters, unit)}
          </SoftPill>
        )}
        {stats.steepest && (
          <SoftPill
            tone={stats.steepest.grade >= 27 ? 'danger' : stats.steepest.grade >= 18 ? 'warning' : 'neutral'}
            icon={<Gauge size={11} strokeWidth={2} className="flex-none" />}
          >
            {t('tours.terrain.steepestShort', { grade: Math.round(stats.steepest.grade) })}
          </SoftPill>
        )}
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-content-muted">
          {open ? <ChevronDown size={14} strokeWidth={2.2} /> : <ChevronUp size={14} strokeWidth={2.2} />}
        </span>
      </button>
    </div>
  );
}
