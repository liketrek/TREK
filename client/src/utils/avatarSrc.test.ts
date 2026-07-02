import { describe, it, expect } from 'vitest'
import { avatarSrc } from './avatarSrc'

describe('avatarSrc', () => {
  it('prefixes an uploaded file name with the avatars path', () => {
    expect(avatarSrc('abc123.jpg')).toBe('/uploads/avatars/abc123.jpg')
  })

  it('passes an absolute https URL (OIDC picture) through untouched', () => {
    expect(avatarSrc('https://idp.example.com/u/pic.png')).toBe('https://idp.example.com/u/pic.png')
  })

  it('returns null for empty input', () => {
    expect(avatarSrc(null)).toBeNull()
    expect(avatarSrc(undefined)).toBeNull()
    expect(avatarSrc('')).toBeNull()
  })
})
