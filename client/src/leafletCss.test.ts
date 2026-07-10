import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Leaflet's stylesheet must be bundled, not loaded from unpkg: the service
// worker cached the CDN response as opaque and the browser then rejected it,
// leaving the Atlas and trip maps blank (#1497). These checks keep the CDN
// reference from sneaking back in.
describe('leaflet css self-hosting (#1497)', () => {
  // Vitest runs with the client package as its root, so cwd is stable here.
  const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8')

  it('index.html no longer references unpkg', () => {
    const html = read('index.html')
    expect(html).not.toMatch(/unpkg\.com/i)
    expect(html).not.toMatch(/leaflet/i)
  })

  it('main.tsx imports the bundled leaflet css before the app styles', () => {
    const main = read('src/main.tsx')
    const leafletAt = main.indexOf("import 'leaflet/dist/leaflet.css'")
    const indexAt = main.indexOf("import './index.css'")
    expect(leafletAt).toBeGreaterThan(-1)
    expect(indexAt).toBeGreaterThan(-1)
    // index.css overrides .leaflet-* styles, so order matters.
    expect(leafletAt).toBeLessThan(indexAt)
  })

  it('the service worker has no runtime-caching rule for unpkg', () => {
    expect(read('vite.config.js')).not.toMatch(/unpkg/i)
  })
})
