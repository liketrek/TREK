import axios, { AxiosInstance } from 'axios'
import type { z } from 'zod'
import {
  weatherResultSchema, type WeatherResult,
  inAppListResultSchema, type InAppListResult,
  unreadCountResultSchema, type UnreadCountResult,
  channelTestResultSchema,
  mapsSearchResultSchema, mapsAutocompleteResultSchema, mapsPlaceDetailsResultSchema,
  mapsPlacePhotoResultSchema, mapsReverseResultSchema, mapsResolveUrlResultSchema,
  type NotificationRespondRequest,
  type SettingUpsertRequest, type SettingsBulkRequest,
  type JourneyCreateRequest, type JourneyAddTripRequest,
  type JourneyReorderEntriesRequest, type JourneyProviderPhotosRequest,
  type JourneyShareLinkRequest,
  type RegisterRequest, type LoginRequest, type ForgotPasswordRequest,
  type ResetPasswordRequest, type ChangePasswordRequest,
  type MfaVerifyLoginRequest, type MfaEnableRequest, type McpTokenCreateRequest,
  type TripAddMemberRequest, type AssignmentReorderRequest,
  type PackingReorderRequest, type PackingCreateBagRequest, type TodoReorderRequest,
  type TripCreateRequest, type TripUpdateRequest, type TripCopyRequest,
  type DayCreateRequest, type DayUpdateRequest, type DayReorderRequest,
  type PlaceCreateRequest, type PlaceUpdateRequest,
  type ReservationCreateRequest, type ReservationUpdateRequest,
  type AccommodationCreateRequest, type AccommodationUpdateRequest,
  type BudgetCreateItemRequest, type BudgetUpdateItemRequest,
  type PackingCreateItemRequest, type PackingUpdateItemRequest,
  type TodoCreateItemRequest, type TodoUpdateItemRequest,
  type AssignmentCreateRequest, type AssignmentParticipantsRequest, type AssignmentTimeRequest,
  type PlaceBulkDeleteRequest,
  type DayNoteCreateRequest, type DayNoteUpdateRequest,
  type PackingImportRequest, type PackingBagMembersRequest, type PackingUpdateBagRequest,
  type PackingCategoryAssigneesRequest,
  type BudgetUpdateMembersRequest, type BudgetToggleMemberPaidRequest, type BudgetReorderCategoriesRequest,
  type TodoCategoryAssigneesRequest,
  type CollabNoteCreateRequest, type CollabNoteUpdateRequest, type CollabPollCreateRequest,
  type CollabPollVoteRequest, type CollabMessageCreateRequest, type CollabReactionRequest,
  type FileUpdateRequest, type FileLinkRequest,
  type CreateTagRequest, type UpdateTagRequest,
  type CreateCategoryRequest, type UpdateCategoryRequest,
  type PlaceImportListRequest,
  type BookingImportPreviewItem,
  type BookingImportPreviewResponse,
  type BookingImportConfirmResponse,
} from '@trek/shared'
import { getSocketId } from './websocket'
import { isReachable, probeNow } from '../sync/connectivity'

/**
 * Validate a response payload against its @trek/shared Zod schema — but only in
 * dev, and never throwing. A drift between the server contract and the client's
 * expected shape is surfaced as a console warning during development; in
 * production (and on any mismatch) the data passes through untouched, so adding
 * validation can never break a working call. This is the typed-request helper
 * the FE adopts per domain as each backend module lands on @trek/shared.
 */
const API_DEV = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)
export function parseInDev<S extends z.ZodTypeAny>(schema: S, data: unknown, label: string): z.infer<S> {
  if (API_DEV) {
    const result = schema.safeParse(data)
    if (!result.success) {
      console.warn(`[api] ${label}: response did not match the @trek/shared schema`, result.error.issues)
    }
  }
  return data as z.infer<S>
}

/**
 * Same dev-only drift check as parseInDev, but passes the payload straight
 * through with its original inferred type instead of the schema type. Use this
 * for endpoints whose existing consumers rely on the loose `r.data` type — it
 * adds the development contract-drift warning without retyping the public
 * surface (so it can never break a consumer that worked before).
 */
function checkInDev<T>(schema: z.ZodTypeAny, data: T, label: string): T {
  if (API_DEV) {
    const result = schema.safeParse(data)
    if (!result.success) {
      console.warn(`[api] ${label}: response did not match the @trek/shared schema`, result.error.issues)
    }
  }
  return data
}
const RATE_LIMIT_MESSAGES: Record<string, string> = {
  en:      'Too many attempts. Please try again later.',
  de:      'Zu viele Versuche. Bitte versuchen Sie es später erneut.',
  es:      'Demasiados intentos. Inténtelo de nuevo más tarde.',
  fr:      'Trop de tentatives. Veuillez réessayer plus tard.',
  hu:      'Túl sok próbálkozás. Kérjük, próbálja újra később.',
  nl:      'Te veel pogingen. Probeer het later opnieuw.',
  br:      'Muitas tentativas. Tente novamente mais tarde.',
  cs:      'Příliš mnoho pokusů. Zkuste to prosím znovu.',
  pl:      'Zbyt wiele prób. Spróbuj ponownie później.',
  ru:      'Слишком много попыток. Попробуйте позже.',
  zh:      '尝试次数过多，请稍后再试。',
  'zh-TW': '嘗試次數過多，請稍後再試。',
  it:      'Troppi tentativi. Riprova più tardi.',
  tr:      'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
  ar:      'محاولات كثيرة جدًا. يرجى المحاولة لاحقًا.',
  id:      'Terlalu banyak percobaan. Coba lagi nanti.',
  ja:      '試行回数が多すぎます。時間をおいて再度お試しください。',
  ko:      '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  uk:      'Занадто багато спроб. Спробуйте пізніше.',
  sv:      'För många försök. Prova igen senare.',
}

