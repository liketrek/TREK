// FE-NATIVE-HANDOFF-001 to FE-NATIVE-HANDOFF-008
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '../../../tests/helpers/render'
import { MemoryRouter } from 'react-router'
import { resetAllStores } from '../../../tests/helpers/store'
import { useAuthStore } from '../../store/authStore'
import { nativeAuthApi } from '../../api/nativeAuth'
import { useNativeHandoff } from './useNativeHandoff'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../../api/nativeAuth', () => ({ nativeAuthApi: { handoff: vi.fn() } }))

const challenge = 'ab'.repeat(32)
const realLocation = window.location
const logout = vi.fn(async () => {})

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...realLocation, search, href: 'http://localhost/native-handoff' + search, replace: vi.fn() },
  })
}

function renderHandoff() {
  return renderHook(() => useNativeHandoff(), {
    wrapper: ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>,
  })
}

beforeEach(() => {
  resetAllStores()
  mockNavigate.mockClear()
  logout.mockClear()
  vi.mocked(nativeAuthApi.handoff).mockReset()
  sessionStorage.clear()
  setSearch(`?challenge=${challenge}`)
  useAuthStore.setState({ isLoading: false, isAuthenticated: true, user: { id: 1, username: 'maria' } as never, logout })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation })
})

describe('useNativeHandoff', () => {
  it('FE-NATIVE-HANDOFF-001: is ready for a signed-in user with a valid challenge', () => {
    const { result } = renderHandoff()
    expect(result.current.valid).toBe(true)
    expect(result.current.ready).toBe(true)
    expect(result.current.userName).toBe('maria')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('FE-NATIVE-HANDOFF-002: rejects a malformed challenge and does nothing with it', () => {
    setSearch('?challenge=nope')
    useAuthStore.setState({ isAuthenticated: false })
    const { result } = renderHandoff()
    expect(result.current.valid).toBe(false)
    expect(result.current.ready).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('FE-NATIVE-HANDOFF-003: sends a visitor to the login page and back here afterwards', () => {
    useAuthStore.setState({ isAuthenticated: false })
    renderHandoff()
    expect(mockNavigate).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent(`/native-handoff?challenge=${challenge}`)}`,
      { replace: true },
    )
  })

  it('FE-NATIVE-HANDOFF-004: starts SSO straight away when the app asked for it, without looping', () => {
    setSearch(`?challenge=${challenge}&start=oidc`)
    useAuthStore.setState({ isAuthenticated: false })
    renderHandoff()
    expect(window.location.replace).toHaveBeenCalledWith('/api/auth/oidc/login?remember=1')
    expect(sessionStorage.getItem('oidc_redirect')).toBe(`/native-handoff?challenge=${challenge}`)
  })

  it('FE-NATIVE-HANDOFF-005: waits while the session is still being checked', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: true })
    const { result } = renderHandoff()
    expect(result.current.ready).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('FE-NATIVE-HANDOFF-006: only mints the code on the tap, then hands it to the app scheme', async () => {
    vi.mocked(nativeAuthApi.handoff).mockResolvedValue({ code: 'c/1' })
    const { result } = renderHandoff()
    expect(nativeAuthApi.handoff).not.toHaveBeenCalled()

    await act(async () => { await result.current.openApp() })

    expect(nativeAuthApi.handoff).toHaveBeenCalledWith(challenge)
    expect(window.location.href).toBe('com.liketrek.trek://auth?code=c%2F1')
  })

  it('FE-NATIVE-HANDOFF-007: reports a failed hand-off', async () => {
    vi.mocked(nativeAuthApi.handoff).mockRejectedValue(new Error('401'))
    const { result } = renderHandoff()
    await act(async () => { await result.current.openApp() })
    expect(result.current.status).toBe('failed')
  })

  it('FE-NATIVE-HANDOFF-008: lets the user switch accounts and come back', async () => {
    const { result } = renderHandoff()
    await act(async () => { await result.current.switchAccount() })
    expect(logout).toHaveBeenCalled()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent(`/native-handoff?challenge=${challenge}`)}`,
      { replace: true },
    ))
  })
})
