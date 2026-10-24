import path from 'node:path'
import type { APIRequestContext } from '@playwright/test'
import { at, day, ordinal, short } from '../dates'
import { setTripCover } from './photos'

/**
 * Demo data for the documentation screenshots.
 *
 * Seeded over the REST API (not the DB) so it exercises the same paths a real
 * user would and stays honest about validation. The session cookie comes from
 * the storageState that auth.setup.ts writes, so `page.request` is already
 * authenticated as the seeded admin.
 *
 * Design notes that matter for the screenshots:
 *  - The trip is in **JPY**, deliberately. A EUR trip hides the entire v3.4.0
 *    currency rework (per-trip currency, frozen FX rates, foreign-currency
 *    settle-up) — the reader would see nothing new.
 *  - Two extra members exist so splits, avatars and sharing tiers render with
 *    real names instead of a lonely single-user state.
 *  - Dates are relative to the run day (e2e/dates.ts): the trip ends today, so
 *    the running surfaces (boarding pass, What's Next, forecast, reminders) have
 *    something to show whenever the seed runs.
 */

const TRIP = {
  title: 'Autumn in Japan',
  description: 'Two weeks chasing momiji season from Tokyo down to Kyoto.',
  start_date: day(-9),
  end_date: day(0),
  currency: 'JPY',
  reminder_days: 3,
}

const MEMBERS = [
  { username: 'mira', email: 'mira@example.com', password: 'DemoSeed12345!', role: 'user' },
  { username: 'jonas', email: 'jonas@example.com', password: 'DemoSeed12345!', role: 'user' },
]