function translateRateLimit(): string {
  const fallback = RATE_LIMIT_MESSAGES['en']!
  try {
    const lang = localStorage.getItem('app_language') || 'en'
    return RATE_LIMIT_MESSAGES[lang] ?? fallback
  } catch {
    return fallback
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

// Request interceptor - add socket ID + idempotency key for mutating requests
apiClient.interceptors.request.use(
    (config) => {
      const sid = getSocketId()
      if (sid) {
        config.headers['X-Socket-Id'] = sid
      }
      // Attach a per-request idempotency key to all write operations so the
      // server can deduplicate retried requests (e.g. network blips).
      // The mutation queue sets its own pre-generated key; skip if already set.
      const method = (config.method ?? '').toLowerCase()
      if (MUTATING_METHODS.has(method) && !config.headers['X-Idempotency-Key']) {
        const key = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        config.headers['X-Idempotency-Key'] = key
      }
      return config
    },
    (error) => Promise.reject(error)
)

export function isAuthPublicPath(pathname: string): boolean {
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const publicPrefixes = ['/shared/', '/public/']
  return publicPaths.includes(pathname) || publicPrefixes.some((p) => pathname.startsWith(p))
}

// Unregisters the SW before reloading so the navigation reaches the network.
// Without this, WorkBox's NavigationRoute serves the cached SPA shell and the
// upstream proxy (CF Access / Pangolin) never gets to challenge the user.
async function unregisterSWAndReload(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.unregister()
  } catch { /* ignore */ }
  window.location.reload()
}

// Response interceptor - handle 401, 403 MFA, 429 rate limit, proxy auth challenges
apiClient.interceptors.response.use(
    (response) => {
      sessionStorage.removeItem('proxy_reauth_attempted')
      return response
    },
    async (error) => {
      // CF Access / Pangolin / similar: cross-origin redirect from /api/* surfaces
      // as a CORS error with no response object. Probe the health endpoint to
      // distinguish a proxy auth challenge from a genuine outage. If the server
      // is reachable, a top-level reload lets the edge proxy run its auth flow.
      if (!error.response && navigator.onLine) {
        await probeNow()
        // Both the original request and the health probe failed while the device
        // has a network interface. This matches the proxy-auth-challenge pattern
        // (CF Access / Pangolin intercept all requests and CORS-block XHR).
        // Guard with sessionStorage to prevent reload loops (server genuinely
        // down would also land here, but only reloads once).
        if (!isReachable()) {
          const { pathname } = window.location
          if (!isAuthPublicPath(pathname) && !sessionStorage.getItem('proxy_reauth_attempted')) {
            sessionStorage.setItem('proxy_reauth_attempted', '1')
            await unregisterSWAndReload()
            return Promise.reject(error)
          }
        }
      }
      // Pangolin header-auth extended compatibility mode: returns 401 with an
      // HTML body (a JS redirect page) instead of a 302. TREK's own 401s are
      // always application/json, so checking for text/html is unambiguous.
      if (error.response?.status === 401) {
        const ct = (error.response.headers?.['content-type'] as string | undefined) ?? ''
        if (ct.includes('text/html')) {
          const { pathname } = window.location
          if (!isAuthPublicPath(pathname) && !sessionStorage.getItem('proxy_reauth_attempted')) {
            sessionStorage.setItem('proxy_reauth_attempted', '1')
            await unregisterSWAndReload()
            return Promise.reject(error)
          }
        }
      }
      if (error.response?.status === 401 && (error.response?.data as { code?: string } | undefined)?.code === 'AUTH_REQUIRED') {
        const { pathname } = window.location
        if (!isAuthPublicPath(pathname)) {
          const currentPath = pathname + window.location.search + window.location.hash
          window.location.href = '/login?redirect=' + encodeURIComponent(currentPath)
        }
      }
      if (
          error.response?.status === 403 &&
          (error.response?.data as { code?: string } | undefined)?.code === 'MFA_REQUIRED' &&
          !window.location.pathname.startsWith('/settings')
      ) {
        window.location.href = '/settings?mfa=required'
      }
      if (error.response?.status === 429) {
        const translated = translateRateLimit()
        const data = error.response.data as { error?: string } | undefined
        if (data && typeof data === 'object') {
          data.error = translated
        } else {
          error.response.data = { error: translated }
        }
        error.message = translated
      }
      return Promise.reject(error)
    }
)

export const authApi = {
  register: (data: RegisterRequest) => apiClient.post('/auth/register', data).then(r => r.data),
  validateInvite: (token: string) => apiClient.get(`/auth/invite/${token}`).then(r => r.data),
  login: (data: LoginRequest) => apiClient.post('/auth/login', data).then(r => r.data),
  verifyMfaLogin: (data: MfaVerifyLoginRequest) => apiClient.post('/auth/mfa/verify-login', data).then(r => r.data),
  mfaSetup: () => apiClient.post('/auth/mfa/setup', {}).then(r => r.data),
  mfaEnable: (data: MfaEnableRequest) => apiClient.post('/auth/mfa/enable', data).then(r => r.data as { success: boolean; mfa_enabled: boolean; backup_codes?: string[] }),
  mfaDisable: (data: { password: string; code: string }) => apiClient.post('/auth/mfa/disable', data).then(r => r.data),
  me: () => apiClient.get('/auth/me').then(r => r.data),
  updateMapsKey: (key: string | null) => apiClient.put('/auth/me/maps-key', { maps_api_key: key }).then(r => r.data),
  updateApiKeys: (data: Record<string, string | null>) => apiClient.put('/auth/me/api-keys', data).then(r => r.data),
  updateSettings: (data: Record<string, unknown>) => apiClient.put('/auth/me/settings', data).then(r => r.data),
  getSettings: () => apiClient.get('/auth/me/settings').then(r => r.data),
  listUsers: () => apiClient.get('/auth/users').then(r => r.data),
  uploadAvatar: (formData: FormData) => apiClient.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  deleteAvatar: () => apiClient.delete('/auth/avatar').then(r => r.data),
  getAppConfig: () => apiClient.get('/auth/app-config').then(r => r.data),
  updateAppSettings: (data: Record<string, unknown>) => apiClient.put('/auth/app-settings', data).then(r => r.data),
  validateKeys: () => apiClient.get('/auth/validate-keys').then(r => r.data),
  travelStats: () => apiClient.get('/auth/travel-stats').then(r => r.data),
  changePassword: (data: ChangePasswordRequest) => apiClient.put('/auth/me/password', data).then(r => r.data),
  forgotPassword: (data: ForgotPasswordRequest) => apiClient.post('/auth/forgot-password', data).then(r => r.data as { ok: true }),
  resetPassword: (data: ResetPasswordRequest) => apiClient.post('/auth/reset-password', data).then(r => r.data as { success?: true; mfa_required?: true }),
  deleteOwnAccount: () => apiClient.delete('/auth/me').then(r => r.data),
  demoLogin: () => apiClient.post('/auth/demo-login').then(r => r.data),
  mcpTokens: {
    list: () => apiClient.get('/auth/mcp-tokens').then(r => r.data),
    create: (name: string) => apiClient.post('/auth/mcp-tokens', { name } satisfies McpTokenCreateRequest).then(r => r.data),
    delete: (id: number) => apiClient.delete(`/auth/mcp-tokens/${id}`).then(r => r.data),
  },
  passkey: {
    registerOptions: (password: string) => apiClient.post('/auth/passkey/register/options', { password }).then(r => r.data),
    registerVerify: (attestationResponse: unknown, name?: string) => apiClient.post('/auth/passkey/register/verify', { attestationResponse, name }).then(r => r.data),
    loginOptions: () => apiClient.post('/auth/passkey/login/options', {}).then(r => r.data),
    loginVerify: (assertionResponse: unknown) => apiClient.post('/auth/passkey/login/verify', { assertionResponse }).then(r => r.data as { token: string; user: Record<string, unknown> }),
    list: () => apiClient.get('/auth/passkey/credentials').then(r => r.data as { credentials: PasskeyCredential[] }),
    rename: (id: number, name: string) => apiClient.patch(`/auth/passkey/credentials/${id}`, { name }).then(r => r.data),
    delete: (id: number, password: string) => apiClient.delete(`/auth/passkey/credentials/${id}`, { data: { password } }).then(r => r.data),
  },
}

export interface PasskeyCredential {
  id: number
  name: string | null
  device_type: string | null
  backed_up: boolean
  created_at: string
  last_used_at: string | null
}

export const oauthApi = {
  /** Validate OAuth authorize params — called by consent page on load */
  validate: (params: {
    response_type: string
    client_id: string
    redirect_uri: string
    scope: string
    state?: string
    code_challenge: string
    code_challenge_method: string
    resource?: string
  }) => apiClient.get('/oauth/authorize/validate', { params }).then(r => r.data),

  /** Submit user consent (approve or deny) */
  authorize: (body: {
    client_id: string
    redirect_uri: string
    scope: string
    state?: string
    code_challenge: string
    code_challenge_method: string
    approved: boolean
    resource?: string
  }) => apiClient.post('/oauth/authorize', body).then(r => r.data),

  clients: {
    list: () => apiClient.get('/oauth/clients').then(r => r.data),
    create: (data: { name: string; redirect_uris?: string[]; allowed_scopes: string[]; allows_client_credentials?: boolean }) =>
        apiClient.post('/oauth/clients', data).then(r => r.data),
    rotate: (id: string) => apiClient.post(`/oauth/clients/${id}/rotate`).then(r => r.data),
    delete: (id: string) => apiClient.delete(`/oauth/clients/${id}`).then(r => r.data),
  },

  sessions: {
    list: () => apiClient.get('/oauth/sessions').then(r => r.data),
    revoke: (id: number) => apiClient.delete(`/oauth/sessions/${id}`).then(r => r.data),
  },
}

export const tripsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/trips', { params }).then(r => r.data),
  create: (data: TripCreateRequest) => apiClient.post('/trips', data).then(r => r.data),
  get: (id: number | string) => apiClient.get(`/trips/${id}`).then(r => r.data),
  update: (id: number | string, data: TripUpdateRequest) => apiClient.put(`/trips/${id}`, data).then(r => r.data),
  delete: (id: number | string) => apiClient.delete(`/trips/${id}`).then(r => r.data),
  uploadCover: (id: number | string, formData: FormData) => apiClient.post(`/trips/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  archive: (id: number | string) => apiClient.put(`/trips/${id}`, { is_archived: true }).then(r => r.data),
  unarchive: (id: number | string) => apiClient.put(`/trips/${id}`, { is_archived: false }).then(r => r.data),
  getMembers: (id: number | string) => apiClient.get(`/trips/${id}/members`).then(r => r.data),
  addMember: (id: number | string, identifier: string) => apiClient.post(`/trips/${id}/members`, { identifier } satisfies TripAddMemberRequest).then(r => r.data),
  removeMember: (id: number | string, userId: number) => apiClient.delete(`/trips/${id}/members/${userId}`).then(r => r.data),
  copy: (id: number | string, data?: TripCopyRequest) => apiClient.post(`/trips/${id}/copy`, data || {}).then(r => r.data),
  bundle: (id: number | string) => apiClient.get(`/trips/${id}/bundle`).then(r => r.data),
}

export const daysApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/days`).then(r => r.data),
  create: (tripId: number | string, data: DayCreateRequest) => apiClient.post(`/trips/${tripId}/days`, data).then(r => r.data),
  update: (tripId: number | string, dayId: number | string, data: DayUpdateRequest) => apiClient.put(`/trips/${tripId}/days/${dayId}`, data).then(r => r.data),
  delete: (tripId: number | string, dayId: number | string) => apiClient.delete(`/trips/${tripId}/days/${dayId}`).then(r => r.data),
  reorder: (tripId: number | string, orderedIds: number[]) => apiClient.put(`/trips/${tripId}/days/reorder`, { orderedIds } satisfies DayReorderRequest).then(r => r.data),
}

