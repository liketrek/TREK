// FE-W4SNA-001 to FE-W4SNA-005
import { describe, it, expect, vi, afterEach } from 'vitest'
import type { NavigateFunction } from 'react-router'
import { registerNoticeAction, runNoticeAction } from './noticeActions'

const navigate = vi.fn() as unknown as NavigateFunction
const ctx = { navigate }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('noticeActions', () => {
  it('FE-W4SNA-001: runs a registered handler with the navigate context', () => {
    const handler = vi.fn(() => {})
    registerNoticeAction('open-settings', handler)

    runNoticeAction('open-settings', ctx)

    expect(handler).toHaveBeenCalledWith(ctx)
  })

  it('FE-W4SNA-002: logs and does nothing for an unknown id', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => runNoticeAction('never-registered', ctx)).not.toThrow()
    expect(err).toHaveBeenCalledTimes(1)
    expect(String(err.mock.calls[0][0])).toContain('never-registered')
  })

  it('FE-W4SNA-003: a later registration replaces the handler for the same id', () => {
    const first = vi.fn(() => {})
    const second = vi.fn(() => {})
    registerNoticeAction('dup', first)
    registerNoticeAction('dup', second)

    runNoticeAction('dup', ctx)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()
  })

  it('FE-W4SNA-004: fires an async handler without blocking the caller', async () => {
    let resolved = false
    registerNoticeAction('async-cta', async () => {
      await Promise.resolve()
      resolved = true
    })

    expect(runNoticeAction('async-cta', ctx)).toBeUndefined()
    expect(resolved).toBe(false)

    await Promise.resolve()
    await Promise.resolve()
    expect(resolved).toBe(true)
  })

  it('FE-W4SNA-005: hands the real navigate through to the handler', () => {
    registerNoticeAction('go-billing', c => { c.navigate('/settings/billing') })

    runNoticeAction('go-billing', ctx)

    expect(navigate).toHaveBeenCalledWith('/settings/billing')
  })
})
