// FE-APISURF-001 to FE-APISURF-054
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import {
  apiClient,
  authApi, oauthApi, tripsApi, daysApi, placesApi, assignmentsApi, packingApi, todoApi,
  tagsApi, categoriesApi, adminApi, addonsApi, pluginsApi, airtrailApi, journeyApi,
  mapsApi, airportsApi, budgetApi, filesApi, reservationsApi, healthApi, weatherApi,
  configApi, helpApi, settingsApi, accommodationsApi, dayNotesApi, collabApi, backupApi,
  shareApi, transitApi, tripInviteApi, notificationsApi, inAppNotificationsApi, memoriesApi,
} from './client'

interface Recorded { method: string; url: string; body: unknown }

let log: Recorded[] = []

/** One record per outgoing request: verb, path+query and (parsed) JSON body. */
function recorder() {
  return http.all(/\/api\//, async ({ request }) => {
    const url = new URL(request.url)
    const raw = await request.text()
    let body: unknown
    if (raw) {
      try { body = JSON.parse(raw) } catch { body = raw }
    }
    log.push({ method: request.method, url: url.pathname + url.search, body })
    return HttpResponse.json({ ok: true })
  })
}

beforeEach(() => {
  log = []
  server.use(recorder())
  // parseInDev/checkInDev warn on every stub payload that doesn't match its
  // @trek/shared schema — expected here, so keep the output readable.
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

interface Call { n: string; r: () => Promise<unknown>; e: string }

/** Runs every call in isolation and checks the verb + path it produced. */
async function assertCalls(calls: Call[]): Promise<void> {
  for (const c of calls) {
    log = []
    await c.r()
    expect(log.length, `${c.n}: expected exactly one request`).toBe(1)
    const rec = log[0]
    const [path] = rec.url.split('?')
    expect(`${rec.method} ${path}`, c.n).toBe(c.e)
  }
}

/** Runs one call and returns the request it produced. */
async function traceOne(run: () => Promise<unknown>): Promise<Recorded> {
  log = []
  await run()
  expect(log).toHaveLength(1)
  return log[0]
}

describe('client > endpoint wiring', () => {
  it('FE-APISURF-001: authApi maps every method to its auth endpoint', async () => {
    await assertCalls([
      { n: 'register', r: () => authApi.register({ email: 'a@b.c', password: 'pw' }), e: 'POST /api/auth/register' },
      { n: 'validateInvite', r: () => authApi.validateInvite('inv-tok'), e: 'GET /api/auth/invite/inv-tok' },
      { n: 'login', r: () => authApi.login({ email: 'a@b.c', password: 'pw' }), e: 'POST /api/auth/login' },
      { n: 'verifyMfaLogin', r: () => authApi.verifyMfaLogin({ mfa_token: 'm', code: '123456' }), e: 'POST /api/auth/mfa/verify-login' },
      { n: 'mfaSetup', r: () => authApi.mfaSetup(), e: 'POST /api/auth/mfa/setup' },
      { n: 'mfaEnable', r: () => authApi.mfaEnable({ code: '123456' }), e: 'POST /api/auth/mfa/enable' },
      { n: 'mfaDisable', r: () => authApi.mfaDisable({ password: 'pw', code: '123456' }), e: 'POST /api/auth/mfa/disable' },
      { n: 'me', r: () => authApi.me(), e: 'GET /api/auth/me' },
      { n: 'updateMapsKey', r: () => authApi.updateMapsKey('gkey'), e: 'PUT /api/auth/me/maps-key' },
      { n: 'updateApiKeys', r: () => authApi.updateApiKeys({ google_maps: null }), e: 'PUT /api/auth/me/api-keys' },
      { n: 'updateSettings', r: () => authApi.updateSettings({ theme: 'dark' }), e: 'PUT /api/auth/me/settings' },
      { n: 'getSettings', r: () => authApi.getSettings(), e: 'GET /api/auth/me/settings' },
      { n: 'listUsers', r: () => authApi.listUsers(), e: 'GET /api/auth/users' },
      { n: 'deleteAvatar', r: () => authApi.deleteAvatar(), e: 'DELETE /api/auth/avatar' },
      { n: 'getAppConfig', r: () => authApi.getAppConfig(), e: 'GET /api/auth/app-config' },
      { n: 'updateAppSettings', r: () => authApi.updateAppSettings({ registration_enabled: true }), e: 'PUT /api/auth/app-settings' },
      { n: 'validateKeys', r: () => authApi.validateKeys(), e: 'GET /api/auth/validate-keys' },
      { n: 'travelStats', r: () => authApi.travelStats(), e: 'GET /api/auth/travel-stats' },
      { n: 'changePassword', r: () => authApi.changePassword({ current_password: 'a', new_password: 'b' }), e: 'PUT /api/auth/me/password' },
      { n: 'forgotPassword', r: () => authApi.forgotPassword({ email: 'a@b.c' }), e: 'POST /api/auth/forgot-password' },
      { n: 'resetPassword', r: () => authApi.resetPassword({ token: 't', new_password: 'b' }), e: 'POST /api/auth/reset-password' },
      { n: 'deleteOwnAccount', r: () => authApi.deleteOwnAccount(), e: 'DELETE /api/auth/me' },
      { n: 'demoLogin', r: () => authApi.demoLogin(), e: 'POST /api/auth/demo-login' },
      { n: 'mcpTokens.list', r: () => authApi.mcpTokens.list(), e: 'GET /api/auth/mcp-tokens' },
      { n: 'mcpTokens.create', r: () => authApi.mcpTokens.create('cli'), e: 'POST /api/auth/mcp-tokens' },
      { n: 'mcpTokens.delete', r: () => authApi.mcpTokens.delete(7), e: 'DELETE /api/auth/mcp-tokens/7' },
      { n: 'passkey.registerOptions', r: () => authApi.passkey.registerOptions('pw'), e: 'POST /api/auth/passkey/register/options' },
      { n: 'passkey.registerVerify', r: () => authApi.passkey.registerVerify({ id: 'cred' }, 'Yubikey'), e: 'POST /api/auth/passkey/register/verify' },
      { n: 'passkey.loginOptions', r: () => authApi.passkey.loginOptions(), e: 'POST /api/auth/passkey/login/options' },
      { n: 'passkey.loginVerify', r: () => authApi.passkey.loginVerify({ id: 'cred' }), e: 'POST /api/auth/passkey/login/verify' },
      { n: 'passkey.list', r: () => authApi.passkey.list(), e: 'GET /api/auth/passkey/credentials' },
      { n: 'passkey.rename', r: () => authApi.passkey.rename(3, 'Phone'), e: 'PATCH /api/auth/passkey/credentials/3' },
      { n: 'passkey.delete', r: () => authApi.passkey.delete(3, 'pw'), e: 'DELETE /api/auth/passkey/credentials/3' },
    ])
  })

  it('FE-APISURF-002: oauthApi maps consent + client/session management endpoints', async () => {
    const params = {
      response_type: 'code', client_id: 'cid', redirect_uri: 'https://app/cb',
      scope: 'trips:read', code_challenge: 'chal', code_challenge_method: 'S256',
    }
    await assertCalls([
      { n: 'validate', r: () => oauthApi.validate(params), e: 'GET /api/oauth/authorize/validate' },
      { n: 'authorize', r: () => oauthApi.authorize({ ...params, approved: true }), e: 'POST /api/oauth/authorize' },
      { n: 'clients.list', r: () => oauthApi.clients.list(), e: 'GET /api/oauth/clients' },
      { n: 'clients.create', r: () => oauthApi.clients.create({ name: 'App', allowed_scopes: ['trips:read'] }), e: 'POST /api/oauth/clients' },
      { n: 'clients.rotate', r: () => oauthApi.clients.rotate('cid'), e: 'POST /api/oauth/clients/cid/rotate' },
      { n: 'clients.delete', r: () => oauthApi.clients.delete('cid'), e: 'DELETE /api/oauth/clients/cid' },
      { n: 'sessions.list', r: () => oauthApi.sessions.list(), e: 'GET /api/oauth/sessions' },
      { n: 'sessions.revoke', r: () => oauthApi.sessions.revoke(4), e: 'DELETE /api/oauth/sessions/4' },
    ])
  })

  it('FE-APISURF-003: tripsApi maps trip, member and guest endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => tripsApi.list(), e: 'GET /api/trips' },
      { n: 'create', r: () => tripsApi.create({ title: 'Rome' }), e: 'POST /api/trips' },
      { n: 'get', r: () => tripsApi.get(3), e: 'GET /api/trips/3' },
      { n: 'update', r: () => tripsApi.update(3, { title: 'Rome 2' }), e: 'PUT /api/trips/3' },
      { n: 'delete', r: () => tripsApi.delete(3), e: 'DELETE /api/trips/3' },
      { n: 'searchCoverImages', r: () => tripsApi.searchCoverImages('rome'), e: 'GET /api/trips/cover-images/search' },
      { n: 'archive', r: () => tripsApi.archive(3), e: 'PUT /api/trips/3' },
      { n: 'unarchive', r: () => tripsApi.unarchive(3), e: 'PUT /api/trips/3' },
      { n: 'getMembers', r: () => tripsApi.getMembers(3), e: 'GET /api/trips/3/members' },
      { n: 'addMember', r: () => tripsApi.addMember(3, 'bob'), e: 'POST /api/trips/3/members' },
      { n: 'removeMember', r: () => tripsApi.removeMember(3, 9), e: 'DELETE /api/trips/3/members/9' },
      { n: 'transferOwnership', r: () => tripsApi.transferOwnership(3, 9), e: 'POST /api/trips/3/transfer' },
      { n: 'createGuest', r: () => tripsApi.createGuest(3, 'Anna'), e: 'POST /api/trips/3/guests' },
      { n: 'renameGuest', r: () => tripsApi.renameGuest(3, 9, 'Ana'), e: 'PUT /api/trips/3/guests/9' },
      { n: 'deleteGuest', r: () => tripsApi.deleteGuest(3, 9), e: 'DELETE /api/trips/3/guests/9' },
      { n: 'copy', r: () => tripsApi.copy(3, { title: 'Copy' }), e: 'POST /api/trips/3/copy' },
      { n: 'bundle', r: () => tripsApi.bundle(3), e: 'GET /api/trips/3/bundle' },
    ])
  })

  it('FE-APISURF-004: daysApi and dayNotesApi map their nested trip endpoints', async () => {
    await assertCalls([
      { n: 'days.list', r: () => daysApi.list(1), e: 'GET /api/trips/1/days' },
      { n: 'days.create', r: () => daysApi.create(1, { date: '2026-06-01' }), e: 'POST /api/trips/1/days' },
      { n: 'days.update', r: () => daysApi.update(1, 2, { notes: 'hi' }), e: 'PUT /api/trips/1/days/2' },
      { n: 'days.updateTransport', r: () => daysApi.updateTransport(1, 2, 'car'), e: 'PUT /api/trips/1/days/2/transport' },
      { n: 'days.delete', r: () => daysApi.delete(1, 2), e: 'DELETE /api/trips/1/days/2' },
      { n: 'days.reorder', r: () => daysApi.reorder(1, [2, 1]), e: 'PUT /api/trips/1/days/reorder' },
      { n: 'dayNotes.list', r: () => dayNotesApi.list(1, 2), e: 'GET /api/trips/1/days/2/notes' },
      { n: 'dayNotes.create', r: () => dayNotesApi.create(1, 2, { text: 'note' }), e: 'POST /api/trips/1/days/2/notes' },
      { n: 'dayNotes.update', r: () => dayNotesApi.update(1, 2, 5, { text: 'edit' }), e: 'PUT /api/trips/1/days/2/notes/5' },
      { n: 'dayNotes.delete', r: () => dayNotesApi.delete(1, 2, 5), e: 'DELETE /api/trips/1/days/2/notes/5' },
    ])
  })

  it('FE-APISURF-005: placesApi maps CRUD, rating and list-import endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => placesApi.list(1), e: 'GET /api/trips/1/places' },
      { n: 'create', r: () => placesApi.create(1, { name: 'Colosseum' }), e: 'POST /api/trips/1/places' },
      { n: 'get', r: () => placesApi.get(1, 5), e: 'GET /api/trips/1/places/5' },
      { n: 'update', r: () => placesApi.update(1, 5, { name: 'Forum' }), e: 'PUT /api/trips/1/places/5' },
      { n: 'delete', r: () => placesApi.delete(1, 5), e: 'DELETE /api/trips/1/places/5' },
      { n: 'searchImage', r: () => placesApi.searchImage(1, 5), e: 'GET /api/trips/1/places/5/image' },
      { n: 'importGoogleList', r: () => placesApi.importGoogleList(1, 'https://maps.app/x'), e: 'POST /api/trips/1/places/import/google-list' },
      { n: 'importNaverList', r: () => placesApi.importNaverList(1, 'https://naver/x'), e: 'POST /api/trips/1/places/import/naver-list' },
      { n: 'bulkDelete', r: () => placesApi.bulkDelete(1, [5, 6]), e: 'POST /api/trips/1/places/bulk-delete' },
      { n: 'bulkUpdate', r: () => placesApi.bulkUpdate(1, [5], { category_id: 2 }), e: 'POST /api/trips/1/places/bulk-update' },
    ])
  })

  it('FE-APISURF-006: assignmentsApi maps day-plan endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => assignmentsApi.list(1, 2), e: 'GET /api/trips/1/days/2/assignments' },
      { n: 'create', r: () => assignmentsApi.create(1, 2, { place_id: 5 }), e: 'POST /api/trips/1/days/2/assignments' },
      { n: 'delete', r: () => assignmentsApi.delete(1, 2, 7), e: 'DELETE /api/trips/1/days/2/assignments/7' },
      { n: 'reorder', r: () => assignmentsApi.reorder(1, 2, [7, 8]), e: 'PUT /api/trips/1/days/2/assignments/reorder' },
      { n: 'move', r: () => assignmentsApi.move(1, 7, 3, 0), e: 'PUT /api/trips/1/assignments/7/move' },
      { n: 'update', r: () => assignmentsApi.update(1, 2, 7, { notes: 'x' }), e: 'PUT /api/trips/1/days/2/assignments/7' },
      { n: 'getParticipants', r: () => assignmentsApi.getParticipants(1, 7), e: 'GET /api/trips/1/assignments/7/participants' },
      { n: 'setParticipants', r: () => assignmentsApi.setParticipants(1, 7, [4]), e: 'PUT /api/trips/1/assignments/7/participants' },
      { n: 'updateTime', r: () => assignmentsApi.updateTime(1, 7, { place_time: '09:00' }), e: 'PUT /api/trips/1/assignments/7/time' },
      { n: 'updateTransport', r: () => assignmentsApi.updateTransport(1, 7, null), e: 'PUT /api/trips/1/assignments/7/transport' },
    ])
  })

  it('FE-APISURF-007: packingApi maps item, bag and template endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => packingApi.list(1), e: 'GET /api/trips/1/packing' },
      { n: 'create', r: () => packingApi.create(1, { name: 'Towel' }), e: 'POST /api/trips/1/packing' },
      { n: 'bulkImport', r: () => packingApi.bulkImport(1, [{ name: 'Socks' }]), e: 'POST /api/trips/1/packing/import' },
      { n: 'update', r: () => packingApi.update(1, 4, { checked: true }), e: 'PUT /api/trips/1/packing/4' },
      { n: 'delete', r: () => packingApi.delete(1, 4), e: 'DELETE /api/trips/1/packing/4' },
      { n: 'reorder', r: () => packingApi.reorder(1, [4, 5]), e: 'PUT /api/trips/1/packing/reorder' },
      { n: 'setSharing', r: () => packingApi.setSharing(1, 4, { visibility: 'shared' }), e: 'PUT /api/trips/1/packing/4/sharing' },
      { n: 'clone', r: () => packingApi.clone(1, 4), e: 'POST /api/trips/1/packing/4/clone' },
      { n: 'addContributor', r: () => packingApi.addContributor(1, 4), e: 'POST /api/trips/1/packing/4/contributors' },
      { n: 'removeContributor', r: () => packingApi.removeContributor(1, 4, 9), e: 'DELETE /api/trips/1/packing/4/contributors/9' },
      { n: 'getCategoryAssignees', r: () => packingApi.getCategoryAssignees(1), e: 'GET /api/trips/1/packing/category-assignees' },
      { n: 'listTemplates', r: () => packingApi.listTemplates(1), e: 'GET /api/trips/1/packing/templates' },
      { n: 'applyTemplate', r: () => packingApi.applyTemplate(1, 6), e: 'POST /api/trips/1/packing/apply-template/6' },
      { n: 'saveAsTemplate', r: () => packingApi.saveAsTemplate(1, 'Beach'), e: 'POST /api/trips/1/packing/save-as-template' },
      { n: 'setBagMembers', r: () => packingApi.setBagMembers(1, 2, [9]), e: 'PUT /api/trips/1/packing/bags/2/members' },
      { n: 'listBags', r: () => packingApi.listBags(1), e: 'GET /api/trips/1/packing/bags' },
      { n: 'createBag', r: () => packingApi.createBag(1, { name: 'Carry-on' }), e: 'POST /api/trips/1/packing/bags' },
      { n: 'updateBag', r: () => packingApi.updateBag(1, 2, { name: 'Hold' }), e: 'PUT /api/trips/1/packing/bags/2' },
      { n: 'deleteBag', r: () => packingApi.deleteBag(1, 2), e: 'DELETE /api/trips/1/packing/bags/2' },
    ])
  })

  it('FE-APISURF-008: todoApi maps todo endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => todoApi.list(1), e: 'GET /api/trips/1/todo' },
      { n: 'create', r: () => todoApi.create(1, { name: 'Book train' }), e: 'POST /api/trips/1/todo' },
      { n: 'update', r: () => todoApi.update(1, 3, { checked: true }), e: 'PUT /api/trips/1/todo/3' },
      { n: 'delete', r: () => todoApi.delete(1, 3), e: 'DELETE /api/trips/1/todo/3' },
      { n: 'reorder', r: () => todoApi.reorder(1, [3, 4]), e: 'PUT /api/trips/1/todo/reorder' },
      { n: 'getCategoryAssignees', r: () => todoApi.getCategoryAssignees(1), e: 'GET /api/trips/1/todo/category-assignees' },
    ])
  })

  it('FE-APISURF-009: tagsApi and categoriesApi map their global endpoints', async () => {
    await assertCalls([
      { n: 'tags.list', r: () => tagsApi.list(), e: 'GET /api/tags' },
      { n: 'tags.create', r: () => tagsApi.create({ name: 'Food' }), e: 'POST /api/tags' },
      { n: 'tags.update', r: () => tagsApi.update(2, { name: 'Eat' }), e: 'PUT /api/tags/2' },
      { n: 'tags.delete', r: () => tagsApi.delete(2), e: 'DELETE /api/tags/2' },
      { n: 'categories.list', r: () => categoriesApi.list(), e: 'GET /api/categories' },
      { n: 'categories.create', r: () => categoriesApi.create({ name: 'Museum' }), e: 'POST /api/categories' },
      { n: 'categories.update', r: () => categoriesApi.update(2, { name: 'Art' }), e: 'PUT /api/categories/2' },
      { n: 'categories.delete', r: () => categoriesApi.delete(2), e: 'DELETE /api/categories/2' },
    ])
  })

  it('FE-APISURF-010: adminApi maps user, addon and settings endpoints', async () => {
    await assertCalls([
      { n: 'users', r: () => adminApi.users(), e: 'GET /api/admin/users' },
      { n: 'createUser', r: () => adminApi.createUser({ email: 'a@b.c' }), e: 'POST /api/admin/users' },
      { n: 'updateUser', r: () => adminApi.updateUser(2, { role: 'admin' }), e: 'PUT /api/admin/users/2' },
      { n: 'deleteUser', r: () => adminApi.deleteUser(2), e: 'DELETE /api/admin/users/2' },
      { n: 'resetUserPasskeys', r: () => adminApi.resetUserPasskeys(2), e: 'DELETE /api/admin/users/2/passkeys' },
      { n: 'stats', r: () => adminApi.stats(), e: 'GET /api/admin/stats' },
      { n: 'saveDemoBaseline', r: () => adminApi.saveDemoBaseline(), e: 'POST /api/admin/save-demo-baseline' },
      { n: 'getOidc', r: () => adminApi.getOidc(), e: 'GET /api/admin/oidc' },
      { n: 'updateOidc', r: () => adminApi.updateOidc({ enabled: true }), e: 'PUT /api/admin/oidc' },
      { n: 'addons', r: () => adminApi.addons(), e: 'GET /api/admin/addons' },
      { n: 'updateAddon', r: () => adminApi.updateAddon(3, { enabled: false }), e: 'PUT /api/admin/addons/3' },
      { n: 'checkVersion', r: () => adminApi.checkVersion(), e: 'GET /api/admin/version-check' },
      { n: 'getBagTracking', r: () => adminApi.getBagTracking(), e: 'GET /api/admin/bag-tracking' },
      { n: 'updateBagTracking', r: () => adminApi.updateBagTracking(true), e: 'PUT /api/admin/bag-tracking' },
      { n: 'getPlacesPhotos', r: () => adminApi.getPlacesPhotos(), e: 'GET /api/admin/places-photos' },
      { n: 'updatePlacesPhotos', r: () => adminApi.updatePlacesPhotos(false), e: 'PUT /api/admin/places-photos' },
      { n: 'getPlacesAutocomplete', r: () => adminApi.getPlacesAutocomplete(), e: 'GET /api/admin/places-autocomplete' },
      { n: 'updatePlacesAutocomplete', r: () => adminApi.updatePlacesAutocomplete(true), e: 'PUT /api/admin/places-autocomplete' },
      { n: 'getPlacesDetails', r: () => adminApi.getPlacesDetails(), e: 'GET /api/admin/places-details' },
      { n: 'updatePlacesDetails', r: () => adminApi.updatePlacesDetails(true), e: 'PUT /api/admin/places-details' },
      { n: 'getCollabFeatures', r: () => adminApi.getCollabFeatures(), e: 'GET /api/admin/collab-features' },
      { n: 'updateCollabFeatures', r: () => adminApi.updateCollabFeatures({ polls: true }), e: 'PUT /api/admin/collab-features' },
      { n: 'getPermissions', r: () => adminApi.getPermissions(), e: 'GET /api/admin/permissions' },
      { n: 'updatePermissions', r: () => adminApi.updatePermissions({ edit_trip: 'member' }), e: 'PUT /api/admin/permissions' },
      { n: 'rotateJwtSecret', r: () => adminApi.rotateJwtSecret(), e: 'POST /api/admin/rotate-jwt-secret' },
      { n: 'sendTestNotification', r: () => adminApi.sendTestNotification({ channel: 'email' }), e: 'POST /api/admin/dev/test-notification' },
      { n: 'getNotificationPreferences', r: () => adminApi.getNotificationPreferences(), e: 'GET /api/admin/notification-preferences' },
      { n: 'updateNotificationPreferences', r: () => adminApi.updateNotificationPreferences({ email: { trip_invite: true } }), e: 'PUT /api/admin/notification-preferences' },
      { n: 'getDefaultUserSettings', r: () => adminApi.getDefaultUserSettings(), e: 'GET /api/admin/default-user-settings' },
      { n: 'updateDefaultUserSettings', r: () => adminApi.updateDefaultUserSettings({ language: 'de' }), e: 'PUT /api/admin/default-user-settings' },
      { n: 'getStorage', r: () => adminApi.getStorage(), e: 'GET /api/admin/storage' },
      { n: 'updateStorage', r: () => adminApi.updateStorage({ backends: [], categories: {}, version: 0 }), e: 'PUT /api/admin/storage' },
      { n: 'testStorageBackend', r: () => adminApi.testStorageBackend({ name: 'x', type: 'local', options: { root: '/data' } }), e: 'POST /api/admin/storage/test' },
      { n: 'startStorageBackfill', r: () => adminApi.startStorageBackfill('m'), e: 'POST /api/admin/storage/backends/m/backfill' },
      { n: 'cancelStorageBackfill', r: () => adminApi.cancelStorageBackfill('m'), e: 'DELETE /api/admin/storage/backends/m/backfill' },
      { n: 'startStorageMigration', r: () => adminApi.startStorageMigration('files', 'dest'), e: 'POST /api/admin/storage/migrations' },
      { n: 'cancelStorageMigration', r: () => adminApi.cancelStorageMigration('files'), e: 'DELETE /api/admin/storage/migrations/files' },
      { n: 'refreshStorageStats', r: () => adminApi.refreshStorageStats(), e: 'POST /api/admin/storage/stats/refresh' },
      { n: 'mcpTokens', r: () => adminApi.mcpTokens(), e: 'GET /api/admin/mcp-tokens' },
      { n: 'deleteMcpToken', r: () => adminApi.deleteMcpToken(4), e: 'DELETE /api/admin/mcp-tokens/4' },
      { n: 'oauthSessions', r: () => adminApi.oauthSessions(), e: 'GET /api/admin/oauth-sessions' },
      { n: 'revokeOAuthSession', r: () => adminApi.revokeOAuthSession(4), e: 'DELETE /api/admin/oauth-sessions/4' },
      { n: 'listInvites', r: () => adminApi.listInvites(), e: 'GET /api/admin/invites' },
      { n: 'listInviteTrips', r: () => adminApi.listInviteTrips(), e: 'GET /api/admin/invites/trips' },
      { n: 'createInvite', r: () => adminApi.createInvite({ max_uses: 3 }), e: 'POST /api/admin/invites' },
      { n: 'deleteInvite', r: () => adminApi.deleteInvite(8), e: 'DELETE /api/admin/invites/8' },
      { n: 'auditLog', r: () => adminApi.auditLog(), e: 'GET /api/admin/audit-log' },
    ])
  })

  it('FE-APISURF-011: adminApi maps the plugin management endpoints', async () => {
    await assertCalls([
      { n: 'plugins', r: () => adminApi.plugins(), e: 'GET /api/admin/plugins' },
      { n: 'pluginBrowse', r: () => adminApi.pluginBrowse(), e: 'GET /api/admin/plugins/registry' },
      { n: 'pluginDetail', r: () => adminApi.pluginDetail('trek/koffi'), e: 'GET /api/admin/plugins/registry/trek%2Fkoffi' },
      { n: 'pluginInstall', r: () => adminApi.pluginInstall('koffi', { version: '1.0.0' }), e: 'POST /api/admin/plugins/install' },
      { n: 'pluginActivate', r: () => adminApi.pluginActivate('koffi'), e: 'POST /api/admin/plugins/koffi/activate' },
      { n: 'pluginDeactivate', r: () => adminApi.pluginDeactivate('koffi'), e: 'POST /api/admin/plugins/koffi/deactivate' },
      { n: 'pluginUpdate', r: () => adminApi.pluginUpdate('koffi'), e: 'POST /api/admin/plugins/koffi/update' },
      { n: 'pluginRetrust', r: () => adminApi.pluginRetrust('koffi', '2.0.0', 'PUBKEY'), e: 'POST /api/admin/plugins/koffi/retrust' },
      { n: 'pluginUninstall', r: () => adminApi.pluginUninstall('koffi', true), e: 'POST /api/admin/plugins/koffi/uninstall' },
      { n: 'pluginRescan', r: () => adminApi.pluginRescan(), e: 'POST /api/admin/plugins/rescan' },
      { n: 'pluginLink', r: () => adminApi.pluginLink('/srv/plugin'), e: 'POST /api/admin/plugins/link' },
      { n: 'pluginReload', r: () => adminApi.pluginReload('koffi'), e: 'POST /api/admin/plugins/koffi/reload' },
      { n: 'pluginEgressHosts', r: () => adminApi.pluginEgressHosts('koffi'), e: 'GET /api/admin/plugins/koffi/egress-hosts' },
      { n: 'pluginSetEgressHosts', r: () => adminApi.pluginSetEgressHosts('koffi', ['a.example']), e: 'PUT /api/admin/plugins/koffi/egress-hosts' },
      { n: 'pluginErrors', r: () => adminApi.pluginErrors('koffi'), e: 'GET /api/admin/plugins/koffi/errors' },
      { n: 'pluginAudit', r: () => adminApi.pluginAudit('koffi'), e: 'GET /api/admin/plugins/koffi/audit' },
      { n: 'llmLocalModels', r: () => adminApi.llmLocalModels('http://ollama:11434'), e: 'GET /api/admin/llm/local/models' },
    ])
  })

  it('FE-APISURF-012: adminApi maps the packing-template endpoints', async () => {
    await assertCalls([
      { n: 'packingTemplates', r: () => adminApi.packingTemplates(), e: 'GET /api/admin/packing-templates' },
      { n: 'getPackingTemplate', r: () => adminApi.getPackingTemplate(1), e: 'GET /api/admin/packing-templates/1' },
      { n: 'createPackingTemplate', r: () => adminApi.createPackingTemplate({ name: 'Ski' }), e: 'POST /api/admin/packing-templates' },
      { n: 'updatePackingTemplate', r: () => adminApi.updatePackingTemplate(1, { name: 'Ski 2' }), e: 'PUT /api/admin/packing-templates/1' },
      { n: 'deletePackingTemplate', r: () => adminApi.deletePackingTemplate(1), e: 'DELETE /api/admin/packing-templates/1' },
      { n: 'addTemplateCategory', r: () => adminApi.addTemplateCategory(1, { name: 'Clothes' }), e: 'POST /api/admin/packing-templates/1/categories' },
      { n: 'updateTemplateCategory', r: () => adminApi.updateTemplateCategory(1, 2, { name: 'Wear' }), e: 'PUT /api/admin/packing-templates/1/categories/2' },
      { n: 'deleteTemplateCategory', r: () => adminApi.deleteTemplateCategory(1, 2), e: 'DELETE /api/admin/packing-templates/1/categories/2' },
      { n: 'addTemplateItem', r: () => adminApi.addTemplateItem(1, 2, { name: 'Gloves' }), e: 'POST /api/admin/packing-templates/1/categories/2/items' },
      { n: 'updateTemplateItem', r: () => adminApi.updateTemplateItem(1, 3, { name: 'Mittens' }), e: 'PUT /api/admin/packing-templates/1/items/3' },
      { n: 'deleteTemplateItem', r: () => adminApi.deleteTemplateItem(1, 3), e: 'DELETE /api/admin/packing-templates/1/items/3' },
    ])
  })

  it('FE-APISURF-013: pluginsApi maps every host-mediated plugin endpoint', async () => {
    await assertCalls([
      { n: 'active', r: () => pluginsApi.active(), e: 'GET /api/plugins' },
      { n: 'placeDetails', r: () => pluginsApi.placeDetails(5), e: 'GET /api/place-details/5' },
      { n: 'tripWarnings', r: () => pluginsApi.tripWarnings(1), e: 'GET /api/trip-warnings/1' },
      { n: 'viewContributions', r: () => pluginsApi.viewContributions('places', 1), e: 'GET /api/view-contributions/places/1' },
      { n: 'mapMarkers', r: () => pluginsApi.mapMarkers(1), e: 'GET /api/map-markers/1' },
      { n: 'mapLayers', r: () => pluginsApi.mapLayers(1), e: 'GET /api/map-layers/1' },
      { n: 'pluginRoute', r: () => pluginsApi.pluginRoute('koffi', 'ev', { tripId: 1, waypoints: [{ lat: 1, lng: 2 }] }), e: 'POST /api/plugin-routes/koffi/ev' },
      { n: 'daySchedule', r: () => pluginsApi.daySchedule(1), e: 'GET /api/day-schedule/1' },
      { n: 'pdfSections', r: () => pluginsApi.pdfSections(1), e: 'GET /api/pdf-sections/1' },
      { n: 'atlasLayers', r: () => pluginsApi.atlasLayers(), e: 'GET /api/atlas-layers' },
      { n: 'journalEntryRows', r: () => pluginsApi.journalEntryRows(9), e: 'GET /api/journal-entry-rows/9' },
      { n: 'tripCardContributions', r: () => pluginsApi.tripCardContributions([1, 2]), e: 'GET /api/trip-card-contributions' },
      { n: 'myActivity', r: () => pluginsApi.myActivity(), e: 'GET /api/plugin-activity' },
      { n: 'userSettings', r: () => pluginsApi.userSettings('koffi'), e: 'GET /api/plugin-settings/koffi' },
      { n: 'runAction', r: () => pluginsApi.runAction('koffi', 'test connection'), e: 'POST /api/plugin-settings/koffi/actions/test%20connection' },
      { n: 'saveUserSettings', r: () => pluginsApi.saveUserSettings('koffi', { key: 'v' }), e: 'POST /api/plugin-settings/koffi' },
      { n: 'oauthStatus', r: () => pluginsApi.oauthStatus('koffi'), e: 'GET /api/plugin-oauth/koffi/status' },
      { n: 'oauthConnect', r: () => pluginsApi.oauthConnect('koffi'), e: 'POST /api/plugin-oauth/koffi/connect' },
      { n: 'oauthDisconnect', r: () => pluginsApi.oauthDisconnect('koffi'), e: 'POST /api/plugin-oauth/koffi/disconnect' },
    ])
  })

  it('FE-APISURF-014: airtrailApi maps the integration endpoints', async () => {
    await assertCalls([
      { n: 'getSettings', r: () => airtrailApi.getSettings(), e: 'GET /api/integrations/airtrail/settings' },
      { n: 'saveSettings', r: () => airtrailApi.saveSettings({ url: 'https://at' }), e: 'PUT /api/integrations/airtrail/settings' },
      { n: 'status', r: () => airtrailApi.status(), e: 'GET /api/integrations/airtrail/status' },
      { n: 'test', r: () => airtrailApi.test({ url: 'https://at' }), e: 'POST /api/integrations/airtrail/test' },
      { n: 'sync', r: () => airtrailApi.sync(), e: 'POST /api/integrations/airtrail/sync' },
      { n: 'flights', r: () => airtrailApi.flights(), e: 'GET /api/integrations/airtrail/flights' },
      { n: 'import', r: () => airtrailApi.import(1, ['f1']), e: 'POST /api/trips/1/reservations/import/airtrail' },
    ])
  })

  it('FE-APISURF-015: journeyApi maps journal, entry and photo endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => journeyApi.list(), e: 'GET /api/journeys' },
      { n: 'create', r: () => journeyApi.create({ title: 'Asia' }), e: 'POST /api/journeys' },
      { n: 'get', r: () => journeyApi.get(2), e: 'GET /api/journeys/2' },
      { n: 'update', r: () => journeyApi.update(2, { title: 'Asia 24' }), e: 'PATCH /api/journeys/2' },
      { n: 'delete', r: () => journeyApi.delete(2), e: 'DELETE /api/journeys/2' },
      { n: 'suggestions', r: () => journeyApi.suggestions(), e: 'GET /api/journeys/suggestions' },
      { n: 'availableTrips', r: () => journeyApi.availableTrips(), e: 'GET /api/journeys/available-trips' },
      { n: 'addTrip', r: () => journeyApi.addTrip(2, 1), e: 'POST /api/journeys/2/trips' },
      { n: 'removeTrip', r: () => journeyApi.removeTrip(2, 1), e: 'DELETE /api/journeys/2/trips/1' },
      { n: 'listEntries', r: () => journeyApi.listEntries(2), e: 'GET /api/journeys/2/entries' },
      { n: 'createEntry', r: () => journeyApi.createEntry(2, { title: 'Day 1' }), e: 'POST /api/journeys/2/entries' },
      { n: 'updateEntry', r: () => journeyApi.updateEntry(9, { title: 'Day 2' }), e: 'PATCH /api/journeys/entries/9' },
      { n: 'deleteEntry', r: () => journeyApi.deleteEntry(9), e: 'DELETE /api/journeys/entries/9' },
      { n: 'reorderEntries', r: () => journeyApi.reorderEntries(2, [9, 8]), e: 'PUT /api/journeys/2/entries/reorder' },
      { n: 'addProviderPhotosToGallery', r: () => journeyApi.addProviderPhotosToGallery(2, 'immich', ['a1']), e: 'POST /api/journeys/2/gallery/provider-photos' },
      { n: 'addProviderPhoto', r: () => journeyApi.addProviderPhoto(9, 'immich', 'a1'), e: 'POST /api/journeys/entries/9/provider-photos' },
      { n: 'addProviderPhotos', r: () => journeyApi.addProviderPhotos(9, 'immich', ['a1']), e: 'POST /api/journeys/entries/9/provider-photos' },
      { n: 'linkPhoto', r: () => journeyApi.linkPhoto(9, 11), e: 'POST /api/journeys/entries/9/link-photo' },
      { n: 'unlinkPhoto', r: () => journeyApi.unlinkPhoto(9, 11), e: 'DELETE /api/journeys/entries/9/photos/11' },
      { n: 'deleteGalleryPhoto', r: () => journeyApi.deleteGalleryPhoto(2, 11), e: 'DELETE /api/journeys/2/gallery/11' },
      { n: 'updatePhoto', r: () => journeyApi.updatePhoto(11, { caption: 'x' }), e: 'PATCH /api/journeys/photos/11' },
      { n: 'deletePhoto', r: () => journeyApi.deletePhoto(11), e: 'DELETE /api/journeys/photos/11' },
      { n: 'addContributor', r: () => journeyApi.addContributor(2, 4, 'editor'), e: 'POST /api/journeys/2/contributors' },
      { n: 'updateContributor', r: () => journeyApi.updateContributor(2, 4, 'viewer'), e: 'PATCH /api/journeys/2/contributors/4' },
      { n: 'removeContributor', r: () => journeyApi.removeContributor(2, 4), e: 'DELETE /api/journeys/2/contributors/4' },
      { n: 'updatePreferences', r: () => journeyApi.updatePreferences(2, { hide_skeletons: true }), e: 'PATCH /api/journeys/2/preferences' },
      { n: 'getShareLink', r: () => journeyApi.getShareLink(2), e: 'GET /api/journeys/2/share-link' },
      { n: 'createShareLink', r: () => journeyApi.createShareLink(2, { share_map: true }), e: 'POST /api/journeys/2/share-link' },
      { n: 'deleteShareLink', r: () => journeyApi.deleteShareLink(2), e: 'DELETE /api/journeys/2/share-link' },
      { n: 'getPublicJourney', r: () => journeyApi.getPublicJourney('pub-tok'), e: 'GET /api/public/journey/pub-tok' },
    ])
  })

  it('FE-APISURF-053: memoriesApi maps the photo-provider endpoints', async () => {
    await assertCalls([
      { n: 'status', r: () => memoriesApi.status('immich'), e: 'GET /api/integrations/memories/immich/status' },
      { n: 'search', r: () => memoriesApi.search('immich', { from: '2026-01-01', to: '2026-01-02', page: 1, size: 50 }), e: 'POST /api/integrations/memories/immich/search' },
      { n: 'albums', r: () => memoriesApi.albums('immich'), e: 'GET /api/integrations/memories/immich/albums' },
      { n: 'albumPhotos', r: () => memoriesApi.albumPhotos('immich', 'alb-1'), e: 'GET /api/integrations/memories/immich/albums/alb-1/photos' },
    ])
  })

  it('FE-APISURF-054: memoriesApi passes the album passphrase as a query parameter', async () => {
    const rec = await traceOne(() => memoriesApi.albumPhotos('synologyphotos', 'alb-2', 'p/w?'))
    expect(rec.url).toBe('/api/integrations/memories/synologyphotos/albums/alb-2/photos?passphrase=p%2Fw%3F')
  })

  it('FE-APISURF-016: mapsApi and airportsApi map the geo endpoints', async () => {
    await assertCalls([
      { n: 'maps.search', r: () => mapsApi.search('Rome'), e: 'POST /api/maps/search' },
      { n: 'maps.autocomplete', r: () => mapsApi.autocomplete('Rom'), e: 'POST /api/maps/autocomplete' },
      { n: 'maps.details', r: () => mapsApi.details('place/1'), e: 'GET /api/maps/details/place%2F1' },
      { n: 'maps.placePhoto', r: () => mapsApi.placePhoto('place/1'), e: 'GET /api/maps/place-photo/place%2F1' },
      { n: 'maps.reverse', r: () => mapsApi.reverse(41.9, 12.5), e: 'GET /api/maps/reverse' },
      { n: 'maps.resolveUrl', r: () => mapsApi.resolveUrl('https://maps.app.goo.gl/x'), e: 'POST /api/maps/resolve-url' },
      { n: 'maps.pois', r: () => mapsApi.pois('cafe', { south: 1, west: 2, north: 3, east: 4 }), e: 'GET /api/maps/pois' },
      { n: 'airports.search', r: () => airportsApi.search('BER'), e: 'GET /api/airports/search' },
      { n: 'airports.byIata', r: () => airportsApi.byIata('b/er'), e: 'GET /api/airports/b%2Fer' },
    ])
  })

  it('FE-APISURF-017: budgetApi maps item, member and settlement endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => budgetApi.list(1), e: 'GET /api/trips/1/budget' },
      { n: 'create', r: () => budgetApi.create(1, { name: 'Hotel' }), e: 'POST /api/trips/1/budget' },
      { n: 'update', r: () => budgetApi.update(1, 2, { name: 'Hostel' }), e: 'PUT /api/trips/1/budget/2' },
      { n: 'delete', r: () => budgetApi.delete(1, 2), e: 'DELETE /api/trips/1/budget/2' },
      { n: 'setMembers', r: () => budgetApi.setMembers(1, 2, [4, 5]), e: 'PUT /api/trips/1/budget/2/members' },
      { n: 'togglePaid', r: () => budgetApi.togglePaid(1, 2, 4, true), e: 'PUT /api/trips/1/budget/2/members/4/paid' },
      { n: 'setPayers', r: () => budgetApi.setPayers(1, 2, [{ user_id: 4, amount: 10 }]), e: 'PUT /api/trips/1/budget/2/payers' },
      { n: 'perPersonSummary', r: () => budgetApi.perPersonSummary(1), e: 'GET /api/trips/1/budget/summary/per-person' },
      { n: 'settlement', r: () => budgetApi.settlement(1), e: 'GET /api/trips/1/budget/settlement' },
      { n: 'createSettlement', r: () => budgetApi.createSettlement(1, { from_user_id: 4, to_user_id: 5, amount: 10 }), e: 'POST /api/trips/1/budget/settlements' },
      { n: 'updateSettlement', r: () => budgetApi.updateSettlement(1, 6, { from_user_id: 4, to_user_id: 5, amount: 12 }), e: 'PUT /api/trips/1/budget/settlements/6' },
      { n: 'deleteSettlement', r: () => budgetApi.deleteSettlement(1, 6), e: 'DELETE /api/trips/1/budget/settlements/6' },
      { n: 'reorderItems', r: () => budgetApi.reorderItems(1, [2, 3]), e: 'PUT /api/trips/1/budget/reorder/items' },
      { n: 'reorderCategories', r: () => budgetApi.reorderCategories(1, ['Food']), e: 'PUT /api/trips/1/budget/reorder/categories' },
    ])
  })

  it('FE-APISURF-018: filesApi maps file, trash and link endpoints', async () => {
    await assertCalls([
      { n: 'list', r: () => filesApi.list(1), e: 'GET /api/trips/1/files' },
      { n: 'update', r: () => filesApi.update(1, 3, { description: 'x' }), e: 'PUT /api/trips/1/files/3' },
      { n: 'delete', r: () => filesApi.delete(1, 3), e: 'DELETE /api/trips/1/files/3' },
      { n: 'toggleStar', r: () => filesApi.toggleStar(1, 3), e: 'PATCH /api/trips/1/files/3/star' },
      { n: 'restore', r: () => filesApi.restore(1, 3), e: 'POST /api/trips/1/files/3/restore' },
      { n: 'permanentDelete', r: () => filesApi.permanentDelete(1, 3), e: 'DELETE /api/trips/1/files/3/permanent' },
      { n: 'emptyTrash', r: () => filesApi.emptyTrash(1), e: 'DELETE /api/trips/1/files/trash/empty' },
      { n: 'addLink', r: () => filesApi.addLink(1, 3, { place_id: 5 }), e: 'POST /api/trips/1/files/3/link' },
      { n: 'removeLink', r: () => filesApi.removeLink(1, 3, 7), e: 'DELETE /api/trips/1/files/3/link/7' },
      { n: 'getLinks', r: () => filesApi.getLinks(1, 3), e: 'GET /api/trips/1/files/3/links' },
    ])
  })

  it('FE-APISURF-019: reservationsApi and accommodationsApi map booking endpoints', async () => {
    await assertCalls([
      { n: 'reservations.list', r: () => reservationsApi.list(1), e: 'GET /api/trips/1/reservations' },
      { n: 'reservations.upcoming', r: () => reservationsApi.upcoming(), e: 'GET /api/reservations/upcoming' },
      { n: 'reservations.create', r: () => reservationsApi.create(1, { title: 'Hotel' }), e: 'POST /api/trips/1/reservations' },
      { n: 'reservations.update', r: () => reservationsApi.update(1, 2, { title: 'Hostel' }), e: 'PUT /api/trips/1/reservations/2' },
      { n: 'reservations.delete', r: () => reservationsApi.delete(1, 2), e: 'DELETE /api/trips/1/reservations/2' },
      { n: 'reservations.setTravelers', r: () => reservationsApi.setTravelers(1, 2, [4]), e: 'PUT /api/trips/1/reservations/2/travelers' },
      { n: 'reservations.updatePositions', r: () => reservationsApi.updatePositions(1, [{ id: 2, day_plan_position: 0 }], 3), e: 'PUT /api/trips/1/reservations/positions' },
      { n: 'reservations.importBookingConfirm', r: () => reservationsApi.importBookingConfirm(1, []), e: 'POST /api/trips/1/reservations/import/booking/confirm' },
      { n: 'reservations.importJobStatus', r: () => reservationsApi.importJobStatus(1, 'job-1'), e: 'GET /api/trips/1/reservations/import/jobs/job-1' },
      { n: 'accommodations.list', r: () => accommodationsApi.list(1), e: 'GET /api/trips/1/accommodations' },
      { n: 'accommodations.create', r: () => accommodationsApi.create(1, { place_id: 5, start_day_id: 1, end_day_id: 2 }), e: 'POST /api/trips/1/accommodations' },
      { n: 'accommodations.update', r: () => accommodationsApi.update(1, 4, { end_day_id: 3 }), e: 'PUT /api/trips/1/accommodations/4' },
      { n: 'accommodations.delete', r: () => accommodationsApi.delete(1, 4), e: 'DELETE /api/trips/1/accommodations/4' },
    ])
  })

  it('FE-APISURF-020: collabApi maps note, poll and message endpoints', async () => {
    await assertCalls([
      { n: 'getNotes', r: () => collabApi.getNotes(1), e: 'GET /api/trips/1/collab/notes' },
      { n: 'createNote', r: () => collabApi.createNote(1, { title: 'Ideas' }), e: 'POST /api/trips/1/collab/notes' },
      { n: 'updateNote', r: () => collabApi.updateNote(1, 2, { title: 'More' }), e: 'PUT /api/trips/1/collab/notes/2' },
      { n: 'deleteNote', r: () => collabApi.deleteNote(1, 2), e: 'DELETE /api/trips/1/collab/notes/2' },
      { n: 'deleteNoteFile', r: () => collabApi.deleteNoteFile(1, 2, 3), e: 'DELETE /api/trips/1/collab/notes/2/files/3' },
      { n: 'getPolls', r: () => collabApi.getPolls(1), e: 'GET /api/trips/1/collab/polls' },
      { n: 'createPoll', r: () => collabApi.createPoll(1, { question: 'Where?', options: ['A', 'B'] }), e: 'POST /api/trips/1/collab/polls' },
      { n: 'votePoll', r: () => collabApi.votePoll(1, 2, 1), e: 'POST /api/trips/1/collab/polls/2/vote' },
      { n: 'closePoll', r: () => collabApi.closePoll(1, 2), e: 'PUT /api/trips/1/collab/polls/2/close' },
      { n: 'deletePoll', r: () => collabApi.deletePoll(1, 2), e: 'DELETE /api/trips/1/collab/polls/2' },
      { n: 'getMessages', r: () => collabApi.getMessages(1), e: 'GET /api/trips/1/collab/messages' },
      { n: 'sendMessage', r: () => collabApi.sendMessage(1, { text: 'hi' }), e: 'POST /api/trips/1/collab/messages' },
      { n: 'deleteMessage', r: () => collabApi.deleteMessage(1, 2), e: 'DELETE /api/trips/1/collab/messages/2' },
      { n: 'reactMessage', r: () => collabApi.reactMessage(1, 2, '👍'), e: 'POST /api/trips/1/collab/messages/2/react' },
      { n: 'linkPreview', r: () => collabApi.linkPreview(1, 'https://x.test/a?b=1'), e: 'GET /api/trips/1/collab/link-preview' },
    ])
  })

  it('FE-APISURF-021: the remaining namespaces map their endpoints', async () => {
    await assertCalls([
      { n: 'addons.enabled', r: () => addonsApi.enabled(), e: 'GET /api/addons' },
      { n: 'health.features', r: () => healthApi.features(), e: 'GET /api/health/features' },
      { n: 'weather.get', r: () => weatherApi.get(41.9, 12.5, '2026-06-01'), e: 'GET /api/weather' },
      { n: 'weather.getCurrent', r: () => weatherApi.getCurrent(41.9, 12.5), e: 'GET /api/weather' },
      { n: 'weather.getDetailed', r: () => weatherApi.getDetailed(41.9, 12.5, '2026-06-01'), e: 'GET /api/weather/detailed' },
      { n: 'config.getPublicConfig', r: () => configApi.getPublicConfig(), e: 'GET /api/config' },
      { n: 'help.index', r: () => helpApi.index(), e: 'GET /api/help/index' },
      { n: 'help.page', r: () => helpApi.page('getting started'), e: 'GET /api/help/page/getting%20started' },
      { n: 'settings.get', r: () => settingsApi.get(), e: 'GET /api/settings' },
      { n: 'settings.set', r: () => settingsApi.set('theme', 'dark'), e: 'PUT /api/settings' },
      { n: 'settings.setBulk', r: () => settingsApi.setBulk({ theme: 'dark' }), e: 'POST /api/settings/bulk' },
      { n: 'backup.list', r: () => backupApi.list(), e: 'GET /api/backup/list' },
      { n: 'backup.create', r: () => backupApi.create(), e: 'POST /api/backup/create' },
      { n: 'backup.delete', r: () => backupApi.delete('b.zip'), e: 'DELETE /api/backup/b.zip' },
      { n: 'backup.restore', r: () => backupApi.restore('b.zip'), e: 'POST /api/backup/restore/b.zip' },
      { n: 'backup.getAutoSettings', r: () => backupApi.getAutoSettings(), e: 'GET /api/backup/auto-settings' },
      { n: 'backup.setAutoSettings', r: () => backupApi.setAutoSettings({ enabled: true }), e: 'PUT /api/backup/auto-settings' },
      { n: 'share.getLink', r: () => shareApi.getLink(1), e: 'GET /api/trips/1/share-link' },
      { n: 'share.createLink', r: () => shareApi.createLink(1, { edit: false }), e: 'POST /api/trips/1/share-link' },
      { n: 'share.deleteLink', r: () => shareApi.deleteLink(1), e: 'DELETE /api/trips/1/share-link' },
      { n: 'share.getSharedTrip', r: () => shareApi.getSharedTrip('tok'), e: 'GET /api/shared/tok' },
      { n: 'transit.geocode', r: () => transitApi.geocode('Roma Termini'), e: 'GET /api/transit/geocode' },
      { n: 'transit.plan', r: () => transitApi.plan({ from: 'a', to: 'b' }), e: 'GET /api/transit/plan' },
      { n: 'tripInvite.getLink', r: () => tripInviteApi.getLink(1), e: 'GET /api/trips/1/invite-link' },
      { n: 'tripInvite.createLink', r: () => tripInviteApi.createLink(1, 7), e: 'POST /api/trips/1/invite-link' },
      { n: 'tripInvite.deleteLink', r: () => tripInviteApi.deleteLink(1), e: 'DELETE /api/trips/1/invite-link' },
      { n: 'tripInvite.preview', r: () => tripInviteApi.preview('tok'), e: 'GET /api/trip-invites/tok' },
      { n: 'tripInvite.accept', r: () => tripInviteApi.accept('tok'), e: 'POST /api/trip-invites/tok/accept' },
      { n: 'notifications.getPreferences', r: () => notificationsApi.getPreferences(), e: 'GET /api/notifications/preferences' },
      { n: 'notifications.updatePreferences', r: () => notificationsApi.updatePreferences({ email: { trip_invite: true } }), e: 'PUT /api/notifications/preferences' },
      { n: 'notifications.testSmtp', r: () => notificationsApi.testSmtp('a@b.c'), e: 'POST /api/notifications/test-smtp' },
      { n: 'notifications.testWebhook', r: () => notificationsApi.testWebhook('https://hook'), e: 'POST /api/notifications/test-webhook' },
      { n: 'notifications.testNtfy', r: () => notificationsApi.testNtfy({ topic: 't' }), e: 'POST /api/notifications/test-ntfy' },
      { n: 'notifications.testChannel', r: () => notificationsApi.testChannel('plugin/ch'), e: 'POST /api/notifications/test/plugin%2Fch' },
      { n: 'inApp.list', r: () => inAppNotificationsApi.list(), e: 'GET /api/notifications/in-app' },
      { n: 'inApp.unreadCount', r: () => inAppNotificationsApi.unreadCount(), e: 'GET /api/notifications/in-app/unread-count' },
      { n: 'inApp.markRead', r: () => inAppNotificationsApi.markRead(3), e: 'PUT /api/notifications/in-app/3/read' },
      { n: 'inApp.markUnread', r: () => inAppNotificationsApi.markUnread(3), e: 'PUT /api/notifications/in-app/3/unread' },
      { n: 'inApp.markAllRead', r: () => inAppNotificationsApi.markAllRead(), e: 'PUT /api/notifications/in-app/read-all' },
      { n: 'inApp.delete', r: () => inAppNotificationsApi.delete(3), e: 'DELETE /api/notifications/in-app/3' },
      { n: 'inApp.deleteAll', r: () => inAppNotificationsApi.deleteAll(), e: 'DELETE /api/notifications/in-app/all' },
      { n: 'inApp.respond', r: () => inAppNotificationsApi.respond(3, 'positive'), e: 'POST /api/notifications/in-app/3/respond' },
    ])
  })
})

