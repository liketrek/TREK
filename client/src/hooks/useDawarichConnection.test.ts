/**
 * FE-DAWARICH-CONN-001 to FE-DAWARICH-CONN-027: the connection card's one hook.
 *
 * Everything the Dawarich connection card does lives here, desktop shell and
 * phone shell alike, which means everything it can get wrong lives here too.
 * Four things are worth pinning, and the cases below are grouped around them.
 *
 *  1. **The reason-code chain.** Dawarich answers in English and occasionally
 *    quotes the URL back, so the hook renders the server's *code* and keeps the
 *    upstream sentence only as the fallback for a code this build predates. A
 *    regression here crashes nothing: it quietly ships English, or a bare
 *    `dawarich.error.foo` key, onto a German install. Every branch of it is a
 *    sentence a real person reads, so `lastSyncError`, the probe panel, the
 *    private-IP warning and all four error toasts each get their own case.
 *  2. **"Blank means keep the stored key".** The key field is never prefilled,
 *    so an untouched field must leave `apiKey` out of the payload entirely.
 *    Sending `apiKey: ''` instead would wipe a working connection on the next
 *    save of an unrelated switch.
 *  3. **The flags nobody sets by hand.** `canSave` (an address alone is not a
 *    connection), `alreadyRunning` (a sync in flight has no result yet, so
 *    "0 new stays" would be a claim rather than a report), and the three
 *    in-flight booleans the buttons disable themselves with.
 *  4. **The unmount guard** on the initial read, the reason a card closed
 *    mid-request does not write into a dead component.
 *
 * The API and the toaster are mocked, the way the neighbouring
 * `useDawarichSuggestions` test does it. Translation is not: `en` is bundled
 * statically, so the real provider answers synchronously, and the hook's
 * fallbacks depend on `t()` returning the key untouched for a string this build
 * does not have, which only the real one does.
 */
import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DawarichCapabilities, DawarichConnection, DawarichStatus } from '@trek/shared'
import { TranslationProvider } from '../i18n/TranslationContext'
import { useDawarichConnection } from './useDawarichConnection'

const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
vi.mock('../components/shared/Toast', () => ({ useToast: () => toast, default: () => toast }))

const api = {
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  test: vi.fn(),
  syncNow: vi.fn(),
  disconnect: vi.fn(),
}
vi.mock('../api/dawarich', () => ({
  dawarichApi: {
    getSettings: (...args: unknown[]) => api.getSettings(...args),
    saveSettings: (...args: unknown[]) => api.saveSettings(...args),
    test: (...args: unknown[]) => api.test(...args),
    syncNow: (...args: unknown[]) => api.syncNow(...args),
    disconnect: (...args: unknown[]) => api.disconnect(...args),
  },
}))

const CAPS: DawarichCapabilities = {
  visits: true,
  tracks: true,
  points: false,
  locations: true,
  visitedCities: false,
  visitUpdatedAt: false,
  visitCountryCode: false,
  serverVersion: '1.14.4',
  probedAt: '2026-09-01T08:00:00.000Z',
}

/**
 * A connected instance with a clean history. Written out in full rather than
 * cast from a fragment so the day the contract grows a field, this file is one
 * of the places that has to answer for it.
 */
function connection(over: Partial<DawarichConnection> = {}): DawarichConnection {
  return {
    url: 'https://dawarich.example',
    apiKeyMasked: '****abcd',
    allowInsecureTls: false,
    syncEnabled: true,
    connected: true,
    lastSyncAt: '2026-09-01T07:00:00.000Z',
    lastSyncState: 'ok',
    lastSyncError: null,
    capabilities: CAPS,
    ...over,
  }
}

