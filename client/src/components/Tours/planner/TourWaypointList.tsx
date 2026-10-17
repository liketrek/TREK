import { paddleLayoutOfPoints, type PaddleLayout, type PaddleRole, type TourFixedLeg } from '@trek/shared';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  GripVertical,
  Info,
  MapPin,
  MapPinPlus,
  MoreHorizontal,
  Repeat,
  Spline,
  Trash2,
} from 'lucide-react';
import { Fragment, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  useTourFerrataCrossingStore,
  type TourFerrataCrossing,
  type TourWaypointFerrata,
} from '../../../store/tourFerrataCrossingStore';
import { toggleTourPlacing, useTourPlaceToolStore } from '../../../store/tourPlaceToolStore';
import { formatDistance } from '../../../utils/units';
import { FerrataGlyph } from '../../Ferratas/FerrataGlyph';
import { SoftPill } from '../../Planner/planParts';
import { ContextMenu, useContextMenu } from '../../shared/ContextMenu';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { LockIcon, PortageIcon } from '../paddle/PaddleGlyph';
import { LockRow, PaddleRolePill, PortageLegRow } from '../paddle/PaddleWaypointParts';
import { usePaddleWaypointActions } from '../paddle/usePaddleWaypointActions';
import { RailCard, TourNotice } from '../tourParts';
import { paddlePlanPoints, paddleRolesById } from './paddlePlanOf';
import { lineLengthM } from './tourFixedLegs';
import type { TourPlannerController } from './useTourPlanner';
import { useWaypointPlaceNames } from './useWaypointPlaceNames';

type DropTarget = { id: string; placement: 'before' | 'after' };

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

/**
 * A leg drawn by hand, as a badge on that leg in the dashed look the map draws
 * it in: no router planned it, and the badge says so. Its length is the line
 * the user drew, the only measure it has.
 */
function FreeLegRow({ leg }: { leg: TourFixedLeg }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  // Read as plain numbers: this workspace compiles without strict mode, where the schema's tuples are "maybe two".
  const line = leg.geometry.map(([lat, lng]): [number, number] => [Number(lat), Number(lng)]);
  const distance = formatDistance(lineLengthM(line) / 1000, unit ?? 'metric');
  return (
    <li data-testid="tour-planner-free-leg" className="flex min-w-0 py-0.5 ps-[34px]">
      <Tooltip label={t('tours.planner.freeLegInfo')}>
        <span className="flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-full border border-dashed border-edge bg-surface-card pe-1 ps-2">
          <Spline size={13} strokeWidth={2} className="flex-none text-content-muted" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
            {t('tours.planner.freeLegBadge')}
          </span>
          <span
            className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary"
            style={fs(10.5)}
          >
            {distance}
          </span>
        </span>
      </Tooltip>
    </li>
  );
}

/** The quiet hint and first-use guidance before a route exists. */
function WaypointEmptyState() {
  const { t } = useTranslation();
  return (
    <div
      data-testid="tour-planner-empty-state"
      className="flex items-start gap-2 rounded-[12px] border border-dashed border-edge px-3 py-3 leading-snug text-content-muted"
      style={fs(12, 'body')}
    >
      <MapPin size={14} strokeWidth={2} className="mt-px flex-none text-content-faint" />
      <p className="m-0">{t('tours.planner.emptyHint')}</p>
    </div>
  );
}

/**
 * A via ferrata the route climbs between two waypoints, as a badge on that leg:
 * the ladder, its name, and its grade and length as chips inside, in the
 * ferrata violet the map draws it in.
 */
function FerrataLegRow({ crossing }: { crossing: TourFerrataCrossing }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  const length = formatDistance((crossing.toM - crossing.fromM) / 1000, unit ?? 'metric');
  return (
    <li
      data-testid="tour-planner-ferrata-leg"
      aria-label={t('tours.ferrata.crossingInfo', { length, name: crossing.name })}
      className="flex min-w-0 py-0.5 ps-[34px]"
    >
      <span className="flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-full bg-surface-card pe-1 ps-1 shadow-sm ring-1 ring-inset ring-[color:var(--map-ferrata)]">
        <FerrataGlyph size={18} className="flex-none" />
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
          {crossing.name}
        </span>
        {crossing.grade && (
          <span
            className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist font-semibold leading-[18px] text-content-secondary"
            style={fs(10.5)}
          >
            {crossing.grade}
          </span>
        )}
        <span
          className="flex-none rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums leading-[18px] text-content-secondary"
          style={fs(10.5)}
        >
          {length}
        </span>
      </span>
    </li>
  );
}

/**
 * A waypoint's number, as the map pins show it. At the foot or the top of a via
 * ferrata it takes a violet ring and the ferrata's ladder at its corner, named
 * by the tooltip.
 */
