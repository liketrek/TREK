#!/usr/bin/env node
/**
 * Extracts client locale files into per-namespace files under shared/src/i18n/{locale}/.
 * Run with: npx tsx scripts/migrate-i18n.mts
 *
 * Safe to re-run — locale dirs are cleaned first. Hand-authored files
 * (types.ts, languages.ts, index.ts) in shared/src/i18n/ are never touched.
 */
import { mkdir, rm, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSLATIONS_DIR = join(ROOT, 'client/src/i18n/translations')
const I18N_OUT = join(ROOT, 'shared/src/i18n')

// Maps locale code → source filename (without .ts) in client/src/i18n/translations/
const LOCALE_FILE_MAP: Record<string, string> = {
  de: 'de', en: 'en', es: 'es', fr: 'fr', hu: 'hu',
  it: 'it', tr: 'tr', ru: 'ru', zh: 'zh', 'zh-TW': 'zhTw',
  nl: 'nl', id: 'id', ar: 'ar', br: 'br', cs: 'cs',
  pl: 'pl', ja: 'ja', ko: 'ko', uk: 'uk',
}

type TranslationValue = string | { name: string; category: string }[]
type LocaleStrings = Record<string, TranslationValue>

async function loadLocale(code: string): Promise<LocaleStrings> {
  const filename = LOCALE_FILE_MAP[code]
  if (!filename) throw new Error(`Unknown locale code: ${code}`)
  const file = join(TRANSLATIONS_DIR, `${filename}.ts`)
  const mod = await import(pathToFileURL(file).href)
  return mod.default as LocaleStrings
}

function serializeValue(value: TranslationValue, innerIndent: string): string {
  if (Array.isArray(value)) {
    // Pretty-print the array then re-indent each line after the first
    const lines = JSON.stringify(value, null, 2).split('\n')
    return lines.map((l, i) => (i === 0 ? l : innerIndent + l)).join('\n')
  }
  return JSON.stringify(value)
}

async function writeLocaleDir(code: string, strings: LocaleStrings): Promise<void> {
  const outDir = join(I18N_OUT, code)
  await mkdir(outDir, { recursive: true })

  // Group keys by top-level namespace prefix (everything before the first dot)
  const namespaces = new Map<string, Array<[string, TranslationValue]>>()
  for (const [key, value] of Object.entries(strings)) {
    const ns = key.split('.')[0] ?? key
    if (!namespaces.has(ns)) namespaces.set(ns, [])
    namespaces.get(ns)!.push([key, value])
  }

  // Write one file per namespace
  for (const [ns, entries] of namespaces) {
    const lines: string[] = [
      `import type { TranslationStrings } from '../types'`,
      ``,
      `const ${ns}: TranslationStrings = {`,
      ...entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${serializeValue(v, '    ')},`),
      `}`,
      `export default ${ns}`,
    ]
    await writeFile(join(outDir, `${ns}.ts`), lines.join('\n') + '\n')
  }

  // Write index.ts that merges all namespace files into a single locale object
  const nsNames = [...namespaces.keys()]
  const indexLines: string[] = [
    ...nsNames.map(ns => `import ${ns} from './${ns}'`),
    ``,
    `const locale = {`,
    ...nsNames.map(ns => `  ...${ns},`),
    `}`,
    `export default locale`,
  ]
  await writeFile(join(outDir, 'index.ts'), indexLines.join('\n') + '\n')
}

async function main(): Promise<void> {
  console.log('Loading English base...')
  const en = await loadLocale('en')
  const codes = Object.keys(LOCALE_FILE_MAP)

  // Clean existing locale dirs; leave hand-authored files (types.ts, languages.ts, index.ts) alone
  await Promise.all(codes.map(code => rm(join(I18N_OUT, code), { recursive: true, force: true })))

  for (const code of codes) {
    process.stdout.write(`Processing ${code}...`)
    let strings = await loadLocale(code)

    if (code === 'ar') {
      // ar.ts spreads en — keep only keys that ar actually translates (value differs from en)
      const pruned: LocaleStrings = {}
      for (const [key, val] of Object.entries(strings)) {
        if (JSON.stringify(val) !== JSON.stringify(en[key])) {
          pruned[key] = val
        }
      }
      strings = pruned
      console.log(` ${Object.keys(strings).length} own keys (pruned from ${Object.keys(en).length} en total)`)
    } else {
      const nsCount = new Set(Object.keys(strings).map(k => k.split('.')[0])).size
      console.log(` ${Object.keys(strings).length} keys, ${nsCount} namespaces`)
    }

    await writeLocaleDir(code, strings)
  }

  console.log('\nDone! Run: cd shared && npm run build')
}

main().catch(err => { console.error(err); process.exit(1) })
