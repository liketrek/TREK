import { useMemo } from 'react';
import type { useOutsidePressGuard } from '../../components/Ferratas/useOutsidePressGuard';
import { paddleRolesById } from '../../components/Tours/planner/paddlePlanOf';
import { isClosedLoop } from '../../components/Tours/planner/tourRouteActions';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { useWaypointPlaceNames } from '../../components/Tours/planner/useWaypointPlaceNames';
import { useTranslation } from '../../i18n';
import { usePlacedPointHint } from './usePlacedPointHint';
import { useTourMapPlacing, type TourMapMode } from './useTourMapPlacing';

const NO_POINTS: never[] = [];
const ROLE_KEY = {
  start: 'tours.planner.start',
  via: 'tours.planner.via',
  end: 'tours.planner.end',
} as const;

type PointsPlanner = Pick<
  TourPlannerController,
  | 'mode'
  | 'isSaving'
  | 'waypoints'
  | 'selectedWaypointId'
  | 'setSelectedWaypointId'
  | 'setWaypointPosition'
  | 'addWaypoint'
  | 'undo'
  | 'maxHikingDifficulty'
  | 'isPaddle'
>;

interface Options {
  tourPlanner: PointsPlanner;
  canPlaceEdit: boolean;
  mode: TourMapMode;
  /** A card is open over the map (a via ferrata's, a paddle obstacle's): the "point set" hint gives way to it. */
  cardOpen: boolean;
  /** Drops the click that closed such a card. */
  guard: ReturnType<typeof useOutsidePressGuard>['guard'];
  /** Control points of an editable version previewed over an import: shown, never moved. */
  previewPoints?: readonly { lat: number; lng: number }[] | null;
}

/**
 * The tour's control points on the planner map, for either mode: what the map
 * shows and may change, the "set points" tool, and the hint with its undo
 * after a point went in. A click places a point only while the tool is on,
 * only when it was a click and not a drag, and never when it closed a card.
 */
export function useTourMapPoints({ tourPlanner, canPlaceEdit, mode, cardOpen, guard, previewPoints }: Options) {
  const { t } = useTranslation();
  const editing = tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved';
  // The same lookup as the waypoint list, so a pin is named on hover as its row is.
  const placeNames = useWaypointPlaceNames(editing ? tourPlanner.waypoints : NO_POINTS);
  const canEditRoute = canPlaceEdit && !tourPlanner.isSaving && editing;
  const { active, toggle, gate, attach } = useTourMapPlacing(mode);
  const placeOn = canEditRoute && active;
  const placedHint = usePlacedPointHint({
    waypoints: tourPlanner.waypoints,
    difficulty: tourPlanner.maxHikingDifficulty,
    undo: tourPlanner.undo,
    enabled: editing && !cardOpen,
  });
  const { notePlacement } = placedHint;
  const { addWaypoint } = tourPlanner;
  const addPoint = (lat: number, lng: number) => {
    notePlacement();
    addWaypoint(lat, lng);
  };
  const onAdd = guard(gate(placeOn ? addPoint : undefined));
  // Kept by identity while nothing about the points changed, so the map does not redraw its pins on every render.
  const { waypoints, isPaddle } = tourPlanner;
  const points = useMemo(() => {
    if (editing) {
      // The way back of a loop lies on the start; one pin stands for both, and moving it moves both.
      const shown = isClosedLoop(waypoints) ? waypoints.slice(0, -1) : waypoints;
      // A paddle tour names a pin for the paddler (put-in, take-out, re-entry) and says where a lock is.
      const roles = isPaddle ? paddleRolesById(waypoints) : null;
      return shown.map((point, index) => {
        const role = roles?.get(point.id);
        const detail = role ? t(`tours.paddle.role.${role}`) : roles ? '' : t(ROLE_KEY[point.role]);
        const lock = point.lock ? t('tours.paddle.lock') : '';
        return {
          ...point,
          name: placeNames[point.id] ?? t('tours.planner.waypointLabel', { n: index + 1 }),
          detail: [detail, lock].filter(Boolean).join(', ') || t(ROLE_KEY[point.role]),
        };
      });
    }
    if (!previewPoints?.length) return NO_POINTS;
    const last = previewPoints.length - 1;
    return previewPoints.map((point, index) => {
      const role = index === 0 ? 'start' : index === last ? 'end' : 'via';
      return {
        id: `preview-${index}`,
        lat: point.lat,
        lng: point.lng,
        role,
        name: t('tours.planner.waypointLabel', { n: index + 1 }),
        detail: t(ROLE_KEY[role]),
      } as const;
    });
  }, [editing, isPaddle, waypoints, placeNames, previewPoints, t]);

  return {
    waypoints: {
      points,
      selectedId: editing ? tourPlanner.selectedWaypointId : null,
      onSelect: tourPlanner.setSelectedWaypointId,
      onMove: canEditRoute ? tourPlanner.setWaypointPosition : undefined,
      onAdd,
    },
    /** The switch for the layer pill, there only while the tour can be edited. */
    placeTool: canEditRoute ? { active, onToggle: toggle } : undefined,
    placeOn,
    /** Goes on the element around the map, where the presses are followed. */
    attachSurface: attach,
    placedHint,
  };
}