/** A promise this test controls the settling of, to pin down state mid-flight. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

function mount() {
  return renderHook(() => useDawarichConnection(), { wrapper })
}

async function mounted(data: DawarichConnection = connection()) {
  api.getSettings.mockResolvedValue(data)
  const hook = mount()
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

// The shipped English for the keys this hook reaches for. Written out rather
// than read back from the bundle so a reader of this file sees the sentence that
// ends up on screen, and so a reworded string is a decision somebody makes here
// too. The private-IP warning is the one exception: it is long enough that
// transcribing it would test the transcription, so it is asserted by its parts.
const EN = {
  probeOk: (count: number) => `Connected. ${count} stays found in the last 30 days.`,
  probeFailed: 'Could not reach Dawarich.',
  saved: 'Dawarich connection saved',
  saveError: 'Could not save the connection',
  disconnected: 'Dawarich disconnected',
  synced: (count: number) => `${count} new stays found`,
  syncError: 'Could not read Dawarich',
  syncRunning: 'A check is already running',
  unreachable: 'TREK could not reach that address.',
  unauthorized: 'Dawarich rejected the API key.',
  unknown: 'Something went wrong talking to Dawarich.',
}

/** The last thing a toaster was handed, for the assertions that read a sentence apart. */
function lastToast(fn: typeof toast.warning): string {
  const calls = fn.mock.calls
  return calls[calls.length - 1]?.[0] as string
}

beforeEach(() => {
  toast.success.mockReset()
  toast.error.mockReset()
  toast.info.mockReset()
  toast.warning.mockReset()
  api.getSettings.mockReset().mockResolvedValue(connection())
  api.saveSettings.mockReset().mockResolvedValue({ success: true })
  api.test.mockReset().mockResolvedValue({ connected: true, visitCount: 4, capabilities: CAPS })
  api.syncNow.mockReset().mockResolvedValue({ state: 'ok', created: 2, updated: 1, missing: 0 })
  api.disconnect.mockReset().mockResolvedValue({ success: true })
})

describe('useDawarichConnection: the initial read', () => {
  it('FE-DAWARICH-CONN-001: starts loading and then hydrates every field from the stored connection', async () => {
    const settings = deferred<DawarichConnection>()
    api.getSettings.mockReturnValue(settings.promise)
    const { result } = mount()

    expect(result.current.loading).toBe(true)
    expect(result.current.url).toBe('')
    expect(result.current.connected).toBe(false)

    await act(async () => {
      settings.resolve(connection({ lastSyncState: 'partial', lastSyncError: 'unauthorized' }))
      await settings.promise
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.url).toBe('https://dawarich.example')
    expect(result.current.connected).toBe(true)
    expect(result.current.syncEnabled).toBe(true)
    expect(result.current.allowInsecureTls).toBe(false)
    expect(result.current.lastSyncAt).toBe('2026-09-01T07:00:00.000Z')
    expect(result.current.lastSyncState).toBe('partial')
    expect(result.current.lastSyncError).toBe(EN.unauthorized)
    expect(result.current.capabilities).toEqual(CAPS)
    // The stored key never leaves the server, so the field is blank even though
    // the connection is live. Everything below about `canSave` follows from it.
    expect(result.current.apiKey).toBe('')
  })

  it('FE-DAWARICH-CONN-002: an instance that was never connected leaves the card empty and keeps sync switched off', async () => {
    const { result } = await mounted(connection({
      url: '',
      allowInsecureTls: true,
      syncEnabled: false,
      connected: false,
      lastSyncAt: null,
      lastSyncState: 'never',
      capabilities: null,
    }))

    expect(result.current.url).toBe('')
    expect(result.current.allowInsecureTls).toBe(true)
    // `syncEnabled` defaults to on, so an explicit false is the one value that
    // has to survive the round trip intact.
    expect(result.current.syncEnabled).toBe(false)
    expect(result.current.connected).toBe(false)
    expect(result.current.capabilities).toBeNull()
    expect(result.current.lastSyncAt).toBeNull()
    expect(result.current.lastSyncError).toBeNull()
    expect(result.current.canSave).toBe(false)
  })

  it('FE-DAWARICH-CONN-003: a failed read of our own settings clears loading without blaming the instance', async () => {
    api.getSettings.mockRejectedValue(new Error('500'))
    const { result } = mount()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.url).toBe('')
    expect(result.current.connected).toBe(false)
    expect(result.current.lastSyncState).toBe('never')
    // Our own endpoint failing is a TREK problem. An error toast here would send
    // the reader off editing a URL that was never at fault.
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-CONN-004: settings that arrive after the card is gone are dropped, not written into a dead component', async () => {
    const settings = deferred<DawarichConnection>()
    api.getSettings.mockReturnValue(settings.promise)
    const { result, unmount } = mount()

    unmount()
    await act(async () => {
      settings.resolve(connection())
      await settings.promise
    })

    // The last rendered values are the pre-flight ones: nothing was set after
    // the unmount, not even the loading flag in the `finally`.
    expect(result.current.loading).toBe(true)
    expect(result.current.url).toBe('')
  })

  it('FE-DAWARICH-CONN-005: the last sync error is rendered from its code, and an unrecognised code still gets a sentence', async () => {
    const known = await mounted(connection({ lastSyncState: 'failed', lastSyncError: 'unreachable' }))
    expect(known.result.current.lastSyncError).toBe(EN.unreachable)

    // A code from a server newer than this build. It must not reach the screen
    // as the bare key, which is what happens the day the fallback goes.
    const ahead = await mounted(connection({ lastSyncState: 'failed', lastSyncError: 'quota_exhausted' }))
    expect(ahead.result.current.lastSyncError).toBe(EN.unknown)
    expect(ahead.result.current.lastSyncError).not.toBe('dawarich.error.quota_exhausted')

    const clean = await mounted(connection({ lastSyncError: null }))
    expect(clean.result.current.lastSyncError).toBeNull()
  })
})