export const placesApi = {
  list: (tripId: number | string, params?: Record<string, unknown>) => apiClient.get(`/trips/${tripId}/places`, { params }).then(r => r.data),
  create: (tripId: number | string, data: PlaceCreateRequest) => apiClient.post(`/trips/${tripId}/places`, data).then(r => r.data),
  get: (tripId: number | string, id: number | string) => apiClient.get(`/trips/${tripId}/places/${id}`).then(r => r.data),
  update: (tripId: number | string, id: number | string, data: PlaceUpdateRequest) => apiClient.put(`/trips/${tripId}/places/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number | string) => apiClient.delete(`/trips/${tripId}/places/${id}`).then(r => r.data),
  searchImage: (tripId: number | string, id: number | string) => apiClient.get(`/trips/${tripId}/places/${id}/image`).then(r => r.data),
  importGpx: (tripId: number | string, file: File, opts?: { waypoints?: boolean; routes?: boolean; tracks?: boolean }) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts?.waypoints !== undefined) fd.append('importWaypoints', String(opts.waypoints))
    if (opts?.routes !== undefined) fd.append('importRoutes', String(opts.routes))
    if (opts?.tracks !== undefined) fd.append('importTracks', String(opts.tracks))
    return apiClient.post(`/trips/${tripId}/places/import/gpx`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  importMapFile: (tripId: number | string, file: File, opts?: { points?: boolean; paths?: boolean }) => {
    const fd = new FormData()
    fd.append('file', file)
    if (opts?.points !== undefined) fd.append('importPoints', String(opts.points))
    if (opts?.paths !== undefined) fd.append('importPaths', String(opts.paths))
    return apiClient.post(`/trips/${tripId}/places/import/map`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  importGoogleList: (tripId: number | string, url: string, enrich?: boolean) =>
      apiClient.post(`/trips/${tripId}/places/import/google-list`, { url, enrich } satisfies PlaceImportListRequest).then(r => r.data),
  importNaverList: (tripId: number | string, url: string, enrich?: boolean) =>
      apiClient.post(`/trips/${tripId}/places/import/naver-list`, { url, enrich } satisfies PlaceImportListRequest).then(r => r.data),
  bulkDelete: (tripId: number | string, ids: number[]) =>
      apiClient.post(`/trips/${tripId}/places/bulk-delete`, { ids } satisfies PlaceBulkDeleteRequest).then(r => r.data),
}

export const assignmentsApi = {
  list: (tripId: number | string, dayId: number | string) => apiClient.get(`/trips/${tripId}/days/${dayId}/assignments`).then(r => r.data),
  create: (tripId: number | string, dayId: number | string, data: AssignmentCreateRequest) => apiClient.post(`/trips/${tripId}/days/${dayId}/assignments`, data).then(r => r.data),
  delete: (tripId: number | string, dayId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/days/${dayId}/assignments/${id}`).then(r => r.data),
  reorder: (tripId: number | string, dayId: number | string, orderedIds: number[]) => apiClient.put(`/trips/${tripId}/days/${dayId}/assignments/reorder`, { orderedIds } satisfies AssignmentReorderRequest).then(r => r.data),
  move: (tripId: number | string, assignmentId: number, newDayId: number | string, orderIndex: number | null) => apiClient.put(`/trips/${tripId}/assignments/${assignmentId}/move`, { new_day_id: newDayId, order_index: orderIndex }).then(r => r.data),
  update: (tripId: number | string, dayId: number | string, id: number, data: Record<string, unknown>) => apiClient.put(`/trips/${tripId}/days/${dayId}/assignments/${id}`, data).then(r => r.data),
  getParticipants: (tripId: number | string, id: number) => apiClient.get(`/trips/${tripId}/assignments/${id}/participants`).then(r => r.data),
  setParticipants: (tripId: number | string, id: number, userIds: number[]) => apiClient.put(`/trips/${tripId}/assignments/${id}/participants`, { user_ids: userIds } satisfies AssignmentParticipantsRequest).then(r => r.data),
  updateTime: (tripId: number | string, id: number, times: AssignmentTimeRequest) => apiClient.put(`/trips/${tripId}/assignments/${id}/time`, times).then(r => r.data),
}

