import { useCallback, useEffect, useMemo } from 'react'
import { anchorKmFor, corridorWindow, PHONE_REACH_KM, type CorridorReach } from '../../../../components/Roadtrip/corridorSearchModel'
import { stageOf, upNextStop } from '../../../../components/Roadtrip/roadtripRowModel'
import { useNetworkMode } from '../../../../hooks/useNetworkMode'
import type { CorridorPoi } from '../../../../components/Roadtrip/useCorridorPois'
import type { MTripShellApi, TripPlanner } from '../MTripShell'
import { localIsoDate } from '../../../../utils/localDate'

/** Minutes since midnight, local time: the same reading the stage screen takes. */
const nowMinutes = (): number => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export interface MRtCorridorController {
  /** What is being looked for. Several at once: they ride one query per box. */
  categories: string[]
  toggleCategory: (key: string) => void
  /** How much of the stage the next search covers. */
  reach: CorridorReach
  setReach: (value: CorridorReach) => void
  /** How far "ahead" reaches, in kilometres of driving. */
  reachKm: number
  /**
   * True when "ahead" would start at the stop the clock says is next, false when it
   * starts at the beginning of the stage. The sheet says which, because that difference
   * is the whole meaning of the answer.
   */
  anchored: boolean
  /** Asks. Does nothing without a route, a category and a connection. */
  run: () => void
  /** Throws the answer away, pins included. */
  clear: () => void
  canSearch: boolean
  loading: boolean
  progress: { done: number; total: number }
  /** What was found, in driving order, and the same array the map draws. */
  hits: CorridorPoi[]
  /** True once a search has run and left something to read. */
  answered: boolean
  offline: boolean
  error: boolean
  capped: boolean
  failedAreas: number
  truncatedAreas: number
}

/**
 * The corridor search, as a phone asks it.
 *
 * The state itself is the planner's: the map draws `corridor.visible`, so a search
 * living inside a sheet would lose its pins the moment the sheet closed. What is added
 * here is the two things a desk does not need: which stretch of the day to ask about,
 * and where that stretch starts.
 *
 * Called from two places (the bar over the stage, and the sheet), so it holds no state
 * of its own: the reach lives on the shell and everything else on the planner. The one
 * thing that would need a clock (where "ahead" begins) is read at the moment the
 * button is pressed rather than ticked, so this hook costs a screen nothing while
 * nobody is searching.
 *
 * The stage on screen decides the day. Switching stages therefore drops the results,
 * and that is not a special case handled here: `useCorridorPois` clears whenever the
 * routed line changes, so an answer can never outlive the question it belongs to.
 */
export function useMRtCorridor(planner: TripPlanner, shell: MTripShellApi): MRtCorridorController {
  const corridor = planner.roadtripCorridor
  const { setDayId, clear: clearCorridor, search, categories, toggleCategory, stopsAlongKm } = corridor
  const { offline } = useNetworkMode()
  const reach = shell.rtReach

  const stage = useMemo(
    () => stageOf(planner.roadtripRoutes.days, planner.selectedDayId),
    [planner.roadtripRoutes.days, planner.selectedDayId],
  )

  // The chip rail names the stage, so the stage names the drive being searched. Written
  // as an effect rather than as a prop because `dayId` is also the desktop day picker's
  // state, and only one of the two shells is ever mounted.
  const stageDayId = stage ? String(stage.dayId) : ''
  useEffect(() => {
    if (stageDayId) setDayId(stageDayId)
  }, [stageDayId, setDayId])

  /**
   * Whether the clock can say where the drive has got to.
   *
   * Only on the day itself, and only once one stop is behind: on the first stop of the
   * morning "ahead" and "the whole stage" are the same stretch, and claiming a position
   * nobody gave us would be worse than starting at the beginning.
   */
  const upNextIndexNow = useCallback((): number => {
    if (!stage) return -1
    const date = planner.days.find(d => d.id === planner.selectedDayId)?.date
    // Local, for the reason useMRoadtrip gives: the clock this is compared against is the
    // wall clock, and UTC disagrees with it for the first hours of every night.
    const isToday = !!date && date.slice(0, 10) === localIsoDate()
    const next = upNextStop(stage, nowMinutes(), isToday)
    if (!next) return -1
    return stage.stops.findIndex(s => s.assignmentId === next.row.stop.assignmentId)
  }, [stage, planner.days, planner.selectedDayId])

  const anchored = upNextIndexNow() > 0

  const canSearch = !offline && categories.length > 0 && search.spine.length > 1

  const runSearch = search.search
  const run = useCallback(() => {
    if (!canSearch) return
    const index = upNextIndexNow()
    runSearch(corridorWindow(anchorKmFor(stopsAlongKm, index > 0 ? index : null), reach))
  }, [canSearch, runSearch, upNextIndexNow, stopsAlongKm, reach])

  /**
   * Changing the reach throws the answer away on purpose.
   *
   * Hits found in the fifty kilometres ahead are not an answer to "the whole stage", and
   * a list that stays put while the chip above it says something else is the kind of
   * quiet wrongness that gets a stop planned in the wrong place. The categories behave
   * the same way one level down, in `useCorridorPois`.
   */
  const { setRtReach } = shell
  const setReach = useCallback((value: CorridorReach) => {
    if (value === reach) return
    setRtReach(value)
    clearCorridor()
  }, [reach, setRtReach, clearCorridor])

  return {
    categories,
    toggleCategory,
    reach,
    setReach,
    reachKm: PHONE_REACH_KM,
    anchored,
    run,
    clear: clearCorridor,
    canSearch,
    loading: search.loading,
    progress: search.progress,
    hits: corridor.visible,
    answered: !search.loading && search.progress.total > 0,
    offline,
    error: search.error,
    capped: search.capped,
    failedAreas: search.failedAreas,
    truncatedAreas: search.truncatedAreas,
  }
}