describe('useDawarichConnection: the save gate', () => {
  it('FE-DAWARICH-CONN-006: saving needs an address plus either a live connection or a freshly typed key', async () => {
    const { result } = await mounted(connection({
      url: '',
      connected: false,
      capabilities: null,
      lastSyncAt: null,
      lastSyncState: 'never',
    }))
    expect(result.current.canSave).toBe(false)

    act(() => result.current.setUrl('   '))
    expect(result.current.canSave).toBe(false)

    // An address on its own: nothing stored, nothing typed, so there is no key
    // to save it with.
    act(() => result.current.setUrl('https://dawarich.example'))
    expect(result.current.canSave).toBe(false)

    act(() => result.current.setApiKey('   '))
    expect(result.current.canSave).toBe(false)

    act(() => result.current.setApiKey('k-123'))
    expect(result.current.canSave).toBe(true)
  })

  it('FE-DAWARICH-CONN-007: an already connected instance stays saveable with the key field left blank', async () => {
    const { result } = await mounted()
    expect(result.current.apiKey).toBe('')
    expect(result.current.canSave).toBe(true)
  })

  it('FE-DAWARICH-CONN-008: both switches flip, and the save they trigger carries no key at all', async () => {
    const { result } = await mounted()

    act(() => result.current.toggleInsecureTls())
    act(() => result.current.toggleSync())
    expect(result.current.allowInsecureTls).toBe(true)
    expect(result.current.syncEnabled).toBe(false)

    await act(async () => { await result.current.save() })

    // No `apiKey` property whatsoever: an empty string would clear the stored
    // key, and this save was about two switches.
    expect(api.saveSettings).toHaveBeenCalledWith({
      url: 'https://dawarich.example',
      allowInsecureTls: true,
      syncEnabled: false,
    })

    act(() => result.current.toggleInsecureTls())
    expect(result.current.allowInsecureTls).toBe(false)
  })
})