export const packingApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/packing`).then(r => r.data),
  create: (tripId: number | string, data: PackingCreateItemRequest) => apiClient.post(`/trips/${tripId}/packing`, data).then(r => r.data),
  bulkImport: (tripId: number | string, items: { name: string; category?: string; quantity?: number }[]) => apiClient.post(`/trips/${tripId}/packing/import`, { items } satisfies PackingImportRequest).then(r => r.data),
  update: (tripId: number | string, id: number, data: PackingUpdateItemRequest) => apiClient.put(`/trips/${tripId}/packing/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/packing/${id}`).then(r => r.data),
  reorder: (tripId: number | string, orderedIds: number[]) => apiClient.put(`/trips/${tripId}/packing/reorder`, { orderedIds } satisfies PackingReorderRequest).then(r => r.data),
  getCategoryAssignees: (tripId: number | string) => apiClient.get(`/trips/${tripId}/packing/category-assignees`).then(r => r.data),
  setCategoryAssignees: (tripId: number | string, categoryName: string, userIds: number[]) => apiClient.put(`/trips/${tripId}/packing/category-assignees/${encodeURIComponent(categoryName)}`, { user_ids: userIds } satisfies PackingCategoryAssigneesRequest).then(r => r.data),
  listTemplates: (tripId: number | string) => apiClient.get(`/trips/${tripId}/packing/templates`).then(r => r.data),
  applyTemplate: (tripId: number | string, templateId: number) => apiClient.post(`/trips/${tripId}/packing/apply-template/${templateId}`).then(r => r.data),
  saveAsTemplate: (tripId: number | string, name: string) => apiClient.post(`/trips/${tripId}/packing/save-as-template`, { name }).then(r => r.data),
  setBagMembers: (tripId: number | string, bagId: number, userIds: number[]) => apiClient.put(`/trips/${tripId}/packing/bags/${bagId}/members`, { user_ids: userIds } satisfies PackingBagMembersRequest).then(r => r.data),
  listBags: (tripId: number | string) => apiClient.get(`/trips/${tripId}/packing/bags`).then(r => r.data),
  createBag: (tripId: number | string, data: PackingCreateBagRequest) => apiClient.post(`/trips/${tripId}/packing/bags`, data).then(r => r.data),
  updateBag: (tripId: number | string, bagId: number, data: PackingUpdateBagRequest) => apiClient.put(`/trips/${tripId}/packing/bags/${bagId}`, data).then(r => r.data),
  deleteBag: (tripId: number | string, bagId: number) => apiClient.delete(`/trips/${tripId}/packing/bags/${bagId}`).then(r => r.data),
}

export const todoApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/todo`).then(r => r.data),
  create: (tripId: number | string, data: TodoCreateItemRequest) => apiClient.post(`/trips/${tripId}/todo`, data).then(r => r.data),
  update: (tripId: number | string, id: number, data: TodoUpdateItemRequest) => apiClient.put(`/trips/${tripId}/todo/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/todo/${id}`).then(r => r.data),
  reorder: (tripId: number | string, orderedIds: number[]) => apiClient.put(`/trips/${tripId}/todo/reorder`, { orderedIds } satisfies TodoReorderRequest).then(r => r.data),
  getCategoryAssignees: (tripId: number | string) => apiClient.get(`/trips/${tripId}/todo/category-assignees`).then(r => r.data),
  setCategoryAssignees: (tripId: number | string, categoryName: string, userIds: number[]) => apiClient.put(`/trips/${tripId}/todo/category-assignees/${encodeURIComponent(categoryName)}`, { user_ids: userIds } satisfies TodoCategoryAssigneesRequest).then(r => r.data),
}

export const tagsApi = {
  list: () => apiClient.get('/tags').then(r => r.data),
  create: (data: CreateTagRequest) => apiClient.post('/tags', data).then(r => r.data),
  update: (id: number, data: UpdateTagRequest) => apiClient.put(`/tags/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/tags/${id}`).then(r => r.data),
}

