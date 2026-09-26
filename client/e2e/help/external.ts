import type { APIRequestContext } from '@playwright/test'
import { day, PICTURE_DAY_ISO } from '../dates'
import { dawarichRecording, recordingWindow, type TrackFeature } from './dawarich-track'

/**
 * The services outside TREK that a few guides need: an AirTrail with flights,
 * a Dawarich with a recording, a Nextcloud with a folder of documents. Each is
 * reached through its own API with the address and key from the environment
 * (`e2e/help/media.env`, see README), and each fixture puts the service into
 * the state the guide expects before TREK is connected to it. Nothing here is
 * silent: a missing variable or an unreachable service fails the run rather
 * than producing a picture of an empty panel.
 *
 * TREK's SSRF guard refuses loopback whatever the flags say, so every address
 * has to be the machine's LAN address, and the media backend needs
 * ALLOW_INTERNAL_NETWORK=true to reach it at all.
 */

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set; see client/e2e/help/README.md for the media.env the external guides need`)
  return value.replace(/\/+$/, '')
}

async function expectOk(res: Response, what: string): Promise<Response> {
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${await res.text()}`)
  return res
}

// ── AirTrail ────────────────────────────────────────────────────────────────

interface AirtrailWanted {
  flightNumber: string
  from: string
  to: string
  offset: number
  departureTime: string
  arrivalTime: string
  airline: string
  aircraft: string
  seat: 'window' | 'aisle'
  seatNumber: string
}

/**
 * Two flights home on the trip's last day that connect in Tokyo, so the picker
 * offers to import them as one flight with a layover, and the flights of the
 * Lisbon weekend in spring for its "Other flights" list. LH716 out is already
 * in the seed and would only be skipped as a duplicate, so it stays out.
 */
export const AIRTRAIL_FLIGHTS: AirtrailWanted[] = [
  { flightNumber: 'NH16', from: 'ITM', to: 'HND', offset: 0, departureTime: '08:00', arrivalTime: '09:10', airline: 'ANA', aircraft: 'B789', seat: 'window', seatNumber: '12A' },
  { flightNumber: 'LH717', from: 'HND', to: 'FRA', offset: 0, departureTime: '12:35', arrivalTime: '18:25', airline: 'DLH', aircraft: 'A359', seat: 'aisle', seatNumber: '31C' },
  { flightNumber: 'TP573', from: 'FRA', to: 'LIS', offset: -158, departureTime: '10:20', arrivalTime: '12:25', airline: 'TAP', aircraft: 'A320', seat: 'window', seatNumber: '7F' },
  { flightNumber: 'TP574', from: 'LIS', to: 'FRA', offset: -156, departureTime: '13:10', arrivalTime: '17:05', airline: 'TAP', aircraft: 'A320', seat: 'aisle', seatNumber: '9C' },
]

interface AirtrailFlightRow {
  id: number
  flightNumber: string | null
  date: string
  passengers?: { id: number; userId: string | null }[]
  seats?: { id: number; userId: string | null }[]
}

/** Puts the wanted flights into the AirTrail account the key belongs to, once. */
export async function ensureAirtrailFlights(): Promise<void> {
  const base = env('HELP_MEDIA_AIRTRAIL_URL')
  const headers = { Authorization: `Bearer ${env('HELP_MEDIA_AIRTRAIL_API_KEY')}`, 'Content-Type': 'application/json' }
  const listed = await expectOk(await fetch(`${base}/api/flight/list`, { headers }), 'AirTrail flight list')
  const { flights } = (await listed.json()) as { flights: AirtrailFlightRow[] }
  for (const wanted of AIRTRAIL_FLIGHTS) {
    const date = day(wanted.offset)
    const existing = flights.find(f => f.flightNumber === wanted.flightNumber)
    if (existing && existing.date === date) continue
    const owner = (existing?.passengers ?? existing?.seats ?? []).find(p => p.userId)
    const body = {
      ...(existing ? { id: existing.id } : {}),
      from: wanted.from,
      to: wanted.to,
      departure: date,
      departureTime: wanted.departureTime,
      arrival: date,
      arrivalTime: wanted.arrivalTime,
      airline: wanted.airline,
      flightNumber: wanted.flightNumber,
      aircraft: wanted.aircraft,
      passengers: [{ ...(owner ? { id: owner.id } : {}), userId: '<USER_ID>', seat: wanted.seat, seatNumber: wanted.seatNumber, seatClass: 'economy', flightReason: 'leisure' }],
    }
    await expectOk(await fetch(`${base}/api/flight/save`, { method: 'POST', headers, body: JSON.stringify(body) }), `AirTrail save ${wanted.flightNumber}`)
  }
}

