import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { directionOf, pickLocale, translator } from '../../../native-shell/i18n'

// FE-NATIVE-SHELL-001 to FE-NATIVE-SHELL-006
//
// The app's own first screens (client/native-shell): which language and reading
// direction they start in, and the layout rules in shell.css that no component
// test reaches (jsdom applies no stylesheet, so these read the real file).

/** Every rule of a stylesheet as its selector list, its declarations and the media query around it, comments dropped. */
function rules(css: string): { selectors: string[]; body: string; media: string }[] {
  const out: { selectors: string[]; body: string; media: string }[] = []
  const stack: string[] = []
  let buf = ''
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') {
      stack.push(buf.trim())
      buf = ''
    } else if (ch === '}') {
      const head = stack.pop() ?? ''
      if (!head.startsWith('@')) {
        const media = stack.filter(h => h.startsWith('@media')).join(' ')
        out.push({ selectors: head.split(',').map(sel => sel.trim()), body: buf, media })
      }
      buf = ''
    } else {
      buf += ch
    }
  }
  return out
}

const css = readFileSync(resolve(process.cwd(), 'native-shell/shell.css'), 'utf8')
const all = rules(css)
const find = (selector: string, media?: RegExp) =>
  all.filter(r => r.selectors.includes(selector) && (!media || media.test(r.media)))

describe('native shell', () => {
  it('FE-NATIVE-SHELL-001: Arabic and Hebrew start right to left, every other language left to right', () => {
    expect(pickLocale(['ar-SA'])).toBe('ar')
    expect(pickLocale(['he-IL'])).toBe('he')
    expect(directionOf('ar')).toBe('rtl')
    expect(directionOf('he')).toBe('rtl')
    expect(directionOf('ru')).toBe('ltr')
    expect(directionOf('de')).toBe('ltr')
  })

  it('FE-NATIVE-SHELL-002: the first screens speak without dashes as punctuation', () => {
    for (const code of ['en', 'de']) {
      const t = translator(code)
      for (const key of ['native.welcome.sub', 'native.cloud.sub', 'native.cloud.f3']) {
        expect(t(key)).not.toMatch(/[\u2013\u2014]| - /)
      }
    }
  })

  it('FE-NATIVE-SHELL-003: Russian keeps TREK\'s faces through Cyrillic stand-ins under the same family names', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
    const cyrillic = faces.filter(f => /unicode-range:\s*U\+0301, U\+0400-045F/.test(f))
    expect(cyrillic.filter(f => /font-family:\s*'Poppins'/.test(f))).toHaveLength(3)
    expect(cyrillic.filter(f => /font-family:\s*'MuseoModerno'/.test(f))).toHaveLength(1)
    for (const face of cyrillic) {
      const file = /url\('\.\/fonts\/([^']+)'\)/.exec(face)?.[1]
      expect(file).toBeTruthy()
      expect(() => readFileSync(resolve(process.cwd(), 'native-shell/fonts', file as string))).not.toThrow()
    }
  })

  it('FE-NATIVE-SHELL-004: a short screen on its side puts the two halves of a screen side by side', () => {
    const compact = /orientation: landscape\) and \(max-height: 500px\)/
    expect(find('.screen:has(> .col)', compact)[0]?.body).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/)
    expect(find('.col-about', compact)[0]?.body).toMatch(/position:\s*sticky/)
    // Everywhere else the halves are no boxes of their own: one column, as before.
    expect(find('.col')[0]?.body).toMatch(/display:\s*contents/)
  })

  it('FE-NATIVE-SHELL-005: a screen taller than the window scrolls instead of overflowing both edges', () => {
    expect(find('.screen')[0]?.body).toMatch(/margin-block:\s*auto/)
    const shell = find('.shell')[0]?.body ?? ''
    expect(shell).toMatch(/overflow-x:\s*clip/)
    expect(shell).not.toMatch(/justify-content:\s*center/)
  })

  it('FE-NATIVE-SHELL-006: in Arabic the chevrons sit at the far edge and point along the reading direction, the price stands apart', () => {
    expect(find('.btn .chev')[0]?.body).toMatch(/margin-inline-start:\s*auto/)
    expect(find(":root[dir='rtl'] .chev")[0]?.body).toMatch(/transform:\s*scaleX\(-1\)/)
    expect(find('.plan-price small')[0]?.body).toMatch(/margin-inline-start:\s*7px/)
    expect(find('.btn-row')[0]?.body).toMatch(/text-align:\s*start/)
    expect(css).not.toMatch(/margin-left|margin-right|padding-left|padding-right|text-align:\s*left/)
  })
})