describe('client > request payloads', () => {
  it('FE-APISURF-022: reorder helpers wrap their ids in the contract field', async () => {
    expect((await traceOne(() => daysApi.reorder(1, [3, 1, 2]))).body).toEqual({ orderedIds: [3, 1, 2] })
    expect((await traceOne(() => packingApi.reorder(1, [2, 1]))).body).toEqual({ orderedIds: [2, 1] })
    expect((await traceOne(() => todoApi.reorder(1, [9]))).body).toEqual({ orderedIds: [9] })
    expect((await traceOne(() => budgetApi.reorderItems(1, [4, 5]))).body).toEqual({ orderedIds: [4, 5] })
    expect((await traceOne(() => budgetApi.reorderCategories(1, ['Food', 'Fun']))).body)
      .toEqual({ orderedCategories: ['Food', 'Fun'] })
    expect((await traceOne(() => journeyApi.reorderEntries(2, [8, 7]))).body).toEqual({ orderedIds: [8, 7] })
  })

  it('FE-APISURF-023: user-id collections are sent as user_ids', async () => {
    expect((await traceOne(() => assignmentsApi.setParticipants(1, 7, [4, 5]))).body).toEqual({ user_ids: [4, 5] })
    expect((await traceOne(() => budgetApi.setMembers(1, 2, [4]))).body).toEqual({ user_ids: [4] })
    expect((await traceOne(() => packingApi.setBagMembers(1, 2, [6]))).body).toEqual({ user_ids: [6] })
    expect((await traceOne(() => reservationsApi.setTravelers(1, 2, [4, 6]))).body).toEqual({ user_ids: [4, 6] })
  })

  it('FE-APISURF-024: single-value helpers wrap their argument in the documented key', async () => {
    expect((await traceOne(() => authApi.updateMapsKey(null))).body).toEqual({ maps_api_key: null })
    expect((await traceOne(() => tripsApi.addMember(1, 'bob@x.test'))).body).toEqual({ identifier: 'bob@x.test' })
    expect((await traceOne(() => tripsApi.transferOwnership(1, 9))).body).toEqual({ newOwnerId: 9 })
    expect((await traceOne(() => tripsApi.createGuest(1, 'Anna'))).body).toEqual({ name: 'Anna' })
    expect((await traceOne(() => daysApi.updateTransport(1, 2, 'walk'))).body).toEqual({ transport_mode: 'walk' })
    expect((await traceOne(() => assignmentsApi.updateTransport(1, 7, null))).body).toEqual({ transport_mode: null })
    expect((await traceOne(() => collabApi.votePoll(1, 2, 3))).body).toEqual({ option_index: 3 })
    expect((await traceOne(() => collabApi.reactMessage(1, 2, '🎉'))).body).toEqual({ emoji: '🎉' })
    expect((await traceOne(() => settingsApi.set('theme', 'dark'))).body).toEqual({ key: 'theme', value: 'dark' })
    expect((await traceOne(() => settingsApi.setBulk({ a: 1 }))).body).toEqual({ settings: { a: 1 } })
    expect((await traceOne(() => budgetApi.togglePaid(1, 2, 4, false))).body).toEqual({ paid: false })
    expect((await traceOne(() => adminApi.updateBagTracking(true))).body).toEqual({ enabled: true })
    expect((await traceOne(() => adminApi.updatePermissions({ edit: 'owner' }))).body)
      .toEqual({ permissions: { edit: 'owner' } })
    expect((await traceOne(() => pluginsApi.saveUserSettings('koffi', { k: 'v' }))).body)
      .toEqual({ config: { k: 'v' } })
  })

  it('FE-APISURF-025: tripsApi.archive/unarchive send the is_archived flag', async () => {
    expect((await traceOne(() => tripsApi.archive(3))).body).toEqual({ is_archived: true })
    expect((await traceOne(() => tripsApi.unarchive(3))).body).toEqual({ is_archived: false })
  })

  it('FE-APISURF-026: placesApi bulk operations merge ids with the patch', async () => {
    expect((await traceOne(() => placesApi.bulkDelete(1, [5, 6]))).body).toEqual({ ids: [5, 6] })
    expect((await traceOne(() => placesApi.bulkUpdate(1, [5], { category_id: null }))).body)
      .toEqual({ ids: [5], category_id: null })
  })

  it('FE-APISURF-027: placesApi.rate deletes on null and PUTs the value otherwise', async () => {
    const cleared = await traceOne(() => placesApi.rate(1, 5, null))
    expect(cleared.method).toBe('DELETE')
    expect(cleared.url).toBe('/api/trips/1/places/5/rating')

    const set = await traceOne(() => placesApi.rate(1, 5, 4))
    expect(set.method).toBe('PUT')
    expect(set.url).toBe('/api/trips/1/places/5/rating')
    expect(set.body).toEqual({ rating: 4 })
  })

  it('FE-APISURF-028: airtrailApi.import only sends connections when there are any', async () => {
    expect((await traceOne(() => airtrailApi.import(1, ['f1', 'f2']))).body).toEqual({ flightIds: ['f1', 'f2'] })
    expect((await traceOne(() => airtrailApi.import(1, ['f1'], []))).body).toEqual({ flightIds: ['f1'] })
    expect((await traceOne(() => airtrailApi.import(1, ['f1', 'f2'], [['f1', 'f2']]))).body)
      .toEqual({ flightIds: ['f1', 'f2'], connections: [['f1', 'f2']] })
  })

  it('FE-APISURF-029: journeyApi provider-photo calls omit optional passphrase and media types', async () => {
    expect((await traceOne(() => journeyApi.addProviderPhotosToGallery(2, 'immich', ['a1']))).body)
      .toEqual({ provider: 'immich', asset_ids: ['a1'] })
    expect((await traceOne(() => journeyApi.addProviderPhotosToGallery(2, 'immich', ['a1'], 'secret', ['video']))).body)
      .toEqual({ provider: 'immich', asset_ids: ['a1'], passphrase: 'secret', media_types: ['video'] })
    expect((await traceOne(() => journeyApi.addProviderPhoto(9, 'immich', 'a1', 'cap', 'secret'))).body)
      .toEqual({ provider: 'immich', asset_id: 'a1', caption: 'cap', passphrase: 'secret' })
    expect((await traceOne(() => journeyApi.addProviderPhotos(9, 'immich', ['a1'], 'cap'))).body)
      .toEqual({ provider: 'immich', asset_ids: ['a1'], caption: 'cap' })
    expect((await traceOne(() => journeyApi.addProviderPhotos(9, 'immich', ['a1'], 'cap', 'secret', ['image', 'video']))).body)
      .toEqual({ provider: 'immich', asset_ids: ['a1'], caption: 'cap', passphrase: 'secret', media_types: ['image', 'video'] })
  })

  it('FE-APISURF-030: adminApi.pluginActivate only sends consent when granted', async () => {
    expect((await traceOne(() => adminApi.pluginActivate('koffi'))).body).toEqual({})
    expect((await traceOne(() => adminApi.pluginActivate('koffi', true))).body).toEqual({ consent: true })
  })

  it('FE-APISURF-031: adminApi.pluginInstall spreads its options next to the id', async () => {
    expect((await traceOne(() => adminApi.pluginInstall('koffi'))).body).toEqual({ id: 'koffi' })
    expect((await traceOne(() => adminApi.pluginInstall('koffi', { version: '2.0.0', withDependencies: true }))).body)
      .toEqual({ id: 'koffi', version: '2.0.0', withDependencies: true })
  })

  it('FE-APISURF-032: tripInviteApi.createLink normalises a missing expiry to null', async () => {
    expect((await traceOne(() => tripInviteApi.createLink(1))).body).toEqual({ expires_in_days: null })
    expect((await traceOne(() => tripInviteApi.createLink(1, 14))).body).toEqual({ expires_in_days: 14 })
  })

  it('FE-APISURF-033: tripsApi.copy and shareApi.createLink default to an empty body', async () => {
    expect((await traceOne(() => tripsApi.copy(3))).body).toEqual({})
    expect((await traceOne(() => shareApi.createLink(1))).body).toEqual({})
  })

  it('FE-APISURF-034: authApi.passkey.delete sends the password in the DELETE body', async () => {
    const rec = await traceOne(() => authApi.passkey.delete(3, 'hunter2'))
    expect(rec.method).toBe('DELETE')
    expect(rec.body).toEqual({ password: 'hunter2' })
  })
})

