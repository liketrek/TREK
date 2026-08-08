import { describe, it, expect } from 'vitest'
import { normalizeTileUrl } from './tileUrl'

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