describe('useDawarichConnection: save', () => {
  it('FE-DAWARICH-CONN-009: save trims the address, sends the typed key once, re-reads the connection and clears the field', async () => {
    const { result } = await mounted(connection({
      connected: false,
      capabilities: null,
      lastSyncState: 'failed',
      lastSyncError: 'unreachable',
    }))
    act(() => {
      result.current.setUrl('  https://new.example  ')
      result.current.setApiKey('  k-123  ')
    })

    const pending = deferred<{ success: boolean }>()
    api.saveSettings.mockReturnValue(pending.promise)
    api.getSettings.mockResolvedValue(connection({
      url: 'https://new.example',
      connected: true,
      lastSyncState: 'ok',
      lastSyncError: null,
    }))

    let done!: Promise<void>
    act(() => { done = result.current.save() })
    expect(result.current.saving).toBe(true)

    await act(async () => {
      pending.resolve({ success: true })
      await done
    })

    expect(api.saveSettings).toHaveBeenCalledWith({
      url: 'https://new.example',
      allowInsecureTls: false,
      syncEnabled: true,
      apiKey: 'k-123',
    })
    // Cleared, so the next save of an unrelated switch does not resend it.
    expect(result.current.apiKey).toBe('')
    expect(result.current.connected).toBe(true)
    expect(result.current.capabilities).toEqual(CAPS)
    expect(result.current.lastSyncState).toBe('ok')
    expect(result.current.lastSyncError).toBeNull()
    expect(result.current.saving).toBe(false)
    expect(toast.success).toHaveBeenCalledWith(EN.saved)
  })

  it('FE-DAWARICH-CONN-010: a save the server accepts but cannot connect with flips the card back to disconnected', async () => {
    const { result } = await mounted()
    expect(result.current.connected).toBe(true)

    api.getSettings.mockResolvedValue(connection({
      connected: false,
      capabilities: null,
      lastSyncState: 'failed',
      lastSyncError: 'unauthorized',
    }))
    await act(async () => { await result.current.save() })

    // A saved record and a working connection are two different things, and the
    // badge follows the second one.
    expect(result.current.connected).toBe(false)
    expect(result.current.capabilities).toBeNull()
    expect(result.current.lastSyncError).toBe(EN.unauthorized)
  })

  it('FE-DAWARICH-CONN-011: a save that answers with an empty body still counts as saved', async () => {
    const { result } = await mounted()
    // A 204 arrives as no body at all; the warning branch must not trip on it.
    api.saveSettings.mockResolvedValue(undefined)

    await act(async () => { await result.current.save() })

    expect(toast.success).toHaveBeenCalledWith(EN.saved)
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-CONN-012: a save whose follow-up read fails keeps the card as it was and still reports success', async () => {
    const { result } = await mounted()
    api.getSettings.mockRejectedValue(new Error('boom'))

    await act(async () => { await result.current.save() })

    // The write landed. Losing the refresh must not blank the badge, the
    // capabilities or the sync history that are still true.
    expect(result.current.connected).toBe(true)
    expect(result.current.capabilities).toEqual(CAPS)
    expect(result.current.lastSyncState).toBe('ok')
    expect(toast.success).toHaveBeenCalledWith(EN.saved)
  })

  it('FE-DAWARICH-CONN-013: the private-IP warning is rendered from its code, with the address the server resolved', async () => {
    const serverSentence = 'Dawarich resolved to 192.168.1.4, which is a private address.'
    const { result } = await mounted()
    api.saveSettings.mockResolvedValue({
      success: true,
      warning: serverSentence,
      warningCode: 'private_ip',
      warningIp: '192.168.1.4',
    })

    await act(async () => { await result.current.save() })

    const warned = lastToast(toast.warning)
    expect(warned).toContain('private IP (192.168.1.4)')
    // The fix belongs in the sentence, and it is the half a self-hoster needs.
    expect(warned).toContain('ALLOW_INTERNAL_NETWORK')
    // The server's own English never reaches the reader while the code is known.
    expect(warned).not.toBe(serverSentence)
    expect(toast.success).not.toHaveBeenCalled()

    // A coded warning with no address attached still translates; the slot is
    // filled with nothing rather than left as the literal "{ip}".
    api.saveSettings.mockResolvedValue({ success: true, warning: serverSentence, warningCode: 'private_ip' })
    await act(async () => { await result.current.save() })
    expect(lastToast(toast.warning)).toContain('private IP ()')
  })

  it('FE-DAWARICH-CONN-014: a warning code this build has no string for falls back to the server sentence', async () => {
    const { result } = await mounted()
    api.saveSettings.mockResolvedValue({
      success: true,
      warning: 'Heads up: that host answers very slowly.',
      warningCode: 'slow_host',
      warningIp: '10.0.0.9',
    })

    await act(async () => { await result.current.save() })
    // English prose beats a raw `dawarich.warning.slow_host` on the screen.
    expect(toast.warning).toHaveBeenCalledWith('Heads up: that host answers very slowly.')

    // An older server that attaches prose without a code at all.
    api.saveSettings.mockResolvedValue({ success: true, warning: 'Saved, but that address looks odd.' })
    await act(async () => { await result.current.save() })
    expect(toast.warning).toHaveBeenLastCalledWith('Saved, but that address looks odd.')

    // A warning is not a success: the card must not say both.
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-CONN-015: a rejected save is reported by code first, then by the server sentence, then generically', async () => {
    const { result } = await mounted()

    api.saveSettings.mockRejectedValue({
      response: { data: { code: 'unauthorized', error: 'Dawarich answered 401 for https://dawarich.example' } },
    })
    await act(async () => { await result.current.save() })
    // The code wins over the prose, which is English and quotes the URL back.
    expect(toast.error).toHaveBeenLastCalledWith(EN.unauthorized)

    api.saveSettings.mockRejectedValue({
      response: { data: { code: 'quota_exhausted', error: 'Quota exhausted until 14:00' } },
    })
    await act(async () => { await result.current.save() })
    expect(toast.error).toHaveBeenLastCalledWith('Quota exhausted until 14:00')

    // Not our envelope at all: a numeric code is ignored, the prose still reads.
    api.saveSettings.mockRejectedValue({ response: { data: { code: 409, error: 'conflict' } } })
    await act(async () => { await result.current.save() })
    expect(toast.error).toHaveBeenLastCalledWith('conflict')

    // Nothing usable anywhere in the error (a transport failure, typically).
    api.saveSettings.mockRejectedValue(new Error('Network Error'))
    await act(async () => { await result.current.save() })
    expect(toast.error).toHaveBeenLastCalledWith(EN.saveError)

    expect(result.current.saving).toBe(false)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-CONN-027: a rejection carrying no error object at all still reaches the reader as a sentence', async () => {
    const { result } = await mounted()
    // Not a shape axios produces on its own, but the optional chain at the top
    // of errorText() is there for it: an aborted or torn-down call rejects with
    // nothing, and reading .response off that would throw inside the catch,
    // which loses the toast entirely and rejects save() into whoever pressed
    // the button. The generic sentence is the floor, and it has to hold.
    api.saveSettings.mockRejectedValue(undefined)

    await act(async () => { await result.current.save() })

    expect(toast.error).toHaveBeenCalledWith(EN.saveError)
    expect(result.current.saving).toBe(false)
  })
})