describe('client > query parameters', () => {
  it('FE-APISURF-035: tripsApi.list forwards arbitrary filters as query params', async () => {
    const rec = await traceOne(() => tripsApi.list({ archived: true, q: 'rome' }))
    const qs = new URLSearchParams(rec.url.split('?')[1])
    expect(qs.get('archived')).toBe('true')
    expect(qs.get('q')).toBe('rome')
  })

  it('FE-APISURF-036: filesApi.list only sets the trash flag when asked', async () => {
    expect((await traceOne(() => filesApi.list(1))).url).toBe('/api/trips/1/files')
    expect((await traceOne(() => filesApi.list(1, true))).url).toBe('/api/trips/1/files?trash=true')
  })

  it('FE-APISURF-037: budgetApi.settlement adds the base currency only when given', async () => {
    expect((await traceOne(() => budgetApi.settlement(1))).url).toBe('/api/trips/1/budget/settlement')
    expect((await traceOne(() => budgetApi.settlement(1, 'EUR'))).url).toBe('/api/trips/1/budget/settlement?base=EUR')
  })

  it('FE-APISURF-038: collabApi.getMessages appends the before cursor', async () => {
    expect((await traceOne(() => collabApi.getMessages(1))).url).toBe('/api/trips/1/collab/messages')
    expect((await traceOne(() => collabApi.getMessages(1, '2026-01-01'))).url)
      .toBe('/api/trips/1/collab/messages?before=2026-01-01')
  })

  it('FE-APISURF-039: adminApi.pluginBrowse only sets refresh when forced', async () => {
    expect((await traceOne(() => adminApi.pluginBrowse())).url).toBe('/api/admin/plugins/registry')
    expect((await traceOne(() => adminApi.pluginBrowse(true))).url).toBe('/api/admin/plugins/registry?refresh=1')
  })

  it('FE-APISURF-040: adminApi.auditLog and llmLocalModels pass their params through', async () => {
    const audit = await traceOne(() => adminApi.auditLog({ limit: 50, offset: 100 }))
    expect(new URLSearchParams(audit.url.split('?')[1]).get('limit')).toBe('50')
    expect(new URLSearchParams(audit.url.split('?')[1]).get('offset')).toBe('100')

    const models = await traceOne(() => adminApi.llmLocalModels('http://ollama:11434'))
    expect(new URLSearchParams(models.url.split('?')[1]).get('baseUrl')).toBe('http://ollama:11434')
  })

  it('FE-APISURF-041: mapsApi flattens the POI bbox into the query string', async () => {
    const rec = await traceOne(() => mapsApi.pois('cafe', { south: 41.8, west: 12.4, north: 42.0, east: 12.6 }, 'de'))
    const qs = new URLSearchParams(rec.url.split('?')[1])
    expect(qs.get('category')).toBe('cafe')
    expect(qs.get('south')).toBe('41.8')
    expect(qs.get('west')).toBe('12.4')
    expect(qs.get('north')).toBe('42')
    expect(qs.get('east')).toBe('12.6')
    expect(qs.get('lang')).toBe('de')
  })

  it('FE-APISURF-042: weatherApi sends lat/lng plus the date or language', async () => {
    const forecast = await traceOne(() => weatherApi.get(41.9, 12.5, '2026-06-01'))
    const fq = new URLSearchParams(forecast.url.split('?')[1])
    expect([fq.get('lat'), fq.get('lng'), fq.get('date')]).toEqual(['41.9', '12.5', '2026-06-01'])

    const current = await traceOne(() => weatherApi.getCurrent(41.9, 12.5, 'de'))
    expect(new URLSearchParams(current.url.split('?')[1]).get('lang')).toBe('de')
  })

  it('FE-APISURF-043: pluginsApi joins trip ids and defaults the activity limit', async () => {
    expect((await traceOne(() => pluginsApi.tripCardContributions([1, 2, 3]))).url)
      .toBe('/api/trip-card-contributions?tripIds=1,2,3')
    expect((await traceOne(() => pluginsApi.myActivity())).url).toBe('/api/plugin-activity?limit=200')
    expect((await traceOne(() => pluginsApi.myActivity(5))).url).toBe('/api/plugin-activity?limit=5')
  })

  it('FE-APISURF-044: packing/todo category assignees encode the category name', async () => {
    const packing = await traceOne(() => packingApi.setCategoryAssignees(1, 'Rain gear/Wet', [4]))
    expect(packing.url).toBe('/api/trips/1/packing/category-assignees/Rain%20gear%2FWet')
    expect(packing.body).toEqual({ user_ids: [4] })

    const todo = await traceOne(() => todoApi.setCategoryAssignees(1, 'Before & after', [5]))
    expect(todo.url).toBe('/api/trips/1/todo/category-assignees/Before%20%26%20after')
    expect(todo.body).toEqual({ user_ids: [5] })
  })

  it('FE-APISURF-045: collabApi.linkPreview URL-encodes the previewed link', async () => {
    const rec = await traceOne(() => collabApi.linkPreview(1, 'https://x.test/a?b=1&c=2'))
    expect(rec.url).toBe('/api/trips/1/collab/link-preview?url=https%3A%2F%2Fx.test%2Fa%3Fb%3D1%26c%3D2')
  })
})