function WaypointNumber({
  index,
  selected,
  ferrata,
  loopEnd = false,
}: {
  index: number;
  selected: boolean;
  ferrata: TourWaypointFerrata | null;
  /** The way back to the start of a loop: shown as the return, not as one more stop. */
  loopEnd?: boolean;
}) {
  const { t } = useTranslation();
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
  const label = t('tours.planner.waypointLabel', { n: index + 1 });
  const number = (
    <span
      aria-label={ferrata ? `${label}, ${t('tours.ferrata.waypointAtEnd', { name: ferrata.name })}` : label}
      data-waypoint-number={index + 1}
      data-ferrata-end={ferrata ? 'true' : undefined}
      className={`relative grid h-7 w-7 flex-none place-items-center rounded-full font-geist font-semibold tabular-nums ${selected ? 'bg-accent text-accent-text' : 'bg-edge text-content'} ${ferrata ? 'ring-2 ring-inset ring-[color:var(--map-ferrata)]' : ''}`}
      style={fs(11.5)}
    >
      {index + 1}
      {ferrata && <FerrataGlyph size={22} className="absolute -bottom-2.5 -start-2.5" />}
    </span>
  );
  if (!ferrata) return number;
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
}: {
  point: TourPlannerController['waypoints'][number];
  placeName: string | undefined;
  loopEnd: boolean;
  /** On a paddle tour the badge names the point for the paddler: put-in, take-out, re-entry, final take-out. */
  paddleRole?: PaddleRole | null;
}) {
  const { t } = useTranslation();
  const coordinates = `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  const name = loopEnd ? t('tours.planner.loopEnd') : placeName;
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
        {paddleRole !== undefined
          ? paddleRole && !loopEnd && <PaddleRolePill role={paddleRole} />
          : point.role !== 'via' && !loopEnd && <SoftPill>{t(ROLE_KEY[point.role])}</SoftPill>}
      </span>
      {name && !loopEnd && (
        <span
          data-testid="tour-planner-waypoint-coordinates"
          className="block min-w-0 truncate font-geist tabular-nums leading-tight text-content-faint"
          style={fs(10.5)}
        >
          {coordinates}
        </span>
      )}
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
function WaypointRowActions({
  planner,
  point,
  index,
  lastIndex,
  selected,
  isSaving,
}: {
  planner: TourPlannerController;
  point: TourPlannerController['waypoints'][number];
  index: number;
  lastIndex: number;
  selected: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const menu = useContextMenu();
  const paddle = usePaddleWaypointActions(planner);
  const free = point.fixedLeg?.kind === 'free';
  const portage = point.fixedLeg?.kind === 'portage';
  const hasLeg = index < lastIndex;
  const items = [
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
    ...(!planner.isPaddle && hasLeg && point.fixedLeg?.kind !== 'ferrata'
      ? [
          { divider: true },
          {
            label: t(free ? 'tours.planner.routeLeg' : 'tours.planner.freeLeg'),
            icon: Spline,
            onClick: () => planner.toggleWaypointFreeLeg(point.id),
          },
        ]
      : []),
    ...(planner.isPaddle
      ? [
          { divider: true },
          ...(hasLeg
            ? [
                {
                  label: t(portage ? 'tours.paddle.portageOff' : 'tours.paddle.portageOn'),
                  icon: PortageIcon,
                  onClick: () => paddle.togglePortage(point.id),
                },
              ]
            : []),
          {
            label: t(point.lock ? 'tours.paddle.lockRemove' : 'tours.paddle.lockAdd'),
            icon: LockIcon,
            onClick: () => paddle.setLock(point.id, point.lock ? null : { wait_minutes: null, transit_minutes: null }),
          },
        ]
      : []),
  ];
  return (
    <span
      className={`flex-none items-center gap-0.5 group-focus-within:flex group-hover:flex ${selected || menu.menu ? 'flex' : 'hidden'}`}
    >
      <WaypointAction
        label={t('tours.planner.moreActions')}
        disabled={isSaving}
        active={!!menu.menu}
        onAct={() => undefined}
        onPress={(event) => (menu.menu ? menu.close() : menu.open(event, items, true))}
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
      <ContextMenu menu={menu.menu} onClose={menu.close} />
    </span>
  );
}

/**
 * What a paddle tour shows under a waypoint: the portage that starts there,
 * and the lock at it with its times.
 */
function PaddleRowExtras({
  planner,
  point,
  index,
  layout,
  editable,
}: {
  planner: TourPlannerController;
  point: TourPlannerController['waypoints'][number];
  index: number;
  layout: PaddleLayout;
  editable: boolean;
}) {
  const paddle = usePaddleWaypointActions(planner);
  const portage = layout.stretches.find((stretch) => stretch.kind === 'portage' && stretch.startIndex === index);
  const lock = point.lock ? layout.locks.find((stop) => stop.index === index) : undefined;
  return (
    <>
      {portage && (
        <PortageLegRow
          lengthM={portage.toM - portage.fromM}
          extraMinutes={portage.extraMinutes}
          disabled={!editable}
          onExtraChange={(minutes) => paddle.setPortageExtra(point.id, minutes)}
        />
      )}
      {point.lock && (
        <LockRow
          lock={point.lock}
          bypassed={!!lock?.bypassed}
          disabled={!editable}
          onChange={(next) => paddle.setLock(point.id, next)}
        />
      )}
    </>
  );
}

/**
 * The row under the last waypoint that turns on "set points" for the map the
 * planner shows, the same switch as the one in the map's layer pill; while it
 * is on, the row says where to click and a second click turns it off again.
 */
function AddPointRow({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation();
  const active = useTourPlaceToolStore((state) => state.placing[state.mode]);
  return (
    <button
      type="button"
      data-testid="tour-planner-add-point"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => toggleTourPlacing()}
      className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed px-3 py-2.5 font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${active ? 'border-accent bg-surface-card text-content' : 'border-edge text-content-muted enabled:hover:border-content-faint enabled:hover:text-content'}`}
      style={fs(12, 'body')}
    >
      <MapPinPlus size={14} strokeWidth={2} className="flex-none" />
      <span className="min-w-0 truncate">{t(active ? 'tours.planner.addPointActive' : 'tours.planner.addPoint')}</span>
    </button>
  );
}