export const categoriesApi = {
  list: () => apiClient.get('/categories').then(r => r.data),
  create: (data: CreateCategoryRequest) => apiClient.post('/categories', data).then(r => r.data),
  update: (id: number, data: UpdateCategoryRequest) => apiClient.put(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`).then(r => r.data),
}

export const adminApi = {
  users: () => apiClient.get('/admin/users').then(r => r.data),
  createUser: (data: Record<string, unknown>) => apiClient.post('/admin/users', data).then(r => r.data),
  updateUser: (id: number, data: Record<string, unknown>) => apiClient.put(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`).then(r => r.data),
  resetUserPasskeys: (id: number) => apiClient.delete(`/admin/users/${id}/passkeys`).then(r => r.data),
  stats: () => apiClient.get('/admin/stats').then(r => r.data),
  saveDemoBaseline: () => apiClient.post('/admin/save-demo-baseline').then(r => r.data),
  getOidc: () => apiClient.get('/admin/oidc').then(r => r.data),
  updateOidc: (data: Record<string, unknown>) => apiClient.put('/admin/oidc', data).then(r => r.data),
  addons: () => apiClient.get('/admin/addons').then(r => r.data),
  updateAddon: (id: number | string, data: Record<string, unknown>) => apiClient.put(`/admin/addons/${id}`, data).then(r => r.data),
  checkVersion: () => apiClient.get('/admin/version-check').then(r => r.data),
  getBagTracking: () => apiClient.get('/admin/bag-tracking').then(r => r.data),
  updateBagTracking: (enabled: boolean) => apiClient.put('/admin/bag-tracking', { enabled }).then(r => r.data),
  getPlacesPhotos: () => apiClient.get('/admin/places-photos').then(r => r.data),
  updatePlacesPhotos: (enabled: boolean) => apiClient.put('/admin/places-photos', { enabled }).then(r => r.data),
  getPlacesAutocomplete: () => apiClient.get('/admin/places-autocomplete').then(r => r.data),
  updatePlacesAutocomplete: (enabled: boolean) => apiClient.put('/admin/places-autocomplete', { enabled }).then(r => r.data),
  getPlacesDetails: () => apiClient.get('/admin/places-details').then(r => r.data),
  updatePlacesDetails: (enabled: boolean) => apiClient.put('/admin/places-details', { enabled }).then(r => r.data),
  getCollabFeatures: () => apiClient.get('/admin/collab-features').then(r => r.data),
  updateCollabFeatures: (features: Record<string, boolean>) => apiClient.put('/admin/collab-features', features).then(r => r.data),
  packingTemplates: () => apiClient.get('/admin/packing-templates').then(r => r.data),
  getPackingTemplate: (id: number) => apiClient.get(`/admin/packing-templates/${id}`).then(r => r.data),
  createPackingTemplate: (data: { name: string }) => apiClient.post('/admin/packing-templates', data).then(r => r.data),
  updatePackingTemplate: (id: number, data: { name: string }) => apiClient.put(`/admin/packing-templates/${id}`, data).then(r => r.data),
  deletePackingTemplate: (id: number) => apiClient.delete(`/admin/packing-templates/${id}`).then(r => r.data),
  addTemplateCategory: (templateId: number, data: { name: string }) => apiClient.post(`/admin/packing-templates/${templateId}/categories`, data).then(r => r.data),
  updateTemplateCategory: (templateId: number, catId: number, data: { name: string }) => apiClient.put(`/admin/packing-templates/${templateId}/categories/${catId}`, data).then(r => r.data),
  deleteTemplateCategory: (templateId: number, catId: number) => apiClient.delete(`/admin/packing-templates/${templateId}/categories/${catId}`).then(r => r.data),
  addTemplateItem: (templateId: number, catId: number, data: { name: string }) => apiClient.post(`/admin/packing-templates/${templateId}/categories/${catId}/items`, data).then(r => r.data),
  updateTemplateItem: (templateId: number, itemId: number, data: { name: string }) => apiClient.put(`/admin/packing-templates/${templateId}/items/${itemId}`, data).then(r => r.data),
  deleteTemplateItem: (templateId: number, itemId: number) => apiClient.delete(`/admin/packing-templates/${templateId}/items/${itemId}`).then(r => r.data),
  listInvites: () => apiClient.get('/admin/invites').then(r => r.data),
  createInvite: (data: { max_uses: number; expires_in_days?: number }) => apiClient.post('/admin/invites', data).then(r => r.data),
  deleteInvite: (id: number) => apiClient.delete(`/admin/invites/${id}`).then(r => r.data),
  auditLog: (params?: { limit?: number; offset?: number }) =>
      apiClient.get('/admin/audit-log', { params }).then(r => r.data),
  mcpTokens: () => apiClient.get('/admin/mcp-tokens').then(r => r.data),
  deleteMcpToken: (id: number) => apiClient.delete(`/admin/mcp-tokens/${id}`).then(r => r.data),
  oauthSessions: () => apiClient.get('/admin/oauth-sessions').then(r => r.data),
  revokeOAuthSession: (id: number) => apiClient.delete(`/admin/oauth-sessions/${id}`).then(r => r.data),
  getPermissions: () => apiClient.get('/admin/permissions').then(r => r.data),
  updatePermissions: (permissions: Record<string, string>) => apiClient.put('/admin/permissions', { permissions }).then(r => r.data),
  rotateJwtSecret: () => apiClient.post('/admin/rotate-jwt-secret').then(r => r.data),
  sendTestNotification: (data: Record<string, unknown>) =>
      apiClient.post('/admin/dev/test-notification', data).then(r => r.data),
  getNotificationPreferences: () => apiClient.get('/admin/notification-preferences').then(r => r.data),
  updateNotificationPreferences: (prefs: Record<string, Record<string, boolean>>) => apiClient.put('/admin/notification-preferences', prefs).then(r => r.data),
  getDefaultUserSettings: () => apiClient.get('/admin/default-user-settings').then(r => r.data),
  updateDefaultUserSettings: (settings: Record<string, unknown>) => apiClient.put('/admin/default-user-settings', settings).then(r => r.data),
}

export const addonsApi = {
  enabled: () => apiClient.get('/addons').then(r => r.data),
}

export const airtrailApi = {
  getSettings: () => apiClient.get('/integrations/airtrail/settings').then(r => r.data),
  saveSettings: (data: { url: string; apiKey?: string; allowInsecureTls?: boolean; writeEnabled?: boolean }) =>
    apiClient.put('/integrations/airtrail/settings', data).then(r => r.data),
  status: () => apiClient.get('/integrations/airtrail/status').then(r => r.data),
  test: (data: { url?: string; apiKey?: string; allowInsecureTls?: boolean }) =>
    apiClient.post('/integrations/airtrail/test', data).then(r => r.data),
  sync: (): Promise<{ changed: number }> => apiClient.post('/integrations/airtrail/sync').then(r => r.data),
  // flights + import are added with the trip-planner import (P2)
  flights: () => apiClient.get('/integrations/airtrail/flights').then(r => r.data),
  import: (tripId: number, flightIds: string[]) =>
    apiClient.post(`/trips/${tripId}/reservations/import/airtrail`, { flightIds }).then(r => r.data),
}

