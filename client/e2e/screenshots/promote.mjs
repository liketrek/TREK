// Moves captured screenshots from the staging directory into wiki/assets/,
// downscaling and re-encoding on the way.
//
// Captures are taken at 1440px CSS width with deviceScaleFactor 2, i.e. 2880px
// of raw pixels. The wiki renders images at roughly 800–1000px, so shipping
// 2880px costs ~10x the bytes for detail nobody sees — that is how the existing
// assets reached 26 MB (one GIF alone is 9.1 MB). 1600px keeps the image sharp
// on HiDPI displays at the size it is actually shown.
//
// Usage:  node e2e/screenshots/promote.mjs [--dry]
import sharp from 'sharp'
import { readdirSync, mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

const SRC = path.join(process.cwd(), 'e2e', '.tmp', 'shots')
const DEST = path.join(process.cwd(), '..', 'wiki', 'assets')
const MAX_WIDTH = 1600
const dry = process.argv.includes('--dry')

mkdirSync(DEST, { recursive: true })

const files = readdirSync(SRC).filter(f => f.endsWith('.png'))
if (!files.length) {
  console.error(`No screenshots in ${SRC} — run \`npm run shots\` first.`)
  process.exit(1)
}

let before = 0
let after = 0

for (const file of files.sort()) {
  const src = path.join(SRC, file)
  const dest = path.join(DEST, file)
  const srcBytes = statSync(src).size
  before += srcBytes

  const img = sharp(src)
  const { width } = await img.metadata()

  const pipeline = sharp(src)
    .resize({ width: Math.min(width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })

  const buf = await pipeline.toBuffer()
  after += buf.length

  const pct = Math.round((1 - buf.length / srcBytes) * 100)
  console.log(
    `${dry ? '[dry] ' : ''}${file.padEnd(28)} ${kb(srcBytes).padStart(8)} → ${kb(buf.length).padStart(8)}  (-${pct}%)`,
  )
  if (!dry) await sharp(buf).toFile(dest)
}

console.log(`\n${files.length} files: ${kb(before)} → ${kb(after)} (-${Math.round((1 - after / before) * 100)}%)`)
if (dry) console.log('Dry run — nothing written. Drop --dry to promote into wiki/assets/.')

function kb(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}
