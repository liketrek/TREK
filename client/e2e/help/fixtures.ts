import sharp from 'sharp'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { request as apiRequest, type APIRequestContext, type Page } from '@playwright/test'
import { E2E_BASE_URL, E2E_SEED_FILE } from '../../playwright.config'
import { OUT_DIR, PICTURE_DAY } from './guide'
import { at, day, emlDate, mailHeaderDate, short } from '../dates'

/**
 * What the dashboard guides act on beyond the seeded trip.
 *
 * The seed's "Autumn in Japan" is the running trip, so it sits in the boarding
 * pass rather than in the grid. The card actions (edit, duplicate, archive,
 * delete) need cards, so two more trips are created over the API once, before
 * the first guide runs. Uploads use a drawn dusk-over-mountains cover rather
 * than a photograph: nothing in the repo may carry someone's picture.
 */

export const EXTRA_TRIPS = [
  { title: 'Weekend in Lisbon', description: 'Pastéis, miradouros and a day trip to Sintra.', start_date: day(25), end_date: day(27), currency: 'EUR' },
  { title: 'Norway Road Trip', description: 'Bergen to the Lofoten, fjord by fjord.', start_date: day(257), end_date: day(271), currency: 'NOK' },
]

export async function ensureExtraTrips(api: APIRequestContext): Promise<void> {
  const res = await api.get('/api/trips')
  const body = (await res.json()) as { trips?: { title: string }[] } | { title: string }[]
  const trips = Array.isArray(body) ? body : (body.trips ?? [])
  for (const trip of EXTRA_TRIPS) {
    if (trips.some(t => t.title === trip.title)) continue
    const created = await api.post('/api/trips', { data: trip })
    if (!created.ok()) throw new Error(`could not create "${trip.title}": ${created.status()} ${await created.text()}`)
  }
}

/** Path of a 1600×900 JPEG the cover guide uploads; drawn on first use. */
export async function coverFixture(): Promise<string> {
  mkdirSync(OUT_DIR, { recursive: true })
  const file = path.join(OUT_DIR, 'cover-fixture.jpg')
  if (existsSync(file)) return file
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1f3b"/>
      <stop offset="0.45" stop-color="#6b3d7a"/>
      <stop offset="0.75" stop-color="#e8865a"/>
      <stop offset="1" stop-color="#f7c36b"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff2c2"/>
      <stop offset="0.6" stop-color="#ffb35c"/>
      <stop offset="1" stop-color="#ffb35c" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <circle cx="1090" cy="560" r="150" fill="url(#sun)"/>
  <path d="M0 640 L180 520 L330 600 L480 470 L640 590 L800 500 L960 610 L1120 540 L1280 620 L1440 560 L1600 640 L1600 900 L0 900 Z" fill="#2a2140" opacity="0.85"/>
  <path d="M0 720 L200 640 L360 700 L560 600 L720 690 L900 640 L1080 720 L1260 660 L1440 730 L1600 700 L1600 900 L0 900 Z" fill="#1a1530"/>
  <path d="M0 820 Q400 760 800 800 T1600 790 L1600 900 L0 900 Z" fill="#100c1f"/>
</svg>`
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(file)
  return file
}

/** Trip card in the grid by its title. */
export function card(page: Page, title: string) {
  return page.locator('.trip-card').filter({ hasText: title }).first()
}

// ── Atlas ─────────────────────────────────────────────────────────────────────

/**
 * What the Atlas guides act on. The seed's Japan trip colours one country;
 * a map with a single country on it says nothing about what the screen does,
 * so a handful of countries are marked by hand (the way someone catching up
 * on their pre-TREK travels would), one wish goes on the bucket list, and the
 * Lisbon trip gets a place so Portugal shows up as planned and the "Show
 * planned countries" switch exists at all.
 */
export const ATLAS_MARKED = ['IT', 'ES', 'FR', 'TH', 'MA']
export const ATLAS_WISH = { name: 'New Zealand', country_code: 'NZ' }
export const PLANNED_PLACE = {
  trip: 'Weekend in Lisbon',
  place: { name: 'Belém Tower', lat: 38.6916, lng: -9.216, address: 'Av. Brasília, 1400-038 Lisboa, Portugal' },
}

export async function ensureAtlasFixtures(api: APIRequestContext): Promise<void> {
  await ensureExtraTrips(api)

  const res = await api.get('/api/trips')
  const body = (await res.json()) as { trips?: { id: number; title: string }[] } | { id: number; title: string }[]
  const trips = Array.isArray(body) ? body : (body.trips ?? [])
  const lisbon = trips.find(t => t.title === PLANNED_PLACE.trip)
  if (!lisbon) throw new Error(`fixture trip "${PLANNED_PLACE.trip}" is missing`)
  const placesRes = await api.get(`/api/trips/${lisbon.id}/places`)
  const placesBody = (await placesRes.json()) as { places?: { name: string }[] } | { name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  if (!places.some(p => p.name === PLANNED_PLACE.place.name)) {
    const created = await api.post(`/api/trips/${lisbon.id}/places`, { data: PLANNED_PLACE.place })
    if (!created.ok()) throw new Error(`could not create "${PLANNED_PLACE.place.name}": ${created.status()} ${await created.text()}`)
  }

  // Idempotent on the server (INSERT OR IGNORE), so no lookup first.
  for (const code of ATLAS_MARKED) {
    const marked = await api.post(`/api/addons/atlas/country/${code}/mark`)
    if (!marked.ok()) throw new Error(`could not mark ${code}: ${marked.status()}`)
  }

  const listRes = await api.get('/api/addons/atlas/bucket-list')
  const { items } = (await listRes.json()) as { items: { country_code: string | null; target_date: string | null }[] }
  if (!items.some(i => i.country_code === ATLAS_WISH.country_code && !i.target_date)) {
    const wish = await api.post('/api/addons/atlas/bucket-list', { data: ATLAS_WISH })
    if (!wish.ok()) throw new Error(`could not add the ${ATLAS_WISH.name} wish: ${wish.status()} ${await wish.text()}`)
  }
}

// ── Journey ───────────────────────────────────────────────────────────────────

/**
 * What the Journey guides act on. The seed creates "Autumn in Japan" from the
 * trip, which leaves a timeline of suggestions and nothing written. Three of
 * them get a story, a mood and the weather, and the first one a photo, so the
 * journal looks lived-in; the rest stay suggestions for the guide about them.
 */
export const JOURNEY_TITLE = 'Autumn in Japan'
const ENTRIES = [
  {
    title: 'First morning in Asakusa',
    story: 'Up before the shops. The Kaminarimon lantern with nobody under it, incense smoke drifting across the courtyard, and a bowl of soba from a counter that opened just as we arrived.',
    mood: 'amazing', weather: 'sunny', tags: ['hidden gem', 'early start'],
  },
  {
    title: 'Barefoot through the light',
    story: 'teamLab Planets is best without expectations. You wade through warm water while koi drawn from light swim around your ankles, then lie under a ceiling of orchids that moves out of your way.',
    mood: 'good', weather: 'partly', tags: ['best moment'],
  },
  {
    title: 'The crossing, from above',
    story: 'Shibuya from the Sky deck at dusk: the scramble fills and empties every ninety seconds like a tide. Rough evening otherwise, the rain came in sideways and the umbrella did not make it home.',
    mood: 'rough', weather: 'rainy', tags: ['viewpoint'],
    pros_cons: { pros: ['The view at blue hour', 'Timed entry, no queue'], cons: ['Rain, then more rain', 'Crowded lift'] },
  },
]

/** A second, future journey, so the list has a card below the banner. */
export const SECOND_JOURNEY = { title: 'Fjords and ferries', subtitle: 'Norway, next summer', trip: 'Norway Road Trip' }
/** A trip no journey has claimed, for the guide that links one. */
export const SPARE_TRIP = { title: 'Alps by rail', description: 'Zurich to Venice over the Bernina.', start_date: day(144), end_date: day(151), currency: 'CHF' }

export async function ensureJourneyFixtures(api: APIRequestContext): Promise<number> {
  const listRes = await api.get('/api/journeys')
  const { journeys } = (await listRes.json()) as { journeys: { id: number; title: string }[] }
  const journey = journeys.find(j => j.title === JOURNEY_TITLE)
  if (!journey) throw new Error(`fixture journey "${JOURNEY_TITLE}" is missing`)

  if (!journeys.some(j => j.title === SECOND_JOURNEY.title)) {
    const tripsRes = await api.get('/api/trips')
    const tripsBody = (await tripsRes.json()) as { trips?: { id: number; title: string }[] } | { id: number; title: string }[]
    const trips = Array.isArray(tripsBody) ? tripsBody : (tripsBody.trips ?? [])
    const norway = trips.find(t => t.title === SECOND_JOURNEY.trip)
    if (!norway) throw new Error(`fixture trip "${SECOND_JOURNEY.trip}" is missing`)
    const created = await api.post('/api/journeys', { data: { title: SECOND_JOURNEY.title, subtitle: SECOND_JOURNEY.subtitle, trip_ids: [norway.id] } })
    if (!created.ok()) throw new Error(`could not create "${SECOND_JOURNEY.title}": ${created.status()} ${await created.text()}`)
  }
  const spareRes = await api.get('/api/trips')
  const spareBody = (await spareRes.json()) as { trips?: { title: string }[] } | { title: string }[]
  const allTrips = Array.isArray(spareBody) ? spareBody : (spareBody.trips ?? [])
  if (!allTrips.some(t => t.title === SPARE_TRIP.title)) {
    const created = await api.post('/api/trips', { data: SPARE_TRIP })
    if (!created.ok()) throw new Error(`could not create "${SPARE_TRIP.title}": ${created.status()} ${await created.text()}`)
  }

  const entriesRes = await api.get(`/api/journeys/${journey.id}/entries`)
  const { entries } = (await entriesRes.json()) as { entries: { id: number; type: string; title: string | null }[] }
  if (entries.some(e => e.title === ENTRIES[0].title)) return journey.id

  const skeletons = entries.filter(e => e.type === 'skeleton')
  for (let i = 0; i < ENTRIES.length && i < skeletons.length; i++) {
    const res = await api.patch(`/api/journeys/entries/${skeletons[i].id}`, { data: { type: 'entry', ...ENTRIES[i] } })
    if (!res.ok()) throw new Error(`could not write entry "${ENTRIES[i].title}": ${res.status()} ${await res.text()}`)
  }
  const photo = await coverFixture()
  const upload = await api.post(`/api/journeys/entries/${skeletons[0].id}/photos`, {
    multipart: { photos: { name: 'asakusa.jpg', mimeType: 'image/jpeg', buffer: readFileSync(photo) } },
  })
  if (!upload.ok()) throw new Error(`could not upload the entry photo: ${upload.status()} ${await upload.text()}`)
  return journey.id
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * What the admin guides act on. Two more accounts so the user table has rows
 * to edit and delete, one invite link, a packing template with categories and
 * items, a school-holiday country with one region, the MCP addon (the tab only
 * exists while it is on) with a token, and the ntfy and webhook channels.
 */
export const ADMIN_USERS = [
  { username: 'mara', email: 'mara.lind@example.com', password: 'Mara12345!', role: 'user' },
  { username: 'jonas', email: 'jonas.b@example.com', password: 'Jonas12345!', role: 'user' },
]
const PACKING_TEMPLATE = {
  name: 'Beach Holiday',
  categories: [
    { name: 'Clothing', items: ['Swimsuit', 'Sandals', 'Sun hat', 'Light jacket'] },
    { name: 'Toiletries', items: ['Sunscreen', 'After sun', 'Toothbrush'] },
  ],
}
const SCHOOL_COUNTRY = { code: 'DE', name: 'Germany' }
const SCHOOL_REGION = {
  name: 'Bavaria',
  revision: 0,
  holidays: [
    { name: 'Autumn break', startDate: day(42), endDate: day(46) },
    { name: 'Christmas break', startDate: day(94), endDate: day(107) },
    { name: 'Easter break', startDate: day(189), endDate: day(200) },
  ],
}

async function listOf<T>(api: APIRequestContext, url: string, key: string): Promise<T[]> {
  const res = await api.get(url)
  if (!res.ok()) throw new Error(`${url}: ${res.status()} ${await res.text()}`)
  const body = (await res.json()) as Record<string, T[]> | T[]
  return Array.isArray(body) ? body : (body[key] ?? [])
}

/** Accounts by username; existing ones are left alone. */
export async function ensureUsers(api: APIRequestContext, wanted: { username: string; email: string; password: string; role: string }[]): Promise<void> {
  const users = await listOf<{ username: string }>(api, '/api/admin/users', 'users')
  for (const user of wanted) {
    if (users.some(u => u.username === user.username)) continue
    const created = await api.post('/api/admin/users', { data: user })
    if (!created.ok()) throw new Error(`could not create user "${user.username}": ${created.status()} ${await created.text()}`)
  }
}

/** The demo trip the screenshot seed creates; its ids are on disk because Playwright projects share no memory. */
export function seededTrip(): { tripId: number; dayIds: number[]; placeIds: number[]; memberIds: number[] } {
  return JSON.parse(readFileSync(path.join(process.cwd(), E2E_SEED_FILE), 'utf8'))
}

export async function ensureAdminFixtures(api: APIRequestContext): Promise<void> {
  await ensureUsers(api, ADMIN_USERS)

  const invites = await listOf<{ id: number }>(api, '/api/admin/invites', 'invites')
  if (invites.length === 0) {
    const created = await api.post('/api/admin/invites', { data: { max_uses: 3, expires_in_days: 14 } })
    if (!created.ok()) throw new Error(`could not create the invite link: ${created.status()} ${await created.text()}`)
  }

  const templates = await listOf<{ id: number; name: string }>(api, '/api/admin/packing-templates', 'templates')
  if (!templates.some(t => t.name === PACKING_TEMPLATE.name)) {
    const created = await api.post('/api/admin/packing-templates', { data: { name: PACKING_TEMPLATE.name } })
    if (!created.ok()) throw new Error(`could not create the packing template: ${created.status()} ${await created.text()}`)
    const template = (await created.json()) as { id?: number; template?: { id: number } }
    const templateId = template.id ?? template.template?.id
    if (!templateId) throw new Error('packing template came back without an id')
    for (const cat of PACKING_TEMPLATE.categories) {
      const catRes = await api.post(`/api/admin/packing-templates/${templateId}/categories`, { data: { name: cat.name } })
      if (!catRes.ok()) throw new Error(`could not add category "${cat.name}": ${catRes.status()} ${await catRes.text()}`)
      const category = (await catRes.json()) as { id?: number; category?: { id: number } }
      const catId = category.id ?? category.category?.id
      for (const item of cat.items) {
        const itemRes = await api.post(`/api/admin/packing-templates/${templateId}/categories/${catId}/items`, { data: { name: item } })
        if (!itemRes.ok()) throw new Error(`could not add item "${item}": ${itemRes.status()} ${await itemRes.text()}`)
      }
    }
  }

  const catalogRes = await api.get('/api/school-holiday-catalog')
  if (!catalogRes.ok()) throw new Error(`school holiday catalog: ${catalogRes.status()} ${await catalogRes.text()}`)
  const catalog = (await catalogRes.json()) as { countries: { code: string; regions?: { name: string }[] }[]; regions?: { country: string; name: string }[] }
  if (!catalog.countries.some(c => c.code === SCHOOL_COUNTRY.code)) {
    const created = await api.post('/api/school-holiday-catalog/countries', { data: SCHOOL_COUNTRY })
    if (!created.ok()) throw new Error(`could not create the holiday country: ${created.status()} ${await created.text()}`)
  }
  const regions = catalog.regions ?? catalog.countries.find(c => c.code === SCHOOL_COUNTRY.code)?.regions ?? []
  if (!regions.some(r => r.name === SCHOOL_REGION.name)) {
    const created = await api.post(`/api/school-holiday-catalog/countries/${SCHOOL_COUNTRY.code}/regions`, { data: SCHOOL_REGION })
    if (!created.ok()) throw new Error(`could not create the holiday region: ${created.status()} ${await created.text()}`)
  }

  const mcp = await api.put('/api/admin/addons/mcp', { data: { enabled: true } })
  if (!mcp.ok()) throw new Error(`could not enable the MCP addon: ${mcp.status()} ${await mcp.text()}`)
  const tokens = await listOf<{ id: number }>(api, '/api/auth/mcp-tokens', 'tokens')
  if (tokens.length === 0) {
    const created = await api.post('/api/auth/mcp-tokens', { data: { name: 'Claude Desktop' } })
    if (!created.ok()) throw new Error(`could not create the MCP token: ${created.status()} ${await created.text()}`)
  }

  const channels = await api.put('/api/auth/app-settings', { data: { notification_channels: 'ntfy,webhook' } })
  if (!channels.ok()) throw new Error(`could not enable the notification channels: ${channels.status()} ${await channels.text()}`)
}

/** A minimal ustar tar.gz, enough for the plugin upload route. */
function tarGz(files: { name: string; data: Buffer }[]): Buffer {
  const blocks: Buffer[] = []
  for (const f of files) {
    const h = Buffer.alloc(512)
    h.write(f.name, 0, 100, 'utf8')
    h.write('0000644\0', 100, 8, 'utf8')
    h.write('0000000\0', 108, 8, 'utf8')
    h.write('0000000\0', 116, 8, 'utf8')
    h.write(f.data.length.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8')
    h.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0', 136, 12, 'utf8')
    h.write('        ', 148, 8, 'utf8')
    h.write('0', 156, 1, 'utf8')
    h.write('ustar\0', 257, 6, 'utf8')
    h.write('00', 263, 2, 'utf8')
    let sum = 0
    for (const b of h) sum += b
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')
    blocks.push(h, f.data, Buffer.alloc((512 - (f.data.length % 512)) % 512))
  }
  blocks.push(Buffer.alloc(1024))
  return gzipSync(Buffer.concat(blocks))
}

/**
 * The SDK's Trip Doctor example packed for upload. Its manifest pins TREK 3.x,
 * so the range is widened to the running major; nothing else changes.
 */
export function pluginPackage(): Buffer {
  const dir = path.join(process.cwd(), '..', 'plugin-sdk', 'examples', 'trip-doctor')
  const manifest = JSON.parse(readFileSync(path.join(dir, 'trek-plugin.json'), 'utf8')) as Record<string, unknown>
  manifest.trek = '>=4.0.0'
  return tarGz([
    { name: 'trip-doctor/trek-plugin.json', data: Buffer.from(JSON.stringify(manifest, null, 2)) },
    { name: 'trip-doctor/server/index.js', data: readFileSync(path.join(dir, 'server', 'index.js')) },
  ])
}

// ── Trip ──────────────────────────────────────────────────────────────────────

/** Two short Kyoto walks as GPX, each a track with two waypoints; drawn once, on first use. */
const WALKS: Record<string, { name: string; waypoints: [string, number, number][]; track: [number, number][] }> = {
  'kyoto-walk': {
    name: "Philosopher's Path",
    waypoints: [['Ginkaku-ji', 35.0270, 135.7982], ['Nanzen-ji', 35.0113, 135.7943]],
    track: [[35.0270, 135.7982], [35.0248, 135.7969], [35.0221, 135.7957], [35.0194, 135.7951], [35.0166, 135.7948], [35.0140, 135.7945], [35.0113, 135.7943]],
  },
  'arashiyama-loop': {
    name: 'Arashiyama loop',
    waypoints: [['Togetsukyo Bridge', 35.0128, 135.6777], ['Okochi Sanso Villa', 35.0177, 135.6700]],
    track: [[35.0128, 135.6777], [35.0141, 135.6752], [35.0158, 135.6728], [35.0170, 135.6716], [35.0177, 135.6700], [35.0165, 135.6740], [35.0140, 135.6765]],
  },
}

export function gpxFixture(id: keyof typeof WALKS): string {
  const dir = path.join(process.cwd(), 'e2e', '.tmp')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${id}.gpx`)
  if (existsSync(file)) return file
  const walk = WALKS[id]
  const wpts = walk.waypoints.map(([name, lat, lon]) => `  <wpt lat="${lat}" lon="${lon}"><name>${name}</name></wpt>`).join('\n')
  const pts = walk.track.map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`).join('\n')
  writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TREK help" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
  <trk><name>${walk.name}</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>
`)
  return file
}