export const journeyApi = {
  list: () => apiClient.get('/journeys').then(r => r.data),
  create: (data: JourneyCreateRequest) => apiClient.post('/journeys', data).then(r => r.data),
  get: (id: number) => apiClient.get(`/journeys/${id}`).then(r => r.data),
  update: (id: number, data: Record<string, unknown>) => apiClient.patch(`/journeys/${id}`, data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/journeys/${id}`).then(r => r.data),

  suggestions: () => apiClient.get('/journeys/suggestions').then(r => r.data),
  availableTrips: () => apiClient.get('/journeys/available-trips').then(r => r.data),

  // Trips (sync sources)
  addTrip: (id: number, tripId: number) => apiClient.post(`/journeys/${id}/trips`, { trip_id: tripId } satisfies JourneyAddTripRequest).then(r => r.data),
  removeTrip: (id: number, tripId: number) => apiClient.delete(`/journeys/${id}/trips/${tripId}`).then(r => r.data),

  // Entries
  listEntries: (id: number) => apiClient.get(`/journeys/${id}/entries`).then(r => r.data),
  createEntry: (id: number, data: Record<string, unknown>) => apiClient.post(`/journeys/${id}/entries`, data).then(r => r.data),
  updateEntry: (entryId: number, data: Record<string, unknown>) => apiClient.patch(`/journeys/entries/${entryId}`, data).then(r => r.data),
  deleteEntry: (entryId: number) => apiClient.delete(`/journeys/entries/${entryId}`).then(r => r.data),
  reorderEntries: (journeyId: number, orderedIds: number[]) => apiClient.put(`/journeys/${journeyId}/entries/reorder`, { orderedIds } satisfies JourneyReorderEntriesRequest).then(r => r.data),

  // Photos
  uploadPhotos: (entryId: number, formData: FormData, opts?: { onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void; idempotencyKey?: string; signal?: AbortSignal }) =>
    apiClient.post(`/journeys/entries/${entryId}/photos`, formData, {
      headers: { 'Content-Type': undefined as any, ...(opts?.idempotencyKey ? { 'X-Idempotency-Key': opts.idempotencyKey } : {}) },
      timeout: 0,
      onUploadProgress: opts?.onUploadProgress,
      signal: opts?.signal,
    }).then(r => r.data),
  uploadGalleryPhotos: (journeyId: number, formData: FormData, opts?: { onUploadProgress?: (e: import('axios').AxiosProgressEvent) => void; idempotencyKey?: string; signal?: AbortSignal }) =>
    apiClient.post(`/journeys/${journeyId}/gallery/photos`, formData, {
      headers: { 'Content-Type': undefined as any, ...(opts?.idempotencyKey ? { 'X-Idempotency-Key': opts.idempotencyKey } : {}) },
      timeout: 0,
      onUploadProgress: opts?.onUploadProgress,
      signal: opts?.signal,
    }).then(r => r.data),
  addProviderPhotosToGallery: (journeyId: number, provider: string, assetIds: string[], passphrase?: string) => apiClient.post(`/journeys/${journeyId}/gallery/provider-photos`, { provider, asset_ids: assetIds, ...(passphrase ? { passphrase } : {}) } satisfies JourneyProviderPhotosRequest).then(r => r.data),
  addProviderPhoto: (entryId: number, provider: string, assetId: string, caption?: string, passphrase?: string) => apiClient.post(`/journeys/entries/${entryId}/provider-photos`, { provider, asset_id: assetId, caption, ...(passphrase ? { passphrase } : {}) }).then(r => r.data),
  addProviderPhotos: (entryId: number, provider: string, assetIds: string[], caption?: string, passphrase?: string) => apiClient.post(`/journeys/entries/${entryId}/provider-photos`, { provider, asset_ids: assetIds, caption, ...(passphrase ? { passphrase } : {}) }).then(r => r.data),
  linkPhoto: (entryId: number, journeyPhotoId: number) => apiClient.post(`/journeys/entries/${entryId}/link-photo`, { journey_photo_id: journeyPhotoId }).then(r => r.data),
  unlinkPhoto: (entryId: number, journeyPhotoId: number) => apiClient.delete(`/journeys/entries/${entryId}/photos/${journeyPhotoId}`).then(r => r.data),
  deleteGalleryPhoto: (journeyId: number, journeyPhotoId: number) => apiClient.delete(`/journeys/${journeyId}/gallery/${journeyPhotoId}`).then(r => r.data),
  updatePhoto: (photoId: number, data: Record<string, unknown>) => apiClient.patch(`/journeys/photos/${photoId}`, data).then(r => r.data),
  deletePhoto: (photoId: number) => apiClient.delete(`/journeys/photos/${photoId}`).then(r => r.data),

  // Cover
  uploadCover: (id: number, formData: FormData) => apiClient.post(`/journeys/${id}/cover`, formData, { headers: { 'Content-Type': undefined as any } }).then(r => r.data),

  // Contributors
  addContributor: (id: number, userId: number, role: string) => apiClient.post(`/journeys/${id}/contributors`, { user_id: userId, role }).then(r => r.data),
  updateContributor: (id: number, userId: number, role: string) => apiClient.patch(`/journeys/${id}/contributors/${userId}`, { role }).then(r => r.data),
  removeContributor: (id: number, userId: number) => apiClient.delete(`/journeys/${id}/contributors/${userId}`).then(r => r.data),

  // Preferences
  updatePreferences: (id: number, data: { hide_skeletons?: boolean }) => apiClient.patch(`/journeys/${id}/preferences`, data).then(r => r.data),

  // Share
  getShareLink: (id: number) => apiClient.get(`/journeys/${id}/share-link`).then(r => r.data),
  createShareLink: (id: number, perms: JourneyShareLinkRequest) => apiClient.post(`/journeys/${id}/share-link`, perms).then(r => r.data),
  deleteShareLink: (id: number) => apiClient.delete(`/journeys/${id}/share-link`).then(r => r.data),
  getPublicJourney: (token: string) => apiClient.get(`/public/journey/${token}`).then(r => r.data),
}

export const mapsApi = {
  search: (query: string, lang?: string) => apiClient.post(`/maps/search?lang=${lang || 'en'}`, { query }).then(r => checkInDev(mapsSearchResultSchema, r.data, 'maps.search')),
  autocomplete: (input: string, lang?: string, locationBias?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } }, signal?: AbortSignal) =>
      apiClient.post('/maps/autocomplete', { input, lang, locationBias }, { signal }).then(r => checkInDev(mapsAutocompleteResultSchema, r.data, 'maps.autocomplete')),
  details: (placeId: string, lang?: string) => apiClient.get(`/maps/details/${encodeURIComponent(placeId)}`, { params: { lang } }).then(r => checkInDev(mapsPlaceDetailsResultSchema, r.data, 'maps.details')),
  placePhoto: (placeId: string, lat?: number, lng?: number, name?: string) => apiClient.get(`/maps/place-photo/${encodeURIComponent(placeId)}`, { params: { lat, lng, name } }).then(r => checkInDev(mapsPlacePhotoResultSchema, r.data, 'maps.placePhoto')),
  reverse: (lat: number, lng: number, lang?: string) => apiClient.get('/maps/reverse', { params: { lat, lng, lang } }).then(r => checkInDev(mapsReverseResultSchema, r.data, 'maps.reverse')),
  resolveUrl: (url: string) => apiClient.post('/maps/resolve-url', { url }).then(r => checkInDev(mapsResolveUrlResultSchema, r.data, 'maps.resolveUrl')),
  // OSM-only POI explore: places of a category within the current map viewport bbox.
  // Overpass can be slow on a fresh (uncached) area, so this call gets a longer
  // timeout than the global default instead of aborting at 8s and showing nothing.
  pois: (category: string, bbox: { south: number; west: number; north: number; east: number }, signal?: AbortSignal) =>
    apiClient.get('/maps/pois', { params: { category, ...bbox }, signal, timeout: 20000 }).then(r => r.data as { pois: import('../components/Map/poiCategories').Poi[]; source: string; truncated: boolean; clamped?: boolean }),
}

export const airportsApi = {
  search: (q: string, signal?: AbortSignal) => apiClient.get('/airports/search', { params: { q }, signal }).then(r => r.data),
  byIata: (iata: string) => apiClient.get(`/airports/${encodeURIComponent(iata)}`).then(r => r.data),
}

export const budgetApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/budget`).then(r => r.data),
  create: (tripId: number | string, data: BudgetCreateItemRequest) => apiClient.post(`/trips/${tripId}/budget`, data).then(r => r.data),
  update: (tripId: number | string, id: number, data: BudgetUpdateItemRequest) => apiClient.put(`/trips/${tripId}/budget/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/budget/${id}`).then(r => r.data),
  setMembers: (tripId: number | string, id: number, userIds: number[]) => apiClient.put(`/trips/${tripId}/budget/${id}/members`, { user_ids: userIds } satisfies BudgetUpdateMembersRequest).then(r => r.data),
  togglePaid: (tripId: number | string, id: number, userId: number, paid: boolean) => apiClient.put(`/trips/${tripId}/budget/${id}/members/${userId}/paid`, { paid } satisfies BudgetToggleMemberPaidRequest).then(r => r.data),
  setPayers: (tripId: number | string, id: number, payers: { user_id: number; amount: number }[]) => apiClient.put(`/trips/${tripId}/budget/${id}/payers`, { payers }).then(r => r.data),
  perPersonSummary: (tripId: number | string) => apiClient.get(`/trips/${tripId}/budget/summary/per-person`).then(r => r.data),
  settlement: (tripId: number | string, base?: string) => apiClient.get(`/trips/${tripId}/budget/settlement`, base ? { params: { base } } : undefined).then(r => r.data),
  createSettlement: (tripId: number | string, data: { from_user_id: number; to_user_id: number; amount: number }) => apiClient.post(`/trips/${tripId}/budget/settlements`, data).then(r => r.data),
  updateSettlement: (tripId: number | string, settlementId: number, data: { from_user_id: number; to_user_id: number; amount: number }) => apiClient.put(`/trips/${tripId}/budget/settlements/${settlementId}`, data).then(r => r.data),
  deleteSettlement: (tripId: number | string, settlementId: number) => apiClient.delete(`/trips/${tripId}/budget/settlements/${settlementId}`).then(r => r.data),
  reorderItems: (tripId: number | string, orderedIds: number[]) => apiClient.put(`/trips/${tripId}/budget/reorder/items`, { orderedIds }).then(r => r.data),
  reorderCategories: (tripId: number | string, orderedCategories: string[]) => apiClient.put(`/trips/${tripId}/budget/reorder/categories`, { orderedCategories } satisfies BudgetReorderCategoriesRequest).then(r => r.data),
}

