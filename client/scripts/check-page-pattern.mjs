// Guards the "Page = wiring container + data hook" convention (see
// src/pages/PATTERN.md). A *Page.tsx default-export component should wire a
// co-located use<Page>() hook into JSX — it must not own state/effects itself.
//
// We scan the default-export component body (from `export default function` up
// to the next top-level `function` declaration or EOF), and the same span of a
// top-level `*PageDesktop`/`*PageMobile` — since ViewportRoute started picking
// the branch, the default export is a two-line shim and the real container is
// one of those two. Everything else at top level stays exempt: presentational
// sub-components and helper hooks live in these files on purpose.
// Context hooks like useTranslation/useParams are fine; the smell is stateful
// logic — useState/useReducer/useEffect/useLayoutEffect/useMemo/useCallback/useRef.
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages')
const BANNED = ['useState', 'useReducer', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef']
// `[<(]` rather than `\(`: a generic call — `useRef<() => void>(null)` — is the
// same thing, and it slipped through for as long as the pattern only knew `(`.
const bannedRe = new RegExp(`\\b(${BANNED.join('|')})\\s*[<(]`)

// Declarations the widened scan caught that are not this change's to move.
// Listed by the name they declare rather than by line, so an entry dies with
// its declaration instead of drifting onto whatever follows it. The rest of
// each listed file is still checked.
const KNOWN_ESCAPES = {
  'TripPlannerPage.tsx': ['glMap', 'bookingExpense'],
}

const violations = []
for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith('Page.tsx') || file.endsWith('.test.tsx')) continue
  const src = readFileSync(join(pagesDir, file), 'utf8')
  const lines = src.split('\n')
  const allowed = KNOWN_ESCAPES[file] ?? []
  const starts = []
  lines.forEach((line, i) => {
    if (/export default function/.test(line) || /^function \w+Page(Desktop|Mobile)\b/.test(line)) starts.push(i)
  })
  for (const start of starts) {
    // The page body ends at the next top-level declaration (a `function` at
    // column 0) — everything after that is a sub-component or helper.
    let end = lines.length
    for (let i = start + 1; i < lines.length; i++) {
      if (/^(function |const [A-Z]\w* = )/.test(lines[i])) { end = i; break }
    }
    for (let i = start; i < end; i++) {
      if (!bannedRe.test(lines[i])) continue
      if (allowed.some(name => new RegExp(`\\b${name}\\b`).test(lines[i]))) continue
      violations.push(`${file}:${i + 1}  ${lines[i].trim()}`)
    }
  }
}

if (violations.length > 0) {
  console.error('Page-pattern violations — move this state/effect logic into the page\'s use<Page>() hook:\n')
  for (const v of violations) console.error('  ' + v)
  console.error(`\n${violations.length} violation(s). See src/pages/PATTERN.md.`)
  process.exit(1)
}
console.log('Page pattern OK — no state/effect logic in page containers.')
