import type { HorseRoute } from '@trek/shared';
import { useMemo, useState } from 'react';
import { randomId } from '../../../utils/randomId';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { preferReversed, SECTION_JOINS_M, sectionGapM, sectionLeg, withSectionAppended } from './horseSection';

type PickPlanner = Pick<TourPlannerController, 'waypoints' | 'editWaypoints' | 'isSaving' | 'canEdit'>;

/**
 * HOR-01: one route's sections in the dialog that takes one onto the ride:
 * which section, in which direction, and whether a gap before it may be drawn
 * by hand. Nothing changes until `adopt`, and then in one step of the
 * planner's history, so one undo takes the whole section back. A gap is never
 * closed unless the rider switched that on for this section and direction.
 */
export function useHorseSectionPick(planner: PickPlanner, route: HorseRoute, onDone: () => void) {
  const [chosen, setChosen] = useState(route.sections[0]?.number ?? 1);
  const [direction, setDirection] = useState<boolean | null>(null);
  const [joinGap, setJoinGap] = useState(false);
  const section = route.sections.find((candidate) => candidate.number === chosen) ?? route.sections[0];
  const reversed = direction ?? (section ? preferReversed(planner.waypoints, section) : false);
  // One leg per choice, so the map in the dialog draws again only when the choice changes.
  const leg = useMemo(() => (section ? sectionLeg(route, section, reversed) : null), [reversed, route, section]);
  const gapM = leg ? sectionGapM(planner.waypoints, leg) : null;
  const gapOpen = gapM !== null && gapM > SECTION_JOINS_M;
  const canAdopt = leg !== null && planner.canEdit && !planner.isSaving && (!gapOpen || joinGap);

  const pick = (number: number) => {
    setChosen(number);
    setDirection(null);
    setJoinGap(false);
  };
  const turn = (next: boolean) => {
    setDirection(next);
    setJoinGap(false);
  };
  const adopt = () => {
    if (!canAdopt || !leg) return;
    planner.editWaypoints((points) => withSectionAppended(points, leg, randomId));
    onDone();
  };

  return {
    section,
    reversed,
    leg,
    gapM,
    gapOpen,
    joinGap,
    canAdopt,
    pick,
    turn,
    toggleJoinGap: () => setJoinGap((on) => !on),
    adopt,
  };
}

export type HorseSectionPick = ReturnType<typeof useHorseSectionPick>;
