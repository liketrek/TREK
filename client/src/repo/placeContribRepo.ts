import {
  placeContribLogResponseSchema,
  placeContribStateSchema,
  placeContribWithdrawResponseSchema,
  type PlaceContribDecisionRequest,
  type PlaceContribLogQuery,
  type PlaceContribLogResponse,
  type PlaceContribState,
  type PlaceContribWithdrawResponse,
} from '@trek/shared';
import { placeContribApi } from '../api/placeContrib';
import { requireOnline } from './onlineOnly';

/**
 * The installation's decision on sharing place details, and what it sent.
 * **Online-only, no Dexie table**, like the service identity beside it: a
 * consent read from a stale copy would be worse than no answer.
 */
export const placeContribRepo = {
  async state(signal?: AbortSignal): Promise<PlaceContribState> {
    requireOnline();
    return placeContribStateSchema.parse(await placeContribApi.state(signal));
  },

  async decide(body: PlaceContribDecisionRequest): Promise<PlaceContribState> {
    requireOnline();
    return placeContribStateSchema.parse(await placeContribApi.decide(body));
  },

  async log(query: Partial<PlaceContribLogQuery>, signal?: AbortSignal): Promise<PlaceContribLogResponse> {
    requireOnline();
    return placeContribLogResponseSchema.parse(await placeContribApi.log(query, signal));
  },

  async withdraw(): Promise<PlaceContribWithdrawResponse> {
    requireOnline();
    return placeContribWithdrawResponseSchema.parse(await placeContribApi.withdraw());
  },
};
