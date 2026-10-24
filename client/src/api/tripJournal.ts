import type {
  TripJournalCandidatesResponse,
  TripJournalLinkMemberRequest,
  TripJournalLinkResponse,
} from '@trek/shared';
import apiClient from './client';

/**
 * `/api/trips/:tripId/journal`: the journal from the Journey addon a trip shows,
 * and who it is open to. In its own file rather than in the `client.ts` god
 * module; repo/tripJournalLinkRepo.ts is the one caller.
 */
export const tripJournalApi = {
  get: (tripId: number): Promise<TripJournalLinkResponse> =>
    apiClient.get(`/trips/${tripId}/journal`).then((r) => r.data),
  candidates: (tripId: number, journeyId: number): Promise<TripJournalCandidatesResponse> =>
    apiClient.get(`/trips/${tripId}/journal/candidates`, { params: { journey_id: journeyId } }).then((r) => r.data),
  link: (
    tripId: number,
    journeyId: number,
    members: TripJournalLinkMemberRequest[]
  ): Promise<TripJournalLinkResponse> =>
    apiClient.put(`/trips/${tripId}/journal`, { journey_id: journeyId, members }).then((r) => r.data),
  setMembers: (tripId: number, members: TripJournalLinkMemberRequest[]): Promise<TripJournalLinkResponse> =>
    apiClient.patch(`/trips/${tripId}/journal/members`, { members }).then((r) => r.data),
  unlink: (tripId: number): Promise<TripJournalLinkResponse> =>
    apiClient.delete(`/trips/${tripId}/journal`).then((r) => r.data),
  /** The journals this person can open; the dialog offers the ones they own. */
  journals: (): Promise<{ journeys: { id: number; user_id: number; title: string; subtitle?: string | null }[] }> =>
    apiClient.get('/journeys').then((r) => r.data),
};
