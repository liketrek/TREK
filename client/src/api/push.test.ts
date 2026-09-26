/**
 * FE-PUSH-API-001 to FE-PUSH-API-005: the Web Push device endpoints.
 *
 * One line per endpoint and no logic, which is why a slip here is quiet: a
 * wrong path or a body under the wrong key does not throw, the server answers
 * 400 or 404 and push simply never arrives. So each call is driven through MSW
 * with its verb, path and body pinned, and a failure has to reach the caller
 * intact, because `webPush.ts` decides from it whether to roll a subscription
 * back.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import type { PushSubscriptionInput } from '@trek/shared'
import { server } from '../../tests/helpers/msw/server'
import { pushApi } from './push'

const BASE = '/api/notifications/push'

let seen: { method: string; url: string; body: unknown } | null = null

function record<T extends JsonBodyType>(data: T) {
  return async ({ request }: { request: Request }) => {
    const text = await request.text()
    seen = { method: request.method, url: new URL(request.url).pathname, body: text ? JSON.parse(text) : undefined }
    return HttpResponse.json(data)
  }
}

const subscription: PushSubscriptionInput = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  expirationTime: null,
  keys: { p256dh: 'BPk', auth: 'aGk' },
}

beforeEach(() => {
  seen = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pushApi', () => {
  it('FE-PUSH-API-001: reads the public key', async () => {
    server.use(http.get(`${BASE}/public-key`, record({ publicKey: 'BAECAwQ' })))
    await expect(pushApi.getPublicKey()).resolves.toEqual({ publicKey: 'BAECAwQ' })
    expect(seen).toMatchObject({ method: 'GET', url: `${BASE}/public-key` })
  })

  it('FE-PUSH-API-002: registers the subscription under `subscription`', async () => {
    server.use(http.post(`${BASE}/subscriptions`, record({ success: true, devices: 2 })))
    await expect(pushApi.subscribe(subscription)).resolves.toEqual({ success: true, devices: 2 })
    expect(seen).toEqual({ method: 'POST', url: `${BASE}/subscriptions`, body: { subscription } })
  })

  it('FE-PUSH-API-003: forgets a device by its endpoint, in a DELETE body', async () => {
    server.use(http.delete(`${BASE}/subscriptions`, record({ success: true })))
    await expect(pushApi.unsubscribe(subscription.endpoint)).resolves.toEqual({ success: true })
    expect(seen).toEqual({ method: 'DELETE', url: `${BASE}/subscriptions`, body: { endpoint: subscription.endpoint } })
  })

  it('FE-PUSH-API-004: a refusal reaches the caller instead of passing as success', async () => {
    server.use(http.post(`${BASE}/subscriptions`, () => HttpResponse.json({ error: 'Unsupported push service' }, { status: 400 })))
    await expect(pushApi.subscribe(subscription)).rejects.toMatchObject({ response: { status: 400 } })
  })

  it('FE-PUSH-API-005: the DELETE answer is checked against the shared contract, like the subscribe answer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    server.use(http.delete(`${BASE}/subscriptions`, record({ success: false })))
    await expect(pushApi.unsubscribe(subscription.endpoint)).resolves.toEqual({ success: false })
    expect(warn).toHaveBeenCalledWith(
      '[api] push.unsubscribe: response did not match the @trek/shared schema',
      expect.anything(),
    )
  })
})
