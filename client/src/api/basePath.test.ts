import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// The module reads `document.baseURI` at import time. Each test resets the
// module registry and installs a fresh `<base href>` before re-importing.

function setBaseHref(href: string): void {
  const existing = document.querySelector('base')
  if (existing) existing.remove()
  const tag = document.createElement('base')
  tag.setAttribute('href', href)
  document.head.prepend(tag)
}

describe('basePath (standalone deployment)', () => {
  beforeEach(() => {
    setBaseHref('/')
    vi.resetModules()
  })
  afterEach(() => {
    document.querySelector('base')?.remove()
  })

  it('resolves BASE_PATH to "/"', async () => {
    const mod = await import('./basePath')
    expect(mod.BASE_PATH).toBe('/')
  })

  it('ROUTER_BASENAME is undefined so BrowserRouter keeps default behaviour', async () => {
    const mod = await import('./basePath')
    expect(mod.ROUTER_BASENAME).toBeUndefined()
  })

  it('API_BASE is /api and withBase is identity for leading-slash paths', async () => {
    const mod = await import('./basePath')
    expect(mod.API_BASE).toBe('/api')
    expect(mod.withBase('/login')).toBe('/login')
    expect(mod.withBase('/settings?mfa=required')).toBe('/settings?mfa=required')
  })

  it('wsUrl uses ws:// when protocol is http', async () => {
    const mod = await import('./basePath')
    const url = mod.wsUrl('abc')
    expect(url.startsWith('ws://')).toBe(true)
    expect(url.endsWith('/ws?token=abc')).toBe(true)
  })
})

describe('basePath (Home Assistant Ingress deployment)', () => {
  beforeEach(() => {
    setBaseHref('/api/hassio_ingress/TOKEN/')
    vi.resetModules()
  })
  afterEach(() => {
    document.querySelector('base')?.remove()
  })

  it('reads BASE_PATH from <base href>', async () => {
    const mod = await import('./basePath')
    expect(mod.BASE_PATH).toBe('/api/hassio_ingress/TOKEN/')
  })

  it('ROUTER_BASENAME strips trailing slash for BrowserRouter', async () => {
    const mod = await import('./basePath')
    expect(mod.ROUTER_BASENAME).toBe('/api/hassio_ingress/TOKEN')
  })

  it('API_BASE is prefixed', async () => {
    const mod = await import('./basePath')
    expect(mod.API_BASE).toBe('/api/hassio_ingress/TOKEN/api')
  })

  it('withBase prefixes absolute paths correctly', async () => {
    const mod = await import('./basePath')
    expect(mod.withBase('/login')).toBe('/api/hassio_ingress/TOKEN/login')
    expect(mod.withBase('/ws')).toBe('/api/hassio_ingress/TOKEN/ws')
  })

  it('wsUrl embeds the prefixed path', async () => {
    const mod = await import('./basePath')
    expect(mod.wsUrl('xyz')).toContain('/api/hassio_ingress/TOKEN/ws?token=xyz')
  })
})

describe('basePath (base href without trailing slash)', () => {
  beforeEach(() => {
    setBaseHref('/trek')
    vi.resetModules()
  })
  afterEach(() => {
    document.querySelector('base')?.remove()
  })

  it('normalises BASE_PATH with a trailing slash', async () => {
    const mod = await import('./basePath')
    expect(mod.BASE_PATH).toBe('/trek/')
    expect(mod.ROUTER_BASENAME).toBe('/trek')
    expect(mod.API_BASE).toBe('/trek/api')
  })
})
