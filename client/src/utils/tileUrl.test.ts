import { describe, it, expect } from 'vitest'
import { normalizeTileUrl, withTileApiKey, stripTileApiKey, resolveTileUrl } from './tileUrl'

describe('normalizeTileUrl', () => {
  it('drops the {s} placeholder from an OSM template', () => {
    expect(normalizeTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'))
      .toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
  })

  it('rewrites a hard-coded shard host', () => {
    for (const shard of ['a', 'b', 'c', 'd']) {
      expect(normalizeTileUrl(`https://${shard}.tile.openstreetmap.org/{z}/{x}/{y}.png`))
        .toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
    }
  })

  it('rewrites a protocol-relative template', () => {
    // Older templates were often stored without a scheme so they'd follow the
    // page. Those reach the network just like the https ones, so the shard
    // rewrite has to see them too.
    expect(normalizeTileUrl('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'))
      .toBe('//tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(normalizeTileUrl('//d.tile.openstreetmap.org/{z}/{x}/{y}.png'))
      .toBe('//tile.openstreetmap.org/{z}/{x}/{y}.png')
  })

  it('keeps http and an explicit port', () => {
    expect(normalizeTileUrl('http://{s}.tile.openstreetmap.org:8080/{z}/{x}/{y}.png'))
      .toBe('http://tile.openstreetmap.org:8080/{z}/{x}/{y}.png')
  })

  it('leaves the already-correct host alone', () => {
    const url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    expect(normalizeTileUrl(url)).toBe(url)
  })

  it('leaves other providers untouched', () => {
    const carto = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    expect(normalizeTileUrl(carto)).toBe(carto)

    const osmDe = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png'
    expect(normalizeTileUrl(osmDe)).toBe(osmDe)
  })

  it('does not touch a look-alike host', () => {
    // Only the {s} placeholder and single shard letters are rewritten — a
    // self-hosted mirror keeps its own hostname.
    const mirror = 'https://mirror.tile.openstreetmap.org.example.com/{z}/{x}/{y}.png'
    expect(normalizeTileUrl(mirror)).toBe(mirror)

    const proxy = 'https://tiles.example.com/https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    expect(normalizeTileUrl(proxy)).toBe(proxy)
  })

  it('passes an empty template through', () => {
    expect(normalizeTileUrl('')).toBe('')
  })
})

const CARTO = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const CARTO_APEX = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SELF_HOSTED = 'https://tiles.example.com/basemaps/{z}/{x}/{y}.png'

describe('withTileApiKey', () => {
  it('appends the key to a sharded CARTO template', () => {
    expect(withTileApiKey(CARTO, 'abc123')).toBe(`${CARTO}?key=abc123`)
  })

  it('appends the key to the apex form and to a fixed shard', () => {
    expect(withTileApiKey(CARTO_APEX, 'abc123')).toBe(`${CARTO_APEX}?key=abc123`)
    expect(withTileApiKey('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', 'abc123'))
      .toBe('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=abc123')
  })

  it('leaves other providers untouched', () => {
    for (const url of [OSM, SATELLITE, SELF_HOSTED]) {
      expect(withTileApiKey(url, 'abc123')).toBe(url)
    }
  })

  it('is idempotent', () => {
    const once = withTileApiKey(CARTO, 'abc123')
    expect(withTileApiKey(once, 'abc123')).toBe(once)
    // A different key does not stack a second parameter either: the one already
    // in the template wins, so a double-wrapped URL stays valid.
    expect(withTileApiKey(once, 'other')).toBe(once)
  })

  it('passes the template through without a usable key', () => {
    expect(withTileApiKey(CARTO)).toBe(CARTO)
    expect(withTileApiKey(CARTO, '')).toBe(CARTO)
    expect(withTileApiKey(CARTO, null)).toBe(CARTO)
    expect(withTileApiKey('', 'abc123')).toBe('')
  })

  it('joins onto an existing query string with &', () => {
    const withQuery = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?attribution=none'
    expect(withTileApiKey(withQuery, 'abc123')).toBe(`${withQuery}&key=abc123`)
  })

  it('encodes the key', () => {
    expect(withTileApiKey(CARTO, 'a b&c=d')).toBe(`${CARTO}?key=a%20b%26c%3Dd`)
  })

  it('does not hand the key to a host that merely contains cartocdn', () => {
    // The security promise of the function: a template pointing somewhere else
    // must never turn into an outbound copy of the key.
    const lookalike = 'https://basemaps.cartocdn.com.example.org/light_all/{z}/{x}/{y}.png'
    expect(withTileApiKey(lookalike, 'abc123')).toBe(lookalike)

    const proxy = 'https://tiles.example.com/basemaps.cartocdn.com/{z}/{x}/{y}.png'
    expect(withTileApiKey(proxy, 'abc123')).toBe(proxy)
  })
})

describe('stripTileApiKey', () => {
  it('removes the key and keeps the other parameters', () => {
    expect(stripTileApiKey('https://basemaps.cartocdn.com/x.png?key=abc&lang=de'))
      .toBe('https://basemaps.cartocdn.com/x.png?lang=de')
    expect(stripTileApiKey('https://basemaps.cartocdn.com/x.png?lang=de&key=abc'))
      .toBe('https://basemaps.cartocdn.com/x.png?lang=de')
  })

  it('keeps a parameter that only ends in key', () => {
    const url = 'https://tiles.example.com/x.png?monkey=1'
    expect(stripTileApiKey(url)).toBe(url)
  })

  it('passes a URL without a key through', () => {
    expect(stripTileApiKey(CARTO)).toBe(CARTO)
    expect(stripTileApiKey('')).toBe('')
  })

  it('leaves no dangling ? or &', () => {
    expect(stripTileApiKey(`${CARTO}?key=abc`)).toBe(CARTO)
    expect(stripTileApiKey('https://basemaps.cartocdn.com/x.png?key=abc'))
      .toBe('https://basemaps.cartocdn.com/x.png')
    expect(stripTileApiKey('https://basemaps.cartocdn.com/x.png?key=abc&a=1'))
      .not.toContain('?&')
  })

  it('undoes withTileApiKey', () => {
    expect(stripTileApiKey(withTileApiKey(CARTO, 'abc123'))).toBe(CARTO)
  })
})

describe('resolveTileUrl', () => {
  it('falls back on an empty or blank template', () => {
    expect(resolveTileUrl('', OSM)).toBe(OSM)
    expect(resolveTileUrl('   ', OSM)).toBe(OSM)
    expect(resolveTileUrl(null, OSM)).toBe(OSM)
    expect(resolveTileUrl(undefined, OSM)).toBe(OSM)
  })

  it('prefers a configured template over the fallback', () => {
    expect(resolveTileUrl(SELF_HOSTED, OSM)).toBe(SELF_HOSTED)
    expect(resolveTileUrl(`  ${SELF_HOSTED}  `, OSM)).toBe(SELF_HOSTED)
  })

  it('still normalizes the retired OSM shard host', () => {
    expect(resolveTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', CARTO)).toBe(OSM)
    expect(resolveTileUrl('', 'https://d.tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe(OSM)
  })

  it('appends the key when the result is a CARTO host', () => {
    expect(resolveTileUrl('', CARTO, 'abc123')).toBe(`${CARTO}?key=abc123`)
    expect(resolveTileUrl(CARTO_APEX, OSM, 'abc123')).toBe(`${CARTO_APEX}?key=abc123`)
    // A self-hosted template reaches the network without the key, even when the
    // fallback would have been CARTO.
    expect(resolveTileUrl(SELF_HOSTED, CARTO, 'abc123')).toBe(SELF_HOSTED)
  })
})
