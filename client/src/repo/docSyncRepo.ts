import { docsyncApi } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

/**
 * The two reads behind the Files screen's "Document sync" button.
 *
 * Online-only with no Dexie table, for the reason `dawarichRepo` gives: both
 * answers are the server's (which providers the admin switched on, whether the
 * owner bound this trip), and the dialog the button opens cannot load offline
 * either. The store in front of this keeps the last answer for the session.
 */
export class DocSyncOfflineError extends Error {
  constructor() {
    super('Document sync needs a connection')
    this.name = 'DocSyncOfflineError'
  }
}

function requireOnline(): void {
  if (isEffectivelyOffline()) throw new DocSyncOfflineError()
}

export const docSyncRepo = {
  /**
   * Whether the instance offers a provider somebody could connect.
   *
   * The list is instance-wide; the route sits under a trip only because every
   * document-sync route does. `available` is the same filter the dialog
   * applies, so a provider row without an adapter does not bring up a button
   * into an empty list.
   */
  async offersProvider(tripId: number | string): Promise<boolean> {
    requireOnline()
    const providers = (await docsyncApi.providers(tripId)) as Array<{ available?: boolean }>
    return providers.some(p => p.available)
  },

  /** Whether the trip is bound to at least one store. */
  async isBound(tripId: number | string): Promise<boolean> {
    requireOnline()
    const links = (await docsyncApi.listLinks(tripId)) as unknown[]
    return links.length > 0
  },
}