export const filesApi = {
  list: (tripId: number | string, trash?: boolean) => apiClient.get(`/trips/${tripId}/files`, { params: trash ? { trash: 'true' } : {} }).then(r => r.data),
  upload: (tripId: number | string, formData: FormData) => apiClient.post(`/trips/${tripId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  update: (tripId: number | string, id: number, data: FileUpdateRequest) => apiClient.put(`/trips/${tripId}/files/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/files/${id}`).then(r => r.data),
  toggleStar: (tripId: number | string, id: number) => apiClient.patch(`/trips/${tripId}/files/${id}/star`).then(r => r.data),
  restore: (tripId: number | string, id: number) => apiClient.post(`/trips/${tripId}/files/${id}/restore`).then(r => r.data),
  permanentDelete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/files/${id}/permanent`).then(r => r.data),
  emptyTrash: (tripId: number | string) => apiClient.delete(`/trips/${tripId}/files/trash/empty`).then(r => r.data),
  addLink: (tripId: number | string, fileId: number, data: FileLinkRequest) => apiClient.post(`/trips/${tripId}/files/${fileId}/link`, data).then(r => r.data),
  removeLink: (tripId: number | string, fileId: number, linkId: number) => apiClient.delete(`/trips/${tripId}/files/${fileId}/link/${linkId}`).then(r => r.data),
  getLinks: (tripId: number | string, fileId: number) => apiClient.get(`/trips/${tripId}/files/${fileId}/links`).then(r => r.data),
}

export const reservationsApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/reservations`).then(r => r.data),
  upcoming: () => apiClient.get('/reservations/upcoming').then(r => r.data),
  create: (tripId: number | string, data: ReservationCreateRequest) => apiClient.post(`/trips/${tripId}/reservations`, data).then(r => r.data),
  update: (tripId: number | string, id: number, data: ReservationUpdateRequest) => apiClient.put(`/trips/${tripId}/reservations/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/reservations/${id}`).then(r => r.data),
  updatePositions: (tripId: number | string, positions: { id: number; day_plan_position: number }[], dayId?: number) => apiClient.put(`/trips/${tripId}/reservations/positions`, { positions, day_id: dayId }).then(r => r.data),
  importBookingPreview: (tripId: number | string, files: File[]): Promise<BookingImportPreviewResponse> => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    return apiClient.post(`/trips/${tripId}/reservations/import/booking`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  importBookingConfirm: (tripId: number | string, items: BookingImportPreviewItem[]): Promise<BookingImportConfirmResponse> =>
    apiClient.post(`/trips/${tripId}/reservations/import/booking/confirm`, { items }).then(r => r.data),
}

export const healthApi = {
  features: (): Promise<{ bookingImport: boolean }> => apiClient.get('/health/features').then(r => r.data),
}

export const weatherApi = {
  get: (lat: number, lng: number, date: string): Promise<WeatherResult> => apiClient.get('/weather', { params: { lat, lng, date } }).then(r => parseInDev(weatherResultSchema, r.data, 'weather.get')),
  getDetailed: (lat: number, lng: number, date: string, lang?: string): Promise<WeatherResult> => apiClient.get('/weather/detailed', { params: { lat, lng, date, lang } }).then(r => parseInDev(weatherResultSchema, r.data, 'weather.getDetailed')),
}

export const configApi = {
  getPublicConfig: (): Promise<{ defaultLanguage: string }> =>
      apiClient.get('/config').then(r => r.data),
}

export const settingsApi = {
  get: () => apiClient.get('/settings').then(r => r.data),
  set: (key: string, value: unknown) => {
    const body: SettingUpsertRequest = { key, value }
    return apiClient.put('/settings', body).then(r => r.data)
  },
  setBulk: (settings: Record<string, unknown>) => {
    const body: SettingsBulkRequest = { settings }
    return apiClient.post('/settings/bulk', body).then(r => r.data)
  },
}

export const accommodationsApi = {
  list: (tripId: number | string) => apiClient.get(`/trips/${tripId}/accommodations`).then(r => r.data),
  create: (tripId: number | string, data: AccommodationCreateRequest) => apiClient.post(`/trips/${tripId}/accommodations`, data).then(r => r.data),
  update: (tripId: number | string, id: number, data: AccommodationUpdateRequest) => apiClient.put(`/trips/${tripId}/accommodations/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/accommodations/${id}`).then(r => r.data),
}

export const dayNotesApi = {
  list: (tripId: number | string, dayId: number | string) => apiClient.get(`/trips/${tripId}/days/${dayId}/notes`).then(r => r.data),
  create: (tripId: number | string, dayId: number | string, data: DayNoteCreateRequest) => apiClient.post(`/trips/${tripId}/days/${dayId}/notes`, data).then(r => r.data),
  update: (tripId: number | string, dayId: number | string, id: number, data: DayNoteUpdateRequest) => apiClient.put(`/trips/${tripId}/days/${dayId}/notes/${id}`, data).then(r => r.data),
  delete: (tripId: number | string, dayId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/days/${dayId}/notes/${id}`).then(r => r.data),
}

