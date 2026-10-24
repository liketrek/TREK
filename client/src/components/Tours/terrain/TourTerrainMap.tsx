import type { FerrataBbox } from '@trek/shared';
import { ChevronDown, ChevronUp, Gauge, Palette, Pause, Play, RotateCcw, Scan, TrendingUp } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import type { DistanceIndexedProfileSample, RouteProfileFocus } from '../../../utils/routeGeometry';
import { formatElevation } from '../../../utils/units';
import type { FerrataMapLayer } from '../../Ferratas/useFerrataMapLayer';
import {
  MAP_LAYER_SWITCHER_INSET,
  TourMapLayerSwitcher,
  type MapPlaceTool,
  type TourBaseLayer,
  type TourLayerOffer,
} from '../../Map/MapLayerSwitcher';
import { MAP_CONTROL_SHADOW } from '../../Map/mapControlShadow';
import { tourRasterBaseOf } from '../../Map/tourRasterBases';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import type { TrackOverlay } from './terrainLayers';
import { GRADE_BANDS, terrainStats, type GradeBandKey, type TerrainStats } from './tourTerrainModel';
import { useControlRowFit } from './useControlRowFit';
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
  /** A paddle tour: no grade colours, no grade legend and no switch for them, the water is flat. */
  water?: boolean;
  /** The planner map's via ferrata layer: its switch joins the layer pill, its lines the terrain. */
  ferrataLayer?: FerrataMapLayer;
  /** What the tour's type offers: its base layers, and the overlays drawn on the terrain too. */
  tourLayers?: TourLayerOffer;
  /** The visible area, for the via ferrata layer to ask for, and the zoom an overlay's minimum is read against. */
  onViewportChange?: (bbox: FerrataBbox, zoom: number) => void;
  /** How high the controls along the bottom edge reach, every row of them, for what floats above them. */
  onControlsHeightChange?: (px: number) => void;
  /** The "set points" switch in the layer pill, while a tour is being edited. */
  placeTool?: MapPlaceTool;
  /** The grade legend's width and how far its open bands reach above it, for a card that sits on it; null while there is none. */
  onLegendLayout?: (layout: TerrainLegendLayout | null) => void;
  /** RTE-02: the ways of a section being compared, laid over the track in their own colours. */
  overlays?: readonly TrackOverlay[];
}

export interface TerrainLegendLayout {
  width: number;
  /** How far the unfolded bands reach above the legend pill, 0 while they are folded. */
  raisedBy: number;
}