/** Import a walk over the API, so the trip has a track before the pictures start. */
export async function ensureTrack(api: APIRequestContext, tripId: number, id: keyof typeof WALKS): Promise<void> {
  const res = await api.get(`/api/trips/${tripId}/places`)
  const body = (await res.json()) as { places?: { name: string }[] } | { name: string }[]
  const places = Array.isArray(body) ? body : (body.places ?? [])
  if (places.some(p => p.name === WALKS[id].name)) return
  const imported = await api.post(`/api/trips/${tripId}/places/import/gpx`, {
    multipart: {
      file: { name: `${id}.gpx`, mimeType: 'application/gpx+xml', buffer: readFileSync(gpxFixture(id)) },
      importWaypoints: 'true', importRoutes: 'true', importTracks: 'true',
    },
  })
  if (!imported.ok()) throw new Error(`could not import ${id}: ${imported.status()} ${await imported.text()}`)
}

/**
 * What the day guides need on the seeded trip beyond its places: a stop with a
 * time, a reservation tied to a stop, a train between two cities and a hotel
 * over the first nights, so the day cards show every kind of row.
 */
export async function ensureDaysFixtures(api: APIRequestContext): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  const assignmentsOf = async (dayId: number) => {
    const res = await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`)
    const body = (await res.json()) as { assignments?: { id: number; place_id: number; place?: { name: string } }[] }
    return body.assignments ?? []
  }
  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const byName = (name: string) => places.find(p => p.name === name)

  // A time on the first stop of day 1.
  const day1 = await assignmentsOf(dayIds[0])
  const senso = day1.find(a => a.place_id === byName('Senso-ji Temple')?.id)
  if (senso) await api.put(`/api/trips/${tripId}/assignments/${senso.id}/time`, { data: { place_time: '09:30', end_time: '11:00' } })

  const resRes = await api.get(`/api/trips/${tripId}/reservations`)
  const resBody = (await resRes.json()) as { reservations?: { title: string }[] } | { title: string }[]
  const reservations = Array.isArray(resBody) ? resBody : (resBody.reservations ?? [])
  const has = (title: string) => reservations.some(r => r.title === title)

  // A reservation at the market stop on day 6.
  const day6 = await assignmentsOf(dayIds[5])
  const market = day6.find(a => a.place_id === byName('Nishiki Market')?.id)
  if (market && !has('Lunch at Nishiki')) {
    await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        title: 'Lunch at Nishiki', type: 'restaurant', status: 'confirmed', day_id: dayIds[5],
        place_id: market.place_id, assignment_id: market.id, reservation_time: at(-4, '12:30'), confirmation_number: 'NK-2211',
      },
    })
  }

  // The train from Tokyo to Kyoto on day 5.
  if (!has('Nozomi 21 Tokyo → Kyoto')) {
    await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        title: 'Nozomi 21 Tokyo → Kyoto', type: 'train', status: 'confirmed', location: 'Tokyo Station',
        reservation_time: at(-5, '08:30'), reservation_end_time: at(-5, '10:45'), confirmation_number: 'JR-58204',
        metadata: { train_number: 'Nozomi 21', platform: '17', seat: '8A' },
        endpoints: [
          { role: 'from', sequence: 0, name: 'Tokyo Station', lat: 35.6812, lng: 139.7671, timezone: 'Asia/Tokyo', local_date: day(-5), local_time: '08:30' },
          { role: 'to', sequence: 1, name: 'Kyoto Station', lat: 34.9858, lng: 135.7588, timezone: 'Asia/Tokyo', local_date: day(-5), local_time: '10:45' },
        ],
      },
    })
  }

  // A hotel over the Tokyo nights.
  //
  // Idempotent on the booked night, not on the place, and loud on every step. A
  // run once created the place and then lost the night without saying so, which
  // left the day cards without their booked night and the first day without the
  // only leg it has: the flight sits between its two stops, so they have none of
  // their own. The picture that came out of that was of a feature that was not
  // there, which is worse than a failed run.
  const HOTEL = 'Hotel Gracery Shinjuku'
  let hotelId = byName(HOTEL)?.id
  if (!hotelId) {
    const created = await api.post(`/api/trips/${tripId}/places`, {
      data: { name: HOTEL, lat: 35.6946, lng: 139.7012, address: '1-19-1 Kabukicho, Shinjuku City, Tokyo' },
    })
    if (!created.ok()) throw new Error(`could not create the hotel: ${created.status()} ${await created.text()}`)
    const place = (await created.json()) as { place?: { id: number }; id?: number }
    hotelId = place.place?.id ?? place.id
    if (!hotelId) throw new Error('the hotel came back without an id')
  }
  const nights = async (): Promise<{ place_id: number | null }[]> => {
    const res = await api.get(`/api/trips/${tripId}/accommodations`)
    if (!res.ok()) throw new Error(`could not read the booked nights: ${res.status()} ${await res.text()}`)
    const body = (await res.json()) as { accommodations?: { place_id: number | null }[] }
    return body.accommodations ?? []
  }
  // Booked, then read back, then booked again if it is not there.
  //
  // The call answered 2xx and wrote nothing twice in a row, and the only symptom
  // was a day card quietly missing the night the pictures are about, which cost
  // two runs to notice. One retry covers it; a second silence is a real fault
  // and stops the run rather than producing a picture of a feature that is not
  // on screen.
  for (let attempt = 1; ; attempt++) {
    if ((await nights()).some(stay => stay.place_id === hotelId)) break
    const booked = await api.post(`/api/trips/${tripId}/accommodations`, {
      data: { place_id: hotelId, start_day_id: dayIds[0], end_day_id: dayIds[3], check_in: '15:00', check_out: '11:00', confirmation: 'GRC-7731' },
    })
    if (!booked.ok()) throw new Error(`could not book the hotel: ${booked.status()} ${await booked.text()}`)
    if (attempt === 2 && !(await nights()).some(stay => stay.place_id === hotelId)) {
      throw new Error('the hotel night is not there after booking it twice')
    }
  }
}

// ── Trip: place details ───────────────────────────────────────────────────────────

/**
 * What the place card needs beyond the seed: a website on one place so the
 * footer offers Open Website at all, a note on the first stop so the card can
 * show Notes for this day, and two other travellers' star votes so the rating
 * row has an average and a voter list rather than one lonely face. An
 * OpenStreetMap id on three places, so the card shows real hours, a ring and a
 * phone number; see OSM_PLACES.
 *
 * The votes are cast as the members themselves. A login on the shared context
 * would set the trek_session cookie on it, and the server reads that cookie
 * before the Authorization header, so every later write would silently be the
 * admin's again, the same trap seed.ts documents at its collab block. A login
 * that fails is skipped rather than thrown: a thinner rating row is worth less
 * than losing every picture of this screen.
 */
export const PLACE_WEBSITE = { place: 'teamLab Planets', url: 'https://planets.teamlab.art/tokyo/' }
const STOP_NOTE = {
  place: 'Senso-ji Temple',
  notes: 'Enter through the Kaminarimon gate, not the side one. The Nakamise street is half the point.',
}
export const RATED_PLACE = 'Meiji Jingu'
const MEMBER_VOTES = [
  { username: 'mira', email: 'mira@example.com', password: 'DemoSeed12345!', rating: 5 },
  { username: 'jonas', email: 'jonas@example.com', password: 'DemoSeed12345!', rating: 4 },
]

/**
 * The OpenStreetMap element behind three of the seeded places, so their cards
 * show what a place picked from the search shows: the hours, the Open or
 * Closed ring, the phone number and the website. The seed posts bare rows, and
 * a place with neither a Google nor an OpenStreetMap id asks no provider at
 * all (PlaceInspector's usePlaceDetails), which is why every picture of the
 * card had been without them.
 *
 * The id is looked up at run time through TREK's own autocomplete, which
 * answers from the OpenStreetMap layer of the TREK index, so a re-mapped
 * element does not quietly blank the picture; the id written here is the
 * fallback for when the index is unreachable or names something else. Every
 * candidate is then asked from the details route, the call the card makes,
 * and only one that answers with a week of hours is written. Senso-ji is the
 * place the read-place guide pictures, so a run that cannot get its hours and
 * phone number fails here rather than promoting a picture of a card without
 * the feature the text describes; the other two only make their own guides'
 * cards look like a real place's, so a thin answer is warned about and the
 * id kept.
 *
 * Nishiki Market is left out on purpose: its OpenStreetMap hours ("Mo-Su,PH
 * 10:00-18:00+") are a shape the server's parser rejects, and Fushimi Inari
 * and Meiji Jingu carry no hours tag at all.
 */
interface OsmPlace {
  /** The seeded place's name. */
  place: string
  /** What the resolver types into the autocomplete. */
  query: string
  /** What the suggestion's name has to contain, letters and digits only. */
  key: string
  /** The element the last probe found, used when the index cannot say. */
  osmId: string
  /** Whether the answer has to carry a phone number as well as the hours. */
  phone: boolean
  /** Fail the run when the details do not come; otherwise warn and keep the id. */
  strict: boolean
}

export const OSM_PLACES: OsmPlace[] = [
  { place: 'Senso-ji Temple', query: 'Senso-ji', key: 'sensoji', osmId: 'way:173154847', phone: true, strict: true },
  { place: 'teamLab Planets', query: 'teamLab Planets', key: 'teamlab', osmId: 'node:6291685287', phone: false, strict: false },
  { place: 'Arashiyama Bamboo Grove', query: 'Arashiyama Bamboo Grove', key: 'bamboo', osmId: 'relation:17656638', phone: false, strict: false },
]

/** The id form the details route resolves (maps.helpers.ts OSM_PLACE_ID). */
const OSM_PLACE_ID = /^(node|way|relation):\d+$/

/** Letters and digits, diacritics dropped: "Sensō-ji" and "Senso-ji Temple" both open with "sensoji". */
const plain = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Metres between two pins; flat arithmetic is exact enough for a few hundred of them. */
function metresApart(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = (b.lat - a.lat) * 111_320
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  return Math.hypot(dLat, dLng)
}

interface Suggestion {
  placeId: string
  mainText: string
  source?: string
  lat?: number
  lng?: number
}

/**
 * The element the index knows the place by: an OpenStreetMap row of TREK's own
 * autocomplete, biased to the seed's pin, called like the place and within a
 * few hundred metres of it. Undefined when the index is unreachable or names
 * nothing that is this place; the caller then falls back to the written id.
 */
async function resolveOsmId(api: APIRequestContext, wanted: OsmPlace, pin: { lat: number; lng: number }): Promise<string | undefined> {
  const res = await api.post('/api/maps/autocomplete', {
    data: {
      input: wanted.query,
      locationBias: { low: { lat: pin.lat - 0.02, lng: pin.lng - 0.02 }, high: { lat: pin.lat + 0.02, lng: pin.lng + 0.02 } },
    },
  })
  if (!res.ok()) return undefined
  const body = (await res.json()) as { suggestions?: Suggestion[] }
  return (body.suggestions ?? []).find(
    s =>
      s.source === 'openstreetmap'
      && OSM_PLACE_ID.test(s.placeId)
      && plain(s.mainText).includes(wanted.key)
      && typeof s.lat === 'number'
      && typeof s.lng === 'number'
      && metresApart(pin, { lat: s.lat, lng: s.lng }) < 600,
  )?.placeId
}

interface ProviderDetails {
  opening_hours?: string[] | null
  phone?: string | null
}

/** Whether a details answer carries what the card is to show for this place. */
const complete = (details: ProviderDetails | null, wanted: OsmPlace): boolean =>
  !!details
  && Array.isArray(details.opening_hours)
  && details.opening_hours.length === 7
  && (!wanted.phone || (typeof details.phone === 'string' && details.phone.length > 0))

/**
 * What the card would get for this id, asked the way the card asks it. The
 * OpenStreetMap path has no server-side cache and Overpass is regularly
 * overloaded, so a thin answer is asked again twice before it counts.
 */
async function providerDetails(api: APIRequestContext, osmId: string, wanted: OsmPlace): Promise<ProviderDetails | null> {
  for (let attempt = 1; ; attempt++) {
    const res = await api.get(`/api/maps/details/${encodeURIComponent(osmId)}?lang=en`)
    const body = res.ok() ? ((await res.json()) as { place: ProviderDetails | null; disabled?: boolean }) : null
    if (body?.disabled) throw new Error('Place Details is switched off in the admin settings, so no card gets hours')
    if (complete(body?.place ?? null, wanted) || attempt === 3) return body?.place ?? null
    await new Promise(resolve => setTimeout(resolve, 2_000))
  }
}

type FixturePlace = {
  id: number
  name: string
  lat?: number | null
  lng?: number | null
  osm_id?: string | null
  website?: string | null
  ratings?: { username?: string | null }[] | null
}

export async function ensurePlaceFixtures(api: APIRequestContext): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: FixturePlace[] } | FixturePlace[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const byName = (name: string) => places.find(p => p.name === name)

  // A website, so the footer has an Open Website button to point at.
  const site = byName(PLACE_WEBSITE.place)
  if (site && site.website !== PLACE_WEBSITE.url) {
    const res = await api.put(`/api/trips/${tripId}/places/${site.id}`, { data: { website: PLACE_WEBSITE.url } })
    if (!res.ok()) throw new Error(`could not set the website on ${PLACE_WEBSITE.place}: ${res.status()} ${await res.text()}`)
  }

  // An OpenStreetMap identity on three places, the same PUT: the card then asks
  // the details route for the hours, the ring and the phone number.
  for (const wanted of OSM_PLACES) {
    const place = byName(wanted.place)
    if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') continue
    const pin = { lat: place.lat, lng: place.lng }
    const resolved = await resolveOsmId(api, wanted, pin)
    const candidates = [...new Set([resolved, wanted.osmId].filter((id): id is string => !!id))]
    let chosen: string | undefined
    for (const id of candidates) {
      if (complete(await providerDetails(api, id, wanted), wanted)) {
        chosen = id
        break
      }
    }
    if (!chosen) {
      const what = `${wanted.place}: the details route gives no week of opening hours${wanted.phone ? ' and no phone number' : ''} for ${candidates.join(' or ')}`
      if (wanted.strict) throw new Error(what)
      console.warn(`${what}; keeping the id, the card shows what there is`)
      chosen = candidates[0]
    }
    if (place.osm_id !== chosen) {
      const res = await api.put(`/api/trips/${tripId}/places/${place.id}`, { data: { osm_id: chosen } })
      if (!res.ok()) throw new Error(`could not set the OpenStreetMap id on ${wanted.place}: ${res.status()} ${await res.text()}`)
    }
  }

  // A note that belongs to the stop rather than to the place, which is the one
  // box of the card no other guide reaches.
  const noted = byName(STOP_NOTE.place)
  if (noted) {
    const dayRes = await api.get(`/api/trips/${tripId}/days/${dayIds[0]}/assignments`)
    const dayBody = (await dayRes.json()) as { assignments?: { id: number; place_id: number; notes: string | null }[] }
    const stop = (dayBody.assignments ?? []).find(a => a.place_id === noted.id)
    if (stop && !stop.notes) {
      const res = await api.put(`/api/trips/${tripId}/assignments/${stop.id}/notes`, { data: { notes: STOP_NOTE.notes } })
      if (!res.ok()) throw new Error(`could not note the ${STOP_NOTE.place} stop: ${res.status()} ${await res.text()}`)
    }
  }

  // Two members' votes, each cast from its own throwaway context.
  const rated = byName(RATED_PLACE)
  if (!rated) return
  const voted = new Set((rated.ratings ?? []).map(r => r.username ?? ''))
  for (const member of MEMBER_VOTES) {
    if (voted.has(member.username)) continue
    const anon = await apiRequest.newContext({ baseURL: E2E_BASE_URL, storageState: undefined })
    const login = await anon.post('/api/auth/login', { data: { email: member.email, password: member.password } })
    const token = login.ok() ? ((await login.json()) as { token?: string }).token : undefined
    await anon.dispose()
    if (!token) continue
    const asMember = await apiRequest.newContext({
      baseURL: E2E_BASE_URL,
      storageState: undefined,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    await asMember.put(`/api/trips/${tripId}/places/${rated.id}/rating`, { data: { rating: member.rating } })
    await asMember.dispose()
  }
}

// ── Trip: day details ─────────────────────────────────────────────────────────────

/** The Tokyo hotel `ensureDaysFixtures` books over the first nights. */
export const TOKYO_HOTEL = 'Hotel Gracery Shinjuku'

/**
 * The Kyoto hotel the booking guide puts on the Kyoto nights. It carries the
 * Hotel category on purpose: the seeded places carry none, so the picker's
 * category chips narrow its list to exactly this one.
 */
export const KYOTO_HOTEL = {
  name: 'Hotel Kanra Kyoto',
  lat: 34.9942,
  lng: 135.7592,
  address: '190 Kitamachi, Shimogyo Ward, Kyoto',
  description: 'Machiya-style rooms a few minutes from Karasuma station.',
}

/** The second booking of day 5: still pending, and tied to that day's stop. */
export const EVENING_WALK = 'Fushimi Inari evening walk'

/**
 * What the day-detail guides need beyond the day fixtures: the Kyoto hotel as a
 * place in the Hotel category, and a second booking on day 5 that hangs off the
 * day's stop and is still pending, so the panel's Reservations block shows both
 * a green and an amber row and one of them with its stop.
 */
export async function ensureDayDetailFixtures(api: APIRequestContext): Promise<void> {
  await ensureDaysFixtures(api)
  const { tripId, dayIds } = seededTrip()

  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const byName = (name: string) => places.find(p => p.name === name)

  if (!byName(KYOTO_HOTEL.name)) {
    const catRes = await api.get('/api/categories')
    const { categories } = (await catRes.json()) as { categories: { id: number; name: string }[] }
    const hotel = categories.find(c => c.name === 'Hotel')
    if (!hotel) throw new Error('the seeded Hotel category is missing')
    const created = await api.post(`/api/trips/${tripId}/places`, { data: { ...KYOTO_HOTEL, category_id: hotel.id } })
    if (!created.ok()) throw new Error(`could not create "${KYOTO_HOTEL.name}": ${created.status()} ${await created.text()}`)
  }

  const resRes = await api.get(`/api/trips/${tripId}/reservations`)
  const resBody = (await resRes.json()) as { reservations?: { title: string }[] } | { title: string }[]
  const reservations = Array.isArray(resBody) ? resBody : (resBody.reservations ?? [])
  if (!reservations.some(r => r.title === EVENING_WALK)) {
    const asgRes = await api.get(`/api/trips/${tripId}/days/${dayIds[4]}/assignments`)
    const { assignments } = (await asgRes.json()) as { assignments: { id: number; place_id: number }[] }
    const inari = assignments.find(a => a.place_id === byName('Fushimi Inari Taisha')?.id)
    if (!inari) throw new Error('the Fushimi Inari stop of day 5 is missing')
    const created = await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        title: EVENING_WALK, type: 'tour', status: 'pending', day_id: dayIds[4],
        place_id: inari.place_id, assignment_id: inari.id,
        reservation_time: at(-5, '17:00'), reservation_end_time: at(-5, '19:30'),
        confirmation_number: 'FIT-3390',
      },
    })
    if (!created.ok()) throw new Error(`could not create "${EVENING_WALK}": ${created.status()} ${await created.text()}`)
  }
}

// ── Trip: the map ─────────────────────────────────────────────────────────────────

/**
 * What the map guides need on the seeded trip beyond its places: a booking whose
 * two ends both sit inside Japan, so the toolbar's "show all" has a route to
 * draw next to the flight's arc.
 */
export async function ensureMapFixtures(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip()
  const res = await api.get(`/api/trips/${tripId}/reservations`)
  const body = (await res.json()) as { reservations?: { title: string }[] } | { title: string }[]
  const reservations = Array.isArray(body) ? body : (body.reservations ?? [])
  if (reservations.some(r => r.title === 'Nozomi 21 Tokyo → Kyoto')) return

  const created = await api.post(`/api/trips/${tripId}/reservations`, {
    data: {
      title: 'Nozomi 21 Tokyo → Kyoto', type: 'train', status: 'confirmed', location: 'Tokyo Station',
      reservation_time: at(-5, '08:30'), reservation_end_time: at(-5, '10:45'), confirmation_number: 'JR-58204',
      metadata: { train_number: 'Nozomi 21', platform: '17', seat: '8A' },
      // Both ends need coordinates or the endpoints are dropped and the booking
      // draws nothing at all.
      endpoints: [
        { role: 'from', sequence: 0, name: 'Tokyo Station', lat: 35.6812, lng: 139.7671, timezone: 'Asia/Tokyo', local_date: day(-5), local_time: '08:30' },
        { role: 'to', sequence: 1, name: 'Kyoto Station', lat: 34.9858, lng: 135.7588, timezone: 'Asia/Tokyo', local_date: day(-5), local_time: '10:45' },
      ],
    },
  })
  if (!created.ok()) throw new Error(`could not create the train: ${created.status()} ${await created.text()}`)
}

// ── Trip: transports ──────────────────────────────────────────────────────────────

/** The title TransitSearchPanel builds from the two ends, so a guide can find the journey again. */
export const TRANSIT_JOURNEY = 'Arashiyama Bamboo Grove → Nishiki Market'

/**
 * What the transport guides need on the seeded trip beyond the day fixtures:
 * a time on the second stop of day 1 so a new transport slots between the two,
 * a booking that is still pending so the Pending group exists at all, and one
 * stored public-transit connection so the tab has an Automated public transit
 * group and a journey to open without asking Transitous first.
 *
 * The connection sits on day 6, the only day that carries two located stops of
 * its own: the day's route tools, which is what draws a transit journey on the
 * map, render for a day with two routable points.
 */
export async function ensureTransportFixtures(api: APIRequestContext): Promise<void> {
  await ensureDaysFixtures(api)
  const { tripId, dayIds } = seededTrip()

  // A time on day 1's second stop. The first one already has 09:30, so a
  // transport at midday lands between them instead of at the end of the day.
  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const teamLabId = places.find(p => p.name === 'teamLab Planets')?.id
  const dayRes = await api.get(`/api/trips/${tripId}/days/${dayIds[0]}/assignments`)
  const dayBody = (await dayRes.json()) as { assignments?: { id: number; place_id: number }[] }
  const teamLab = (dayBody.assignments ?? []).find(a => a.place_id === teamLabId)
  if (teamLab) {
    await api.put(`/api/trips/${tripId}/assignments/${teamLab.id}/time`, { data: { place_time: '13:00', end_time: '15:00' } })
  }

  const resRes = await api.get(`/api/trips/${tripId}/reservations`)
  const resBody = (await resRes.json()) as { reservations?: { title: string }[] } | { title: string }[]
  const reservations = Array.isArray(resBody) ? resBody : (resBody.reservations ?? [])
  const has = (title: string) => reservations.some(r => r.title === title)

  // A car that is not confirmed yet, so the Pending group has a card in it.
  if (!has('Rental car in Kyoto')) {
    const created = await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        title: 'Rental car in Kyoto', type: 'car', status: 'pending',
        day_id: dayIds[5], end_day_id: dayIds[7],
        reservation_time: at(-4, '09:00'), reservation_end_time: at(-2, '18:00'),
        confirmation_number: 'TYT-4417',
        endpoints: [
          { role: 'from', sequence: 0, name: 'Kyoto Station Hachijo Exit', lat: 34.9835, lng: 135.759, timezone: 'Asia/Tokyo', local_date: day(-4), local_time: '09:00' },
          { role: 'to', sequence: 1, name: 'Kyoto Station Hachijo Exit', lat: 34.9835, lng: 135.759, timezone: 'Asia/Tokyo', local_date: day(-2), local_time: '18:00' },
        ],
      },
    })
    if (!created.ok()) throw new Error(`could not create the rental car: ${created.status()} ${await created.text()}`)
  }

  // One planned connection, in exactly the shape TransitSearchPanel saves: the
  // list, the journey view and the map overlay all read metadata.transit. Its
  // legs carry no geometry, which the overlay is happy with — a provider that
  // sends no shape draws the journey through its stations.
  if (!has(TRANSIT_JOURNEY)) {
    const leg = (
      mode: string, line: string | null, duration: number, stops: number,
      from: [string, string, string | null], to: [string, string, string | null],
      extra: Record<string, unknown> = {},
    ) => ({
      mode, line, duration, stops,
      from: { name: from[0], time: from[1], track: from[2] },
      to: { name: to[0], time: to[1], track: to[2] },
      geometry: null, geometry_precision: 6, ...extra,
    })
    const created = await api.post(`/api/trips/${tripId}/reservations`, {
      data: {
        title: TRANSIT_JOURNEY, type: 'transit', status: 'confirmed',
        day_id: dayIds[5], end_day_id: dayIds[5],
        reservation_time: at(-4, '09:48'), reservation_end_time: at(-4, '10:25'),
        location: null, confirmation_number: null, notes: null,
        metadata: {
          transit: {
            provider: 'transitous', duration: 2220, transfers: 1, walk_seconds: 1080,
            legs: [
              leg('WALK', null, 540, 0, ['Arashiyama Bamboo Grove', '09:48', null], ['Saga-Arashiyama', '09:57', null]),
              leg('REGIONAL_RAIL', 'JR Sagano Line', 660, 2, ['Saga-Arashiyama', '09:57', '2'], ['Nijō', '10:08', '1'],
                { line_color: '#0072bc', line_text_color: '#ffffff', headsign: 'Kyoto', agency: 'JR West' }),
              leg('SUBWAY', 'Tozai Line', 240, 1, ['Nijō', '10:12', '1'], ['Karasuma Oike', '10:16', '2'],
                { line_color: '#d7003a', line_text_color: '#ffffff', headsign: 'Rokujizo', agency: 'Kyoto Municipal Subway' }),
              leg('WALK', null, 540, 0, ['Karasuma Oike', '10:16', null], ['Nishiki Market', '10:25', null]),
            ],
          },
        },
        endpoints: [
          { role: 'from', sequence: 0, name: 'Arashiyama Bamboo Grove', lat: 35.017, lng: 135.6716, timezone: 'Asia/Tokyo', local_date: day(-4), local_time: '09:48' },
          { role: 'stop', sequence: 1, name: 'Nijō', lat: 35.0109, lng: 135.7386, timezone: 'Asia/Tokyo', local_date: day(-4), local_time: '10:08' },
          { role: 'to', sequence: 2, name: 'Nishiki Market', lat: 35.005, lng: 135.7649, timezone: 'Asia/Tokyo', local_date: day(-4), local_time: '10:25' },
        ],
        needs_review: false,
      },
    })
    if (!created.ok()) throw new Error(`could not create the transit journey: ${created.status()} ${await created.text()}`)
  }
}

// ── Trip: bookings ────────────────────────────────────────────────────────────────

/**
 * A one-page PDF the booking guides attach and link, written on first use.
 *
 * Hand-built rather than drawn with sharp: what the pictures show is the file
 * NAME in the booking's Files list, never the page, and a booking confirmation
 * is a document, not an image. Offsets are computed while the body is built, so
 * the file is a valid PDF and not a blob with a `.pdf` on the end.
 */
export function bookingPdfFixture(id: 'teamlab-tickets' | 'kyoto-vouchers'): string {
  const dir = path.join(process.cwd(), 'e2e', '.tmp')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${id}.pdf`)
  if (existsSync(file)) return file
  const title = id === 'teamlab-tickets' ? 'teamLab Planets - 2 tickets - TL-88213' : 'Kyoto vouchers - Autumn in Japan'
  const stream = `BT /F1 16 Tf 64 760 Td (${title}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((object, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${object}\nendobj\n`
  })
  const startxref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  writeFileSync(file, Buffer.from(body, 'latin1'))
  return file
}

