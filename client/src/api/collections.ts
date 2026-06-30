import apiClient from './client'
import type { AxiosResponse } from 'axios'
import type {
  CollectionListResponse,
  CollectionDetailResponse,
  CollectionSaveResult,
  CollectionMembership,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionSavePlaceRequest,
  CollectionSaveFromTripRequest,
  CollectionPlaceUpdateRequest,
  CollectionCopyToTripRequest,
  CollectionInviteRequest,
  CollectionInviteActionRequest,
  CollectionInviteCancelRequest,
  CollectionStatus,
  Collection,
  CollectionPlace,
} from '@trek/shared'

const ax = apiClient
const base = '/addons/collections'

/** Query for the library-wide "is this place already saved?" lookup. */
export interface MembershipQuery {
  google_place_id?: string
  google_ftid?: string
  name?: string
  lat?: number
  lng?: number
}

export interface CopyToTripResult {
  copied: number
  skipped: { id: number; name: string }[]
}

/**
 * Axios calls for the Collections addon (/api/addons/collections). Mirrors the
 * vacayStore api shape — each method returns the unwrapped response body and
 * uses `satisfies` on the request payloads so the shared Zod request types stay
 * the single source of truth.
 */
export const collectionsApi = {
  list: (): Promise<CollectionListResponse> =>
    ax.get(base).then((r: AxiosResponse) => r.data),
  get: (id: number): Promise<CollectionDetailResponse> =>
    ax.get(`${base}/${id}`).then((r: AxiosResponse) => r.data),
  create: (body: CollectionCreateRequest): Promise<{ collection: Collection }> =>
    ax.post(base, body satisfies CollectionCreateRequest).then((r: AxiosResponse) => r.data),
  update: (id: number, body: CollectionUpdateRequest): Promise<{ collection: Collection }> =>
    ax.patch(`${base}/${id}`, body satisfies CollectionUpdateRequest).then((r: AxiosResponse) => r.data),
  remove: (id: number): Promise<unknown> =>
    ax.delete(`${base}/${id}`).then((r: AxiosResponse) => r.data),
  reorder: (orderedIds: number[]): Promise<unknown> =>
    ax.post(`${base}/reorder`, { orderedIds }).then((r: AxiosResponse) => r.data),

  savePlace: (body: CollectionSavePlaceRequest): Promise<CollectionSaveResult> =>
    ax.post(`${base}/places`, body satisfies CollectionSavePlaceRequest).then((r: AxiosResponse) => r.data),
  saveFromTrip: (body: CollectionSaveFromTripRequest): Promise<CollectionSaveResult> =>
    ax.post(`${base}/places/from-trip`, body satisfies CollectionSaveFromTripRequest).then((r: AxiosResponse) => r.data),
  updatePlace: (pid: number, body: CollectionPlaceUpdateRequest): Promise<{ place: CollectionPlace }> =>
    ax.patch(`${base}/places/${pid}`, body satisfies CollectionPlaceUpdateRequest).then((r: AxiosResponse) => r.data),
  setStatus: (pid: number, status: CollectionStatus): Promise<{ place: CollectionPlace }> =>
    ax.post(`${base}/places/${pid}/status`, { status }).then((r: AxiosResponse) => r.data),
  deletePlace: (pid: number): Promise<unknown> =>
    ax.delete(`${base}/places/${pid}`).then((r: AxiosResponse) => r.data),
  deleteMany: (ids: number[]): Promise<unknown> =>
    ax.post(`${base}/places/delete-many`, { ids }).then((r: AxiosResponse) => r.data),

  copyToTrip: (body: CollectionCopyToTripRequest): Promise<CopyToTripResult> =>
    ax.post(`${base}/copy-to-trip`, body satisfies CollectionCopyToTripRequest).then((r: AxiosResponse) => r.data),
  membership: (params: MembershipQuery): Promise<CollectionMembership> =>
    ax.get(`${base}/membership`, { params }).then((r: AxiosResponse) => r.data),

  invite: (collectionId: number, userId: number): Promise<unknown> =>
    ax.post(`${base}/invite`, { collection_id: collectionId, user_id: userId } satisfies CollectionInviteRequest).then((r: AxiosResponse) => r.data),
  acceptInvite: (collectionId: number): Promise<unknown> =>
    ax.post(`${base}/invite/accept`, { collection_id: collectionId } satisfies CollectionInviteActionRequest).then((r: AxiosResponse) => r.data),
  declineInvite: (collectionId: number): Promise<unknown> =>
    ax.post(`${base}/invite/decline`, { collection_id: collectionId } satisfies CollectionInviteActionRequest).then((r: AxiosResponse) => r.data),
  cancelInvite: (collectionId: number, userId: number): Promise<unknown> =>
    ax.post(`${base}/invite/cancel`, { collection_id: collectionId, user_id: userId } satisfies CollectionInviteCancelRequest).then((r: AxiosResponse) => r.data),
  leave: (collectionId: number): Promise<unknown> =>
    ax.post(`${base}/leave`, { collection_id: collectionId }).then((r: AxiosResponse) => r.data),
  availableUsers: (id: number): Promise<{ users: { id: number; username: string }[] }> =>
    ax.get(`${base}/${id}/available-users`).then((r: AxiosResponse) => r.data),
}
