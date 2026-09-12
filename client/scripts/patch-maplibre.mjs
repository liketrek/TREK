import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const packagePath = require.resolve('maplibre-gl/package.json')
const { version } = JSON.parse(readFileSync(packagePath, 'utf8'))

if (version !== '5.24.0') throw new Error('Recheck the MapLibre sanitizer backport before changing its version')

// Backport maplibre-gl-js#8189 without removing WebGL1 support in version 6.
const loops = [
  ['of elem.attributes)', 'of Array.from(elem.attributes))'],
  ['of e.attributes)', 'of Array.from(e.attributes))'],
]

for (const filename of [
  'src/util/dom.ts',
  'dist/maplibre-gl.js',
  'dist/maplibre-gl-dev.js',
  'dist/maplibre-gl-csp.js',
  'dist/maplibre-gl-csp-dev.js',
]) {
  const target = join(dirname(packagePath), filename)
  const code = readFileSync(target, 'utf8')
  const loop = loops.find(([before, after]) => code.includes(before) || code.includes(after))
  if (!loop) throw new Error(`MapLibre sanitizer loop not found in ${filename}`)
  const [before, after] = loop
  if (code.split(before).length === 1 && code.split(after).length === 2) continue
  if (code.split(before).length !== 2 || code.includes(after)) {
    throw new Error(`Unexpected MapLibre sanitizer in ${filename}`)
  }
  writeFileSync(target, code.replace(before, after))
}
