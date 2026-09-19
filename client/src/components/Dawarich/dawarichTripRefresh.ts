import { useTripStore } from '../../store/tripStore'

/**
 * Pull the trip back in after a stay was accepted into it.
 *
 * The acceptance is written server-side, so the planner knows nothing about the
 * place it produced until somebody reloads the page — which is exactly what a
 * person should never have to do after pressing a button. Both trip shells call
 * this, which is also why it is a plain function rather than a hook: one line at
 * each call site keeps the desktop and phone copies from drifting.
 *
 * Places and days both, because a stay accepted onto a day creates an assignment
 * as well, and the day rail would otherwise stay one place short.
 */
export async function refreshTripAfterAccept(tripId: number | string): Promise<void> {
  const store = useTripStore.getState()
  await Promise.all([store.refreshPlaces(tripId), store.refreshDays(tripId)])
}
