// FE-W4UTL-001 to FE-W4UTL-006
import { describe, it, expect } from 'vitest'
import { getApiErrorMessage } from './apiError'

describe('getApiErrorMessage', () => {
  it('FE-W4UTL-001: returns the server-provided error string', () => {
    const err = { response: { data: { error: 'Places API (New) has not been used in project 42' } } }
    expect(getApiErrorMessage(err, 'fallback')).toBe('Places API (New) has not been used in project 42')
  })

  it('FE-W4UTL-002: falls back when the error field is missing', () => {
    expect(getApiErrorMessage({ response: { data: {} } }, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage({ response: {} }, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage({}, 'fallback')).toBe('fallback')
  })

  it('FE-W4UTL-003: falls back for null/undefined errors', () => {
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage(undefined, 'fallback')).toBe('fallback')
  })

  it('FE-W4UTL-004: falls back for a whitespace-only server message', () => {
    expect(getApiErrorMessage({ response: { data: { error: '   ' } } }, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage({ response: { data: { error: '' } } }, 'fallback')).toBe('fallback')
  })

  it('FE-W4UTL-005: falls back for a non-string server message', () => {
    expect(getApiErrorMessage({ response: { data: { error: { code: 500 } } } }, 'fallback')).toBe('fallback')
    expect(getApiErrorMessage({ response: { data: { error: 42 } } }, 'fallback')).toBe('fallback')
  })

  it('FE-W4UTL-006: keeps surrounding whitespace of a real message', () => {
    expect(getApiErrorMessage({ response: { data: { error: ' boom ' } } }, 'fallback')).toBe(' boom ')
  })
})