/** Real coordinates — the map surfaces are a big part of what we're capturing. */
const PLACES = [
  { name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, address: '2-3-1 Asakusa, Taito City, Tokyo',
    description: "Tokyo's oldest temple, approached through the Nakamise shopping street.",
    notes: 'Early is best: the gate is still empty and the light is softer.',
    duration_minutes: 90, price: 0, currency: 'JPY', day: 0, start: '09:30', end: '11:00', category: 'Attraction' },
  { name: 'teamLab Planets', lat: 35.6486, lng: 139.7900, address: '6-1-16 Toyosu, Koto City, Tokyo',
    description: 'Immersive digital art museum you walk through barefoot.',
    notes: 'Timed entry, book at least a week ahead.',
    duration_minutes: 120, price: 3800, currency: 'JPY', day: 0, start: '14:00', end: '16:00', category: 'Activity' },
  { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7005, address: 'Shibuya City, Tokyo',
    description: 'The scramble. Best viewed from the Shibuya Sky observation deck.',
    duration_minutes: 45, price: 0, currency: 'JPY', day: 1, start: '18:30', end: '19:15', category: 'Attraction' },
  { name: 'Meiji Jingu', lat: 35.6764, lng: 139.6993, address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo',
    description: 'Forest shrine in the middle of the city.',
    duration_minutes: 75, price: 0, currency: 'JPY', day: 1, start: '09:30', end: '10:45', category: 'Attraction' },
  { name: 'Fushimi Inari Taisha', lat: 34.9671, lng: 135.7727, address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
    description: 'Thousands of vermilion torii gates climbing Mount Inari.',
    notes: 'The crowds thin out after the first 20 minutes of climbing.',
    duration_minutes: 150, price: 0, currency: 'JPY', day: 4, start: '07:45', end: '10:15', category: 'Attraction' },
  { name: 'Arashiyama Bamboo Grove', lat: 35.0170, lng: 135.6716, address: 'Ukyo Ward, Kyoto',
    description: 'Bamboo path leading to the Okochi Sanso villa gardens.',
    duration_minutes: 60, price: 0, currency: 'JPY', day: 5, start: '08:00', end: '09:00', category: 'Nature' },
  { name: 'Nishiki Market', lat: 35.0050, lng: 135.7649, address: 'Nakagyo Ward, Kyoto',
    description: "Five covered blocks of food stalls, known as Kyoto's kitchen.",
    notes: 'Come hungry. Try the tamagoyaki.',
    duration_minutes: 90, price: 2500, currency: 'JPY', day: 5, start: '12:30', end: '14:00', category: 'Shopping' },
  { name: 'Lake Ashi', lat: 35.2009, lng: 139.0247, address: 'Motohakone, Hakone, Kanagawa',
    description: 'Pirate-ship ferry across the crater lake, Fuji in view on a clear morning.',
    duration_minutes: 60, price: 1200, currency: 'JPY', day: 2, start: '10:00', end: '11:00', category: 'Activity' },
  { name: 'Hakone Open-Air Museum', lat: 35.2446, lng: 139.0503, address: '1121 Ninotaira, Hakone, Kanagawa',
    description: 'Sculpture park on a hillside, with a Picasso pavilion and a foot bath.',
    duration_minutes: 150, price: 2000, currency: 'JPY', day: 2, start: '13:00', end: '15:30', category: 'Attraction' },
  { name: 'Owakudani', lat: 35.2440, lng: 139.0196, address: 'Sengokuhara, Hakone, Kanagawa',
    description: 'Volcanic valley with sulphur vents and the famous black eggs.',
    notes: 'Take the ropeway up, the bus back down.',
    duration_minutes: 90, price: 0, currency: 'JPY', day: 3, start: '09:00', end: '10:30', category: 'Nature' },
  { name: 'Todai-ji', lat: 34.6890, lng: 135.8398, address: '406-1 Zoshicho, Nara',
    description: 'The Great Buddha Hall, still one of the largest wooden buildings in the world.',
    duration_minutes: 90, price: 800, currency: 'JPY', day: 6, start: '09:30', end: '11:00', category: 'Attraction' },
  { name: 'Nara Park', lat: 34.6851, lng: 135.8430, address: 'Zoshicho, Nara',
    description: 'Open park with over a thousand free-roaming deer.',
    notes: 'Deer crackers are sold at the stands, 200 yen a bundle.',
    duration_minutes: 90, price: 0, currency: 'JPY', day: 6, start: '11:00', end: '12:30', category: 'Nature' },
  { name: 'Kinkaku-ji', lat: 35.0394, lng: 135.7292, address: '1 Kinkakujicho, Kita Ward, Kyoto',
    description: 'The Golden Pavilion, mirrored in its pond.',
    duration_minutes: 60, price: 500, currency: 'JPY', day: 7, start: '09:00', end: '10:00', category: 'Attraction' },
  { name: 'Ryoan-ji', lat: 35.0345, lng: 135.7185, address: '13 Ryoanji Goryonoshitacho, Ukyo Ward, Kyoto',
    description: 'The rock garden: fifteen stones, never all visible at once.',
    duration_minutes: 60, price: 600, currency: 'JPY', day: 7, start: '10:30', end: '11:30', category: 'Attraction' },
  { name: 'Hanamikoji Street', lat: 35.0027, lng: 135.7751, address: 'Gionmachi Minamigawa, Higashiyama Ward, Kyoto',
    description: 'Lantern-lit street of teahouses in Gion.',
    notes: 'Respect the no-photo signs on the private side streets.',
    duration_minutes: 90, price: 0, currency: 'JPY', day: 8, start: '18:00', end: '19:30', category: 'Attraction' },
]

/** Who paid, so the balances in Costs are not all one-sided. */
type Payer = 'admin' | 'mira' | 'jonas'