describe('client > multipart uploads', () => {
  // jsdom FormData bodies deadlock inside MSW, so uploads are asserted at the
  // axios boundary instead (same approach as tests/integration/api/client.test.ts).
  function spyPost() {
    return vi.spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { ok: true } } as unknown as AxiosResponse)
  }

  it('FE-APISURF-046: every upload opts out of the 8s global timeout', async () => {
    const post = spyPost()
    const fd = new FormData()

    await authApi.uploadAvatar(fd)
    await tripsApi.uploadCover(3, fd)
    await filesApi.upload(1, fd)
    await journeyApi.uploadPhotos(9, fd)
    await journeyApi.uploadGalleryPhotos(2, fd)
    await journeyApi.uploadGalleryVideo(2, fd)
    await journeyApi.uploadCover(2, fd)
    await collabApi.uploadNoteFile(1, 2, fd)

    expect(post.mock.calls.map(c => c[0])).toEqual([
      '/auth/avatar',
      '/trips/3/cover',
      '/trips/1/files',
      '/journeys/entries/9/photos',
      '/journeys/2/gallery/photos',
      '/journeys/2/gallery/video',
      '/journeys/2/cover',
      '/trips/1/collab/notes/2/files',
    ])
    for (const call of post.mock.calls) {
      expect(call[1]).toBeInstanceOf(FormData)
      expect(call[2]).toMatchObject({ timeout: 0 })
      expect((call[2] as { headers: Record<string, string> }).headers['Content-Type']).toBe('multipart/form-data')
    }
  })

  it('FE-APISURF-047: postMultipart forwards progress, abort signal and idempotency key', async () => {
    const post = spyPost()
    const onUploadProgress = vi.fn((_e: unknown) => {})
    const controller = new AbortController()

    await filesApi.upload(1, new FormData(), {
      onUploadProgress,
      signal: controller.signal,
      idempotencyKey: 'fixed-key',
    })

    const config = post.mock.calls[0][2] as {
      headers: Record<string, string>
      onUploadProgress?: unknown
      signal?: AbortSignal
      timeout: number
    }
    expect(config.headers['X-Idempotency-Key']).toBe('fixed-key')
    expect(config.onUploadProgress).toBe(onUploadProgress)
    expect(config.signal).toBe(controller.signal)
    expect(config.timeout).toBe(0)
  })

  it('FE-APISURF-048: placesApi.uploadImage posts the file under the image field', async () => {
    const post = spyPost()
    const file = new File(['bytes'], 'shot.jpg', { type: 'image/jpeg' })

    await placesApi.uploadImage(1, 5, file)

    expect(post.mock.calls[0][0]).toBe('/trips/1/places/5/image')
    const fd = post.mock.calls[0][1] as FormData
    expect((fd.get('image') as File).name).toBe('shot.jpg')
  })

  it('FE-APISURF-049: placesApi.importGpx only appends the flags it was given', async () => {
    const post = spyPost()
    const file = new File(['<gpx/>'], 'track.gpx')

    await placesApi.importGpx(1, file)
    expect(post.mock.calls[0][0]).toBe('/trips/1/places/import/gpx')
    const bare = post.mock.calls[0][1] as FormData
    expect(bare.get('importWaypoints')).toBeNull()
    expect(bare.get('importRoutes')).toBeNull()
    expect(bare.get('importTracks')).toBeNull()

    await placesApi.importGpx(1, file, { waypoints: true, routes: false, tracks: true })
    const flagged = post.mock.calls[1][1] as FormData
    expect(flagged.get('importWaypoints')).toBe('true')
    expect(flagged.get('importRoutes')).toBe('false')
    expect(flagged.get('importTracks')).toBe('true')
  })

  it('FE-APISURF-050: placesApi.importMapFile appends the point/path flags', async () => {
    const post = spyPost()
    const file = new File(['{}'], 'map.kml')

    await placesApi.importMapFile(1, file)
    expect(post.mock.calls[0][0]).toBe('/trips/1/places/import/map')
    expect((post.mock.calls[0][1] as FormData).get('importPoints')).toBeNull()

    await placesApi.importMapFile(1, file, { points: true, paths: false })
    const flagged = post.mock.calls[1][1] as FormData
    expect(flagged.get('importPoints')).toBe('true')
    expect(flagged.get('importPaths')).toBe('false')
  })

  it('FE-APISURF-051: booking import posts every file plus the extraction mode', async () => {
    const post = spyPost()
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]

    await reservationsApi.importBookingPreview(1, files, 'force-ai')
    expect(post.mock.calls[0][0]).toBe('/trips/1/reservations/import/booking')
    const preview = post.mock.calls[0][1] as FormData
    expect(preview.getAll('files')).toHaveLength(2)
    expect(preview.get('mode')).toBe('force-ai')

    await reservationsApi.importBookingAsync(1, files)
    expect(post.mock.calls[1][0]).toBe('/trips/1/reservations/import/booking/async')
    expect((post.mock.calls[1][1] as FormData).get('mode')).toBe('no-ai')
  })

  it('FE-APISURF-052: adminApi.pluginUpload and backupApi.uploadRestore name their form fields', async () => {
    const post = spyPost()

    await adminApi.pluginUpload(new File(['zip'], 'plugin.zip'))
    expect(post.mock.calls[0][0]).toBe('/admin/plugins/upload')
    expect(((post.mock.calls[0][1] as FormData).get('file') as File).name).toBe('plugin.zip')

    await backupApi.uploadRestore(new File(['zip'], 'backup.zip'))
    expect(post.mock.calls[1][0]).toBe('/backup/upload-restore')
    expect(((post.mock.calls[1][1] as FormData).get('backup') as File).name).toBe('backup.zip')
  })
})