/** The hotel confirmation the import guide hands to the parser; written on first use. */
/**
 * The files the import guides hand to the extractor, by name. The widget's
 * card, the drop box and the review's Files row are all found by the name.
 */
export const BOOKING_EML = 'gracery-confirmation.eml'
export const FLIGHT_EML = 'nh203-eticket.eml'

/**
 * A confirmation mail the way a provider's system sends one: an HTML body
 * that carries the reservation as schema.org JSON-LD beside the text a person
 * reads. The structured block is what the extractor reads; the plain-text
 * mail this used to be parsed to nothing, because KDE Itinerary only knows
 * structured tickets and the vendors it has templates for.
 *
 * Written on every call rather than on first use: the dates are offsets from
 * the picture day (`e2e/dates.ts`), so a file left over from an earlier run
 * would carry that run's dates into this one's pictures.
 */
function emlFixture(
  name: string,
  headers: { from: string; subject: string; date: string },
  jsonLd: Record<string, unknown>,
  html: string[],
): string {
  const dir = path.join(process.cwd(), 'e2e', '.tmp')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, name)
  const mail = [
    `From: ${headers.from}`,
    'To: admin@trek.local',
    `Subject: ${headers.subject}`,
    `Date: ${headers.date}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8">',
    `<title>${headers.subject}</title>`,
    '<script type="application/ld+json">',
    JSON.stringify(jsonLd, null, 2),
    '</script>',
    '</head><body>',
    ...html,
    '</body></html>',
    '',
  ].join('\n')
  // One line ending for the whole mail, headers and body alike.
  writeFileSync(file, mail.replace(/\r?\n/g, '\r\n'), 'utf8')
  return file
}

/**
 * The hotel confirmation the Bookings import guide hands to the extractor:
 * the Granvia stay `booking-hotel` books by hand, nights 5 to 8 of the trip,
 * as a LodgingReservation with the address, the coordinates, the phone, the
 * website and the price, everything `mapLodging` and the review form read.
 * The venue name is the trip place `ensureBookingsFixtures` creates, so the
 * form pre-selects it under Accommodation.
 */
export function bookingEmlFixture(): string {
  return emlFixture(
    BOOKING_EML,
    {
      from: 'reservations@example-hotels.test',
      subject: `Your reservation is confirmed - ${HOTEL_TO_BOOK.name}`,
      date: mailHeaderDate(-20, '09:12', '+0900'),
    },
    {
      '@context': 'http://schema.org',
      '@type': 'LodgingReservation',
      reservationNumber: 'GRK-40218',
      reservationStatus: 'http://schema.org/ReservationConfirmed',
      underName: { '@type': 'Person', name: 'Mira Lindberg' },
      reservationFor: {
        '@type': 'LodgingBusiness',
        name: HOTEL_TO_BOOK.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Shiokoji-sagaru, Karasuma-dori',
          addressLocality: 'Kyoto',
          postalCode: '600-8216',
          addressCountry: 'JP',
        },
        geo: { '@type': 'GeoCoordinates', latitude: HOTEL_TO_BOOK.lat, longitude: HOTEL_TO_BOOK.lng },
        telephone: '+81 75 344 8888',
        url: 'https://www.granviakyoto.example/',
      },
      checkinTime: `${at(-5, '15:00')}+09:00`,
      checkoutTime: `${at(-2, '11:00')}+09:00`,
      totalPrice: '84000',
      priceCurrency: 'JPY',
    },
    [
      '<p>Dear Ms Lindberg,</p>',
      `<p>Thank you for choosing ${HOTEL_TO_BOOK.name}. Your reservation is confirmed.</p>`,
      '<table>',
      '<tr><td>Booking reference</td><td>GRK-40218</td></tr>',
      `<tr><td>Check-in</td><td>${emlDate(-5)}, from 15:00</td></tr>`,
      `<tr><td>Check-out</td><td>${emlDate(-2)}, until 11:00</td></tr>`,
      '<tr><td>Guests</td><td>2</td></tr>',
      '<tr><td>Room</td><td>Twin, non-smoking</td></tr>',
      '<tr><td>Total</td><td>JPY 84,000</td></tr>',
      '</table>',
      `<p>${HOTEL_TO_BOOK.name}, ${HOTEL_TO_BOOK.address} 600-8216<br>Tel. +81 75 344 8888</p>`,
    ],
  )
}

/**
 * The flight the Transports import guide reads: the way home on the trip's
 * last day, Haneda to Frankfurt. The seed's own flight is LH716 out, and the
 * AirTrail fixture brings LH717 and NH16 back, so this one is none of those.
 * The mapper builds the title from airline and number, so a guide finds the
 * card by the booking code, which is the fixture's own.
 */
export const FLIGHT_TO_IMPORT = {
  airline: 'All Nippon Airways',
  iata: 'NH',
  number: '203',
  code: 'NH9M4LT',
  from: { iata: 'HND', name: 'Tokyo Haneda International Airport', city: 'Tokyo Haneda' },
  to: { iata: 'FRA', name: 'Frankfurt Main Airport', city: 'Frankfurt' },
}

/**
 * The e-ticket as a FlightReservation: both airports by IATA code, which
 * `mapFlight` resolves through the built-in airport table, so the review opens
 * Add transport with both ends placed; departure in Tokyo's offset, arrival
 * in Frankfurt's, both on the last day of the trip.
 */
export function flightEmlFixture(): string {
  const f = FLIGHT_TO_IMPORT
  return emlFixture(
    FLIGHT_EML,
    {
      from: 'eticket@example-airlines.test',
      subject: `Your e-ticket itinerary - ${f.iata} ${f.number} ${f.from.city} to ${f.to.city}`,
      date: mailHeaderDate(-30, '14:40', '+0900'),
    },
    {
      '@context': 'http://schema.org',
      '@type': 'FlightReservation',
      reservationNumber: f.code,
      reservationStatus: 'http://schema.org/ReservationConfirmed',
      underName: { '@type': 'Person', name: 'Mira Lindberg' },
      reservationFor: {
        '@type': 'Flight',
        flightNumber: f.number,
        airline: { '@type': 'Airline', name: f.airline, iataCode: f.iata },
        departureAirport: { '@type': 'Airport', name: f.from.name, iataCode: f.from.iata },
        departureTime: `${at(0, '11:20')}+09:00`,
        arrivalAirport: { '@type': 'Airport', name: f.to.name, iataCode: f.to.iata },
        arrivalTime: `${at(0, '17:05')}+02:00`,
      },
    },
    [
      '<p>Dear Ms Lindberg,</p>',
      `<p>Your booking ${f.code} is confirmed. This is your e-ticket itinerary.</p>`,
      '<table>',
      `<tr><td>Flight</td><td>${f.iata} ${f.number}, operated by ${f.airline}</td></tr>`,
      `<tr><td>From</td><td>${f.from.city} (${f.from.iata}), ${emlDate(0)}, 11:20</td></tr>`,
      `<tr><td>To</td><td>${f.to.city} (${f.to.iata}), ${emlDate(0)}, 17:05</td></tr>`,
      '<tr><td>Passenger</td><td>Mira Lindberg</td></tr>',
      '<tr><td>Class</td><td>Economy</td></tr>',
      '</table>',
    ],
  )
}

/** One card of every type the Bookings tab can hold, by title. */
interface BookingFixture {
  title: string
  type: string
  status: string
  /** A trip place to hang the booking on, looked up by name; null for a standalone one. */
  place: string | null
  reservation_time: string
  reservation_end_time: string | null
  confirmation_number: string
  location: string
  url: string | null
  notes: string | null
}

const BOOKING_FIXTURES: BookingFixture[] = [
  {
    // No place on purpose: picking one is what `link-booking` does.
    title: 'teamLab Planets timed entry', type: 'event', status: 'pending', place: null,
    reservation_time: at(-9, '14:00'), reservation_end_time: at(-9, '16:00'),
    confirmation_number: 'TL-88213', location: '6-1-16 Toyosu, Koto City, Tokyo',
    url: 'https://www.teamlab.art/e/planets/',
    notes: 'Barefoot from the entrance. Bring shorts, the water room is knee-deep.',
  },
  {
    title: 'Fushimi Inari night walk', type: 'tour', status: 'confirmed', place: 'Fushimi Inari Taisha',
    reservation_time: at(-5, '18:30'), reservation_end_time: at(-5, '21:00'),
    confirmation_number: 'KY-4471', location: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    url: null, notes: null,
  },
  {
    title: 'Kyoto Cycling Tour', type: 'tour', status: 'pending', place: null,
    reservation_time: at(-3, '09:30'), reservation_end_time: at(-3, '13:00'),
    confirmation_number: 'KCT-1177', location: 'Kyoto Station, Karasuma exit',
    url: null, notes: null,
  },
  {
    title: 'Haneda Airport P4', type: 'parking', status: 'pending', place: null,
    reservation_time: at(-9, '10:00'), reservation_end_time: at(0, '22:00'),
    confirmation_number: 'HP4-2209', location: 'Haneda Airport Terminal 3, Ota City, Tokyo',
    url: null, notes: null,
  },
  {
    title: 'Luggage forwarding to Kyoto', type: 'other', status: 'pending', place: null,
    reservation_time: at(-5, '09:00'), reservation_end_time: null,
    confirmation_number: 'YMT-30915', location: 'Takkyubin counter, Shinjuku',
    url: null, notes: 'Two suitcases, delivered by 17:00 the next day.',
  },
]

/** The hotel `booking-hotel` books; a trip place with no stay of its own yet. */
export const HOTEL_TO_BOOK = {
  name: 'Hotel Granvia Kyoto',
  lat: 34.9855,
  lng: 135.7587,
  address: 'Shiokoji-sagaru, Karasuma-dori, Shimogyo-ku, Kyoto',
}

/** The trip file `booking-files` links; it must stay attached to nothing. */
export const UNATTACHED_FILE = 'kyoto-vouchers.pdf'

/**
 * What the Bookings tab needs beyond the seed.
 *
 * The seed's one reservation is the LH716 flight, and a flight is a transport:
 * on the bare seed this tab is its empty state, so every picture on it needs a
 * fixture. `ensureDaysFixtures` already makes the two that the day cards want
 * as well, the Gracery stay and the Nishiki lunch, and they are exactly the
 * accommodation and the restaurant this tab wants, so it is called rather than
 * copied. On top of it: an event, two tours (one with travellers), a parking
 * and an "other", which is one card of every type the tab can hold, four
 * pending and three confirmed; a second hotel as a trip place with no stay,
 * for `booking-hotel` to book without disturbing the Gracery one; and an
 * unattached document, without which Link existing file is not rendered.
 */
export async function ensureBookingsFixtures(api: APIRequestContext): Promise<void> {
  await ensureDaysFixtures(api)
  const { tripId, memberIds } = seededTrip()

  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const placeId = (name: string) => places.find(p => p.name === name)?.id ?? null
  if (!placeId(HOTEL_TO_BOOK.name)) {
    const created = await api.post(`/api/trips/${tripId}/places`, { data: HOTEL_TO_BOOK })
    if (!created.ok()) throw new Error(`could not create "${HOTEL_TO_BOOK.name}": ${created.status()} ${await created.text()}`)
  }

  const listRes = await api.get(`/api/trips/${tripId}/reservations`)
  const listBody = (await listRes.json()) as { reservations?: { id: number; title: string }[] } | { id: number; title: string }[]
  const existing = Array.isArray(listBody) ? listBody : (listBody.reservations ?? [])
  for (const booking of BOOKING_FIXTURES) {
    if (existing.some(r => r.title === booking.title)) continue
    const { place, ...rest } = booking
    const created = await api.post(`/api/trips/${tripId}/reservations`, {
      data: { ...rest, place_id: place ? placeId(place) : null },
    })
    if (!created.ok()) throw new Error(`could not create "${booking.title}": ${created.status()} ${await created.text()}`)
    // The avatar filter in the toolbar only exists once a booking names someone.
    if (booking.title === 'Fushimi Inari night walk') {
      const { reservation } = (await created.json()) as { reservation: { id: number } }
      const assigned = await api.put(`/api/trips/${tripId}/reservations/${reservation.id}/travelers`, {
        data: { user_ids: [1, memberIds[0]] },
      })
      if (!assigned.ok()) throw new Error(`could not assign travellers: ${assigned.status()} ${await assigned.text()}`)
    }
  }

  const filesRes = await api.get(`/api/trips/${tripId}/files`)
  const { files = [] } = (await filesRes.json()) as { files?: { original_name: string }[] }
  if (!files.some(f => f.original_name === UNATTACHED_FILE)) {
    const uploaded = await api.post(`/api/trips/${tripId}/files`, {
      multipart: {
        file: { name: UNATTACHED_FILE, mimeType: 'application/pdf', buffer: readFileSync(bookingPdfFixture('kyoto-vouchers')) },
        description: 'Kyoto vouchers',
      },
    })
    if (!uploaded.ok()) throw new Error(`could not upload ${UNATTACHED_FILE}: ${uploaded.status()} ${await uploaded.text()}`)
  }
}

// ── Trip: lists ───────────────────────────────────────────────────────────────────

/**
 * What the Lists guides need beyond the seed.
 *
 * Two things are missing from the seeded trip. ApplyTemplateButton renders
 * nothing at all while no template exists, so `Apply template` would have no
 * target to ring; and all three seeded tasks are unchecked, unassigned and
 * (today being after their due dates) overdue, which leaves My Tasks, Done and
 * the progress card at zero in every picture of the to-do sidebar. One
 * template and two more tasks fix both. Idempotent: each thing is looked up by
 * name first, so a re-run against a warm database changes nothing.
 */
export const LISTS_TEMPLATE = {
  name: 'Japan autumn basics',
  categories: [
    { name: 'Rain kit', items: ['Umbrella', 'Quick-dry towel', 'Dry bag'] },
    { name: 'Tech', items: ['SIM card', 'Plug adapter'] },
  ],
}

interface ListsTodo {
  name: string
  category: string
  due_date?: string
  priority?: number
  /** Assigned to whoever runs the capture, so the My Tasks filter has a row. */
  mine?: boolean
  /** Ticked off afterwards, so Done and the progress card are not empty. */
  done?: boolean
}

const LISTS_TODOS: ListsTodo[] = [
  { name: 'Confirm ryokan check-in time', category: 'Before departure', due_date: day(4), priority: 3, mine: true },
  { name: 'Buy a Suica top-up', category: 'On arrival', done: true },
]

export async function ensureListsFixtures(api: APIRequestContext): Promise<void> {
  const { tripId } = seededTrip()

  const templates = await listOf<{ id: number; name: string }>(api, '/api/admin/packing-templates', 'templates')
  if (!templates.some(t => t.name === LISTS_TEMPLATE.name)) {
    const created = await api.post('/api/admin/packing-templates', { data: { name: LISTS_TEMPLATE.name } })
    if (!created.ok()) throw new Error(`could not create the lists template: ${created.status()} ${await created.text()}`)
    const body = (await created.json()) as { id?: number; template?: { id: number } }
    const templateId = body.id ?? body.template?.id
    if (!templateId) throw new Error('the lists template came back without an id')
    for (const cat of LISTS_TEMPLATE.categories) {
      const catRes = await api.post(`/api/admin/packing-templates/${templateId}/categories`, { data: { name: cat.name } })
      if (!catRes.ok()) throw new Error(`could not add template list "${cat.name}": ${catRes.status()} ${await catRes.text()}`)
      const category = (await catRes.json()) as { id?: number; category?: { id: number } }
      const catId = category.id ?? category.category?.id
      if (!catId) throw new Error(`template list "${cat.name}" came back without an id`)
      for (const name of cat.items) {
        const itemRes = await api.post(`/api/admin/packing-templates/${templateId}/categories/${catId}/items`, { data: { name } })
        if (!itemRes.ok()) throw new Error(`could not add template item "${name}": ${itemRes.status()} ${await itemRes.text()}`)
      }
    }
  }

  const membersRes = await api.get(`/api/trips/${tripId}/members`)
  if (!membersRes.ok()) throw new Error(`could not read the trip members: ${membersRes.status()} ${await membersRes.text()}`)
  const { current_user_id: me } = (await membersRes.json()) as { current_user_id?: number }

  const tasks = await listOf<{ id: number; name: string }>(api, `/api/trips/${tripId}/todo`, 'items')
  for (const todo of LISTS_TODOS) {
    if (tasks.some(t => t.name === todo.name)) continue
    const created = await api.post(`/api/trips/${tripId}/todo`, {
      data: {
        name: todo.name,
        category: todo.category,
        due_date: todo.due_date ?? null,
        priority: todo.priority ?? 0,
        assigned_user_id: todo.mine ? (me ?? null) : null,
      },
    })
    if (!created.ok()) throw new Error(`could not create the task "${todo.name}": ${created.status()} ${await created.text()}`)
    if (!todo.done) continue
    const { item } = (await created.json()) as { item: { id: number } }
    const ticked = await api.put(`/api/trips/${tripId}/todo/${item.id}`, { data: { checked: true } })
    if (!ticked.ok()) throw new Error(`could not tick "${todo.name}" off: ${ticked.status()} ${await ticked.text()}`)
  }
}

// ── Trip: costs ───────────────────────────────────────────────────────────────────

/**
 * The one thing the Costs tab of the seeded trip is missing: an expense nobody
 * has paid for. All five seeded expenses have a payer, so Outstanding amount
 * reads zero, no row carries the Unfinished pill, and two of the four summary
 * cards say the same thing. This adds a counter fare the group has not booked
 * yet: it counts into Total trip spend, stays out of every balance, and gives
 * the screen its fourth state. It stays for every guide; what a guide creates
 * itself, that guide deletes again.
 *
 * `payers` is left out on purpose. The server only re-derives total_price from
 * the payers when there is at least one, so the total survives and the item is
 * unfinished.
 */
const UNPAID_EXPENSE = {
  name: 'Airport transfer (Narita Express)',
  category: 'transport',
  total_price: 12000,
  currency: 'JPY',
  expense_date: day(-8),
  note: 'Nobody has booked it yet, so this is the counter fare for three.',
}

export async function ensureCostsFixtures(api: APIRequestContext): Promise<void> {
  const { tripId, memberIds } = seededTrip()
  const res = await api.get(`/api/trips/${tripId}/budget`)
  const { items } = (await res.json()) as { items: { name: string }[] }
  if (items.some(i => i.name === UNPAID_EXPENSE.name)) return
  const created = await api.post(`/api/trips/${tripId}/budget`, {
    data: { ...UNPAID_EXPENSE, member_ids: [1, ...memberIds] },
  })
  if (!created.ok()) throw new Error(`could not create "${UNPAID_EXPENSE.name}": ${created.status()} ${await created.text()}`)
}

// ── Trip: files ───────────────────────────────────────────────────────────────────

/**
 * What the Files guides act on. The seed creates no document at all, so without
 * this the tab is an empty state in every picture. Nothing in the repository may
 * carry a real ticket or someone's photograph, so the whole set is drawn here on
 * first use, the way `coverFixture` draws its cover: the pictures from an SVG
 * through sharp, the PDFs assembled by hand, the text files written out.
 */

/** One-page PDFs. The body is what the reader would see if they opened the file. */
const FILE_PDFS: Record<string, PdfDoc> = {
  'JR-Pass-voucher': {
    issuer: 'Japan Rail Pass',
    title: 'Exchange order',
    reference: 'Order 7714-20-JP',
    fields: [
      ['Pass', 'Japan Rail Pass, Ordinary'],
      ['Validity', '14 consecutive days'],
      ['Travellers', '2 adults'],
      ['Exchange at', 'Haneda Airport Terminal 3, JR East Travel Service Center'],
      ['Opening hours', 'Daily 07:30 to 18:30'],
    ],
    footer: 'The pass is valid from the day it is exchanged, not from the day of purchase.',
  },
  'LH716-boarding-pass': {
    issuer: 'Lufthansa',
    title: 'Boarding pass',
    reference: 'Booking LH-4QK2PZ, flight LH716',
    fields: [
      ['Passenger', 'BOE / MAURICE MR'],
      ['From', 'Frankfurt (FRA), Terminal 1'],
      ['To', 'Tokyo Haneda (HND), Terminal 3'],
      ['Date', short(-9)],
      ['Boarding / departure', '12:20 at gate A34, departure 13:05'],
      ['Seat / class', '34K, window, Economy'],
    ],
    footer: 'Be at the gate 20 minutes before departure. Boarding closes 15 minutes before.',
  },
  'old-draft-itinerary': {
    issuer: 'Autumn in Japan',
    title: 'Itinerary, first draft',
    reference: 'Superseded by the plan in TREK',
    fields: [
      ['Day 1', 'Asakusa, Senso-ji and the river'],
      ['Day 2', 'Shibuya, Meiji Jingu, Harajuku'],
      ['Day 3', 'Free, weather permitting'],
      ['Day 4', 'Shinkansen to Kyoto, Gion in the evening'],
    ],
    footer: 'Kept for the notes on day 4; everything else moved into the trip.',
  },
  'hakone-ryokan-confirmation': {
    issuer: 'Hakone Ginyu',
    title: 'Reservation confirmed',
    reference: 'Confirmation RY-4471',
    fields: [
      ['Guests', '2 adults, one room'],
      ['Nights', 'Two nights, half board'],
      ['Check-in / check-out', 'From 15:00, until 11:00'],
      ['Dinner', 'Kaiseki served at 18:30 in the room'],
      ['Total', 'JPY 96,000, paid by card'],
    ],
    footer: 'Cancellation is free up to seven days before arrival.',
  },
  'kyoto-bus-pass': {
    issuer: 'Kyoto City Bus',
    title: 'One day pass',
    reference: 'Pass 0421-8837',
    fields: [
      ['Valid on', 'All city lines inside the flat-fare zone'],
      ['Valid for', 'One calendar day, first use to last bus'],
      ['Not valid on', 'Kyoto Bus express services and the airport lines'],
    ],
    footer: 'Show the pass to the driver when you leave the bus, printed side up.',
  },
}

/** Pictures, drawn flat so they read at thumbnail size as well as full screen. */
/**
 * The pictures of the trip. No photograph may live in this repository, so they
 * are composed instead: three layers per picture, the far one thrown out of
 * focus, the near one sharp, and grain over the lot. A single flat drawing
 * reads as a drawing at any size; a depth of field does not.
 */
interface PhotoLayer {
  /** The SVG body of this layer, over the 1600×900 frame. */
  svg: string
  /** How far out of focus it is, in pixels. */
  blur?: number
}

interface PhotoFixture {
  ext: 'jpg' | 'png'
  layers: readonly PhotoLayer[]
}

/** Dust and film grain, sprinkled from a fixed seed so a re-run draws the same frame. */
const grain = (seed: number, count = 900): string =>
  Array.from({ length: count }, (_, i) => {
    const r = (n: number) => (Math.sin(seed + i * n) + 1) / 2
    return `<rect x="${(r(12.9898) * 1600).toFixed(0)}" y="${(r(78.233) * 900).toFixed(0)}" width="${(1 + r(9.31) * 2).toFixed(1)}" height="${(1 + r(5.77) * 2).toFixed(1)}" fill="${r(3.3) > 0.5 ? '#ffffff' : '#000000'}" opacity="${(0.02 + r(4.14) * 0.06).toFixed(3)}"/>`
  }).join('')

/** Somebody with their back to us, which is what fills a market lane. */
const person = (x: number, ground: number, h: number, tone: string): string =>
  `<g fill="${tone}"><circle cx="${x}" cy="${(ground - h * 0.87).toFixed(0)}" r="${(h * 0.1).toFixed(0)}"/>` +
  `<path d="M${(x - h * 0.19).toFixed(0)} ${ground} L${(x - h * 0.15).toFixed(0)} ${(ground - h * 0.52).toFixed(0)} Q${x} ${(ground - h * 0.84).toFixed(0)} ${(x + h * 0.15).toFixed(0)} ${(ground - h * 0.52).toFixed(0)} L${(x + h * 0.19).toFixed(0)} ${ground} Z"/></g>`

/** A pile of produce: a handful of small round things, not one big rectangle. */
const pile = (x: number, y: number, colour: string, n = 9): string =>
  Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 4)
    return `<circle cx="${x + (i % 4) * 17 + row * 8}" cy="${y - row * 12}" r="${9 - row}" fill="${colour}" opacity="${0.95 - row * 0.12}"/>`
  }).join('')

/** A haze of light: what a lamp or the sun does to the air in front of it. */
const bloom = (x: number, y: number, r: number, colour: string, opacity = 0.7): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" opacity="${opacity}"/>`

const FILE_IMAGES: Record<string, PhotoFixture> = {
  'nishiki-market': {
    // What people photograph for later is rarely the market itself; it is the
    // map with the market pinned on it.
    ext: 'jpg',
    layers: [
      {
        svg: `<defs>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#1b2430" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="#f4f1ea"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => [0, 1, 2, 3, 4].map(k => `<rect x="${40 + i * 190}" y="${40 + k * 180}" width="150" height="130" rx="4" fill="#e9e4d8"/>`).join('')).join('\n  ')}
  <path d="M1360 0 C1400 220 1330 420 1390 620 C1430 760 1380 840 1400 900 L1600 900 L1600 0 Z" fill="#a9cde6"/>
  <path d="M1360 0 C1400 220 1330 420 1390 620 C1430 760 1380 840 1400 900" stroke="#8fb9d6" stroke-width="4" fill="none"/>
  <rect x="150" y="560" width="300" height="230" rx="18" fill="#cfe6c0"/>
  <rect x="980" y="120" width="250" height="190" rx="18" fill="#cfe6c0"/>
  ${[0, 1, 2, 3, 4].map(k => `<path d="M0 ${20 + k * 180} H1600" stroke="#ded8cb" stroke-width="26"/>`).join('\n  ')}
  ${[0, 1, 2, 3, 4].map(k => `<path d="M0 ${20 + k * 180} H1600" stroke="#ffffff" stroke-width="18"/>`).join('\n  ')}
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${20 + i * 190} 0 V900" stroke="#ded8cb" stroke-width="22"/>`).join('\n  ')}
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${20 + i * 190} 0 V900" stroke="#ffffff" stroke-width="15"/>`).join('\n  ')}
  <path d="M0 560 H1600" stroke="#e8cf92" stroke-width="34"/>
  <path d="M0 560 H1600" stroke="#fbe9b6" stroke-width="26"/>
  <path d="M780 0 V900" stroke="#e8cf92" stroke-width="30"/>
  <path d="M780 0 V900" stroke="#fbe9b6" stroke-width="22"/>
  <path d="M0 740 H1330" stroke="#c9c3b4" stroke-width="7"/>
  <path d="M0 740 H1330" stroke="#ffffff" stroke-width="5" stroke-dasharray="16 16"/>
  <path d="M120 380 H1240" stroke="#e7e1d4" stroke-width="30"/>
  <path d="M120 380 H1240" stroke="#ffffff" stroke-width="23"/>
  <path d="M120 380 H1240" stroke="#f0d6c8" stroke-width="9" stroke-dasharray="2 14" stroke-linecap="round"/>
  <text x="150" y="372" font-family="Arial, sans-serif" font-size="19" fill="#8b8676">Nishiki-koji Street</text>
  <text x="820" y="552" font-family="Arial, sans-serif" font-size="21" fill="#8b8676">Shijo-dori</text>
  <text x="1420" y="300" font-family="Arial, sans-serif" font-size="21" fill="#5b8fb0">Kamo River</text>
  <text x="196" y="700" font-family="Arial, sans-serif" font-size="20" fill="#6f8b62">Shinsen-en</text>
  <text x="1018" y="240" font-family="Arial, sans-serif" font-size="20" fill="#6f8b62">Gosho Park</text>
  <text x="640" y="838" font-family="Arial, sans-serif" font-size="22" fill="#9b968a">NAKAGYO</text>
  ${[[300, 300], [1080, 470], [560, 690], [1180, 660]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#c9723b"/>`).join('\n  ')}
  <g filter="url(#drop)">
    <path d="M700 430 C700 388 734 356 776 356 C818 356 852 388 852 430 C852 482 776 540 776 540 C776 540 700 482 700 430 Z" fill="#d93025"/>
    <circle cx="776" cy="428" r="24" fill="#ffffff"/>
  </g>
  <g filter="url(#drop)">
    <rect x="606" y="252" width="342" height="86" rx="14" fill="#ffffff"/>
    <text x="628" y="290" font-family="Arial, sans-serif" font-size="25" font-weight="bold" fill="#1b2430">Nishiki Market</text>
    <text x="628" y="320" font-family="Arial, sans-serif" font-size="20" fill="#7a7566">4.4 (12,806) · Market</text>
  </g>
  <g filter="url(#drop)">
    <rect x="44" y="40" width="470" height="66" rx="33" fill="#ffffff"/>
    <circle cx="86" cy="73" r="13" fill="none" stroke="#7a7566" stroke-width="4"/>
    <path d="M96 83 L108 95" stroke="#7a7566" stroke-width="4" stroke-linecap="round"/>
    <text x="122" y="82" font-family="Arial, sans-serif" font-size="23" fill="#3c4450">Nishiki Market, Kyoto</text>
  </g>
  <g filter="url(#drop)">
    <rect x="1494" y="40" width="62" height="124" rx="12" fill="#ffffff"/>
    <path d="M1512 82 H1538 M1525 69 V95" stroke="#3c4450" stroke-width="5" stroke-linecap="round"/>
    <path d="M1494 102 H1556" stroke="#e6e2d8" stroke-width="2"/>
    <path d="M1512 132 H1538" stroke="#3c4450" stroke-width="5" stroke-linecap="round"/>
  </g>
  <path d="M44 860 V876 H204 V860" stroke="#5b6472" stroke-width="3" fill="none"/>
  <text x="212" y="878" font-family="Arial, sans-serif" font-size="19" fill="#5b6472">200 m</text>
  <text x="1556" y="878" text-anchor="end" font-family="Arial, sans-serif" font-size="17" fill="#6d7686">Map data © OpenStreetMap contributors</text>
  ${grain(6.2, 200)}`,
      },
    ],
  },
  'hakone-ryokan': {
    // The confirmation as it looked in the browser, saved to the trip.
    ext: 'jpg',
    layers: [
      {
        svg: `<defs>
    <filter id="card" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="#eef0f3"/>
  <rect width="1600" height="64" fill="#e3e6ea"/>
  <circle cx="44" cy="32" r="9" fill="#ed6a5e"/><circle cx="76" cy="32" r="9" fill="#f4bf4f"/><circle cx="108" cy="32" r="9" fill="#61c554"/>
  <rect x="150" y="14" width="740" height="36" rx="18" fill="#ffffff"/>
  <path d="M176 32 a7 7 0 0 1 14 0 v6 h-14 z" fill="none" stroke="#7b8494" stroke-width="3"/>
  <text x="204" y="39" font-family="Arial, sans-serif" font-size="19" fill="#5b6472">hakone-ginyu.jp/reservations/RY-4471</text>
  <rect y="64" width="1600" height="836" fill="#ffffff"/>
  <text x="80" y="150" font-family="Georgia, serif" font-size="40" fill="#16202c">Hakone Ginyu</text>
  <text x="80" y="186" font-family="Arial, sans-serif" font-size="21" fill="#6b7482">Ryokan · Miyanoshita, Hakone-machi, Kanagawa</text>
  <rect x="1180" y="112" width="200" height="46" rx="23" fill="#e6f4ea"/>
  <path d="M1206 135 l10 11 l20 -22" stroke="#137333" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="1246" y="143" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#137333">Confirmed</text>
  <path d="M80 224 H1520" stroke="#e5e8ec" stroke-width="2"/>
  <text x="80" y="268" font-family="Arial, sans-serif" font-size="18" fill="#8b93a1">CONFIRMATION</text>
  <text x="80" y="300" font-family="Arial, sans-serif" font-size="27" font-weight="bold" fill="#16202c">RY-4471</text>
  ${[['Check-in', `${short(-4)}, from 15:00`], ['Check-out', `${short(-2)}, until 11:00`], ['Guests', '2 adults, one room'], ['Room', 'Japanese suite with open-air bath'], ['Meals', 'Kaiseki dinner and breakfast included']].map(([k, v], i) => `<g>
    <text x="80" y="${376 + i * 82}" font-family="Arial, sans-serif" font-size="18" fill="#8b93a1">${k.toUpperCase()}</text>
    <text x="80" y="${408 + i * 82}" font-family="Arial, sans-serif" font-size="25" fill="#16202c">${v}</text>
    <path d="M80 ${430 + i * 82} H880" stroke="#eef0f3" stroke-width="2"/>
  </g>`).join('\n  ')}
  <text x="80" y="824" font-family="Arial, sans-serif" font-size="18" fill="#8b93a1">TOTAL, PAID BY CARD</text>
  <text x="80" y="860" font-family="Arial, sans-serif" font-size="31" font-weight="bold" fill="#16202c">JPY 96,000</text>
  <g filter="url(#card)">
    <rect x="960" y="256" width="560" height="380" rx="16" fill="#ffffff"/>
    <rect x="960" y="256" width="560" height="220" rx="16" fill="#e8eadf"/>
    <rect x="960" y="400" width="560" height="76" fill="#e8eadf"/>
    <path d="M960 380 C1080 356 1180 400 1290 372 C1390 348 1460 380 1520 366" stroke="#a9cde6" stroke-width="26" fill="none"/>
    <rect x="1010" y="300" width="120" height="70" rx="6" fill="#dfe3d4"/>
    <rect x="1180" y="284" width="150" height="60" rx="6" fill="#dfe3d4"/>
    <path d="M960 340 H1520" stroke="#ffffff" stroke-width="10"/>
    <path d="M1120 256 V476" stroke="#ffffff" stroke-width="8"/>
    <path d="M1216 336 C1216 320 1229 308 1245 308 C1261 308 1274 320 1274 336 C1274 356 1245 378 1245 378 C1245 378 1216 356 1216 336 Z" fill="#d93025"/>
    <circle cx="1245" cy="335" r="9" fill="#ffffff"/>
    <text x="992" y="528" font-family="Arial, sans-serif" font-size="18" fill="#8b93a1">ADDRESS</text>
    <text x="992" y="560" font-family="Arial, sans-serif" font-size="22" fill="#16202c">100-1 Miyanoshita, Hakone-machi</text>
    <text x="992" y="592" font-family="Arial, sans-serif" font-size="22" fill="#16202c">Ashigarashimo, Kanagawa 250-0404</text>
  </g>
  <rect x="960" y="672" width="560" height="188" rx="16" fill="#f5f6f8"/>
  <text x="992" y="716" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#16202c">Cancellation</text>
  <text x="992" y="754" font-family="Arial, sans-serif" font-size="20" fill="#5b6472">Free until seven days before arrival.</text>
  <text x="992" y="788" font-family="Arial, sans-serif" font-size="20" fill="#5b6472">After that, one night is charged.</text>
  <text x="992" y="828" font-family="Arial, sans-serif" font-size="19" fill="#8b93a1">Questions: +81 460 82 3355</text>
  ${grain(9.4, 160)}`,
      },
    ],
  },
  'jr-pass-map': {
    ext: 'png',
    layers: [
      {
        // A printed network map: paper, its fold and the grid under the lines.
        svg: `<defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fcfaf4"/><stop offset="0.5" stop-color="#f3f0e6"/><stop offset="1" stop-color="#e9e5d8"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#paper)"/>
  <g opacity="0.45">
    ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${100 * i + 50} H1600" stroke="#dbd5c4" stroke-width="1"/>`).join('\n    ')}
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${100 * i + 50} 0 V900" stroke="#dbd5c4" stroke-width="1"/>`).join('\n    ')}
  </g>
  <path d="M800 0 V900" stroke="#cfc9b6" stroke-width="3" opacity="0.5"/>
  <path d="M0 450 H1600" stroke="#cfc9b6" stroke-width="3" opacity="0.35"/>
  <path d="M120 760 Q300 760 420 690 L640 560 Q760 490 900 490 L1300 490 Q1400 490 1470 420" stroke="#bcd3c4" stroke-width="32" fill="none" stroke-linecap="round"/>
  <path d="M120 760 Q300 760 420 690 L640 560 Q760 490 900 490 L1300 490 Q1400 490 1470 420" stroke="#1f6f3f" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M150 230 L600 230 Q700 230 760 290 L900 430 Q960 490 1060 490 L1460 490" stroke="#e7c8c2" stroke-width="32" fill="none" stroke-linecap="round"/>
  <path d="M150 230 L600 230 Q700 230 760 290 L900 430 Q960 490 1060 490 L1460 490" stroke="#c0392b" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M330 862 L980 862" stroke="#c8b78e" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="3 20"/>
  ${[[120, 760, 'Hakata'], [420, 690, 'Hiroshima'], [640, 560, 'Osaka'], [900, 490, 'Kyoto'], [1300, 490, 'Nagoya'], [1470, 420, 'Tokyo'], [150, 230, 'Kanazawa'], [600, 230, 'Toyama'], [1060, 490, 'Gifu']].map(([x, y, name]) =>
    `<g><circle cx="${x}" cy="${y}" r="14" fill="#ffffff" stroke="#2c3e50" stroke-width="6"/><text x="${x}" y="${(y as number) - 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#3d4756">${name}</text></g>`).join('\n  ')}
  <g>
    <rect x="70" y="60" width="440" height="126" rx="14" fill="#ffffff" opacity="0.93"/>
    <text x="100" y="112" font-family="Arial, sans-serif" font-size="33" font-weight="bold" fill="#22303f">Rail pass network</text>
    <rect x="100" y="134" width="34" height="8" rx="4" fill="#1f6f3f"/><text x="146" y="144" font-family="Arial, sans-serif" font-size="21" fill="#4a5568">Sanyo line</text>
    <rect x="292" y="134" width="34" height="8" rx="4" fill="#c0392b"/><text x="338" y="144" font-family="Arial, sans-serif" font-size="21" fill="#4a5568">Hokuriku</text>
  </g>
  ${grain(5.5, 260)}`,
      },
    ],
  },
  arashiyama: {
    ext: 'jpg',
    layers: [
      {
        // The grove behind the path: light coming down through it, nothing in focus.
        blur: 24,
        svg: `<defs>
    <linearGradient id="canopy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8f3c2"/><stop offset="0.3" stop-color="#8cb857"/><stop offset="1" stop-color="#1e3d1d"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#canopy)"/>
  ${bloom(780, 90, 460, '#fbffd8', 0.55)}
  ${Array.from({ length: 26 }, (_, i) => {
    const x = -30 + i * 64
    const tilt = ((i % 5) - 2) * 9
    return `<path d="M${x} 900 L${x + tilt} 0 L${x + tilt + 26} 0 L${x + 26} 900 Z" fill="${['#33602d', '#487f37', '#5e9d45'][i % 3]}" opacity="0.9"/>`
  }).join('\n  ')}`,
      },
      {
        // The stems either side of the path, just off the focal plane.
        blur: 4,
        svg: `${Array.from({ length: 9 }, (_, i) => {
          const x = i < 5 ? 20 + i * 120 : 1000 + (i - 5) * 130
          const w = 42 + (i % 3) * 12
          const tilt = ((i % 4) - 1.5) * 12
          return `<g>
    <path d="M${x} 900 L${x + tilt} -40 L${x + tilt + w} -40 L${x + w} 900 Z" fill="${i % 2 ? '#3f7333' : '#557f38'}"/>
    ${Array.from({ length: 6 }, (_, k) => `<rect x="${x + tilt * (1 - k / 6) - 2}" y="${90 + k * 150}" width="${w + 4}" height="9" rx="4" fill="#24451f" opacity="0.55"/>`).join('')}
    <path d="M${x + w - 8} 900 L${x + tilt + w - 8} -40 L${x + tilt + w} -40 L${x + w} 900 Z" fill="#d7e9a8" opacity="0.35"/>
  </g>`
        }).join('\n  ')}`,
      },
      {
        // The path itself, in focus, with the fence along it and the dapple of
        // light that falls between the stems.
        svg: `<path d="M0 806 Q420 748 820 782 Q1220 816 1600 764 V900 H0 Z" fill="#6a583a"/>
  <path d="M0 826 Q420 768 820 802 Q1220 836 1600 784 V900 H0 Z" fill="#4c3d27"/>
  <path d="M0 812 Q420 754 820 788 Q1220 822 1600 770" stroke="#8d7850" stroke-width="5" fill="none" opacity="0.6"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<g opacity="0.85">
    <rect x="${-10 + i * 210}" y="700" width="14" height="120" rx="6" fill="#7a6540"/>
    <rect x="${-10 + i * 210}" y="726" width="200" height="10" rx="5" fill="#8b7549"/>
  </g>`).join('\n  ')}
  ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<ellipse cx="${90 + i * 210}" cy="${840 + (i % 3) * 16}" rx="${60 + (i % 3) * 30}" ry="${9 + (i % 2) * 5}" fill="#fdf6c8" opacity="0.05" transform="rotate(${-4 + (i % 3) * 4} ${90 + i * 210} ${840 + (i % 3) * 16})"/>`).join('\n  ')}
  ${grain(2.4, 420)}
  <rect width="1600" height="900" fill="url(#vig3)"/>
  <defs><radialGradient id="vig3" cx="0.5" cy="0.4" r="0.8">
    <stop offset="0.5" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
  </radialGradient></defs>
  ${grain(11.3)}`,
      },
    ],
  },
}

/** The two plain-text documents; written out rather than drawn. */
const FILE_TEXTS = {
  'travel-notes.md': `# Travel notes

What the rail passes cover, and what they do not.

- Activate the Japan Rail Pass at the counter in the arrivals hall, not before
- Reserve the Nozomi seats a day ahead; the pass does not cover Nozomi itself
- Keep the paper voucher, the gates do not read the app

## Legs

| Leg | Train | Time |
| --- | --- | --- |
| Tokyo to Kyoto | Nozomi 21 | 2h15 |
| Kyoto to Osaka | Local | 0h30 |

## Left to book

1. The bus up to Arashiyama
2. A table at Nishiki for the last evening
`,
  'tokyo-metro-lines.csv': `line,colour,from,to,transfers
Ginza,orange,Asakusa,Shibuya,9
Marunouchi,red,Ogikubo,Ikebukuro,11
Hibiya,grey,Naka-Meguro,Kita-Senju,8
Oedo,magenta,Hikarigaoka,Tochomae,12
Yamanote,green,Tokyo,Tokyo,29
`,
} as const

/** The note the seed writes; its attachment is what puts the Collab Notes tab on the screen. */
const COLLAB_NOTE = 'Rail passes'
const COLLAB_ATTACHMENT = 'jr-pass-map.png'
/** Uploaded and then thrown away, so the trash is never empty and Empty Trash is always there. */
const TRASHED = { name: 'hakone-ryokan-confirmation.pdf', description: '2 nights, kaiseki at 18:30' }

/**
 * The documents of the trip, in the order they are uploaded: the list is sorted
 * newest first, so the last one here stands at the top of the screen.
 *
 * `travel-notes.md` goes up as `application/octet-stream` on purpose. The
 * Documents tab counts by file name (`.doc`, `.xls`, `.txt`, `.csv`) but filters
 * by MIME type (`word`, `excel`, `text`), so a markdown file sent as `text/*`
 * would be listed under a badge that says 0. As an octet-stream it is on neither
 * side of that split, and the preview finds it by its extension anyway.
 */
const TRIP_DOCUMENTS: { name: string; mimeType: string; from: () => string | Promise<string>; place?: string }[] = [
  { name: 'JR-Pass-voucher.pdf', mimeType: 'application/pdf', from: () => filesPdfFixture('JR-Pass-voucher') },
  { name: 'LH716-boarding-pass.pdf', mimeType: 'application/pdf', from: () => filesPdfFixture('LH716-boarding-pass') },
  { name: 'old-draft-itinerary.pdf', mimeType: 'application/pdf', from: () => filesPdfFixture('old-draft-itinerary') },
  { name: 'tokyo-metro-lines.csv', mimeType: 'text/csv', from: () => filesTextFixture('tokyo-metro-lines.csv') },
  { name: 'travel-notes.md', mimeType: 'application/octet-stream', from: () => filesTextFixture('travel-notes.md') },
  { name: 'hakone-ryokan.jpg', mimeType: 'image/jpeg', from: () => filesImageFixture('hakone-ryokan') },
  { name: 'nishiki-market.jpg', mimeType: 'image/jpeg', from: () => filesImageFixture('nishiki-market'), place: 'Nishiki Market' },
]

const tmpDir = (): string => {
  const dir = path.join(process.cwd(), 'e2e', '.tmp')
  mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * A one-page PDF, written by hand because no PDF library is a dependency here.
 * Five objects and an xref table whose offsets are counted off the assembled
 * buffer; everything in it is ASCII, so bytes and characters are the same thing.
 * Exported for the document-sync guide, which puts two of these into the store
 * (`external.ts`) rather than into the trip.
 */
export interface PdfDoc {
  /** The company or office the paper comes from, printed in the band at the top. */
  issuer: string
  /** What the document is, under the issuer. */
  title: string
  /** The line under the title: a booking code, an order number. */
  reference: string
  /** The body: a label and its value per row, the way a confirmation prints them. */
  fields: readonly (readonly [string, string])[]
  /** The small print along the bottom. */
  footer: string
}

export function drawPdf(doc: PdfDoc): Buffer {
  const esc = (v: string) => v.replace(/([\\()])/g, '\\$1')
  // A4 in points, the origin at the bottom left. The band is drawn first, then
  // the type over it; everything is Helvetica, which every PDF reader has.
  const W = 595
  const ink = '0.07 0.09 0.15'
  const parts: string[] = [
    `${ink} rg 0 762 ${W} 80 re f`,
    `BT /F2 17 Tf 1 1 1 rg 56 806 Td (${esc(doc.issuer.toUpperCase())}) Tj ET`,
    `BT /F1 10 Tf 0.75 0.78 0.85 rg 56 786 Td (${esc(doc.footer)}) Tj ET`,
    `BT /F2 21 Tf 0.07 0.09 0.15 rg 56 706 Td (${esc(doc.title)}) Tj ET`,
    `BT /F1 11 Tf 0.35 0.38 0.45 rg 56 684 Td (${esc(doc.reference)}) Tj ET`,
    `0.85 0.86 0.9 RG 1 w 56 668 m ${W - 56} 668 l S`,
  ]
  doc.fields.forEach(([label, value], i) => {
    const y = 636 - i * 34
    parts.push(`BT /F1 9 Tf 0.45 0.48 0.55 rg 56 ${y + 14} Td (${esc(label.toUpperCase())}) Tj ET`)
    parts.push(`BT /F2 13 Tf 0.07 0.09 0.15 rg 56 ${y} Td (${esc(value)}) Tj ET`)
    parts.push(`0.92 0.93 0.95 RG 0.6 w 56 ${y - 12} m ${W - 56} ${y - 12} l S`)
  })
  const bottom = 636 - doc.fields.length * 34 - 40
  parts.push(`0.96 0.97 0.98 rg 56 ${bottom - 46} ${W - 112} 58 re f`)
  parts.push(`BT /F1 10 Tf 0.35 0.38 0.45 rg 72 ${bottom - 12} Td (${esc(doc.footer)}) Tj ET`)
  parts.push(`BT /F1 9 Tf 0.55 0.58 0.65 rg 72 ${bottom - 30} Td (${esc('This document was issued electronically and needs no signature.')}) Tj ET`)
  const content = parts.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const startxref = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  return Buffer.from(pdf, 'latin1')
}

/**
 * One of the trip's PDFs as a file in `e2e/.tmp`. Drawn on every call: the
 * boarding pass names its day, which is relative to the picture day, so a
 * file left over from an earlier run would carry that run's date.
 */
export function filesPdfFixture(id: keyof typeof FILE_PDFS): string {
  const file = path.join(tmpDir(), `${id}.pdf`)
  writeFileSync(file, drawPdf(FILE_PDFS[id]))
  return file
}

/** A 1600×900 picture, its layers blurred to their own degree and laid over each other. */
export async function filesImageFixture(id: keyof typeof FILE_IMAGES): Promise<string> {
  const { ext, layers } = FILE_IMAGES[id]
  const file = path.join(tmpDir(), `${id}.${ext}`)
  if (existsSync(file)) return file
  const render = async (layer: PhotoLayer): Promise<Buffer> => {
    const document = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">\n  ${layer.svg}\n</svg>`
    const drawn = sharp(Buffer.from(document))
    return (layer.blur ? drawn.blur(layer.blur) : drawn).png().toBuffer()
  }
  const [base, ...rest] = await Promise.all(layers.map(render))
  const composed = sharp(base).composite(rest.map(input => ({ input })))
  await (ext === 'png' ? composed.png() : composed.jpeg({ quality: 88 })).toFile(file)
  return file
}

/** The markdown and the CSV, written out on first use. */
export function filesTextFixture(id: keyof typeof FILE_TEXTS): string {
  const file = path.join(tmpDir(), id)
  if (existsSync(file)) return file
  writeFileSync(file, FILE_TEXTS[id])
  return file
}

async function uploadTripFile(
  api: APIRequestContext,
  tripId: number,
  doc: { name: string; mimeType: string; from: () => string | Promise<string> },
  fields: Record<string, string> = {},
): Promise<number> {
  const res = await api.post(`/api/trips/${tripId}/files`, {
    multipart: {
      file: { name: doc.name, mimeType: doc.mimeType, buffer: readFileSync(await doc.from()) },
      ...fields,
    },
  })
  if (!res.ok()) throw new Error(`could not upload "${doc.name}": ${res.status()} ${await res.text()}`)
  const { file } = (await res.json()) as { file: { id: number } }
  return file.id
}

export async function ensureFilesFixtures(api: APIRequestContext): Promise<void> {
  // The Assign File dialog only shows a Booking section beside Transport once
  // the trip has a reservation that is not a transport, and the day fixtures
  // make one. Their hotel also gives the dialog a place under Unassigned.
  await ensureDaysFixtures(api)

  const { tripId } = seededTrip()
  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])

  const namesIn = async (trash: boolean): Promise<string[]> => {
    const res = await api.get(`/api/trips/${tripId}/files${trash ? '?trash=true' : ''}`)
    const body = (await res.json()) as { files?: { original_name: string }[] }
    return (body.files ?? []).map(f => f.original_name)
  }
  // Both lists, so a document the fixture threw away is not uploaded a second time.
  const present = new Set([...(await namesIn(false)), ...(await namesIn(true))])

  for (const doc of TRIP_DOCUMENTS) {
    if (present.has(doc.name)) continue
    const placeId = doc.place ? places.find(p => p.name === doc.place)?.id : undefined
    await uploadTripFile(api, tripId, doc, placeId ? { place_id: String(placeId) } : {})
  }

  // The Collab Notes tab and the "From Collab Notes" badge exist only while a
  // note carries an attachment. It is an ordinary trip file with a note on it,
  // so it shows up in this list too.
  if (!present.has(COLLAB_ATTACHMENT)) {
    const notesRes = await api.get(`/api/trips/${tripId}/collab/notes`)
    const { notes = [] } = (await notesRes.json()) as { notes?: { id: number; title: string }[] }
    const note = notes.find(n => n.title === COLLAB_NOTE)
    if (!note) throw new Error(`fixture collab note "${COLLAB_NOTE}" is missing`)
    const attached = await api.post(`/api/trips/${tripId}/collab/notes/${note.id}/files`, {
      multipart: {
        file: { name: COLLAB_ATTACHMENT, mimeType: 'image/png', buffer: readFileSync(await filesImageFixture('jr-pass-map')) },
      },
    })
    if (!attached.ok()) throw new Error(`could not attach "${COLLAB_ATTACHMENT}": ${attached.status()} ${await attached.text()}`)
  }

  // One document in the trash from the start: without it the trash view is an
  // empty state and Empty Trash, which one step is a picture of, is not drawn.
  if (!present.has(TRASHED.name)) {
    const id = await uploadTripFile(
      api,
      tripId,
      { name: TRASHED.name, mimeType: 'application/pdf', from: () => filesPdfFixture('hakone-ryokan-confirmation') },
      { description: TRASHED.description },
    )
    const deleted = await api.delete(`/api/trips/${tripId}/files/${id}`)
    if (!deleted.ok()) throw new Error(`could not put "${TRASHED.name}" in the trash: ${deleted.status()} ${await deleted.text()}`)
  }
}

// ── Trip: collab ──────────────────────────────────────────────────────────────────

/**
 * Three links the trip runs on. The seed creates none, so without them the
 * Links panel is an empty state in the hero and in every Links picture.
 */
export const COLLAB_LINKS = [
  { title: 'Japan Rail Pass activation', url: 'https://www.japanrailpass.net/en/' },
  { title: 'teamLab Planets tickets', url: 'https://www.teamlab.art/e/planets/' },
  { title: 'Shared photo album', url: 'https://photos.example/autumn-in-japan' },
]

/**
 * A poll to spend. Closing one cannot be undone (there is no reopen route), so
 * the guide about closing must not be pointed at either of the seeded polls.
 * `ensureCollabFixtures` also casts one vote on it: a closed poll nobody voted
 * on has no winning option, and `isWinner` in `CollabPolls.tsx` needs a count
 * above zero before it tints one green, which is what the guide's text says.
 */
export const COLLAB_SPARE_POLL = {
  question: 'Rent a car for the Hakone leg?',
  options: ['Yes, a small one', 'No, trains only'],
  multiple: false,
}

/**
 * The two stops What's Next reads. Both places are already on the trip, so this
 * adds no row to the places column that the other trip screens photograph: it
 * only puts them on the last day as well. One carries a time, one stays untimed
 * and reads TBD, which is also the fallback when the run starts too late in the
 * evening for a time on today to still be ahead.
 */
export const WHATS_NEXT_STOPS = { timed: 'Nishiki Market', untimed: 'Fushimi Inari Taisha' }

/**
 * What the Collab guides need beyond the seed, which already holds the three
 * notes, the two polls and the seven message conversation. Safe to run again:
 * every collection is read first and only what is missing is written, except
 * the spare poll, which is always made fresh because closing it is final.
 */
export async function ensureCollabFixtures(api: APIRequestContext): Promise<void> {
  const { tripId, dayIds } = seededTrip()
  const collab = `/api/trips/${tripId}/collab`

  const linksRes = await api.get(`${collab}/links`)
  const { links } = (await linksRes.json()) as { links: { title: string }[] }
  for (const link of COLLAB_LINKS) {
    if (links.some(l => l.title === link.title)) continue
    const created = await api.post(`${collab}/links`, { data: link })
    if (!created.ok()) throw new Error(`could not add the link "${link.title}": ${created.status()} ${await created.text()}`)
  }

  // The spare poll is thrown away and made again rather than reused: closing is
  // irreversible, so one left behind by a run that stopped short would already
  // be closed and the guide could not close it. Fresh means open and unvoted.
  const pollsRes = await api.get(`${collab}/polls`)
  const { polls } = (await pollsRes.json()) as { polls: { id: number; question: string }[] }
  for (const old of polls.filter(p => p.question === COLLAB_SPARE_POLL.question)) {
    await api.delete(`${collab}/polls/${old.id}`)
  }
  const spareRes = await api.post(`${collab}/polls`, { data: COLLAB_SPARE_POLL })
  if (!spareRes.ok()) throw new Error(`could not create the spare poll: ${spareRes.status()} ${await spareRes.text()}`)
  const { poll: spare } = (await spareRes.json()) as { poll: { id: number } }
  // One vote on it, so the poll the close-poll guide closes has a winner to tint.
  const voted = await api.post(`${collab}/polls/${spare.id}/vote`, { data: { option_index: 0 } })
  if (!voted.ok()) throw new Error(`could not vote on the spare poll: ${voted.status()} ${await voted.text()}`)

  // What's Next lists a stop on a later day, or one on today whose start has not
  // passed yet. The trip's last day is the picture day by construction, so both
  // stops go there and the time is computed from the pinned clock.
  const lastDay = dayIds[dayIds.length - 1]
  const placesRes = await api.get(`/api/trips/${tripId}/places`)
  const placesBody = (await placesRes.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
  const places = Array.isArray(placesBody) ? placesBody : (placesBody.places ?? [])
  const dayRes = await api.get(`/api/trips/${tripId}/days/${lastDay}/assignments`)
  const { assignments } = (await dayRes.json()) as { assignments: { id: number; place_id: number }[] }

  const putOnLastDay = async (name: string): Promise<number> => {
    const place = places.find(p => p.name === name)
    if (!place) throw new Error(`fixture place "${name}" is not on the seeded trip`)
    const already = assignments.find(a => a.place_id === place.id)
    if (already) return already.id
    const created = await api.post(`/api/trips/${tripId}/days/${lastDay}/assignments`, { data: { place_id: place.id } })
    if (!created.ok()) throw new Error(`could not put "${name}" on the last day: ${created.status()} ${await created.text()}`)
    const { assignment } = (await created.json()) as { assignment: { id: number } }
    return assignment.id
  }

  const timedId = await putOnLastDay(WHATS_NEXT_STOPS.timed)
  await putOnLastDay(WHATS_NEXT_STOPS.untimed)

  const pad = (n: number): string => String(n).padStart(2, '0')
  const clock = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`
  // Timed against the day the pictures are taken on, not against the wall clock
  // of whoever is running this. What's Next only lists a stop whose start is
  // still ahead, and the browser's clock is pinned, so a time worked out from
  // the real hour is in the panel's past as often as not.
  const from = new Date(PICTURE_DAY.getTime() + 45 * 60_000)
  const until = new Date(PICTURE_DAY.getTime() + 165 * 60_000)
  const timed = await api.put(`/api/trips/${tripId}/assignments/${timedId}/time`, {
    data: { place_time: clock(from), end_time: clock(until) },
  })
  if (!timed.ok()) throw new Error(`could not time the What's Next stop: ${timed.status()} ${await timed.text()}`)
}

// ── Trip: road trip ───────────────────────────────────────────────────────────────

/**
 * The drive out of Tokyo. Every seeded day is a walk across one city, and a ten
 * kilometre leg has no alternatives worth offering, never runs a tank dry and
 * gives the corridor search almost nothing to find. Day 4 is empty in the seed,
 * so it gets a real one: about 95 km of Tomei expressway, which is long enough
 * for the router to have opinions about it and long enough to matter to a range.
 */
const ROADTRIP_DRIVE = [
  {
    name: 'Shinjuku Gyoen',
    lat: 35.6852,
    lng: 139.71,
    address: '11 Naitomachi, Shinjuku City, Tokyo',
    description: 'The garden the drive out of Tokyo starts from.',
  },
  {
    name: 'Hakone Shrine',
    lat: 35.2046,
    lng: 139.0256,
    address: '80-1 Motohakone, Hakone, Kanagawa',
    description: 'Torii standing in the water at the edge of Lake Ashi.',
  },
]

/**
 * What the road trip guides act on beyond the seed.
 *
 * Four things the seed does not have: the addon itself, which is off by default
 * and without which there is no mode switch, no rail and no /roadtrip route at
 * all; the drive above; a track and a day to fit it to, for the guide that
 * follows one; and the driving settings, so the card carries badges and the
 * rail has a point where the tank runs out.
 *
 * Deliberately NOT set here: the daily travel times. They force Connect the
 * days on, which routes the night between every pair of days and puts extra
 * rows and extra days into every other guide's pictures. `roadtrip-day-window`
 * sets them and clears them again itself.
 *
 * Everything is idempotent, and the guides call it again to undo what they
 * changed, so the preferences are written in full rather than only when absent.
 */
export async function ensureRoadtripFixtures(api: APIRequestContext): Promise<void> {
  const { tripId, dayIds } = seededTrip()

  // Instance-wide and admin-only; the seeded user is the admin. Every
  // /roadtrip route 404s without it, so this comes first.
  const addon = await api.put('/api/admin/addons/roadtrip', { data: { enabled: true } })
  if (!addon.ok()) throw new Error(`could not enable the Road trip addon: ${addon.status()} ${await addon.text()}`)

  const placesOf = async (): Promise<{ id: number; name: string }[]> => {
    const res = await api.get(`/api/trips/${tripId}/places`)
    const body = (await res.json()) as { places?: { id: number; name: string }[] } | { id: number; name: string }[]
    return Array.isArray(body) ? body : (body.places ?? [])
  }
  const pin = async (dayId: number, placeId: number): Promise<void> => {
    const res = await api.get(`/api/trips/${tripId}/days/${dayId}/assignments`)
    const body = (await res.json()) as { assignments?: { place_id: number }[] }
    if ((body.assignments ?? []).some(a => a.place_id === placeId)) return
    const created = await api.post(`/api/trips/${tripId}/days/${dayId}/assignments`, { data: { place_id: placeId } })
    if (!created.ok()) {
      throw new Error(`could not put place ${placeId} on day ${dayId}: ${created.status()} ${await created.text()}`)
    }
  }

  for (const place of ROADTRIP_DRIVE) {
    if ((await placesOf()).some(p => p.name === place.name)) continue
    const created = await api.post(`/api/trips/${tripId}/places`, { data: place })
    if (!created.ok()) throw new Error(`could not create "${place.name}": ${created.status()} ${await created.text()}`)
  }
  const places = await placesOf()
  // In this order: the drive runs out of the city, not into it.
  for (const place of ROADTRIP_DRIVE) {
    const found = places.find(p => p.name === place.name)
    if (!found) throw new Error(`fixture place "${place.name}" is missing`)
    await pin(dayIds[3], found.id)
  }

  // The loop, and the two stops the day is for, so the track reads as one along
  // this day rather than as one a long way off it.
  await ensureTrack(api, tripId, 'arashiyama-loop')
  const withTrack = await placesOf()
  for (const name of ['Togetsukyo Bridge', 'Okochi Sanso Villa']) {
    const found = withTrack.find(p => p.name === name)
    if (!found) throw new Error(`the imported track's waypoint "${name}" is missing`)
    await pin(dayIds[6], found.id)
  }

  const prefs = await api.put(`/api/trips/${tripId}/roadtrip/preferences`, {
    data: {
      roadtrip_vehicle: 'combustion',
      roadtrip_range_km: 70,
      roadtrip_fill_percent: 80,
      roadtrip_leg_minutes: 90,
      roadtrip_day_minutes: 240,
      roadtrip_day_start: '',
      roadtrip_day_end: '',
      roadtrip_day_end_mode: 'route',
    },
  })
  if (!prefs.ok()) throw new Error(`could not write the driving settings: ${prefs.status()} ${await prefs.text()}`)
}