/** Switches the addon on and connects the signed-in user to the AirTrail, loudly. */
export async function ensureAirtrailConnection(api: APIRequestContext): Promise<void> {
  await ensureAirtrailFlights()
  await toggleAddon(api, 'airtrail', true)
  const saved = await api.put('/api/integrations/airtrail/settings', {
    data: { url: env('HELP_MEDIA_AIRTRAIL_URL'), apiKey: env('HELP_MEDIA_AIRTRAIL_API_KEY') },
  })
  if (!saved.ok()) throw new Error(`could not save the AirTrail connection: ${saved.status()} ${await saved.text()}`)
  const status = await api.get('/api/integrations/airtrail/status')
  const body = (await status.json()) as { connected: boolean; error?: string }
  if (!body.connected) throw new Error(`AirTrail is not reachable from the media backend: ${body.error ?? status.status()} (is ALLOW_INTERNAL_NETWORK=true?)`)
}

export async function disconnectAirtrail(api: APIRequestContext): Promise<void> {
  await api.put('/api/integrations/airtrail/settings', { data: { url: '' } })
  await toggleAddon(api, 'airtrail', false)
}

// ── Dawarich ────────────────────────────────────────────────────────────────

/** Uploads the synthetic recording, one part at a time, unless its window already holds points. */
export async function ensureDawarichRecording(): Promise<void> {
  const base = env('HELP_MEDIA_DAWARICH_URL')
  const key = env('HELP_MEDIA_DAWARICH_API_KEY')
  const recording = dawarichRecording(PICTURE_DAY_ISO)
  for (const part of ['world', 'trip'] as const) {
    const { from, to } = recordingWindow(PICTURE_DAY_ISO, part)
    const probe = await expectOk(
      await fetch(`${base}/api/v1/points?start_at=${from}&end_at=${to}&per_page=1`, { headers: { Authorization: `Bearer ${key}` } }),
      `Dawarich points ${part}`,
    )
    if (Number(probe.headers.get('x-total-pages') ?? 0) > 0) continue
    const features = recording[part]
    for (let i = 0; i < features.length; i += 500) {
      const batch: TrackFeature[] = features.slice(i, i + 500)
      await expectOk(
        await fetch(`${base}/api/v1/points?api_key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: batch }),
        }),
        `Dawarich upload ${part} batch ${i / 500 + 1}`,
      )
    }
  }
}

/** Two wishes the recording reaches, with coordinates so the scan can match them. */
export const DAWARICH_WISHES = [
  { name: 'Fushimi Inari Taisha', lat: 34.9671, lng: 135.7727, country_code: 'JP' },
  { name: 'Wadi Rum', lat: 29.576, lng: 35.42, country_code: 'JO' },
]

/**
 * Switches the addon on, connects the signed-in user to the Dawarich and adds
 * the wishes. Automatic syncing stays off: a sync would seed suggestion rows
 * that head the Places column of every later picture.
 */
export async function ensureDawarichConnection(api: APIRequestContext): Promise<void> {
  await ensureDawarichRecording()
  await toggleAddon(api, 'dawarich', true)
  const saved = await api.put('/api/integrations/dawarich/settings', {
    data: { url: env('HELP_MEDIA_DAWARICH_URL'), apiKey: env('HELP_MEDIA_DAWARICH_API_KEY'), allowInsecureTls: false, syncEnabled: false },
  })
  if (!saved.ok()) throw new Error(`could not save the Dawarich connection: ${saved.status()} ${await saved.text()}`)
  // The probe wants the address in its body; the key it takes from the connection just saved.
  const test = await api.post('/api/integrations/dawarich/test', { data: { url: env('HELP_MEDIA_DAWARICH_URL'), allowInsecureTls: false } })
  const body = (await test.json()) as { connected: boolean; error?: string; errorDetail?: string }
  if (!body.connected) throw new Error(`Dawarich is not reachable from the media backend: ${body.error ?? ''} ${body.errorDetail ?? ''} (is ALLOW_INTERNAL_NETWORK=true?)`)

  const listRes = await api.get('/api/addons/atlas/bucket-list')
  const { items } = (await listRes.json()) as { items: { name: string }[] }
  for (const wish of DAWARICH_WISHES) {
    if (items.some(i => i.name === wish.name)) continue
    const created = await api.post('/api/addons/atlas/bucket-list', { data: wish })
    if (!created.ok()) throw new Error(`could not add the ${wish.name} wish: ${created.status()} ${await created.text()}`)
  }
}

export async function disconnectDawarich(api: APIRequestContext): Promise<void> {
  await api.delete('/api/integrations/dawarich/settings')
  await toggleAddon(api, 'dawarich', false)
}

// ── Nextcloud ───────────────────────────────────────────────────────────────

export const NEXTCLOUD_BASE_PATH = '/Reisen'
export const NEXTCLOUD_FOLDER = 'Autumn in Japan'
export const NEXTCLOUD_DOCUMENTS = ['ryokan-invoice.pdf', 'shinkansen-eticket.pdf']

/** What `drawPdf` in fixtures.ts takes; repeated here so this file needs nothing from it. */
export interface StoreDocument {
  issuer: string
  title: string
  reference: string
  fields: readonly (readonly [string, string])[]
  footer: string
}

function davRoot(): { url: string; auth: string } {
  const url = `${env('HELP_MEDIA_NEXTCLOUD_URL')}/remote.php/dav/files/${env('HELP_MEDIA_NEXTCLOUD_USER')}`
  const auth = 'Basic ' + Buffer.from(`${env('HELP_MEDIA_NEXTCLOUD_USER')}:${env('HELP_MEDIA_NEXTCLOUD_PASSWORD')}`).toString('base64')
  return { url, auth }
}

async function dav(method: string, path: string, body?: BodyInit, extra: Record<string, string> = {}): Promise<Response> {
  const { url, auth } = davRoot()
  const target = url + path.split('/').map(encodeURIComponent).join('/')
  return fetch(target, { method, headers: { Authorization: auth, ...extra }, body })
}

/**
 * The store side of the document-sync guide: a base folder with one trip
 * folder holding two documents and nothing else, however the last run left it.
 * `pdf` draws the documents, so this file stays free of binary fixtures.
 */
export async function ensureNextcloudFolder(pdf: (doc: StoreDocument) => Buffer): Promise<void> {
  const folder = `${NEXTCLOUD_BASE_PATH}/${NEXTCLOUD_FOLDER}`
  for (const dir of [NEXTCLOUD_BASE_PATH, folder]) {
    const made = await dav('MKCOL', `${dir}/`)
    if (![201, 405].includes(made.status)) throw new Error(`Nextcloud MKCOL ${dir}: HTTP ${made.status} ${await made.text()}`)
  }
  const listing = await dav('PROPFIND', `${folder}/`, undefined, { Depth: '1' })
  if (listing.status !== 207) throw new Error(`Nextcloud PROPFIND ${folder}: HTTP ${listing.status}`)
  const names = [...(await listing.text()).matchAll(/<d:href>([^<]+)<\/d:href>/g)]
    .map(m => decodeURIComponent(m[1]).replace(/\/$/, '').split('/').pop() ?? '')
    .filter(n => n && n !== NEXTCLOUD_FOLDER)
  for (const name of names) {
    if (NEXTCLOUD_DOCUMENTS.includes(name)) continue
    const gone = await dav('DELETE', `${folder}/${name}`)
    if (![204, 404].includes(gone.status)) throw new Error(`Nextcloud DELETE ${name}: HTTP ${gone.status}`)
  }
  const documents: Record<string, StoreDocument> = {
    'ryokan-invoice.pdf': {
      issuer: 'Hakone Ginyu',
      title: 'Invoice',
      reference: 'Invoice 2026-0918, confirmation RY-4471',
      fields: [
        ['Guests', '2 adults, one room'],
        ['Nights', 'Two nights, half board'],
        ['Room and board', 'JPY 84,000'],
        ['Onsen tax', 'JPY 12,000'],
        ['Total, paid by card', 'JPY 96,000'],
      ],
      footer: 'Paid in full. Thank you for staying with us.',
    },
    'shinkansen-eticket.pdf': {
      issuer: 'JR Central',
      title: 'Reserved seat ticket',
      reference: 'Nozomi 21, Tokyo to Kyoto',
      fields: [
        ['Date', 'Day 6 of the trip'],
        ['Departure / arrival', 'Tokyo 08:30, Kyoto 10:45'],
        ['Car and seats', 'Car 7, seats 12A and 12B'],
        ['Class', 'Ordinary, reserved, non-smoking'],
      ],
      footer: 'Keep the ticket until you leave the station; the gate reads it twice.',
    },
  }
  for (const name of NEXTCLOUD_DOCUMENTS) {
    if (names.includes(name)) continue
    const bytes = pdf(documents[name])
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const put = await dav('PUT', `${folder}/${name}`, body, { 'Content-Type': 'application/pdf' })
    if (![201, 204].includes(put.status)) throw new Error(`Nextcloud PUT ${name}: HTTP ${put.status} ${await put.text()}`)
  }
}

export const NEXTCLOUD_CONNECTION = () => ({
  providerId: 'nextcloud',
  baseUrl: env('HELP_MEDIA_NEXTCLOUD_URL'),
  credentials: { login_name: env('HELP_MEDIA_NEXTCLOUD_USER'), app_password: env('HELP_MEDIA_NEXTCLOUD_PASSWORD'), base_path: NEXTCLOUD_BASE_PATH },
  allowInsecureTls: false,
})

/** Takes every binding and connection off the trip, keeping the documents. */
export async function resetDocSync(api: APIRequestContext, tripId: number): Promise<void> {
  const links = await api.get(`/api/trips/${tripId}/docsync/links`)
  if (links.ok()) {
    const body = (await links.json()) as { links?: { id: number }[] } | { id: number }[]
    for (const link of Array.isArray(body) ? body : (body.links ?? [])) await api.delete(`/api/trips/${tripId}/docsync/links/${link.id}`)
  }
  const connections = await api.get(`/api/trips/${tripId}/docsync/connections`)
  if (connections.ok()) {
    const body = (await connections.json()) as { connections?: { id: number }[] } | { id: number }[]
    for (const c of Array.isArray(body) ? body : (body.connections ?? [])) await api.delete(`/api/trips/${tripId}/docsync/connections/${c.id}`)
  }
}

// ── Booking extractor ────────────────────────────────────────────────────────

/**
 * Import from file is rendered only when the server can read a confirmation.
 * The media run gets that from the extractor named in media.env
 * (KITINERARY_EXTRACTOR_PATH, see README). The AI Parsing addon would show
 * the button too, but with no model behind it every parse ends in a red card,
 * so the guides ask for the extractor and nothing else.
 */
export async function requireExtractor(api: APIRequestContext): Promise<void> {
  const res = await api.get('/api/health/features')
  const body = (await res.json()) as { bookingImport?: boolean }
  if (!body.bookingImport) {
    throw new Error('the booking extractor is not available to the media backend: set KITINERARY_EXTRACTOR_PATH in e2e/help/media.env (see README)')
  }
}

/**
 * The review attaches the confirmation to the booking it made through the
 * ordinary file upload, and that upload honours the administrator's Allowed
 * File Types, which do not include a mail out of the box: the booking is
 * saved and the .eml dropped without a word. So the list gets `eml` for the
 * import guides and loses it again in their cleanup. Idempotent either way.
 */
export async function allowEmlUploads(api: APIRequestContext, allowed: boolean): Promise<void> {
  const current = await api.get('/api/auth/app-settings')
  const { allowed_file_types = '' } = (await current.json()) as { allowed_file_types?: string }
  const types = allowed_file_types.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  if (types.includes('eml') === allowed) return
  const next = allowed ? [...types, 'eml'] : types.filter(t => t !== 'eml')
  const res = await api.put('/api/auth/app-settings', { data: { allowed_file_types: next.join(',') } })
  if (!res.ok()) throw new Error(`could not ${allowed ? 'allow' : 'disallow'} .eml uploads: ${res.status()} ${await res.text()}`)
}

// ── shared ──────────────────────────────────────────────────────────────────

export async function toggleAddon(api: APIRequestContext, id: string, enabled: boolean): Promise<void> {
  const res = await api.put(`/api/admin/addons/${id}`, { data: { enabled } })
  if (!res.ok()) throw new Error(`could not switch addon ${id} ${enabled ? 'on' : 'off'}: ${res.status()} ${await res.text()}`)
}