const EXPENSES: Array<{ name: string; category: string; total_price: number; currency: string; expense_date: string; note?: string; paidBy?: Payer }> = [
  { name: 'Flights FRA → HND', category: 'transport', total_price: 890, currency: 'EUR',
    expense_date: day(-9), note: 'Booked with miles, taxes only.' },
  { name: 'Ryokan in Hakone', category: 'accommodation', total_price: 48000, currency: 'JPY',
    expense_date: day(-6), note: '2 nights, kaiseki dinner included.' },
  { name: 'JR Pass (14 days)', category: 'transport', total_price: 80000, currency: 'JPY',
    expense_date: day(-9), note: 'Green car, activated on arrival.' },
  { name: 'teamLab Planets tickets', category: 'activities', total_price: 11400, currency: 'JPY',
    expense_date: day(-8) },
  { name: 'Dinner at Nishiki', category: 'food', total_price: 7200, currency: 'JPY',
    expense_date: day(-4), paidBy: 'mira' },
  { name: 'Shinkansen seat reservations', category: 'transport', total_price: 4320, currency: 'JPY',
    expense_date: day(-5), note: 'Covered by the JR Pass, only the reserved seats.', paidBy: 'jonas' },
  { name: 'Sushi breakfast at Tsukiji', category: 'food', total_price: 9600, currency: 'JPY',
    expense_date: day(-8), paidBy: 'jonas' },
  { name: 'Suica cards, three top-ups', category: 'transport', total_price: 9000, currency: 'JPY',
    expense_date: day(-8), paidBy: 'mira' },
  { name: 'Shibuya Sky tickets', category: 'activities', total_price: 6600, currency: 'JPY',
    expense_date: day(-8) },
  { name: 'Ramen in Shinjuku', category: 'food', total_price: 3450, currency: 'JPY',
    expense_date: day(-7), paidBy: 'jonas' },
  { name: 'Kaiseki dinner in Gion', category: 'food', total_price: 36000, currency: 'JPY',
    expense_date: day(-3), paidBy: 'mira' },
  { name: 'Matcha and wagashi souvenirs', category: 'shopping', total_price: 5400, currency: 'JPY',
    expense_date: day(-2), paidBy: 'jonas' },
  { name: 'Travel insurance', category: 'other', total_price: 74, currency: 'EUR',
    expense_date: day(-30), note: 'Group policy, two weeks.' },
]

/** Most of it packed already: the trip is running, the list is nearly done. */
const PACKING: Array<{ category: string; items: Array<string | [string, 'open']> }> = [
  { category: 'Documents', items: ['Passport', 'JR Pass voucher', 'Travel insurance', 'Printed hotel confirmations', 'Credit card and some yen'] },
  { category: 'Clothing', items: ['Rain jacket', 'Walking shoes', 'Light layers', 'Merino socks', 'Warm fleece for Hakone', ['Slip-on shoes for temples', 'open']] },
  { category: 'Electronics', items: ['Type-A adapter', 'Power bank', 'Camera', 'Spare SD card', ['eSIM activation code', 'open']] },
  { category: 'Toiletries', items: ['Toothbrush and paste', 'Sunscreen', 'Small towel for the onsen', ['Travel-size shampoo', 'open']] },
  { category: 'Health', items: ['Plasters', 'Ibuprofen', 'Hand sanitiser', 'Face masks'] },
  { category: 'Day bag', items: ['Water bottle', 'Coin purse', 'Folding umbrella', ['Goshuin book', 'open']] },
]

/** Chat lines the collab guides look for by their text. */
export const SEED_CHAT = {
  teamlab: `Booked the teamLab slot for the ${ordinal(-8)}, 14:00. Tickets are in the Files tab.`,
}

const TODOS: Array<{ name: string; category: string; due_date?: string; priority?: number; done?: boolean }> = [
  { name: 'Book teamLab Planets slot', category: 'Before departure', due_date: day(-37), priority: 2, done: true },
  { name: 'Activate JR Pass', category: 'On arrival', due_date: day(-9), priority: 1, done: true },
  { name: 'Reserve ryokan dinner', category: 'Before departure', due_date: day(-32), done: true },
  { name: 'Order yen at the bank', category: 'Before departure', due_date: day(-14), done: true },
  { name: 'Reserve Shinkansen seats on the Fuji side', category: 'On arrival', due_date: day(-6), priority: 2, done: true },
  { name: 'Send postcards home', category: 'During the trip', due_date: day(-1) },
  { name: 'Buy a goshuin book at Senso-ji', category: 'During the trip' },
]

export interface SeedResult {
  tripId: number
  memberIds: number[]
  dayIds: number[]
  placeIds: number[]
  collectionId?: number
  journeyId?: number
}

/** Throws with the response body on failure — a silent 4xx here would produce
 *  a screenshot of an empty screen, which is worse than a loud crash. */
async function call<T>(api: APIRequestContext, method: 'post' | 'put' | 'get' | 'patch',
                       path: string, body?: unknown): Promise<T> {
  const res = await api[method](path, body === undefined ? {} : { data: body })
  if (!res.ok()) {
    throw new Error(`${method.toUpperCase()} ${path} → ${res.status()}\n${await res.text()}`)
  }
  return (await res.json()) as T
}

export type ContextFactory = (token?: string) => Promise<APIRequestContext>

