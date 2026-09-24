/**
 * Renders the native apps' icon and splash sources into assets/, from the
 * white TREK mark in public/icons/icon-white.svg. `npx @capacitor/assets
 * generate --android --ios` then turns them into every size both platforms
 * ask for (see the icons:app script).
 *
 * The look: a dark, slightly glassy tile (a soft light from the top left and a
 * sheen over the upper half) under the white mark. Dark because that is the
 * app's launch background (#09090b) and its default scheme.
 *
 * Android's adaptive icon masks the foreground to a circle inside the
 * canvas, so the mark there sits smaller than on the iOS tile.
 */
import { mkdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const clientDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(clientDir, 'assets')
mkdirSync(outDir, { recursive: true })

const source = readFileSync(join(clientDir, 'public', 'icons', 'icon-white.svg'), 'utf8')
const markPath = [...source.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]).find((d) => d.length > 500)
if (!markPath) throw new Error('No mark path found in icon-white.svg')
// The mark's extent inside its 1500 x 1500 viewBox.
const MARK = { x: 40, y: 5, w: 1420, h: 1490 }

const LAUNCH_BG = '#09090b'

function tile(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a2a31"/>
      <stop offset="0.55" stop-color="#141418"/>
      <stop offset="1" stop-color="#08080a"/>
    </linearGradient>
    <radialGradient id="light" cx="0.22" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.48" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="depth" cx="0.8" cy="0.95" r="0.7">
      <stop offset="0" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#base)"/>
  <rect width="1024" height="1024" fill="url(#depth)"/>
  <rect width="1024" height="1024" fill="url(#light)"/>
  <rect width="1024" height="1024" fill="url(#sheen)"/>
</svg>`
}

/** The white mark, `share` of the canvas tall, centred, with a soft shadow for depth. */
function mark(size, share, shadow = true) {
  const scale = (1024 * share) / MARK.h
  const w = MARK.w * scale
  const h = MARK.h * scale
  const tx = (1024 - w) / 2 - MARK.x * scale
  const ty = (1024 - h) / 2 - MARK.y * scale
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e7e7ec"/>
    </linearGradient>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <g ${shadow ? 'filter="url(#lift)"' : ''}>
    <path transform="translate(${tx} ${ty}) scale(${scale})" fill="url(#ink)" d="${markPath}"/>
  </g>
</svg>`
}

async function render(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, file))
}

async function composite(background, overlay, file, size) {
  const base = await sharp(Buffer.from(background)).resize(size, size).png().toBuffer()
  const top = await sharp(Buffer.from(overlay)).resize(size, size).png().toBuffer()
  await sharp(base).composite([{ input: top }]).flatten({ background: LAUNCH_BG }).png().toFile(join(outDir, file))
}

// iOS and store listings: one opaque tile, the mark at about half its height.
await composite(tile(1024), mark(1024, 0.5), 'icon-only.png', 1024)
// Android adaptive icon: the two layers apart, the mark inside the safe circle.
await render(tile(1024), 'icon-background.png')
await render(mark(1024, 0.58), 'icon-foreground.png')
// Splash: the launch background with the mark, light and dark alike.
const splashBg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732"><rect width="2732" height="2732" fill="${LAUNCH_BG}"/></svg>`
await composite(splashBg, mark(2732, 0.2, false), 'splash.png', 2732)
await composite(splashBg, mark(2732, 0.2, false), 'splash-dark.png', 2732)

console.log(`[app-icons] wrote icon and splash sources to ${outDir}`)
