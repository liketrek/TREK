import { describe, expect, it } from 'vitest'
import type { TranslationStrings } from '@trek/shared/i18n'
import { resolveTemplate } from './resolveTemplate'

const ru = {
  'x.places': '{count} места',
  'x.places.one': '{count} место',
  'x.places.few': '{count} места',
  'x.places.many': '{count} мест',
} as unknown as TranslationStrings

describe('resolveTemplate', () => {
  it('picks the form the language selects, not count === 1', () => {
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 1 })).toBe('{count} место')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 21 })).toBe('{count} место')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 3 })).toBe('{count} места')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 5 })).toBe('{count} мест')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 11 })).toBe('{count} мест')
  })

  it('a form the locale does not spell out falls back to its general form, never to English', () => {
    const ja = { 'x.places': '{count}件の場所' } as unknown as TranslationStrings
    expect(resolveTemplate(ja, 'ja', 'x.places', { count: 1 })).toBe('{count}件の場所')
    const ruWithoutMany = { 'x.places': '{count} места', 'x.places.one': '{count} место' } as unknown as TranslationStrings
    expect(resolveTemplate(ruWithoutMany, 'ru', 'x.places', { count: 5 })).toBe('{count} места')
    // A key English has forms for: count 1 is "one" in English too, and still
    // the locale's own general form wins over English's .one.
    const jaPlaces = { 'places.count': '{count}件' } as unknown as TranslationStrings
    expect(resolveTemplate(jaPlaces, 'ja', 'places.count', { count: 1 })).toBe('{count}件')
    const ruPlaces = { 'places.count': '{count} мест' } as unknown as TranslationStrings
    expect(resolveTemplate(ruPlaces, 'ru', 'places.count', { count: 1 })).toBe('{count} мест')
  })

  it('a key the locale lacks resolves in English with English rules', () => {
    // 'places.count' and its .one form ship in en.
    const empty = {} as TranslationStrings
    expect(resolveTemplate(empty, 'ru', 'places.count', { count: 1 })).toBe('{count} place')
    expect(resolveTemplate(empty, 'ru', 'places.count', { count: 2 })).toBe('{count} places')
    // Where the locale's rule and English's differ: Russian puts 21 and French
    // puts 0 in "one", English puts both in "other".
    expect(resolveTemplate(empty, 'ru', 'places.count', { count: 21 })).toBe('{count} places')
    expect(resolveTemplate(empty, 'fr', 'places.count', { count: 0 })).toBe('{count} places')
  })

  it('reads n when there is no count, and ignores a count that is not a number', () => {
    expect(resolveTemplate(ru, 'ru', 'x.places', { n: 5 })).toBe('{count} мест')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: 'five' })).toBe('{count} места')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: '1,5' })).toBe('{count} места')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: '' })).toBe('{count} места')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: Number.NaN })).toBe('{count} места')
  })

  it('a whole number sent as text still picks its form, as in-app notification params arrive', () => {
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: '21' })).toBe('{count} место')
    expect(resolveTemplate(ru, 'ru', 'x.places', { count: '5' })).toBe('{count} мест')
  })

  it('a group with only category keys still resolves, and an unknown key is the key', () => {
    const groupOnly = { 'x.stays.one': 'one stay', 'x.stays.other': '{count} stays' } as unknown as TranslationStrings
    expect(resolveTemplate(groupOnly, 'en', 'x.stays', { count: 1 })).toBe('one stay')
    expect(resolveTemplate(groupOnly, 'en', 'x.stays', { count: 4 })).toBe('{count} stays')
    expect(resolveTemplate(groupOnly, 'en', 'x.nothing', { count: 4 })).toBe('x.nothing')
    expect(resolveTemplate(groupOnly, 'en', 'x.nothing')).toBe('x.nothing')
  })
})