export async function seedDemoData(
  api: APIRequestContext,
  newContext?: ContextFactory,
): Promise<SeedResult> {
  // 1. Addons first — the Collections and Journey guards run ahead of auth, so
  //    every later call to those modules 403s until these are flipped.
  for (const id of ['collections', 'journey', 'packing', 'budget', 'atlas', 'vacay', 'mcp', 'documents', 'collab']) {
    await call(api, 'put', `/api/admin/addons/${id}`, { enabled: true })
  }
  await call(api, 'put', '/api/admin/bag-tracking', { enabled: true }).catch(() => {})

  // 1b. Units, pinned explicitly so the screenshots don't silently change meaning
  //     when a default does. They match the current defaults (ba3733da made
  //     celsius/metric/24h consistent across the store and the settings UI) —
  //     stating them here keeps the captures reproducible either way.
  await call(api, 'post', '/api/settings/bulk', {
    settings: { temperature_unit: 'celsius', distance_unit: 'metric' },
  })

  // 2. Extra members. Ignore 409 so a re-run against a warm DB still works.
  const memberIds: number[] = []
  for (const m of MEMBERS) {
    const res = await api.post('/api/admin/users', { data: m })
    if (res.ok()) {
      const { user } = (await res.json()) as { user: { id: number } }
      memberIds.push(user.id)
    } else if (res.status() !== 409) {
      throw new Error(`create user ${m.username} → ${res.status()}\n${await res.text()}`)
    }
  }

  // 3. The trip, in JPY.
  const { trip } = await call<{ trip: { id: number } }>(api, 'post', '/api/trips', TRIP)
  const tripId = trip.id
  await setTripCover(api, tripId, 'japan')

  for (const m of MEMBERS) {
    await call(api, 'post', `/api/trips/${tripId}/members`, { identifier: m.email }).catch(() => {})
  }

  // 4. Days are auto-generated by trip creation — read them back for assignment.
  const days = await call<Array<{ id: number }> | { days: Array<{ id: number }> }>(
    api, 'get', `/api/trips/${tripId}/days`)
  const dayIds = (Array.isArray(days) ? days : days.days).map(d => d.id)

  // 5. Places, then pin each onto its day.
  const categories = await call<{ categories: { id: number; name: string }[] }>(api, 'get', '/api/categories')
    .then(r => r.categories).catch(() => [] as { id: number; name: string }[])
  const placeIds: number[] = []
  for (const p of PLACES) {
    const { day, start, end, category, ...payload } = p
    const categoryId = categories.find(c => c.name === category)?.id
    const { place } = await call<{ place: { id: number } }>(
      api, 'post', `/api/trips/${tripId}/places`, categoryId ? { ...payload, category_id: categoryId } : payload)
    placeIds.push(place.id)
    const dayId = dayIds[day]
    if (dayId) {
      const created = await call<{ assignment: { id: number } }>(
        api, 'post', `/api/trips/${tripId}/days/${dayId}/assignments`, { place_id: place.id }).catch(() => null)
      // A day plan with times reads like a real one: the timeline, the gaps
      // and the order all come from them.
      if (created) {
        await call(api, 'put', `/api/trips/${tripId}/assignments/${created.assignment.id}/time`,
                   { place_time: start, end_time: end }).catch(() => {})
      }
    }
  }

  // 6. A day note, so the itinerary shows more than places.
  if (dayIds[0]) {
    await call(api, 'post', `/api/trips/${tripId}/days/${dayIds[0]}/notes`, {
      text: 'Pick up the JR Pass at the airport counter before taking the train in.',
      time: '08:15', icon: 'train',
    }).catch(() => {})
  }

  // 7. Costs. Split across everyone so the settle-up view has real balances.
  //    NOTE: never send exchange_rate — the server freezes the FX rate itself,
  //    and a hand-supplied one fights the settlement maths.
  const allMembers = [1, ...memberIds]
  const payerId = (who: Payer | undefined): number =>
    who === 'mira' ? (memberIds[0] ?? 1) : who === 'jonas' ? (memberIds[1] ?? 1) : 1
  for (const { paidBy, ...e } of EXPENSES) {
    await call(api, 'post', `/api/trips/${tripId}/budget`, {
      ...e,
      payers: [{ user_id: payerId(paidBy), amount: e.total_price }],
      member_ids: allMembers,
    }).catch(() => {})
  }

  // A foreign-currency settle-up payment — the v3.4.0 feature worth showing.
  if (memberIds[0]) {
    await call(api, 'post', `/api/trips/${tripId}/budget/settlements`, {
      from_user_id: memberIds[0], to_user_id: 1, amount: 120, currency: 'EUR',
    }).catch(() => {})
  }

  // 8. Packing — category is free text on the item, there is no category resource.
  for (const group of PACKING) {
    for (const entry of group.items) {
      const [name, state] = typeof entry === 'string' ? [entry, 'packed'] : entry
      const created = await call<{ item: { id: number } }>(api, 'post', `/api/trips/${tripId}/packing`, {
        name, category: group.category, visibility: 'common',
      }).catch(() => null)
      if (created && state === 'packed') {
        await call(api, 'put', `/api/trips/${tripId}/packing/${created.item.id}`, { checked: true }).catch(() => {})
      }
    }
  }

  for (const { done, ...todo } of TODOS) {
    const created = await call<{ item: { id: number } }>(api, 'post', `/api/trips/${tripId}/todo`, todo).catch(() => null)
    if (created && done) {
      await call(api, 'put', `/api/trips/${tripId}/todo/${created.item.id}`, { checked: true }).catch(() => {})
    }
  }

  // 9. A multi-leg flight. Coordinates are mandatory — endpoints without them
  //    are silently dropped by the server, leaving a booking with no route.
  await call(api, 'post', `/api/trips/${tripId}/reservations`, {
    title: 'LH716 FRA → HND',
    type: 'flight',
    reservation_time: at(-9, '13:05'),
    reservation_end_time: at(-8, '08:25'),
    confirmation_number: 'X7K2QP',
    status: 'confirmed',
    location: 'Frankfurt Airport',
    metadata: { airline: 'Lufthansa', flight_number: 'LH716',
                departure_airport: 'FRA', arrival_airport: 'HND' },
    endpoints: [
      { role: 'from', sequence: 0, name: 'Frankfurt Airport', code: 'FRA',
        lat: 50.0379, lng: 8.5622, timezone: 'Europe/Berlin',
        local_date: day(-9), local_time: '13:05' },
      { role: 'to', sequence: 1, name: 'Tokyo Haneda', code: 'HND',
        lat: 35.5494, lng: 139.7798, timezone: 'Asia/Tokyo',
        local_date: day(-8), local_time: '08:25' },
    ],
  }).catch(() => {})

  // 10. A collection, populated from the trip's own places.
  let collectionId: number | undefined
  try {
    const created = await call<{ id: number } | { collection: { id: number } }>(
      api, 'post', '/api/addons/collections',
      { name: 'Kyoto shortlist', description: 'Places we want to reach on the second week.',
        color: '#ef4444', icon: 'MapPin' })
    collectionId = 'id' in created ? created.id : created.collection.id
    for (const placeId of placeIds.slice(4, 7)) {
      await call(api, 'post', '/api/addons/collections/places/from-trip', {
        collection_id: collectionId, source_trip_id: tripId, source_place_id: placeId, force: true,
      }).catch(() => {})
    }
  } catch { /* collections addon unavailable — screenshots for it will be skipped */ }

  // 11. Journey. Entries are generated server-side from the trip, then filled in.
  let journeyId: number | undefined
  try {
    const j = await call<{ id: number } | { journey: { id: number } }>(
      api, 'post', '/api/journeys',
      { title: 'Autumn in Japan', subtitle: 'Momiji season, Tokyo to Kyoto', trip_ids: [tripId] })
    journeyId = 'id' in j ? j.id : j.journey.id
  } catch { /* journey addon unavailable */ }

  // 11b. Collab: chat, notes and polls.
  //
  //      Chat is only convincing with more than one voice, and every collab
  //      write is attributed to the acting user — so messages and votes are
  //      posted as the members themselves, via their own bearer tokens, not as
  //      the admin. A single-speaker chat log would misrepresent the feature.
  //      Each member gets its OWN request context. Logging in through the shared
  //      one would set the trek_session cookie on it, and extractToken()
  //      (server/src/middleware/auth.ts:9) reads the cookie BEFORE the
  //      Authorization header — so every later write, including the admin's,
  //      would silently be attributed to whoever logged in last.
  const members: Record<string, APIRequestContext> = {}
  for (const m of MEMBERS) {
    if (!newContext) break
    const anon = await newContext()
    const res = await anon.post('/api/auth/login', { data: { email: m.email, password: m.password } })
    if (!res.ok()) { await anon.dispose(); continue }
    const { token } = (await res.json()) as { token?: string }
    await anon.dispose()
    if (token) members[m.username] = await newContext(token)
  }
  /** The member's own context, or the admin's as a visible fallback. */
  const as = (username: string): APIRequestContext => members[username] ?? api

  const collab = `/api/trips/${tripId}/collab`

  for (const n of [
    { title: 'Rail passes', category: 'Transport', color: '#3b82f6',
      content: 'The 14-day JR Pass covers the Tokyo to Kyoto legs. Activate it at the airport counter on arrival, not before.' },
    { title: 'Ryokan etiquette', category: 'Accommodation', color: '#ef4444',
      content: 'Shoes off at the entrance, yukata for dinner. Dinner is served at 18:30 sharp, and being late is genuinely rude.' },
    { title: 'Rainy-day alternatives', category: 'Ideas', color: '#22c55e',
      content: 'teamLab Planets, the Kyoto Railway Museum and Nishiki Market all work in bad weather.' },
  ]) {
    await api.post(`${collab}/notes`, { data: n }).catch(() => {})
  }

  const pollRes = await api.post(`${collab}/polls`, {
    data: {
      question: 'Which day should we keep free for Nara?',
      options: [short(-5), short(-4), short(-2)],
      multiple: false,
    },
  })
  if (pollRes.ok()) {
    const { poll } = (await pollRes.json()) as { poll: { id: number | string } }
    await api.post(`${collab}/polls/${poll.id}/vote`, { data: { option_index: 1 } }).catch(() => {})
    await as('mira').post(`${collab}/polls/${poll.id}/vote`, { data: { option_index: 1 } }).catch(() => {})
    await as('jonas').post(`${collab}/polls/${poll.id}/vote`, { data: { option_index: 2 } }).catch(() => {})
  }
  await api.post(`${collab}/polls`, {
    data: { question: 'Ryokan or city hotel in Hakone?', options: ['Ryokan with onsen', 'City hotel'], multiple: false },
  }).catch(() => {})

  const conversation: Array<[string, string]> = [
    ['admin', `Flights are booked, we land at Haneda 08:25 on the ${ordinal(-8)}.`],
    ['mira', 'Nice. Should we go straight to the hotel or drop bags and head out?'],
    ['jonas', 'Drop bags. I want to be at Senso-ji before the crowds.'],
    ['admin', "Agreed. I've put it on day 1 with a note to go before 08:00."],
    ['mira', SEED_CHAT.teamlab],
    ['jonas', 'Do we need to reserve the ryokan dinner separately?'],
    ['admin', "It's included: kaiseki, 18:30. Added it to the to-dos so we don't forget to confirm."],
  ]
  for (const [who, text] of conversation) {
    const ctx = who === 'admin' ? api : as(who)
    await ctx.post(`${collab}/messages`, { data: { text } }).catch(() => {})
  }

  for (const ctx of Object.values(members)) await ctx.dispose()

  // 12. Plugins, installed from the community registry.
  //
  //     Registry install is the ONLY path that produces a representative
  //     screenshot. Dev-link and sideload both stamp the plugin card with a
  //     badge ("Dev-Link" / "Sideloaded", AdminPluginsPanel.tsx:307,361) that no
  //     ordinary install shows, and TREK_PLUGINS_DEV_LINK additionally reveals a
  //     "Link a local plugin" row in the panel. Documenting either would show
  //     readers a UI they will never have.
  //
  //     Needs network. If the registry is unreachable the plugin screenshots are
  //     skipped loudly rather than silently captured in a misleading state.
  for (const id of ['koffi', 'trip-doctor']) {
    const res = await api.post('/api/admin/plugins/install', { data: { id } })
    if (!res.ok()) {
      console.log(`PLUGIN INSTALL FAILED ${id} → ${res.status()} ${await res.text()}`)
      continue
    }
    await api.post(`/api/admin/plugins/${id}/activate`, { data: {} })
  }

  return { tripId, memberIds, dayIds, placeIds, collectionId, journeyId }
}
