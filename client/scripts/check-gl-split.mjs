import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Fails when a built chunk contains both WebGL map engines.
 *
 * mapbox-gl and maplibre-gl used to be static imports in the same three
 * components, so rollup emitted a single 2.8 MB chunk carrying both. Every map
 * user downloaded 1.8 MB of mapbox plus 1.1 MB of maplibre and ran one of them.
 * A stray static import anywhere in the map tree brings that straight back, and
 * nothing else would notice — the build stays green and the app still works.
 *
 * The markers are chosen to appear only inside the SDKs themselves, verified in
 * node_modules. Do NOT test for the bare string "maplibre": the provider value
 * 'maplibre-gl' and the setting key maplibre_style also appear in app code, so it
 * matches the shared core chunk too.
 */
const DIR = 'dist/assets'
const MAPBOX = 'events.mapbox.com' // 1 hit in mapbox-gl, 0 in maplibre-gl
const MAPLIBRE = 'maplibregl-canvas' // 2 hits in maplibre-gl, 0 in mapbox-gl

let mixed = 0
let found = 0

for (const file of readdirSync(DIR).filter(f => f.endsWith('.js'))) {
  const path = join(DIR, file)
  const src = readFileSync(path, 'utf8')
  const hasMapbox = src.includes(MAPBOX)
  const hasMaplibre = src.includes(MAPLIBRE)
  if (!hasMapbox && !hasMaplibre) continue

  found++
  const size = statSync(path).size
  if (hasMapbox && hasMaplibre) {
    console.error(`FAIL  both GL engines in one chunk: ${file} (${size} B)`)
    mixed++
  } else {
    console.log(`${hasMapbox ? 'mapbox  ' : 'maplibre'}  ${file}  ${size} B`)
  }
}

if (!found) {
  console.error('FAIL  no chunk contains either GL engine — did the build run?')
  process.exit(1)
}

process.exit(mixed ? 1 : 0)