/**
 * The ordered waypoints, each under its place name with its role as a badge,
 * reorderable by drag or by the arrow controls on each row. The coordinates
 * stand in for the name while it loads, offline, or when the lookup has none.
 */
export default function TourWaypointList({
  planner,
  canEdit,
  isSaving,
}: {
  planner: TourPlannerController;
  canEdit: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
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
  const endDrag = () => {
    setDraggedWaypointId(null);
    setDropTarget(null);
  };

  // One card like a day in the plan: the head counts the points, the rows sit below.
  const tools = canEdit && planner.waypoints.length > 0 && (
    <span className="flex flex-none items-center gap-0.5">
      <RouteToolButton
        testId="tour-planner-reverse"
        label={t('tours.planner.reverse')}
        disabled={isSaving || planner.waypoints.length < 2}
        onAct={planner.reverse}
      >
        <ArrowDownUp size={13} strokeWidth={2.2} />
      </RouteToolButton>
      <RouteToolButton
        testId="tour-planner-return-to-start"
        label={t(planner.isLoop ? 'tours.planner.alreadyLoop' : 'tours.planner.returnToStart')}
        disabled={isSaving || planner.waypoints.length < 2 || planner.isLoop}
        onAct={planner.returnToStart}
      >
        <Repeat size={13} strokeWidth={2.2} />
      </RouteToolButton>
    </span>
  );
  // The way back of a loop is no stop of its own, so the count leaves it out.
  const stops = planner.waypoints.length - (planner.isLoop ? 1 : 0);
  const card = (children: ReactNode) => (
    <RailCard
      icon={<MapPin size={14} strokeWidth={2} />}
      title={t('tours.planner.waypoints')}
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
        {canEdit && <AddPointRow disabled={isSaving} />}
      </>
    );
  }

  return card(
    <>
      <ol data-touch-drag className="m-0 -mx-1.5 flex list-none flex-col gap-px p-0">
        {planner.waypoints.map((point, index) => {
          const selected = planner.selectedWaypointId === point.id;
          const isDropTarget = dropTarget?.id === point.id && draggedWaypointId !== point.id;
          const loopEnd = planner.isLoop && index === lastIndex;
          return (
            <Fragment key={point.id}>
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
                    index={index}
                    selected={selected}
                    ferrata={ferrataEnds[point.id] ?? null}
                    loopEnd={loopEnd}
                  />
                  <button
                    type="button"
                    onClick={() => planner.setSelectedWaypointId(point.id)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-start outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]"
                    aria-current={selected ? 'true' : undefined}
                  >
                    <WaypointRowLabel
                      point={point}
                      placeName={placeNames[point.id]}
                      loopEnd={loopEnd}
                      paddleRole={paddleRoleOf(point.id)}
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
                    />
                  )}
                </div>
              </li>
              {(legCrossings.get(point.id) ?? []).map((crossing) => (
                <FerrataLegRow key={`${crossing.id}-${crossing.fromM}`} crossing={crossing} />
              ))}
              {/* A paddle tour is drawn by hand throughout; the notice says it once instead of on every leg. */}
              {point.fixedLeg?.kind === 'free' && !planner.isPaddle && <FreeLegRow leg={point.fixedLeg} />}
              {paddleLayout && (
                <PaddleRowExtras
                  planner={planner}
                  point={point}
                  index={index}
                  layout={paddleLayout}
                  editable={canEdit && !isSaving}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
      {canEdit && <AddPointRow disabled={isSaving} />}
      {planner.isPaddle && (
        <div className="mt-2">
          <TourNotice icon={<Info size={13} strokeWidth={2} />}>{t('tours.paddle.drawnByHand')}</TourNotice>
        </div>
      )}
    </>
  );
}
