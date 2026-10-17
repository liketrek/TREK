// Moves the help-center media from the staging directory into public/help-media/,
// re-encoding the PNG captures to WebP on the way.
//
// Captures are 2x (3840px wide for a full frame). The panel shows a step
// picture at ~600px and a full frame at ~1000px, on HiDPI displays, so 1440px
// and 1920px keep them sharp at a fraction of the bytes. WebP rather than PNG
// on purpose: the service worker precaches `png`, and help pictures must not
// ride along in every visitor's first download.
//
// Usage:  node e2e/help/promote.mjs [--dry]
import sharp from 'sharp'
import { readdirSync, mkdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const SRC = path.join(process.cwd(), 'e2e', '.tmp', 'help-media')
const DEST = path.join(process.cwd(), 'public', 'help-media')
const STEP_WIDTH = 1440
const FRAME_WIDTH = 1920
const dry = process.argv.includes('--dry')

if (!existsSync(SRC)) {
  console.error(`No media in ${SRC} — run \`npm run help:media\` first.`)
  process.exit(1)
}


let before = 0
let after = 0
let files = 0

async function picture(src, dest, width) {
  const bytes = statSync(src).size
  before += bytes
  if (dry) {
    console.log(`  ${path.relative(SRC, src)} → ${path.relative(DEST, dest)} (${(bytes / 1024).toFixed(0)} KB)`)
    return
  }
  const img = sharp(src)
  const meta = await img.metadata()
  const pipeline = (meta.width ?? 0) > width ? img.resize({ width }) : img
  await pipeline.webp({ quality: 84, effort: 5 }).toFile(dest)
  after += statSync(dest).size
  files++
}

mkdirSync(DEST, { recursive: true })

for (const dir of readdirSync(SRC)) {
  const from = path.join(SRC, dir)
  if (!statSync(from).isDirectory() || dir.startsWith('.')) continue
  const to = path.join(DEST, dir)
  mkdirSync(to, { recursive: true })
  for (const file of readdirSync(from)) {
    if (path.extname(file) !== '.png') continue
    const width = file.startsWith('step-') ? STEP_WIDTH : FRAME_WIDTH
    await picture(path.join(from, file), path.join(to, file.replace(/\.png$/, '.webp')), width)
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(dry ? `dry run: ${mb(before)} MB in staging` : `promoted ${files} files: ${mb(before)} MB → ${mb(after)} MB in ${path.relative(process.cwd(), DEST)}`)
