import apiClient, { parseInDev } from './client'
import {
  pushPublicKeyResultSchema,
  pushSubscribeResultSchema,
  pushUnsubscribeResultSchema,
  type PushPublicKeyResult,
  type PushSubscribeRequest,
  type PushSubscribeResult,
  type PushSubscriptionInput,
  type PushUnsubscribeRequest,
  type PushUnsubscribeResult,
} from '@trek/shared'

/**
 * The Web Push device endpoints, in their own file rather than in the
 * `client.ts` god module. Types come from the shared contracts, so a server
 * change the client has not caught up with is a typecheck failure rather than
 * a runtime surprise.
 *
 * These calls are online only by nature: a subscription is a device talking to
 * the server and to the browser's push service at the same moment, so there is
 * nothing to queue or to cache. `push/webPush.ts` is the only caller. The one
 * DELETE that does not come through here is the logout teardown's: it is a
 * plain fetch in webPush.ts, so a session that already ran out cannot set off
 * apiClient's 401 redirect in the middle of a logout.
 */
export const pushApi = {
  /** The VAPID public key a browser subscribes with. */
  getPublicKey: (): Promise<PushPublicKeyResult> =>
    apiClient
      .get('/notifications/push/public-key')
      .then(r => parseInDev(pushPublicKeyResultSchema, r.data, 'push.publicKey')),

  /** Registers this device. Repeating it for the same endpoint only refreshes the row. */
  subscribe: (subscription: PushSubscriptionInput): Promise<PushSubscribeResult> => {
    const body: PushSubscribeRequest = { subscription }
    return apiClient
      .post('/notifications/push/subscriptions', body)
      .then(r => parseInDev(pushSubscribeResultSchema, r.data, 'push.subscribe'))
  },

  /** Forgets one device, by the endpoint its subscription delivers to. */
  unsubscribe: (endpoint: string): Promise<PushUnsubscribeResult> => {
    const body: PushUnsubscribeRequest = { endpoint }
    return apiClient
      .delete('/notifications/push/subscriptions', { data: body })
      .then(r => parseInDev(pushUnsubscribeResultSchema, r.data, 'push.unsubscribe'))
  },
}
