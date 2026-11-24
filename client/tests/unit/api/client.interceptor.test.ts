// FE-CLIENT-INTERCEPTOR-001 to FE-CLIENT-INTERCEPTOR-015
import { describe, it, expect } from 'vitest'
import { isAuthPublicPath } from '../../../src/api/client'

describe('FE-CLIENT-INTERCEPTOR: 401 AUTH_REQUIRED redirect allowlist', () => {
  describe('exact-match public paths — no redirect', () => {
    it('FE-CLIENT-INTERCEPTOR-001: /login', () => {
      expect(isAuthPublicPath('/login')).toBe(true)
    })

    it('FE-CLIENT-INTERCEPTOR-002: /register', () => {
      expect(isAuthPublicPath('/register')).toBe(true)
    })

    it('FE-CLIENT-INTERCEPTOR-003: /forgot-password', () => {
      expect(isAuthPublicPath('/forgot-password')).toBe(true)
    })

    it('FE-CLIENT-INTERCEPTOR-004: /reset-password', () => {
      expect(isAuthPublicPath('/reset-password')).toBe(true)
    })

    it('FE-CLIENT-INTERCEPTOR-015: /native-handoff, which signs in by itself', () => {
      expect(isAuthPublicPath('/native-handoff')).toBe(true)
    })
  })

  describe('prefix-match public paths — no redirect', () => {
    it('FE-CLIENT-INTERCEPTOR-005: /shared/:token', () => {
      expect(isAuthPublicPath('/shared/abc123token')).toBe(true)
    })

    it('FE-CLIENT-INTERCEPTOR-006: /public/journey/:token', () => {
      expect(isAuthPublicPath('/public/journey/xyz789')).toBe(true)
    })
  })

  describe('paths that matched via includes() before fix — must redirect', () => {
    it('FE-CLIENT-INTERCEPTOR-007: /admin/login', () => {
      expect(isAuthPublicPath('/admin/login')).toBe(false)
    })

    it('FE-CLIENT-INTERCEPTOR-008: /admin/register', () => {
      expect(isAuthPublicPath('/admin/register')).toBe(false)
    })

    it('FE-CLIENT-INTERCEPTOR-009: /some-login-page', () => {
      expect(isAuthPublicPath('/some-login-page')).toBe(false)
    })
  })

  describe('paths that matched via loose startsWith before fix — must redirect', () => {
    it('FE-CLIENT-INTERCEPTOR-010: /reset-password-extra', () => {
      expect(isAuthPublicPath('/reset-password-extra')).toBe(false)
    })

    it('FE-CLIENT-INTERCEPTOR-011: /forgot-password-extra', () => {
      expect(isAuthPublicPath('/forgot-password-extra')).toBe(false)
    })
  })

  describe('private app paths — must redirect', () => {
    it('FE-CLIENT-INTERCEPTOR-012: /dashboard', () => {
      expect(isAuthPublicPath('/dashboard')).toBe(false)
    })

    it('FE-CLIENT-INTERCEPTOR-013: /trips/123', () => {
      expect(isAuthPublicPath('/trips/123')).toBe(false)
    })

    it('FE-CLIENT-INTERCEPTOR-014: / (root)', () => {
      expect(isAuthPublicPath('/')).toBe(false)
    })
  })
})
