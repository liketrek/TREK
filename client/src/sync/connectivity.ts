const PROBE_INTERVAL_MS = 30_000
const PROBE_TIMEOUT_MS = 1_500

// Three distinct outcomes so callers can tell a genuine offline (the request
// never reached a server — never tear down offline infrastructure) apart from an
// edge-proxy auth wall (CF Access / Pangolin intercept /api — a top-level reload
// is needed so the proxy can run its auth flow).
export type ProbeState = 'online' | 'offline' | 'proxy-wall'

let reachable = true
const listeners = new Set<(v: boolean) => void>()

function setReachable(v: boolean): void {
  if (reachable === v) return
  reachable = v
  listeners.forEach(fn => fn(v))
}

async function probe(): Promise<ProbeState> {
  if (!navigator.onLine) { setReachable(false); return 'offline' }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS)
    const res = await fetch('/api/health', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      // Surface a cross-origin auth redirect (CF Access) as an opaque redirect
      // instead of letting it throw — that's a positive proxy signal, not offline.
      redirect: 'manual',
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (res.type === 'opaqueredirect') { setReachable(false); return 'proxy-wall' }
    const ct = res.headers.get('content-type') || ''
    if (res.ok && ct.includes('application/json')) { setReachable(true); return 'online' }
    // A real HTTP response that isn't our health JSON (e.g. Pangolin's HTML 200
    // auth wall, or an edge 401/403) means the proxy is reachable but gating us.
    setReachable(false)
    return 'proxy-wall'
  } catch {
    // fetch threw → the request never completed: genuinely offline (or the server
    // is down). Must NOT be treated as a proxy wall — that would unregister the SW.
    setReachable(false)
    return 'offline'
  }
}

export function startConnectivityProbe(): void {
  void probe()
  setInterval(() => { void probe() }, PROBE_INTERVAL_MS)
  window.addEventListener('online', () => { void probe() })
  window.addEventListener('offline', () => setReachable(false))
}

export function isReachable(): boolean { return reachable }
export function probeNow(): Promise<ProbeState> { return probe() }
export function onChange(fn: (v: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