export const collabApi = {
  getNotes: (tripId: number | string) => apiClient.get(`/trips/${tripId}/collab/notes`).then(r => r.data),
  createNote: (tripId: number | string, data: CollabNoteCreateRequest) => apiClient.post(`/trips/${tripId}/collab/notes`, data).then(r => r.data),
  updateNote: (tripId: number | string, id: number, data: CollabNoteUpdateRequest) => apiClient.put(`/trips/${tripId}/collab/notes/${id}`, data).then(r => r.data),
  deleteNote: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/collab/notes/${id}`).then(r => r.data),
  uploadNoteFile: (tripId: number | string, noteId: number, formData: FormData) => apiClient.post(`/trips/${tripId}/collab/notes/${noteId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  deleteNoteFile: (tripId: number | string, noteId: number, fileId: number) => apiClient.delete(`/trips/${tripId}/collab/notes/${noteId}/files/${fileId}`).then(r => r.data),
  getPolls: (tripId: number | string) => apiClient.get(`/trips/${tripId}/collab/polls`).then(r => r.data),
  createPoll: (tripId: number | string, data: CollabPollCreateRequest) => apiClient.post(`/trips/${tripId}/collab/polls`, data).then(r => r.data),
  votePoll: (tripId: number | string, id: number, optionIndex: number) => apiClient.post(`/trips/${tripId}/collab/polls/${id}/vote`, { option_index: optionIndex } satisfies CollabPollVoteRequest).then(r => r.data),
  closePoll: (tripId: number | string, id: number) => apiClient.put(`/trips/${tripId}/collab/polls/${id}/close`).then(r => r.data),
  deletePoll: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/collab/polls/${id}`).then(r => r.data),
  getMessages: (tripId: number | string, before?: string) => apiClient.get(`/trips/${tripId}/collab/messages${before ? `?before=${before}` : ''}`).then(r => r.data),
  sendMessage: (tripId: number | string, data: CollabMessageCreateRequest) => apiClient.post(`/trips/${tripId}/collab/messages`, data).then(r => r.data),
  deleteMessage: (tripId: number | string, id: number) => apiClient.delete(`/trips/${tripId}/collab/messages/${id}`).then(r => r.data),
  reactMessage: (tripId: number | string, id: number, emoji: string) => apiClient.post(`/trips/${tripId}/collab/messages/${id}/react`, { emoji } satisfies CollabReactionRequest).then(r => r.data),
  linkPreview: (tripId: number | string, url: string) => apiClient.get(`/trips/${tripId}/collab/link-preview?url=${encodeURIComponent(url)}`).then(r => r.data),
}

export const backupApi = {
  list: () => apiClient.get('/backup/list').then(r => r.data),
  create: () => apiClient.post('/backup/create').then(r => r.data),
  download: async (filename: string): Promise<void> => {
    const res = await fetch(`/api/backup/download/${filename}`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
  delete: (filename: string) => apiClient.delete(`/backup/${filename}`).then(r => r.data),
  restore: (filename: string) => apiClient.post(`/backup/restore/${filename}`).then(r => r.data),
  uploadRestore: (file: File) => {
    const form = new FormData()
    form.append('backup', file)
    return apiClient.post('/backup/upload-restore', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  getAutoSettings: () => apiClient.get('/backup/auto-settings').then(r => r.data),
  setAutoSettings: (settings: Record<string, unknown>) => apiClient.put('/backup/auto-settings', settings).then(r => r.data),
}

export const shareApi = {
  getLink: (tripId: number | string) => apiClient.get(`/trips/${tripId}/share-link`).then(r => r.data),
  createLink: (tripId: number | string, perms?: Record<string, boolean>) => apiClient.post(`/trips/${tripId}/share-link`, perms || {}).then(r => r.data),
  deleteLink: (tripId: number | string) => apiClient.delete(`/trips/${tripId}/share-link`).then(r => r.data),
  getSharedTrip: (token: string) => apiClient.get(`/shared/${token}`).then(r => r.data),
}

export const notificationsApi = {
  getPreferences: () => apiClient.get('/notifications/preferences').then(r => r.data),
  updatePreferences: (prefs: Record<string, Record<string, boolean>>) => apiClient.put('/notifications/preferences', prefs).then(r => r.data),
  testSmtp: (email?: string) => apiClient.post('/notifications/test-smtp', { email }).then(r => checkInDev(channelTestResultSchema, r.data, 'notifications.testSmtp')),
  testWebhook: (url?: string) => apiClient.post('/notifications/test-webhook', { url }).then(r => checkInDev(channelTestResultSchema, r.data, 'notifications.testWebhook')),
  testNtfy: (payload: { topic?: string; server?: string | null; token?: string | null }) => apiClient.post('/notifications/test-ntfy', payload).then(r => checkInDev(channelTestResultSchema, r.data, 'notifications.testNtfy')),
}

export const inAppNotificationsApi = {
  list: (params?: { limit?: number; offset?: number; unread_only?: boolean }): Promise<InAppListResult> =>
      apiClient.get('/notifications/in-app', { params }).then(r => parseInDev(inAppListResultSchema, r.data, 'notifications.list')),
  unreadCount: (): Promise<UnreadCountResult> =>
      apiClient.get('/notifications/in-app/unread-count').then(r => parseInDev(unreadCountResultSchema, r.data, 'notifications.unreadCount')),
  markRead: (id: number) =>
      apiClient.put(`/notifications/in-app/${id}/read`).then(r => r.data),
  markUnread: (id: number) =>
      apiClient.put(`/notifications/in-app/${id}/unread`).then(r => r.data),
  markAllRead: () =>
      apiClient.put('/notifications/in-app/read-all').then(r => r.data),
  delete: (id: number) =>
      apiClient.delete(`/notifications/in-app/${id}`).then(r => r.data),
  deleteAll: () =>
      apiClient.delete('/notifications/in-app/all').then(r => r.data),
  respond: (id: number, response: NotificationRespondRequest['response']) =>
      apiClient.post(`/notifications/in-app/${id}/respond`, { response }).then(r => r.data),
}

export default apiClient