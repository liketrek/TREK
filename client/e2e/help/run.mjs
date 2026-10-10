// `npm run help:media`: the help-center media run on its own port pair, so it
// can record while `npm run dev` keeps serving 5173/3001 to whoever is
// watching. The ports travel as environment variables because Playwright's
// workers re-read the config, and only the environment reaches all of them.
//
// Extra arguments go straight to Playwright, e.g.
//   npm run help:media -- --grep "pictures"
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

// The guides that show another service (AirTrail, Dawarich, a document store,
// the booking extractor) take its address and key from e2e/help/media.env,
// KEY=VALUE per line, which is not committed. media.env.example lists them.
// The file is read here so the backend inherits it too (server-launch.mjs
// spreads this environment): ALLOW_INTERNAL_NETWORK and the extractor path
// live in the same place.
function mediaEnv() {
  const file = path.join(process.cwd(), 'e2e', 'help', 'media.env')
  if (!existsSync(file)) return {}
  const out = {}
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return out
}

// The day the pictures are taken on, fixed once for the whole run so the seed
// project and every worker agree even across midnight (see e2e/dates.ts).
function today() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const fromFile = mediaEnv()
const env = {
  ...fromFile,
  ...process.env,
  E2E_WEB_PORT: process.env.E2E_WEB_PORT || '5183',
  E2E_API_PORT: process.env.E2E_API_PORT || '3011',
  // The shell wins, then media.env (a day pinned there keeps a picture set
  // consistent across several runs), then today.
  E2E_PICTURE_DAY: process.env.E2E_PICTURE_DAY || fromFile.E2E_PICTURE_DAY || today(),
}
// The CLI's own entry, run by this node: no shell in between, so a --grep
// pattern with a `|` reaches Playwright untouched.
const cli = createRequire(import.meta.url).resolve('@playwright/test/cli')
const res = spawnSync(process.execPath, [cli, 'test', '--project=help-media', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
})
process.exit(res.status ?? 1)