const SPEEDS = [1, 2, 4] as const;

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
  const { onControlsHeightChange } = props;
  const { setContainer, ...terrain } = useTourTerrain({ ...props, panels: { leftWidth, rightWidth } });
  const stats = useMemo(() => terrainStats(samples), [samples]);
  const { fit, height: controlsHeight, attachRow, attachStack } = useControlRowFit();
  const legend =
    terrain.canReplay && !props.water ? (
      <GradeLegend stats={stats} unit={unit} onLayout={props.onLegendLayout} />
    ) : null;
  const legendAbove = fit === 'stacked';

  useEffect(() => {
    if (controlsHeight !== null) onControlsHeightChange?.(controlsHeight);
  }, [controlsHeight, onControlsHeightChange]);

  return (
    <div className="absolute inset-0">
      {/* MapLibre makes its container position: relative, so it is sized, not inset. */}
      <div ref={setContainer} className="h-full w-full bg-surface" />

      {/* One row along the bottom edge, between the panels and the same inset from both:
          the flat map's layer pill at the same spot with 3D switched on (the via ferrata
          count rides inside its switch), then the flyover controls and the grade legend.
          Where the row does not fit, the pill goes to its icons first, then the legend
          moves onto a row of its own above, so nothing runs under a panel. */}
      <div
        ref={attachStack}
        className="pointer-events-none absolute bottom-3 z-[19] flex flex-col items-end gap-3"
        style={{
          insetInlineStart: leftWidth + MAP_LAYER_SWITCHER_INSET,
          insetInlineEnd: rightWidth + MAP_LAYER_SWITCHER_INSET,
        }}
      >
        <BaseMapCredit layer={baseLayer} />
        {legendAbove && legend}
        <div ref={attachRow} className="flex w-full items-end gap-3" data-fit={fit} data-testid="terrain-control-row">
          <div className="flex-none">
            <TourMapLayerSwitcher
              active={baseLayer}
              onChange={onBaseLayerChange}
              terrainActive
              onToggleTerrain={onExit}
              ferrataLayer={props.ferrataLayer}
              placeTool={props.placeTool}
              layers={props.tourLayers}
              compact={fit !== 'full'}
            />
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-end gap-3">
            <span />
            {terrain.canReplay ? (
              <TerrainDock terrain={terrain} water={props.water} />
            ) : (
              <div
                className="pointer-events-auto rounded-full px-4 py-2.5 text-content-muted"
                style={{ ...GLASS, ...fs(12, 'body') }}
              >
                <PickHint editing={!!props.waypoints.onAdd} placeOff={props.placeTool?.active === false} />
              </div>
            )}
            <div className="flex justify-end">{!legendAbove && legend}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The credit of a map on terms (OpenHikingMap with its donation link, CyclOSM), which its
 * operator wants readable without a click (MAP-01, BIK-06). The 3D map's own attribution is
 * folded away and sits under the panel, so it rides above the control row while that map is shown.
 */
function BaseMapCredit({ layer }: { layer: TourBaseLayer }) {
  const credit = tourRasterBaseOf(layer)?.onTerms?.credit;
  if (!credit) return null;
  const link = 'text-content-secondary underline-offset-2 hover:underline';
  return (
    <div
      className="pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-content-faint"
      style={{ ...GLASS, ...fs(10) }}
      data-testid="base-map-credit"
    >
      {credit.map((part, index) => (
        <span key={part.href} className="flex items-center gap-1.5">
          {index > 0 && <span aria-hidden>|</span>}
          <a className={link} href={part.href} target="_blank" rel="noreferrer">
            {part.label}
          </a>
        </span>
      ))}
    </div>
  );
}

/** What a click on the terrain does now: plan, nothing until the tool is on, or nothing to plan. */
function PickHint({ editing, placeOff }: { editing: boolean; placeOff: boolean }) {
  const { t } = useTranslation();
  if (placeOff) return <>{t('tours.terrain.placeOff')}</>;
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

/** One pill like the layer switcher: play, restart, overview · speed · relief · colour (not on water). */
function TerrainDock({
  terrain,
  water,
}: {
  terrain: Omit<ReturnType<typeof useTourTerrain>, 'setContainer'>;
  water?: boolean;
}) {
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
            className="trek-range !w-20"
            style={{ '--fill': `${((terrain.exaggeration - 1) / 2) * 100}%` } as CSSProperties}
          />
          <span className="w-7 font-semibold tabular-nums">{terrain.exaggeration.toFixed(1)}×</span>
        </label>
      </Tooltip>
      {!water && <GradeSwitch terrain={terrain} />}
    </div>
  );
}

/** Colour the route by grade or in the tour colour. */
function GradeSwitch({ terrain }: { terrain: Omit<ReturnType<typeof useTourTerrain>, 'setContainer'> }) {
  const { t } = useTranslation();
  return (
    <>
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
    </>
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
function GradeLegend({
  stats,
  unit,
  onLayout,
}: {
  stats: TerrainStats;
  unit: DistanceUnit;
  onLayout?: (layout: TerrainLegendLayout | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // A card over the legend takes its width and stands on its bands when they are open.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !onLayout) return;
    const report = () => {
      const panel = panelRef.current;
      onLayout({ width: wrap.offsetWidth, raisedBy: open && panel ? panel.offsetHeight + 8 : 0 });
    };
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(wrap);
    if (panelRef.current) observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [open, onLayout]);
  useEffect(() => () => onLayout?.(null), [onLayout]);
  const total = stats.totalMeters || 1;
  const width = (key: GradeBandKey) => `${(stats.bandMeters[key] / total) * 100}%`;
  return (
    <div ref={wrapRef} className="pointer-events-auto relative">
      {open && (
        <div
          ref={panelRef}
          id="tour-terrain-grades"
          className="absolute inset-x-0 bottom-full mb-2 rounded-2xl p-3"
          style={GLASS}
        >
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
