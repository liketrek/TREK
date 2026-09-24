import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fromOfflineUrl, installOfflineProtocol, offlineProtocol, offlineStyle, rewriteDocument, toOfflineUrl,
} from './offlineTiles'
import { isNativeIos } from './platform'

vi.mock('./platform', () => ({ isNativeIos: vi.fn() }))

const cached = new Map<string, Response>()
const cache = { match: vi.fn(async (url: string) => cached.get(url)?.clone()) }

beforeEach(() => {
  cached.clear()
  vi.mocked(isNativeIos).mockReturnValue(true)
  vi.stubGlobal('caches', { open: vi.fn(async () => cache) })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function params(url: string, type: 'json' | 'arrayBuffer' | 'image' | 'string') {
  return { url, type }
}

describe('URL rewriting', () => {
  it('moves https URLs onto the protocol and back, and leaves everything else', () => {
    expect(toOfflineUrl('https://tiles.openfreemap.org/styles/positron')).toBe('trek-offline://tiles.openfreemap.org/styles/positron')
    expect(fromOfflineUrl('trek-offline://tiles.openfreemap.org/styles/positron')).toBe('https://tiles.openfreemap.org/styles/positron')
    expect(toOfflineUrl('mapbox://styles/mapbox/streets-v12')).toBe('mapbox://styles/mapbox/streets-v12')
    expect(fromOfflineUrl('https://x.test/a')).toBe('https://x.test/a')
  })

  it('rewrites the style only inside the iOS app with Cache Storage', () => {
    const style = 'https://tiles.openfreemap.org/styles/liberty?key=abc'
    expect(offlineStyle(style)).toBe('trek-offline://tiles.openfreemap.org/styles/liberty?key=abc')
    expect(offlineStyle({ version: 8 })).toEqual({ version: 8 })

    vi.mocked(isNativeIos).mockReturnValue(false)
    expect(offlineStyle(style)).toBe(style)

    vi.mocked(isNativeIos).mockReturnValue(true)
    vi.stubGlobal('caches', undefined)
    expect(offlineStyle(style)).toBe(style)
  })

  it('points sources, tiles, glyphs and sprites of a style at the protocol', () => {
    expect(rewriteDocument({
      version: 8,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sprite: [{ id: 'default', url: 'https://tiles.openfreemap.org/sprites/ofm' }, 'odd'],
      sources: {
        openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
        inline: { type: 'raster', tiles: ['https://a.test/{z}/{x}/{y}.png', 7] },
        broken: null,
      },
      layers: [],
    })).toEqual({
      version: 8,
      glyphs: 'trek-offline://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sprite: [{ id: 'default', url: 'trek-offline://tiles.openfreemap.org/sprites/ofm' }, 'odd'],
      sources: {
        openmaptiles: { type: 'vector', url: 'trek-offline://tiles.openfreemap.org/planet' },
        inline: { type: 'raster', tiles: ['trek-offline://a.test/{z}/{x}/{y}.png', 7] },
        broken: null,
      },
      layers: [],
    })
  })

  it('handles a TileJSON, a single sprite URL and things that are not documents', () => {
    expect(rewriteDocument({ tiles: ['https://t.test/20250101/{z}/{x}/{y}.pbf'] })).toEqual({ tiles: ['trek-offline://t.test/20250101/{z}/{x}/{y}.pbf'] })
    expect(rewriteDocument({ sprite: 'https://s.test/sprite' })).toEqual({ sprite: 'trek-offline://s.test/sprite' })
    expect(rewriteDocument('x')).toBe('x')
    expect(rewriteDocument([1])).toEqual([1])
  })
})

describe('offlineProtocol', () => {
  it('answers a document from the network and rewrites it', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ tiles: ['https://t.test/{z}/{x}/{y}.pbf'] })))
    vi.stubGlobal('fetch', fetchMock)
    const result = await offlineProtocol(params('trek-offline://t.test/planet', 'json'), new AbortController())
    expect(fetchMock).toHaveBeenCalledWith('https://t.test/planet', expect.objectContaining({ mode: 'cors' }))
    expect(result.data).toEqual({ tiles: ['trek-offline://t.test/{z}/{x}/{y}.pbf'] })
  })

  it('falls back to the cached document when the network is gone', async () => {
    cached.set('https://t.test/style', new Response(JSON.stringify({ version: 8 })))
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    const result = await offlineProtocol(params('trek-offline://t.test/style', 'json'), new AbortController())
    expect(result.data).toEqual({ version: 8 })
  })

  it('serves tiles from the cache without asking the network', async () => {
    cached.set('https://t.test/1/2/3.pbf', new Response(new Uint8Array([1, 2, 3])))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await offlineProtocol(params('trek-offline://t.test/1/2/3.pbf', 'arrayBuffer'), new AbortController())
    expect(new Uint8Array(result.data as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches an uncached tile, and returns text for string requests', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('hello')))
    const tile = await offlineProtocol(params('trek-offline://t.test/9/9/9.png', 'image'), new AbortController())
    expect(new TextDecoder().decode(tile.data as ArrayBuffer)).toBe('hello')
    const text = await offlineProtocol(params('trek-offline://t.test/a.txt', 'string'), new AbortController())
    expect(text.data).toBe('hello')
  })

  it('fails loudly on an uncached tile offline or an HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    await expect(offlineProtocol(params('trek-offline://t.test/0/0/0.pbf', 'arrayBuffer'), new AbortController())).rejects.toThrow('offline')

    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })))
    await expect(offlineProtocol(params('trek-offline://t.test/0/0/0.pbf', 'arrayBuffer'), new AbortController())).rejects.toThrow('HTTP 404')
    await expect(offlineProtocol(params('trek-offline://t.test/style', 'json'), new AbortController())).rejects.toThrow('Not available offline')
  })

  it('passes an abort straight through for documents', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'AbortError') }))
    await expect(offlineProtocol(params('trek-offline://t.test/style', 'json'), controller)).rejects.toThrow('aborted')
  })
})

describe('installOfflineProtocol', () => {
  it('registers only inside the iOS app', () => {
    const addProtocol = vi.fn()
    installOfflineProtocol({ addProtocol })
    expect(addProtocol).toHaveBeenCalledWith('trek-offline', offlineProtocol)

    addProtocol.mockClear()
    vi.mocked(isNativeIos).mockReturnValue(false)
    installOfflineProtocol({ addProtocol })
    expect(addProtocol).not.toHaveBeenCalled()
  })
})
