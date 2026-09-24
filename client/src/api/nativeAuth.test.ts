import { describe, it, expect, vi } from 'vitest'
import { nativeAuthApi } from './nativeAuth'
import { apiClient } from './client'

vi.mock('./client', () => ({ apiClient: { post: vi.fn() } }))

describe('nativeAuthApi', () => {
  it('mints a hand-off code for a challenge', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { code: 'c1' } })
    await expect(nativeAuthApi.handoff('ab'.repeat(32))).resolves.toEqual({ code: 'c1' })
    expect(apiClient.post).toHaveBeenCalledWith('/auth/native/handoff', { challenge: 'ab'.repeat(32) })
  })

  it('redeems the code with its verifier', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { ok: true } })
    await expect(nativeAuthApi.exchange({ code: 'c1', verifier: 'v'.repeat(64) })).resolves.toBeUndefined()
    expect(apiClient.post).toHaveBeenCalledWith('/auth/native/exchange', { code: 'c1', verifier: 'v'.repeat(64) })
  })
})
