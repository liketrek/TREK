// FE-COMP-PLUGINS-ACT-001 to -006 — the shared instance-settings hook, action side.
import { act, renderHook, waitFor } from '@testing-library/react'
import { adminApi } from '../../api/client'
import { useInstanceSettings } from './useInstanceSettings'

vi.mock('../shared/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const FIELDS = [{ key: 'apiUrl', label: 'API URL', input_type: 'text', required: false, secret: false }]
const PURGE = { key: 'purge', label: 'Purge', danger: true, scope: 'instance' as const }
const PING = { key: 'ping', label: 'Ping', danger: false, scope: 'instance' as const }

beforeEach(() => {
  vi.spyOn(adminApi, 'pluginConfig').mockResolvedValue({ fields: FIELDS, config: { apiUrl: 'https://a.example' }, actions: [PING, PURGE] })
  vi.spyOn(adminApi, 'pluginSaveConfig').mockResolvedValue({ config: { apiUrl: 'https://b.example' }, restarted: false })
  vi.spyOn(adminApi, 'runPluginAction').mockResolvedValue({ ok: true, message: 'pong' })
})
afterEach(() => vi.restoreAllMocks())

async function opened(active = true) {
  const hook = renderHook(() => useInstanceSettings())
  act(() => hook.result.current.open('p', active))
  await waitFor(() => expect(hook.result.current.form).not.toBeNull())
  return hook
}

/** A promise this test controls the settling of, to pin down state mid-flight. */
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

describe('useInstanceSettings — actions', () => {
  it('FE-COMP-PLUGINS-ACT-001: open carries the instance actions, the active flag, and a clean form', async () => {
    const { result } = await opened()
    expect(result.current.form?.actions).toEqual([PING, PURGE])
    expect(result.current.form?.active).toBe(true)
    expect(result.current.form?.dirty).toBe(false)
  })

  it('FE-COMP-PLUGINS-ACT-002: a clean form runs the action straight away and keeps the dialog open', async () => {
    const { result } = await opened()
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(result.current.actionResult.ping).toEqual({ ok: true, message: 'pong' }))
    expect(adminApi.pluginSaveConfig).not.toHaveBeenCalled()
    expect(adminApi.runPluginAction).toHaveBeenCalledWith('p', 'ping')
    expect(result.current.form).not.toBeNull()
    expect(result.current.runningAction).toBeNull()
  })

  it('FE-COMP-PLUGINS-ACT-003: a dirty form saves first, then runs, and is clean afterwards', async () => {
    const { result } = await opened()
    act(() => result.current.setValue('apiUrl', 'https://b.example'))
    expect(result.current.form?.dirty).toBe(true)
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(result.current.actionResult.ping).toBeDefined())
    expect(adminApi.pluginSaveConfig).toHaveBeenCalledWith('p', { apiUrl: 'https://b.example' })
    expect(vi.mocked(adminApi.pluginSaveConfig).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(adminApi.runPluginAction).mock.invocationCallOrder[0])
    expect(result.current.form?.dirty).toBe(false)
    expect(result.current.form).not.toBeNull()
  })

  it('FE-COMP-PLUGINS-ACT-004: a save failure surfaces in error and the action never runs', async () => {
    vi.mocked(adminApi.pluginSaveConfig).mockRejectedValue({ response: { data: { error: 'nope' } } })
    const { result } = await opened()
    act(() => result.current.setValue('apiUrl', 'x'))
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(result.current.error).toBe('nope'))
    expect(adminApi.runPluginAction).not.toHaveBeenCalled()
  })

  it('FE-COMP-PLUGINS-ACT-005: a danger action waits for confirmation; cancel drops it, confirm runs it', async () => {
    const { result } = await opened()
    act(() => result.current.runAction(PURGE))
    expect(result.current.pendingAction).toEqual(PURGE)
    expect(adminApi.runPluginAction).not.toHaveBeenCalled()
    act(() => result.current.cancelPendingAction())
    expect(result.current.pendingAction).toBeNull()
    act(() => result.current.runAction(PURGE))
    act(() => result.current.confirmPendingAction())
    await waitFor(() => expect(adminApi.runPluginAction).toHaveBeenCalledWith('p', 'purge'))
    expect(result.current.pendingAction).toBeNull()
  })

  it('FE-COMP-PLUGINS-ACT-006: an inactive plugin never posts, and a failed result is stored as such', async () => {
    const { result } = await opened(false)
    act(() => result.current.runAction(PING))
    await new Promise(r => setTimeout(r, 0))
    expect(adminApi.runPluginAction).not.toHaveBeenCalled()

    vi.mocked(adminApi.runPluginAction).mockResolvedValue({ ok: false, message: 'credentials rejected' })
    const active = await opened(true)
    act(() => active.result.current.runAction(PING))
    await waitFor(() => expect(active.result.current.actionResult.ping).toEqual({ ok: false, message: 'credentials rejected' }))
  })

  it('FE-COMP-PLUGINS-ACT-007: an edit made while the pre-action save is in flight is not clobbered when dirty clears', async () => {
    const savePromise = deferred<{ config: Record<string, unknown>; restarted: boolean }>()
    vi.mocked(adminApi.pluginSaveConfig).mockReturnValue(savePromise.promise)
    const { result } = await opened()
    act(() => result.current.setValue('apiUrl', 'https://a-edit.example'))
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(adminApi.pluginSaveConfig).toHaveBeenCalledWith('p', { apiUrl: 'https://a-edit.example' }))

    // A concurrent edit lands while the save is still pending.
    act(() => result.current.setValue('apiUrl', 'https://b-edit.example'))

    await act(async () => {
      savePromise.resolve({ config: { apiUrl: 'https://a-edit.example' }, restarted: false })
      await savePromise.promise
    })

    await waitFor(() => expect(adminApi.runPluginAction).toHaveBeenCalledWith('p', 'ping'))
    expect(result.current.form?.dirty).toBe(true)
    expect(result.current.form?.values.apiUrl).toBe('https://b-edit.example')
  })

  it('FE-COMP-PLUGINS-ACT-008: an in-flight action from a closed dialog does not leak into the next one', async () => {
    const runPromise = deferred<{ ok: boolean; message?: string }>()
    vi.mocked(adminApi.runPluginAction).mockReturnValueOnce(runPromise.promise)
    const { result } = await opened()
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(adminApi.runPluginAction).toHaveBeenCalledWith('p', 'ping'))

    act(() => result.current.close())
    act(() => result.current.open('q', true))
    await waitFor(() => expect(result.current.form?.id).toBe('q'))
    expect(result.current.runningAction).toBeNull()

    act(() => result.current.runAction(PING))
    await waitFor(() => expect(adminApi.runPluginAction).toHaveBeenCalledWith('q', 'ping'))
    await waitFor(() => expect(result.current.actionResult.ping).toEqual({ ok: true, message: 'pong' }))

    // The stale request from the closed dialog settles after the fact — it must not overwrite the new dialog's result.
    await act(async () => {
      runPromise.resolve({ ok: true, message: 'stale pong' })
      await runPromise.promise
    })
    expect(result.current.actionResult.ping).toEqual({ ok: true, message: 'pong' })
  })

  it('FE-COMP-PLUGINS-ACT-009: a 404 "Plugin is not active" from the server (DB active, no live child) shows the inactive message and flips active off', async () => {
    vi.mocked(adminApi.runPluginAction).mockRejectedValue({ response: { status: 404, data: { error: 'Plugin is not active' } } })
    const { result } = await opened(true)
    expect(result.current.form?.active).toBe(true)
    act(() => result.current.runAction(PING))
    await waitFor(() => expect(result.current.actionResult.ping).toEqual({ ok: false, message: 'admin.plugins.actions.inactive' }))
    expect(result.current.form?.active).toBe(false)
    expect(result.current.runningAction).toBeNull()
  })
})
