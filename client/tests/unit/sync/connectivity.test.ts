// FE-SYNC-CONNECTIVITY: probeNow must tell a genuine offline (network error —
// never tear down the SW) apart from an edge-proxy auth wall (#1346).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { probeNow } from '../../../src/sync/connectivity'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, configurable: true })
}

function fetchReturns(res: Partial<Response>): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res as Response))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  setOnline(true)
})

describe('FE-SYNC-CONNECTIVITY: probeNow offline vs proxy-wall (#1346)', () => {
  it('FE-SYNC-CONNECTIVITY-001: navigator.onLine false → "offline"', async () => {
    setOnline(false)
    expect(await probeNow()).toBe('offline')
  })

  it('FE-SYNC-CONNECTIVITY-002: fetch throws (network error) → "offline" (must NOT unregister the SW)', async () => {
    setOnline(true)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await probeNow()).toBe('offline')
  })

  it('FE-SYNC-CONNECTIVITY-003: ok JSON health → "online"', async () => {
    setOnline(true)
    fetchReturns({ type: 'basic', ok: true, headers: new Headers({ 'content-type': 'application/json' }) })
    expect(await probeNow()).toBe('online')
  })

  it('FE-SYNC-CONNECTIVITY-004: cross-origin auth redirect (CF Access) → "proxy-wall"', async () => {
    setOnline(true)
    fetchReturns({ type: 'opaqueredirect', ok: false, headers: new Headers() })
    expect(await probeNow()).toBe('proxy-wall')
  })

  it('FE-SYNC-CONNECTIVITY-005: HTML auth wall (Pangolin 200) → "proxy-wall"', async () => {
    setOnline(true)
    fetchReturns({ type: 'basic', ok: true, headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }) })
    expect(await probeNow()).toBe('proxy-wall')
  })

  it('FE-SYNC-CONNECTIVITY-006: edge 401/403 (non-JSON) → "proxy-wall"', async () => {
    setOnline(true)
    fetchReturns({ type: 'basic', ok: false, headers: new Headers({ 'content-type': 'text/html' }) })
    expect(await probeNow()).toBe('proxy-wall')
  })
})