describe('useDawarichConnection: the connection probe', () => {
  it('FE-DAWARICH-CONN-016: a successful probe reports the count in the panel and the toast, and adopts what it found', async () => {
    const { result } = await mounted(connection({ connected: false, capabilities: null }))
    act(() => {
      result.current.setUrl('  https://probe.example  ')
      result.current.setApiKey('k-123')
    })

    const probe = deferred<DawarichStatus>()
    api.test.mockReturnValue(probe.promise)
    let done!: Promise<void>
    act(() => { done = result.current.test() })
    expect(result.current.testing).toBe(true)

    await act(async () => {
      probe.resolve({ connected: true, visitCount: 12, capabilities: CAPS })
      await done
    })

    // The probe runs against what is typed, not against what is stored. That is
    // the whole point of testing before saving.
    expect(api.test).toHaveBeenCalledWith({
      url: 'https://probe.example',
      allowInsecureTls: false,
      apiKey: 'k-123',
    })
    expect(result.current.connected).toBe(true)
    expect(result.current.capabilities).toEqual(CAPS)
    expect(result.current.probeMessage).toBe(EN.probeOk(12))
    expect(toast.success).toHaveBeenCalledWith(EN.probeOk(12))
    expect(result.current.testing).toBe(false)
  })

  it('FE-DAWARICH-CONN-017: a probe that answers without a count or capabilities says zero and keeps what was known', async () => {
    const { result } = await mounted()
    api.test.mockResolvedValue({ connected: true })

    await act(async () => { await result.current.test() })

    // "Connected" with no number reads the same as a reachable instance holding
    // nothing at all, which is a genuinely different situation.
    expect(result.current.probeMessage).toBe(EN.probeOk(0))
    // A probe that reported no capabilities must not erase the stored ones.
    expect(result.current.capabilities).toEqual(CAPS)
  })

  it('FE-DAWARICH-CONN-018: a refused probe puts the reason in the panel and keeps the toast to one line', async () => {
    const { result } = await mounted()
    api.test.mockResolvedValue({
      connected: false,
      error: 'unreachable',
      errorDetail: 'self-signed certificate',
    })

    await act(async () => { await result.current.test() })

    expect(result.current.connected).toBe(false)
    // The detail is what separates "the host is down" from "we rejected the
    // certificate", and the self-hoster needs it to know which knob to turn.
    expect(result.current.probeMessage).toBe(`${EN.unreachable} (self-signed certificate)`)
    expect(toast.error).toHaveBeenCalledWith(EN.unreachable)
  })

  it('FE-DAWARICH-CONN-019: a refused probe with no reason at all still says something, and an unrecognised code does too', async () => {
    const { result } = await mounted()

    api.test.mockResolvedValue({ connected: false })
    await act(async () => { await result.current.test() })
    expect(result.current.probeMessage).toBe(EN.probeFailed)

    api.test.mockResolvedValue({ connected: false, error: 'quota_exhausted' })
    await act(async () => { await result.current.test() })
    expect(result.current.probeMessage).toBe(EN.unknown)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('FE-DAWARICH-CONN-020: a thrown probe clears the stale panel line first, then reports the coded reason or a generic one', async () => {
    const { result } = await mounted()
    api.test.mockResolvedValue({ connected: true, visitCount: 3 })
    await act(async () => { await result.current.test() })
    expect(result.current.probeMessage).toBe(EN.probeOk(3))

    const thrown = deferred<DawarichStatus>()
    api.test.mockReturnValue(thrown.promise)
    let done!: Promise<void>
    act(() => { done = result.current.test() })
    // A success belonging to the previous address must not sit under a probe of
    // the one being typed now.
    expect(result.current.probeMessage).toBeNull()

    await act(async () => {
      thrown.reject({ response: { data: { code: 'unauthorized' } } })
      await done
    })
    expect(result.current.probeMessage).toBe(EN.unauthorized)
    expect(toast.error).toHaveBeenLastCalledWith(EN.unauthorized)

    api.test.mockRejectedValue(new Error('Network Error'))
    await act(async () => { await result.current.test() })
    expect(result.current.probeMessage).toBe(EN.probeFailed)
    expect(result.current.testing).toBe(false)
  })
})

describe('useDawarichConnection: sync now', () => {
  it('FE-DAWARICH-CONN-021: a sync that is already running says so and invents no result', async () => {
    const { result } = await mounted(connection({ lastSyncState: 'partial', lastSyncError: 'unreachable' }))
    api.syncNow.mockResolvedValue({ state: 'running', created: 0, updated: 0, missing: 0, alreadyRunning: true })

    await act(async () => { await result.current.syncNow() })

    expect(toast.info).toHaveBeenCalledWith(EN.syncRunning)
    // Nothing finished, so nothing about the last run may move, least of all a
    // "0 new stays" that would read as this run's answer.
    expect(result.current.lastSyncAt).toBe('2026-09-01T07:00:00.000Z')
    expect(result.current.lastSyncState).toBe('partial')
    expect(result.current.lastSyncError).toBe(EN.unreachable)
    expect(toast.success).not.toHaveBeenCalled()
    expect(result.current.syncing).toBe(false)
  })

  it('FE-DAWARICH-CONN-022: a finished sync stamps the time, takes the server state and clears the previous error', async () => {
    const { result } = await mounted(connection({
      lastSyncAt: '2026-08-01T00:00:00.000Z',
      lastSyncState: 'failed',
      lastSyncError: 'unreachable',
    }))

    const run = deferred<{ state: string; created: number; updated: number; missing: number }>()
    api.syncNow.mockReturnValue(run.promise)
    const before = Date.now()
    let done!: Promise<void>
    act(() => { done = result.current.syncNow() })
    expect(result.current.syncing).toBe(true)

    await act(async () => {
      run.resolve({ state: 'partial', created: 3, updated: 1, missing: 2 })
      await done
    })

    // A partial run is not a clean one, so the server's word is kept rather than
    // flattened to "ok", but the stale failure underneath it has to go.
    expect(result.current.lastSyncState).toBe('partial')
    expect(result.current.lastSyncError).toBeNull()
    expect(Date.parse(result.current.lastSyncAt ?? '')).toBeGreaterThanOrEqual(before)
    expect(toast.success).toHaveBeenCalledWith(EN.synced(3))
    expect(result.current.syncing).toBe(false)
  })

  it('FE-DAWARICH-CONN-023: a sync answer without a state or a count is treated as a clean run that found nothing', async () => {
    const { result } = await mounted(connection({ lastSyncAt: null, lastSyncState: 'never' }))
    api.syncNow.mockResolvedValue({})

    await act(async () => { await result.current.syncNow() })

    expect(result.current.lastSyncState).toBe('ok')
    expect(result.current.lastSyncAt).not.toBeNull()
    expect(toast.success).toHaveBeenCalledWith(EN.synced(0))
  })

  it('FE-DAWARICH-CONN-024: a sync that throws marks the state failed and reports the coded reason, or a generic one', async () => {
    const { result } = await mounted()

    api.syncNow.mockRejectedValue({ response: { data: { code: 'unauthorized' } } })
    await act(async () => { await result.current.syncNow() })
    // The card has to stop claiming the last run was fine.
    expect(result.current.lastSyncState).toBe('failed')
    expect(toast.error).toHaveBeenCalledWith(EN.unauthorized)

    // An envelope whose `error` is an object rather than a sentence: unusable,
    // so the generic line stands instead of "[object Object]".
    api.syncNow.mockRejectedValue({ response: { data: { error: { reason: 'locked' } } } })
    await act(async () => { await result.current.syncNow() })
    expect(toast.error).toHaveBeenLastCalledWith(EN.syncError)
    expect(result.current.syncing).toBe(false)
  })
})

describe('useDawarichConnection: disconnect', () => {
  it('FE-DAWARICH-CONN-025: disconnect empties the card down to the probe message', async () => {
    const { result } = await mounted(connection({ lastSyncState: 'failed', lastSyncError: 'unreachable' }))
    act(() => result.current.setApiKey('k-123'))
    api.test.mockResolvedValue({ connected: true, visitCount: 1 })
    await act(async () => { await result.current.test() })
    expect(result.current.probeMessage).not.toBeNull()

    const drop = deferred<{ success: boolean }>()
    api.disconnect.mockReturnValue(drop.promise)
    let done!: Promise<void>
    act(() => { done = result.current.disconnect() })
    // Disconnect borrows the saving flag: both writes touch the same record, and
    // the card disables the same buttons for either.
    expect(result.current.saving).toBe(true)

    await act(async () => {
      drop.resolve({ success: true })
      await done
    })

    // Every leftover matters here: a stale probe line or sync history under an
    // empty form reads as a connection that is still half there.
    expect(result.current.url).toBe('')
    expect(result.current.apiKey).toBe('')
    expect(result.current.connected).toBe(false)
    expect(result.current.capabilities).toBeNull()
    expect(result.current.lastSyncAt).toBeNull()
    expect(result.current.lastSyncState).toBe('never')
    expect(result.current.lastSyncError).toBeNull()
    expect(result.current.probeMessage).toBeNull()
    expect(result.current.canSave).toBe(false)
    expect(result.current.saving).toBe(false)
    expect(toast.success).toHaveBeenCalledWith(EN.disconnected)
  })

  it('FE-DAWARICH-CONN-026: a failed disconnect leaves the connection on screen rather than pretending it is gone', async () => {
    const { result } = await mounted()

    api.disconnect.mockRejectedValue({ response: { data: { error: 'Database is locked' } } })
    await act(async () => { await result.current.disconnect() })

    expect(result.current.url).toBe('https://dawarich.example')
    expect(result.current.connected).toBe(true)
    expect(result.current.capabilities).toEqual(CAPS)
    expect(toast.error).toHaveBeenCalledWith('Database is locked')
    expect(result.current.saving).toBe(false)

    api.disconnect.mockRejectedValue(new Error('offline'))
    await act(async () => { await result.current.disconnect() })
    expect(toast.error).toHaveBeenLastCalledWith(EN.saveError)
    expect(result.current.connected).toBe(true)
  })
})
