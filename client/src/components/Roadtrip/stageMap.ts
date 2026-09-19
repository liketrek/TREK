import { dayColor } from './dayColors'
import type { AccessSpur, RoadtripDay, RoadtripRoutes } from '@trek/shared/roadtrip'

/**
 * What the map draws for ONE stage of a drive.
 *
 * The rail hides a folded day by filtering the whole trip's lines; a phone shows one
 * day and hides the rest, which is the same filter read from the other end. Rather
 * than a second `collapsedRoadtripDays` set built backwards from the selection (a
 * set that would then have to be kept out of the desktop's own folding), the
 * selection picks its lines here, and the untouched whole-trip arrays stay available
 * for the "all days" view.
 *
 * `lineDays` runs parallel to `lines`, so both are filtered in one pass and the
 * colours stay lined up with what is left. Same rule the desktop follows.
 */
export interface StageMapData {
  lines: [number, number][][]
  lineColors: { line: string; casing: string }[] | undefined
  accessLines: AccessSpur[]
  /** Place ids on this stage, for the marker filter. Empty means "no filter". */
  placeIds: Set<number>
  focusPoints: [number, number][]
}

const EMPTY: StageMapData = {
  lines: [],
  lineColors: undefined,
  accessLines: [],
  placeIds: new Set(),
  focusPoints: [],
}

export function stageMapData(
  routes: RoadtripRoutes,
  stage: RoadtripDay | null,
  dayColorsOn: boolean,
): StageMapData {
  // No stage selected is the "whole drive" view, which is every line in its own
  // colour, the best overview the addon has on a phone, and it costs nothing
  // because the routing round has already produced all of it.
  if (!stage) {
    return {
      lines: routes.lines,
      lineColors: dayColorsOn ? routes.lineDays.map(n => dayColor(n)) : undefined,
      accessLines: routes.accessLines,
      placeIds: new Set(),
      focusPoints: [],
    }
  }
  if (!routes.lines.length) return { ...EMPTY, placeIds: stagePlaceIds(stage), focusPoints: stagePoints(stage) }

  // A stage is ONE day, so the drive into the next day is left off it.
  //
  // With "connect the days" on, that leg is drawn in the colour of the day it leaves, so
  // on the whole-drive map it reads as that day carrying on. Filtering by day number
  // alone therefore handed a stage a line that runs off it to a place the day never
  // visits: on a phone, where the stage IS the map, that read as the day's own route and
  // was the longest thing on screen. The desktop has the same connection, but it has it
  // beside every other day, which is the view the setting exists for; here that view is
  // the "all days" one, a tap away on the same map.
  const ofDay: number[] = []
  routes.lineDays.forEach((n, i) => { if (n === stage.dayNumber) ofDay.push(i) })
  const own = ofDay.filter(i => !routes.lineJoins?.[i])
  // A day that is nothing but driving — no stop of its own, night to night — has only the
  // connection to show. Dropping it there would leave the map blank on the very day the
  // line IS the day, so the filter gives way rather than emptying the screen.
  const keep = own.length ? own : ofDay
  const placeIds = stagePlaceIds(stage)

  return {
    lines: keep.map(i => routes.lines[i]),
    lineColors: dayColorsOn ? keep.map(() => dayColor(stage.dayNumber)) : undefined,
    // A spur belongs to a stop, so it comes along exactly when its stop does.
    accessLines: routes.accessLines.filter(spur => spurOnStage(spur, stage)),
    placeIds,
    focusPoints: stagePoints(stage),
  }
}

/**
 * The places drawn on this stage.
 *
 * Automatic nights are left out: they are the shell's own marker for where a day
 * ended, not somewhere anybody stops, and they have no place row behind them.
 */
export function stagePlaceIds(stage: RoadtripDay): Set<number> {
  return new Set(stage.stops.filter(s => !s.automaticNight).map(s => s.placeId))
}

/** The stage's stops as coordinates, for the fit. */
export function stagePoints(stage: RoadtripDay): [number, number][] {
  return stage.stops
    .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .map(s => [s.lat, s.lng] as [number, number])
}

/**
 * A spur's key is the one `assemble` builds: position to five decimals plus both
 * leg modes. Rebuilt here rather than imported because it is assemble's private
 * detail, and the five decimals are what make it exact enough to tell two stops in
 * the same car park apart.
 */
function spurOnStage(spur: AccessSpur, stage: RoadtripDay): boolean {
  return stage.stops.some(s =>
    `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}` === spur.stopKey)
}
