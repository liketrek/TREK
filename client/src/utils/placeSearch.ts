import type { Place } from '../types'

type Searchable = Pick<Place, 'name' | 'address' | 'description' | 'notes'>

/**
 * Whether a place matches the search box of the places list (#2252). Name and
 * address as before, and also the description and the notes, so a place found
 * by what was written about it ("vegan", "book ahead") turns up too. One helper
 * for the desktop list, its filter counts and the phone's browser, so the three
 * can never disagree about what a search finds.
 */
export function placeMatchesSearch(place: Searchable, query: string): boolean {
  return textMatchesSearch([place.name, place.address, place.description, place.notes], query)
}

/** The combining accents of Latin script (U+0300 to U+036F), the marks NFD splits off a letter. */
const LATIN_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g')

/** Letters that carry their mark in the letter itself, so taking the marks off leaves them as they are. */
const FOLDED_LETTERS: Record<string, string> = { ß: 'ss', ø: 'o', æ: 'ae', œ: 'oe', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' }

/**
 * Text as a search compares it: lower case and without accents, so "Obidos" finds
 * "Óbidos", "Sao Bras" finds "São Brás" and the other way round (#3075). Only
 * Latin marks go: a kana's voicing mark or a Hangul syllable stays whole, since
 * there it changes the word.
 */
export function foldForSearch(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(LATIN_MARKS, '')
    .replace(/[ßøæœłđðþı]/g, ch => FOLDED_LETTERS[ch] ?? ch)
    .normalize('NFC')
}

/** Whether any of the fields holds the query, accents and case aside. An empty query matches everything. */
export function textMatchesSearch(fields: readonly (string | null | undefined)[], query: string): boolean {
  const q = foldForSearch(query.trim())
  if (!q) return true
  return fields.some(field => !!field && foldForSearch(field).includes(q))
}
