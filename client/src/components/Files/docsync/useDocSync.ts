import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { docsyncApi } from '../../../api/client'
import { useServerPing } from '../../../sync/useServerPing'

/**
 * All document-sync state and actions, in one hook.
 *
 * Deliberately a hook rather than logic inside the panel: the phone shell is a
 * separate component tree (client/src/mobile/screens/trip/...), and duplicating
 * this across both would land on SonarCloud's 3% duplication budget the way the
 * photo provider section already does. `useDawarichConnection` states the same
 * reason for the same problem.
 */

export interface DocSyncField {
  field_key: string
  label: string
  input_type: string
  placeholder: string | null
  hint: string | null
  required: boolean
  secret: boolean
}

export interface DocSyncProvider {
  id: string
  name: string
  description: string | null
  icon: string
  available: boolean
  fields: DocSyncField[]
}

export interface DocSyncConnection {
  id: number
  providerId: string
  baseUrl: string
  settings: Record<string, string>
  secrets: Record<string, string>
  allowInsecureTls: boolean
  lastProbeState: string
  lastProbeError: string | null
}

export interface DocSyncScope {
  scopeKey: string
  label: string
  remoteRootId: string | null
  remoteRootPath: string | null
}

export interface DocSyncLink {
  id: number
  connectionId: number
  providerId: string
  scopeKey: string
  remoteLabel: string
  remoteRootPath: string | null
  direction: 'both' | 'pull' | 'push'
  deletePolicy: 'unlink' | 'trash'
  conflictPolicy: string
  syncEnabled: boolean
  lastSyncAt: string | null
  lastSyncState: string
  lastSyncError: string | null
  webhookUrl: string | null
  /**
   * The store's display name as the server knows it. Carried on the link
   * because the providers route only lists what an admin has switched on, and
   * a binding outlives its provider being switched off.
   */
  providerName?: string
  /** Standing counts per side, from the status route. */
  holdings?: { inTrek: number; atProvider: number; paired: number; missing: number }
  /**
   * An admin has switched this binding's provider off. The server leaves the
   * binding as it was, so `lastSyncState` still describes the last run and
   * this is what says why nothing moves now. From the status route.
   */
  providerOff?: boolean
}

/**
 * What to call the store a binding points at.
 *
 * One lookup for both shells, so the list row, the card header and the flow
 * summary cannot name the same store three different ways. The providers list
 * wins because the rest of the dialog uses its names; the link's own name
 * covers a provider that has since been switched off.
 */
export function storeName(link: DocSyncLink, providers: readonly DocSyncProvider[]): string {
  return providers.find(p => p.id === link.providerId)?.name || link.providerName || link.providerId
}

/**
 * The line a binding card shows under its header, or null when there is
 * nothing to say.
 *
 * Both shells render it, so a phone and a laptop cannot disagree about why a
 * binding stands still. A provider an admin switched off comes first: the
 * server leaves the binding's state as the last run wrote it, which would
 * otherwise report an old failure, or nothing, for a binding that is paused.
 */
export function bindingNotice(
  link: Pick<DocSyncLink, 'providerOff' | 'lastSyncState' | 'lastSyncError'>,
  t: (key: string) => string,
): string | null {
  if (link.providerOff) return t('docsync.error.provider_disabled')
  if (link.lastSyncState === 'ok' || link.lastSyncState === 'never') return null
  const state = t(`docsync.linkState.${link.lastSyncState}`)
  return link.lastSyncError ? `${state} · ${t(`docsync.error.${link.lastSyncError}`)}` : state
}

/**
 * Whether the store has refused the stored credential.
 *
 * Two shapes say so. A refusal while listing is recorded as its own state; a
 * refusal anywhere else (resolving the folder, one transfer) leaves the state
 * at failed or partial and puts the reason in the error code. Either way the
 * cure is the same, a new credential, and both shells decide from here
 * whether to offer the form for it.
 */
export function needsReauth(link: Pick<DocSyncLink, 'lastSyncState' | 'lastSyncError'>): boolean {
  return link.lastSyncState === 'needs_reauth' || link.lastSyncError === 'unauthorized'
}

/**
 * Whether this person may change a sync binding.
 *
 * Only the trip owner: the credential a binding stores usually reaches that
 * person's entire document archive, so letting any member repoint it would
 * share a folder the owner never chose to share. Instance admins are included
 * because they already override every other permission check in the client.
 *
 * Shared by both shells rather than written out twice: the desktop file
 * manager and the phone sheet must not be able to drift on who may do this.
 */
export function canManageDocSync(
  user: { id?: number | string; role?: string } | null | undefined,
  trip: { user_id?: number | string } | null | undefined,
): boolean {
  if (!user) return false
  return user.role === 'admin' || Number(trip?.user_id) === Number(user.id)
}

