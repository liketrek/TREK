/**
 * Runtime-resolved base path for the SPA.
 *
 * Source of truth is `document.baseURI`, which reflects the `<base href>`
 * tag injected by the server. Under Home Assistant Ingress the server
 * rewrites `<base href="/">` to `<base href="/api/hassio_ingress/<token>/">`
 * per-request, so every runtime URL derived from this module transparently
 * picks up the subpath. In standalone deployments `BASE_PATH` is `'/'` and
 * these helpers collapse to their previous hardcoded behaviour.
 */

export function computeBasePath(): string {
  try {
    const p = new URL(document.baseURI).pathname
    return p.endsWith('/') ? p : p + '/'
  } catch {
    return '/'
  }
}

export const BASE_PATH = computeBasePath()

export function withBase(p: string): string {
  const stripped = BASE_PATH.replace(/\/$/, '')
  return p.startsWith('/') ? stripped + p : stripped + '/' + p
}

export const API_BASE = withBase('/api')

export function wsUrl(token: string): string {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${scheme}://${location.host}${withBase('/ws')}?token=${token}`
}

export const ROUTER_BASENAME = BASE_PATH === '/' ? undefined : BASE_PATH.replace(/\/$/, '')

/** True iff served under Home Assistant Ingress. */
export function isIngress(): boolean {
  return BASE_PATH.startsWith('/api/hassio_ingress/')
}

/** Strip the runtime base prefix from an absolute pathname. */
export function stripBase(pathname: string): string {
  if (!ROUTER_BASENAME) return pathname
  if (pathname === ROUTER_BASENAME) return '/'
  if (pathname.startsWith(ROUTER_BASENAME + '/')) return pathname.slice(ROUTER_BASENAME.length)
  return pathname
}
