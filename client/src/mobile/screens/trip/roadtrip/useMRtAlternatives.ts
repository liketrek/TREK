import { useEffect, useTransition } from 'react'
import { alternativesPhase, type AlternativeOverlay, type AlternativesPhase } from '../../../../components/Roadtrip/alternativeOverlays'
import type { LegAlternatives } from '../../../../components/Roadtrip/useRouteAlternatives'
import type { MTripShellApi, TripPlanner } from '../MTripShell'

/**
 * The alternatives bar's fixed height, in pixels. MRtAlternativesBar is drawn at exactly
 * this, and the map floor below is worked out from it, so the two cannot drift apart.
 */
export const RT_ALT_BAR_HEIGHT = 174

/**
 * How far the map floor rises while the alternatives bar stands over the dock, in pixels.
 *
 * The bar's height plus the 15px gap between the top of the dock and the foot of a bar
 * standing over it. So the floor lands on this bar's top edge and the round controls
 * clear it rather than sitting in it. It is the only bar left in that slot: the stage bar
 * that used to hold it whenever the map was up is gone.
 *
 * A number rather than a CSS length because the map's fit padding is added up from it.
 * Kept in this module rather than in the bar's, so the map area reads it without pulling
 * a component in.
 */
export const RT_ALT_BAR_LIFT = RT_ALT_BAR_HEIGHT + 15

export interface MRtAlternativesController {
  /** The leg being reconsidered and what came back for it. Null while no picker is open. */
  open: LegAlternatives | null
  /** The very overlays the map draws, so a chip and its line can never disagree. */
  overlays: AlternativeOverlay[]
  /** Which of its four states the open picker is in. Null while none is open. */
  phase: AlternativesPhase | null
  /** The road a tap is previewing, lit on the map and waiting for confirm. */
  picked: AlternativeOverlay | null
  /** May this person reshape the drive at all. Without it no leg offers the question. */
  canAsk: boolean
  /** False offline: a choice is written as a via, and vias are online only. */
  editable: boolean
  canConfirm: boolean
  /** True while the chosen road is being written. */
  saving: boolean
  isOpenFor: (dayId: number, legIndex: number) => boolean
  ask: (dayId: number, legIndex: number) => void
  pick: (index: number) => void
  confirm: () => void
  cancel: () => void
}

/**
 * Other ways of driving a leg, as a phone asks for them and takes one.
 *
 * Holds no picker state of its own. The road trip tab is mounted in two places, one per
 * half of the list and map switch, so it remounts on every toggle, and a picker living
 * here would be gone the moment somebody looked back at the chain. Everything stays in
 * the planner, where the desk keeps it too: the open leg, the offers, the overlays and
 * the road lit on the map. What this adds is what a desk does not need.
 *
 * A tap previews and a confirm takes. On the desk a pointer hovers to preview and a
 * click writes; glass has no hover, so the first touch on a chip or a line would already
 * be the write. Here that touch only lights the road (`pick`), and the bar's button
 * commits it (`confirm`).
 *
 * The question is always about the leg on screen. Asking goes to the map, where the
 * answer is drawn, and a stage change closes the picker, because offers drawn for a leg
 * of another day are lines nobody on this stage asked about.
 */
export function useMRtAlternatives(planner: TripPlanner, shell: MTripShellApi): MRtAlternativesController {
  const { open, close } = planner.routeAlternatives
  const overlays = planner.alternativeOverlays
  const editable = planner.roadtripVias.editable
  const [saving, startSaving] = useTransition()

  const phase = open ? alternativesPhase(open, overlays) : null
  const highlighted = planner.highlightedAlternative
  const picked = highlighted == null ? null : overlays.find(o => o.index === highlighted) ?? null
  // The road already driven is no choice: taking it writes nothing and only closes the
  // picker, which the close button already does without pretending to save.
  const canConfirm = !!picked && phase === 'choose' && !open?.routes[picked.index]?.current && editable && !saving

  const isOpenFor = (dayId: number, legIndex: number) => open?.dayId === dayId && open.index === legIndex

  // The day chips, a swipe and the all days switch all move the stage under an open
  // picker. `close` is the planner's stable callback, so this runs when the leg or the
  // stage changes and not on every render.
  const selectedDayId = planner.selectedDayId
  useEffect(() => {
    if (open && open.dayId !== selectedDayId) close()
  }, [open, selectedDayId, close])

  const ask = (dayId: number, legIndex: number) => {
    // The planner's own ask toggles a leg that is already open, which is the desk
    // button's second click. Here the pressed button on the chain is the way back to the
    // answer on the map, so it must not close what it is pointing at.
    if (!isOpenFor(dayId, legIndex)) {
      // A pick belongs to the leg it was made on. Carried over, it would light a road
      // on the next leg by its position in a list that leg never offered.
      planner.setHighlightedAlternative(null)
      // An open fuel search keeps the camera on its stations (see mapFocusPoints), so the
      // leg would be asked about and never framed. The picker is modal on the map anyway.
      planner.refuel.close()
      // The card's day, as the desk passes it: the planner looks the stops up on that
      // card and works out the day each one is stored on by itself.
      planner.askRouteAlternatives(dayId, legIndex)
    }
    if (shell.rtView === 'list') shell.toggleRtView()
  }

  const pick = (index: number) => planner.setHighlightedAlternative(index)

  const confirm = () => {
    if (!canConfirm || !picked) return
    const index = picked.index
    // A transition rather than a flag of our own, so the pending state ends when the
    // write does. The planner reports a failure itself and leaves the picker open for
    // another go, and closes it once the via is saved.
    startSaving(async () => {
      await planner.chooseRouteAlternative(index)
    })
  }

  return {
    open,
    overlays,
    phase,
    picked,
    canAsk: planner.can('day_edit', planner.trip),
    editable,
    canConfirm,
    saving,
    isOpenFor,
    ask,
    pick,
    confirm,
    cancel: close,
  }
}
