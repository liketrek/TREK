import { create } from 'zustand'
import { docSyncRepo } from '../repo/docSyncRepo'

/**
 * Whether a trip's Files screen offers document sync, remembered for the session.
 *
 * The seed ships every document provider switched off, so a button on every
 * trip led, straight after the upgrade, into "No document providers are
 * available". It shows where there is something behind it: a trip that is
 * already bound (every member needs to see where their documents go), or
 * somebody who may bind it on an instance that offers a provider.
 *
 * Remembered so that coming back to the tab renders the last answer at once,
 * instead of the button popping in after a request every time.
 */
interface DocSyncOfferState {
  /** Per trip id, whether it has a binding. Missing until asked. */
  bound: Record<string, boolean>
  /** Whether the instance offers any provider. Null until asked. */
  providers: boolean | null
  refresh: (tripId: number | string, canManage: boolean) => Promise<void>
}

export const useDocSyncOfferStore = create<DocSyncOfferState>((set) => ({
  bound: {},
  providers: null,

  refresh: async (tripId, canManage) => {
    const key = String(tripId)
    try {
      // Somebody who may bind the trip gets the button as soon as a provider
      // is on, bound or not, so the second request is for everybody else.
      if (canManage) {
        const providers = await docSyncRepo.offersProvider(tripId)
        set({ providers })
        if (providers) return
      }
      const bound = await docSyncRepo.isBound(tripId)
      set(s => ({ bound: { ...s.bound, [key]: bound } }))
    } catch (err) {
      // 403 is the Documents addon switched off and 404 a trip this person no
      // longer reaches: both a real "no". Anything else, offline included, is
      // no answer at all, and the last one stands.
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) set(s => ({ bound: { ...s.bound, [key]: false } }))
    }
  },
}))
