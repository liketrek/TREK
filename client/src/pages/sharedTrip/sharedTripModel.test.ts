import { describe, it, expect } from 'vitest'
import { formatDurationMinutes, isHttpUrl, linkHost } from './sharedTripModel'

describe('sharedTripModel (#2320)', () => {
  it('accepts http and https and nothing else', () => {
    expect(isHttpUrl('https://a.example/x')).toBe(true)
    expect(isHttpUrl(' http://a.example ')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:text/html,hi')).toBe(false)
    expect(isHttpUrl('ftp://a.example')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(42)).toBe(false)
  })

  it('writes a planned stay as minutes, hours, or both', () => {
    expect(formatDurationMinutes(45)).toBe('45 min')
    expect(formatDurationMinutes(60)).toBe('1 h')
    expect(formatDurationMinutes(150)).toBe('2 h 30 min')
    expect(formatDurationMinutes(89.6)).toBe('1 h 30 min')
  })

  it('writes nothing for a missing, zero or nonsense figure', () => {
    expect(formatDurationMinutes(null)).toBeNull()
    expect(formatDurationMinutes(undefined)).toBeNull()
    expect(formatDurationMinutes(0)).toBeNull()
    expect(formatDurationMinutes(-5)).toBeNull()
    expect(formatDurationMinutes(Number.NaN)).toBeNull()
  })

  it('labels a link by its host, without the www', () => {
    expect(linkHost('https://www.bahn.example/booking/abc')).toBe('bahn.example')
    expect(linkHost('https://booking.example')).toBe('booking.example')
    expect(linkHost('nonsense')).toBe('nonsense')
  })
})
