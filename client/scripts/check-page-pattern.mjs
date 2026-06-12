// Guards the "Page = wiring container + data hook" convention (see
// src/pages/PATTERN.md). A *Page.tsx default-export component should wire a
// co-located use<Page>() hook into JSX — it must not own state/effects itself.
//
// We scan only the default-export component body (from `export default function`
// up to the next top-level `function` declaration or EOF), so presentational
// sub-components and helper hooks living in the same file are not flagged.
// Context hooks like useTranslation/useParams are fine; the smell is stateful
// logic — useState/useReducer/useEffect/useLayoutEffect/useMemo/useCallback/useRef.
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pages')
const BANNED = ['useState', 'useReducer', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback', 'useRef']
const bannedRe = new RegExp(`\\b(${BANNED.join('|')})\\s*\\(`)

const violations = []
for (const file of readdirSync(pagesDir)) {
  if (!file.endsWith('Page.tsx') || file.endsWith('.test.tsx')) continue
  const src = readFileSync(join(pagesDir, file), 'utf8')
  const lines = src.split('\n')
  const start = lines.findIndex(l => /export default function/.test(l))
  if (start === -1) continue
  // The page body ends at the next top-level declaration (a `function` at
  // column 0) — everything after that is a sub-component or helper.
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^(function |const [A-Z]\w* = )/.test(lines[i])) { end = i; break }
  }
  for (let i = start; i < end; i++) {
    if (bannedRe.test(lines[i])) {
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
