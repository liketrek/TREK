import { describe, it, expect } from 'vitest'
import { cleanEndpointName } from './reservationName'

// The pattern this replaced. Kept here so the equivalence claim in the module
// is a test rather than a comment.
const LEGACY = /\s*\([^)]*\)/g

describe('cleanEndpointName', () => {
  it('drops the parenthetical a booking confirmation appends', () => {
    expect(cleanEndpointName('Wien Hbf (Vienna)')).toBe('Wien Hbf')
  })

  it('leaves an unclosed bracket alone', () => {
    expect(cleanEndpointName('Gare de Lyon (Paris')).toBe('Gare de Lyon (Paris')
  })

  it('takes the whitespace directly before the bracket with it', () => {
    expect(cleanEndpointName('Zurich HB   (ZRH)   ')).toBe('Zurich HB')
  })

  it('handles several brackets and an empty one', () => {
    expect(cleanEndpointName('A (b) C () D')).toBe('A C D')
  })

  it('returns a name without brackets untouched', () => {
    expect(cleanEndpointName('Amsterdam Centraal')).toBe('Amsterdam Centraal')
  })

  it('does not hang on the input that made the regex quadratic', () => {
    // 32k spaces with no "(" after them: the shape that froze the map for
    // every member of a trip once one member had typed it.
    const started = performance.now()
    expect(cleanEndpointName(' '.repeat(32_000) + 'x')).toBe('x')
    expect(performance.now() - started).toBeLessThan(100)
  })

  it('agrees with the regex on every generated name', () => {
    const alphabet = [...'ab() \t']
    let checked = 0
    for (let len = 0; len <= 6; len++) {
      const total = alphabet.length ** len
      for (let n = 0; n < total; n++) {
        let s = ''
        for (let k = n, i = 0; i < len; i++, k = Math.floor(k / alphabet.length)) {
          s += alphabet[k % alphabet.length]
        }
        expect(cleanEndpointName(s)).toBe(s.replace(LEGACY, '').trim())
        checked++
      }
    }
    expect(checked).toBe(55987)
  })
})
