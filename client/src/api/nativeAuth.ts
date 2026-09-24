import type { NativeExchangeRequest, NativeHandoffResponse } from '@trek/shared'
import { apiClient } from './client'

/** The two halves of the sign-in hand-off between system browser and app. */
export const nativeAuthApi = {
  /** Browser side: trade a signed-in session for a one-time code bound to `challenge`. */
  handoff: (challenge: string): Promise<NativeHandoffResponse> =>
    apiClient.post('/auth/native/handoff', { challenge }).then((r) => r.data),
  /** App side: redeem the code with the verifier; the response sets the session cookie. */
  exchange: (body: NativeExchangeRequest): Promise<void> =>
    apiClient.post('/auth/native/exchange', body).then(() => undefined),
}
