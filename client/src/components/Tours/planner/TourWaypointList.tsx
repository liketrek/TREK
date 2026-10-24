import { paddleLayoutOfPoints, type PaddleRole, type TourPoiCategory } from '@trek/shared';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  GripVertical,
  MapPin,
  MapPinned,
  MapPinPlus,
  MoreHorizontal,
  Navigation,
  RefreshCcwDot,
  RefreshCw,
  Repeat,
  Shuffle,
  Spline,
  SquarePen,
  Trash2,
  Unlink,
  Waves,
} from 'lucide-react';
import { Fragment, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import {
  useTourFerrataCrossingStore,
  type TourFerrataCrossing,
  type TourWaypointFerrata,
} from '../../../store/tourFerrataCrossingStore';
import { toggleTourPlacing, useTourPlaceToolStore } from '../../../store/tourPlaceToolStore';
import { FerrataGlyph } from '../../Ferratas/FerrataGlyph';
import { TOUR_POI_LOOKS } from '../../Map/poiCategories';
import { SoftPill } from '../../Planner/planParts';
import { ContextMenu, useContextMenu } from '../../shared/ContextMenu';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { LockIcon, PortageIcon } from '../paddle/PaddleGlyph';
import { AutoPointPill } from '../paddle/PaddleLegParts';
import { PaddleRolePill } from '../paddle/PaddleWaypointParts';
import { usePaddleRegionLoad } from '../paddle/usePaddleRegionLoad';
import { usePaddleWaypointActions } from '../paddle/usePaddleWaypointActions';
import { usePortageRouting } from '../paddle/usePortageRouting';
import { stageMenuItems } from '../stages/stageActions';
import { StageDivider, StageEndCorner } from '../stages/StageParts';
import { RailCard } from '../tourParts';
import { StationScheduleRow } from '../walk/StationSchedule';
import { usePlannerWalkSchedule } from '../walk/useWalkSchedule';
import { WalkDayLine } from '../walk/WalkDayLine';
import { paddlePlanPoints, paddleRolesById } from './paddlePlanOf';
import { StationDialog } from './StationDialog';
import { stationMarkNote, stationRingClass } from './stationMarks';
import { StationPills, StationShield } from './stationParts';
import { stopNumbersOf } from './tourPlannerWaypoints';
import { TripPlacePicker } from './TripPlacePicker';
import type { TourPlannerController } from './useTourPlanner';
import { useTripPlaceWaypoints } from './useTripPlaceWaypoints';
import { useWaypointPlaceNames } from './useWaypointPlaceNames';
import { WaypointLegRows } from './WaypointLegRows';

type DropTarget = { id: string; placement: 'before' | 'after' };

/** No tours known: every place with a spot is offered. */
const NO_TOUR_PLACES: ReadonlySet<number> = new Set();

const ROLE_KEY = {
  start: 'tours.planner.start',
  via: 'tours.planner.via',
  end: 'tours.planner.end',
} as const;

/** A quiet icon control on a waypoint row; it stops the click so the row is not selected too. */
function WaypointAction({
  label,
  disabled,
  danger = false,
  active,
  onAct,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  danger?: boolean;
  /** A switch rather than a one-off action: pressed while on. */
  active?: boolean;
  onAct: () => void;
  /** Told the click itself, for a control that opens a menu at its place. */
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-disabled={disabled}
        aria-pressed={active}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          if (onPress) onPress(event);
          else onAct();
        }}
        className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${disabled ? 'pointer-events-none opacity-25' : danger ? 'text-danger hover:bg-surface-card' : active ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:bg-surface-card hover:text-content'}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/** A route tool in the card's head: an icon with its words in the tooltip, dimmed while it has nothing to do. */
function RouteToolButton({
  label,
  disabled,
  onAct,
  testId,
  children,
}: {
  label: string;
  disabled: boolean;
  onAct: () => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        data-testid={testId}
        aria-label={label}
        disabled={disabled}
        onClick={onAct}
        className="grid h-6 w-6 flex-none place-items-center rounded-full text-content-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent enabled:hover:bg-surface-card enabled:hover:text-content disabled:cursor-default disabled:opacity-35"
      >
        {children}
      </button>
    </Tooltip>
  );
}

/** The quiet hint and first-use guidance before a route exists. */
function WaypointEmptyState() {
  const { t } = useTranslation();
  // Say "turn on" only when the tool is off; on the flat map it starts on and the hint then just says what to do.
  const placing = useTourPlaceToolStore((state) => state.placing[state.mode]);
  return (
    <div
      data-testid="tour-planner-empty-state"
      className="flex items-start gap-2 rounded-[12px] border border-dashed border-edge px-3 py-3 leading-snug text-content-muted"
      style={fs(12, 'body')}
    >
      <MapPin size={14} strokeWidth={2} className="mt-px flex-none text-content-faint" />
      <p className="m-0">{t(placing ? 'tours.planner.emptyHintPlacing' : 'tours.planner.emptyHint')}</p>
    </div>
  );
}

/** PLN-03: the kind of place a point was found as, its icon at the number's corner in its colour on the map. */
function PoiCornerIcon({ category }: { category: TourPoiCategory }) {
  const look = TOUR_POI_LOOKS[category];
  return (
    <span
      aria-hidden="true"
      data-waypoint-poi={category}
      className="absolute -bottom-1 -start-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[color:var(--bg-card)]"
      style={{ background: `color-mix(in srgb, ${look.color} 22%, var(--bg-card))`, color: look.color }}
    >
      <look.Icon size={9} strokeWidth={2.6} />
    </span>
  );
}

/** A city walk station's own marks on its number (CW-03, CW-10); none on any other point. */
type StationMarks = Pick<WaypointPoint, 'importance' | 'protected'> | null;

/**
 * What a waypoint's number says besides the number: the via ferrata it stands
 * at an end of, or else the kind of place it was found as along the tour (a
 * ferrata's end says more about the point, so it wins), and a station's
 * importance and protection.
 */
function numberNote(
  ferrata: TourWaypointFerrata | null,
  poiCategory: TourPoiCategory | null,
  station: StationMarks,
  t: Translate,
  stageNote?: string
): { note: string | null; poi: TourPoiCategory | null } {
  const marks = station ? stationMarkNote(station, t) : null;
  const join = (first: string | null) => [first, marks, stageNote].filter(Boolean).join(', ') || null;
  if (ferrata) return { note: join(t('tours.ferrata.waypointAtEnd', { name: ferrata.name })), poi: null };
  if (poiCategory) return { note: join(t(TOUR_POI_LOOKS[poiCategory].labelKey)), poi: poiCategory };
  return { note: join(null), poi: null };
}

/**
 * A waypoint's number, as the map pins show it. At the foot or the top of a via
 * ferrata it takes a violet ring and the ferrata's ladder at its corner, named
 * by the tooltip. A point taken in from the places along the tour (PLN-03)
 * carries that kind's icon at the same corner, in its colour on the map. A
 * city walk's station shows how much it matters as a ring around the number
 * and its protection as a shield at the top corner.
 */
function WaypointNumber({
  stop,
  selected,
  ferrata,
  poiCategory = null,
  station = null,
  loopEnd = false,
  shaping = false,
  stageNote,
  corner,
}: {
  /** The stop's number; shaping points do not count, as on the map. */
  stop: number;
  selected: boolean;
  ferrata: TourWaypointFerrata | null;
  /** PLN-03: the kind of place the point was found as along the tour. */
  poiCategory?: TourPoiCategory | null;
  /** CW-03, CW-10: a station's importance and protection, drawn on the number; only a city walk's points carry them. */
  station?: StationMarks;
  /** The way back to the start of a loop: shown as the return, not as one more stop. */
  loopEnd?: boolean;
  /** P2A-03: a shaping point, a small dot as on the map. */
  shaping?: boolean;
  /** MDT-01: the stage of a multi-day tour that ends at this stop, said with the number. */
  stageNote?: string;
  /** MDT-01: a mark at the number's corner, the moon where a stage ends. */
  corner?: ReactNode;
}) {
  const { t } = useTranslation();
  if (shaping) {
    return (
      <span
        aria-label={t('tours.planner.shapingPoint')}
        data-waypoint-shaping="true"
        className="grid h-7 w-7 flex-none place-items-center"
      >
        <span
          className={`h-3 w-3 rounded-full ring-2 ring-surface-card ${selected ? 'bg-accent' : 'bg-content-faint'}`}
        />
      </span>
    );
  }
  if (loopEnd) {
    return (
      <span
        aria-label={t('tours.planner.loopEnd')}
        data-waypoint-loop-end="true"
        className={`grid h-7 w-7 flex-none place-items-center rounded-full ${selected ? 'bg-accent text-accent-text' : 'bg-edge text-content'}`}
      >
        <Repeat size={13} strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  }
  const label = t('tours.planner.waypointLabel', { n: stop });
  const { note, poi } = numberNote(ferrata, poiCategory, station, t, stageNote);
  const number = (
    <span
      aria-label={[label, note].filter(Boolean).join(', ')}
      data-waypoint-number={stop}
      data-ferrata-end={ferrata ? 'true' : undefined}
      className={`relative grid h-7 w-7 flex-none place-items-center rounded-full font-geist font-semibold tabular-nums ${selected ? 'bg-accent text-accent-text' : 'bg-edge text-content'} ${ferrata ? 'ring-2 ring-inset ring-[color:var(--map-ferrata)]' : ''} ${stationRingClass(station?.importance)}`}
      style={fs(11.5)}
    >
      {stop}
      {ferrata && <FerrataGlyph size={22} className="absolute -bottom-2.5 -start-2.5" />}
      {poi && <PoiCornerIcon category={poi} />}
      {station?.protected && <StationShield />}
      {corner}
    </span>
  );
  if (!ferrata) return note ? <Tooltip label={note}>{number}</Tooltip> : number;
  const grade = ferrata.grade ? ` (${ferrata.grade})` : '';
  return <Tooltip label={`${t('tours.ferrata.waypointAtEnd', { name: ferrata.name })}${grade}`}>{number}</Tooltip>;
}

/**
 * What a waypoint row says: its place name with the coordinates under it, or
 * the coordinates alone while the name loads, offline or when the lookup has
 * none; start and end as a badge. The way back of a loop is named as such.
 */
function WaypointRowLabel({
  point,
  placeName,
  loopEnd,
  paddleRole,
  linked = false,
  station = false,
}: {
  point: TourPlannerController['waypoints'][number];
  placeName: string | undefined;
  loopEnd: boolean;
  /** On a paddle tour the badge names the point for the paddler: put-in, take-out, re-entry, final take-out. */
  paddleRole?: PaddleRole | null;
  /** PR1-10: the point stands for this place of the trip, named after it. */
  linked?: boolean;
  /** CW-01: a city walk's station, which shows its stay (its importance and protection are on its number). */
  station?: boolean;
}) {
  const { t } = useTranslation();
  const coordinates = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  const name = loopEnd ? t('tours.planner.loopEnd') : (point.name ?? placeName);
  return (
    <>
      <span className="flex w-full min-w-0 items-center gap-1.5">
        <span
          data-testid="tour-planner-waypoint-name"
          className={`block min-w-0 truncate leading-tight ${name ? 'font-semibold text-content' : 'font-geist tabular-nums text-content-muted'}`}
          style={fs(12.5, 'body')}
        >
          {name ?? coordinates}
        </span>
        {point.shaping ? (
          <Tooltip label={t('tours.planner.shapingHint')}>
            <span className="inline-flex">
              <SoftPill>{t('tours.planner.shapingPoint')}</SoftPill>
            </span>
          </Tooltip>
        ) : paddleRole !== undefined ? (
          paddleRole && !loopEnd && <PaddleRolePill role={paddleRole} />
        ) : (
          point.role !== 'via' && !loopEnd && <SoftPill>{t(ROLE_KEY[point.role])}</SoftPill>
        )}
        {point.auto && <AutoPointPill />}
      </span>
      {linked && !loopEnd ? (
        // A stop standing for a place of the trip says so where the coordinates would be (PR1-10).
        <Tooltip label={t('tours.placePicker.linkedHint')}>
          <span
            data-testid="tour-planner-waypoint-linked"
            className="flex min-w-0 items-center gap-1 leading-tight text-content-faint"
            style={fs(10.5)}
          >
            <MapPinned size={10} strokeWidth={2.2} className="flex-none" />
            <span className="min-w-0 truncate">{t('tours.placePicker.linked')}</span>
          </span>
        </Tooltip>
      ) : (
        name &&
        !loopEnd && (
          <span
            data-testid="tour-planner-waypoint-coordinates"
            className="block min-w-0 truncate font-geist tabular-nums leading-tight text-content-faint"
            style={fs(10.5)}
          >
            {coordinates}
          </span>
        )
      )}
      {/* Under the coordinates: a station's stay, the one mark of it that is not on its number. */}
      {station && !loopEnd && <StationPills point={point} />}
    </>
  );
}

/**
 * The controls of a waypoint row, out on hover as a plan row's are: a menu for
 * what is done now and then (move it up or down, draw the leg after it by
 * hand on a hike, carry the boat from here or mark a lock on a paddle tour)
 * and remove beside it. Two controls keep the place name readable in a narrow
 * rail however many tools a tour type adds.
 */
type MenuItems = Parameters<ReturnType<typeof useContextMenu>['open']>[1];
type Translate = ReturnType<typeof useTranslation>['t'];
type WaypointPoint = TourPlannerController['waypoints'][number];

/**
 * The tools for the leg after a point: drawn by hand or routed (on a paddle
 * tour: on the water), planned again (P2A-05), other ways for it compared on
 * a hike (RTE-02), and the point a stop or a shaping point (P2A-03; never the
 * first or the last). A ride (HOR-01) has none: no router plans any of its
 * legs, so there is nothing to switch. Nor has a ski tour's leg (SKI-02),
 * drawn straight until the piste router plans it; its points can still shape.
 */
function routeMenuItems(
  planner: TourPlannerController,
  point: WaypointPoint,
  index: number,
  lastIndex: number,
  t: Translate
): MenuItems {
  if (planner.isHorse) return [];
  const hasLeg = index < lastIndex;
  const free = point.fixedLeg?.kind === 'free';
  const routed = hasLeg && !point.fixedLeg && !planner.isSki;
  const items: MenuItems = [];
  if ((free || routed) && !planner.isSki) {
    const routeAgain = planner.isPaddle ? t('tours.paddle.routeOnWater') : t('tours.planner.routeLeg');
    items.push(
      { divider: true },
      {
        label: free ? routeAgain : t('tours.planner.freeLeg'),
        icon: free && planner.isPaddle ? Waves : Spline,
        onClick: () => planner.toggleWaypointFreeLeg(point.id),
      }
    );
  }
  if (routed)
    items.push({
      label: t('tours.planner.recomputeLeg'),
      icon: RefreshCw,
      onClick: () => planner.recomputeLeg(point.id),
    });
  // RTE-02: a hike's routed section offered other ways; dimmed while its route is still being planned.
  if (routed && planner.tourType === 'hike')
    items.push({
      label: t('tours.planner.compareLeg'),
      icon: Shuffle,
      disabled: !planner.legVariants.canCompare(point.id),
      onClick: () => planner.legVariants.compare(point.id),
    });
  if (index > 0 && index < lastIndex) {
    items.push({
      label: t(point.shaping ? 'tours.planner.makeStop' : 'tours.planner.makeShaping'),
      icon: Navigation,
      onClick: () => planner.setWaypointShaping(point.id, !point.shaping),
    });
  }
  return items;
}

/** RTE-03: round hikes out of this stop, of about a wished length. */
function roundMenuItems(planner: TourPlannerController, point: WaypointPoint, t: Translate): MenuItems {
  if (!planner.roundHikes.canStart(point.id)) return [];
  return [
    { divider: true },
    { label: t('tours.planner.roundHikeFrom'), icon: RefreshCcwDot, onClick: () => planner.roundHikes.open(point.id) },
  ];
}

/** A paddle tour's tools at a point: carry the boat from here, and a lock here. */
function paddleMenuItems(
  paddle: ReturnType<typeof usePaddleWaypointActions>,
  point: WaypointPoint,
  hasLeg: boolean,
  t: Translate
): MenuItems {
  const portage = point.fixedLeg?.kind === 'portage';
  const items: MenuItems = [{ divider: true }];
  // At the last point too: the portage starts here and reaches the point set next.
  items.push({
    label: t(
      !hasLeg && point.carryNext
        ? 'tours.paddle.portagePendingOff'
        : portage
          ? 'tours.paddle.portageOff'
          : 'tours.paddle.portageOn'
    ),
    icon: PortageIcon,
    onClick: () => paddle.togglePortage(point.id),
  });
  items.push({
    label: t(point.lock ? 'tours.paddle.lockRemove' : 'tours.paddle.lockAdd'),
    icon: LockIcon,
    onClick: () => paddle.setLock(point.id, point.lock ? null : { wait_minutes: null, transit_minutes: null }),
  });
  return items;
}

function WaypointRowActions({
  planner,
  point,
  index,
  lastIndex,
  selected,
  isSaving,
  onUnlink,
  stationName,
  menuOwner,
  onMenuOpen,
}: {
  planner: TourPlannerController;
  point: WaypointPoint;
  index: number;
  lastIndex: number;
  selected: boolean;
  isSaving: boolean;
  /** PR1-10: given for a point that stands for a place; the place itself stays. */
  onUnlink?: () => void;
  /** CW-01: the name the row shows, for a station without one of its own. */
  stationName?: string;
  /** The row whose menu is open; opening one row's menu closes the menu of any other. */
  menuOwner: string | null;
  onMenuOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const menu = useContextMenu();
  const menuOpen = !!menu.menu && menuOwner === point.id;
  const paddle = usePaddleWaypointActions(planner);
  const [stationOpen, setStationOpen] = useState(false);
  const station = planner.tourType === 'walk' && !point.shaping && !(planner.isLoop && index === lastIndex);
  const items: MenuItems = [
    ...(station
      ? [
          { label: t('tours.walk.station.edit'), icon: SquarePen, onClick: () => setStationOpen(true) },
          { divider: true } as const,
        ]
      : []),
    {
      label: t('tours.planner.moveUp'),
      icon: ArrowUp,
      disabled: index === 0,
      onClick: () => planner.moveWaypoint(point.id, -1),
    },
    {
      label: t('tours.planner.moveDown'),
      icon: ArrowDown,
      disabled: index === lastIndex,
      onClick: () => planner.moveWaypoint(point.id, 1),
    },
    ...routeMenuItems(planner, point, index, lastIndex, t),
    ...roundMenuItems(planner, point, t),
    ...stageMenuItems(planner.stages, point, t),
    ...(planner.isPaddle ? paddleMenuItems(paddle, point, index < lastIndex, t) : []),
    ...(onUnlink
      ? [{ divider: true } as const, { label: t('tours.placePicker.unlink'), icon: Unlink, onClick: onUnlink }]
      : []),
  ];
  return (
    <span
      className={`flex-none items-center gap-0.5 group-focus-within:flex group-hover:flex ${selected || menuOpen ? 'flex' : 'hidden'}`}
    >
      <WaypointAction
        label={t('tours.planner.moreActions')}
        disabled={isSaving}
        active={menuOpen}
        onAct={() => undefined}
        onPress={(event) => {
          if (menuOpen) {
            menu.close();
            return;
          }
          onMenuOpen(point.id);
          menu.open(event, items, true);
        }}
      >
        <MoreHorizontal size={14} strokeWidth={2.2} />
      </WaypointAction>
      <WaypointAction
        label={t('tours.planner.remove')}
        disabled={isSaving}
        danger
        onAct={() => planner.removeWaypoint(point.id)}
      >
        <Trash2 size={13} strokeWidth={2} />
      </WaypointAction>
      <ContextMenu menu={menuOpen ? menu.menu : null} onClose={menu.close} />
      {stationOpen && (
        <StationDialog
          point={point}
          fallbackName={stationName}
          onClose={() => setStationOpen(false)}
          onSave={(next) => {
            planner.editWaypoints((current) => current.map((item) => (item.id === next.id ? next : item)));
            setStationOpen(false);
          }}
        />
      )}
    </span>
  );
}

/**
 * The row under the last waypoint that turns on "set points" for the map the
 * planner shows, the same switch as the one in the map's layer pill; while it
 * is on, the row says where to click and a second click turns it off again.
 */
function AddPointRow({
  disabled,
  placesOpen,
  onTogglePlaces,
}: {
  disabled: boolean;
  /** PR1-10: whether the trip's places are unfolded to pick a stop from. */
  placesOpen: boolean;
  onTogglePlaces: () => void;
}) {
  const { t } = useTranslation();
  const active = useTourPlaceToolStore((state) => state.placing[state.mode]);
  // The look of the editor's segmented switches (Hike | Paddle tour): one quiet bar, two equal halves,
  // the one in use raised. Two ways in to one list, not two boxes competing for it.
  const look = (on: boolean) =>
    `inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[8px] px-3 py-1.5 font-medium transition-colors disabled:cursor-default disabled:opacity-40 ${on ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted enabled:hover:text-content'}`;
  return (
    <div className="mt-2 flex gap-0.5 rounded-[10px] bg-surface-tertiary p-[3px]">
      {/* One label in both states, so the halves never shift; the raised half and the tooltip say it is on. */}
      <Tooltip label={t('tours.planner.addPointActive')} placement="top" disabled={!active}>
        <button
          type="button"
          data-testid="tour-planner-add-point"
          aria-pressed={active}
          disabled={disabled}
          onClick={() => toggleTourPlacing()}
          className={look(active)}
          style={fs(12.5, 'body')}
        >
          <MapPinPlus size={14} strokeWidth={2} className={`flex-none ${active ? 'text-accent' : ''}`} />
          <span className="min-w-0 truncate">{t('tours.planner.addPoint')}</span>
        </button>
      </Tooltip>
      <button
        type="button"
        data-testid="tour-planner-add-place"
        aria-expanded={placesOpen}
        disabled={disabled}
        onClick={onTogglePlaces}
        className={look(placesOpen)}
        style={fs(12.5, 'body')}
      >
        <MapPinned size={14} strokeWidth={2} className="flex-none" />
        <span className="min-w-0 truncate">{t('tours.placePicker.open')}</span>
      </button>
    </div>
  );
}

/**
 * The ordered waypoints, each under its place name with its role as a badge,
 * reorderable by drag or by the arrow controls on each row. The coordinates
 * stand in for the name while it loads, offline, or when the lookup has none.
 */
/** P2A-03: how a shaping point is set, said once under the list while there is a route to click. */
function ShapeOnLineHint({ planner, canEdit }: { planner: TourPlannerController; canEdit: boolean }) {
  const { t } = useTranslation();
  if (!canEdit || planner.waypoints.length < 2) return null;
  return (
    <p className="m-0 mt-1.5 px-1.5 text-content-faint" style={fs(11, 'body')}>
      {t('tours.planner.shapeOnLine')}
    </p>
  );
}

/**
 * The route tools in the card head: reverse, plan the drawn legs on the water
 * (PAD-11), back to the start, and on a hike round hikes out of the start (RTE-03).
 */
function WaypointListTools({ planner, isSaving }: { planner: TourPlannerController; isSaving: boolean }) {
  const { t } = useTranslation();
  const hasDrawnLegs = planner.isPaddle && planner.waypoints.some((point) => point.fixedLeg?.kind === 'free');
  const start = planner.waypoints[0];
  return (
    <span className="flex flex-none items-center gap-0.5">
      <RouteToolButton
        testId="tour-planner-reverse"
        label={t('tours.planner.reverse')}
        disabled={isSaving || planner.waypoints.length < 2}
        onAct={planner.reverse}
      >
        <ArrowDownUp size={13} strokeWidth={2.2} />
      </RouteToolButton>
      {hasDrawnLegs && (
        <RouteToolButton
          testId="tour-planner-route-on-water"
          label={t('tours.paddle.routeAllOnWater')}
          disabled={isSaving}
          onAct={planner.routeDrawnLegsOnWater}
        >
          <Waves size={13} strokeWidth={2.2} />
        </RouteToolButton>
      )}
      <RouteToolButton
        testId="tour-planner-return-to-start"
        label={t(planner.isLoop ? 'tours.planner.alreadyLoop' : 'tours.planner.returnToStart')}
        disabled={isSaving || planner.waypoints.length < 2 || planner.isLoop}
        onAct={planner.returnToStart}
      >
        <Repeat size={13} strokeWidth={2.2} />
      </RouteToolButton>
      {planner.tourType === 'hike' && start && (
        <RouteToolButton
          testId="tour-planner-round-hike"
          label={t('tours.planner.roundHike')}
          disabled={isSaving || !planner.roundHikes.canStart(start.id)}
          onAct={() => planner.roundHikes.open(start.id)}
        >
          <RefreshCcwDot size={13} strokeWidth={2.2} />
        </RouteToolButton>
      )}
    </span>
  );
}

export default function TourWaypointList({
  planner,
  canEdit,
  isSaving,
  tourPlaceIds = NO_TOUR_PLACES,
}: {
  planner: TourPlannerController;
  canEdit: boolean;
  isSaving: boolean;
  /** The trip's tours, which are never offered as a stop (PR1-10). */
  tourPlaceIds?: ReadonlySet<number>;
}) {
  const { t } = useTranslation();
  const tripPlaces = useTripPlaceWaypoints(planner, tourPlaceIds);
  // CW-02, CW-04: the arrivals and opening hours of a city walk on one of its days; hints only, nothing saved.
  const walk = usePlannerWalkSchedule(planner, tripPlaces.linkedPlaceOf);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [menuOwner, setMenuOwner] = useState<string | null>(null);
  const addRows = canEdit && (
    <>
      <AddPointRow disabled={isSaving} placesOpen={placesOpen} onTogglePlaces={() => setPlacesOpen((open) => !open)} />
      {placesOpen && !isSaving && <TripPlacePicker picker={tripPlaces} onClose={() => setPlacesOpen(false)} />}
    </>
  );
  const [draggedWaypointId, setDraggedWaypointId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const placeNames = useWaypointPlaceNames(planner.waypoints);
  const ferrataEnds = useTourFerrataCrossingStore((state) => state.waypoints);
  const crossings = useTourFerrataCrossingStore((state) => state.crossings);
  const legCrossings = new Map<string, TourFerrataCrossing[]>();
  for (const crossing of crossings) {
    if (!crossing.afterWaypoint) continue;
    legCrossings.set(crossing.afterWaypoint, [...(legCrossings.get(crossing.afterWaypoint) ?? []), crossing]);
  }
  const lastIndex = planner.waypoints.length - 1;
  const movable = canEdit && !isSaving;
  const paddleRoles = planner.isPaddle ? paddleRolesById(planner.waypoints) : null;
  // A hike keeps its start and end badges (undefined); a paddle tour names each point for the paddler.
  const paddleRoleOf = (id: string) => (paddleRoles ? (paddleRoles.get(id) ?? null) : undefined);
  const paddleLayout = planner.isPaddle ? paddleLayoutOfPoints(paddlePlanPoints(planner.waypoints)) : null;
  // PAD-03: portages the paddler sets follow the ways on land.
  const portageRouting = usePortageRouting(planner, canEdit && !isSaving);
  // The router's answer per leg, while it still belongs to these points (PAD-11).
  const routedLegs = planner.isPaddle && planner.routeCurrent ? planner.paddleRoute : null;
  // PAD-11C: where a leg lacks the water data of its region, TREK fetches it and plans the leg again.
  const regionLoad = usePaddleRegionLoad(routedLegs?.failures, planner.retry);
  const stopNumbers = stopNumbersOf(planner.waypoints);
  // MDT-01: a multi-day tour's stages, each headed where it begins; the stop that ends one carries its number.
  const stageStarts = new Map(planner.stages.stages.map((stage) => [stage.from, stage]));
  const stageEnds = new Map(planner.stages.stages.slice(0, -1).map((stage) => [stage.toId, stage.number]));
  const stageHead = (index: number) => {
    const stage = stageStarts.get(index);
    return stage ? <StageDivider stage={stage} /> : null;
  };
  // A row's name: the trip place it stands for, else the name looked up for its spot.
  const placeNameOf = (point: WaypointPoint, linked: ReturnType<typeof tripPlaces.linkedPlaceOf>) =>
    linked?.name ?? placeNames[point.id];
  const ferrataOf = (point: WaypointPoint) => ferrataEnds[point.id] ?? null;
  const stageMarkOf = (stage: number | undefined) =>
    stage ? { stageNote: t('tours.stages.endOf', { number: stage }), corner: <StageEndCorner /> } : {};
  const endDrag = () => {
    setDraggedWaypointId(null);
    setDropTarget(null);
  };

  // One card like a day in the plan: the head counts the points, the rows sit below.
  const tools = canEdit && planner.waypoints.length > 0 && <WaypointListTools planner={planner} isSaving={isSaving} />;
  // The way back of a loop is no stop of its own, and a shaping point no stop at all, so the count leaves them out.
  const stops = stopNumbers.size - (planner.isLoop ? 1 : 0);
  const card = (children: ReactNode) => (
    <RailCard
      icon={<MapPin size={14} strokeWidth={2} />}
      title={t('tours.planner.waypoints')}
      foldId="waypoints"
      aside={
        planner.waypoints.length > 0 && (
          <span className="flex flex-none items-center gap-1.5">
            {tools}
            <span className="flex-none tabular-nums text-content-faint" style={fs(11.5, 'body')}>
              {stops}
            </span>
          </span>
        )
      }
    >
      {children}
    </RailCard>
  );

  if (planner.waypoints.length === 0) {
    return card(
      <>
        <WaypointEmptyState />
        {addRows}
      </>
    );
  }

  return card(
    <>
      <WalkDayLine {...walk} className="mb-2" />
      <ol data-touch-drag className="m-0 -mx-1.5 flex list-none flex-col gap-px p-0">
        {planner.waypoints.map((point, index) => {
          const selected = planner.selectedWaypointId === point.id;
          const isDropTarget = dropTarget?.id === point.id && draggedWaypointId !== point.id;
          const loopEnd = planner.isLoop && index === lastIndex;
          const linkedPlace = tripPlaces.linkedPlaceOf(point);
          const placeName = placeNameOf(point, linkedPlace);
          const stop = stopNumbers.get(point.id) ?? index + 1;
          return (
            <Fragment key={point.id}>
              {index === 0 && stageHead(0)}
              <li
                data-testid="tour-planner-waypoint-row"
                onDragStart={(event) => {
                  if (!movable) {
                    event.preventDefault();
                    return;
                  }
                  if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', point.id);
                  }
                  setDraggedWaypointId(point.id);
                  setDropTarget(null);
                }}
                onDragOver={(event) => {
                  if (!movable || !draggedWaypointId || draggedWaypointId === point.id) return;
                  event.preventDefault();
                  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const placement = event.clientY >= bounds.top + bounds.height / 2 ? 'after' : 'before';
                  setDropTarget((current) =>
                    current?.id === point.id && current.placement === placement ? current : { id: point.id, placement }
                  );
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedId = draggedWaypointId || event.dataTransfer.getData('text/plain');
                  if (movable && draggedId && draggedId !== point.id && dropTarget?.id === point.id) {
                    planner.reorderWaypoint(draggedId, point.id, dropTarget.placement);
                  }
                  endDrag();
                }}
                onDragEnd={endDrag}
                className={`relative rounded-[10px] ${draggedWaypointId === point.id ? 'opacity-45' : ''} ${isDropTarget ? 'bg-surface-hover' : ''}`}
              >
                {isDropTarget && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-x-2 z-10 h-0.5 rounded bg-accent ${dropTarget.placement === 'before' ? 'top-0' : 'bottom-0'}`}
                  />
                )}
                <div
                  className={`group flex w-full items-center gap-2 rounded-[10px] px-1.5 py-1.5 transition-colors ${selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'}`}
                >
                  {/* Out on hover, as a plan row's controls are; the row keeps its place for it. */}
                  <span
                    draggable={movable}
                    aria-hidden="true"
                    data-testid="tour-planner-waypoint-drag-handle"
                    className={`grid h-6 w-4 flex-none place-items-center text-content-faint transition-opacity ${movable ? 'cursor-grab opacity-0 active:cursor-grabbing group-focus-within:opacity-100 group-hover:opacity-100' : 'opacity-0'}`}
                  >
                    <GripVertical size={14} strokeWidth={1.8} />
                  </span>
                  <WaypointNumber
                    stop={stop}
                    selected={selected}
                    ferrata={ferrataOf(point)}
                    poiCategory={point.poiCategory ?? null}
                    station={point}
                    loopEnd={loopEnd}
                    shaping={!!point.shaping}
                    {...stageMarkOf(stageEnds.get(point.id))}
                  />
                  <button
                    type="button"
                    onClick={() => planner.setSelectedWaypointId(point.id)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]"
                    aria-current={selected ? 'true' : undefined}
                  >
                    <WaypointRowLabel
                      point={point}
                      placeName={placeName}
                      loopEnd={loopEnd}
                      paddleRole={paddleRoleOf(point.id)}
                      linked={!!linkedPlace}
                      station={planner.tourType === 'walk' && !point.shaping}
                    />
                  </button>
                  {canEdit && (
                    <WaypointRowActions
                      planner={planner}
                      point={point}
                      index={index}
                      lastIndex={lastIndex}
                      selected={selected}
                      isSaving={isSaving}
                      onUnlink={point.linkedPlaceId ? () => tripPlaces.unlink(point.id) : undefined}
                      stationName={placeName}
                      menuOwner={menuOwner}
                      onMenuOpen={setMenuOwner}
                    />
                  )}
                </div>
                <StationScheduleRow schedule={walk.schedule} point={point} placeName={placeName} number={stop} />
              </li>
              {index > 0 && stageHead(index)}
              <WaypointLegRows
                planner={planner}
                point={point}
                index={index}
                crossings={legCrossings.get(point.id)}
                routedLegs={routedLegs}
                paddleLayout={paddleLayout}
                editable={canEdit && !isSaving}
                portageRouting={portageRouting}
                regionLoad={regionLoad}
              />
            </Fragment>
          );
        })}
      </ol>
      {addRows}
      <ShapeOnLineHint planner={planner} canEdit={canEdit} />
    </>
  );
}