export function useDocSync(tripId: number | string, enabled: boolean) {
  const [providers, setProviders] = useState<DocSyncProvider[]>([])
  const [connections, setConnections] = useState<DocSyncConnection[]>([])
  const [links, setLinks] = useState<DocSyncLink[]>([])
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Whether the first load is through.
   *
   * Every mutation refreshes, and a refresh that flips `loading` swaps the whole
   * dialog for a spinner and back: a white flash on something as small as
   * toggling a direction. Only the first load has nothing to show yet.
   */
  const loadedOnce = useRef(false)

  /**
   * Which load is the current one.
   *
   * Four requests go out per load and several loads overlap: every mutation
   * starts one, and so does every ping. Without a generation stamp the slowest
   * response wins, which on a binding somebody just changed means the screen
   * settles on the state from before the change.
   */
  const generation = useRef(0)
  /** Whether the last failure came from loading rather than from a write. */
  const loadFailed = useRef(false)

  const load = useCallback(async () => {
    if (!enabled) return
    const mine = ++generation.current
    if (!loadedOnce.current) setLoading(true)
    try {
      const [p, c, l, s] = await Promise.all([
        docsyncApi.providers(tripId),
        docsyncApi.listConnections(tripId),
        docsyncApi.listLinks(tripId),
        docsyncApi.status(tripId),
      ])
      if (mine !== generation.current) return
      setProviders(p as DocSyncProvider[])
      setConnections(c as DocSyncConnection[])
      // The status route carries the holdings and the provider switch; the
      // links route does not, so the two are merged here rather than asking
      // every caller to join them.
      const status = s as { items?: Record<string, number>; links?: DocSyncLink[] }
      const statusById = new Map((status.links ?? []).map(x => [x.id, x]))
      setLinks((l as DocSyncLink[]).map(x => ({
        ...x,
        holdings: statusById.get(x.id)?.holdings,
        providerOff: statusById.get(x.id)?.providerOff === true,
      })))
      setItemCounts(status.items || {})
      // Only a load failure is cleared here. A write that just failed reloads to
      // put the server's answer back on screen, and clearing unconditionally
      // wiped the reason it had set a moment earlier.
      setError(prev => (prev !== null && loadFailed.current ? null : prev))
      loadFailed.current = false
      loadedOnce.current = true
    } catch (e: unknown) {
      // A 403 or 404 really does mean "nothing to configure here" (the addon is
      // off or this person lost access), and blanking the panel is the honest
      // answer. Anything else is a failure to say so: blanking on a dropped
      // connection told the user their provider list was empty.
      if (mine !== generation.current) return
      const status = (e as { response?: { status?: number } })?.response?.status
      loadFailed.current = true
      if (status === 403 || status === 404) {
        // The bindings go too. Both shells keep a binding on screen with no
        // provider left, so emptying the providers alone blanked nothing.
        setProviders([])
        setConnections([])
        setLinks([])
        setItemCounts({})
        setError(null)
      } else {
        setError(readError(e))
      }
    } finally {
      if (mine === generation.current) setLoading(false)
    }
  }, [tripId, enabled])

  useEffect(() => { void load() }, [load])

  // A run started by another member moves the same documents and the same
  // counts. The event is a ping rather than a payload: the numbers it would
  // carry are per-binding server state, and reading them back is the only way
  // this panel and that member's panel end up saying the same thing.
  useServerPing('docsync:changed', enabled, load)

  const connectionFor = useCallback(
    (providerId: string) => connections.find(c => c.providerId === providerId) || null,
    [connections],
  )

  const saveConnection = useCallback(async (providerId: string, baseUrl: string, credentials: Record<string, string>, allowInsecureTls: boolean) => {
    setBusy('save')
    setError(null)
    try {
      await docsyncApi.saveConnection(tripId, { providerId, baseUrl, credentials, allowInsecureTls })
      await load()
      return true
    } catch (e: unknown) {
      setError(readError(e))
      return false
    } finally {
      setBusy(null)
    }
  }, [tripId, load])

  /**
   * Probe without saving. Always resolves to a verdict object: the route
   * answers 200 even for an unreachable instance, because a form showing a typo
   * needs a field to render, not an exception.
   */
  const testConnection = useCallback(async (providerId: string, baseUrl: string, credentials: Record<string, string>, allowInsecureTls: boolean) => {
    setBusy('test')
    try {
      return await docsyncApi.testConnection(tripId, { providerId, baseUrl, credentials, allowInsecureTls }) as {
        connected: boolean; account?: string; error?: string; detail?: string
      }
    } catch (e: unknown) {
      return { connected: false, error: readError(e) }
    } finally {
      setBusy(null)
    }
  }, [tripId])

  /**
   * The containers a connection can be bound to.
   *
   * Always resolves to a listing, the way `testConnection` always resolves to
   * a verdict: the route answers 200 with an error code when the store refuses,
   * and a request that fell over on the way (a store behind a VPN that is not
   * up, a connection an admin deleted meanwhile) has to reach the picker the
   * same way. Left to reject, it never reached `setScopes`, and the picker
   * spun forever with nothing said.
   */
  const loadScopes = useCallback(async (connectionId: number, q?: string) => {
    try {
      return await docsyncApi.listScopes(tripId, connectionId, q) as { scopes: DocSyncScope[]; error?: string }
    } catch (e: unknown) {
      return { scopes: [] as DocSyncScope[], error: readError(e) }
    }
  }, [tripId])

  /**
   * Make a container at the provider.
   *
   * Reports failure the same way every other write here does. A rejected
   * create used to escape as an unhandled rejection, so the button blinked and
   * nothing happened and nothing was said. Null rather than a throw, because
   * the caller's next step is to bind what came back, and there is nothing to
   * bind.
   */
  const createScope = useCallback(async (connectionId: number, name: string): Promise<DocSyncScope | null> => {
    setBusy('scope')
    setError(null)
    try {
      return await docsyncApi.createScope(tripId, connectionId, name) as DocSyncScope
    } catch (e: unknown) {
      setError(readError(e))
      return null
    } finally {
      setBusy(null)
    }
  }, [tripId])

  const createLink = useCallback(async (payload: Record<string, unknown>) => {
    setBusy('link')
    setError(null)
    try {
      await docsyncApi.createLink(tripId, payload)
      await load()
      return true
    } catch (e: unknown) {
      setError(readError(e))
      return false
    } finally {
      setBusy(null)
    }
  }, [tripId, load])

  /**
   * Change one binding, optimistically.
   *
   * The reload in `finally` puts the server's answer back either way, so a
   * refused change corrects itself on screen, but it used to do that in
   * silence, with the rejection escaping into a `void` call site. The switch
   * simply flipped back and nobody said why.
   */
  const updateLink = useCallback(async (linkId: number, patch: Record<string, unknown>) => {
    setLinks(prev => prev.map(l => (l.id === linkId ? { ...l, ...patch } as DocSyncLink : l)))
    setError(null)
    try {
      await docsyncApi.updateLink(tripId, linkId, patch)
      await load()
      return true
    } catch (e: unknown) {
      // Reload first, so the optimistic value is corrected, then say why.
      // The other way round the reload cleared the message again.
      await load()
      setError(readError(e))
      return false
    }
  }, [tripId, load])

  const removeLink = useCallback(async (linkId: number) => {
    setBusy('link')
    setError(null)
    try {
      await docsyncApi.deleteLink(tripId, linkId)
      await load()
      return true
    } catch (e: unknown) {
      setError(readError(e))
      return false
    } finally {
      setBusy(null)
    }
  }, [tripId, load])

  const syncNow = useCallback(async (linkId: number, full = false) => {
    setBusy(`sync-${linkId}`)
    setError(null)
    try {
      const res = await docsyncApi.syncNow(tripId, linkId, full) as {
        state: string; pulled: number; pushed: number; conflicts: number; missing: number
      }
      await load()
      return res
    } catch (e: unknown) {
      // A refused run is a thing the person asked for and did not get (an
      // orphaned binding answers 409 here), so it has to be said out loud
      // rather than escaping into the `void` at the call site. After the
      // reload, which would otherwise clear the message.
      await load()
      setError(readError(e))
      return null
    } finally {
      setBusy(null)
    }
  }, [tripId, load])

  /**
   * Settle one conflict.
   *
   * Reports failure the way the other writes do. The rejection used to escape
   * into the `void` at the call site, so a refused choice (the row was settled
   * elsewhere a moment ago, or the server answered 403) put the button back
   * and left the row standing with nothing said.
   */
  const resolveConflict = useCallback(async (itemId: number, keep: 'trek' | 'provider' | 'both') => {
    setError(null)
    try {
      await docsyncApi.resolve(tripId, itemId, keep)
      await load()
      return true
    } catch (e: unknown) {
      // Reload first, so the counts match what the server has, then say why.
      // The other way round the reload cleared the message again.
      await load()
      setError(readError(e))
      return false
    }
  }, [tripId, load])

  /** Providers the admin switched on that also have a working adapter. */
  const usableProviders = useMemo(() => providers.filter(p => p.available), [providers])

  return {
    providers: usableProviders,
    connections, links, itemCounts,
    loading, busy, error,
    connectionFor, load,
    saveConnection, testConnection,
    loadScopes, createScope,
    createLink, updateLink, removeLink, syncNow, resolveConflict,
  }
}

/**
 * The error code a failed call carries, or `unknown`.
 *
 * Both shells render this as `docsync.error.<code>`, so anything that is not
 * one of the codes reaches the screen as a raw translation key, and the server
 * answers plenty of routes with a sentence ("Link not found") rather than a
 * code. A general message is worse than a specific one and far better than
 * `docsync.error.Link not found`.
 */
function readError(e: unknown): string {
  const res = (e as { response?: { data?: { error?: string; message?: string } } })?.response
  const raw = res?.data?.error || res?.data?.message || ''
  // A code passes through: the sync codes and the handful of keys the routes
  // answer with are all of this shape. A sentence does not: several routes
  // answer with prose ("Link not found"), and both shells render this as
  // `docsync.error.<value>`, so that reached the screen as a raw translation
  // key. A general message is worse than a specific one and far better than
  // `docsync.error.Link not found`.
  return /^[a-z0-9_.]+$/i.test(raw) ? raw : 'unknown'
}
